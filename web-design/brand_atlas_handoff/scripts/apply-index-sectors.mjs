// 금융·에너지/산업재 산업 분류를 적용한다(2026-09-12).
//
// 산업 분류가 소비재 중심 13개였을 때 S&P 500 기업의 절반 이상(금융·유틸리티·산업재·소재·에너지·리츠)이
// 들어갈 자리가 없어 '기술·전자'나 '브랜드·비즈니스'로 흘러 들어갔다. 두 산업을 두고 다음 근거로만 옮긴다.
//
//  1) 지수 구성 기업(reports/index-coverage-*.json): 공식 섹터(S&P 500은 GICS, 나스닥100 전용은 ICB).
//     소비재·커뮤니케이션 섹터는 기존 산업 분류가 더 세밀하므로 건드리지 않는다.
//  2) 컬렉션 멤버(Wikidata 근거): banking·fintech → 금융, energy → 에너지·산업재.
//  AI 산업(pinned)으로 옮겨진 브랜드는 건드리지 않는다.
//
// 멱등하다. 수록(import) 뒤·assign-collections 앞에 돌린다.
// Usage: node scripts/apply-index-sectors.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const COVERAGE = path.join(ROOT, "reports/index-coverage-2026-09-12.json");
const REPORT = path.join(ROOT, "reports/index-sectors.json");

const NEW_INDUSTRIES = [
  { id: "finance", name: "금융", nameEn: "Finance", icon: "assets/objects/brand_atlas_logo_mark.png", examples: [], isicCode: "K", isicLabel: "Financial and insurance activities",
    description: "은행·보험·카드·결제·자산운용, 그리고 부동산 투자처럼 돈의 흐름을 다루는 금융 브랜드를 모았습니다." },
  { id: "industrial-energy", name: "에너지·산업재", nameEn: "Energy & Industrials", icon: "assets/objects/icon_tech.png", examples: [], isicCode: "D", isicLabel: "Electricity, gas, steam and air conditioning supply; Manufacturing",
    description: "전력·가스·석유 같은 에너지 기업과 항공우주·기계·화학·소재처럼 산업의 기반을 만드는 브랜드를 모았습니다." },
];
const GICS = { Financials: "finance", "Real Estate": "finance", Energy: "industrial-energy", Utilities: "industrial-energy", Industrials: "industrial-energy", Materials: "industrial-energy", "Health Care": "health-pharma", "Information Technology": "technology-electronics" };
const ICB = { Financials: "finance", "Real Estate": "finance", Energy: "industrial-energy", Utilities: "industrial-energy", Industrials: "industrial-energy", "Basic Materials": "industrial-energy", "Health Care": "health-pharma", Technology: "technology-electronics" };
const COLLECTION_TO = { banking: "finance", fintech: "finance", energy: "industrial-energy" };
const KEEP = new Set(["ai"]);
// 섹터 근거 이동의 예외:
//  - 운송 하위산업(항공·육상 여객/화물·물류·철도)은 GICS상 Industrials지만 이용자가 만나는 브랜드라 기존 분류(모빌리티·여행)를 둔다.
//  - 소비자 분류에 있는 브랜드는 섹터로 옮기지 않는다(섹터는 투자 분류라 브랜드 경험을 반영하지 않는다).
//  컬렉션 근거(Wikidata) 이동은 이 예외를 적용하지 않는다 — 정유사가 '모빌리티'에 있던 것을 바로잡는 경로다.
const TRANSPORT_SUB = /Airlines|Ground Transportation|Air Freight|Logistics|Rail Transportation/;
const CONSUMER = new Set(["travel-hospitality", "media-entertainment", "home-lifestyle", "retail-commerce", "food-beverage", "fashion-luxury", "beauty-personal-care", "sports-outdoor"]);

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
for (const ind of NEW_INDUSTRIES) if (!data.industries.some(i => i.id === ind.id)) data.industries.push({ ...ind, count: 0 });
const name = new Map(data.industries.map(i => [i.id, i.name]));

const cov = fs.existsSync(COVERAGE) ? JSON.parse(fs.readFileSync(COVERAGE, "utf8")).companies : [];
const sectorByQ = new Map(cov.map(c => [c.qid, c.sectors || {}]));
const qidOf = b => b.entityLinks?.wikidata || b.wikidata?.qid || null;
const slugOf = b => b.urlSlug || b.slug;

const moves = [];
const target = new Map();
for (const b of data.allBrands) {
  if (KEEP.has(b.domainSlug)) continue;
  let to = null, why = null;
  const sec = sectorByQ.get(qidOf(b));
  const sectorOk = sec && !CONSUMER.has(b.domainSlug) && !TRANSPORT_SUB.test(sec.gicsSub || sec.icbSub || "");
  if (sectorOk && sec.gics && GICS[sec.gics]) { to = GICS[sec.gics]; why = `GICS ${sec.gics} / ${sec.gicsSub || ""}`; }
  else if (sectorOk && !sec.gics && sec.icb && ICB[sec.icb]) { to = ICB[sec.icb]; why = `ICB ${sec.icb} / ${sec.icbSub || ""}`; }
  if (!to) for (const c of b.collections || []) if (COLLECTION_TO[c]) { to = COLLECTION_TO[c]; why = `collection ${c}`; break; }
  if (!to || to === b.domainSlug) continue;
  moves.push({ slug: slugOf(b), from: b.domainSlug, to, why });
  target.set(slugOf(b), to);
  b.domainSlug = to; b.industry = name.get(to);
}
// 데이터 안의 브랜드 사본(brands 등)도 같은 값으로 맞춘다 — relatedBrands()가 사본을 참조한다.
for (const [k, v] of Object.entries(data)) {
  if (k === "allBrands" || !Array.isArray(v)) continue;
  for (const x of v) if (x && typeof x === "object" && "domainSlug" in x && target.has(slugOf(x))) { x.domainSlug = target.get(slugOf(x)); if ("industry" in x) x.industry = name.get(x.domainSlug); }
}
for (const i of data.industries) {
  i.count = data.allBrands.filter(b => b.domainSlug === i.id).length;
  if (NEW_INDUSTRIES.some(n => n.id === i.id)) i.examples = data.allBrands.filter(b => b.domainSlug === i.id && b.nameKo).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4).map(b => b.nameKo);
}
const tally = {};
for (const m of moves) tally[`${m.from}→${m.to}`] = (tally[`${m.from}→${m.to}`] || 0) + 1;
console.log(`이동 ${moves.length}건`, tally);
console.log(Object.fromEntries(data.industries.map(i => [i.id, i.count])));
if (!DRY) {
  const prev = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, "utf8")).moves : [];
  fs.writeFileSync(REPORT, JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), moves: [...prev, ...moves] }, null, 1));
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
}
