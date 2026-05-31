import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const refs = [...(data.allBrands || []), ...(data.brands || [])];
let removed = 0;

for (const brand of refs) {
  for (const key of ["sources", "references", "wikidataId"]) {
    if (brand[key]) {
      delete brand[key];
      removed += 1;
    }
  }
  if (brand.brandB) {
    delete brand.brandB.url;
    delete brand.brandB.caseStudyUrl;
    if (!Object.keys(brand.brandB).length) delete brand.brandB;
  }
}

for (const key of [
  "sourceImports",
  "contentPolicy",
  "publicFieldCleanup",
  "wikidataEnrichment",
  "realDataEnrichment",
  "factCorrections",
  "qualityPolicy",
  "factualComposition",
  "domesticPush",
  "lastImport",
  "dataPolicy",
]) {
  if (data[key]) {
    delete data[key];
    removed += 1;
  }
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ removed }, null, 2));
