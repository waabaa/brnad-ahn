// 발굴한 후보(reports/brand-candidates.json)를 실제 브랜드 레코드로 수록한다.
//
// 무할루시네이션 원칙(CLAUDE.md §2)을 그대로 따른다:
//  - 한글 표기는 한국어 위키백과 문서 제목에서만 온다. 음차를 만들지 않는다.
//  - 본문은 한국어 위키백과 요약과 위키데이터 팩트만 근거로 쓰고, LLM은 그 근거를 우리 문체로
//    다시 쓰는 일만 한다. 생성문에 근거에 없는 연도·숫자가 나오면 그 브랜드는 수록하지 않는다.
//  - country/foundedYear 원본 필드는 쓰지 않는다. 위키데이터 P17/P571만 brand.wikidata에 넣는다.
//
//
// --source en (2026-09-12, S&P 500·나스닥100 커버리지): 한국어 위키백과 문서가 없는 개체를 영문 위키백과 본문과
// 위키데이터 팩트를 근거로 수록한다. 근거 밖 숫자 기각 규칙은 같다. 한글 표기는 위키데이터 ko 레이블이 있을 때만
// 쓰고 없으면 비워 둔다(음차 생성 금지, CLAUDE.md §1) — 원어만 있는 레코드가 된다.
//
// Usage: node scripts/import-wikidata-brands.mjs [--limit 50] [--dry] [--batch 3] [--only Q1,Q2] [--candidates file] [--no-fallback] [--concurrency 2] [--source en]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyAscii, romanizeKorean } from "./lib/brand-seo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const LIMIT = Number(opt("--limit", 0)) || Infinity;
const BATCH = Number(opt("--batch", 2));
const DRY = args.includes("--dry");
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
// --no-fallback: gpt 분당 한도(공유 8회/분)에 걸렸을 때 gemini로 넘기지 않고 잠깐 기다린다.
// fallback은 research 의 gemini 몫(일 20)을 금방 비우고, 그 뒤로는 1시간짜리 429가 돌아온다(2026-09-12).
const FALLBACK = args.includes("--no-fallback") ? [] : ["gemini"];
const CONCURRENCY = Math.max(1, Number(opt("--concurrency", 4)));
const SOURCE_EN = opt("--source", "ko") === "en";
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";
const GW = process.env.LLM_GATEWAY_URL || "http://127.0.0.1:15055/v1/generate";
const GW_KEY = process.env.LLM_GATEWAY_KEY || "";
const TODAY = new Date().toISOString().slice(0, 10);

const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
// --candidates reports/collection-candidates.json: 컬렉션 발굴 결과를 읽는다(기본은 brand-candidates.json).
const candidates = JSON.parse(fs.readFileSync(path.join(ROOT, opt("--candidates", "reports/brand-candidates.json")), "utf8"));
const REPORT = path.join(ROOT, "reports/wikidata-brand-import.json");
const prevReport = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, "utf8")) : { added: [], rejected: [] };
// en 모드는 ko 근거 때문에 기각된 개체(문서 없음·요약 짧음·동음이의)를 다시 시도한다.
const KO_ONLY_REJECT = /ko 문서 없음|요약 짧음|동음이의/;
const doneQids = new Set([...prevReport.added.map(r => r.qid), ...prevReport.rejected.filter(r => !(SOURCE_EN && KO_ONLY_REJECT.test(r.why))).map(r => r.qid)]);

