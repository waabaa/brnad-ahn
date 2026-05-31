import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const rejected = [
  { slug: "springfield", pattern: /Monarch_Place|Springfield,_Massachusetts/i },
  { slug: "fun", pattern: /France_Universite_Numerique|FUN-France/i },
];

let removed = 0;

for (const brand of [...(data.allBrands || []), ...(data.brands || [])]) {
  const rules = rejected.filter(rule => rule.slug === brand.slug);
  if (!rules.length) continue;
  const isRejected = src => rules.some(rule => rule.pattern.test(String(src || "")));
  const before = (brand.logoHistory || []).length;
  brand.logoHistory = (brand.logoHistory || []).filter(item => !isRejected(item.src));
  removed += before - brand.logoHistory.length;
  if (isRejected(brand.logo)) brand.logo = brand.logoHistory[0]?.src || "";
  if (isRejected(brand.image)) brand.image = "assets/objects/brand_atlas_logo_mark.png";
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ removed }, null, 2));
