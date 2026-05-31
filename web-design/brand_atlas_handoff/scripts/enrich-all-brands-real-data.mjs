import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const userAgent = "BrandAtlasDataBuilder/0.2";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const labelCache = new Map();
const entityCache = new Map();

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function particle(name) {
  const s = String(name || "").trim();
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

function yearFromDate(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function dateToKorean(value) {
  const year = yearFromDate(value);
  return year ? `${year}년` : "";
}

function commonsUrl(fileName) {
  if (!fileName) return "";
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replaceAll("%20", "_")}`;
}

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadDescription(desc) {
  return /surname|given name|commune|town|village|genus|grammatical case|성씨|남성의 이름|여성의 이름|연구원|문법|지명|코뮌|마을|속 \(생물학\)/i.test(String(desc || ""));
}

function isRelevantEntity(brand, result) {
  const names = [brand.name, brand.nameKo, brand.nameEn].filter(Boolean).map(normalize);
  const label = normalize(result.label);
  const desc = String(result.description || "");
  if (!names.includes(label)) return false;
  if (isBadDescription(desc)) return false;
  if (String(brand.domainSlug || "") === "media-entertainment") return /record|label|media|entertainment|music|broadcast|film|음악|미디어|엔터|방송|레이블|음반/i.test(desc);
  return /brand|company|corporation|manufacturer|retailer|chain|restaurant|fashion|cosmetic|technology|software|automotive|food|beverage|기업|회사|브랜드|제조|소매|패션|화장품|기술|자동차|식품|음료|체인/i.test(desc);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": userAgent, "Accept": "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function searchEntity(brand) {
  const queries = [...new Set([brand.nameEn, brand.name, brand.nameKo].filter(Boolean))];
  for (const query of queries) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=8`;
    const json = await fetchJson(url);
    const hit = (json.search || []).find(result => isRelevantEntity(brand, result));
    if (hit) return hit;
    await sleep(35);
  }
  return null;
}

async function getEntity(id) {
  if (!id || entityCache.has(id)) return entityCache.get(id);
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(id)}&props=labels|descriptions|claims&languages=ko|en&format=json`;
  const json = await fetchJson(url);
  const entity = json.entities?.[id] || null;
  entityCache.set(id, entity);
  await sleep(35);
  return entity;
}

function claimValues(entity, property, limit = 8) {
  return (entity.claims?.[property] || [])
    .map(claim => claim?.mainsnak?.datavalue?.value)
    .filter(Boolean)
    .map(value => {
      if (typeof value === "string") return value;
      if (value.time) return value.time.replace(/^\+/, "").slice(0, 10);
      if (value.id) return value.id;
      if (value["numeric-id"]) return `Q${value["numeric-id"]}`;
      if (value.amount) return value.amount.replace(/^\+/, "");
      return "";
    })
    .filter(Boolean)
    .slice(0, limit);
}

async function labelsFor(ids) {
  const unique = [...new Set(ids.filter(id => /^Q\d+$/.test(String(id || ""))))].filter(id => !labelCache.has(id));
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    if (!chunk.length) continue;
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.map(encodeURIComponent).join("|")}&props=labels&languages=ko|en&format=json`;
    const json = await fetchJson(url);
    for (const id of chunk) {
      const entity = json.entities?.[id];
      labelCache.set(id, entity?.labels?.ko?.value || entity?.labels?.en?.value || "");
    }
    await sleep(35);
  }
  return ids.map(id => labelCache.get(id)).filter(Boolean);
}

