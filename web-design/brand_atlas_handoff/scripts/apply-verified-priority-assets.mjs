import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function commons(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replaceAll("%20", "_")}`;
}

function addLogo(brand, src, label = "대표 로고", year = "") {
  if (!brand || !src) return false;
  brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
  if (!brand.logoHistory.some(item => item.src === src)) {
    brand.logoHistory.unshift({
      src,
      label,
      note: year ? `${year}` : "대표 브랜드 마크",
      alt: `${brand.name} logo`,
      ...(year ? { year } : {}),
    });
  }
  if (!brand.logo || isPlaceholder(brand.logo)) brand.logo = src;
  if (isPlaceholder(brand.image)) brand.image = src;
  return true;
}

const verifiedLogoAssets = {
  coach: commons("Coach New Logo.svg"),
  patagonia: commons("Patagonia (Unternehmen) logo.svg"),
  mini: commons("MINI logo.svg"),
  ferrari: commons("Ferrari wordmark.svg"),
  ugg: commons("UGG logo.svg"),
  cartier: commons("Cartier logo.svg"),
};

let promotedFromHistory = 0;
let appliedPriorityAssets = 0;

for (const brand of data.allBrands || []) {
  const firstLogo = (brand.logoHistory || []).find(item => item?.src && !isPlaceholder(item.src));
  if ((!brand.logo || isPlaceholder(brand.logo)) && firstLogo?.src) {
    brand.logo = firstLogo.src;
    promotedFromHistory += 1;
  }
  if (isPlaceholder(brand.image) && brand.logo && !isPlaceholder(brand.logo)) {
    brand.image = brand.logo;
  }
  const asset = verifiedLogoAssets[brand.slug];
  if (asset && addLogo(brand, asset)) appliedPriorityAssets += 1;
}

for (const brand of data.brands || []) {
  const canonical = (data.allBrands || []).find(item => item.slug === brand.slug);
  if (!canonical) continue;
  brand.logo = canonical.logo;
  brand.image = canonical.image;
  brand.logoHistory = canonical.logoHistory;
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ promotedFromHistory, appliedPriorityAssets }, null, 2));
