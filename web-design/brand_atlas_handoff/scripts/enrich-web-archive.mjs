// 인터넷 아카이브(Wayback Machine) 첫 보관 기록 — 공식 사이트가 웹에 처음 보관된 날과 그 사본 링크.
//
// 사실 범위: "인터넷 아카이브가 이 도메인의 첫 화면을 처음 보관한 날"이다. 사이트 개설일이 아니므로 페이지에도
// 그렇게 적는다. 사본 링크를 함께 실어 독자가 직접 확인할 수 있다.
//
// 싣지 않는 경우(커버리지보다 정확도):
//   - 공식 사이트가 도메인 첫 화면이 아니다(모회사 사이트의 하위 경로 등). 언어 경로(/kr, /ko-kr)는 허용.
//   - SNS·쇼핑몰·블로그 같은 공유 호스트.
//   - 같은 호스트를 다른 브랜드도 쓴다(모회사 도메인).
//   - 첫 보관 연도가 브랜드 설립연도보다 이르다 — 그 무렵 도메인 주인이 다른 사람이었을 수 있다.
//
// brand.webArchive = { host, firstCapture: "YYYY-MM-DD", snapshot, fetchedAt }
// 조회 결과는 reports/web-archive.json에 캐시한다(재실행 시 새 호스트만 조회, --refresh로 전부 다시).
// Usage: node scripts/enrich-web-archive.mjs [--dry] [--refresh]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { foundedYear } from "./lib/brand-seo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/web-archive.json");
const UA = "brandatlas-seo/1.1 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const dry = process.argv.includes("--dry");
const refresh = process.argv.includes("--refresh");
const SHARED_HOST = /(^|\.)(instagram|facebook|twitter|x|youtube|naver|blog\.naver|smartstore\.naver|kakao|tistory|linkedin|tiktok|wikipedia|namu\.wiki|coupang|musinsa|29cm|amazon|bandcamp|soundcloud|discogs|linktr|notion|wixsite|blogspot|wordpress|github)\.(com|co\.kr|me|io|org|ee|site|wiki)$/i;
const LOCALE_PATH = /^\/([a-z]{2}([-_][a-z]{2})?\/?)?$/i;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function firstCapture(host) {
  const url = `https://web.archive.org/cdx/search/cdx?${new URLSearchParams({ url: host, output: "json", limit: "1", fl: "timestamp,original", filter: "statuscode:200" })}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
      if (res.status === 429 || res.status >= 500) { await sleep(10000 * attempt); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = JSON.parse((await res.text()) || "[]");
      const [ts, original] = rows[1] || [];
      if (!/^\d{14}$/.test(ts || "")) return { none: true };
      return { ts, original };
    } catch (e) {
      if (attempt === 4) return { error: String(e.message || e) };
      await sleep(3000 * attempt);
    }
  }
  return { error: "retries exhausted" };
}

function hostOf(site) {
  try {
    const u = new URL(site);
    if (!/^https?:$/.test(u.protocol) || !LOCALE_PATH.test(u.pathname) || u.search) return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return SHARED_HOST.test(host) ? null : host;
  } catch { return null; }
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const all = data.allBrands || [];
const prev = !refresh && fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, "utf8")) : { lookups: {} };
const lookups = prev.lookups || {};

const hostBrands = new Map();
for (const b of all) {
  const host = hostOf(b.facts?.officialWebsite || b.officialWebsite || "");
  if (!host) continue;
  if (!hostBrands.has(host)) hostBrands.set(host, []);
  hostBrands.get(host).push(b);
}
const uniqueHosts = [...hostBrands].filter(([, l]) => l.length === 1).map(([h]) => h);
const todo = uniqueHosts.filter(h => !lookups[h] || lookups[h].error);
console.log(`단일 브랜드 호스트 ${uniqueHosts.length}곳 · 조회 대상 ${todo.length}곳`);

let n = 0;
const save = () => fs.writeFileSync(REPORT, JSON.stringify({ ...prev, lookups }, null, 1));
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
// CDX 응답이 건당 수 초라 4개씩 나눠 돈다(각 워커는 요청 사이 1.5초 쉼).
const queue = [...todo];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let host; (host = queue.shift());) {
    lookups[host] = await firstCapture(host);
    if (++n % 25 === 0) { save(); console.log(`  ${n}/${todo.length}`); }
    await sleep(1500);
  }
}));

const fetchedAt = new Date().toISOString().slice(0, 10);
const stats = { written: 0, beforeFounding: [], none: 0, errors: 0, sharedHosts: [...hostBrands].filter(([, l]) => l.length > 1).length };
for (const b of all) delete b.webArchive;
for (const host of uniqueHosts) {
  const r = lookups[host];
  if (!r || r.error) { stats.errors++; continue; }
  if (r.none) { stats.none++; continue; }
  const b = hostBrands.get(host)[0];
  const date = `${r.ts.slice(0, 4)}-${r.ts.slice(4, 6)}-${r.ts.slice(6, 8)}`;
  const fy = foundedYear(b);
  if (fy && Number(r.ts.slice(0, 4)) < fy) { stats.beforeFounding.push({ slug: b.urlSlug || b.slug, host, date, founded: fy }); continue; }
  b.webArchive = { host, firstCapture: date, snapshot: `https://web.archive.org/web/${r.ts}/${r.original}`, fetchedAt };
  stats.written++;
}

const byId = new Map(all.map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (!src) continue;
  if (src.webArchive) m.webArchive = src.webArchive; else delete m.webArchive;
}

fs.writeFileSync(REPORT, JSON.stringify({ generatedAt: new Date().toISOString(), ...stats, lookups }, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`기록 ${stats.written} · 보관 없음 ${stats.none} · 설립 이전 보관(제외) ${stats.beforeFounding.length} · 조회 실패 ${stats.errors} · 공유 호스트 ${stats.sharedHosts} → reports/web-archive.json`);