async function buildFacts(entity) {
  const ids = [
    ...claimValues(entity, "P495", 3),
    ...claimValues(entity, "P17", 3),
    ...claimValues(entity, "P159", 3),
    ...claimValues(entity, "P112", 8),
    ...claimValues(entity, "P169", 6),
    ...claimValues(entity, "P749", 5),
    ...claimValues(entity, "P127", 5),
    ...claimValues(entity, "P452", 6),
    ...claimValues(entity, "P1056", 10),
  ];
  await labelsFor(ids);
  const labelList = (property, limit = 8) => claimValues(entity, property, limit).map(id => labelCache.get(id)).filter(Boolean);
  return {
    description: cleanDescription(entity.descriptions?.ko?.value || entity.descriptions?.en?.value || ""),
    officialWebsite: claimValues(entity, "P856", 1)[0] || "",
    country: [...labelList("P495", 3), ...labelList("P17", 3)].filter(Boolean).slice(0, 3),
    headquarters: labelList("P159", 3),
    founders: labelList("P112", 8),
    ceos: labelList("P169", 6),
    parentOrganizations: [...labelList("P749", 5), ...labelList("P127", 5)].filter(Boolean).slice(0, 6),
    industries: labelList("P452", 6),
    products: labelList("P1056", 10),
    inception: claimValues(entity, "P571", 1)[0] || "",
    revenue: claimValues(entity, "P2139", 4),
    employees: claimValues(entity, "P1128", 3),
    logo: commonsUrl(claimValues(entity, "P154", 1)[0]),
    image: commonsUrl(claimValues(entity, "P18", 1)[0]),
  };
}

function sentenceList(items, max = 6) {
  return [...new Set(items.filter(Boolean))].slice(0, max).join(", ");
}

function buildOverview(brand, facts) {
  const desc = cleanDescription(facts.description);
  if (desc && !isBadDescription(desc)) {
    const country = sentenceList(facts.country, 2);
    const year = dateToKorean(facts.inception);
    const industry = sentenceList(facts.industries, 3);
    const parts = [`${brand.name}${particle(brand.name)} ${desc}입니다.`];
    if (country || year || industry) {
      const factsLine = [
        country ? `국가 ${country}` : "",
        year ? `설립/시작 ${year}` : "",
        industry ? `산업 ${industry}` : "",
      ].filter(Boolean).join(", ");
      parts.push(`${factsLine}로 정리됩니다.`);
    }
    return parts.join(" ");
  }
  return brand.definition || "";
}

function buildOrigin(brand, facts) {
  const year = dateToKorean(facts.inception);
  const founders = sentenceList(facts.founders, 5);
  const country = sentenceList(facts.country, 2);
  if (!year && !founders && !country) return "";
  return `${brand.name}${particle(brand.name)}${year ? ` ${year}` : ""}${country ? ` ${country}에서` : ""}${founders ? ` ${founders}와 연결되어` : ""} 시작된 브랜드로 정리됩니다.`;
}

function buildProducts(brand, facts) {
  const products = sentenceList(facts.products, 10);
  const industries = sentenceList(facts.industries, 5);
  if (!products && !industries) return "";
  return [products ? `주요 제품·서비스: ${products}` : "", industries ? `관련 산업: ${industries}` : ""].filter(Boolean).join("; ");
}

function buildPeople(facts) {
  const rows = [];
  const founders = sentenceList(facts.founders, 8);
  const ceos = sentenceList(facts.ceos, 6);
  const parents = sentenceList(facts.parentOrganizations, 6);
  if (founders) rows.push(`창업자: ${founders}`);
  if (ceos) rows.push(`CEO: ${ceos}`);
  if (parents) rows.push(`상위/소유 조직: ${parents}`);
  return rows.join("; ");
}

function buildCurrent(brand, facts) {
  const rows = [];
  if (facts.officialWebsite) rows.push(`공식 웹사이트: ${facts.officialWebsite}`);
  if (facts.country.length) rows.push(`국가: ${sentenceList(facts.country, 3)}`);
  if (facts.headquarters.length) rows.push(`본사: ${sentenceList(facts.headquarters, 3)}`);
  if (facts.industries.length) rows.push(`산업: ${sentenceList(facts.industries, 5)}`);
  if (facts.revenue.length) rows.push(`매출: ${sentenceList(facts.revenue, 4)}`);
  if (facts.employees.length) rows.push(`직원 수: ${sentenceList(facts.employees, 3)}`);
  if (!rows.length && brand.industry) rows.push(`산업: ${brand.industry}`);
  return rows.join("; ");
}

