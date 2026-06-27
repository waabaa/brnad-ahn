#!/usr/bin/env python3
"""Fill missing logos from JS-rendered official sites via Playwright.

enrich_logos_from_site.py reads only the initial HTML, so SPA/JS sites (LG생활건강,
카카오, 대한항공, 교촌 ...) returned no candidate. This renders the page in
headless Chromium, then extracts a logo from the live DOM:
  1) <img> in a header/nav whose src/class/id/alt contains 'logo' (largest),
  2) apple-touch-icon link,
  3) <link rel=icon> sized >= 64.
Downloads, validates, self-hosts to images/logos/<urlSlug>.<ext>. og:image is
NOT used (banner risk). Same root-domain filter + BLACKLIST as the static script.
Review the result (white-detect + montage) before trusting — JS sites often
serve white header logos.
"""
import json, re, sys, urllib.parse, urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web-design" / "brand_atlas_handoff" / "data" / "brand-atlas.json"
LOGO_DIR = ROOT / "web-design" / "brand_atlas_handoff" / "images" / "logos"
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 60
MIN_BYTES, MAX_BYTES = 700, 3_000_000

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enrich_logos_from_site as S  # reuse BLACKLIST + eligible

# Browser-side extractor: rank candidate logo URLs from the rendered DOM.
JS_EXTRACT = r"""
() => {
  const abs = u => { try { return new URL(u, location.href).href; } catch { return null; } };
  const out = [];
  // header/nav logo <img>
  for (const img of document.querySelectorAll('header img, nav img, [class*=header] img, [class*=logo] img, [id*=logo] img, a[href="/"] img, img')) {
    const src = img.currentSrc || img.src || img.getAttribute('data-src');
    if (!src) continue;
    const u = abs(src); if (!u) continue;
    if (!/\.(svg|png|jpe?g|webp)(\?|$)/i.test(u) && !u.startsWith('data:')) continue;
    const hay = ((img.className||'') + ' ' + (img.id||'') + ' ' + (img.alt||'') + ' ' + u).toLowerCase();
    let score = 0;
    if (/logo/.test(hay)) score += 100;
    if (img.closest('header,nav,[class*=header],[class*=gnb],[class*=masthead]')) score += 25;
    const r = img.getBoundingClientRect();
    if (r.top < 200 && r.width >= 40 && r.width <= 400) score += 20;
    if (/sprite|icon-|favicon|banner|hero|product|thumb|avatar|flag|seo|share|cover|og[-_]|social/.test(u)) score -= 80;
    if (u.startsWith('data:')) score -= 50;
    if (score > 0) out.push([score, u]);
  }
  // background-image on a logo-ish element
  for (const el of document.querySelectorAll('[class*=logo] a, [class*=logo], a[class*=logo], #logo, header a[href="/"], .header__logo, .gnb-logo')) {
    const bg = getComputedStyle(el).backgroundImage || '';
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    if (m && m[1]) {
      const u = abs(m[1]);
      if (u && /\.(svg|png|jpe?g|webp)(\?|$)/i.test(u) && !/sprite|icon-|favicon|banner|seo|share|og[-_]/i.test(u)) {
        out.push([60, u]);
      }
    }
  }
  // apple-touch-icon
  for (const l of document.querySelectorAll('link[rel*="apple-touch-icon" i]')) {
    const u = abs(l.getAttribute('href')); if (!u) continue;
    const s = parseInt((l.getAttribute('sizes')||'120').split('x')[0]) || 120;
    out.push([40 + Math.min(s,512)/100, u]);
  }
  if (out.length) { out.sort((a,b) => b[0]-a[0]); return out[0][1]; }
  // inline <svg> logo in header/nav (serialize as data)
  for (const svg of document.querySelectorAll('header svg, nav svg, [class*=logo] svg, [class*=header] svg, a[href="/"] svg')) {
    const hay = ((svg.getAttribute('class')||'') + ' ' + (svg.getAttribute('aria-label')||'') + ' ' + (svg.parentElement?.className||'') + ' ' + (svg.parentElement?.getAttribute?.('aria-label')||'')).toLowerCase();
    const r = svg.getBoundingClientRect();
    const okSize = r.width >= 40 && r.width <= 420 && r.height >= 12 && r.top < 220;
    if (okSize && (/logo/.test(hay) || svg.closest('[class*=logo],[id*=logo]'))) {
      try { return 'INLINE_SVG:' + new XMLSerializer().serializeToString(svg); } catch {}
    }
  }
  return null;
}
"""


def detect_ext(blob):
    if blob[:8] == b"\x89PNG\r\n\x1a\n": return "png"
    if blob[:3] == b"\xff\xd8\xff": return "jpg"
    if b"<svg" in blob[:800] or blob[:5] == b"<?xml": return "svg"
    if blob[:4] == b"GIF8": return "gif"
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP": return "webp"
    return None


def download(url, slug):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        blob = urllib.request.urlopen(req, timeout=15).read(MAX_BYTES + 1)
    except Exception as e:
        print(f"    download FAIL: {e}"); return None
    if len(blob) < MIN_BYTES or len(blob) > MAX_BYTES:
        print(f"    size out of range ({len(blob)}B)"); return None
    ext = detect_ext(blob)
    if not ext:
        print("    unknown ext"); return None
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    (LOGO_DIR / f"{slug}.{ext}").write_bytes(blob)
    return f"images/logos/{slug}.{ext}", len(blob)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    cands = [b for b in data.get("allBrands", []) if S.eligible(b)]
    cands.sort(key=lambda b: float(b.get("rating") or 0), reverse=True)
    cands = cands[:LIMIT]
    print(f"candidates (JS-render eligible): {len(cands)} (limit {LIMIT})")

    filled, results = 0, []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA, viewport={"width": 1366, "height": 900})
        for b in cands:
            url = b["officialWebsite"]
            slug = b.get("urlSlug") or b["slug"]
            print(f"\n[{b['slug']}] {b.get('nameKo','')} {url}")
            page = ctx.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2500)
                logo_url = page.evaluate(JS_EXTRACT)
            except Exception as e:
                print(f"    render FAIL: {e}"); page.close(); continue
            page.close()
            if not logo_url:
                print("    no logo candidate"); continue
            if logo_url.startswith("INLINE_SVG:"):
                svg = logo_url[len("INLINE_SVG:"):]
                if "<svg" not in svg or len(svg) < 80:
                    print("    inline svg too small"); continue
                if not re.search(r'xmlns=', svg):
                    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
                LOGO_DIR.mkdir(parents=True, exist_ok=True)
                (LOGO_DIR / f"{slug}.svg").write_text(svg, encoding="utf-8")
                path, n = f"images/logos/{slug}.svg", len(svg.encode())
                print(f"    SAVED inline-svg {path} ({n}B)")
            else:
                print(f"    candidate: {logo_url[:110]}")
                res = download(logo_url, slug)
                if not res:
                    continue
                path, n = res
            b["logo"] = path
            filled += 1
            results.append((b["slug"], b.get("nameKo", ""), path, n))
            print(f"    SAVED {path} ({n}B)")
        browser.close()

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n=== filled: {filled} ===")
    for s, nm, p_, n in results:
        print(f"  {s} ({nm}): {p_} ({n}B)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