// 브랜드가 아닌 개체(사람·대학·리그·행정구역·작품)는 수록하지 않는다.
const BLOCK_P31 = new Set(["Q484652", "Q79913", "Q163740", "Q1664720", "Q15911314", "Q31855", "Q3914", "Q2385804", "Q7075", "Q1785271", "Q4438121", "Q17127659", "Q5", "Q3918", "Q875538", "Q902104", "Q847017", "Q476028", "Q623109", "Q15991290", "Q15991303", "Q1478437", "Q515", "Q6256", "Q3624078", "Q11424", "Q482994", "Q134556", "Q7889", "Q571", "Q13406463", "Q4167410", "Q4167836", "Q7278", "Q245065", "Q327333", "Q43229x", "Q1250464", "Q10387575", "Q41176", "Q811979"]);
const norm = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/&/g, " and ").replace(/\s*\(.*?\)\s*/g, "").replace(/[^\p{Script=Hangul}\p{Letter}\p{Number}]+/gu, "").trim();
const have = new Set();
for (const b of data.allBrands) for (const k of [b.name, b.nameKo, b.nameEn, b.slug, b.urlSlug]) if (k) have.add(norm(k));
const haveSlug = new Set(data.allBrands.map(b => b.urlSlug || b.slug));

let wikiLast = 0;
async function wikiFetch(url, json = true) {
  const wait = wikiLast + 300 - Date.now(); wikiLast = Date.now() + Math.max(0, wait);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: json ? "application/json" : "*/*" }, signal: AbortSignal.timeout(25000) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 2500 * (i + 1))); continue; }
      if (!res.ok) return null;
      return json ? await res.json() : Buffer.from(await res.arrayBuffer());
    } catch { /* retry */ }
  }
  return null;
}

const claimValues = (claims, prop) => (claims?.[prop] || []).map(c => c.mainsnak?.datavalue?.value).filter(Boolean);
const qidOf = (v) => (typeof v === "object" && v?.id) ? v.id : null;
const yearOf = (v) => { const t = typeof v === "object" ? v.time : v; const m = /^[+-](\d{4})/.exec(String(t || "")); return m ? Number(m[1]) : null; };

async function labelsOf(qids) {
  const out = new Map();
  for (let i = 0; i < qids.length; i += 40) {
    const j = await wikiFetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.slice(i, i + 40).join("|")}&props=labels&languages=ko|en&format=json`);
    for (const [id, e] of Object.entries(j?.entities || {})) out.set(id, e.labels?.ko?.value || e.labels?.en?.value || "");
  }
  return out;
}

// ── LLM: 근거만으로 우리 문체의 본문을 쓴다 ──────────────────────────────
// 게이트웨이 기본 upstream 타임아웃으로는 두 건 묶음 생성(30초 남짓)이 잘려 나간다(2026-09-12) — 170초를 명시한다.
async function generate(prompt) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(GW, { method: "POST", headers: { Authorization: `Bearer ${GW_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ provider: "gpt", prompt, fallback: FALLBACK, timeout_ms: 170000 }), signal: AbortSignal.timeout(180000) });
      const j = await res.json().catch(() => null);
      if (j?.ok && j.content) return String(j.content);
      const err = j?.error;
      if (err?.code === "rate_limit") {
        const wait = Math.min(3600, Number(err.retry_after_s) || 300) + 5;
        console.warn(`한도 도달(${err.limit_scope}) — ${wait}초 대기`);
        await new Promise(r => setTimeout(r, wait * 1000));
        i--;   // 한도 대기는 재시도 횟수로 세지 않는다
        continue;
      }
      if (err) console.warn(`게이트웨이 오류: ${JSON.stringify(err).slice(0, 160)}`);
    } catch (e) { console.warn(`게이트웨이 연결 실패(${e.message}) — 터널 확인`); }
    await new Promise(r => setTimeout(r, 6000 * (i + 1)));
  }
  return "";
}

