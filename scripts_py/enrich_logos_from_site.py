#!/usr/bin/env python3
"""Fill missing brand logos using the brand's OWN officialWebsite field.

enrich_logos_official.py resolves a Wikidata entity to obtain P856 (official
site), so brands absent from Wikidata (many Korean SMBs) were skipped even
though our data already carries a verified `officialWebsite`. This variant
trusts that field directly and reuses the same extraction/validation pipeline.

Per no-logo brand with an http(s) officialWebsite:
  fetch homepage -> rank logo candidates (header <img.logo> > apple-touch-icon
  > og:image) -> download, validate raster/svg & byte range -> self-host to
  images/logos/<urlSlug>.<ext> -> set brand.logo on the allBrands entry.

Anti-mismatch: the source is the brand's own official domain, and the ranking
prefers an explicit header logo. Skips when no credible candidate is found.
Resumable (only touches brands still missing a logo). Run sync-logos.mjs after.
"""
import json, re, sys, urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enrich_logos_official as E  # reuse fetch_html/download/is_real

ROOT = Path(__file__).resolve().parent.parent
DATA_JSON = ROOT / "web-design" / "brand_atlas_handoff" / "data" / "brand-atlas.json"


def extract_logo_strict(html, base):
    """Like enrich_logos_official.extract_logo_url but WITHOUT the og:image
    fallback — og:image is frequently a social banner (photo background), which
    reads as broken next to transparent logo marks. Trust only an explicit
    header <img> logo or an apple-touch-icon."""
    cands = []

    def absolutize(u):
        u = u.strip().strip('"\'')
        if not u or u.startswith("data:"):
            return None
        return urllib.parse.urljoin(base, u)

    # a) <img> whose src/class/id/alt signals a logo
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
        if re.search(r"(sprite|icon-|favicon|banner|hero|product|thumb|avatar|"
                     r"flag|seo|share|cover|og[-_]|social)", u, re.I):
            score -= 80
        if score > 0:
            cands.append((score, u))
    # b) apple-touch-icon (app/brand mark)
    for m in re.finditer(r"<link\b[^>]*rel\s*=\s*(['\"])[^'\"]*apple-touch-icon[^'\"]*\1[^>]*>", html, re.I):
        tag = m.group(0)
        href = re.search(r"\bhref\s*=\s*(['\"])(.*?)\1", tag, re.I)
        if href:
            u = absolutize(href.group(2))
            sizes = re.search(r"sizes\s*=\s*(['\"])(\d+)", tag, re.I)
            sz = int(sizes.group(2)) if sizes else 120
            if u:
                cands.append((40 + min(sz, 512) / 100.0, u))
    if not cands:
        return None
    cands.sort(reverse=True)
    return cands[0][1]

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 200
# Optional substring filter on slug/nameKo for targeted runs.
ONLY = sys.argv[2] if len(sys.argv) > 2 else None


def eligible(b):
    if E.is_real(b.get("logo")) or E.is_real(b.get("image")):
        return False
    site = str(b.get("officialWebsite") or "")
    if not site.startswith("http"):
        return False
    # Reject deep sub-pages of a parent/group site (e.g. cj.co.kr/kr/brands/bibigo)
    # — those surface the parent's logo, the main mismatch source. Keep root or
    # shallow (one-segment) paths only.
    path = urllib.parse.urlparse(site).path.strip("/")
    if path.count("/") >= 1:
        return False
    return True


def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    ab = data.get("allBrands", [])
    cands = [b for b in ab if eligible(b)]
    if ONLY:
        cands = [b for b in cands
                 if ONLY in (b.get("slug") or "") or ONLY in (b.get("nameKo") or "")]
    cands.sort(key=lambda b: float(b.get("rating") or 0), reverse=True)
    cands = cands[:LIMIT]
    print(f"candidates (no-logo + officialWebsite): {len(cands)} (limit {LIMIT})")

    filled, results = 0, []
    for b in cands:
        url = b["officialWebsite"]
        slug = b.get("urlSlug") or b["slug"]
        print(f"\n[{b['slug']}] {b.get('nameKo','')} {url}")
        html, final = E.fetch_html(url)
        if not html:
            continue
        logo_url = extract_logo_strict(html, final)
        if not logo_url:
            print("    no logo candidate")
            continue
        print(f"    candidate: {logo_url}")
        res = E.download(logo_url, slug)
        if not res:
            continue
        path, n = res
        b["logo"] = path
        filled += 1
        results.append((b["slug"], b.get("nameKo", ""), path, n, logo_url))
        print(f"    SAVED {path} ({n}B)")

    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n=== filled: {filled} ===")
    for s, nm, p, n, src in results:
        print(f"  {s} ({nm}): {p} <- {src} ({n}B)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
