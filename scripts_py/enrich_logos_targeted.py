#!/usr/bin/env python3
"""Targeted, verified logo fetch for a hand-curated set of brands whose identity we
have already confirmed via web research. For each (slug, query, expect_tokens):
  1. Wikidata wbsearchentities(query) -> candidate QIDs.
  2. For each candidate, read label/description + P154 logo filename.
  3. Accept the first candidate whose P154 Commons filename shares a token with the
     expected name tokens (anti-mismatch guard, same class as enrich_logos.py).
  4. Download from Commons Special:FilePath, self-host to images/logos/<urlSlug>.<ext>.
  5. Set brand.logo in brand-atlas.json.
Prints every decision. Skips (does not guess) when no confident match is found.
Run:  python3 scripts_py/enrich_logos_targeted.py
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
LOGO_DIR = HANDOFF / "images" / "logos"
UA = {"User-Agent": "brand-atlas-logo-bot/1.0 (editorial reference; contact o2odev@o2o.kr)"}

# slug -> (search query, expected name tokens for the anti-mismatch guard)
TARGETS = {
    "brandarchive-elf":              ("Elf Aquitaine", {"elf", "aquitaine"}),
    "brandarchive-repsol-2025":      ("Repsol", {"repsol"}),
    "brandarchive-mobil":            ("Mobil", {"mobil"}),
    "brandarchive-tepco":            ("Tokyo Electric Power Company", {"tepco", "tokyo", "electric"}),
    "brandarchive-american-airlines":("American Airlines", {"american", "airlines"}),
    "brandarchive-klm":              ("KLM", {"klm"}),
    "brandarchive-esprit":           ("Esprit Holdings", {"esprit"}),
    "brandarchive-stella-artois-2023":("Stella Artois", {"stella", "artois"}),
    "닥터자르트":                     ("Dr. Jart+", {"dr", "jart"}),
    "brandarchive-jomo":             ("Japan Energy", {"japan", "energy", "jomo"}),
    "brandarchive-leb":              ("London Electricity Board", {"london", "electricity", "leb"}),
}

def api_json(url, retries=4):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            time.sleep(1.5 * (i + 1))
    return None

def norm_tokens(t):
    return set(re.split(r"[^a-z0-9]+", str(t).lower())) - {""}

def search_qids(query):
    url = ("https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
           + urllib.parse.quote(query) + "&language=en&format=json&limit=6&type=item")
    d = api_json(url) or {}
    return [(x["id"], x.get("label", ""), x.get("description", "")) for x in d.get("search", [])]

def get_p154(qid):
    url = ("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid
           + "&props=claims&format=json")
    d = api_json(url) or {}
    claims = (d.get("entities", {}).get(qid, {}) or {}).get("claims", {})
    p154 = claims.get("P154")
    if not p154:
        return None
    try:
        return p154[0]["mainsnak"]["datavalue"]["value"]
    except Exception:
        return None

def detect_ext(blob, name=""):
    if blob[:5] == b"<?xml" or b"<svg" in blob[:400]: return "svg"
    if blob[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if blob[:3] == b"\xff\xd8\xff": return "jpg"
    if blob[:4] == b"GIF8": return "gif"
    n = name.lower()
    for e in ("svg", "png", "jpg", "jpeg", "gif", "webp"):
        if n.endswith("." + e): return "jpg" if e == "jpeg" else e
    return None

def download(filename, slug):
    quoted = urllib.parse.quote(filename.replace(" ", "_"))
    url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}?width=1200"
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            blob = r.read()
    except Exception as e:
        print(f"    download FAIL: {e}")
        return None
    ext = detect_ext(blob, filename)
    if not ext:
        print(f"    unknown ext for {filename}")
        return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    out = LOGO_DIR / f"{slug}.{ext}"
    out.write_bytes(blob)
    return f"images/logos/{slug}.{ext}", len(blob)

def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    by_slug = {b["slug"]: b for b in data.get("allBrands", [])}
    resolved = {}
    for slug, (query, expect) in TARGETS.items():
        b = by_slug.get(slug)
        if not b:
            print(f"[{slug}] MISSING record"); continue
        url_slug = b.get("urlSlug") or b["slug"]
        print(f"\n[{slug}] query='{query}'")
        chosen = None
        for qid, label, desc in search_qids(query):
            fname = get_p154(qid)
            tag = f"  {qid} '{label}' ({desc[:50]}) P154={fname}"
            if not fname:
                print(tag + " -> no logo"); continue
            ftoks = norm_tokens(fname)
            if ftoks & expect:
                print(tag + "  ✓ token match")
                chosen = (qid, label, fname, url_slug)
                break
            print(tag + "  ✗ no token overlap")
            time.sleep(0.2)
        if not chosen:
            print(f"  -> SKIP (no confident match)"); continue
        qid, label, fname, url_slug = chosen
        res = download(fname, url_slug)
        if not res:
            continue
        rel, size = res
        b["logo"] = rel
        resolved[slug] = {"qid": qid, "label": label, "file": fname, "logo": rel, "bytes": size}
        print(f"  -> SET logo = {rel} ({size} bytes) from {fname}")
        time.sleep(0.3)
    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== resolved {len(resolved)}/{len(TARGETS)} ===")
    for s, r in resolved.items():
        print(f"  {s}: {r['file']} -> {r['logo']}")
    (ROOT / "scripts_py" / "targeted_logo_report.json").write_text(
        json.dumps(resolved, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0

if __name__ == "__main__":
    sys.exit(main())
