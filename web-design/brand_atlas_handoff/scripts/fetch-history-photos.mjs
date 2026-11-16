// 브랜드 히스토리 사진 — QID가 확정된 브랜드(entityLinks)의 위키미디어 커먼즈 분류(P373)에서
// 촬영 연도가 확인되는 옛 사진을 골라 brand.historyPhotos[]에 싣는다. 이름 매칭은 하지 않는다(§2).
//
// 고르는 기준
//   - 자유 라이선스(CC0·CC BY·CC BY-SA·퍼블릭 도메인)만. 저작자·라이선스·원본 주소를 함께 저장하고 페이지에 표기한다.
//   - 촬영 연도(커먼즈 DateTimeOriginal)가 HISTORY_UNTIL 이전인 JPEG 사진만 — 연도 없는 사진은 '역사'의 근거가 없다.
//   - 파일명·설명에 브랜드 원어명이 들어 있는 사진만(nameKeys) — 거리 풍경에 간판만 걸린 사진을 거른다.
//   - 로고·도표·지도·스크린샷·SVG 제외. 인물 사진은 초상권 때문에 싣지 않는다 — 분류·파일명으로 거르고,
//     육안 검수에서 빠진 파일은 data/history-photo-exclude.json에 넣는다(다시 돌려도 받지 않는다).
//   - 브랜드당 최대 PER_BRAND장, 연대가 겹치지 않게(10년 단위로 한 장씩, 오래된 것부터).
//   - 커먼즈 설명은 원문 그대로 짧게 싣는다(번역·요약하지 않는다 — 없는 내용을 만들지 않기 위해).
//
// 위키미디어는 호스트별 직렬화·식별 UA가 없으면 429를 돌려준다 — 요청 사이 간격을 둔다.
// 결과는 reports/history-photos.json(캐시 겸 원장)에 쌓이고 재실행 시 이어 간다. --apply면 데이터에 반영.
// Usage: node scripts/fetch-history-photos.mjs [--limit N] [--apply-only] [--no-apply]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isListed } from "./lib/archive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/brand-atlas.json");
const LEDGER = path.join(ROOT, "reports/history-photos.json");
const EXCL = path.join(ROOT, "data/history-photo-exclude.json");
const OUT_DIR = path.join(ROOT, "images/history-photos");
const UA = "brandatlas-bot/1.0 (https://brandatlas.co.kr)";
const PER_BRAND = 4, MIN_W = 800, OUT_W = 900;
const HISTORY_UNTIL = 2005; // 그 뒤 사진은 매장·행사 스냅이 대부분이라 '히스토리'로 보지 않는다
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg("--limit", Infinity));
const APPLY_ONLY = process.argv.includes("--apply-only");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : { brands: {} };
const exclude = new Set(fs.existsSync(EXCL) ? JSON.parse(fs.readFileSync(EXCL, "utf8")) : []);
const save = () => fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
const qidOf = (b) => (b.entityLinks && /^Q\d+$/.test(b.entityLinks.wikidata || "") ? b.entityLinks.wikidata : null);

