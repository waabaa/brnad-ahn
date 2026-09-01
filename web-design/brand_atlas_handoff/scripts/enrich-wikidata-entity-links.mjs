// Wikidata 엔티티 연결 (sameAs) — 공식 웹사이트 URL 완전 일치로만 확인한다.
//
// 왜 이름 매칭을 쓰지 않는가: "토스"·"오메가"·"아틀라스"처럼 동명 개체가 흔하고,
// 잘못 연결된 sameAs는 검색엔진에 "이 페이지는 다른 회사를 설명한다"고 말하는 것과
// 같다. Wikidata P856(공식 웹사이트)이 브랜드의 officialWebsite와 문자열로 완전히
// 일치할 때만 QID를 채택한다. 근거가 없으면 아무것도 쓰지 않는다.
//
// Usage: node scripts/enrich-wikidata-entity-links.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const OUT_PATH = path.join(ROOT, "reports/wikidata-entity-links.json");
const ENDPOINT = "https://query.wikidata.org/sparql";
const UA = "brandatlas-seo/1.0 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const dry = process.argv.includes("--dry");

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const BRANDS = DATA.allBrands || [];

const siteOf = (b) => String((b.facts && b.facts.officialWebsite) || b.officialWebsite || "").trim();

/** P856 값의 표기 흔들림(프로토콜·www·후행 슬래시)을 흡수할 후보 URL 집합. */
function variants(raw) {
  let u;
  try { u = new URL(raw); } catch { return []; }
  if (!/^https?:$/.test(u.protocol)) return [];
  const host = u.hostname.replace(/^www\./, "");
  const pathPart = u.pathname.replace(/\/+$/, "");
  const out = new Set();
  for (const scheme of ["https", "http"]) {
    for (const h of [host, `www.${host}`]) {
      out.add(`${scheme}://${h}${pathPart}`);
      out.add(`${scheme}://${h}${pathPart}/`);
    }
  }
  return [...out];
}

async function sparql(query) {
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);
  return (await res.json()).results.bindings;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt === 4) throw e;
      console.warn(`  retry ${attempt} (${label}): ${e.message}`);
      await sleep(3000 * attempt);
    }
  }
}

// ---- 1) 공식 웹사이트 → QID ----
const urlToBrands = new Map();   // 후보 URL → [brand]
const candidates = [];
for (const b of BRANDS) {
  const site = siteOf(b);
  if (!site) continue;
  const vs = variants(site);
  if (!vs.length) continue;
  for (const v of vs) {
    if (!urlToBrands.has(v)) { urlToBrands.set(v, []); candidates.push(v); }
    urlToBrands.get(v).push(b);
  }
}
console.log(`officialWebsite 보유 브랜드 기준 후보 URL ${candidates.length}개`);

const qidsOfBrand = new Map();   // slug → Set(QID)
const brandsOfQid = new Map();   // QID → Set(slug)
const CHUNK = 150;
for (let i = 0; i < candidates.length; i += CHUNK) {
  const chunk = candidates.slice(i, i + CHUNK);
  const values = chunk.map(u => `<${u.replace(/[<>"\\]/g, "")}>`).join(" ");
  const q = `SELECT ?item ?site WHERE { VALUES ?site { ${values} } ?item wdt:P856 ?site . }`;
  const rows = await withRetry(() => sparql(q), `chunk ${i}`);
  for (const r of rows) {
    const qid = r.item.value.split("/").pop();
    for (const b of urlToBrands.get(r.site.value) || []) {
      const slug = b.urlSlug || b.slug;
      if (!qidsOfBrand.has(slug)) qidsOfBrand.set(slug, new Set());
      qidsOfBrand.get(slug).add(qid);
      if (!brandsOfQid.has(qid)) brandsOfQid.set(qid, new Set());
      brandsOfQid.get(qid).add(slug);
    }
  }
  process.stdout.write(`\r  P856 조회 ${Math.min(i + CHUNK, candidates.length)}/${candidates.length} → 후보 QID ${brandsOfQid.size}건`);
  await sleep(400);
}
console.log("");

