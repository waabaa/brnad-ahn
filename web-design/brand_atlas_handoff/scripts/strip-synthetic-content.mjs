import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const SYNTHETIC_PATTERNS = [
  /고객 접점/,
  /반복 구매 경험/,
  /생활 리듬/,
  /브랜드 사전에서는/,
  /업태, 고객 접점/,
  /시장 안에서 차지하는 위치/,
  /브랜드 마크 이미지 수집 대기/,
  /영역의\s+.+브랜드/,
  /고객과 만나며/,
  /브랜드 인상을 구성/,
  /브랜드 접점을 만들어/,
  /보강 대상/,
  /편집 우선순위/,
  /자료 확보 후/,
  /하나의 짧은 브랜드 매거진/,
  /이동 경험과 제품 설계/,
  /제품 스타일과 착용 경험/,
  /정체성을 만든/,
  /로 정리됩니다/,
  /연결됩니다/,
  /xkektl/,
  /horology/,
  /quick service restaurant sector/,
];

function nameOf(brand) {
  return brand.nameKo || brand.name || brand.nameEn || "이 브랜드";
}

function subject(name) {
  return /[A-Za-z0-9&.)]$/.test(name) ? `${name}은` : `${name}는`;
}

function normalizeSentence(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function extractedDescriptor(brand) {
  const name = nameOf(brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const candidates = [
    brand.definition,
    brand.summary,
    brand.sections?.overview?.body,
    brand.insight,
  ].map(normalizeSentence);

  for (const text of candidates) {
    const direct = new RegExp(`${name}(?:은|는)\\s+(.+?)(?:이다|입니다|으로|로,)`).exec(text);
    const value = direct?.[1]?.trim();
    if (value && value.length <= 80 && !SYNTHETIC_PATTERNS.some((p) => p.test(value))) return value;
  }

  const currentIndustry = /산업:\s*([^;]+)/.exec(brand.sections?.current?.body || "")?.[1]?.trim();
  if (currentIndustry) return `${currentIndustry} 분야의 브랜드`;
  if (brand.industry) return `${brand.industry} 분야의 브랜드`;
  return "브랜드";
}

function cleanCurrent(value = "") {
  return String(value)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^편집 상태:/.test(item))
    .filter((item) => !/^BI\/CI 상태:/.test(item))
    .join("; ");
}

let stripped = 0;

for (const brand of data.allBrands || []) {
  const raw = JSON.stringify({
    definition: brand.definition,
    summary: brand.summary,
    insight: brand.insight,
    sections: brand.sections,
    logoHistory: brand.logoHistory,
  });
  const hasSynthetic = brand.contentStatus === "baseline_filled" || SYNTHETIC_PATTERNS.some((pattern) => pattern.test(raw));
  if (!hasSynthetic) continue;

  const name = nameOf(brand);
  const descriptor = extractedDescriptor(brand);
  const factualDefinition = `${subject(name)} ${descriptor}입니다.`;
  const current = cleanCurrent(brand.sections?.current?.body || "");

  brand.definition = factualDefinition;
  brand.summary = factualDefinition;
  brand.insight = "";
  brand.sections = {
    overview: { body: factualDefinition },
    insights: { body: "" },
    origin: { body: "" },
    identity: { body: "" },
    external: { body: "" },
    products: { body: "" },
    people: { body: "" },
    current: { body: current },
  };
  if (Array.isArray(brand.logoHistory)) {
    brand.logoHistory = brand.logoHistory.filter((item) => item.status !== "asset_pending");
  }
  if (!brand.logoHistory?.length) brand.logoHistory = [];
  delete brand.contentStatus;
  if (brand.logoStatus === "asset_pending") delete brand.logoStatus;
  stripped += 1;
}

data.contentPolicy = {
  updatedAt: new Date().toISOString(),
  rule: "verified_facts_only",
  strippedSyntheticBrands: stripped,
};
delete data.contentFill;

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.contentPolicy, null, 2));
