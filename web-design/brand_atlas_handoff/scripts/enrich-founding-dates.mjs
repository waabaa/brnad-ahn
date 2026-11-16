// 브랜드 탄생일 일괄 보강 → brand.founded {date, precision, sources, checkedAt}
// 근거·판정 규칙은 scripts/lib/founding.mjs 머리말. 원장 reports/founding-dates.json.
//
// 네트워크 조회 결과는 reports/founding-cache.json에 쌓아 두고 재실행 시 이어 간다(--refresh로 무시).
// Usage: node scripts/enrich-founding-dates.mjs [--dry] [--refresh] [--only-missing] [--concurrency 4]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UA, wikidataCandidates, infoboxCandidates, textCandidates, decideFounded, leadWikitext, brandTextYears, infoboxDomain, domainOf, isDisambiguation } from "./lib/founding.mjs";
import { foundedYear } from "./lib/brand-seo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/brand-atlas.json");
const CACHE = path.join(ROOT, "reports/founding-cache.json");
const REPORT = path.join(ROOT, "reports/founding-dates.json");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const REFRESH = process.argv.includes("--refresh");
const ONLY_MISSING = process.argv.includes("--only-missing");
const CONC = Number(arg("--concurrency", 4));
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const brands = data.allBrands;
const cache = !REFRESH && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const saveCache = () => fs.writeFileSync(CACHE, JSON.stringify(cache));

const qidOf = (b) => (b.entityLinks && /^Q\d+$/.test(b.entityLinks.wikidata || "") ? b.entityLinks.wikidata : null);
const targets = brands.filter(b => qidOf(b) && !(cache[b.slug] && cache[b.slug].done) && !(ONLY_MISSING && b.founded && b.founded.checkedAt));
console.log(`전체 ${brands.length} · QID ${brands.filter(qidOf).length} · 조회 대상 ${targets.length}`);

// ① Wikidata P571 + 위키백과 문서 제목(50건씩)
for (let i = 0; i < targets.length; i += 50) {
  const chunk = targets.slice(i, i + 50);
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: chunk.map(qidOf).join("|"), props: "claims|sitelinks", sitefilter: "kowiki|enwiki", format: "json" })}`;
  let j = null;
  for (let a = 1; a <= 4 && !j; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
      if (r.ok) j = await r.json(); else await sleep(5000 * a);
    } catch { await sleep(3000 * a); }
  }
  for (const b of chunk) {
    const e = j?.entities?.[qidOf(b)];
    if (!e) continue;
    cache[b.slug] = { wd: wikidataCandidates(e.claims), ko: e.sitelinks?.kowiki?.title || "", en: e.sitelinks?.enwiki?.title || "" };
  }
  await sleep(400);
}
saveCache();

// ② 정보상자(ko·en 문서 첫 구역) — 호스트별 동시 CONC
const jobs = targets.filter(b => cache[b.slug] && !cache[b.slug].done);
let n = 0;
async function worker() {
  while (jobs.length) {
    const b = jobs.shift(), c = cache[b.slug];
    try {
      c.ib = [];
      for (const lang of ["ko", "en"]) {
        if (!c[lang]) continue;
        c.ib.push(...infoboxCandidates(await leadWikitext(lang, c[lang]), lang));
        await sleep(250);
      }
      c.done = today;
    } catch (e) { c.err = String(e.message || e).slice(0, 80); }
    if (++n % 100 === 0) { saveCache(); console.log(`  정보상자 ${n}/${n + jobs.length}`); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
saveCache();

// ②-b QID가 없는 브랜드 — 표기와 똑같은 제목의 위키백과 문서. 개체 연결(sameAs)에는 쓰지 않고 탄생일 근거로만 쓴다.
// 정보상자 공식 사이트 도메인이 같으면 강한 근거, 확인 못 하면 약한 근거(표시 연도와 맞을 때만 채택).
// 동음이의 문서·도메인이 다른 문서는 버린다.
const noQ = brands.filter(b => !qidOf(b) && !(cache[b.slug] && cache[b.slug].done) && !(ONLY_MISSING && b.founded && b.founded.checkedAt));
console.log(`QID 없는 브랜드 제목 조회 ${noQ.length}`);
async function titleWorker() {
  while (noQ.length) {
    const b = noQ.shift(), c = (cache[b.slug] = { ib: [], byTitle: true });
    const site = domainOf(b.facts?.officialWebsite || b.officialWebsite);
    try {
      for (const [lang, t] of [["ko", /[가-힣]/.test(b.nameKo || "") ? b.nameKo : ""], ["en", b.nameEn || ""]]) {
        if (!t) continue;
        const wt = await leadWikitext(lang, t);
        await sleep(250);
        if (!wt || isDisambiguation(wt)) continue;
        const dom = infoboxDomain(wt);
        if (site && dom && dom !== site && !dom.endsWith(`.${site}`) && !site.endsWith(`.${dom}`)) { c[`${lang}Skip`] = `도메인 ${dom}≠${site}`; continue; }
        // 정보상자 공식 사이트가 수록 레코드의 공식 사이트와 같으면 같은 개체로 보고 강한 근거로 쓴다(P856 일치 규칙과 같은 기준).
        const verified = !!(site && dom && (dom === site || dom.endsWith(`.${site}`) || site.endsWith(`.${dom}`)));
        c.ib.push(...infoboxCandidates(wt, lang).map(x => ({ ...x, source: `${lang}wiki`, weak: !verified, title: t, ...(verified ? { verified: "domain" } : {}) })));
      }
      c.done = today;
    } catch (e) { c.err = String(e.message || e).slice(0, 80); }
    if (++n % 100 === 0) { saveCache(); console.log(`  제목 조회 ${n}`); }
  }
}
await Promise.all(Array.from({ length: CONC }, titleWorker));
saveCache();

// ③ 판정 — 표시 연도는 founded 없이 계산한 값(자기 참조 방지)
const report = { generatedAt: today, adopted: 0, day: 0, month: 0, bySource: {}, byMonth: {}, rejected: {}, items: [] };
for (const b of brands) {
  const c = cache[b.slug] || {};
  const cands = [...(c.wd || []), ...(c.ib || []), ...textCandidates(b)];
  const prev = b.founded; delete b.founded;
  const year = foundedYear(b);
  const { founded, why } = decideFounded(cands, year, brandTextYears(b));
  if (founded) {
    b.founded = { ...founded, checkedAt: today };
    report.adopted++; report[founded.precision]++;
    for (const s of founded.sources) report.bySource[s] = (report.bySource[s] || 0) + 1;
    const mo = founded.date.slice(5, 7); report.byMonth[mo] = (report.byMonth[mo] || 0) + 1;
    report.items.push({ slug: b.slug, date: founded.date, sources: founded.sources, note: why || undefined });
  } else {
    if (cands.length) { report.rejected[why] = (report.rejected[why] || 0) + 1; report.items.push({ slug: b.slug, rejected: why, cands: cands.map(x => `${x.source}:${x.y}-${x.m}${x.d ? "-" + x.d : ""}`) }); }
    if (prev && ONLY_MISSING) b.founded = prev;
  }
}
console.log(`채택 ${report.adopted}곳 (일 ${report.day} · 월 ${report.month}) · 출처 ${JSON.stringify(report.bySource)}`);
console.log(`월별 ${JSON.stringify(Object.fromEntries(Object.entries(report.byMonth).sort()))}`);
console.log(`기각 ${JSON.stringify(report.rejected)}`);
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
if (!DRY) fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
