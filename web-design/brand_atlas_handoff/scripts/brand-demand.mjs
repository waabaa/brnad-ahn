// 주간 브랜드 수록 후보 선정 — 사람들이 실제로 찾는 순서(2026-09-14, 배포 서버 scripts/server/catalog-job.sh).
//
// 후보 풀: discover-wikidata-brands.mjs --out <pool> (한국어 위키백과 문서가 있는 기업·브랜드 중 미수록)
// 수요 신호 — 셋 다 공개 API로 재는 값이고, 점수는 순위로만 쓴다(단위가 달라 더하지 않는다):
//   국내  네이버 데이터랩 검색어트렌드(최근 3개월). 한 번에 5개 묶음만 비교되므로 기준어(ANCHOR)를 매 요청에 넣어 비율로 환산한다.
//   국외  영문 위키백과 조회수(최근 3개월 합). 구글은 일반 검색량 API가 없다 — 위키백과 조회수가 공개된 가장 가까운 대리 지표다.
//   보조  구글 서치 콘솔 검색어(90일): 우리 사이트가 노출됐는데 해당 브랜드 페이지가 없던 검색어. 맞으면 맨 앞에 둔다.
// 선정: 서치 콘솔 일치분 → 국내 순위와 국외 순위를 번갈아 --pick 개. 수록 단계(import-wikidata-brands.mjs --target)가
//       근거 검증에서 일부를 기각하므로 목표보다 넉넉히 뽑는다.
//
// 출력: <out-dir>/demand.json(근거 전부 — 어드민 '브랜드 수록' 탭이 읽는다), <out-dir>/weekly-candidates.json(수록 입력)
// Usage(서버): node scripts/brand-demand.mjs --pool <file> --out-dir <dir> [--pick 32] [--ledger <file>]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { UA, BLOCK_P31, BUSINESS_PROPS, norm } from "./lib/wikidata-brand.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const POOL = path.resolve(opt("--pool", path.join(ROOT, "reports/brand-candidates.json")));
const OUT = path.resolve(opt("--out-dir", path.join(ROOT, "reports")));
const PICK = Number(opt("--pick", 32));
const LEDGER = opt("--ledger") ? path.resolve(opt("--ledger")) : null;
const PREFILTER = 60;              // 국내·국외 조회수 상위 각 60 → 데이터랩으로 잰다(요청 수 절약)
const ANCHOR = "파타고니아";         // 데이터랩 기준어 — 수록된 브랜드, 계절 편차가 작은 중간 규모 검색어
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

