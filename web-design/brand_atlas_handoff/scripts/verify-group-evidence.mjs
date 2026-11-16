// CURATED 후보(lib/groups.mjs)의 멤버마다 근거를 찾아 reports/brand-group-evidence.json 에 남긴다.
// assign-groups.mjs 는 근거가 있는 멤버만 편입한다 — 근거 없는 후보는 버린다.
//
// 근거 단계(앞이 강하다):
//   wikidata   멤버 QID 에서 현재(종료·deprecated 아님) P749/P127 을 3단계까지 따라 그룹 대표 QID 에 닿는다
//   wikipedia  멤버 문서의 도입부(한국어·영어)에 그룹 이름이 적혀 있다 — 인용문을 함께 남긴다
// 이름 유사도로 문서를 찾지 않는다: 문서 제목은 사전의 표기와 정확히 일치하는 것만 쓰고, 도입부에 그룹 이름이 없으면 기각한다.
//
// Usage: node scripts/verify-group-evidence.mjs [--only <head>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED } from "./lib/groups.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "reports/brand-group-evidence.json");
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const slugOf = b => b.urlSlug || b.slug;
const qidOf = b => b.entityLinks?.wikidata || b.wikidata?.qid || null;
const bySlug = new Map(data.allBrands.map(b => [slugOf(b), b]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { groups: {} };

async function getJson(url) {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) }).catch(() => null);
    if (r?.ok) return r.json();
    await sleep(3000 * (t + 1));
  }
  return null;
}
const ent = {};
async function load(ids) {
  ids = [...new Set(ids)].filter(i => i && !ent[i]);
  for (let i = 0; i < ids.length; i += 50) {
    const j = await getJson("https://www.wikidata.org/w/api.php?" + new URLSearchParams({ action: "wbgetentities", format: "json", ids: ids.slice(i, i + 50).join("|"), props: "claims", languages: "ko|en" }));
    Object.assign(ent, j?.entities || {});
    await sleep(250);
  }
}
const own = q => { const o = []; for (const p of ["P749", "P127"]) for (const c of ent[q]?.claims?.[p] || []) { if (c.rank === "deprecated" || c.mainsnak?.snaktype !== "value" || c.qualifiers?.P582 || c.qualifiers?.P576) continue; o.push(c.mainsnak.datavalue.value.id); } return o; };
const chain = (q, target) => { const seen = new Set([q]); let f = [q]; for (let d = 0; d < 3; d++) { const n = []; for (const x of f) for (const o of own(x)) { if (o === target) return true; if (!seen.has(o)) { seen.add(o); n.push(o); } } f = n; } return false; };

const groups = CURATED.filter(c => !only || c.head === only);
// 위키데이터 단계
const ids = new Set();
for (const c of groups) { const h = bySlug.get(c.head); if (h && qidOf(h)) ids.add(qidOf(h)); for (const s of c.include) { const b = bySlug.get(s); if (b && qidOf(b)) ids.add(qidOf(b)); } }
await load([...ids]);
let layer = new Set(); for (const q of ids) for (const o of own(q)) layer.add(o);
for (let d = 0; d < 2; d++) { await load([...layer]); const nx = new Set(); for (const q of layer) for (const o of own(q)) nx.add(o); layer = nx; }

// 위키백과 도입부
async function intro(lang, title) {
  const j = await getJson(`https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({ action: "query", format: "json", prop: "extracts", exintro: "1", explaintext: "1", redirects: "1", titles: title }));
  const p = j?.query?.pages && Object.values(j.query.pages)[0];
  return p && !p.missing ? { title: p.title, text: String(p.extract || "").replace(/\s+/g, " ") } : null;
}
// 그룹 이름 근처에 소속·소유·운영 관계를 나타내는 표현이 있어야 한다
const REL = /계열|자회사|소속|산하|소유|브랜드|부문|사업부|인수|합병|편입|생산|제조|운영|발매|판매|지주|그룹의|subsidiary|owned|division|brand of|brands of|part of|unit of|acquired|belongs|label of|arm of|produced by|manufactured by|operated by|operates|a brand|house of|maison|portfolio/;
const lc = s => String(s || "").toLowerCase();
const nameKeys = (b, c) => [...new Set([c.name, b?.nameKo, b?.koreanName, b?.nameEn, b?.name, c.head.replace(/-/g, " ")].filter(x => x && x.length >= 2).map(lc))];
const aliasOf = c => [...(c.aliases || [])].map(lc);

const result = { generatedAt: new Date().toISOString().slice(0, 10), groups: { ...prev.groups } };
for (const c of groups) {
  const h = bySlug.get(c.head), hq = h && qidOf(h);
  const heads = [...nameKeys(h, c), ...aliasOf(c)];
  const g = { source: c.source, members: {} };
  for (const s of c.include) {
    const b = bySlug.get(s); if (!b) continue;
    const q = qidOf(b);
    if (hq && q && chain(q, hq)) { g.members[s] = { tier: "wikidata", evidence: `${q} → ${hq} (P749/P127, 현재)` }; continue; }
    // 위키백과: 사전 표기와 정확히 일치하는 문서 제목만
    const tries = [["ko", b.nameKo || b.koreanName], ["en", b.nameEn], ["en", b.name], ["ko", b.name]].filter(([, t]) => t && t.length >= 2);
    let hit = null;
    for (const [lang, title] of tries) {
      const it = await intro(lang, title); await sleep(150);
      if (!it) continue;
      if (/는 다음 뜻을|may refer to|동음이의/.test(it.text.slice(0, 200))) continue; // 동음이의 문서
      const t = lc(it.text), ti = lc(it.title);
      let found = null;
      for (const k of heads) {
        for (let i = t.indexOf(k); i >= 0 && !found; i = t.indexOf(k, i + 1)) {
          if (ti.includes(k) && i < ti.length + 12) continue; // 문서 제목 자체에 들어 있는 이름은 근거가 아니다
          const win = t.slice(Math.max(0, i - 60), i + k.length + 60);
          if (REL.test(win)) found = { k, i };
        }
        if (found) break;
      }
      if (found) { const { k, i } = found; hit = { tier: "wikipedia", evidence: `${lang}.wikipedia "${it.title}": …${it.text.slice(Math.max(0, i - 50), i + k.length + 40)}…` }; break; }
    }
    if (hit) g.members[s] = hit;
  }
  result.groups[c.head] = g;
  console.log(`${c.head}: ${Object.keys(g.members).length}/${c.include.length} 근거 확보 — 탈락: ${c.include.filter(s => !g.members[s]).join(", ") || "없음"}`);
}
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
