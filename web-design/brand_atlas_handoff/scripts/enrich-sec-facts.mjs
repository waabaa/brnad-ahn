// SEC EDGAR 팩트 보강 — 미국 상장사의 최근 연 매출·상장 시장·티커.
//
// 근거: QID가 확정된 레코드(entityLinks.wikidata)의 Wikidata P5531(SEC CIK)만 쓴다. 이름으로 회사를 찾지 않는다.
// 한 CIK가 여러 브랜드에 걸리면(모회사 CIK가 자회사 브랜드에도 붙은 경우) 어느 쪽에도 쓰지 않는다 —
// 모회사 매출을 자회사 브랜드 페이지에 싣게 되기 때문이다.
//
// 매출: companyfacts(XBRL)의 us-gaap 매출 개념 중 10-K, 기간 340~380일인 값 가운데 가장 최근 결산.
// 결산이 3년보다 오래됐으면(상장 폐지·피인수) 싣지 않는다. 값마다 접수번호(accn)를 남겨 원문 공시로 링크한다.
//
// brand.secFacts = { cik, name, tickers[], exchanges[], revenue?: { usd, end, form, accn, concept }, fetchedAt }
// Usage: node scripts/enrich-sec-facts.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/sec-facts.json");
// SEC는 연락처가 있는 User-Agent를 요구한다(없으면 403).
const UA = "brandatlas-seo/1.1 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const dry = process.argv.includes("--dry");
const REVENUE_CONCEPTS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "SalesRevenueNet",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "RevenuesNetOfInterestExpense",
];
const LEASE_CONCEPTS = ["OperatingLeaseLeaseIncome", "OperatingLeasesIncomeStatementLeaseRevenue", "LessorOperatingLeasePaymentsReceived"];
const MAX_AGE_DAYS = 3 * 365;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getJson(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
      if (res.status === 404) return null;
      if (res.status === 429) { await sleep(5000 * attempt); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(2000 * attempt);
    }
  }
  return null;
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const brands = (data.allBrands || []).filter(b => /^Q\d+$/.test(b.entityLinks?.wikidata || ""));

// 1) QID → CIK (Wikidata P5531)
const cikOf = new Map();
const qids = [...new Set(brands.map(b => b.entityLinks.wikidata))];
for (let i = 0; i < qids.length; i += 50) {
  const ids = qids.slice(i, i + 50).join("|");
  const j = await getJson(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids, props: "claims", format: "json" })}`);
  for (const [qid, ent] of Object.entries(j?.entities || {})) {
    const vals = (ent.claims?.P5531 || []).filter(c => c.rank !== "deprecated").map(c => c.mainsnak?.datavalue?.value).filter(v => /^\d{1,10}$/.test(v || ""));
    const uniq = [...new Set(vals.map(v => v.padStart(10, "0")))];
    if (uniq.length === 1) cikOf.set(qid, uniq[0]);
  }
  await sleep(300);
}

// 2) CIK가 한 브랜드에만 대응하는 경우만
const brandsByCik = new Map();
for (const b of brands) {
  const cik = cikOf.get(b.entityLinks.wikidata);
  if (!cik) continue;
  if (!brandsByCik.has(cik)) brandsByCik.set(cik, []);
  brandsByCik.get(cik).push(b);
}

// 같은 결산일에 여러 개념이 있으면 큰 값을 쓴다 — REIT 등은 RevenueFromContract…가 임대료를 뺀 일부 매출이고
// 총매출은 Revenues에 있다. 세금 포함 개념(IncludingAssessedTax)은 다른 값이 없을 때만 쓴다.
function latestRevenue(facts) {
  const gaap = facts?.facts?.["us-gaap"] || {};
  const byConcept = REVENUE_CONCEPTS.map(concept => {
    let best = null;
    for (const e of gaap[concept]?.units?.USD || []) {
      if (!/^10-K/.test(e.form || "") || !e.start || !e.end || !(e.val > 0)) continue;
      const days = (Date.parse(e.end) - Date.parse(e.start)) / 86400000;
      if (days < 340 || days > 380) continue;
      if (!best || e.end > best.end || (e.end === best.end && e.filed > best.filed)) best = { usd: e.val, end: e.end, form: e.form, accn: e.accn, filed: e.filed, concept };
    }
    return best;
  }).filter(Boolean);
  if (!byConcept.length) return null;
  const end = byConcept.reduce((m, x) => (x.end > m ? x.end : m), "");
  const atEnd = byConcept.filter(x => x.end === end);
  const pool = atEnd.some(x => !/IncludingAssessedTax/.test(x.concept)) ? atEnd.filter(x => !/IncludingAssessedTax/.test(x.concept)) : atEnd;
  const best = pool.reduce((m, x) => (x.usd > m.usd ? x : m));
  // 계약 매출만 있고 임대 수익이 따로 잡힌 회사(REIT 등)는 그 값이 총매출의 일부다 — 합산하지 않고 싣지 않는다.
  if (/^RevenueFromContract/.test(best.concept) && LEASE_CONCEPTS.some(c => (gaap[c]?.units?.USD || []).some(e => e.end === best.end && /^10-K/.test(e.form || "")))) return null;
  if ((Date.now() - Date.parse(best.end)) / 86400000 > MAX_AGE_DAYS) return null;
  const { filed, ...out } = best;
  return out;
}

const fetchedAt = new Date().toISOString().slice(0, 10);
const report = { generatedAt: new Date().toISOString(), qidBrands: brands.length, withCik: 0, sharedCik: [], written: 0, withRevenue: 0, entries: [] };
for (const [cik, list] of brandsByCik) {
  if (list.length > 1) { report.sharedCik.push({ cik, slugs: list.map(b => b.urlSlug || b.slug) }); for (const b of list) delete b.secFacts; continue; }
  report.withCik++;
  const b = list[0];
  const sub = await getJson(`https://data.sec.gov/submissions/CIK${cik}.json`);
  await sleep(150);
  if (!sub) continue;
  const facts = await getJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
  await sleep(150);
  const rec = { cik, name: sub.name, tickers: (sub.tickers || []).slice(0, 3), exchanges: [...new Set((sub.exchanges || []).filter(Boolean))].slice(0, 3), fetchedAt };
  const rev = latestRevenue(facts);
  if (rev) { rec.revenue = rev; report.withRevenue++; }
  b.secFacts = rec;
  report.written++;
  report.entries.push({ slug: b.urlSlug || b.slug, ...rec });
}

// magazine 풀(data.brands) 동기화
const byId = new Map((data.allBrands || []).map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (!src) continue;
  if (src.secFacts) m.secFacts = src.secFacts; else delete m.secFacts;
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`CIK 확정 ${report.withCik} · 기록 ${report.written} · 매출 ${report.withRevenue} · CIK 공유로 제외 ${report.sharedCik.length} → reports/sec-facts.json`);
