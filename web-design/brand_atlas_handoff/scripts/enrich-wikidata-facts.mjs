// Wikidata 팩트 보강 — 이미 P856(공식 웹사이트) 완전 일치로 확정된 QID(entityLinks)에서만
// 가져온다. 이름 매칭은 하지 않는다(enrich-wikidata-entity-links.mjs 주석 참조).
//
// 가져오는 속성:
//   P154 로고(Commons 파일)   → 로고 없는 브랜드에만 내려받아 채운다
//   P17  국가                 → wikidata.country (한국어 레이블)
//   P571 설립일               → wikidata.inception (YYYY 또는 YYYY-MM-DD)
//   P159 본사 소재지          → wikidata.headquarters
//   P112 창업자               → wikidata.founders[]
//   P749 모기업               → wikidata.parent
//   P1448/P1705 공식 명칭     → 참고용 (저장하지 않음)
//
// brand.wikidata 는 사실 표(팩트 표)와 countryOf()/foundedYear() 폴백에 쓰인다.
// definition 에서 추출된 값이 있으면 그것이 우선이고, 없을 때만 Wikidata 값을 쓴다.
//
// Usage: node scripts/enrich-wikidata-facts.mjs [--dry] [--no-logo]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/wikidata-facts.json");
const UA = "brandatlas-seo/1.1 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const dry = process.argv.includes("--dry");
const noLogo = process.argv.includes("--no-logo");

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const brands = (data.allBrands || []).filter(b => b.entityLinks && /^Q\d+$/.test(b.entityLinks.wikidata || ""));
console.log(`QID 확정 브랜드 ${brands.length}건`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function api(params) {
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429) { await sleep(5000 * attempt); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(2000 * attempt);
    }
  }
}

async function getEntities(ids, props) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const j = await api({ action: "wbgetentities", ids: chunk.join("|"), props, languages: "ko|en" });
    Object.assign(out, j.entities || {});
    await sleep(300);
  }
  return out;
}

const mainsnaks = (entity, p) => (entity.claims?.[p] || [])
  .filter(c => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value")
  .sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"))
  .map(c => c.mainsnak.datavalue.value);

const qidOf = (v) => v && v.id ? v.id : null;
const timeOf = (v) => {
  if (!v || !v.time) return null;
  const m = /^\+?(-?\d{1,4})-(\d{2})-(\d{2})/.exec(v.time);
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 1500 || y > 2100) return null;
  if (v.precision >= 11 && m[2] !== "00" && m[3] !== "00") return `${m[1]}-${m[2]}-${m[3]}`;
  if (v.precision >= 10 && m[2] !== "00") return `${m[1]}-${m[2]}`;
  return String(y);
};

// 1) 본 엔티티
const entities = await getEntities(brands.map(b => b.entityLinks.wikidata), "claims|labels");

