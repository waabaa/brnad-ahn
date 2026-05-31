import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const META_PATTERN = /\b(official_website|official_website_primary|country|headquarters|industry|revenue|stock_exchange|wikidata_description|brand_value_ranking|founded_by|owned_by|chief_executive_officer|inception):/i;
const DUPLICATE_META_PATTERN = /\s+(official_website_primary|wikidata_description|official_website|country|headquarters|owned_by|parent_organization|industry|창업자|CEO|stock_exchange|inception|revenue|employees):/i;

function hasMeta(value) {
  return META_PATTERN.test(String(value || ""));
}

function particle(name) {
  const last = String(name || "").trim().charCodeAt(String(name || "").trim().length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "은";
  return (last - 0xac00) % 28 === 0 ? "는" : "은";
}

function cleanValue(brand, value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!hasMeta(text)) return text;
  const first = text.split(META_PATTERN)[0].trim();
  if (first && first.length >= 12 && !hasMeta(first)) return first.replace(/\s+분야의 브랜드입니다\.$/, " 분야의 브랜드입니다.");
  const industry = brand.industry || "브랜드";
  return `${brand.name}${particle(brand.name)} ${industry} 분야의 브랜드입니다.`;
}

let cleaned = 0;
const brandRefs = [...(data.allBrands || []), ...(data.brands || [])];
for (const brand of brandRefs) {
  for (const key of ["definition", "summary", "insight"]) {
    if (hasMeta(brand[key])) {
      brand[key] = cleanValue(brand, brand[key]);
      cleaned += 1;
    }
  }
  const overview = brand.sections?.overview?.body;
  if (hasMeta(overview)) {
    brand.sections.overview.body = cleanValue(brand, overview);
    cleaned += 1;
  }
  const current = brand.sections?.current?.body;
  if (hasMeta(current)) {
    const firstPart = String(current || "").split(DUPLICATE_META_PATTERN)[0].trim();
    if (firstPart && /공식 웹사이트:|국가:|본사:|산업:|소유자:|상위\/소유 조직:|revenue:|employees:/.test(firstPart)) {
      brand.sections.current.body = firstPart
        .replace(/\brevenue:/g, "매출:")
        .replace(/\bemployees:/g, "직원 수:");
    } else {
      brand.sections.current.body = brand.industry ? `산업: ${brand.industry}` : "";
    }
    cleaned += 1;
  }
}

data.publicFieldCleanup = {
  cleaned,
  rule: "metadata_tokens_removed_from_public_prose",
  updatedAt: new Date().toISOString(),
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.publicFieldCleanup, null, 2));