const INDUSTRIES = data.industries.map(i => `${i.id}=${i.name}`).join(", ");
function promptFor(items) {
  return `너는 한국어 브랜드 사전의 편집자다. 아래 각 브랜드에 대해 제공된 "근거"만 사용해 사전 항목을 쓴다.

절대 규칙:
- 근거에 없는 사실(연도, 수치, 인물, 지명, 제품명)을 절대 쓰지 마라. 모르면 그 내용을 빼라.
- 추측·홍보 표현·과장 금지. 문장 끝은 반드시 '~이다/~한다/~했다' 평서형으로 쓴다. '~입니다/~습니다'는 절대 쓰지 마라.
- 브랜드명은 첫 문장에서 "한글명(원어)" 형태로 한 번만 병기한다. 원어가 없으면 한글명만 쓴다.
- 한글명이 "(없음)"이면 브랜드명의 한글 음차를 절대 만들지 말고 원어 표기만 쓴다.
- 근거가 영문이면 한국어로 옮겨 쓴다. 인명·회사명·제품명은 원어 철자 그대로 두고, 국가·도시처럼 한국어 표기가 확립된 지명만 한국어로 쓴다.
  금액·수치를 단위 환산(billion→억 등)하지 마라. 환산이 필요한 숫자는 쓰지 말고, 연도와 근거에 그대로 있는 숫자만 쓴다.
- definition: 1~2문장(80~160자). 그 브랜드가 무엇인지.
- overview: 4~6문장(300~500자). 무엇을 하는 브랜드이며 지금 어떤 위치인지.
- origin: 3~5문장(250~450자). 언제 누가 시작했고 어떻게 성장했는지. 근거에 없으면 빈 문자열 "".
- products: 3~5문장(250~450자). 대표 제품·서비스·사업 구성. 근거에 없으면 "".
- current: 2~4문장(150~350자). 현재 상태(지배구조·규모·최근 변화). 근거에 없으면 "".
- identity: 1~2문장(60~140자). 이 브랜드를 다른 브랜드와 구분 짓는 지점.
- industry: 다음 중 정확히 하나의 코드만: ${INDUSTRIES}

출력은 JSON 배열만. 형식: [{"id":"<주어진 id>","definition":"...","overview":"...","origin":"...","products":"...","current":"...","identity":"...","industry":"<코드>"}]
코드블록·설명 없이 JSON만 출력한다.

브랜드 ${items.length}건:
${items.map(it => `--- id: ${it.qid}
한글명: ${it.ko || "(없음)"}
원어: ${it.en || "(없음)"}
위키데이터 팩트: ${it.factLine || "(없음)"}
${it.sourceLang === "en" ? "영문 위키백과 본문(근거)" : "한국어 위키백과 본문(근거)"}: ${it.extract}`).join("\n")}`;
}

// 생성문 검증: 근거에 없는 숫자(연도·수치)가 나오면 기각한다.
function verifyText(text, sourceText) {
  const nums = String(text).match(/\d[\d,.]*/g) || [];
  const src = String(sourceText).replace(/,/g, "");
  for (const raw of nums) {
    const n = raw.replace(/[,.]$/, "").replace(/,/g, "");
    if (n.length < 2) continue;
    if (!src.includes(n)) return `근거에 없는 숫자 ${n}`;
  }
  if (/습니다|하십시오|드립니다/.test(text)) return "격식체";
  if (/할루시|추정된다|것으로 보인다|아마도/.test(text)) return "추측 표현";
  return null;
}

const MONTHS = { January: "1월", February: "2월", March: "3월", April: "4월", May: "5월", June: "6월", July: "7월", August: "8월", September: "9월", October: "10월", November: "11월", December: "12월" };
// 원문(위키백과)에 영어 월 표기가 섞여 들어오는 경우가 있어 한국어로 되돌린다.
const POLITE = [
  [/합니다\./g, "한다."], [/입니다\./g, "이다."], [/습니다\./g, "다."], [/됩니다\./g, "된다."],
  [/있습니다\./g, "있다."], [/없습니다\./g, "없다."], [/했습니다\./g, "했다."], [/였습니다\./g, "였다."],
  [/왔습니다\./g, "왔다."], [/집니다\./g, "진다."], [/납니다\./g, "난다."], [/줍니다\./g, "준다."],
  [/갑니다\./g, "간다."], [/옵니다\./g, "온다."], [/봅니다\./g, "본다."], [/합니다$/g, "한다"], [/입니다$/g, "이다"],
];
function plain(t) { let o = String(t || ""); for (const [re, to] of POLITE) o = o.replace(re, to); return o; }

