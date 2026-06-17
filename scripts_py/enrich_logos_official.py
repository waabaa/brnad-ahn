#!/usr/bin/env python3
"""Logo fetch from the brand's OFFICIAL WEBSITE (user-requested).
Pipeline per no-logo brand:
  1. Resolve the brand to a Wikidata entity (same desc+token guard as the wiki
     sweep) -> trustworthy identity, then read P856 (official website URL).
  2. Fetch the official homepage HTML and extract a logo candidate, preferring:
       a) a header <img> whose src/class/id/alt contains 'logo' (the real logo),
       b) apple-touch-icon (the app/brand icon mark, usually 180-512px),
       c) og:image (last resort; may be a social banner),
       d) a sizable rel=icon.
  3. Download, validate (real raster/svg, > MIN_BYTES, not an oversized photo),
     self-host to images/logos/<urlSlug>.<ext>, set brand.logo.
Entity verification (P856 comes from the matched Wikidata item) is the anti-
mismatch guard. Skips when uncertain. Prints every decision. No source fields.
"""
from __future__ import annotations
import json, re, sys, time, signal, urllib.parse, urllib.request
from pathlib import Path

class Deadline(Exception):
    pass

def _alarm(signum, frame):
    raise Deadline()
signal.signal(signal.SIGALRM, _alarm)

class deadline:
    """Hard wall-clock cap per network op — defeats slow-trickle hangs that the
    per-recv socket timeout cannot catch."""
    def __init__(self, secs): self.secs = secs
    def __enter__(self): signal.alarm(self.secs); return self
    def __exit__(self, *a): signal.alarm(0); return False

ROOT = Path(__file__).resolve().parent.parent
HANDOFF = ROOT / "web-design" / "brand_atlas_handoff"
DATA_JSON = HANDOFF / "data" / "brand-atlas.json"
LOGO_DIR = HANDOFF / "images" / "logos"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 250
MIN_BYTES = 900
MAX_BYTES = 3_000_000  # skip obvious photos/banners

DESC_OK = re.compile(
    r"compan|corporation|brand|retail|electronics|conglomerate|manufactur|"
    r"football club|association football|sports club|sport|cosmetic|fashion|"
    r"apparel|clothing|department store|bakery|bakeries|supermarket|grocer|"
    r"footwear|outdoor|chain|store|label|airline|air lines|airways|bank|brewer|"
    r"beer|beverage|drink|confection|automobile|automotive|hotel|restaurant|"
    r"software|technology|telecommunication|media|publisher|publishing|"
    r"record label|studio|enterprise|business|firm|service|product|maker|"
    r"museum|gallery|art\b|orchestra|symphony|philharmon|opera|ensemble|"
    r"zoo|aquarium|foundation|charit|nonprofit|non-profit|garden|botanic|"
    r"universit|college|institute|academy|library|festival|exposition|"
    r"olympic|games|expo\b|airport|metro|railway|railroad|transit|"
    r"subway|broadcast|television|\bradio\b|network|association|society|"
    r"\bfund\b|insurance|payment|fintech|platform|\bapp\b|application|startup|"
    r"distiller|winer|spirits|vodka|\bgin\b|tequila|whisky|whiskey|soda|juice|"
    r"snack|\bfood\b|dairy|coffee|\bcafe\b|\btea\b|\bwine\b|aerospace|biotech|"
    r"agency|consultanc|bureau|center|centre|organisation|organization|"
    r"jeans|denim|watch|jewel|luggage|perfume|fragrance|chocolate|liqueur|rum",
    re.I)
DESC_BAD = re.compile(
    r"\bsong\b|\balbum\b|\bfilm\b|\bvillage\b|\briver\b|given name|surname|"
    r"footballer|\bspecies\b|municipalit|mountain|wikimedia|disambiguat|"
    r"\bplayer\b|neighbourhood|\bstadium\b|"
    r"intersection|\bstation\b|sculpture|newspaper article|aspect of|list of", re.I)
