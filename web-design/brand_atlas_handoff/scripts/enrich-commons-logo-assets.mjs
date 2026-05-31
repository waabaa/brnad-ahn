import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const userAgent = "BrandAtlasDataBuilder/0.3";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function commonsFilePath(title) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(String(title || "").replace(/^File:/, "")).replaceAll("%20", "_")}`;
}

function brandTokens(brand) {
  const names = [brand.nameEn, brand.name, brand.nameKo]
    .filter(Boolean)
    .map(normalize)
    .filter(Boolean);
  const base = names.find(name => /[a-z]/.test(name)) || names[0] || "";
  return base.split(/\s+/).filter(token => token.length >= 2).slice(0, 4);
}

function isRiskyTitle(title) {
  return /racing|formula|f1|team|football|club|album|song|tour|event|championship|game|school|university|universite|station|airport|municipality|place|city|county|state/i.test(title);
}

function exactBrandTitleMatch(brand, title) {
  const cleanTitle = normalize(title.replace(/^File:/i, "").replace(/\.(svg|png|jpe?g|webp)$/i, ""));
  if (!/\blogo\b|로고/.test(cleanTitle)) return false;
  if (isRiskyTitle(title) && !/ferrari/i.test(String(brand.nameEn || brand.name))) return false;
  const names = [brand.nameEn, brand.name, brand.nameKo, brand.slug].filter(Boolean).map(normalize);
  const tokens = brandTokens(brand);
  if (names.some(name => name && cleanTitle.includes(name))) return true;
  if (tokens.length >= 2 && tokens.every(token => cleanTitle.includes(token))) return true;
  if (tokens.length === 1 && tokens[0].length >= 5 && cleanTitle.includes(tokens[0])) return true;
  return false;
}

async function searchCommons(brand) {
  const queries = [
    `"${brand.nameEn || brand.name}" logo filetype:svg`,
    `${brand.nameEn || brand.name} logo`,
    `${brand.slug} logo`,
  ];
  for (const query of [...new Set(queries)]) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|mime`;
    const res = await fetch(url, { headers: { "User-Agent": userAgent, "Accept": "application/json" } });
    if (!res.ok) continue;
    const json = await res.json();
    const pages = Object.values(json.query?.pages || {});
    const hit = pages
      .filter(page => /\.(svg|png|jpe?g|webp)$/i.test(page.title || ""))
      .filter(page => exactBrandTitleMatch(brand, page.title || ""))
      .sort((a, b) => {
        const av = /\.svg$/i.test(a.title || "") ? 1 : 0;
        const bv = /\.svg$/i.test(b.title || "") ? 1 : 0;
        return bv - av;
      })[0];
    if (hit) return hit;
    await sleep(60);
  }
  return null;
}

function addLogo(brand, title) {
  const src = commonsFilePath(title);
  brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
  if (!brand.logoHistory.some(item => item.src === src)) {
    brand.logoHistory.unshift({
      src,
      label: "대표 로고",
      note: "대표 브랜드 마크",
      alt: `${brand.name} logo`,
    });
  }
  if (!brand.logo || isPlaceholder(brand.logo)) brand.logo = src;
  if (isPlaceholder(brand.image)) brand.image = src;
}

const limit = Number(process.env.COMMONS_LOGO_LIMIT || 90);
const candidates = (data.allBrands || [])
  .filter(brand => !brand.logo || isPlaceholder(brand.logo) || !(brand.logoHistory || []).length)
  .filter(brand => brand.publicReady !== false)
  .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  .slice(0, limit);

let attempted = 0;
let matched = 0;
const matches = [];

for (const brand of candidates) {
  attempted += 1;
  try {
    const hit = await searchCommons(brand);
    if (!hit?.title) continue;
    addLogo(brand, hit.title);
    matched += 1;
    matches.push({ slug: brand.slug, name: brand.name, title: hit.title });
  } catch {
    // Keep the existing record if Commons lookup fails.
  }
  await sleep(80);
}

for (const brand of data.brands || []) {
  const canonical = (data.allBrands || []).find(item => item.slug === brand.slug);
  if (!canonical) continue;
  brand.logo = canonical.logo;
  brand.image = canonical.image;
  brand.logoHistory = canonical.logoHistory;
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ attempted, matched, matches }, null, 2));
