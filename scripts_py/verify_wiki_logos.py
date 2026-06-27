#!/usr/bin/env python3
"""수집된 Wikipedia 로고 후보를 자동검증 + 시각검수용 몽타주 생성.
- SVG는 cairosvg로 흰배경 PNG 변환
- 자동검증: 최소크기, 불투명 흰색비율(>92% 제외=흰배경 비가시), 단색/거의빈 제외
- 통과분으로 라벨 단 콘택트시트(montage_wiki_*.png) 생성 → Read로 시각검수
출력: verify_report.json (auto_pass / auto_reject), montage PNG들
"""
import json, os, glob, math
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT = "/home/waabaa/projects/brand-atlas"
CAND = f"{ROOT}/scripts_py/logos_wiki_candidates"
RENDER = f"{ROOT}/scripts_py/logos_wiki_render"
os.makedirs(RENDER, exist_ok=True)
SCRATCH = "/tmp/claude-1000/-home-waabaa-projects-brand-atlas/6ccb1be8-51e6-4600-b250-baae131ec798/scratchpad"

def to_png(path, slug):
    out = f"{RENDER}/{slug}.png"
    try:
        if path.lower().endswith(".svg"):
            cairosvg.svg2png(url=path, write_to=out, background_color="white",
                             output_width=400, output_height=400)
        else:
            im = Image.open(path).convert("RGBA")
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            bg.alpha_composite(im)
            bg.convert("RGB").save(out)
        return out
    except Exception as e:
        return None

def analyze(png):
    """반환: (ok, reason, metrics)"""
    try:
        im = Image.open(png).convert("RGB")
    except Exception as e:
        return False, f"open-fail:{e}", {}
    w, h = im.size
    if w < 60 or h < 40:
        return False, f"too-small:{w}x{h}", {"w": w, "h": h}
    # 색 분포: 거의 흰색뿐이면(로고가 흰색→흰배경서 비가시) 제외
    small = im.resize((64, 64))
    px = list(small.getdata())
    near_white = sum(1 for r, g, b in px if r > 240 and g > 240 and b > 240)
    frac_white = near_white / len(px)
    distinct = len(set(px))
    if frac_white > 0.97:
        return False, f"blank/whitelogo:{frac_white:.2f}", {"white": frac_white}
    if distinct < 4:
        return False, f"flat:{distinct}colors", {"distinct": distinct}
    return True, "ok", {"w": w, "h": h, "white": round(frac_white, 2), "distinct": distinct}

def montage(items, outpath, cols=6, cell=190):
    if not items:
        return
    rows = math.ceil(len(items) / cols)
    W, H = cols * cell, rows * cell
    canvas = Image.new("RGB", (W, H), (235, 235, 235))
    dr = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    except Exception:
        font = ImageFont.load_default()
    for i, (slug, png) in enumerate(items):
        cx, cy = (i % cols) * cell, (i // cols) * cell
        dr.rectangle([cx, cy, cx + cell - 2, cy + cell - 2], fill=(255, 255, 255), outline=(200, 200, 200))
        try:
            im = Image.open(png).convert("RGB")
            im.thumbnail((cell - 16, cell - 40))
            canvas.paste(im, (cx + (cell - im.width) // 2, cy + 8))
        except Exception:
            pass
        dr.text((cx + 5, cy + cell - 26), slug[:26], fill=(0, 0, 0), font=font)
    canvas.save(outpath)
    print(f"  montage: {outpath} ({len(items)} items)")

def main():
    manifest = json.load(open(f"{ROOT}/scripts_py/wiki_logo_manifest.json"))
    oks = [r for r in manifest if r.get("status") == "ok"]
    print(f"수집 후보: {len(oks)}")
    auto_pass, auto_reject = [], []
    for r in oks:
        slug = r["slug"]
        path = f"{ROOT}/{r['local']}"
        if not os.path.exists(path):
            r["verify"] = "missing-file"; auto_reject.append(r); continue
        png = to_png(path, slug)
        if not png:
            r["verify"] = "render-fail"; auto_reject.append(r); continue
        ok, reason, metrics = analyze(png)
        r["verify"] = reason; r["metrics"] = metrics; r["render"] = os.path.relpath(png, ROOT)
        (auto_pass if ok else auto_reject).append(r)
    print(f"자동통과: {len(auto_pass)} / 자동제외: {len(auto_reject)}")
    # confident(파일명 logo 포함) 먼저, 그 다음 나머지 — 검수 우선순위
    auto_pass.sort(key=lambda r: (not r.get("confident"), r["slug"]))
    json.dump({"auto_pass": auto_pass, "auto_reject": auto_reject},
              open(f"{ROOT}/scripts_py/verify_report.json", "w"), ensure_ascii=False, indent=2)
    # 몽타주: confident / review 분리
    conf = [(r["slug"], f"{ROOT}/{r['render']}") for r in auto_pass if r.get("confident")]
    rev = [(r["slug"], f"{ROOT}/{r['render']}") for r in auto_pass if not r.get("confident")]
    for idx in range(0, len(conf), 60):
        montage(conf[idx:idx+60], f"{SCRATCH}/montage_confident_{idx//60}.png")
    for idx in range(0, len(rev), 60):
        montage(rev[idx:idx+60], f"{SCRATCH}/montage_review_{idx//60}.png")
    print(f"confident(파일명 logo) {len(conf)} / review {len(rev)}")
    print("verify_report.json 저장")

if __name__ == "__main__":
    main()
