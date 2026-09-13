// 사람이 확인한 산업 분류 교정(2026-09-13).
//
// 초기 수집 때 화장품 브랜드 일부가 '헬스·제약'으로 들어갔다(어퓨·코스알엑스 등). 산업 허브에서 눈에 띄는 오분류는
// 광고 심사에서 '품질 낮은 자동 생성'으로 읽힌다. 규칙으로 옮기지 않고 본문을 읽고 확인한 목록만 옮긴다.
// 멱등하다. 데이터 안의 브랜드 사본도 같이 고친다(relatedBrands()가 사본을 참조).
// Usage: node scripts/apply-industry-fixes.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");

// slug → [산업 id, 근거]
const FIXES = {
  "a-pieu": ["beauty-personal-care", "에이블씨엔씨 계열의 저가 화장품 브랜드"],
  "cosrx-2": ["beauty-personal-care", "스킨케어 브랜드"],
  "apr": ["beauty-personal-care", "화장품·뷰티 디바이스 기업"],
  "coreana-cosmetics": ["beauty-personal-care", "화장품 제조사"],
  "charmzone": ["beauty-personal-care", "화장품 브랜드"],
  "somang-cosmetics": ["beauty-personal-care", "화장품 제조사"],
  "enprani": ["beauty-personal-care", "화장품 브랜드"],
};

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const name = new Map(data.industries.map(i => [i.id, i.name]));
const slugOf = (b) => b.urlSlug || b.slug;
const moved = [];
for (const [k, v] of Object.entries(data)) {
  if (!Array.isArray(v)) continue;
  for (const b of v) {
    const fix = b && typeof b === "object" && FIXES[slugOf(b)];
    if (!fix || !("domainSlug" in b) || b.domainSlug === fix[0]) continue;
    if (k === "allBrands") moved.push(`${slugOf(b)}: ${b.domainSlug} → ${fix[0]} (${fix[1]})`);
    b.domainSlug = fix[0];
    if ("industry" in b) b.industry = name.get(fix[0]);
  }
}
for (const i of data.industries) i.count = data.allBrands.filter(b => b.domainSlug === i.id).length;
console.log(`산업 교정 ${moved.length}건`);
for (const m of moved) console.log(`  ${m}`);
if (!DRY && moved.length) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
