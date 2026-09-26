#!/usr/bin/env python3
"""브랜드 연대기용 로고 썸네일 — images/history/<slug>.webp (최대 200x100, 알파 유지).

연대기 페이지는 로고 130여 개를 한 화면에 싣는다. 원본(평균 수십 KB, 일부 MB 단위)을 그대로 걸면
느려지므로 한 장 3~6KB 수준의 WebP로 줄여 둔다. manifest.json에 원본 경로를 적어 두고,
빌더(build-brand-history.mjs)는 원본이 바뀐 브랜드(어드민 로고 교체 등)에는 썸네일 대신 원본을 쓴다.

Usage: python3 scripts/make-history-logos.py   (멱등 — 원본이 같으면 다시 만들지 않는다)
"""
import io, json, re, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "history"
MAX_W, MAX_H = 200, 100

def slugs_needed():
    # links.json 값 = DB slug. 로고 경로는 데이터에서 읽는다.
    links = json.loads((ROOT / "content/brand-history/links.json").read_text("utf8"))
    data = json.loads((ROOT / "data/brand-atlas.json").read_text("utf8"))
    by_qid = {}
    for b in data["allBrands"]:  # "wd:QID" 값은 그 개체로 확정된 레코드로 푼다(lib/brand-history.mjs와 같은 규칙)
        q = (b.get("entityLinks") or {}).get("wikidata")
        if q and b.get("slug") and q not in by_qid:
            by_qid[q] = b["slug"]
    wanted = {by_qid.get(v[3:]) if v.startswith("wd:") else v for k, v in links.items() if not k.startswith("_")} - {None}
    return {b["slug"]: b.get("logo") for b in data["allBrands"] if b.get("slug") in wanted}

def load(src: Path) -> Image.Image:
    if src.suffix.lower() == ".svg":
        import cairosvg
        png = cairosvg.svg2png(url=str(src), output_width=MAX_W * 2)
        return Image.open(io.BytesIO(png))
    im = Image.open(src)
    if getattr(im, "n_frames", 1) > 1:
        im.seek(0)
    return im

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mf_path = OUT / "manifest.json"
    manifest = json.loads(mf_path.read_text("utf8")) if mf_path.exists() else {}
    made = skipped = failed = 0
    for slug, logo in sorted(slugs_needed().items()):
        if not logo or "brand_atlas_logo_mark" in logo or logo.startswith("data:"):
            continue
        src = ROOT / logo
        if not src.exists():
            continue
        name = re.sub(r"[^a-z0-9-]", "", slug.lower()) or f"b{abs(hash(slug)) % 10**8}"
        dest = OUT / f"{name}.webp"
        prev = manifest.get(slug)
        if prev and prev.get("src") == logo and dest.exists():
            skipped += 1
            continue
        try:
            im = load(src).convert("RGBA")
            bbox = im.getbbox()  # 투명 여백 제거
            if bbox:
                im = im.crop(bbox)
            im.thumbnail((MAX_W, MAX_H), Image.LANCZOS)
            im.save(dest, "WEBP", quality=86, method=6)
            manifest[slug] = {"src": logo, "file": f"images/history/{dest.name}", "w": im.width, "h": im.height}
            made += 1
        except Exception as e:  # 손상·미지원 포맷은 원본으로 폴백
            print(f"  skip {slug}: {e}", file=sys.stderr)
            failed += 1
    mf_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1, sort_keys=True) + "\n", "utf8")
    total = sum((OUT / Path(v["file"]).name).stat().st_size for v in manifest.values() if (OUT / Path(v["file"]).name).exists())
    print(f"history logos: made {made}, kept {skipped}, failed {failed}, total {total // 1024}KB")

if __name__ == "__main__":
    main()
