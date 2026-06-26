// Sync logo (and logoHistory) from the canonical allBrands array into every
// other place a brand surfaces: brands, brandCards, featuredBrand, pinnedFeatured.
// findBrand() searches `brands` first, so a brand whose logo lives only in
// allBrands renders as a wordmark on its SSG page. This keeps them in lockstep.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const file = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(file, "utf8"));

const canonical = new Map();
for (const b of data.allBrands || []) {
  if (b.slug) canonical.set(b.slug, b);
}

let logoFilled = 0, logoAligned = 0, histSynced = 0;
function syncOne(b) {
  if (!b || !b.slug) return;
  const src = canonical.get(b.slug);
  if (!src) return;
  const srcLogo = (src.logo || "").trim();
  const curLogo = (b.logo || "").trim();
  if (srcLogo && !curLogo) { b.logo = src.logo; logoFilled++; }
  else if (srcLogo && curLogo && srcLogo !== curLogo) { b.logo = src.logo; logoAligned++; }
  if (Array.isArray(src.logoHistory) && src.logoHistory.length
      && (!Array.isArray(b.logoHistory) || b.logoHistory.length === 0)) {
    b.logoHistory = src.logoHistory;
    histSynced++;
  }
}

for (const b of data.brands || []) syncOne(b);
for (const b of data.brandCards || []) syncOne(b);
for (const b of data.pinnedFeatured || []) syncOne(b);
if (data.featuredBrand) syncOne(data.featuredBrand);

await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`logo filled (was empty): ${logoFilled}`);
console.log(`logo aligned (path differed): ${logoAligned}`);
console.log(`logoHistory synced: ${histSynced}`);
