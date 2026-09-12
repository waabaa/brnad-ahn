// 브랜드를 컬렉션(scripts/lib/collections.mjs)에 편입한다 — brand.collections 를 다시 계산한다.
//
// 근거는 두 가지뿐이다:
//   1) QID가 확정된 레코드(entityLinks.wikidata / wikidata.qid)의 Wikidata P31(P279* 포함)·P452
//   2) 컬렉션의 include 목록(QID 없는 레코드를 사람이 확인해 넣은 slug)
// 이름·설명 키워드로 추정해 넣지 않는다 — 동명이의 개체가 섞인다(로고 감사 2026-09-12 참조).
// 편입 근거는 reports/collections.json 에 브랜드별로 남긴다.
//
// Usage: node scripts/assign-collections.mjs [--refresh] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTIONS } from "./lib/collections.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const CACHE = path.join(ROOT, "reports/wikidata-collection-claims.json");
const REPORT = path.join(ROOT, "reports/collections.json");
const REFRESH = process.argv.includes("--refresh");
const DRY = process.argv.includes("--dry");
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const slugOf = b => b.urlSlug || b.slug;
const qidOf = b => b.entityLinks?.wikidata || b.wikidata?.qid || null;
const cache = !REFRESH && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : { claims: {}, subclasses: {} };

async function getJson(url, init = {}) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(90000) }).catch(() => null);
    if (res?.ok) return res.json();
    await new Promise(r => setTimeout(r, 3000 * (i + 1)));
  }
  throw new Error(`요청 실패: ${url.slice(0, 80)}`);
}

// 1) 우리 QID의 P31·P452
const qids = [...new Set(data.allBrands.map(qidOf).filter(Boolean))].filter(q => !cache.claims[q]);
for (let i = 0; i < qids.length; i += 50) {
  const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.slice(i, i + 50).join("|")}&props=claims&format=json`);
  for (const [q, e] of Object.entries(j.entities || {})) {
    const vals = p => (e.claims?.[p] || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
    cache.claims[q] = { p31: vals("P31"), p452: vals("P452") };
  }
  await new Promise(r => setTimeout(r, 400));
}

// 2) 각 클래스의 하위 클래스 전체(P279*)
for (const cls of new Set(COLLECTIONS.flatMap(c => c.p31))) {
  if (cache.subclasses[cls]) continue;
  const q = `SELECT ?c WHERE { ?c wdt:P279* wd:${cls} . }`;
  const j = await getJson("https://query.wikidata.org/sparql", { method: "POST", headers: { Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ query: q }) });
  cache.subclasses[cls] = j.results.bindings.map(r => r.c.value.split("/").pop());
  await new Promise(r => setTimeout(r, 1000));
}
fs.writeFileSync(CACHE, JSON.stringify(cache));

// 3) 편입
const classSets = new Map(COLLECTIONS.map(c => [c.slug, new Set(c.p31.flatMap(cls => cache.subclasses[cls] || [cls]))]));
const report = {};
const counts = Object.fromEntries(COLLECTIONS.map(c => [c.slug, 0]));
for (const b of data.allBrands) {
  const q = qidOf(b);
  const cl = q ? cache.claims[q] : null;
  const got = [];
  for (const c of COLLECTIONS) {
    let why = null;
    if ((c.exclude || []).includes(slugOf(b))) continue;
    if (cl) {
      const p31 = cl.p31.find(x => classSets.get(c.slug).has(x));
      const p452 = cl.p452.find(x => c.p452.includes(x));
      if (p31) why = `wikidata ${q} P31=${p31}`;
      else if (p452) why = `wikidata ${q} P452=${p452}`;
    }
    if (!why && (c.include || []).includes(slugOf(b))) why = "include(수동 확인)";
    if (why) { got.push(c.slug); (report[slugOf(b)] ||= []).push({ collection: c.slug, why }); counts[c.slug]++; }
  }
  if (got.length) b.collections = got; else delete b.collections;
}
const unknownInclude = COLLECTIONS.flatMap(c => (c.include || []).filter(s => !data.allBrands.some(b => slugOf(b) === s)).map(s => `${c.slug}:${s}`));
if (unknownInclude.length) console.warn("include에 없는 slug:", unknownInclude.join(", "));
console.log(counts);
fs.writeFileSync(REPORT, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), counts, members: report }, null, 1));
if (!DRY) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
