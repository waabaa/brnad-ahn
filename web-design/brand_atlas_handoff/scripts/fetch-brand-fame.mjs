// 브랜드 인지도 지표 — QID가 확정된 브랜드(entityLinks.wikidata)의 위키백과 언어판 수(sitelinks)를 data/brand-fame.json 에 쓴다.
// 국가·산업 허브의 '대표 브랜드' 순서에 쓴다(데이터 품질 점수 byScore 는 자료가 풍부한 순이지 유명한 순이 아니다).
// 박물관·대학·도서관·학회·중앙은행·정부기관 같은 기관(P31 기준)은 inst 로 표시해 '대표 브랜드'에서 뺀다.
// 2026-11-07. Usage: node scripts/fetch-brand-fame.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data/brand-fame.json");
const UA = { "User-Agent": "BrandAtlasBot/1.0 (https://brandatlas.co.kr)" };
const brands = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8")).allBrands;
const byQid = new Map();
for (const b of brands) { const q = b.entityLinks?.wikidata; if (q) byQid.set(q, [...(byQid.get(q) || []), b.urlSlug || b.slug]); }
const qids = [...byQid.keys()];
const INST = new Set(["Q33506", "Q207694", "Q17431399", "Q1007870", "Q3918", "Q875538", "Q902104", "Q15936437", "Q7075", "Q22806", "Q955824", "Q66344", "Q327333", "Q163740", "Q2385804", "Q31855", "Q1664720", "Q484652", "Q1802419", "Q16917", "Q11707", "Q1137809", "Q7210356", "Q43501", "Q4671277", "Q38723", "Q3152824", "Q1371037", "Q1774898"]);
const fame = {};
for (let i = 0; i < qids.length; i += 50) {
  const ids = qids.slice(i, i + 50).join("|");
  let j = null;
  for (let t = 0; t < 4 && !j; t++) {
    try { j = await (await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks|claims&ids=${ids}`, { headers: UA, signal: AbortSignal.timeout(30000) })).json(); }
    catch { await new Promise(r => setTimeout(r, 3000)); }
  }
  for (const [q, e] of Object.entries(j?.entities || {})) {
    const n = Object.keys(e.sitelinks || {}).filter(k => k.endsWith("wiki") && k !== "commonswiki").length;
    const inst = (e.claims?.P31 || []).some(c => INST.has(c.mainsnak?.datavalue?.value?.id));
    for (const s of byQid.get(q) || []) fame[s] = inst ? { n, inst: true } : n;
  }
  await new Promise(r => setTimeout(r, 400));
}
const sorted = Object.fromEntries(Object.entries(fame).sort((a, b) => a[0].localeCompare(b[0])));
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 0) + "\n");
console.log(`brand-fame: ${Object.keys(sorted).length}개 브랜드 (QID ${qids.length})`);
