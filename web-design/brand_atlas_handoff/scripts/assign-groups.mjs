// 브랜드를 그룹(모기업)에 편입한다 — brand.group(대표 레코드 slug)과 brand.groupBasis 를 다시 계산한다.
// 근거: scripts/lib/groups.mjs 머리말. 편입 근거는 reports/brand-groups.json 에 남긴다.
//
// Usage: node scripts/assign-groups.mjs [--refresh] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED, EXCLUDE, DROP_HEADS, MIN_GROUP_BRANDS } from "./lib/groups.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const CACHE = path.join(ROOT, "reports/wikidata-group-claims.json");
const REPORT = path.join(ROOT, "reports/brand-groups.json");
const REFRESH = process.argv.includes("--refresh");
const DRY = process.argv.includes("--dry");
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const slugOf = b => b.urlSlug || b.slug;
const qidOf = b => b.entityLinks?.wikidata || b.wikidata?.qid || null;
const EVID = fs.existsSync(path.join(ROOT, "reports/brand-group-evidence.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "reports/brand-group-evidence.json"), "utf8")).groups : {};
const cache = !REFRESH && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : { parents: {} };

// 1) P749 — 종료(P582·P576)·deprecated 는 제외
const qids = [...new Set(data.allBrands.map(qidOf).filter(Boolean))].filter(q => !(q in cache.parents));
for (let i = 0; i < qids.length; i += 50) {
  const chunk = qids.slice(i, i + 50);
  let j = null;
  for (let t = 0; t < 4 && !j; t++) {
    const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims&format=json`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(90000) }).catch(() => null);
    if (res?.ok) j = await res.json(); else await new Promise(r => setTimeout(r, 3000 * (t + 1)));
  }
  if (!j) throw new Error("Wikidata 요청 실패 — 캐시에 일부만 저장");
  for (const q of chunk) {
    const e = j.entities?.[q];
    cache.parents[q] = (e?.claims?.P749 || [])
      .filter(c => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value" && !c.qualifiers?.P582 && !c.qualifiers?.P576)
      .map(c => c.mainsnak.datavalue.value.id);
  }
  await new Promise(r => setTimeout(r, 400));
}
if (!DRY) fs.writeFileSync(CACHE, JSON.stringify(cache));

// 2) 편입: 대표 레코드는 P749 자식이 MIN 이상이거나 CURATED 에 있는 사전 레코드
const bySlug = new Map(data.allBrands.map(b => [slugOf(b), b]));
const byQid = new Map(); for (const b of data.allBrands) { const q = qidOf(b); if (q && !byQid.has(q)) byQid.set(q, b); }
const parentOf = b => { const q = qidOf(b); for (const p of cache.parents[q] || []) { const h = byQid.get(p); if (h && h !== b) return h; } return null; };

const skipped = [];
const assign = new Map(); // brand -> {head: slug, basis}
const root = (b) => { const seen = new Set([b]); let c = b; for (;;) { const p = parentOf(c); if (!p || seen.has(p)) return c; seen.add(p); c = p; } };
for (const b of data.allBrands) { if (EXCLUDE.has(slugOf(b))) continue; const r = root(b); if (r !== b) assign.set(b, { head: slugOf(r), basis: `wikidata P749 ${qidOf(b)} → ${qidOf(r)} (현재 값, 종료·deprecated 제외)` }); }
// 확인 목록은 사람이 출처로 확인한 것이므로 P749 자동 편입보다 우선한다.
for (const c of CURATED) {
  if (!bySlug.has(c.head) && !c.name) { console.warn(`! 대표 레코드 없음: ${c.head}`); continue; }
  for (const s of c.include) {
    const b = bySlug.get(s);
    if (!b) { console.warn(`! 레코드 없음: ${c.head}:${s}`); continue; }
    if (slugOf(b) === c.head) continue;
    const ev = EVID[c.head]?.members?.[s];
    if (!ev) { skipped.push(`${c.head}:${s}`); continue; } // 근거 없는 후보는 편입하지 않는다
    assign.set(b, { head: c.head, basis: `${ev.tier}: ${ev.evidence}` });
  }
}
// 대표가 다른 그룹의 구성원이면 상위 그룹으로 접는다(소니 뮤직 → 소니 그룹). 순환은 끊는다. 사업부 대표는 버린다.
const headOf = (h) => { const seen = new Set([h]); let cur = h; for (;;) { const rec = bySlug.get(cur); const up = rec && assign.get(rec)?.head; if (!up || seen.has(up)) return cur; seen.add(up); cur = up; } };
for (const [b, a] of [...assign]) { if (DROP_HEADS.has(a.head)) { assign.delete(b); continue; } const top = headOf(a.head); if (top !== a.head) a.head = top; }
// 산하가 MIN-1 미만인 그룹은 기록하지 않는다(허브는 빌더가 대표 포함 MIN 기준으로 다시 거른다).
const cnt = new Map(); for (const { head } of assign.values()) cnt.set(head, (cnt.get(head) || 0) + 1);
const curatedHeads = new Set(CURATED.map(c => c.head));
let changed = 0;
for (const b of data.allBrands) {
  const a = assign.get(b);
  const keep = a && ((cnt.get(a.head) || 0) >= MIN_GROUP_BRANDS - 1 || curatedHeads.has(a.head));
  const g = keep ? a.head : undefined;
  if (g !== b.group) { changed++; if (g) { b.group = g; b.groupBasis = a.basis; } else { delete b.group; delete b.groupBasis; } }
  else if (g && b.groupBasis !== a.basis) { b.groupBasis = a.basis; }
}
const report = {};
for (const b of data.allBrands) if (b.group) (report[b.group] ??= []).push({ slug: slugOf(b), basis: b.groupBasis });
const sorted = Object.entries(report).sort((x, y) => y[1].length - x[1].length);
fs.writeFileSync(DRY ? "/dev/null" : REPORT, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), counts: Object.fromEntries(sorted.map(([k, v]) => [k, v.length])), members: report }, null, 1));
if (!DRY) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
if (skipped.length) console.log(`근거 없어 제외 ${skipped.length}건: ${skipped.join(" ")}`);
console.log(`groups ${sorted.length}, members ${sorted.reduce((a, [, v]) => a + v.length, 0)}, changed ${changed} | ${sorted.slice(0, 12).map(([k, v]) => `${k}:${v.length}`).join(" ")}`);