function applyFacts(brand, facts) {
  brand.facts = {
    description: facts.description,
    officialWebsite: facts.officialWebsite,
    country: facts.country,
    headquarters: facts.headquarters,
    founders: facts.founders,
    ceos: facts.ceos,
    parentOrganizations: facts.parentOrganizations,
    industries: facts.industries,
    products: facts.products,
    inception: facts.inception,
    revenue: facts.revenue,
    employees: facts.employees,
  };
  if (facts.officialWebsite) brand.officialWebsite = facts.officialWebsite;
  if (facts.logo && !brand.logo) {
    brand.logo = facts.logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    if (!brand.logoHistory.some(item => item.src === facts.logo)) {
      brand.logoHistory.unshift({ src: facts.logo, label: "대표 로고", note: "Primary brand mark", alt: `${brand.name} logo` });
    }
  }
  if (facts.image && isPlaceholder(brand.image)) brand.image = facts.image;

  const overview = buildOverview(brand, facts);
  if (overview) {
    brand.definition = overview;
    brand.summary = overview;
  }
  brand.sections = brand.sections || {};
  brand.sections.overview = { body: overview || brand.definition || "" };
  brand.sections.origin = { body: buildOrigin(brand, facts) };
  brand.sections.products = { body: buildProducts(brand, facts) };
  brand.sections.people = { body: buildPeople(facts) };
  brand.sections.current = { body: buildCurrent(brand, facts) };
  for (const key of ["insights", "identity", "external"]) {
    if (!brand.sections[key]) brand.sections[key] = { body: "" };
  }

  const year = yearFromDate(facts.inception);
  if (year) {
    brand.timeline = Array.isArray(brand.timeline) ? brand.timeline : [];
    if (!brand.timeline.some(item => Number(item.year) === year && /설립|시작/.test(item.description || ""))) {
      brand.timeline.unshift({ year, brand: brand.name, description: `${brand.name} 설립 또는 시작 시점` });
    }
  }

  const richness = [
    facts.officialWebsite,
    facts.country.length,
    facts.headquarters.length,
    facts.founders.length,
    facts.products.length,
    facts.logo || facts.image,
  ].filter(Boolean).length;
  if (richness >= 2) {
    brand.publicReady = true;
    brand.displayPriority = "normal";
    if (String(brand.tier || "").startsWith("D_")) brand.tier = "C_source_backed";
    brand.rating = Math.max(Number(brand.rating || 0), 4.1);
  }
  return richness;
}

let attempted = 0;
let matched = 0;
let enriched = 0;
let skippedBad = 0;

for (const brand of data.allBrands || []) {
  attempted += 1;
  try {
    const hit = await searchEntity(brand);
    if (!hit?.id) continue;
    matched += 1;
    const entity = await getEntity(hit.id);
    if (!entity) continue;
    const facts = await buildFacts(entity);
    if (isBadDescription(facts.description)) {
      skippedBad += 1;
      continue;
    }
    const richness = applyFacts(brand, facts);
    if (richness > 0) enriched += 1;
  } catch {
    // Leave the existing brand untouched when lookup fails.
  }
}

for (const industry of data.industries || []) {
  const rows = (data.allBrands || []).filter(b => b.domainSlug === industry.id);
  industry.count = rows.length;
  industry.examples = rows
    .filter(b => b.publicReady !== false)
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 3)
    .map(b => b.name);
}

data.realDataEnrichment = {
  attempted,
  matched,
  enriched,
  skippedBad,
  updatedAt: new Date().toISOString(),
  storedSourceFields: false,
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.realDataEnrichment, null, 2));