async function getJson(url) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) });
      if (r.status === 429) { await sleep(8000 * a); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (a === 4) throw e; await sleep(2500 * a); }
  }
  return null;
}
const commons = (params) => getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`);
const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const FREE = /^(CC0( 1\.0)?|CC BY(-SA)?( [\d.]+)?|Public domain|PD.*)$/i;
const cleanArtist = (s) => {
  const t = String(s || "").replace(/\s*\(\s*talk\s*\).*$/i, "").replace(/\s+-\s+Wikimedia Commons.*$/i, "").replace(/\s*\(.*$/, "")
    .replace(/^Taken by User:(\S+).*$/i, "$1").replace(/^Original uploader was (\S+).*$/i, "$1").trim();
  return !t || /no machine-readable author|unknown/i.test(t) ? "작자 미상" : t.slice(0, 60);
};
// 인물·비사진 거르기 — 파일명과 커먼즈 분류 문자열
const NOT_PHOTO = /certificate|document|receipt|logo|wordmark|emblem|icon|seal|coat of arms|flag|map\b|chart|graph|diagram|screenshot|screen shot|banner|signature|\.svg$|\.gif$|\.tiff?$|\.pdf$/i;
const PEOPLE = /portrait|people|speaking|speech|during a visit|interview|press conference|\bmr\.|\bmrs\.|\bdr\.|person|\bmen\b|\bwomen\b|employees|workers|staff|founders?\b|\bceo\b|president|chairman|politicians?|births|deaths|actors?|actresses|musicians|singers|players|athletes|celebrit|selfie|crowd|wedding|funeral|인물|초상/i;
const yearOf = (s) => { const m = /(?<!\d)(1[6-9]\d{2}|20[0-2]\d)(?!\d)/.exec(strip(s)); return m ? +m[1] : null; };

async function filesIn(cat, depthSubcats = true) {
  const out = [];
  const j = await commons({ action: "query", generator: "categorymembers", gcmtitle: `Category:${cat}`, gcmtype: "file", gcmlimit: "80", prop: "imageinfo", iiprop: "extmetadata|url|size|mime", iiextmetadatafilter: "DateTimeOriginal|LicenseShortName|Artist|ImageDescription|Categories" });
  for (const p of j?.query?.pages || []) out.push(p);
  if (depthSubcats) {
    // 역사·옛 사진이 모이는 하위 분류 하나 단계만 더 본다.
    const s = await commons({ action: "query", list: "categorymembers", cmtitle: `Category:${cat}`, cmtype: "subcat", cmlimit: "60" });
    const subs = (s?.query?.categorymembers || []).map(c => c.title.replace(/^Category:/, "")).filter(t => /history|historic|historical|vintage|archive|old photographs|in the 1[89]\d0s|in 19\d\ds|\b1[89]\d0s\b/i.test(t)).slice(0, 4);
    for (const sc of subs) { await sleep(700); out.push(...await filesIn(sc, false)); }
  }
  return out;
}

// 사진이 그 브랜드를 다루는지 — 파일명·설명에 브랜드 원어명(또는 커먼즈 분류명)이 들어 있어야 한다.
// 분류에는 행사장·거리 풍경처럼 브랜드가 배경으로만 걸린 사진이 많다.
const normName = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9가-힣]+/g, "");
function nameKeys(b, cat) {
  const keys = new Set();
  for (const n of [b.nameEn, b.name, b.nameKo, String(cat || "").replace(/\s*\(.*\)\s*$/, "")]) {
    const k = normName(n);
    if (k.length >= 3) keys.add(k);
    const first = normName(String(n || "").split(/[\s&]+/)[0]);
    if (first.length >= 5) keys.add(first);
  }
  return [...keys];
}
function pick(pages, keys) {
  const cands = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || ii.mime !== "image/jpeg") continue; // PNG는 도표·스캔 문서가 대부분이라 사진만
    const file = p.title.replace(/^File:/, "");
    if (exclude.has(file) || NOT_PHOTO.test(file) || PEOPLE.test(file)) continue;
    const em = ii.extmetadata || {};
    if (PEOPLE.test(strip(em.Categories?.value))) continue;
    const license = strip(em.LicenseShortName?.value);
    if (!FREE.test(license) || (ii.width || 0) < MIN_W) continue;
    const year = yearOf(em.DateTimeOriginal?.value);
    if (!year || year > HISTORY_UNTIL) continue;
    const hay = normName(`${file} ${strip(em.ImageDescription?.value)}`);
    if (!keys.some(k => hay.includes(k))) continue;
    if (PEOPLE.test(strip(em.ImageDescription?.value))) continue;
    cands.push({ file, year, license, artist: cleanArtist(strip(em.Artist?.value)), desc: strip(em.ImageDescription?.value).slice(0, 160), url: ii.descriptionurl || "" });
  }
  cands.sort((a, b) => a.year - b.year);
  const out = [], decades = new Set();
  for (const c of cands) { const d = Math.floor(c.year / 10); if (decades.has(d)) continue; decades.add(d); out.push(c); if (out.length >= PER_BRAND) break; }
  return out;
}

async function download(slug, c) {
  const h = crypto.createHash("sha1").update(c.file).digest("hex").slice(0, 8);
  const rel = `images/history-photos/${slug}-${h}.webp`;
  if (fs.existsSync(path.join(ROOT, rel))) return rel;
  const r = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.file).replaceAll("%20", "_")}?width=${OUT_W}`, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const tmp = path.join(OUT_DIR, `.${slug}-${h}.src`);
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  try { execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-vf", `scale='min(${OUT_W},iw)':-2`, "-quality", "72", path.join(ROOT, rel)]); }
  finally { fs.rmSync(tmp, { force: true }); }
  return rel;
}

if (!APPLY_ONLY) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const targets = data.allBrands.filter(b => qidOf(b) && isListed(b) && !ledger.brands[b.slug]).slice(0, LIMIT);
  console.log(`대상 ${targets.length}곳`);
  // ① P373(커먼즈 분류) — 50건씩
  const catOf = new Map();
  for (let i = 0; i < targets.length; i += 50) {
    const chunk = targets.slice(i, i + 50);
    const j = await getJson(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: chunk.map(qidOf).join("|"), props: "claims", format: "json" })}`).catch(() => null);
    for (const b of chunk) {
      const v = j?.entities?.[qidOf(b)]?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
      if (v) catOf.set(b.slug, v);
    }
    await sleep(500);
  }
  console.log(`커먼즈 분류 있음 ${catOf.size}곳`);
  let n = 0, got = 0;
  for (const b of targets) {
    const cat = catOf.get(b.slug);
    if (!cat) { ledger.brands[b.slug] = { at: today, photos: [], why: "커먼즈 분류 없음" }; continue; }
    try {
      const picks = pick(await filesIn(cat), nameKeys(b, cat));
      const photos = [];
      for (const c of picks) {
        try { photos.push({ ...c, src: await download(b.slug, c) }); } catch (e) { /* 개별 파일 실패는 건너뛴다 */ }
        await sleep(1100);
      }
      ledger.brands[b.slug] = { at: today, category: cat, photos };
      got += photos.length;
    } catch (e) { ledger.brands[b.slug] = { at: today, category: cat, photos: [], why: String(e.message || e).slice(0, 80), retry: true }; }
    if (++n % 25 === 0) { save(); console.log(`  ${n}/${targets.length} · 사진 ${got}장`); }
    await sleep(600);
  }
  // 오류로 끝난 브랜드는 다음 실행에서 다시 본다.
  for (const [k, v] of Object.entries(ledger.brands)) if (v.retry) delete ledger.brands[k];
  save();
}

// ② 데이터 반영 — 제외 목록에 든 파일은 빼고, 파일이 실제로 있는 것만
if (process.argv.includes("--no-apply")) process.exit(0);
let brands = 0, photos = 0;
for (const b of data.allBrands) {
  const e = ledger.brands[b.slug];
  const list = (e?.photos || []).filter(p => !exclude.has(p.file) && fs.existsSync(path.join(ROOT, p.src)));
  if (list.length) { b.historyPhotos = list.map(({ src, year, desc, artist, license, url, file }) => ({ src, year, desc, artist, license, url, file })); brands++; photos += list.length; }
  else delete b.historyPhotos;
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
console.log(`반영: ${brands}곳 · 사진 ${photos}장`);
