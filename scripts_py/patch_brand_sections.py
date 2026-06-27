#!/usr/bin/env python3
import json, re, sys

ROOT = "/home/waabaa/projects/brand-atlas/web-design/brand_atlas_handoff"
DATA = f"{ROOT}/data/brand-atlas.json"
BATCH = "/tmp/claude-1000/-home-waabaa-projects-brand-atlas/3737a6ac-20fd-4c92-aa9b-8180afa666ba/scratchpad/batch_content.json"

TITLES = {"overview": "개요", "insights": None, "origin": None,
          "identity": "브랜드 아이덴티티", "products": None, "current": None}
KEYS = list(TITLES.keys())

BANNED = [
    "단순한 이름 목록이 아니라", "읽기 위한 기준점", "취향과 지위 신호를 만드는 영역",
    "추가 자료가 확보되면", "기본 설명이며", "를 통해 소비자와 소통하고 있다",
    "분야의 대표 브랜드", "범주에서 해석됩니다",
    "반복 구매", "고객 접점", "생활 리듬", "확인 필요", "보강 대상",
]
# isSafePublicText (app.js) ported
SAFE_BLOCK = [
    r"각주\s*각주|참고\s*・|레이어\s*닫기", r"Chapter\s*\d+",
    r"공식\s*홈페이지|공식홈페이지|위키피디아|위키백과", r"https?:\/\/",
    r"revenue:\s*\d{7,}", r"[A-Za-z][A-Za-z ,.'’&()\-]{160,}",
]
MIN = {"insights": 250, "origin": 300, "overview": 150, "identity": 200, "products": 150}

batch = json.load(open(BATCH, encoding="utf-8"))
data = json.load(open(DATA, encoding="utf-8"))
ab = {b["slug"]: b for b in data["allBrands"] if b.get("slug")}
ab_url = {b.get("urlSlug"): b for b in data["allBrands"] if b.get("urlSlug")}

errors, warns = [], []
for slug, secs in batch.items():
    if slug not in ab and slug not in ab_url:
        errors.append(f"MISSING slug: {slug}"); continue
    for k in KEYS:
        body = (secs.get(k) or "").strip()
        if not body:
            errors.append(f"{slug}.{k}: EMPTY"); continue
        for b in BANNED:
            if b in body:
                errors.append(f"{slug}.{k}: BANNED '{b}'")
        for p in SAFE_BLOCK:
            if re.search(p, body):
                errors.append(f"{slug}.{k}: UNSAFE /{p}/")
        if k in MIN and len(body) < MIN[k]:
            warns.append(f"{slug}.{k}: {len(body)}자 < {MIN[k]}")

if errors:
    print("ERRORS:")
    for e in errors: print("  -", e)
    sys.exit(1)
if warns:
    print("LENGTH WARNINGS:")
    for w in warns: print("  -", w)

if "--write" in sys.argv:
    updated = 0
    pool = data["allBrands"] + data["brands"]
    for brand in pool:
        s = brand.get("slug"); u = brand.get("urlSlug")
        secs = batch.get(s) or batch.get(u)
        if not secs:
            continue
        brand.setdefault("sections", {})
        for k in KEYS:
            brand["sections"][k] = {"title": TITLES[k], "body": secs[k]}
        updated += 1
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"WROTE: {updated} objects updated (allBrands+brands)")
else:
    print(f"DRY-RUN ok: {len(batch)} brands, all sections safe. (errors=0)")