function tidy(t) {
  let out = String(t || "").trim();
  for (const [en, ko] of Object.entries(MONTHS)) out = out.replace(new RegExp(`\\b${en}\\s+(\\d{4})년`, "g"), `$1년 ${ko}`).replace(new RegExp(`\\b${en}\\b`, "g"), ko);
  return plain(out).replace(/\s{2,}/g, " ");
}

function parseJsonArray(s) {
  const t = String(s).replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b < 0) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

async function downloadLogo(commonsFile, slug) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFile)}?width=800`;
  const buf = await wikiFetch(url, false);
  if (!buf || buf.length < 400) return "";
  let ext = /\.svg$/i.test(commonsFile) ? "png" : (path.extname(commonsFile).slice(1).toLowerCase() || "png");
  if (buf[0] === 0x89 && buf[1] === 0x50) ext = "png"; else if (buf[0] === 0xff && buf[1] === 0xd8) ext = "jpg";
  else if (/<svg[\s>]/i.test(buf.toString("utf8", 0, 2000))) ext = "svg";
  const rel = `images/logos/${slug}-wd.${ext}`;
  fs.writeFileSync(path.join(ROOT, rel), buf);
  return rel;
}

// ── 후보 준비 ────────────────────────────────────────────────────────
// 스캔은 위키 API 두 번씩 1,500건이라 40분쯤 걸린다. 결과를 캐시해 재시작 비용을 없앤다.
const PREP_CACHE = path.join(ROOT, SOURCE_EN ? "reports/wikidata-brand-prepared-en.json" : "reports/wikidata-brand-prepared.json");
const prepared = [];
const rejected = [];
let scanned = 0;
const CACHED = args.includes("--use-cache") && fs.existsSync(PREP_CACHE) ? JSON.parse(fs.readFileSync(PREP_CACHE, "utf8")) : null;
for (const c of (CACHED ? [] : candidates)) {
  if (prepared.length >= LIMIT) break;
  if (ONLY && !ONLY.has(c.qid)) continue;
  if (doneQids.has(c.qid)) continue;
  const koBase = String(c.ko || "").replace(/\s*\(.*?\)\s*$/, "").trim();
  if (koBase && have.has(norm(koBase))) { rejected.push({ qid: c.qid, ko: c.ko, why: "이미 수록" }); continue; }
  scanned++;
  const ent = await wikiFetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${c.qid}&props=claims|labels|descriptions|sitelinks/urls&languages=ko|en&sitefilter=kowiki|enwiki&format=json`);
  const e = ent?.entities?.[c.qid];
  if (!e) { rejected.push({ qid: c.qid, ko: c.ko, why: "위키데이터 조회 실패" }); continue; }
  const p31 = claimValues(e.claims, "P31").map(qidOf).filter(Boolean);
  if (p31.some(q => BLOCK_P31.has(q))) { rejected.push({ qid: c.qid, ko: c.ko, why: `브랜드 아님(${p31.join(",")})` }); continue; }
  const koTitle = SOURCE_EN ? null : e.sitelinks?.kowiki?.title;
  const srcTitle = SOURCE_EN ? e.sitelinks?.enwiki?.title : koTitle;
  if (!srcTitle) { rejected.push({ qid: c.qid, ko: c.ko, why: SOURCE_EN ? "en 문서 없음" : "ko 문서 없음" }); continue; }
  // 리드 문단(REST summary)만 쓰면 근거가 300자 안팎이라 사전 항목이 얇아진다. 문서 본문 앞부분까지 근거로 쓴다.
  const ex = await wikiFetch(`https://${SOURCE_EN ? "en" : "ko"}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(srcTitle)}&format=json`);
  const full = String(Object.values(ex?.query?.pages || {})[0]?.extract || "")
    .replace(/\n{2,}/g, "\n").replace(/^(각주|참고 문헌|외부 링크|같이 보기|See also|References|External links|Notes|Further reading)[\s\S]*$/m, "").trim();
  const extract = full.slice(0, 4500);
  if (extract.length < 500) { rejected.push({ qid: c.qid, ko: c.ko, why: `요약 짧음(${extract.length}자)` }); continue; }
  if (/동음이의|넘겨주기|may refer to:/.test(extract)) { rejected.push({ qid: c.qid, ko: c.ko, why: "동음이의" }); continue; }

  const enTitle = String(e.sitelinks?.enwiki?.title || "").replace(/\s*\(.*?\)\s*$/, "").trim();
  const en = e.labels?.en?.value || enTitle || "";
  const countryQ = claimValues(e.claims, "P17").map(qidOf).filter(Boolean)[0] || null;
  const hqQ = claimValues(e.claims, "P159").map(qidOf).filter(Boolean)[0] || null;
  const founderQs = claimValues(e.claims, "P112").map(qidOf).filter(Boolean).slice(0, 3);
  const parentQ = claimValues(e.claims, "P749").map(qidOf).filter(Boolean)[0] || null;
  const inception = yearOf(claimValues(e.claims, "P571")[0]);
  const web = claimValues(e.claims, "P856")[0] || "";
  const logoFile = claimValues(e.claims, "P154")[0] || claimValues(e.claims, "P8972")[0] || "";
  if (have.has(norm(en)) || haveSlug.has(slugifyAscii(en || romanizeKorean(koBase)))) { rejected.push({ qid: c.qid, ko: c.ko, why: `이미 수록(원어 ${en})` }); continue; }
  // en 모드의 한글 표기: 위키데이터 ko 레이블(한글 포함)만. 없으면 빈 값 — 음차하지 않는다.
  const koName = SOURCE_EN ? (/[가-힣]/.test(e.labels?.ko?.value || "") ? e.labels.ko.value.trim() : "") : koBase;
  if (SOURCE_EN && koName && have.has(norm(koName))) { rejected.push({ qid: c.qid, ko: koName, why: "이미 수록" }); continue; }
  prepared.push({ qid: c.qid, ko: koName, koTitle, enTitle: e.sitelinks?.enwiki?.title || "", sourceLang: SOURCE_EN ? "en" : "ko", en, extract, countryQ, hqQ, founderQs, parentQ, inception, web: typeof web === "string" ? web : "", logoFile: typeof logoFile === "string" ? logoFile : "", sitelinks: c.sitelinks, koUrl: e.sitelinks?.kowiki?.url || "", enUrl: e.sitelinks?.enwiki?.url || "" });
  if (scanned % 25 === 0) console.log(`  스캔 ${scanned}, 준비 ${prepared.length}, 기각 ${rejected.length}`);
}
if (!CACHED && !DRY) fs.writeFileSync(PREP_CACHE, JSON.stringify(prepared, null, 1));
console.log(`준비 ${prepared.length}건 / 기각 ${rejected.length}건 (캐시 저장)`);

