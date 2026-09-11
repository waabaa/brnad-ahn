// 로고 전수 검수(reports/logo-audit-*.json) 판정을 데이터에 반영한다.
//
// 2026-09-12 검수: 대표 로고 1,326개 + BI/CI 460개를 컨택트시트로 전수 확인한 결과
// 122개가 다른 개체의 로고였다(도브=성경 앱 아이콘, 라 메르=프랑스 해난구조협회,
// 버드와이저=체코 부드바르). 초기 수집기가 Commons를 브랜드명으로 검색해 붙인 것이다.
//
// action=remove 항목만 반영한다(unverified는 목록으로만 남긴다).
//   - 대표 로고가 제거되면 남은 BI/CI 중 첫 항목을 대표로 올린다. 없으면 로고 없음.
//   - 사본(brands·brandCards·featuredBrand)은 같은 파일 경로 또는 같은 원본 제목(note)으로 찾아 지운다.
//   - 더 이상 어디서도 참조하지 않는 이미지 파일은 삭제한다(되돌리기는 git).
//
// Usage: node scripts/apply-logo-audit.mjs [reports/logo-audit-2026-09-12.json] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const dry = process.argv.includes("--dry");
const auditPath = process.argv.slice(2).find(a => !a.startsWith("--")) || "reports/logo-audit-2026-09-12.json";
const audit = JSON.parse(fs.readFileSync(path.join(ROOT, auditPath), "utf8"));
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const slugOf = b => b.urlSlug || b.slug;
const removals = audit.items.filter(i => i.action === "remove");
const badSrc = new Set(removals.map(i => i.src));

// 사본은 원격 URL을 그대로 들고 있어 경로로는 못 찾는다 — 같은 브랜드의 원본 제목으로 찾는다.
const badNotes = new Map(); // slug -> Set(note)
for (const b of data.allBrands) {
  for (const h of b.logoHistory || []) {
    if (!badSrc.has(h.src) || !h.note || h.label === "대표 로고") continue;
    if (!badNotes.has(slugOf(b))) badNotes.set(slugOf(b), new Set());
    badNotes.get(slugOf(b)).add(h.note);
  }
}

const stats = { logoRemoved: 0, logoPromoted: 0, historyRemoved: 0, imageCleared: 0 };
const promoted = [];

function clean(b, isPrimary) {
  if (!b) return;
  const notes = badNotes.get(slugOf(b)) || new Set();
  const isBad = h => badSrc.has(h.src) || (h.label !== "대표 로고" && notes.has(h.note));
  const hadBadLogo = b.logo && badSrc.has(b.logo);
  if (Array.isArray(b.logoHistory)) {
    const before = b.logoHistory.length;
    b.logoHistory = b.logoHistory.filter(h => h && !isBad(h));
    if (isPrimary) stats.historyRemoved += before - b.logoHistory.length - (hadBadLogo ? 1 : 0);
  }
  if (hadBadLogo) {
    const oldLogo = b.logo;
    const next = (b.logoHistory || [])[0];
    if (next) {
      b.logo = next.src;
      b.logoHistory[0] = { ...next, label: "대표 로고" };
      if (isPrimary) { stats.logoPromoted++; promoted.push(`${slugOf(b)} -> ${next.src}`); }
    } else {
      b.logo = null;
      if (isPrimary) stats.logoRemoved++;
    }
    if (b.image === oldLogo) { b.image = b.logo || null; if (isPrimary) stats.imageCleared++; }
  }
  if (b.image && badSrc.has(b.image)) { b.image = b.logo || null; if (isPrimary) stats.imageCleared++; }
}

for (const b of data.allBrands) clean(b, true);
for (const key of ["brands", "brandCards"]) for (const b of data[key] || []) clean(b, false);
clean(data.featuredBrand, false);

// 참조가 사라진 파일만 지운다.
const serialized = JSON.stringify(data);
const orphaned = [...badSrc].filter(src => !serialized.includes(src) && fs.existsSync(path.join(ROOT, src)));

console.log(stats);
console.log("promoted:", promoted.length ? "\n  " + promoted.join("\n  ") : "none");
console.log("orphaned files to delete:", orphaned.length);
if (!dry) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
  for (const src of orphaned) fs.unlinkSync(path.join(ROOT, src));
}
