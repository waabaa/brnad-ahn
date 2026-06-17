#!/usr/bin/env python3
"""Verified logo fetch, batch 3 — recognizable brands still on a wordmark
placeholder (e.g. Tottenham Hotspur, Korean retail/beauty, EU retail).
Same dual guard as batch 2: accept only when P154 exists AND the Commons
filename shares a token with expected tokens AND the entity description matches
an org/brand pattern and not a disambiguation blocklist. Skips when uncertain.
Writes logos to images/logos/<urlSlug>.<ext> and sets brand.logo.
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
LOGO_DIR = HANDOFF / "images" / "logos"
UA = {"User-Agent": "brand-atlas-logo-bot/1.0 (editorial reference; o2odev@o2o.kr)"}

DESC_OK = re.compile(
    r"compan|corporation|brand|retail|electronics|conglomerate|manufactur|"
    r"football club|association football|sports club|sport|cosmetic|fashion|"
    r"apparel|clothing|department store|bakery|bakeries|supermarket|grocer|"
    r"footwear|outdoor|chain|store|label|cosmetics", re.I)
DESC_BAD = re.compile(
    r"magazine|newspaper|\bsong\b|album|\bfilm\b|\bvillage\b|\briver\b|given name|"
    r"surname|footballer|\bspecies\b|municipalit|mountain|wikimedia|disambiguat|"
    r"\bplayer\b|neighbourhood|district|stadium", re.I)

# key = brand.slug (may be Korean) -> (query, expected tokens)
TARGETS = {
    "brandarchive-tottenham-hotspur": ("Tottenham Hotspur F.C.", {"tottenham", "hotspur", "spurs"}),
    "무신사":            ("Musinsa", {"musinsa"}),
    "탬버린즈":          ("Tamburins", {"tamburins"}),
    "닥터자르트":        ("Dr. Jart+", {"dr", "jart", "drjart"}),
    "롯데백화점":        ("Lotte Department Store", {"lotte", "department"}),
    "뚜레쥬르":          ("Tous Les Jours bakery", {"tous", "les", "jours", "tlj"}),
    "까르푸":            ("Carrefour", {"carrefour"}),
    "아더에러":          ("Ader Error", {"ader", "error", "adererror"}),
    "코오롱스포츠":      ("Kolon Sport", {"kolon", "sport"}),
    "블랙야크":          ("BlackYak", {"black", "yak", "blackyak"}),
    "pyaterochka":       ("Pyaterochka", {"pyaterochka"}),
    "kopeyka":           ("Kopeyka retail chain", {"kopeyka"}),
    "standaard-boekhandel": ("Standaard Boekhandel", {"standaard", "boekhandel"}),
    "boerenbond":        ("Boerenbond retail", {"boerenbond"}),
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
