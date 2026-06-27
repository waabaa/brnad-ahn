#!/usr/bin/env python3
"""495개 로고누락 브랜드를 Wikipedia 인포박스 logo= 필드에서 그라운디드 수집.
opensearch로 정확한 페이지 식별 → 토큰 정확일치 가드(오매칭 차단) →
회사/브랜드 인포박스 확인 → logo= 파일 파싱 → Commons 다운로드.
모든 후보는 이후 시각검수(montage)로 최종 선별 (자동 채택 금지).
출력: scripts_py/logos_wiki_candidates/{slug}.{ext} + wiki_logo_manifest.json
"""
import json, os, re, time, unicodedata, urllib.parse, concurrent.futures as cf
import requests

ROOT = "/home/waabaa/projects/brand-atlas"
HANDOFF = f"{ROOT}/web-design/brand_atlas_handoff"
OUT = f"{ROOT}/scripts_py/logos_wiki_candidates"
os.makedirs(OUT, exist_ok=True)

def session():
    s = requests.Session()
    s.headers.update({"User-Agent": "BrandAtlasLogoBot/1.0 (david.lee@o2o.kr) research"})
    return s

OK_INFOBOX = re.compile(r"\{\{\s*Infobox\s+(company|brand|organization|organisation|"
                        r"hotel|restaurant|airline|automobile|automobile manufacturer|"
                        r"software|website|product|magazine|newspaper|tv channel|"
                        r"radio station|university|football club|musical artist|"
                        r"record label|winery|brewery|beverage|drink|clothing brand|"
                        r"company/?\w*)", re.I)

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s.lower())

def toks(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return set(t for t in re.split(r"[^a-z0-9]+", s.lower()) if t)

def jget(s, url, params, tries=5):
    for i in range(tries):
        try:
            r = s.get(url, params=params, timeout=20)
            if r.status_code == 200 and r.text.strip():
                return r.json()
        except Exception:
            pass
        time.sleep(0.6 * (i + 1))
    return None

def opensearch(s, q):
    j = jget(s, "https://en.wikipedia.org/w/api.php",
             {"action": "opensearch", "search": q, "limit": 6, "format": "json"})
    return j[1] if isinstance(j, list) and len(j) > 1 else []

def pick_pages(brand_names, cands):
    """토큰 정확일치 가드를 통과하는 모든 후보를 순서대로 반환(중복 제거).
    브랜드 정규화명이 페이지 토큰 중 하나와 정확히 일치, 또는 브랜드가
    2토큰+ 이고 전부 페이지 토큰에 포함. process가 logo 찾을 때까지 순회."""
    out = []
    for nm in brand_names:
        bn = norm(nm); bt = toks(nm)
        for c in cands:
            if c in out:
                continue
            ct = toks(c)
            if (bn and bn in {norm(t) for t in ct}) or (len(bt) >= 2 and bt <= ct):
                out.append(c)
    return out

def wikitext(s, title):
    j = jget(s, "https://en.wikipedia.org/w/api.php",
             {"action": "query", "prop": "revisions", "rvprop": "content",
              "rvslots": "main", "format": "json", "titles": title, "redirects": "1"})
    if not j:
        return None, None
    p = j.get("query", {}).get("pages", {})
    v = next(iter(p.values()), {})
    if "revisions" not in v:
        return None, v.get("title")
    return v["revisions"][0]["slots"]["main"]["*"], v.get("title")

LOGO_RE = re.compile(r"\|\s*logo\s*=\s*(.+)", re.I)
FILE_RE = re.compile(r"(?:File:|Image:)?\s*([^\|\]\[\n<{}]+?\.(?:svg|png|jpg|jpeg|gif))", re.I)

def extract_logo(wt):
    if not wt or not OK_INFOBOX.search(wt):
        return None, False
    m = LOGO_RE.search(wt)
    if not m:
        return None, False
    f = FILE_RE.search(m.group(1))
    if not f:
        return None, False
    fname = f.group(1).strip()
    confident = "logo" in fname.lower()  # 파일명에 'logo' 있으면 신뢰↑
    return fname, confident

def download_commons(s, fname, slug):
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname)
    for i in range(3):
        try:
            r = s.get(url, timeout=40, allow_redirects=True)
            if r.status_code == 200 and len(r.content) > 200 \
                    and "text/html" not in r.headers.get("content-type", ""):
                low = fname.lower()
                ext = (".svg" if low.endswith(".svg") else ".png" if low.endswith(".png")
                       else ".gif" if low.endswith(".gif") else ".jpg")
                path = f"{OUT}/{slug}{ext}"
                with open(path, "wb") as fh:
                    fh.write(r.content)
                return os.path.relpath(path, ROOT)
        except Exception:
            pass
        time.sleep(0.6 * (i + 1))
    return None

def process(b):
    s = session()
    slug = b["slug"]
    names = [n for n in [b.get("nameEn"), b.get("name")] if n and n.strip()]
    tried = set()
    for nm in names:
        cands = opensearch(s, nm)
        if not cands:
            continue
        for title in pick_pages(names, cands):
            if title in tried:
                continue
            tried.add(title)
            wt, resolved = wikitext(s, title)
            fname, confident = extract_logo(wt)
            if not fname:
                continue
            local = download_commons(s, fname, slug)
            if local:
                return {"slug": slug, "name": b.get("name"), "nameEn": b.get("nameEn"),
                        "industry": b.get("industry"), "wiki_title": resolved,
                        "logo_file": fname, "local": local,
                        "confident": confident, "status": "ok"}
    return {"slug": slug, "name": b.get("name"), "nameEn": b.get("nameEn"), "status": "none"}

def main():
    data = json.load(open(f"{HANDOFF}/data/brand-atlas.json", encoding="utf-8"))
    targets = [b for b in data["allBrands"] if not (b.get("logo") or "").strip()]
    print(f"대상: {len(targets)}개", flush=True)
    results = []
    with cf.ThreadPoolExecutor(max_workers=2) as ex:
        futs = {ex.submit(process, b): b["slug"] for b in targets}
        done = 0
        for fut in cf.as_completed(futs):
            results.append(fut.result()); done += 1
            if done % 25 == 0:
                ok = sum(1 for r in results if r["status"] == "ok")
                print(f"  {done}/{len(targets)}  채택후보 {ok}", flush=True)
    ok = [r for r in results if r["status"] == "ok"]
    conf = sum(1 for r in ok if r.get("confident"))
    json.dump(results, open(f"{ROOT}/scripts_py/wiki_logo_manifest.json", "w"),
              ensure_ascii=False, indent=2)
    print(f"\n완료: {len(ok)}/{len(targets)} 후보 (파일명 'logo' 포함 {conf}, 검수필요 {len(ok)-conf})", flush=True)

if __name__ == "__main__":
    main()
