import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const data = JSON.parse(await readFile(resolve(root, "data/brand-atlas.json"), "utf8"));

const forbidden = [
  "브랜드 데이터 확장 후 공개",
  "chief_executive_officer",
  "확인 필요",
  "보강 대상",
  "편집 우선순위",
  "생활 리듬",
  "고객 접점",
  "반복 구매",
  "브랜드 사전에서는",
  "브랜드 마크 이미지 수집 대기",
  "자료 확보 후",
  "하나의 짧은 브랜드 매거진",
  "official_website:",
  "official_website_primary:",
  "wikidata_description:",
  "Wikidata 항목",
  "와 매칭되었습니다",
  "[ 1.",
  "T00:00:00Z",
  "이동 경험과 제품 설계",
  "제품 스타일과 착용 경험",
  "정체성을 만든",
  "xkektl",
];

function fail(message) {
  failures.push(message);
}

const failures = [];
const allBrands = [...(data.brands || []), ...(data.allBrands || [])];
const sourceFieldBrands = allBrands.filter((b) => b.sources || b.references || b.sourceUrl || b.source || b.wikidataId);
if (sourceFieldBrands.length) fail(`공개 DB에 출처 필드가 남아 있습니다: ${sourceFieldBrands.length}개 브랜드`);
for (const key of [
  "sourceImports",
  "contentPolicy",
  "publicFieldCleanup",
  "wikidataEnrichment",
  "realDataEnrichment",
  "factCorrections",
  "qualityPolicy",
  "factualComposition",
  "domesticPush",
  "lastImport",
  "dataPolicy",
]) {
  if (data[key]) fail(`공개 DB 루트에 ${key} 필드가 남아 있습니다.`);
}
const foodRecordLike = allBrands.filter((b) => {
  const text = [b.name, b.nameEn, b.definition, b.summary].join(" ").toLowerCase();
  return b.domainSlug === "food-beverage" && /(record label|record company|records\b|recordings\b|음반사|레코드)/i.test(text);
});

if (foodRecordLike.length) fail(`식음료에 음반/레코드 계열 ${foodRecordLike.length}개가 남아 있습니다.`);

const exactQueries = [
  ["BMW", "BMW"],
  ["스타벅스", "스타벅스"],
  ["나이키", "나이키"],
  ["애플", "애플"],
  ["파타고니아", "파타고니아"],
];

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFC").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function score(b, query) {
  const q = normalize(query);
  const fields = [b.name, b.nameKo, b.nameEn, b.slug, b.industry, b.definition, b.insight].map(normalize);
  let value = 0;
  if (fields.slice(0, 3).some((x) => x === q)) value += 1000;
  if (fields.slice(0, 3).some((x) => x.startsWith(q))) value += 600;
  if (fields[3] === q || fields[3].split(" ").includes(q)) value += 450;
  if (fields.join(" ").includes(q)) value += 120;
  value += Number(b.rating || 0) * 10;
  return value;
}

for (const [query, expected] of exactQueries) {
  const first = [...allBrands].filter((b) => score(b, query) >= 120).sort((a, b) => score(b, query) - score(a, query))[0];
  if (first?.name !== expected) fail(`검색어 "${query}"의 1위가 "${expected}"가 아니라 "${first?.name}"입니다.`);
}

for (const b of allBrands) {
  const publicPayload = {
    definition: b.definition,
    summary: b.summary,
    insight: b.insight,
    sections: b.sections,
  };
  const text = JSON.stringify(publicPayload);
  const found = forbidden.filter((word) => text.includes(word));
  if (found.length) {
    fail(`브랜드 "${b.name}"에 공개 금지/창작 의심 문구가 있습니다: ${found.join(", ")}`);
  }
}

const disabledSyntheticScript = await readFile(resolve(root, "scripts/fill-content-gaps.mjs"), "utf8");
if (!disabledSyntheticScript.startsWith("throw new Error")) {
  fail("창작 보강 스크립트 fill-content-gaps.mjs가 차단되어 있지 않습니다.");
}

const placeholderCount = allBrands.filter((b) => String(b.image || "").includes("brand_atlas_logo_mark")).length;
const noLogoHistory = allBrands.filter((b) => !(b.logoHistory || []).length).length;
console.log(JSON.stringify({
  ok: failures.length === 0,
  failures,
  metrics: {
    brands: allBrands.length,
    foodRecordLike: foodRecordLike.length,
    placeholderImages: placeholderCount,
    noLogoHistory,
    industries: Object.fromEntries(data.industries.map((i) => [i.name, i.count])),
  },
}, null, 2));

if (failures.length) process.exit(1);
