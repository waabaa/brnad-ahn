#!/usr/bin/env python3
"""officialWebsite touch-icon 중 시각검수 통과분을 images/logos/ self-host + JSON 패치.
한글 slug는 urlSlug(ASCII)로 파일명 — nginx 서빙 안정성. 실행: --write 로 적용.
"""
import json, os, sys, shutil

ROOT = "/home/waabaa/projects/brand-atlas"
HANDOFF = f"{ROOT}/web-design/brand_atlas_handoff"
DATA = f"{HANDOFF}/data/brand-atlas.json"

# 시각검수(montage_site_icons) 통과 — 자기 도메인 정사각 아이콘/로고
ACCEPT = {
    "bacard", "baemin", "cosmax", "dr-g", "renault-korea", "shift-up",
    "spc-samlip", "stokke", "the-sting",
    "미니스트리-오브-사운드", "워프-레코즈", "캐피털-레코드",
}

def main():
    write = "--write" in sys.argv
    man = {r["slug"]: r for r in json.load(open(f"{ROOT}/scripts_py/site_icon_manifest.json"))
           if r.get("status") == "ok"}
    data = json.load(open(DATA, encoding="utf-8"))
    by_slug = {}
    url_of = {}
    for arr in ("allBrands", "brands"):
        for b in data.get(arr, []):
            by_slug.setdefault(b.get("slug"), []).append(b)
            if b.get("urlSlug"):
                url_of[b.get("slug")] = b["urlSlug"]
    applied = []
    for slug in sorted(ACCEPT):
        r = man.get(slug)
        if not r:
            print(f"  SKIP {slug}: not in manifest"); continue
        src = f"{ROOT}/{r['local']}"
        ext = os.path.splitext(src)[1].lower()
        fname = slug if slug.isascii() else url_of.get(slug, slug)
        dst_rel = f"images/logos/{fname}{ext}"
        dst = f"{HANDOFF}/{dst_rel}"
        targets = by_slug.get(slug, [])
        if not targets:
            print(f"  SKIP {slug}: not in data"); continue
        if write:
            shutil.copy2(src, dst)
            for b in targets:
                b["logo"] = dst_rel
        applied.append((slug, dst_rel, r.get("icon_url")))
    print(f"적용 {'(WRITE)' if write else '(DRY)'}: {len(applied)}")
    for slug, path, u in applied:
        print(f"  {slug:24s} {path}")
    if write:
        json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("brand-atlas.json 저장")

if __name__ == "__main__":
    main()