STOP = {"the", "co", "ltd", "inc", "corp", "company", "group", "brand", "brands",
        "sa", "nv", "plc", "fc", "f", "c", "and", "of", "s", "a", "le", "les",
        "de", "la", "el"}

def api_json(url, retries=3):
    for i in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            time.sleep(1.0 * (i + 1))
    return None

def norm_tokens(t):
    return set(re.split(r"[^a-z0-9]+", str(t).lower())) - {""}

def search(query):
    url = ("https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
           + urllib.parse.quote(query) + "&language=en&format=json&limit=7&type=item")
    d = api_json(url) or {}
    return [(x["id"], x.get("label", ""), x.get("description", "")) for x in d.get("search", [])]

def get_p856(qid):
    url = ("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid
           + "&props=claims&format=json")
    d = api_json(url) or {}
    claims = (d.get("entities", {}).get(qid, {}) or {}).get("claims", {})
    p = claims.get("P856")
    try:
        return p[0]["mainsnak"]["datavalue"]["value"] if p else None
    except Exception:
        return None

def fetch_html(url):
    try:
        with deadline(16):
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=10) as r:
                ct = r.headers.get("Content-Type", "")
                if "html" not in ct and "xml" not in ct and ct:
                    return None, r.geturl()
                return r.read(180_000).decode("utf-8", "ignore"), r.geturl()
    except Deadline:
        print("    homepage TIMEOUT (deadline)"); return None, url
    except Exception as e:
        print(f"    homepage FAIL: {e}")
        return None, url

def extract_logo_url(html, base):
    """Return best logo URL from homepage HTML, ranked."""
    cands = []  # (score, url)
    def absolutize(u):
        u = u.strip().strip('"\'')
        if not u or u.startswith("data:"):
            return None
        return urllib.parse.urljoin(base, u)
    # a) <img> with 'logo' in src/class/id/alt
    for m in re.finditer(r"<img\b[^>]*>", html, re.I):
        tag = m.group(0)
        src = re.search(r"\bsrc\s*=\s*(['\"])(.*?)\1", tag, re.I) or \
              re.search(r"\bdata-src\s*=\s*(['\"])(.*?)\1", tag, re.I)
        if not src:
            continue
        u = absolutize(src.group(2))
        if not u or not re.search(r"\.(svg|png|jpe?g|webp)(\?|$)", u, re.I):
            continue
        ctx = tag.lower()
        score = 0
        if "logo" in ctx:
            score += 100
        if re.search(r"(header|brand|navbar|site-?logo|masthead)", ctx):
            score += 20
        if "logo" in u.lower():
            score += 30
        if u.lower().endswith(".svg"):
            score += 10
        if re.search(r"(sprite|icon-|favicon|banner|hero|product|thumb|avatar|flag)", u, re.I):
            score -= 60
        if score > 0:
            cands.append((score, u))
    # b) apple-touch-icon (largest)
    for m in re.finditer(r"<link\b[^>]*rel\s*=\s*(['\"])[^'\"]*apple-touch-icon[^'\"]*\1[^>]*>", html, re.I):
        tag = m.group(0)
        href = re.search(r"\bhref\s*=\s*(['\"])(.*?)\1", tag, re.I)
        if href:
            u = absolutize(href.group(2))
            sizes = re.search(r"sizes\s*=\s*(['\"])(\d+)", tag, re.I)
            sz = int(sizes.group(2)) if sizes else 120
            if u:
                cands.append((40 + min(sz, 512) / 100.0, u))
    # c) og:image
    m = re.search(r"<meta\b[^>]*property\s*=\s*(['\"])og:image\1[^>]*>", html, re.I) or \
        re.search(r"<meta\b[^>]*name\s*=\s*(['\"])og:image\1[^>]*>", html, re.I)
    if m:
        c = re.search(r"\bcontent\s*=\s*(['\"])(.*?)\1", m.group(0), re.I)
        if c:
            u = absolutize(c.group(2))
            if u:
                cands.append((15, u))
    if not cands:
        return None
    cands.sort(reverse=True)
    return cands[0][1]

