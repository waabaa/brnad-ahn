// 대표 사진 보강 — QID가 확정된 브랜드(entityLinks, P856 일치)에서만 Wikidata P18(이미지)을 가져온다.
// 대상: 대표 사진이 없는 core 등급 브랜드(홈 '오늘의 브랜드' 후보). 이름 매칭은 하지 않는다(§2 엔티티 연결 원칙).
//
// 위키미디어 커먼즈 파일은 CC BY/BY-SA 등 저작자 표시 조건이 붙으므로 저작자·라이선스를 brand.imageCredit에 남기고
// 사진을 싣는 곳(홈 카드)에 표기한다. 로고·도표로 보이는 파일(SVG, 파일명에 logo)은 건너뛴다.
//
// Usage: node scripts/fetch-wikidata-photos.mjs [--dry] [--limit N]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { archiveTier } from "./lib/archive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/wikidata-photos.json");
const UA = "brandatlas-seo/1.1 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const dry = process.argv.includes("--dry");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

export const isPhoto = (b) => !!b.image && !/logos\/|_logo_|brand_atlas_logo_mark|\.svg$/i.test(String(b.image));
const text = (b) => String(b.sections?.insights?.body || b.insight || b.definition || "").replace(/\s+/g, " ");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
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

// 육안 검수에서 뺀 사진(다시 돌려도 받지 않는다). 인물 사진은 초상권 때문에 싣지 않는다.
const EXCLUDE = new Set(["nature-republic"]);

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const targets = data.allBrands.filter(b => !EXCLUDE.has(b.urlSlug || b.slug) && archiveTier(b) === "core" && text(b).length >= 200 && !isPhoto(b) && /^Q\d+$/.test(b.entityLinks?.wikidata || "")).slice(0, LIMIT);
console.log(`대상 ${targets.length}곳`);

// 1) P18 파일명
const p18 = new Map();
for (let i = 0; i < targets.length; i += 50) {
  const ids = targets.slice(i, i + 50).map(b => b.entityLinks.wikidata);
  const j = await getJson(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "claims", format: "json" })}`);
  for (const [q, e] of Object.entries(j.entities || {})) {
    const file = (e.claims?.P18 || []).filter(c => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value")
      .sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred")).map(c => c.mainsnak.datavalue.value)[0];
    if (file) p18.set(q, file);
  }
  await sleep(300);
}

// 2) 파일별 라이선스·저작자(커먼즈 extmetadata) → 내려받기
const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
const FREE = /^(CC0|CC BY(-SA)? [\d.]+|CC BY(-SA)?|Public domain|PD.*)$/i;
// 커먼즈 Artist 필드에는 서명 시각·안내문·괄호 설명이 섞여 있다 — 이름만 남긴다.
export const cleanArtist = (s) => {
  const t = String(s || "").replace(/\s*\(\s*talk\s*\).*$/i, "").replace(/\s+-\s+Wikimedia Commons.*$/i, "").replace(/\s*\(.*$/, "")
    .replace(/^Taken by User:(\S+).*$/i, "$1").replace(/^Original uploader was (\S+).*$/i, "$1").replace(/\s+at\s+\S+\.wikipedia$/i, "").trim();
  return !t || /no machine-readable author/i.test(t) ? "작자 미상" : t.slice(0, 60);
};
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const report = { generatedAt: new Date().toISOString(), targets: targets.length, withP18: p18.size, added: [], skipped: [] };
for (const b of targets) {
  const slug = b.urlSlug || b.slug;
  const file = p18.get(b.entityLinks.wikidata);
  if (!file) continue;
  if (/\.svg$/i.test(file) || /logo|wordmark|emblem/i.test(file)) { report.skipped.push({ slug, file, why: "로고·도표 파일" }); continue; }
  const meta = await getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "extmetadata|url|size", format: "json" })}`).catch(() => null);
  const info = meta && Object.values(meta.query?.pages || {})[0]?.imageinfo?.[0];
  const em = info?.extmetadata || {};
  const license = strip(em.LicenseShortName?.value);
  if (!info || !FREE.test(license)) { report.skipped.push({ slug, file, why: `라이선스 확인 불가(${license || "없음"})` }); continue; }
  if ((info.width || 0) < 600) { report.skipped.push({ slug, file, why: `해상도 부족(${info.width}px)` }); continue; }
  const artist = cleanArtist(strip(em.Artist?.value));
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file).replaceAll("%20", "_")}?width=1200`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(60000) });
    const ct = String(res.headers.get("content-type") || "").split(";")[0];
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[ct];
    if (!res.ok || !ext) { report.skipped.push({ slug, file, why: `다운로드 실패(${res.status} ${ct})` }); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const rel = `images/photos/${slug}-wd-${hash(file)}.${ext}`;
    if (!dry) fs.writeFileSync(path.join(ROOT, rel), buf);
    b.image = rel;
    b.imageCredit = { source: `commons:${file}`, artist, license, url: info.descriptionurl || "" };
    report.added.push({ slug, file, license, artist });
  } catch (e) { report.skipped.push({ slug, file, why: `다운로드 오류(${e.message})` }); }
  await sleep(1200);
}

// 사본 동기화(매거진 풀 등 — §4 relatedBrands가 사본을 참조한다)
const byId = new Map(data.allBrands.map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (src?.imageCredit && src.image !== m.image) { m.image = src.image; m.imageCredit = src.imageCredit; }
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`P18 있음 ${p18.size} · 추가 ${report.added.length} · 건너뜀 ${report.skipped.length} → reports/wikidata-photos.json`);