if (CACHED) { prepared.push(...CACHED.filter(p => !doneQids.has(p.qid))); console.log(`캐시에서 ${prepared.length}건 복원`); }

// 라벨 일괄 조회
const allQ = [...new Set(prepared.flatMap(p => [p.countryQ, p.hqQ, p.parentQ, ...p.founderQs].filter(Boolean)))];
const labels = await labelsOf(allQ);
for (const p of prepared) {
  const facts = [];
  if (p.countryQ && labels.get(p.countryQ)) facts.push(`국가=${labels.get(p.countryQ)}`);
  if (p.inception) facts.push(`설립=${p.inception}년`);
  if (p.hqQ && labels.get(p.hqQ)) facts.push(`본사=${labels.get(p.hqQ)}`);
  const fs2 = p.founderQs.map(q => labels.get(q)).filter(Boolean);
  if (fs2.length) facts.push(`창업자=${fs2.join("·")}`);
  if (p.parentQ && labels.get(p.parentQ)) facts.push(`모기업=${labels.get(p.parentQ)}`);
  p.factLine = facts.join(", ");
  p.sourceText = `${p.extract} ${p.factLine} ${p.ko} ${p.en}`;
}

// ── 본문 생성 + 검증 + 수록 ─────────────────────────────────────────
const industries = new Map(data.industries.map(i => [i.id, i.name]));
let nextId = Math.max(...data.allBrands.map(b => Number(b.id) || 0)) + 1;
const added = [];
const chunks = [];
for (let i = 0; i < prepared.length; i += BATCH) chunks.push(prepared.slice(i, i + BATCH));

