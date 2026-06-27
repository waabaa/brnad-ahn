#!/usr/bin/env python3
"""검수 통과한 Wikipedia 로고 후보를 images/logos/에 self-host + brand-atlas.json 패치.
- EXCLUDE(시각검수 오매칭/부정확)는 제외
- allBrands+brands 양 배열에 slug/urlSlug 동기화
- 확장자 보존(svg/png/jpg). asset 경로는 'images/logos/{slug}.{ext}'
실행: python3 apply_wiki_logos.py [--write]
"""
import json, os, sys, shutil

ROOT = "/home/waabaa/projects/brand-atlas"
HANDOFF = f"{ROOT}/web-design/brand_atlas_handoff"
LOGO_DIR = f"{HANDOFF}/images/logos"
DATA = f"{HANDOFF}/data/brand-atlas.json"

# 시각검수(montage) 결과 오매칭/부정확 제외
EXCLUDE = {
    "checker",                       # 체스판 패턴(로고 아님)
    "dunamu",                        # 업비트(자회사 서비스) 로고
    "renault-korea",                 # 르노그룹≠르노코리아 법인
    "x-ray-dog",                     # BMG(배급사) 로고
    "brandarchive-nippon-shinpan",   # MUFG(모회사) 로고
    "hyundai-department-store",      # HYUNDAI 부정확
    "코어콘텐츠미디어",                # MBK(후신사) 로고
    "pyaterochka",                   # 어두운 사진(패널 부적합)
    "brandarchive-mountain-hardware",# Mountain Computer 오매칭(Hardware≠Computer)
}

def main():
    write = "--write" in sys.argv
    report = json.load(open(f"{ROOT}/scripts_py/verify_report.json"))
    passed = [r for r in report["auto_pass"] if r["slug"] not in EXCLUDE]
    print(f"검수통과 {len(report['auto_pass'])} - 제외 {len(EXCLUDE)} → 적용대상 {len(passed)}")

    data = json.load(open(DATA, encoding="utf-8"))
    by_slug = {}
    for arr in ("allBrands", "brands"):
        for b in data.get(arr, []):
            by_slug.setdefault(b.get("slug"), []).append(b)
            if b.get("urlSlug"):
                by_slug.setdefault(b.get("urlSlug"), []).append(b)

    applied = []
    for r in passed:
        slug = r["slug"]
        src = f"{ROOT}/{r['local']}"
        if not os.path.exists(src):
            print(f"  SKIP {slug}: source missing"); continue
        ext = os.path.splitext(src)[1].lower()
        dst_rel = f"images/logos/{slug}{ext}"
        dst = f"{HANDOFF}/{dst_rel}"
        targets = by_slug.get(slug, [])
        if not targets:
            print(f"  SKIP {slug}: not in data"); continue
        if write:
            shutil.copy2(src, dst)
            for b in targets:
                b["logo"] = dst_rel
        applied.append((slug, dst_rel, r.get("wiki_title")))

    print(f"\n적용 {'(WRITE)' if write else '(DRY-RUN)'}: {len(applied)}개")
    for slug, path, wt in applied:
        print(f"  {slug:32s} {path:42s} <- {wt}")

    if write:
        json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"\nbrand-atlas.json 저장 ({len(applied)}개 로고 패치)")

if __name__ == "__main__":
    main()
