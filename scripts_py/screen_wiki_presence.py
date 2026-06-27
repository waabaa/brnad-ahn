#!/usr/bin/env python3
"""빈코어>=3 brandarchive 브랜드 중 Wikipedia 페이지가 존재하는(=신뢰정보 확보 가능)
것을 스크리닝. 무명(위키 부재)은 그라운디드 보강 불가 → 빈 채로가 정답(무할루시네이션).
출력: wiki_presence.json (위키 존재 브랜드 + 페이지 타이틀, rating desc)
"""
import json, os, concurrent.futures as cf
import importlib.util

ROOT = "/home/waabaa/projects/brand-atlas"
HANDOFF = f"{ROOT}/web-design/brand_atlas_handoff"

spec = importlib.util.spec_from_file_location("f", f"{ROOT}/scripts_py/fetch_wiki_infobox_logos.py")
F = importlib.util.module_from_spec(spec); spec.loader.exec_module(F)

def body(b, k):
    s = (b.get("sections") or {}).get(k)
    if isinstance(s, dict):
        return (s.get("body") or "").strip()
    return (s or "").strip() if isinstance(s, str) else ""

CORE = ["overview", "insights", "origin", "identity", "products", "current"]

def check(b):
    s = F.session()
    names = [n for n in [b.get("nameEn"), b.get("name")] if n and n.strip()]
    for nm in names:
        cands = F.opensearch(s, nm)
        if not cands:
            continue
        pages = F.pick_pages(names, cands)
        if not pages:
            continue
        # 회사/브랜드/조직 인포박스 있는 페이지만 = 신뢰 보강 가능
        for title in pages[:2]:
            wt, resolved = F.wikitext(s, title)
            if wt and F.OK_INFOBOX.search(wt):
                empt = [k for k in CORE if not body(b, k)]
                return {"slug": b["slug"], "nameEn": b.get("nameEn"), "name": b.get("name"),
                        "industry": b.get("industry"), "rating": b.get("rating"),
                        "wiki_title": resolved, "empty_sections": empt, "status": "wiki"}
    return {"slug": b["slug"], "status": "none"}

def main():
    data = json.load(open(f"{HANDOFF}/data/brand-atlas.json", encoding="utf-8"))
    targets = [b for b in data["allBrands"]
               if sum(1 for k in CORE if not body(b, k)) >= 3]
    print(f"빈코어>=3 대상: {len(targets)}", flush=True)
    results = []
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(check, b) for b in targets]
        done = 0
        for fut in cf.as_completed(futs):
            results.append(fut.result()); done += 1
            if done % 50 == 0:
                w = sum(1 for r in results if r["status"] == "wiki")
                print(f"  {done}/{len(targets)} 위키존재 {w}", flush=True)
    wiki = [r for r in results if r["status"] == "wiki"]
    wiki.sort(key=lambda r: -(r.get("rating") or 0))
    json.dump(wiki, open(f"{ROOT}/scripts_py/wiki_presence.json", "w"),
              ensure_ascii=False, indent=2)
    print(f"\n위키 존재(보강가능): {len(wiki)}/{len(targets)}", flush=True)

if __name__ == "__main__":
    main()
