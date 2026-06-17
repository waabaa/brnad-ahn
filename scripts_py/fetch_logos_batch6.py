#!/usr/bin/env python3
"""Fetch official-site logos for batch-6 Korean brands using their stored
officialWebsite (skips Wikidata search). Reuses fetch/extract/download from
enrich_logos_official. Visual verification is done AFTER this runs."""
import sys, json, time
from pathlib import Path
sys.argv = [sys.argv[0]]  # neutralize argv before importing (module reads argv at load)
import importlib.util
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("elo", HERE / "enrich_logos_official.py")
elo = importlib.util.module_from_spec(spec); spec.loader.exec_module(elo)

DATA = elo.DATA_JSON
SLUGS = ["hyundai-department-store","cu","7-eleven-korea","homeplus","samsung-fire",
 "mirae-asset-securities","korea-investment-securities","kiwoom-securities","db-insurance",
 "namyang-dairy","lotteria","moms-touch","bhc-chicken","compose-coffee","the-face-shop",
 "nature-republic","hera","mamonde","manyo-factory","shift-up","devsisters","gravity",
 "ohou","jin-air","tway-air","cj-logistics","samsung-heavy","hanwha-ocean"]

data = json.loads(DATA.read_text(encoding="utf-8"))
m = {(b.get("urlSlug") or b.get("slug")): b for b in data.get("allBrands", [])}
resolved = {}
for s in SLUGS:
    b = m.get(s)
    if not b:
        print(f"[{s}] MISSING"); continue
    site = b.get("officialWebsite")
    print(f"\n[{s}] {site}")
    html, base = elo.fetch_html(site)
    if not html:
        continue
    logo_url = elo.extract_logo_url(html, base)
    if not logo_url:
        print("  no logo on homepage"); continue
    print(f"  logo url: {logo_url}")
    res = elo.download(logo_url, s)
    if not res:
        continue
    rel, size = res
    b["logo"] = rel
    resolved[s] = {"logo": rel, "bytes": size, "url": logo_url}
    print(f"  -> SET {rel} ({size}B)")
    time.sleep(0.2)

DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\n=== resolved {len(resolved)}/{len(SLUGS)} ===")
for s, r in resolved.items():
    print(f"  {s}: {r['logo']} ({r['bytes']}B) <- {r['url']}")
