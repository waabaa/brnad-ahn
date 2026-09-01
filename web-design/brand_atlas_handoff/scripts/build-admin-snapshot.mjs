// 운영 어드민이 읽을 스냅샷. 빌드 산출물·리포트를 한 파일로 합친다.
//
// 리포트 원본(reports/)은 배포 대상이 아니고 데이터 파일은 11MB라 어드민 서버가
// 그대로 읽기엔 무겁다. 어드민에 필요한 집계만 미리 계산해 둔다.
//
// Usage: node scripts/build-admin-snapshot.mjs   (build-seo-extras.mjs 다음)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { urlSlugOf, countryOf, foundedYear, displayName } from "./lib/brand-seo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "../..");
const OUT = path.join(ROOT, "reports", "admin-snapshot.json");

const readJson = (p, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
};

const DATA = readJson(path.join(ROOT, "data/brand-atlas.json"), { allBrands: [] });
const BRANDS = DATA.allBrands || [];
const thin = readJson(path.join(ROOT, "reports/thin-pages.json"), { slugs: [], pages: [] });
const entity = readJson(path.join(ROOT, "reports/wikidata-entity-links.json"), { entries: [], rejectedEntries: [] });
const dates = readJson(path.join(ROOT, "reports/page-dates.json"), { pages: {} });
const indexLog = readJson(path.join(REPO, ".omc/state/seo-index-log.json"), { entries: [], baseline: null });

// 수용기준은 audit-seo가 단일 진실 원천이다 — 여기서 다시 계산하면 두 기준이 어긋난다.
let audit = null;
try {
  audit = JSON.parse(execFileSync("node", [path.join(__dirname, "audit-seo.mjs"), "--json"], {
    encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
  }));
} catch (e) {
  console.warn("audit-seo 실행 실패:", e.message);
}

// ── 콘텐츠 집계 ────────────────────────────────────────────────────────────
const isRealLogo = (b) => b.logo && !String(b.logo).includes("brand_atlas_logo_mark");
const byIndustry = new Map();
for (const b of BRANDS) {
  const key = b.industry || "기타";
  if (!byIndustry.has(key)) byIndustry.set(key, { industry: key, total: 0, logo: 0, timeline: 0, bici: 0, entity: 0, thin: 0 });
  const g = byIndustry.get(key);
  g.total++;
  if (isRealLogo(b)) g.logo++;
  if (Array.isArray(b.timeline) && b.timeline.length) g.timeline++;
  if (Array.isArray(b.logoHistory) && b.logoHistory.length > 1) g.bici++;
  if (b.entityLinks && b.entityLinks.wikidata) g.entity++;
  if (thin.slugs.includes(urlSlugOf(b))) g.thin++;
}

const noLogo = BRANDS.filter(b => !isRealLogo(b))
  .map(b => ({ slug: urlSlugOf(b), name: displayName(b), industry: b.industry || null }))
  .sort((a, b) => a.name.localeCompare(b.name, "ko"));

// 본문 길이 분포(발행된 HTML 기준). audit-seo가 이미 재므로 그 값을 쓰고, 구간만 여기서 만든다.
const buckets = { "700 미만": 0, "700~1199": 0, "1200~1999": 0, "2000~2999": 0, "3000 이상": 0 };
for (const f of fs.readdirSync(path.join(ROOT, "brand")).filter(x => x.endsWith(".html"))) {
  const h = fs.readFileSync(path.join(ROOT, "brand", f), "utf8");
  const m = /<section class="mag-grid">([\s\S]*?)<\/section>\s*<\/div><footer/.exec(h);
  let body = m ? m[1] : "";
  body = body.replace(/<section class="cell wide related-cell"[\s\S]*/, " ");
  const n = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (n < 700) buckets["700 미만"]++;
  else if (n < 1200) buckets["700~1199"]++;
  else if (n < 2000) buckets["1200~1999"]++;
  else if (n < 3000) buckets["2000~2999"]++;
  else buckets["3000 이상"]++;
}

// ── 엔티티 기각 사유 ───────────────────────────────────────────────────────
const rejectReasons = {};
for (const r of entity.rejectedEntries || []) rejectReasons[r.reason] = (rejectReasons[r.reason] || 0) + 1;

// ── 최근 갱신 ──────────────────────────────────────────────────────────────
const modifiedTally = {};
for (const rec of Object.values(dates.pages || {})) {
  if (rec && rec.modified) modifiedTally[rec.modified] = (modifiedTally[rec.modified] || 0) + 1;
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  site: { origin: "https://brandatlas.co.kr", name: "브랜드 아틀라스" },
  totals: {
    brands: BRANDS.length,
    indexable: BRANDS.length - (thin.slugs || []).length,
    thin: (thin.slugs || []).length,
    withLogo: BRANDS.filter(isRealLogo).length,
    withTimeline: BRANDS.filter(b => Array.isArray(b.timeline) && b.timeline.length).length,
    withBici: BRANDS.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1).length,
    withEntity: BRANDS.filter(b => b.entityLinks && b.entityLinks.wikidata).length,
    withCountry: BRANDS.filter(b => countryOf(b)).length,
    withFoundedYear: BRANDS.filter(b => foundedYear(b)).length,
    categoryHubs: audit?.hubs?.categoryPages ?? null,
    countryHubs: audit?.hubs?.countryPages ?? null,
  },
  audit,
  bodyBuckets: buckets,
  industries: [...byIndustry.values()].sort((a, b) => b.total - a.total),
  thinPages: (thin.pages || []).slice(0, 100),
  noLogo: { count: noLogo.length, sample: noLogo.slice(0, 200) },
  entities: {
    matched: entity.matched ?? (entity.entries || []).length,
    withKoWikipedia: entity.withKoWikipedia ?? null,
    withEnWikipedia: entity.withEnWikipedia ?? null,
    rejected: (entity.rejectedEntries || []).length,
    rejectReasons,
    rejectedSample: (entity.rejectedEntries || []).slice(0, 60),
  },
  freshness: {
    ledgerPages: Object.keys(dates.pages || {}).length,
    modifiedByDate: Object.entries(modifiedTally).sort().slice(-30),
  },
  indexLog: {
    baseline: indexLog.baseline || null,
    entries: (indexLog.entries || []).slice(-60),
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 1));
console.log(`admin-snapshot.json: 브랜드 ${snapshot.totals.brands}, 색인대상 ${snapshot.totals.indexable}, 산업 ${snapshot.industries.length}, 로고미보유 ${snapshot.noLogo.count} → ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
