#!/usr/bin/env python3
"""Phase 2 publish — merge human-approved grounded drafts into brand-atlas.json.

Run ONLY after human review. Merges non-empty draft sections into brands whose
existing section is thin/empty (never clobbers rich existing content). Skips drafts
with grounding flags (e.g. NO_SOURCES) unless --force. Enforces a publish cap
(Google scaled-content-abuse safety). Sources are recorded in an audit log only,
never in the public content (출처 비노출 정책).

After running, regenerate pages + deploy:
  node web-design/brand_atlas_handoff/scripts/build-brand-pages.mjs
  (then commit + push)

Usage:
  python3 scripts_py/phase2_publish.py --slugs montblanc,harley-davidson   # explicit approved
  python3 scripts_py/phase2_publish.py --max 5                              # top-N clean drafts
"""
import argparse, json, os, datetime, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "web-design", "brand_atlas_handoff")
DATA = os.path.join(ROOT, "data", "brand-atlas.json")
DRAFT_DIR = os.path.join(os.path.dirname(__file__), "..", "content-drafts")
LOG = os.path.join(DRAFT_DIR, "generation-log.json")
THIN = 120  # existing body shorter than this is considered replaceable
SECTIONS = ("overview", "origin", "identity", "products")

def load_log():
    try:
        return json.load(open(LOG, encoding="utf-8"))
    except Exception:
        return []

def existing_body(b, k):
    s = (b.get("sections") or {}).get(k)
    return (s.get("body") or "").strip() if isinstance(s, dict) else ""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", help="comma list of approved slugs")
    ap.add_argument("--max", type=int, default=5, help="cap when --slugs not given")
    ap.add_argument("--force", action="store_true", help="publish even if grounding flags present")
    args = ap.parse_args()

    data = json.load(open(DATA, encoding="utf-8"))
    by_slug = {b["slug"]: b for b in data["allBrands"]}

    drafts = []
    files = ([f"{s.strip()}.json" for s in args.slugs.split(",")] if args.slugs
             else sorted(os.listdir(DRAFT_DIR)))
    for fn in files:
        if not fn.endswith(".json") or fn == "generation-log.json":
            continue
        try:
            drafts.append(json.load(open(os.path.join(DRAFT_DIR, fn), encoding="utf-8")))
        except Exception as e:
            print(f"  skip {fn}: {e}")

    log = load_log()
    published, changed_slugs = 0, []
    for d in drafts:
        if not args.slugs and published >= args.max:
            break
        slug = d.get("slug")
        if d.get("grounding_flags") and not args.force:
            print(f"  HOLD {slug}: flags={d['grounding_flags']}")
            continue
        b = by_slug.get(slug)
        if not b:
            print(f"  SKIP {slug}: not in data"); continue
        merged = []
        b.setdefault("sections", {})
        for k in SECTIONS:
            new = (d.get("sections") or {}).get(k, "").strip()
            if new and len(existing_body(b, k)) < THIN:
                b["sections"].setdefault(k, {})
                if not isinstance(b["sections"][k], dict):
                    b["sections"][k] = {}
                b["sections"][k]["body"] = new
                merged.append(k)
        if not merged:
            print(f"  NOCHANGE {slug}: existing content already rich"); continue
        b["aiEnriched"] = True
        log.append({"slug": slug, "publishedAt": datetime.datetime.now().isoformat(timespec="seconds"),
                    "provider": d.get("provider"), "model": d.get("model"),
                    "merged_sections": merged, "sources": d.get("sources")})
        published += 1; changed_slugs.append(slug)
        print(f"  PUBLISH {slug}: merged {merged}")

    if published:
        json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        json.dump(log, open(LOG, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\npublished {published} brand(s): {changed_slugs}")
    print("next: regenerate pages → node web-design/brand_atlas_handoff/scripts/build-brand-pages.mjs ; then commit+push")
    return 0

if __name__ == "__main__":
    sys.exit(main())