// ---- 2) 후보 QID의 레이블 + 위키백과 sitelink ----
const allQids = [...brandsOfQid.keys()];
console.log(`후보 QID ${allQids.length}개의 레이블·위키백과 링크 조회`);
const links = new Map();         // QID → { ko, en, labelKo, labelEn }
for (let i = 0; i < allQids.length; i += CHUNK) {
  const chunk = allQids.slice(i, i + CHUNK);
  const values = chunk.map(q => `wd:${q}`).join(" ");
  const q = `SELECT ?item ?ko ?en ?labelKo ?labelEn WHERE {
    VALUES ?item { ${values} }
    OPTIONAL { ?ko schema:about ?item ; schema:isPartOf <https://ko.wikipedia.org/> }
    OPTIONAL { ?en schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
    OPTIONAL { ?item rdfs:label ?labelKo FILTER(LANG(?labelKo)="ko") }
    OPTIONAL { ?item rdfs:label ?labelEn FILTER(LANG(?labelEn)="en") }
  }`;
  const rows = await withRetry(() => sparql(q), `sitelinks ${i}`);
  for (const r of rows) {
    const qid = r.item.value.split("/").pop();
    const cur = links.get(qid) || {};
    if (r.ko) cur.ko = r.ko.value;
    if (r.en) cur.en = r.en.value;
    if (r.labelKo) cur.labelKo = r.labelKo.value;
    if (r.labelEn) cur.labelEn = r.labelEn.value;
    links.set(qid, cur);
  }
  process.stdout.write(`\r  레이블 조회 ${Math.min(i + CHUNK, allQids.length)}/${allQids.length}`);
  await sleep(400);
}
console.log("");

// ---- 2-a) 조직·브랜드 개체만 남긴다 ----
// 같은 공식 웹사이트가 회사와 창업자(랄프 로런), 회사와 사옥(Rolex Palace, Volvo
// Halifax Assembly)에 동시에 걸려 있는 경우가 있다. 사람·건물을 브랜드로 연결하면
// 검색엔진에 잘못된 개체를 선언하게 되므로, 조직/브랜드 하위 클래스만 남긴다.
const orgQids = new Set();
for (let i = 0; i < allQids.length; i += CHUNK) {
  const chunk = allQids.slice(i, i + CHUNK);
  const values = chunk.map(q => `wd:${q}`).join(" ");
  const q = `SELECT DISTINCT ?item WHERE {
    VALUES ?item { ${values} }
    ?item wdt:P31/wdt:P279* ?cls .
    VALUES ?cls { wd:Q43229 wd:Q431289 wd:Q4830453 wd:Q2424752 wd:Q1002697 }
  }`;
  const rows = await withRetry(() => sparql(q), `org ${i}`);
  for (const r of rows) orgQids.add(r.item.value.split("/").pop());
  process.stdout.write(`\r  개체 유형 조회 ${Math.min(i + CHUNK, allQids.length)}/${allQids.length} → 조직·브랜드 ${orgQids.size}건`);
  await sleep(400);
}
console.log("");

// ---- 2-b) 개체 확정 ----
// P856이 같아도 개체가 하나로 좁혀지지 않는 경우가 있다. 실제로 intel.com에는 인텔
// 외에 다른 항목이 물려 있었고, 먼저 조회된 QID를 쓰면 "Flea"가 인텔로 발행된다.
// 따라서 (a) 한 QID가 여러 브랜드에 걸리면 버리고, (b) 남은 후보 중 레이블이
// 브랜드명과 일치하는 것만 채택한다. 하나로 좁혀지지 않으면 아무것도 쓰지 않는다.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
function labelMatches(qid, brand) {
  const l = links.get(qid) || {};
  const names = [brand.name, brand.nameEn, brand.nameKo].map(norm).filter(n => n.length >= 2);
  const labels = [l.labelEn, l.labelKo].map(norm).filter(Boolean);
  if (!labels.length) return false;
  return labels.some(lab => names.some(n =>
    lab === n || (n.length >= 4 && lab.startsWith(n)) || (lab.length >= 4 && n.startsWith(lab))));
}

