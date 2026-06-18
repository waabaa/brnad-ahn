#!/usr/bin/env python3
"""Logo fetch via Korean Wikipedia (ko.wikipedia) infobox image, for Korean
brands whose trademark logo isn't on English Wikipedia. Reuses helpers from
enrich_logos_wiki. Wikidata-verified; visual verification done AFTER this runs.
Only targets logo-less C_source_backed (this session's Korean) brands."""
import sys, json, time, re, urllib.request, urllib.parse
from pathlib import Path
sys.argv = [sys.argv[0]] + sys.argv[1:]
import importlib.util
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("elo", HERE / "enrich_logos_wiki.py")
elo = importlib.util.module_from_spec(spec); spec.loader.exec_module(elo)

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 150
DATA = elo.DATA_JSON
# Known mismatches where the Wikipedia infobox carries a GROUP/parent logo or an
# obsolete merged-era wordmark instead of the brand's own mark (visually verified
# and removed in prior rounds; ko.wikipedia re-extracts the same wrong file).
BLACKLIST = {"kakao", "korean-air", "gs25", "hanwha-life", "kcc"}

def get_kowiki_title(qid):
    url = ("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid
           + "&props=sitelinks&format=json")
    d = elo.api_json(url) or {}
    sl = (d.get("entities", {}).get(qid, {}) or {}).get("sitelinks", {})
    return (sl.get("kowiki", {}) or {}).get("title")

CHROME = ("oojs", "commons-logo", "wikimedia", "wikidata", "wiktionary",
          "wikisource", "wikibooks", "wikiquote", "wiki-logo", "wikinews",
          "edit-ltr", "edit-rtl", "padlock", "ambox", "question_book",
          "wiki letter", "wiki_letter", "folder", "red pog", "increase",
          "decrease", "steady", "flag of", "magnify-clip", "crystal", "nuvola",
          "gnome-", "emblem-", "잠금", "그림 없음", "_blank", "x_mark", "check")

def get_logo_file_ko(title, expect):
    """ko.wikipedia infobox image; accept filenames with logo/wordmark/로고/심볼."""
    url = ("https://ko.wikipedia.org/w/api.php?action=query&prop=images&imlimit=200"
           "&format=json&titles=" + urllib.parse.quote(title))
    d = elo.api_json(url) or {}
    pages = (d.get("query", {}) or {}).get("pages", {})
    files = []
    for _, p in pages.items():
        for im in (p.get("images") or []):
            t = im.get("title", "")
            if (t.lower().startswith("file:") or t.startswith("파일:")) and elo.IMG_EXT.search(t):
                files.append(t.split(":", 1)[1])
    def rank(fn):
        low = fn.lower()
        if any(k in low for k in CHROME):
            return -1000
        has_logo = ("logo" in low or "wordmark" in low or "로고" in fn
                    or "ci" == low.split(".")[0][-2:] or "심볼" in fn or "엠블럼" in fn)
        if not has_logo:
            return -1000
        score = 100
        if "wordmark" in low: score += 20
        if elo.norm_tokens(fn) & expect: score += 40
        if low.endswith(".svg"): score += 8
        elif low.endswith(".png"): score += 5
        if any(k in low for k in ("building", "store", "stadium", "headquarter",
               "exterior", "interior", "photo", "map", "사옥", "본사", "건물",
               "facade", "tower", "branch", "shop", "외관", "제품")): score -= 80
        return score
    pool = [f for f in files if rank(f) > 0]
    if not pool:
        return None, None
    pool.sort(key=rank, reverse=True)
    best = pool[0]
    quoted = urllib.parse.quote(best.replace(" ", "_"))
    return f"https://ko.wikipedia.org/wiki/Special:FilePath/{quoted}?width=1200", best

def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    all_brands = data.get("allBrands", [])
    # logo-less Korean (this-session) brands only
    cands = [b for b in all_brands
             if b.get("tier") == "C_source_backed"
             and not elo.is_real(b.get("logo")) and not elo.is_real(b.get("image"))
             and (b.get("urlSlug") or b.get("slug")) not in BLACKLIST
             and elo.query_for(b)]
    cands.sort(key=lambda b: float(b.get("rating") or 0), reverse=True)
    cands = cands[:LIMIT]
    print(f"candidates: {len(cands)} (limit {LIMIT})")
    resolved, skipped = {}, 0
    for b in cands:
        name_en = elo.query_for(b)
        url_slug = b.get("urlSlug") or b["slug"]
        expect = elo.norm_tokens(name_en) - elo.STOP or elo.norm_tokens(name_en)
        print(f"\n[{b['slug']}] '{name_en}'")
        title = None
        for qid, label, desc in elo.search(name_en):
            descok = bool(elo.DESC_OK.search(desc)) and not bool(elo.DESC_BAD.search(desc))
            tokmatch = bool(elo.norm_tokens(label) & expect)
            if not (descok and tokmatch):
                continue
            kt = get_kowiki_title(qid)
            if kt:
                print(f"  {qid} '{label}' [{desc[:40]}] -> kowiki '{kt}'")
                title = kt; break
        if not title:
            print("  -> SKIP (no kowiki)"); skipped += 1; continue
        img, fname = get_logo_file_ko(title, expect)
        if not img:
            print("  -> no logo file; SKIP"); skipped += 1; continue
        print(f"    logo file: {fname}")
        res = elo.download(img, url_slug)
        if not res:
            skipped += 1; continue
        rel, size = res
        b["logo"] = rel
        resolved[b["slug"]] = {"title": title, "logo": rel, "bytes": size, "file": fname}
        print(f"  -> SET {rel} ({size}B)")
        time.sleep(0.25)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== resolved {len(resolved)} / candidates {len(cands)} (skipped {skipped}) ===")
    for s, r in resolved.items():
        print(f"  {s}: {r['title']} | {r['logo']} ({r['bytes']}B) <- {r['file']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
