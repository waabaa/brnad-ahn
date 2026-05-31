import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function isMusicLabel(brand) {
  const text = [brand.name, brand.nameEn, brand.definition, brand.summary].join(" ");
  return /(record label|record company|records\b|recordings\b|음반사|레코드|music label|레이블)/i.test(text);
}

function hasMagazineBody(brand) {
  const sections = brand.sections || {};
  return ["insights", "origin", "identity", "products", "people"].some(key => String(sections[key]?.body || "").trim().length > 40);
}

function particle(name) {
  const s = String(name || "").trim();
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

let refined = 0;
let hidden = 0;

for (const brand of data.allBrands || []) {
  const thinMediaDirectory = brand.domainSlug === "media-entertainment" && isPlaceholder(brand.image) && !hasMagazineBody(brand);
  if (!isMusicLabel(brand) && !thinMediaDirectory) continue;
  brand.domainSlug = "media-entertainment";
  brand.industry = "미디어·엔터테인먼트";
  if (isPlaceholder(brand.image) && !hasMagazineBody(brand)) {
    brand.tier = "D_directory_only";
    brand.rating = 3.2;
    brand.displayPriority = "low";
    brand.publicReady = false;
    brand.definition = `${brand.name}${particle(brand.name)} 음반과 아티스트 카탈로그를 다루는 음악 레이블입니다.`;
    brand.summary = brand.definition;
    brand.sections = brand.sections || {};
    brand.sections.overview = { body: brand.definition };
    for (const key of ["insights", "origin", "identity", "external", "products", "people"]) {
      brand.sections[key] = { body: "" };
    }
    hidden += 1;
  }
  refined += 1;
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

data.qualityPolicy = {
  thinDirectoryBrandsDemoted: hidden,
  musicLabelsReviewed: refined,
  rule: "thin_directory_items_keep_data_but_are_not_prioritized",
  updatedAt: new Date().toISOString(),
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.qualityPolicy, null, 2));
