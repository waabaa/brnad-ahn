import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const userAgent = "BrandAtlasDataBuilder/0.1";

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function isThinDirectoryBrand(brand) {
  return brand.publicReady === false || brand.displayPriority === "low" || (String(brand.tier || "").startsWith("D_") && isPlaceholder(brand.image));
}

function isRelevantSearchResult(brand, result) {
  const label = String(result.label || "").toLowerCase();
  const name = String(brand.nameEn || brand.name || "").toLowerCase();
  const desc = String(result.description || "").toLowerCase();
  if (label !== name) return false;
  if (/record|label|company|brand|retail|fashion|cosmetic|restaurant|coffee|store|manufacturer|chain|기업|브랜드|회사|상표/.test(desc)) return true;
  return false;
}

async function searchEntity(brand) {
  const query = encodeURIComponent(brand.nameEn || brand.name);
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${query}&language=en&format=json&limit=5`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.search || []).find(result => isRelevantSearchResult(brand, result)) || null;
}

async function getEntity(id) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(id)}&props=labels|descriptions|claims&languages=ko|en&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.entities?.[id] || null;
}

function claimValue(entity, property) {
  const claim = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  if (!claim) return "";
  if (typeof claim === "string") return claim;
  if (claim.time) return claim.time.replace(/^\+/, "").slice(0, 10);
  if (claim.id) return claim.id;
  if (claim["numeric-id"]) return `Q${claim["numeric-id"]}`;
  return "";
}

async function labelFor(id) {
  if (!id || !/^Q\d+$/.test(id)) return "";
  const entity = await getEntity(id);
  return entity?.labels?.ko?.value || entity?.labels?.en?.value || "";
}

function commonsUrl(fileName) {
  if (!fileName) return "";
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replaceAll("%20", "_")}`;
}

function yearFromDate(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function particle(name) {
  const s = String(name || "").trim();
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

async function enrichBrand(brand) {
  const hit = await searchEntity(brand);
  if (!hit?.id) return false;
  const entity = await getEntity(hit.id);
  if (!entity) return false;

  const description = entity.descriptions?.ko?.value || entity.descriptions?.en?.value || hit.description || "";
  const website = claimValue(entity, "P856");
  const inception = claimValue(entity, "P571");
  const country = await labelFor(claimValue(entity, "P495"));
  const headquarters = await labelFor(claimValue(entity, "P159"));
  const founder = await labelFor(claimValue(entity, "P112"));
  const parent = await labelFor(claimValue(entity, "P749"));
  const logo = commonsUrl(claimValue(entity, "P154"));
  const image = commonsUrl(claimValue(entity, "P18"));

  brand.wikidataId = hit.id;
  if (description) {
    const base = `${brand.name}${particle(brand.name)} ${description.replace(/\.$/, "")}입니다.`;
    brand.definition = base;
    brand.summary = base;
    brand.sections = brand.sections || {};
    brand.sections.overview = { body: base };
  }
  if (website) brand.officialWebsite = website;
  if (country) brand.country = country;
  if (headquarters) brand.headquarters = headquarters;
  if (logo && !brand.logo) {
    brand.logo = logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    brand.logoHistory.unshift({ src: logo, label: "대표 로고", note: "Primary brand mark", alt: `${brand.name} logo` });
  }
  if (image && isPlaceholder(brand.image)) brand.image = image;

  const facts = [];
  if (brand.officialWebsite) facts.push(`공식 웹사이트: ${brand.officialWebsite}`);
  if (country) facts.push(`국가: ${country}`);
  if (headquarters) facts.push(`본사: ${headquarters}`);
  if (parent) facts.push(`상위/소유 조직: ${parent}`);
  if (founder) facts.push(`창업자: ${founder}`);
  if (inception) facts.push(`설립/시작: ${inception}`);
  if (brand.industry) facts.push(`산업: ${brand.industry}`);
  brand.sections = brand.sections || {};
  brand.sections.current = { body: facts.join("; ") };

  const year = yearFromDate(inception);
  if (year) {
    brand.timeline = Array.isArray(brand.timeline) ? brand.timeline : [];
    if (!brand.timeline.some(item => Number(item.year) === year && /설립|시작/.test(item.description || ""))) {
      brand.timeline.unshift({ year, brand: brand.name, description: `${brand.name} 설립 또는 시작 시점` });
    }
  }

  if (brand.logo || !isPlaceholder(brand.image) || facts.length >= 3) {
    brand.publicReady = true;
    brand.displayPriority = "normal";
    brand.tier = "C_source_backed";
    brand.rating = Math.max(Number(brand.rating || 0), 4.1);
  }
  return true;
}

let attempted = 0;
let enriched = 0;
const targets = (data.allBrands || []).filter(isThinDirectoryBrand).slice(0, 140);
for (const brand of targets) {
  attempted += 1;
  try {
    if (await enrichBrand(brand)) enriched += 1;
  } catch {
    // Keep the existing record if an external lookup fails.
  }
}

data.wikidataEnrichment = {
  attempted,
  enriched,
  updatedAt: new Date().toISOString(),
  storedSourceFields: false,
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.wikidataEnrichment, null, 2));