// 2) 참조된 QID 레이블(국가·도시·인물·기업)을 한 번에
const refIds = new Set();
const picked = new Map();
for (const b of brands) {
  const e = entities[b.entityLinks.wikidata];
  if (!e || e.missing !== undefined) continue;
  const rec = {
    qid: b.entityLinks.wikidata,
    countryQ: mainsnaks(e, "P17").map(qidOf).filter(Boolean)[0] || null,
    inception: mainsnaks(e, "P571").map(timeOf).filter(Boolean)[0] || null,
    hqQ: mainsnaks(e, "P159").map(qidOf).filter(Boolean)[0] || null,
    founderQ: mainsnaks(e, "P112").map(qidOf).filter(Boolean).slice(0, 4),
    parentQ: mainsnaks(e, "P749").map(qidOf).filter(Boolean)[0] || null,
    logoFile: mainsnaks(e, "P154").map(v => typeof v === "string" ? v : null).filter(Boolean)[0] || null,
    labelKo: e.labels?.ko?.value || null,
  };
  for (const q of [rec.countryQ, rec.hqQ, rec.parentQ, ...rec.founderQ]) if (q) refIds.add(q);
  picked.set(b, rec);
}
const labels = await getEntities([...refIds], "labels");
const labelOf = (q) => {
  const e = q && labels[q];
  const v = e ? (e.labels?.ko?.value || e.labels?.en?.value || null) : null;
  return saneLabel(v) ? v : null;
};
// 국가명은 사이트 표기(brand-seo.mjs COUNTRY_NAMES)에 맞춘다.
const COUNTRY_ALIAS = { 대한민국: "한국", 미합중국: "미국", 튀르키예: "터키", "중화인민공화국": "중국", "중화민국": "대만", "체코 공화국": "체코", "러시아 연방": "러시아", "오스트레일리아": "호주", "남아프리카 공화국": "남아프리카공화국", "잉글랜드": "영국", "스코틀랜드": "영국" };
// 위키데이터 레이블에는 훼손된 값이 섞여 있다(예: 유니클로 창업자 "xkektl diskdl"). 고유명사는
// 대문자로 시작하거나 한글이어야 한다 — 소문자만으로 된 라틴 문자열은 버린다.
const saneLabel = (v) => {
  const s = String(v || "").trim();
  if (s.length < 2 || s.length > 60) return false;
  if (/[가-힣]/.test(s)) return true;
  if (/^[a-z0-9 .'-]+$/.test(s)) return false;
  return /[A-Za-zÀ-ž]/.test(s);
};

// 3) 로고 다운로드(로고 없는 브랜드만)
const isRealLogo = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
async function fetchCommons(fileName, slug) {
  // SVG는 그대로, 래스터는 원본. 폭 800px 래스터가 필요하면 ?width=800 을 붙일 수 있지만
  // SVG 원본을 보존하는 편이 화질에 유리하다.
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replaceAll("%20", "_")}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const ct = String(res.headers.get("content-type") || "").split(";")[0];
    const ext = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" }[ct];
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;
    const rel = `images/logos/${slug}-wd-${hash(fileName)}.${ext}`;
    if (!dry) fs.writeFileSync(path.join(ROOT, rel), buf);
    return rel;
  } catch { return null; }
}

const report = { generatedAt: new Date().toISOString(), brands: brands.length, withCountry: 0, withInception: 0, withHq: 0, withFounder: 0, withParent: 0, logoAdded: 0, logoFailed: [], entries: [] };
for (const [b, rec] of picked) {
  const wd = {
    qid: rec.qid,
    country: rec.countryQ ? (COUNTRY_ALIAS[labelOf(rec.countryQ)] || labelOf(rec.countryQ)) : null,
    inception: rec.inception,
    headquarters: rec.hqQ ? labelOf(rec.hqQ) : null,
    founders: rec.founderQ.map(labelOf).filter(Boolean),
    parent: rec.parentQ ? labelOf(rec.parentQ) : null,
    fetchedAt: report.generatedAt.slice(0, 10),
  };
  if (wd.country) report.withCountry++;
  if (wd.inception) report.withInception++;
  if (wd.headquarters) report.withHq++;
  if (wd.founders.length) report.withFounder++;
  if (wd.parent) report.withParent++;
  if (!noLogo && rec.logoFile && !isRealLogo(b.logo)) {
    const rel = await fetchCommons(rec.logoFile, b.urlSlug || b.slug);
    if (rel) { b.logo = rel; wd.logoSource = `commons:${rec.logoFile}`; report.logoAdded++; }
    else report.logoFailed.push({ slug: b.urlSlug || b.slug, file: rec.logoFile });
    await sleep(1200);
  }
  b.wikidata = wd;
  report.entries.push({ slug: b.urlSlug || b.slug, name: b.name, ...wd });
}

// magazine 풀 동기화
const byId = new Map((data.allBrands || []).map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (!src) continue;
  if (src.wikidata) m.wikidata = src.wikidata;
  if (src.logo && !isRealLogo(m.logo)) m.logo = src.logo;
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`국가 ${report.withCountry} · 설립 ${report.withInception} · 본사 ${report.withHq} · 창업자 ${report.withFounder} · 모기업 ${report.withParent} · 로고 추가 ${report.logoAdded} (실패 ${report.logoFailed.length}) → reports/wikidata-facts.json`);
