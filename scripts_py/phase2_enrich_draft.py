#!/usr/bin/env python3
"""Phase 2 PoC — search-grounded brand enrichment drafts (human-gated).

Generates enriched, source-grounded section drafts for thin brands using the
internal LLM gateway (via SSH tunnel on localhost:5055). Writes drafts ONLY to
content-drafts/<slug>.json for human review. Does NOT touch brand-atlas.json and
does NOT publish — that is a separate, human-approved step (plan AC6).

Env: RESORT_GW_KEY  (gateway bearer key)
Usage: python3 scripts_py/phase2_enrich_draft.py --slugs montblanc,harley-davidson,coca-cola
"""
import argparse, json, os, re, sys, urllib.request, datetime

GATEWAY = os.environ.get("RESORT_GW_URL", "http://localhost:5055")
KEY = os.environ.get("RESORT_GW_KEY", "")
ROOT = os.path.join(os.path.dirname(__file__), "..", "web-design", "brand_atlas_handoff")
DATA = os.path.join(ROOT, "data", "brand-atlas.json")
DRAFT_DIR = os.path.join(os.path.dirname(__file__), "..", "content-drafts")

# Reused from qa-check spirit: never let synthetic/leakage phrasing into drafts.
BANNED = [
    re.compile(r"https?://", re.I),
    re.compile(r"identity_status|asset_summary|record_|전체 에셋|로컬 저장 이미지"),
    re.compile(r"위키피디아|위키백과|Wikidata"),
    re.compile(r"제 생각|확실하지 않|아마도|추정됩니다|것으로 보입니다"),
]

def gw(path, body, timeout=200):
    req = urllib.request.Request(
        GATEWAY + path, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)

def parse_json(text):
    """Extract the first JSON object from a model response."""
    if not text:
        return None
    m = re.search(r"\{.*\}", text, re.S)
    try:
        return json.loads(m.group(0) if m else text)
    except Exception:
        return None

def ground_flags(sections, sources):
    flags = []
    if not sources:
        flags.append("NO_SOURCES")  # cannot verify → must be human-checked / likely reject
    for k, v in sections.items():
        s = str(v or "")
        for pat in BANNED:
            if pat.search(s):
                flags.append(f"BANNED:{k}:{pat.pattern[:20]}")
    return flags

def enrich(brand):
    name, en = brand["name"], brand.get("nameEn") or ""
    # 1) grounded search
    q = f"{name} {en} 브랜드 창립 연도 설립자 본사 대표 제품 역사 — 사실 위주, 한국어"
    sr = gw("/v1/search", {"query": q})
    sources = sr.get("sources") or []
    ctx = (sr.get("content") or "")[:4000]
    src_lines = "\n".join(f"- {s.get('title','')}: {s.get('url','')}" for s in sources[:8])
    # 2) grounded generation (strict no-fabrication)
    system = ("당신은 한국어 브랜드 사전 편집자입니다. 반드시 '제공된 자료'에 명시된 사실만 사용하고, "
              "자료에 없는 내용은 절대 지어내지 마십시오. 추측/모호 표현 금지. URL/출처명 본문 노출 금지. "
              "각 섹션은 2~4문장의 객관적 서술. 자료가 부족하면 해당 섹션은 빈 문자열로 두십시오.")
    prompt = (f"브랜드: {name} ({en})\n\n[제공된 자료 요약]\n{ctx}\n\n[참고 출처]\n{src_lines}\n\n"
              "위 자료만 근거로 아래 JSON을 작성하세요(키 고정):\n"
              '{"overview":"한눈에 보는 브랜드(정체성·핵심)","origin":"시작과 성장(창립·연혁)",'
              '"identity":"브랜드 아이덴티티(디자인·가치)","products":"대표 제품과 서비스"}')
    gr = gw("/v1/generate", {"provider": "gpt", "system": system, "prompt": prompt,
                             "max_tokens": 1400, "temperature": 0.35, "fallback": ["gemini"]})
    sections = parse_json(gr.get("content")) or {}
    sections = {k: str(sections.get(k, "")).strip() for k in ("overview", "origin", "identity", "products")}
    return {
        "slug": brand["slug"], "name": name, "nameEn": en,
        "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
        "provider": gr.get("provider"), "model": gr.get("model"), "fallback_used": gr.get("fallback_used"),
        "sources": [{"title": s.get("title"), "url": s.get("url")} for s in sources[:8]],
        "sections": sections,
        "grounding_flags": ground_flags(sections, sources),
        "status": "draft_pending_human_review",
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", required=True)
    args = ap.parse_args()
    if not KEY:
        print("ERROR: RESORT_GW_KEY env not set", file=sys.stderr); return 2
    data = json.load(open(DATA, encoding="utf-8"))
    by_slug = {b["slug"]: b for b in data["allBrands"]}
    os.makedirs(DRAFT_DIR, exist_ok=True)
    for slug in [s.strip() for s in args.slugs.split(",") if s.strip()]:
        b = by_slug.get(slug)
        if not b:
            print(f"  SKIP {slug}: not found"); continue
        try:
            draft = enrich(b)
        except Exception as e:
            print(f"  FAIL {slug}: {e}"); continue
        out = os.path.join(DRAFT_DIR, f"{slug}.json")
        json.dump(draft, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        flags = draft["grounding_flags"]
        print(f"  OK {slug} | provider={draft['provider']} fallback={draft['fallback_used']} | "
              f"sources={len(draft['sources'])} | flags={flags or 'none'} → {out}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