function labelExact(qid, brand) {
  const l = links.get(qid) || {};
  const names = new Set([brand.name, brand.nameEn, brand.nameKo].map(norm).filter(n => n.length >= 2));
  return [l.labelEn, l.labelKo].map(norm).filter(Boolean).some(lab => names.has(lab));
}
const hasWiki = (qid) => { const l = links.get(qid) || {}; return Boolean(l.ko || l.en); };

const qidOfBrand = new Map();
const rejected = [];
const detail = (q) => ({ qid: q, labelEn: (links.get(q) || {}).labelEn || null, labelKo: (links.get(q) || {}).labelKo || null });
for (const b of BRANDS) {
  const slug = b.urlSlug || b.slug;
  const all = [...(qidsOfBrand.get(slug) || [])];
  if (!all.length) continue;
  const reject = (reason, list) => rejected.push({ slug, name: b.name, reason, cands: list.map(detail) });

  // ① 한 QID가 여러 브랜드에 걸리면 개체가 특정되지 않는다  ② 조직·브랜드만  ③ 레이블 일치
  const cands = all.filter(q => (brandsOfQid.get(q) || new Set()).size === 1 && orgQids.has(q));
  if (!cands.length) { reject("조직·브랜드 개체가 아니거나 QID가 여러 브랜드에 공유됨", all); continue; }
  const matched = cands.filter(q => labelMatches(q, b));
  if (matched.length === 0) { reject("레이블이 브랜드명과 일치하지 않음", cands); continue; }
  if (matched.length === 1) { qidOfBrand.set(slug, matched[0]); continue; }

  // 후보가 남으면 ④ 레이블 완전 일치 → ⑤ 위키백과 문서 보유 순으로 좁힌다.
  // 그래도 하나로 좁혀지지 않으면 아무것도 쓰지 않는다.
  const exact = matched.filter(q => labelExact(q, b));
  const narrowed = exact.length ? exact : matched;
  if (narrowed.length === 1) { qidOfBrand.set(slug, narrowed[0]); continue; }
  const withWiki = narrowed.filter(hasWiki);
  if (withWiki.length === 1) { qidOfBrand.set(slug, withWiki[0]); continue; }
  reject("후보가 하나로 좁혀지지 않음", narrowed);
}
console.log(`개체 확정 ${qidOfBrand.size}건 / 후보 보유 ${qidsOfBrand.size}건 (기각 ${rejected.length})`);

// ---- 3) 데이터에 기록 ----
let applied = 0, withKo = 0, withEn = 0;
const report = [];
for (const b of BRANDS) {
  const slug = b.urlSlug || b.slug;
  const qid = qidOfBrand.get(slug);
  if (!qid) { if (b.entityLinks) delete b.entityLinks; continue; }
  const l = links.get(qid) || {};
  const sameAs = [`https://www.wikidata.org/wiki/${qid}`];
  if (l.ko) { sameAs.push(l.ko); withKo++; }
  if (l.en) { sameAs.push(l.en); withEn++; }
  b.entityLinks = { wikidata: qid, sameAs, source: "wikidata P856 exact match" };
  applied++;
  report.push({ slug, name: b.name, qid, officialWebsite: siteOf(b), labelKo: l.labelKo || null, labelEn: l.labelEn || null, sameAs });
}

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  method: "Wikidata SPARQL, P856 (official website) exact URL match; ambiguous QIDs dropped",
  brandsWithOfficialWebsite: BRANDS.filter(b => siteOf(b)).length,
  matched: applied, withKoWikipedia: withKo, withEnWikipedia: withEn,
  rejected: rejected.length, rejectedEntries: rejected,
  entries: report,
}, null, 1));

if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(DATA));
console.log(`entityLinks 적용 ${applied}건 (ko위키 ${withKo}, en위키 ${withEn})${dry ? " [dry-run, 데이터 미저장]" : ""} → reports/wikidata-entity-links.json`);
