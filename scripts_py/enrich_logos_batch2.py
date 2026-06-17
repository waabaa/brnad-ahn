#!/usr/bin/env python3
"""Verified logo fetch, batch 2 — recognizable brands still on a wordmark.
Stronger guard than batch 1: a candidate is accepted only when ALL hold:
  - it has a Wikidata P154 logo,
  - the Commons filename shares a token with the expected name tokens,
  - the entity's English description matches a company/brand/airline/bank pattern
    and does NOT match a disambiguation blocklist (magazine, newspaper, song, river,
    given name, etc.). This blocks the "Mobil magazine" class of mismatch.
Prints every candidate + decision. Skips when no confident match. Writes logos and
sets brand.logo in brand-atlas.json (indent=2).
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
LOGO_DIR = HANDOFF / "images" / "logos"
UA = {"User-Agent": "brand-atlas-logo-bot/1.0 (editorial reference; o2odev@o2o.kr)"}

DESC_OK = re.compile(r"compan|corporation|brand|airline|air lines|airways|brewer|beer|bank|manufactur|conglomerate|retail|electronics|carrier|drink|beverage|confection", re.I)
DESC_BAD = re.compile(r"magazine|newspaper|\bsong\b|album|\bfilm\b|village|\briver\b|given name|surname|footballer|species|municipalit|mountain|wikimedia|disambiguat", re.I)

# slug -> (query, expected name tokens)
TARGETS = {
    "brandarchive-kirin":            ("Kirin Company", {"kirin"}),
    "brandarchive-asahi":            ("Asahi Breweries", {"asahi"}),
    "brandarchive-jal":              ("Japan Airlines", {"japan", "airlines", "jal"}),
    "brandarchive-swissair-1978":    ("Swissair", {"swissair"}),
    "brandarchive-austrian-airlines":("Austrian Airlines", {"austrian", "airlines"}),
    "brandarchive-eastern-airlines": ("Eastern Air Lines", {"eastern", "air", "lines", "airlines"}),
    "brandarchive-kenwood":          ("Kenwood electronics", {"kenwood"}),
    "brandarchive-hongkongbank":     ("HSBC", {"hsbc", "hongkong", "bank"}),
    "brandarchive-national":         ("National Panasonic Matsushita", {"national", "panasonic", "matsushita"}),
}

def api_json(url, retries=4):
    for i in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            time.sleep(1.5 * (i + 1))
    return None

def norm_tokens(t):
    return set(re.split(r"[^a-z0-9]+", str(t).lower())) - {""}

def search(query):
    url = ("https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
           + urllib.parse.quote(query) + "&language=en&format=json&limit=7&type=item")
    d = api_json(url) or {}
    return [(x["id"], x.get("label", ""), x.get("description", "")) for x in d.get("search", [])]

def get_p154(qid):
    url = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid + "&props=claims&format=json"
    d = api_json(url) or {}
    claims = (d.get("entities", {}).get(qid, {}) or {}).get("claims", {})
    p = claims.get("P154")
    try:
        return p[0]["mainsnak"]["datavalue"]["value"] if p else None
    except Exception:
        return None

def detect_ext(blob, name=""):
    if blob[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if blob[:3] == b"\xff\xd8\xff": return "jpg"
    if b"<svg" in blob[:400]: return "svg"
    if blob[:4] == b"GIF8": return "gif"
    return None

def download(filename, slug):
    quoted = urllib.parse.quote(filename.replace(" ", "_"))
    url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}?width=1200"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            blob = r.read()
    except Exception as e:
        print(f"    download FAIL: {e}"); return None
    ext = detect_ext(blob, filename)
    if not ext:
        print(f"    unknown ext"); return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    (LOGO_DIR / f"{slug}.{ext}").write_bytes(blob)
    return f"images/logos/{slug}.{ext}", len(blob)

def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    by_slug = {b["slug"]: b for b in data.get("allBrands", [])}
    resolved = {}
    for slug, (query, expect) in TARGETS.items():
        b = by_slug.get(slug)
        if not b:
            print(f"[{slug}] MISSING"); continue
        url_slug = b.get("urlSlug") or b["slug"]
        print(f"\n[{slug}] '{b['name']}' query='{query}'")
        chosen = None
        for qid, label, desc in search(query):
            fname = get_p154(qid)
            line = f"  {qid} '{label}' [{desc[:55]}] P154={fname}"
            if not fname:
                print(line + " · no logo"); continue
            tokmatch = bool(norm_tokens(fname) & expect)
            descok = bool(DESC_OK.search(desc)) and not bool(DESC_BAD.search(desc))
            if tokmatch and descok:
                print(line + "  ✓ ACCEPT (token+desc)")
                chosen = (qid, label, fname, url_slug); break
            why = []
            if not tokmatch: why.append("no-token")
            if not descok: why.append("desc-fail")
            print(line + f"  ✗ {','.join(why)}")
            time.sleep(0.2)
        if not chosen:
            print("  -> SKIP"); continue
        qid, label, fname, url_slug = chosen
        res = download(fname, url_slug)
        if not res: continue
        rel, size = res
        b["logo"] = rel
        resolved[slug] = {"qid": qid, "label": label, "file": fname, "logo": rel, "bytes": size}
        print(f"  -> SET {rel} ({size}B) from {fname}")
        time.sleep(0.3)
    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== resolved {len(resolved)}/{len(TARGETS)} ===")
    for s, r in resolved.items():
        print(f"  {s}: {r['label']} | {r['file']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