function buildRecord(p, g) {
  let slug = slugifyAscii(p.en || romanizeKorean(p.ko));
  if (!slug) return null;
  if (haveSlug.has(slug)) slug = `${slug}-${p.qid.toLowerCase()}`;
  haveSlug.add(slug);
  const sameAs = [`https://www.wikidata.org/wiki/${p.qid}`, p.koUrl, p.enUrl].filter(Boolean);
  return {
    id: 0, slug, urlSlug: slug, name: p.ko || p.en, nameKo: p.ko || "", nameEn: p.en || "",
    definition: g.definition, summary: g.definition,
    industry: industries.get(g.industry), domainSlug: g.industry,
    tier: "C_source_backed", rating: Math.min(5, 3.5 + Math.min(1.5, p.sitelinks / 60)),
    image: "", logo: "", insight: g.identity || "",
    logoHistory: [],
    sections: {
      overview: { title: "개요", body: g.overview },
      ...(g.origin && g.origin.length > 80 ? { origin: { title: "시작과 성장", body: g.origin } } : {}),
      ...(g.products && g.products.length > 80 ? { products: { title: "제품과 서비스", body: g.products } } : {}),
      ...(g.current && g.current.length > 80 ? { current: { title: "현재", body: g.current } } : {}),
      ...(g.identity ? { identity: { title: "브랜드 정체성", body: g.identity } } : {}),
    },
    timeline: [], publicReady: true, displayPriority: "normal",
    officialWebsite: p.web,
    entityLinks: { wikidata: p.qid, sameAs, source: p.sourceLang === "en" ? "wikidata en sitelink (import 2026-09)" : "wikidata ko sitelink (import 2026-09)" },
    wikidata: {
      qid: p.qid,
      country: p.countryQ ? labels.get(p.countryQ) || null : null,
      inception: p.inception ? String(p.inception) : null,
      headquarters: p.hqQ ? labels.get(p.hqQ) || null : null,
      founders: p.founderQs.map(q => labels.get(q)).filter(Boolean),
      parent: p.parentQ ? labels.get(p.parentQ) || null : null,
      fetchedAt: TODAY,
    },
    sourceNote: p.sourceLang === "en" ? `영문 위키백과 「${p.enTitle}」 본문과 위키데이터 ${p.qid} 팩트를 근거로 편집` : `한국어 위키백과 「${p.koTitle}」 요약과 위키데이터 ${p.qid} 팩트를 근거로 편집`,
  };
}

