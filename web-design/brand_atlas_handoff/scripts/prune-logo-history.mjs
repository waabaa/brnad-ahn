// BI/CI 변천(logoHistory)에서 실제 파일이 없는 항목을 제거한다.
//
// 2026-09-07 실측: 1,194개 항목 중 509개가 존재하지 않는 로컬 파일을 가리켰다 — 브랜드
// 페이지의 "BI/CI 변천사"가 빈 박스로 발행되던 원인이다. 같은 파일을 두 번 가리키는
// 항목과 대표 로고와 같은 파일도 하나로 합친다.
//
// Usage: node scripts/prune-logo-history.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const dry = process.argv.includes("--dry");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const exists = (rel) => !!rel && !/^https?:/.test(rel) && !String(rel).startsWith("data:") && fs.existsSync(path.join(ROOT, rel));
let removed = 0, deduped = 0, logoFixed = 0, imageFixed = 0;

function clean(b) {
  if (b.logo && !/^https?:/.test(b.logo) && !exists(b.logo)) { b.logo = null; logoFixed++; }
  if (b.image && !/^https?:/.test(b.image) && !exists(b.image)) { b.image = b.logo || null; imageFixed++; }
  if (!Array.isArray(b.logoHistory)) return;
  const seen = new Set();
  const kept = [];
  for (const h of b.logoHistory) {
    if (!h || !h.src) { removed++; continue; }
    if (h.status === "asset_pending") { removed++; continue; }
    if (!exists(h.src)) { removed++; continue; }
    const key = String(h.src).replace(/^\.\.\//, "");
    if (seen.has(key)) { deduped++; continue; }
    seen.add(key);
    kept.push(h);
  }
  // 대표 로고가 목록에 없으면 앞에 둔다 — 변천사의 기준점이 된다.
  if (b.logo && exists(b.logo) && !seen.has(b.logo)) kept.unshift({ src: b.logo, label: "대표 로고", note: "현재 사용 중인 마크" });
  b.logoHistory = kept;
}

for (const b of data.allBrands || []) clean(b);
const byId = new Map((data.allBrands || []).map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (src) { m.logoHistory = src.logoHistory; m.logo = src.logo; m.image = src.image; }
  else clean(m);
}
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`BI/CI 제거 ${removed}, 중복 병합 ${deduped}, 로고 경로 정정 ${logoFixed}, 이미지 경로 정정 ${imageFixed}`);
