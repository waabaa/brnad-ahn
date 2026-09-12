// 수록되지 않은 브랜드 후보를 Wikidata에서 찾는다(추가는 하지 않는다).
//
// 채택 조건: ① 한국어 위키백과 문서가 있다(= 한글 표기가 실재한다. 음차를 만들지 않는다)
//            ② 조직·브랜드 개체다 ③ 우리 데이터에 이름·slug 어느 것으로도 없다
// 결과: reports/brand-candidates.json  (import-wikidata-brands.mjs 가 읽는다)
//
// --collection <slug>: 컬렉션(scripts/lib/collections.mjs)의 Wikidata 기준(P31/P279*·P452)에 맞는 개체만,
//   인지도(sitelinks) 순으로 --top 개까지 찾는다. 결과 후보에 collection 을 적어 둔다.
//
// Usage: node scripts/discover-wikidata-brands.mjs [--min-global 22] [--min-kr 3]
//        node scripts/discover-wikidata-brands.mjs --collection ai [--top 40] [--min 8]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTION_BY_SLUG } from "./lib/collections.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const MIN_GLOBAL = Number(opt("--min-global", 22));
const MIN_KR = Number(opt("--min-kr", 3));
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
// 주의: NFKD를 쓰면 한글 음절이 자모로 분해돼 [가-힣]에서 전부 탈락한다(중복 판정이 무력화됨).
// 라틴 문자의 발음기호만 제거하고 한글은 NFC로 유지한다.
const norm = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/&/g, " and ").replace(/\s*\(.*?\)\s*/g, "").replace(/[^\p{Script=Hangul}\p{Letter}\p{Number}]+/gu, "").replace(/[\u0300-\u036f]/g, "").trim();
const have = new Set();
for (const b of data.allBrands) for (const k of [b.name, b.nameKo, b.nameEn, b.slug, b.urlSlug]) if (k) have.add(norm(k));
const haveQid = new Set(data.allBrands.map(b => b.entityLinks?.wikidata).filter(Boolean));

// 클래스: 기업(Q4830453), 브랜드(Q431289), 소매체인(Q507619), 상표(Q167270)
const CLASSES = ["wd:Q4830453", "wd:Q431289", "wd:Q507619", "wd:Q167270"];
function sparql(where, limit, offset) {
  // OPTIONAL 조인(로고·공식사이트·국가 레이블)은 WDQS 60초 제한을 넘긴다. 여기서는 개체만 고르고
  // 나머지 팩트는 import 단계에서 wbgetentities로 한 건씩 가져온다.
  return `SELECT ?item ?ko ?sitelinks WHERE {
  ?art schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> ; schema:name ?ko .
  ?item wikibase:sitelinks ?sitelinks .
  ${where}
} ORDER BY DESC(?sitelinks) LIMIT ${limit}${offset ? ` OFFSET ${offset}` : ""}`;
}
async function run(query) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ query }),
      signal: AbortSignal.timeout(120000),
    }).catch(() => null);
    if (res?.ok) return (await res.json()).results.bindings;
    await new Promise(r => setTimeout(r, 4000 * (i + 1)));
  }
  console.warn("SPARQL 실패(건너뜀)");
  return [];
}

const rows = [];
const COLL = opt("--collection") ? COLLECTION_BY_SLUG.get(opt("--collection")) : null;
if (opt("--collection") && !COLL) throw new Error(`컬렉션 없음: ${opt("--collection")}`);
if (COLL) {
  const min = Number(opt("--min", 8));
  const parts = [
    ...COLL.p31.map(q => `{ ?item wdt:P31/wdt:P279* wd:${q} . }`),
    ...COLL.p452.map(q => `{ ?item wdt:P452 wd:${q} . }`),
  ];
  rows.push(...await run(sparql(`${parts.join(" UNION ")} FILTER(?sitelinks >= ${min})`, 400, 0)));
  console.log(`${COLL.slug}: Wikidata 일치 ${rows.length}건`);
}
for (const cls of COLL ? [] : CLASSES) {
  for (let off = 0; off < 1200; off += 600) {
    const kr = await run(sparql(`?item wdt:P31/wdt:P279* ${cls} ; wdt:P17 wd:Q884 . FILTER(?sitelinks >= ${MIN_KR})`, 600, off));
    rows.push(...kr);
    if (kr.length < 600) break;
  }
  console.log(`${cls} 한국 누적 ${rows.length}`);
  for (let off = 0; off < 1200; off += 600) {
    const g = await run(sparql(`?item wdt:P31/wdt:P279* ${cls} . FILTER(?sitelinks >= ${MIN_GLOBAL})`, 600, off));
    rows.push(...g);
    if (g.length < 600) break;
  }
  console.log(`${cls} 글로벌 누적 ${rows.length}`);
}

const byQid = new Map();
for (const r of rows) {
  const qid = r.item.value.split("/").pop();
  const ko = r.ko.value;
  if (haveQid.has(qid)) continue;
  if (/^분류:|^틀:/.test(ko)) continue;
  byQid.set(qid, byQid.get(qid) || { qid, ko, sitelinks: Number(r.sitelinks.value), ...(COLL ? { collection: COLL.slug } : {}) });
}
const koBase = (s) => s.replace(/\s*\(.*?\)\s*$/, "").trim();
const candidates = [...byQid.values()]
  .filter(c => !have.has(norm(koBase(c.ko))))
  .sort((a, b) => b.sitelinks - a.sitelinks);
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
const TOP = Number(opt("--top", 0)) || Infinity;
const out = candidates.slice(0, TOP);
// 컬렉션 모드는 다른 컬렉션 후보와 합쳐 둔다(import 가 한 번에 읽는다).
const outPath = path.join(ROOT, COLL ? "reports/collection-candidates.json" : "reports/brand-candidates.json");
const merged = COLL && fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")).filter(c => c.collection !== COLL.slug) : [];
fs.writeFileSync(outPath, JSON.stringify([...merged, ...out], null, 1));
console.log(`후보 ${candidates.length}건 (전체 ${byQid.size}, 이미 수록 제외) → ${path.relative(ROOT, outPath)} (${out.length}건 기록)`);
console.log(out.slice(0, 40).map(c => `${c.ko} ${c.sitelinks}`).join(", "));
