#!/usr/bin/env python3
"""officialWebsite 보유 로고누락 브랜드의 apple-touch-icon(고해상도 정사각 앱아이콘)을
수집. 자기 도메인 아이콘이라 오매칭 위험 낮음. 흰배경/저해상도는 이후 검증·시각검수로 제거.
출력: scripts_py/logos_site_candidates/{slug}.{ext} + site_icon_manifest.json
"""
import json, os, re, time, urllib.parse, concurrent.futures as cf
import requests

ROOT = "/home/waabaa/projects/brand-atlas"
HANDOFF = f"{ROOT}/web-design/brand_atlas_handoff"
OUT = f"{ROOT}/scripts_py/logos_site_candidates"
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"}

def web(b):
    return (b.get("officialWebsite") or (b.get("facts") or {}).get("officialWebsite") or "").strip()

ICON_RE = re.compile(r"<link[^>]+>", re.I)

def parse_icons(html, base):
    """apple-touch-icon / icon 링크를 (size, abs_url)로 반환. 큰 것 우선."""
    out = []
    for tag in ICON_RE.findall(html):
        if not re.search(r'rel=["\'][^"\']*icon', tag, re.I):
            continue
        href = re.search(r'href=["\']([^"\']+)', tag, re.I)
        if not href:
            continue
        url = urllib.parse.urljoin(base, href.group(1))
        sz = re.search(r'sizes=["\'](\d+)', tag, re.I)
        size = int(sz.group(1)) if sz else (180 if "apple-touch" in tag.lower() else 0)
        apple = "apple-touch" in tag.lower()
        out.append((apple, size, url))
    # apple-touch 우선, 그 다음 size 큰 순
    out.sort(key=lambda t: (not t[0], -t[1]))
    return out

def process(b):
    s = requests.Session(); s.headers.update(UA)
    slug = b["slug"]; site = web(b)
    if not site:
        return {"slug": slug, "status": "no-site"}
    try:
        r = s.get(site, timeout=20, allow_redirects=True)
        html = r.text if r.status_code == 200 else ""
    except Exception:
        html = ""
    cands = parse_icons(html, r.url if html else site) if html else []
    # fallback 기본 경로
    if not cands:
        root = urllib.parse.urljoin(site, "/")
        cands = [(True, 180, urllib.parse.urljoin(root, "apple-touch-icon.png"))]
    for apple, size, url in cands[:4]:
        try:
            ir = s.get(url, timeout=20)
            ct = ir.headers.get("content-type", "")
            if ir.status_code == 200 and len(ir.content) > 300 and "image" in ct:
                ext = (".png" if "png" in ct or url.lower().endswith(".png")
                       else ".svg" if "svg" in ct or url.lower().endswith(".svg")
                       else ".jpg" if "jpeg" in ct or "jpg" in ct else ".ico" if "icon" in ct else ".png")
                if ext == ".ico":
                    continue  # ico는 보통 저해상도, 스킵
                path = f"{OUT}/{slug}{ext}"
                with open(path, "wb") as fh:
                    fh.write(ir.content)
                return {"slug": slug, "name": b.get("name"), "site": site,
                        "icon_url": url, "size_hint": size, "apple": apple,
                        "local": os.path.relpath(path, ROOT), "status": "ok"}
        except Exception:
            continue
    return {"slug": slug, "name": b.get("name"), "site": site, "status": "none"}

def main():
    data = json.load(open(f"{HANDOFF}/data/brand-atlas.json", encoding="utf-8"))
    targets = [b for b in data["allBrands"]
               if not (b.get("logo") or "").strip() and web(b)]
    print(f"officialWebsite 보유 대상: {len(targets)}", flush=True)
    results = []
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        for r in ex.map(process, targets):
            results.append(r)
    ok = [r for r in results if r["status"] == "ok"]
    json.dump(results, open(f"{ROOT}/scripts_py/site_icon_manifest.json", "w"),
              ensure_ascii=False, indent=2)
    print(f"수집: {len(ok)}/{len(targets)}", flush=True)

if __name__ == "__main__":
    main()
