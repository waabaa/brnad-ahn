#!/usr/bin/env python3
"""Self-host brand logos for the Brand Atlas static site.

Sources, in priority order, per brand:
  1. Existing local logo asset recorded in the SQLite DB (already downloaded).
  2. Wikidata P154 (logo image) -> Wikimedia Commons file, downloaded & self-hosted.
        - QIDs for the 499 canonical entities come straight from the DB (batched).
        - Remaining brands are resolved by a strict name search (label == name).
  3. Existing local hero/og image from the DB (used as a soft logo only if present).
  4. Otherwise: cleared, so the front-end renders a branded initials placeholder.

Anti-mismatch rules (the "Body Shop -> SEAT logo" class of bug):
  - P154 is authoritative; when present it overrides any pre-existing logo value.
  - A pre-existing *remote* logo with no P154 confirmation is kept only when the
    Commons filename shares a token with the brand name; otherwise it is dropped.

The script is resumable: per-brand outcomes are written to a manifest and reused
on the next run unless --reset is passed.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
DB_PATH = ROOT / "data" / "brand_data.sqlite"
LOGO_DIR = HANDOFF / "images" / "logos"
MANIFEST = ROOT / "scripts_py" / "logo_manifest.json"
REPORT = ROOT / "scripts_py" / "logo_report.json"

UA = {"User-Agent": "BrandAtlas/1.0 (brand wiki logo enrichment; admin@brand.resort.co.kr)"}
PLACEHOLDER = "brand_atlas_logo_mark"

IMAGE_MAGIC = {
    b"\x89PNG": "png",
    b"\xff\xd8\xff": "jpg",
    b"GIF8": "gif",
    b"RIFF": "webp",  # RIFF....WEBP
}


def log(msg: str) -> None:
    print(msg, flush=True)


def http_get(url: str, timeout: int = 25):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout)


def api_json(url: str, retries: int = 4) -> dict | None:
    """GET a Wikidata/Commons JSON endpoint with backoff on HTTP 429."""
    delay = 1.0
    for attempt in range(retries):
        try:
            return json.load(http_get(url))
        except urllib.error.HTTPError as e:  # type: ignore[attr-defined]
            if e.code == 429:
                time.sleep(delay)
                delay *= 2
                continue
            return None
        except Exception:
            time.sleep(delay)
            delay *= 1.5
    return None


def norm_tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9가-힣]+", str(text).lower()) if len(t) >= 2}


def detect_ext(blob: bytes, fallback_name: str = "") -> str | None:
    head = blob[:12]
    for magic, ext in IMAGE_MAGIC.items():
        if head.startswith(magic):
            if ext == "webp" and b"WEBP" not in head:
                continue
            return ext
    if head.lstrip().startswith(b"<?xml") or b"<svg" in blob[:600].lower():
        return "svg"
    # trust extension for svg served as text
    if fallback_name.lower().endswith(".svg"):
        return "svg"
    return None


def commons_filepath(filename: str, width: int = 512) -> str:
    quoted = urllib.parse.quote(filename.replace(" ", "_"))
    base = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}"
    # raster files get downscaled; SVG ignores width param and serves source
    return f"{base}?width={width}"


def download_logo(filename: str, slug: str) -> str | None:
    """Download a Commons file, validate it is an image, self-host it. Returns rel path."""
    url = commons_filepath(filename)
    try:
        resp = http_get(url)
        blob = resp.read()
    except Exception:
        return None
    if len(blob) < 512:
        return None
    ext = detect_ext(blob, filename)
    if not ext:
        return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    out = LOGO_DIR / f"{slug}.{ext}"
    out.write_bytes(blob)
    return f"images/logos/{slug}.{ext}"


def load_db_assets() -> tuple[dict, dict]:
    """Return (name->wikidata_id, name->{role->local_rel_path}) from the SQLite DB."""
    qid_map: dict[str, str] = {}
    asset_map: dict[str, dict[str, str]] = {}
    if not DB_PATH.exists():
        return qid_map, asset_map
    db = sqlite3.connect(str(DB_PATH))
    cur = db.cursor()
    cur.execute("select id, canonical_name, wikidata_id from brand_entities")
    id_to_name = {}
    for bid, name, wd in cur.fetchall():
        id_to_name[bid] = name
        if wd:
            qid_map[name] = wd
    cur.execute(
        "select brand_id, asset_role, local_path from brand_media_assets "
        "where asset_role in ('logo','og','hero','image','logo_history') and local_path is not null "
        "order by sort_order"
    )
    for bid, role, lp in cur.fetchall():
        name = id_to_name.get(bid)
        if not name:
            continue
        rel = lp.replace("\\", "/")
        if (HANDOFF / rel).exists():
            asset_map.setdefault(name, {}).setdefault(role, rel)
    db.close()
    return qid_map, asset_map


def batch_p154(qids: list[str]) -> dict[str, str | None]:
    """Resolve P154 logo filename for many QIDs using batched wbgetentities."""
    out: dict[str, str | None] = {}
    for i in range(0, len(qids), 50):
        chunk = qids[i : i + 50]
        url = (
            "https://www.wikidata.org/w/api.php?action=wbgetentities&ids="
            + "|".join(chunk)
            + "&props=claims&format=json"
        )
        data = api_json(url)
        time.sleep(0.4)
        ents = (data or {}).get("entities", {})
        for qid in chunk:
            claims = (ents.get(qid) or {}).get("claims", {})
            p154 = claims.get("P154")
            fname = None
            if p154:
                try:
                    fname = p154[0]["mainsnak"]["datavalue"]["value"]
                except (KeyError, IndexError, TypeError):
                    fname = None
            out[qid] = fname
        log(f"  P154 batch {i//50+1}: resolved {sum(1 for q in chunk if out.get(q))}/{len(chunk)}")
    return out


def search_qid(name_en: str, name_ko: str) -> str | None:
    """Strict name search: accept a hit only if its label matches the brand name."""
    for query, lang in [(name_en, "en"), (name_ko, "ko")]:
        if not query:
            continue
        url = (
            "https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
            + urllib.parse.quote(query)
            + f"&language={lang}&uselang={lang}&format=json&limit=5&type=item"
        )
        data = api_json(url)
        time.sleep(1.1)
        for hit in (data or {}).get("search", []):
            label = str(hit.get("label", "")).lower().strip()
            desc = str(hit.get("description", "")).lower()
            if label == query.lower().strip() and re.search(
                r"company|brand|manufacturer|retail|fashion|cosmetic|label|restaurant|chain|"
                r"기업|브랜드|회사|상표|제조|음료|식품", desc
            ):
                return hit.get("id")
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true", help="ignore existing manifest")
    ap.add_argument("--search-cap", type=int, default=600,
                    help="max live name-searches for non-entity brands")
    ap.add_argument("--no-write", action="store_true", help="do not write brand-atlas.json")
    args = ap.parse_args()

    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    brands = data["allBrands"]
    by_slug = {b["slug"]: b for b in brands}
    log(f"loaded {len(brands)} brands")

    manifest = {}
    if MANIFEST.exists() and not args.reset:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        log(f"resuming from manifest with {len(manifest)} prior outcomes")

    qid_map, asset_map = load_db_assets()
    log(f"DB: {len(qid_map)} QIDs, {len(asset_map)} brands with local assets")

    # Phase 1: resolve P154 for all DB-known QIDs in one batched pass.
    known_qid_brands = [(s, qid_map[b["name"]]) for s, b in by_slug.items() if b["name"] in qid_map]
    unique_qids = sorted({q for _, q in known_qid_brands})
    log(f"Phase 1: batch P154 for {len(unique_qids)} QIDs")
    p154_by_qid = batch_p154(unique_qids)

    stats = {"db_local": 0, "p154_entity": 0, "p154_search": 0, "kept_remote": 0,
             "soft_image": 0, "dropped_mismatch": 0, "placeholder": 0}

    searches_done = 0
    for slug, b in by_slug.items():
        if slug in manifest and not args.reset:
            res = manifest[slug]
            if res.get("logo"):
                b["logo"] = res["logo"]
            stats[res.get("source", "placeholder")] = stats.get(res.get("source", "placeholder"), 0) + 1
            continue

        name = b["name"]
        slug_assets = asset_map.get(name, {})
        existing = b.get("logo") or ""
        outcome = {"logo": "", "source": "placeholder"}

        # 1) Existing local DB logo file.
        if slug_assets.get("logo"):
            outcome = {"logo": slug_assets["logo"], "source": "db_local"}

        else:
            # 2) Wikidata P154 (authoritative).
            qid = qid_map.get(name)
            fname = p154_by_qid.get(qid) if qid else None
            if not fname and qid is None and searches_done < args.search_cap:
                # 2b) resolve a QID by strict name search for non-entity brands
                qid = search_qid(b.get("nameEn") or "", b.get("nameKo") or name)
                searches_done += 1
                if qid:
                    got = batch_p154([qid])
                    fname = got.get(qid)
            if fname:
                rel = download_logo(fname, slug)
                if rel:
                    src = "p154_entity" if name in qid_map else "p154_search"
                    outcome = {"logo": rel, "source": src}

            # 3) Pre-existing remote logo: keep only if filename relates to the brand.
            if not outcome["logo"] and existing.startswith("http"):
                fname_part = urllib.parse.unquote(existing.rsplit("/", 1)[-1])
                if norm_tokens(fname_part) & norm_tokens(f"{name} {b.get('nameEn','')}"):
                    rel = download_logo(fname_part, slug)
                    if rel:
                        outcome = {"logo": rel, "source": "kept_remote"}
                else:
                    outcome = {"logo": "", "source": "dropped_mismatch"}

            # 4) Soft fallback: a real local hero/og becomes the card image, not a logo.
            if not outcome["logo"] and (slug_assets.get("og") or slug_assets.get("hero")):
                outcome["source"] = "soft_image"

        b["logo"] = outcome["logo"]
        manifest[slug] = outcome
        stats[outcome["source"]] = stats.get(outcome["source"], 0) + 1

        done = len(manifest)
        if done % 25 == 0:
            MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
            log(f"  progress {done}/{len(brands)}  searches={searches_done}  stats={stats}")

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")

    # The data file keeps two brand arrays (`brands` for the magazine, `allBrands`
    # for the directory). findBrand() searches `brands` first, so logo values must
    # be mirrored there (and into the featured/card blocks) or stale logos resurface.
    logo_by_slug = {b["slug"]: b.get("logo", "") for b in brands}
    synced = 0
    for key in ("brands", "brandCards"):
        for b in data.get(key, []) or []:
            slug = b.get("slug")
            if slug in logo_by_slug and b.get("logo", "") != logo_by_slug[slug]:
                b["logo"] = logo_by_slug[slug]
                synced += 1
    fb = data.get("featuredBrand")
    if isinstance(fb, dict) and fb.get("slug") in logo_by_slug:
        fb["logo"] = logo_by_slug[fb["slug"]]
    log(f"synced logo into secondary arrays: {synced} entries")

    if not args.no_write:
        # Preserve the source file's pretty-printed (indent=2) layout so git diffs
        # stay reviewable instead of collapsing the whole file to one line.
        DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"wrote {DATA_JSON}")

    have_logo = sum(1 for b in brands if b.get("logo"))
    report = {"total": len(brands), "with_logo": have_logo, "stats": stats,
              "searches_done": searches_done}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"DONE: {have_logo}/{len(brands)} brands now have a logo")
    log(f"stats: {json.dumps(stats, ensure_ascii=False)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
