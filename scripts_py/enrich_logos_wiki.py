#!/usr/bin/env python3
"""Logo fetch via Wikidata-verified Wikipedia infobox image.
Wikimedia Commons (free-license, P154) is exhausted for trademarked logos, so
this sources the lead/infobox image of the entity's English Wikipedia article
(editorial / nominative brand-reference use), with strong anti-mismatch guards:

  1. Wikidata search by nameEn -> candidate items.
  2. Candidate must pass a description allow/deny pattern (org/brand, not a
     person/place/song/disambiguation) AND share a token with expected tokens.
  3. Take that item's enwiki sitelink, fetch its pageimage ORIGINAL.
  4. Download, sanity-check (real raster, > MIN_BYTES), self-host to
     images/logos/<urlSlug>.<ext>, set brand.logo.

Runs over no-logo brands with a Latin nameEn, highest rating first, capped by
LIMIT. Prints every decision; skips when uncertain. No source fields written.
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
LOGO_DIR = HANDOFF / "images" / "logos"
UA = {"User-Agent": "brand-atlas-logo-bot/1.0 (editorial brand reference; o2odev@o2o.kr)"}
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 150
MIN_BYTES = 1200

DESC_OK = re.compile(
    r"compan|corporation|brand|retail|electronics|conglomerate|manufactur|"
    r"football club|association football|sports club|sport|cosmetic|fashion|"
    r"apparel|clothing|department store|bakery|bakeries|supermarket|grocer|"
    r"footwear|outdoor|chain|store|label|airline|air lines|airways|bank|brewer|"
    r"beer|beverage|drink|confection|automobile|automotive|hotel|restaurant|"
    r"software|technology|telecommunication|media|publisher|publishing|magazine publisher|"
    r"record label|studio|enterprise|business|firm|service|product|maker", re.I)
DESC_BAD = re.compile(
    r"\bsong\b|\balbum\b|\bfilm\b|\bvillage\b|\briver\b|given name|surname|"
    r"footballer|\bspecies\b|municipalit|mountain|wikimedia|disambiguat|"
    r"\bplayer\b|neighbourhood|\bdistrict\b|\bstadium\b|\bcity\b|\btown\b|"
    r"intersection|\bstation\b|sculpture|newspaper article|aspect of|list of", re.I)

STOP = {"the", "co", "ltd", "inc", "corp", "company", "group", "brand", "brands",
        "sa", "nv", "plc", "fc", "f", "c", "and", "of", "s", "a", "le", "les",
        "de", "la", "el"}

def api_json(url, retries=4):
    for i in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            time.sleep(1.2 * (i + 1))
    return None

def norm_tokens(t):
    return set(re.split(r"[^a-z0-9]+", str(t).lower())) - {""}

def search(query):
    url = ("https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
           + urllib.parse.quote(query) + "&language=en&format=json&limit=7&type=item")
    d = api_json(url) or {}
    return [(x["id"], x.get("label", ""), x.get("description", "")) for x in d.get("search", [])]

def get_enwiki_title(qid):
    url = ("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid
           + "&props=sitelinks&format=json")
    d = api_json(url) or {}
    sl = (d.get("entities", {}).get(qid, {}) or {}).get("sitelinks", {})
    return (sl.get("enwiki", {}) or {}).get("title")

IMG_EXT = re.compile(r"\.(svg|png|jpg|jpeg|gif|webp)$", re.I)

def get_logo_file(title, expect):
    """List the page's images and pick the actual LOGO file (filename contains
    'logo' and shares a token with the brand). Prefer svg > png > others.
    Returns a Wikipedia Special:FilePath URL (works for local non-free + Commons)."""
    url = ("https://en.wikipedia.org/w/api.php?action=query&prop=images&imlimit=200"
           "&format=json&titles=" + urllib.parse.quote(title))
    d = api_json(url) or {}
    pages = (d.get("query", {}) or {}).get("pages", {})
    files = []
    for _, p in pages.items():
        for im in (p.get("images") or []):
            t = im.get("title", "")  # e.g. "File:Foo logo.svg"
            if t.lower().startswith("file:") and IMG_EXT.search(t):
                files.append(t[5:])  # strip "File:"
    # Wikipedia/MediaWiki chrome + generic files that appear on many pages.
    CHROME = ("oojs", "commons-logo", "wikimedia", "wikidata", "wiktionary",
              "wikisource", "wikibooks", "wikiquote", "wiki-logo", "wikinews",
              "edit-ltr", "edit-rtl", "padlock", "ambox", "question_book",
              "wiki letter", "wiki_letter", "symbol ", "symbol_", "folder",
              "red pog", "increase", "decrease", "steady", "flag of",
              "magnify-clip", "crystal", "nuvola", "gnome-", "emblem-",
              "office-book", "text document", "p vip", "p culture")
    def rank(fn):
        low = fn.lower()
        if any(k in low for k in CHROME):
            return -1000
        if "logo" not in low and "wordmark" not in low:
            return -1000  # require an explicit logo/wordmark filename
        score = 100
        if "wordmark" in low: score += 20
        if norm_tokens(fn) & expect: score += 40  # filename shares a brand token
        if low.endswith(".svg"): score += 8
        elif low.endswith(".png"): score += 5
        if any(k in low for k in ("building", "store", "stadium", "headquarter",
               "exterior", "interior", "photo", "map", "kit ", "kit_",
               "facade", "tower", "branch", "shop")): score -= 80
        return score
    pool = [f for f in files if rank(f) > 0]
    if not pool:
        return None, None
    pool.sort(key=rank, reverse=True)
    best = pool[0]
    quoted = urllib.parse.quote(best.replace(" ", "_"))
    return f"https://en.wikipedia.org/wiki/Special:FilePath/{quoted}?width=1200", best

def detect_ext(blob):
    if blob[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if blob[:3] == b"\xff\xd8\xff": return "jpg"
    if b"<svg" in blob[:600] or blob[:5] == b"<?xml": return "svg"
    if blob[:4] == b"GIF8": return "gif"
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP": return "webp"
    return None

def download(img_url, slug):
    try:
        with urllib.request.urlopen(urllib.request.Request(img_url, headers=UA), timeout=30) as r:
            blob = r.read()
    except Exception as e:
        print(f"    download FAIL: {e}"); return None
    if len(blob) < MIN_BYTES:
        print(f"    too small ({len(blob)}B)"); return None
    ext = detect_ext(blob)
    if not ext:
        print(f"    unknown ext"); return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    (LOGO_DIR / f"{slug}.{ext}").write_bytes(blob)
    return f"images/logos/{slug}.{ext}", len(blob)

def is_real(s):
    return bool(s) and "brand_atlas_logo_mark" not in str(s) and str(s).strip()

def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    all_brands = data.get("allBrands", [])
    candidates = [b for b in all_brands
                  if not is_real(b.get("logo")) and not is_real(b.get("image"))
                  and re.search(r"[A-Za-z]", str(b.get("nameEn") or b.get("name") or ""))]
    candidates.sort(key=lambda b: float(b.get("rating") or 0), reverse=True)
    candidates = candidates[:LIMIT]
    print(f"candidates: {len(candidates)} (limit {LIMIT})")
    resolved, skipped = {}, 0
    for b in candidates:
        name_en = str(b.get("nameEn") or b.get("name"))
        url_slug = b.get("urlSlug") or b["slug"]
        expect = norm_tokens(name_en) - STOP
        if not expect:
            expect = norm_tokens(name_en)
        print(f"\n[{b['slug']}] '{name_en}' tokens={sorted(expect)}")
        chosen_title = None
        for qid, label, desc in search(name_en):
            descok = bool(DESC_OK.search(desc)) and not bool(DESC_BAD.search(desc))
            tokmatch = bool(norm_tokens(label) & expect)
            tag = f"  {qid} '{label}' [{desc[:48]}]"
            if not (descok and tokmatch):
                why = []
                if not tokmatch: why.append("no-token")
                if not descok: why.append("desc-fail")
                print(tag + f"  ✗ {','.join(why)}")
                continue
            title = get_enwiki_title(qid)
            if not title:
                print(tag + "  ✗ no-enwiki"); continue
            print(tag + f"  ✓ entity ok -> enwiki '{title}'")
            chosen_title = title
            break
        if not chosen_title:
            print("  -> SKIP"); skipped += 1; continue
        img, fname = get_logo_file(chosen_title, expect)
        if not img:
            print("  -> no logo file on page; SKIP"); skipped += 1; continue
        print(f"    logo file: {fname}")
        res = download(img, url_slug)
        if not res:
            skipped += 1; continue
        rel, size = res
        b["logo"] = rel
        resolved[b["slug"]] = {"title": chosen_title, "logo": rel, "bytes": size, "file": fname}
        print(f"  -> SET {rel} ({size}B)")
        time.sleep(0.25)
    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== resolved {len(resolved)} / candidates {len(candidates)} (skipped {skipped}) ===")
    for s, r in resolved.items():
        print(f"  {s}: {r['title']} | {r['logo']} ({r['bytes']}B)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
