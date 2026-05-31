import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const GENERIC_PATTERNS = [
  /분야의 브랜드입니다\.?$/,
  /음반과 아티스트 카탈로그를 다루는 음악 레이블입니다\.?$/,
  /음악과 아티스트 카탈로그를 운영하는 레이블입니다\.?$/,
  /^.{1,40}은 .{1,30}입니다\.?$/,
];

function clean(value) {
  return String(value || "")
    .replace(/\b(\d{4})-\d{2}-\d{2}T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-\d{2}-00T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-00-00T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-00-00\b/g, "$1년")
    .replace(/\s+/g, " ")
    .trim();
}

function particle(name) {
  const s = String(name || "").trim();
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

function parseMeta(text) {
  const meta = {};
  for (const part of String(text || "").split(";").map(x => x.trim()).filter(Boolean)) {
    const index = part.indexOf(":");
    if (index < 0) continue;
    const key = clean(part.slice(0, index));
    const value = clean(part.slice(index + 1));
    if (!key || !value) continue;
    const normalized = key
      .replace(/^country$/i, "국가")
      .replace(/^headquarters$/i, "본사")
      .replace(/^industry$/i, "산업")
      .replace(/^revenue$/i, "매출")
      .replace(/^employees$/i, "직원 수")
      .replace(/^official_website$/i, "공식 웹사이트")
      .replace(/^inception$/i, "설립/시작");
    meta[normalized] = meta[normalized] ? `${meta[normalized]}; ${value}` : value;
  }
  return meta;
}

function isGeneric(text) {
  const value = clean(text);
  return !value || GENERIC_PATTERNS.some(pattern => pattern.test(value)) || /wikidata_description|성씨|남성의 이름|commune|town|genus|grammatical case/.test(value);
}

function year(value) {
  const match = clean(value).match(/\d{4}년|\d{4}/);
  return match ? match[0].replace(/(\d{4})$/, "$1년") : "";
}

function firstValue(value, max = 4) {
  return clean(value).split(";").map(x => x.trim()).filter(Boolean).slice(0, max).join(", ");
}

function overview(brand, meta) {
  const country = firstValue(meta["국가"], 2);
  const industry = firstValue(meta["산업"], 3) || brand.industry;
  const founded = year(meta["설립/시작"]);
  const founder = firstValue(meta["창업자"], 3);
  const parent = firstValue(meta["상위/소유 조직"] || meta["소유자"], 2);
  const parts = [];
  parts.push(`${brand.name}${particle(brand.name)} ${country ? `${country}의 ` : ""}${industry || brand.industry} 브랜드입니다.`);
  const facts = [
    founded ? `${founded}에 시작된 것으로 정리됩니다` : "",
    founder ? `창업자/관련 인물로 ${founder}가 기록되어 있습니다` : "",
    parent ? `상위 또는 소유 조직으로 ${parent}가 연결됩니다` : "",
  ].filter(Boolean);
  if (facts.length) parts.push(facts.join(". ") + ".");
  return parts.join(" ");
}

function origin(brand, meta) {
  const founded = year(meta["설립/시작"]);
  const founder = firstValue(meta["창업자"], 5);
  const country = firstValue(meta["국가"], 2);
  const hq = firstValue(meta["본사"], 2);
  if (!founded && !founder && !country && !hq) return "";
  return [
    founded ? `${brand.name}${particle(brand.name)} ${founded}을 주요 시작 시점으로 기록합니다.` : "",
    founder ? `창업자 또는 초기 관련 인물은 ${founder}입니다.` : "",
    country || hq ? `국가/거점 정보는 ${[country, hq].filter(Boolean).join(", ")}로 정리됩니다.` : "",
  ].filter(Boolean).join(" ");
}

function people(meta) {
  const rows = [];
  if (meta["창업자"]) rows.push(`창업자: ${firstValue(meta["창업자"], 8)}`);
  if (meta["CEO"]) rows.push(`CEO: ${firstValue(meta["CEO"], 6)}`);
  if (meta["상위/소유 조직"]) rows.push(`상위/소유 조직: ${firstValue(meta["상위/소유 조직"], 6)}`);
  if (meta["소유자"]) rows.push(`소유자: ${firstValue(meta["소유자"], 6)}`);
  return rows.join("; ");
}

function products(brand, meta) {
  const product = firstValue(meta["주요 제품"] || meta["제품"] || meta["products"], 8);
  const industry = firstValue(meta["산업"], 5) || brand.industry;
  if (!product && !industry) return "";
  return [product ? `주요 제품·서비스: ${product}` : "", industry ? `관련 산업: ${industry}` : ""].filter(Boolean).join("; ");
}

function current(brand, meta) {
  const fields = [
    "공식 웹사이트",
    "국가",
    "본사",
    "상위/소유 조직",
    "소유자",
    "산업",
    "매출",
    "직원 수",
  ];
  const rows = fields
    .filter(key => meta[key])
    .map(key => `${key}: ${firstValue(meta[key], key === "매출" ? 4 : 6)}`);
  if (!rows.length && brand.industry) rows.push(`산업: ${brand.industry}`);
  return rows.join("; ");
}

let composed = 0;
let overviewUpdated = 0;
let originUpdated = 0;
let peopleUpdated = 0;
let productsUpdated = 0;

for (const brand of [...(data.allBrands || []), ...(data.brands || [])]) {
  const meta = parseMeta(brand.sections?.current?.body || "");
  if (!meta["산업"] && brand.industry) meta["산업"] = brand.industry;
  brand.sections = brand.sections || {};
  const newOverview = overview(brand, meta);
  if (isGeneric(brand.definition) || isGeneric(brand.sections.overview?.body)) {
    brand.definition = newOverview;
    brand.summary = newOverview;
    brand.sections.overview = { body: newOverview };
    overviewUpdated += 1;
  }
  const newOrigin = origin(brand, meta);
  if (newOrigin && !brand.sections.origin?.body) {
    brand.sections.origin = { body: newOrigin };
    originUpdated += 1;
  }
  const newPeople = people(meta);
  if (newPeople && !brand.sections.people?.body) {
    brand.sections.people = { body: newPeople };
    peopleUpdated += 1;
  }
  const newProducts = products(brand, meta);
  if (newProducts && !brand.sections.products?.body) {
    brand.sections.products = { body: newProducts };
    productsUpdated += 1;
  }
  brand.sections.current = { body: current(brand, meta) };
  composed += 1;
}

data.factualComposition = {
  composed,
  overviewUpdated,
  originUpdated,
  peopleUpdated,
  productsUpdated,
  updatedAt: new Date().toISOString(),
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.factualComposition, null, 2));