def detect_ext(blob):
    if blob[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if blob[:3] == b"\xff\xd8\xff": return "jpg"
    if b"<svg" in blob[:800] or blob[:5] == b"<?xml": return "svg"
    if blob[:4] == b"GIF8": return "gif"
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP": return "webp"
    return None

def download(img_url, slug):
    try:
        with deadline(16):
            with urllib.request.urlopen(urllib.request.Request(img_url, headers=UA), timeout=10) as r:
                blob = r.read(MAX_BYTES + 1)
    except Deadline:
        print("    download TIMEOUT (deadline)"); return None
    except Exception as e:
        print(f"    download FAIL: {e}"); return None
    if len(blob) < MIN_BYTES or len(blob) > MAX_BYTES:
        print(f"    size out of range ({len(blob)}B)"); return None
    ext = detect_ext(blob)
    if not ext:
        print(f"    unknown ext"); return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    (LOGO_DIR / f"{slug}.{ext}").write_bytes(blob)
    return f"images/logos/{slug}.{ext}", len(blob)

def is_real(s):
    return bool(s) and "brand_atlas_logo_mark" not in str(s) and str(s).strip()

def query_for(b):
    for v in (b.get("nameEn"), b.get("name")):
        if v and re.search(r"[A-Za-z]", str(v)):
            return str(v)
    us = str(b.get("urlSlug") or "")
    if us and not re.match(r"^brand-\d+$", us) and re.search(r"[a-z]", us):
        return us.replace("-", " ").strip()
    return None

def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    all_brands = data.get("allBrands", [])
    candidates = [b for b in all_brands
                  if not is_real(b.get("logo")) and not is_real(b.get("image")) and query_for(b)]
    candidates.sort(key=lambda b: float(b.get("rating") or 0), reverse=True)
    candidates = candidates[:LIMIT]
    print(f"candidates: {len(candidates)} (limit {LIMIT})")
    resolved, skipped = {}, 0
    for b in candidates:
        q = query_for(b)
        url_slug = b.get("urlSlug") or b["slug"]
        expect = (norm_tokens(q) - STOP) or norm_tokens(q)
        print(f"\n[{b['slug']}] '{q}' tokens={sorted(expect)}")
        site = None
        for qid, label, desc in search(q):
            descok = bool(DESC_OK.search(desc)) and not bool(DESC_BAD.search(desc))
            tokmatch = bool(norm_tokens(label) & expect)
            if not (descok and tokmatch):
                continue
            site = get_p856(qid)
            print(f"  {qid} '{label}' [{desc[:40]}] site={site}")
            if site:
                break
        if not site:
            print("  -> no official site; SKIP"); skipped += 1; continue
        html, base = fetch_html(site)
        if not html:
            skipped += 1; continue
        logo_url = extract_logo_url(html, base)
        if not logo_url:
            print("  -> no logo on homepage; SKIP"); skipped += 1; continue
        print(f"    logo url: {logo_url}")
        res = download(logo_url, url_slug)
        if not res:
            skipped += 1; continue
        rel, size = res
        b["logo"] = rel
        resolved[b["slug"]] = {"site": site, "logo": rel, "bytes": size, "url": logo_url}
        print(f"  -> SET {rel} ({size}B)")
        if len(resolved) % 10 == 0:  # incremental persist so a kill keeps progress
            DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"    [checkpoint: {len(resolved)} logos persisted]")
        time.sleep(0.2)
    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== resolved {len(resolved)} / candidates {len(candidates)} (skipped {skipped}) ===")
    for s, r in resolved.items():
        print(f"  {s}: {r['site']} | {r['logo']} ({r['bytes']}B)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
