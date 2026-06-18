#!/usr/bin/env python3
"""Fetch official-site logos for batch-9 Korean brands. Visual verification after."""
import sys, json, time
from pathlib import Path
sys.argv = [sys.argv[0]]
import importlib.util
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("elo", HERE / "enrich_logos_official.py")
elo = importlib.util.module_from_spec(spec); spec.loader.exec_module(elo)

DATA = elo.DATA_JSON
SLUGS = ["muhak","bohae","kooksoondang","woongjin-food","donga-otsuka","kumho-petrochemical",
 "oci","kolon-industries","hyosung-tnc","hansol-chemical","woori-bank","nh-securities",
 "kb-securities","hanwha-life","citibank-korea","emart24","no-brand","hollys","angelinus",
 "paiks-coffee","doubleu-games","com2us-holdings","jyp","douzone","etude","dr-g","abib"]

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
