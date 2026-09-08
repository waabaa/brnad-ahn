// 한글 표기가 없는 브랜드에 위키데이터의 한국어 레이블을 채운다.
//
// 음차를 만들지 않는다(CLAUDE.md §1). 여기서 쓰는 값은 사람이 등록한 위키데이터 ko 레이블이거나
// 한국어 위키백과 문서 제목뿐이다. 개체 확정은 기존 entityLinks(P856 URL 완전 일치)만 신뢰한다.
//
// Usage: node scripts/add-korean-labels.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { koreanName } from "./lib/brand-seo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; brand dictionary; contact via site form)";
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const targets = data.allBrands.filter(b => !koreanName(b) && b.entityLinks?.wikidata);
console.log(`대상 ${targets.length}건 (한글 표기 없음 + QID 있음)`);

let last = 0;
async function api(url) {
  const wait = last + 300 - Date.now(); last = Date.now() + Math.max(0, wait);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 2500 * (i + 1))); continue; }
      if (res.ok) return await res.json();
      return null;
    } catch { /* retry */ }
  }
  return null;
}

const hangul = (s) => /[가-힣]/.test(String(s || ""));
const filled = [];
const skipped = [];
for (let i = 0; i < targets.length; i += 40) {
  const chunk = targets.slice(i, i + 40);
  const j = await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.map(b => b.entityLinks.wikidata).join("|")}&props=labels|sitelinks&languages=ko&sitefilter=kowiki&format=json`);
  for (const b of chunk) {
    const e = j?.entities?.[b.entityLinks.wikidata];
    const label = e?.labels?.ko?.value || "";
    const title = String(e?.sitelinks?.kowiki?.title || "").replace(/\s*\(.*?\)\s*$/, "");
    const ko = hangul(label) ? label : (hangul(title) ? title : "");
    if (!ko) { skipped.push({ slug: b.urlSlug || b.slug, qid: b.entityLinks.wikidata, why: "ko 레이블 없음" }); continue; }
    // 위키데이터 ko 레이블에는 한국에서 아무도 쓰지 않는 음차·직역이 섞여 있다
    // (DKNY→"디케이엔와이", AMD→"어드밴스트 마이크로 디바이시스", ABC→"미국 방송 회사").
    // 원어가 두문자어이거나, 레이블이 원어 단어 수만큼 길게 풀어 쓴 직역이면 쓰지 않는다.
    const latin = String(b.nameEn || b.name || "").trim();
    const isAcronym = /^[A-Z0-9&.\-]{2,6}$/.test(latin.replace(/\s+/g, ""));
    const wordy = latin.split(/\s+/).length >= 2 && ko.split(/\s+/).length >= latin.split(/\s+/).length && ko.length > latin.length * 0.9;
    if (isAcronym || wordy) { skipped.push({ slug: b.urlSlug || b.slug, qid: b.entityLinks.wikidata, ko, why: isAcronym ? "원어가 두문자어 — 음차 금지" : "직역으로 보임" }); continue; }
    // 원어 표기를 잃지 않도록 nameEn을 먼저 확보한 뒤 표시명을 한글로 바꾼다.
    if (!b.nameEn) b.nameEn = b.name;
    b.nameKo = ko;
    b.name = ko;
    filled.push({ slug: b.urlSlug || b.slug, ko, en: b.nameEn, qid: b.entityLinks.wikidata });
  }
  console.log(`  ${Math.min(i + 40, targets.length)}/${targets.length} — 채움 ${filled.length}`);
}

if (!DRY) {
  const byId = new Map(data.allBrands.map(b => [String(b.id), b]));
  for (const mag of data.brands || []) { const s = byId.get(String(mag.id)); if (s) { mag.name = s.name; mag.nameKo = s.nameKo; mag.nameEn = s.nameEn; } }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
}
fs.writeFileSync(path.join(ROOT, "reports/korean-labels.json"), JSON.stringify({ at: new Date().toISOString().slice(0, 10), filled, skipped }, null, 1));
console.log(`\n한글 표기 ${filled.length}건 추가, ${skipped.length}건 없음${DRY ? " (dry)" : ""}`);
console.log(filled.slice(0, 20).map(f => `${f.en} → ${f.ko}`).join(", "));