// ── 이미 있거나 처리한 개체 제외 ─────────────────────────────────────
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const have = new Set();
for (const b of data.allBrands) for (const k of [b.name, b.nameKo, b.nameEn, b.slug, b.urlSlug]) if (k) have.add(norm(k));
const haveQid = new Set(data.allBrands.map(b => b.entityLinks?.wikidata).filter(Boolean));
// 공식 사이트 도메인 — QID가 연결되지 않은 기존 레코드와의 중복을 잡는다(2026-09-14 '디올' vs 기존 '크리스챤 디올').
const hostOf = (u) => { try { return new URL(String(u)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const haveHost = new Set(data.allBrands.map(b => hostOf(b.officialWebsite)).filter(h => h && !/wikipedia|wikidata|facebook|instagram/.test(h)));
const done = new Set();
for (const f of [path.join(ROOT, "reports/wikidata-brand-import.json"), LEDGER].filter(Boolean)) {
  if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const x of [...r.added, ...r.rejected]) done.add(x.qid);
}
const koBase = (s) => String(s || "").replace(/\s*\(.*?\)\s*$/, "").trim();
const pool = JSON.parse(fs.readFileSync(POOL, "utf8")).filter(c => !haveQid.has(c.qid) && !done.has(c.qid) && !have.has(norm(koBase(c.ko))));

// ── 위키데이터: 브랜드가 아닌 개체 제외 + 문서 제목 ─────────────────────
async function getJson(url, opts = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { "User-Agent": UA, Accept: "application/json", ...(opts.headers || {}) }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) { await sleep(3000 * (i + 1)); continue; }
      return res.ok ? await res.json() : null;
    } catch { await sleep(2000 * (i + 1)); }
  }
  return null;
}
const ents = [];
for (let i = 0; i < pool.length; i += 50) {
  const ids = pool.slice(i, i + 50).map(c => c.qid).join("|");
  const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=claims|labels|aliases|sitelinks&languages=ko|en&sitefilter=kowiki|enwiki&format=json`);
  for (const c of pool.slice(i, i + 50)) {
    const e = j?.entities?.[c.qid];
    if (!e) continue;
    const p31 = (e.claims?.P31 || []).map(x => x.mainsnak?.datavalue?.value?.id).filter(Boolean);
    if (p31.some(q => BLOCK_P31.has(q))) continue;
    if (!BUSINESS_PROPS.some(k => e.claims?.[k]?.length)) continue;
    const koTitle = e.sitelinks?.kowiki?.title, enTitle = e.sitelinks?.enwiki?.title || "";
    if (!koTitle) continue;
    const en = e.labels?.en?.value || koBase(enTitle);
    if (en && have.has(norm(en))) continue;   // 한글 표기가 달라도 원어로 이미 수록된 개체(도요타·토요타 등)
    // 별칭(Dior ↔ Christian Dior)·공식 사이트 도메인으로도 기존 레코드와 겹치면 뺀다.
    const aliases = ["ko", "en"].flatMap(l => (e.aliases?.[l] || []).map(a => a.value));
    if (aliases.some(a => norm(a).length >= 3 && have.has(norm(a)))) continue;
    const site = (e.claims?.P856 || []).map(x => hostOf(x.mainsnak?.datavalue?.value)).find(Boolean);
    if (site && haveHost.has(site)) continue;
    ents.push({ qid: c.qid, ko: koBase(koTitle), koTitle, enTitle, en, sitelinks: c.sitelinks });
  }
  await sleep(300);
}
console.log(`후보 풀 ${pool.length}건 → 브랜드 개체 ${ents.length}건`);

// ── 위키백과 조회수(ko·en, 최근 3개월 합) — 28일 캐시 ────────────────────
const now = new Date(Date.now() + 9 * 3600e3);
const monthStart = (back) => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)); return d.toISOString().slice(0, 10); };
const [from, to] = [monthStart(3), monthStart(0)];   // 지난 3개의 완결된 달
const lastDay = new Date(Date.parse(to) - 864e5).toISOString().slice(0, 10);
const CACHE = path.join(OUT, "pageviews-cache.json");
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const fresh = (c) => c && Date.now() - Date.parse(c.at) < 28 * 864e5 && c.from === from;
async function views(project, title) {
  if (!title) return 0;
  const t = encodeURIComponent(title.replace(/ /g, "_"));
  const j = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${project}/all-access/user/${t}/monthly/${from.replace(/-/g, "")}00/${lastDay.replace(/-/g, "")}00`);
  return (j?.items || []).reduce((s, x) => s + x.views, 0);
}
let fetched = 0;
const queue = ents.filter(e => !fresh(cache[e.qid]));
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const e = queue.shift();
    cache[e.qid] = { at: new Date().toISOString(), from, ko: await views("ko.wikipedia", e.koTitle), en: await views("en.wikipedia", e.enTitle) };
    if (++fetched % 200 === 0) { console.log(`  조회수 ${fetched}/${ents.length}`); fs.writeFileSync(CACHE, JSON.stringify(cache)); }
  }
}));
fs.writeFileSync(CACHE, JSON.stringify(cache));
for (const e of ents) Object.assign(e, { koViews: cache[e.qid]?.ko || 0, enViews: cache[e.qid]?.en || 0 });

// ── 네이버 데이터랩: 조회수 상위만 잰다 ─────────────────────────────────
const byKo = [...ents].sort((a, b) => b.koViews - a.koViews);
const byEn = [...ents].sort((a, b) => b.enViews - a.enViews);
const measure = [...new Map([...byKo.slice(0, PREFILTER), ...byEn.slice(0, PREFILTER)].map(e => [e.qid, e])).values()];
const errors = [];
let datalabCalls = 0;
const NCP = process.env.NCP_APIGW_KEY_ID && process.env.NCP_APIGW_KEY;
if (!NCP) errors.push("NCP_APIGW_KEY_ID/KEY 미설정 — 국내 순위는 한국어 위키백과 조회수로 대신한다");
for (let i = 0; NCP && i < measure.length; i += 4) {
  const group = measure.slice(i, i + 4);
  const body = { startDate: from, endDate: lastDay, timeUnit: "month",
    keywordGroups: [ANCHOR, ...group.map(e => e.ko)].map((k, n) => ({ groupName: `g${n}`, keywords: [k] })) };
  const j = await getJson("https://naverapihub.apigw.ntruss.com/search-trend/v1/search", {
    method: "POST", body: JSON.stringify(body),
    headers: { "X-NCP-APIGW-API-KEY-ID": process.env.NCP_APIGW_KEY_ID, "X-NCP-APIGW-API-KEY": process.env.NCP_APIGW_KEY, "Content-Type": "application/json" },
  });
  datalabCalls++;
  if (!j?.results) { errors.push(`데이터랩 응답 없음(${group.map(e => e.ko).join(",")})`); continue; }
  const sum = (g) => (j.results.find(r => r.title === g)?.data || []).reduce((s, d) => s + d.ratio, 0);
  const anchor = sum("g0");
  if (anchor > 0) group.forEach((e, n) => { e.naver = Math.round(sum(`g${n + 1}`) / anchor * 1000) / 1000; });
  await sleep(150);
}