// 한 배치를 생성·검증한다. 실패 항목은 사유를 남긴다(자동 수록 금지).
async function processChunk(chunk, retry = false) {
  const raw = await generate(promptFor(chunk));
  const arr = parseJsonArray(raw);
  const failed = [];
  if (!arr) { for (const p of chunk) failed.push([p, "LLM 응답 파싱 실패"]); return failed; }
  for (const p of chunk) {
    const g = arr.find(x => String(x.id) === p.qid) || (arr.length === chunk.length ? arr[chunk.indexOf(p)] : null);
    if (!g?.definition || !g?.overview) { failed.push([p, "생성 누락"]); continue; }
    for (const k of ["definition", "overview", "origin", "products", "current", "identity"]) if (g[k]) g[k] = tidy(g[k]);
    const bad = verifyText([g.definition, g.overview, g.origin, g.products, g.current, g.identity].filter(Boolean).join(" "), p.sourceText);
    if (bad) { failed.push([p, `검증 실패: ${bad}`]); continue; }
    if (!industries.has(g.industry)) { failed.push([p, `산업 코드 이상(${g.industry})`]); continue; }
    const total = [g.definition, g.overview, g.origin, g.products, g.current, g.identity].filter(Boolean).join("").length;
    if (String(g.definition).length < 40 || String(g.overview).length < 200 || total < 600) { failed.push([p, `본문 짧음(${total}자)`]); continue; }
    const rec = buildRecord(p, g);
    if (!rec) { failed.push([p, "slug 생성 불가"]); continue; }
    if (p.logoFile && !DRY) { rec.logo = await downloadLogo(p.logoFile, rec.urlSlug); if (rec.logo) rec.logoHistory = [{ src: rec.logo, label: "대표 로고", note: "현재 사용 중인 마크" }]; }
    rec.id = nextId++;
    if (!DRY) data.allBrands.push(rec);
    added.push({ qid: p.qid, name: p.ko || p.en, source: p.sourceLang, slug: rec.urlSlug, industry: rec.industry, logo: !!rec.logo });
    have.add(norm(p.ko));
  }
  return failed;
}

let doneChunks = 0;
const retryQueue = [];
const queue = [...chunks];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const chunk = queue.shift();
    let failed = [];
    try { failed = await processChunk(chunk); } catch (e) { failed = chunk.map(p => [p, `오류: ${e.message}`]); }
    for (const f of failed) retryQueue.push(f);
    doneChunks++;
    if (doneChunks % 5 === 0) {
      console.log(`배치 ${doneChunks}/${chunks.length} — 수록 ${added.length}, 재시도 대기 ${retryQueue.length}`);
      if (!DRY) { for (const ind of data.industries) ind.count = data.allBrands.filter(b => b.domainSlug === ind.id).length; if (data.stats) data.stats.brands = data.allBrands.length; fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1)); }
    }
  }
}));

// 실패분은 1건씩 한 번 더 시도한다(배치 응답 누락·형식 오류가 대부분이다).
console.log(`재시도 ${retryQueue.length}건`);
const retryItems = retryQueue.map(([p]) => p);
const retryReasons = new Map(retryQueue.map(([p, why]) => [p.qid, why]));
const rq = [...retryItems];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (rq.length) {
    const p = rq.shift();
    let failed = [];
    try { failed = await processChunk([p], true); } catch (e) { failed = [[p, `오류: ${e.message}`]]; }
    for (const [q, why] of failed) rejected.push({ qid: q.qid, ko: q.ko, why: `${retryReasons.get(q.qid)} → 재시도: ${why}` });
  }
}));

if (!DRY) {
  for (const ind of data.industries) ind.count = data.allBrands.filter(b => b.domainSlug === ind.id).length;
  if (data.stats) data.stats.brands = data.allBrands.length;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
}
// dry 결과를 원장에 쓰면 다음 실행이 그 QID를 "처리됨"으로 건너뛴다 — dry는 보고서를 따로 둔다.
fs.writeFileSync(DRY ? REPORT.replace(/\.json$/, ".dry.json") : REPORT, JSON.stringify({ added: [...(DRY ? [] : prevReport.added), ...added.map(a => ({ ...a, at: TODAY }))], rejected: [...(DRY ? [] : prevReport.rejected), ...rejected.map(r => ({ ...r, at: TODAY }))] }, null, 1));
console.log(`\n수록 ${added.length}건, 기각 ${rejected.length}건${DRY ? " (dry)" : ""}. allBrands ${data.allBrands.length}`);
