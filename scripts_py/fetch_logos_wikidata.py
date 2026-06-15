#!/usr/bin/env python3
"""Fetch missing brand logos from Wikidata P154 (authoritative logo) → Wikimedia.

enrich_logos.py only processed QIDs already in the local SQLite DB, so well-known
brands whose Wikidata entity wasn't in the DB were never looked up. This searches
Wikidata by name, takes the entity whose label/alias matches the brand AND has a
P154 (logo) — that combination strongly filters out wrong entities (a fuel named
"Diesel" has no logo property) — then downloads the logo at high resolution and
self-hosts it with an ASCII filename. Never overwrites an existing logo.

Usage: python3 scripts_py/fetch_logos_wikidata.py --slugs chanel,puma,audi
       python3 scripts_py/fetch_logos_wikidata.py --auto 40   # top-N missing+nameEn+rating
"""
import argparse, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..", "web-design", "brand_atlas_handoff")
DATA = os.path.join(ROOT, "data", "brand-atlas.json")
LOGODIR = os.path.join(ROOT, "images", "logos")
UA = "brand-atlas-logo-fetch/1.0 (https://brand.resort.co.kr)"

def api(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))

def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def search_qids(name):
    u = "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=" + urllib.parse.quote(name)
    return [x["id"] for x in (api(u).get("search") or [])]

def entity_logo(qid, name):
    u = f"https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases|claims&languages=en|ko&ids={qid}"
    ent = (api(u).get("entities") or {}).get(qid) or {}
    claims = ent.get("claims") or {}
    p154 = claims.get("P154")
    if not p154:
        return None
    # label/alias must roughly match the brand name (guards against wrong entity)
    labels = [ (ent.get("labels") or {}).get(l, {}).get("value", "") for l in ("en", "ko") ]
    aliases = [a.get("value", "") for al in (ent.get("aliases") or {}).values() for a in al]
    names = {norm(x) for x in labels + aliases if x}
    target = norm(name)
    # Require an EXACT normalized label/alias match. Substring matching produced
    # false positives on short names (e.g. "BIC" → an unrelated entity), and a wrong
    # logo on a dictionary is worse than the typographic-wordmark fallback.
    if not target or target not in names:
        return None
    try:
        return p154[0]["mainsnak"]["datavalue"]["value"]  # filename
    except Exception:
        return None

def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def download(filename, root, base):
    """Save the logo with a correct extension. SVG sources are fetched as the
    original vector (best quality); raster sources are fetched at width=1200.
    Returns the relative path saved, or None."""
    quoted = urllib.parse.quote(filename.replace(" ", "_"))
    fp = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}"
    if filename.lower().endswith(".svg"):
        data = _get(fp)  # original SVG (vector)
        if data.lstrip()[:5].lower().startswith(b"<") and len(data) > 200:
            rel = f"images/logos/{base}.svg"
        else:  # not valid SVG — fall back to a rasterized PNG
            data = _get(fp + "?width=1200"); rel = f"images/logos/{base}.png"
    else:
        data = _get(fp + "?width=1200")
        ext = os.path.splitext(filename)[1].lower()
        rel = f"images/logos/{base}{ext if ext in ('.png', '.jpg', '.jpeg') else '.png'}"
    if len(data) < 600:
        return None
    with open(os.path.join(root, rel), "wb") as f:
        f.write(data)
    return rel

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs")
    ap.add_argument("--auto", type=int)
    args = ap.parse_args()
    d = json.load(open(DATA, encoding="utf-8"))
    ab = d["allBrands"]
    by_slug = {b["slug"]: b for b in ab}

    if args.slugs:
        targets = [by_slug[s] for s in args.slugs.split(",") if s.strip() in by_slug]
    else:
        cand = [b for b in ab if not (b.get("logo") or "").strip()
                and b.get("nameEn") and not str(b.get("tier", "")).startswith("D")
                and b.get("publicReady") is not False]
        cand.sort(key=lambda b: -(b.get("rating") or 0))
        targets = cand[: (args.auto or 30)]

    os.makedirs(LOGODIR, exist_ok=True)
    umap = {b["slug"]: b.get("urlSlug") for b in ab}
    results = {"ok": [], "no_match": [], "fail": []}
    for b in targets:
        slug, name, en = b["slug"], b["name"], b.get("nameEn")
        base = umap.get(slug) or (slug if slug.isascii() else f"brand-{b.get('id')}")
        try:
            fname = None
            for q in search_qids(en) + search_qids(name):
                fname = entity_logo(q, en) or entity_logo(q, name)
                if fname:
                    break
            if not fname:
                results["no_match"].append(slug); print(f"  no-match {slug} ({en})"); continue
            rel = download(fname, ROOT, base)
            if rel:
                for key in ("allBrands", "brands", "brandCards", "insights"):
                    for x in d.get(key, []):
                        if x.get("slug") == slug and not (x.get("logo") or "").strip():
                            x["logo"] = rel
                results["ok"].append((slug, rel, fname))
                print(f"  OK {slug} → {rel}  (Commons: {fname})")
            else:
                results["fail"].append(slug); print(f"  dl-fail {slug}")
        except Exception as e:
            results["fail"].append(slug); print(f"  ERROR {slug}: {e}")
        time.sleep(0.4)

    if results["ok"]:
        json.dump(d, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\nmounted {len(results['ok'])} | no-match {len(results['no_match'])} | fail {len(results['fail'])}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