// ── 서치 콘솔: 우리 사이트에 노출됐지만 페이지가 없던 검색어 ─────────────────
let gscRows = [];
if (process.env.GSC_DIRECT) {
  const py = "import json,urllib.parse,admin_server as a\nfrom datetime import date,timedelta\ne=date.today()-timedelta(days=2);s=e-timedelta(days=90)\nu='https://www.googleapis.com/webmasters/v3/sites/'+urllib.parse.quote(a.GSC_SITE_URL,safe='')+'/searchAnalytics/query'\nr=a.gsc_call(u,{'startDate':str(s),'endDate':str(e),'dimensions':['query'],'rowLimit':1000}).get('rows',[])\nprint(json.dumps([[x['keys'][0],x['impressions']] for x in r],ensure_ascii=False))";
  try {
    gscRows = JSON.parse(execFileSync(path.join(process.env.GSC_DIRECT, ".venv/bin/python"), ["-c", py], { cwd: process.env.GSC_DIRECT, encoding: "utf8", timeout: 120000 }).trim().split("\n").pop());
  } catch (e) { errors.push(`서치 콘솔 조회 실패: ${String(e.message).slice(0, 120)}`); }
}
for (const e of ents) {
  const keys = [norm(e.ko), e.en.length >= 3 ? norm(e.en) : ""].filter(k => k.length >= 2);
  e.gsc = gscRows.filter(([q]) => keys.some(k => norm(q).includes(k))).reduce((s, [, n]) => s + n, 0);
}

// ── 선정 ────────────────────────────────────────────────────────────
const domestic = [...ents].sort((a, b) => (b.naver ?? -1) - (a.naver ?? -1) || b.koViews - a.koViews);
const global = byEn;
const picked = new Map();
const take = (e, why) => { if (!picked.has(e.qid) && picked.size < PICK) picked.set(e.qid, { ...e, why }); };
for (const e of [...ents].filter(x => x.gsc > 0).sort((a, b) => b.gsc - a.gsc)) take(e, "서치 콘솔");
for (let i = 0; picked.size < PICK && (i < domestic.length || i < global.length); i++) {
  if (domestic[i]) take(domestic[i], "국내");
  if (global[i]) take(global[i], "국외");
}
const selected = [...picked.values()].map(({ qid, ko, en, koTitle, sitelinks, naver, koViews, enViews, gsc, why }) => ({ qid, ko, en, koTitle, sitelinks, naver: naver ?? null, koViews, enViews, gsc, why }));
fs.writeFileSync(path.join(OUT, "weekly-candidates.json"), JSON.stringify(selected.map(s => ({ qid: s.qid, ko: s.koTitle, sitelinks: s.sitelinks, demand: { why: s.why, naver: s.naver, koViews: s.koViews, enViews: s.enViews, gsc: s.gsc } })), null, 1));
fs.writeFileSync(path.join(OUT, "demand.json"), JSON.stringify({
  at: new Date().toISOString(), period: { from, to: lastDay }, anchor: ANCHOR,
  pool: pool.length, entities: ents.length, measured: measure.length, datalabCalls, gscQueries: gscRows.length, errors, selected,
}, null, 1));
console.log(`선정 ${selected.length}건(국내 ${selected.filter(s => s.why === "국내").length} · 국외 ${selected.filter(s => s.why === "국외").length} · 서치 콘솔 ${selected.filter(s => s.why === "서치 콘솔").length}) · 데이터랩 ${datalabCalls}회${errors.length ? ` · 경고 ${errors.length}` : ""}`);
console.log(selected.slice(0, 12).map(s => `${s.ko}(${s.why} n=${s.naver ?? "-"} en=${s.enViews})`).join(", "));
