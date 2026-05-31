import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const projectRoot = resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const handoffRoot = resolve(projectRoot, "web-design/brand_atlas_handoff");
const wikiDir = resolve(projectRoot, "brand_wiki/brands");
const dataPath = resolve(handoffRoot, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const sectionMap = {
  "한눈에 보는 브랜드": "overview",
  "시작과 성장": "origin",
  "브랜드 아이덴티티": "identity",
  "브랜드 관점": "insights",
  "제품과 서비스": "products",
};

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^`|`$/g, "").trim();
}

function stripFrontMatter(md) {
  return md.replace(/^---[\s\S]*?---\s*/, "");
}

function parseSections(md) {
  const body = stripFrontMatter(md);
  const matches = [...body.matchAll(/^##\s+(.+)$/gm)];
  const sections = {};
  for (let i = 0; i < matches.length; i += 1) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = matches[i + 1]?.index ?? body.length;
    sections[title] = body.slice(start, end).trim();
  }
  return sections;
}

function frontmatterValue(md, key) {
  const match = md.match(new RegExp(`^${key}:\\s*\"?([^\"\\n]+)\"?`, "m"));
  return match?.[1]?.trim() || "";
}

function cleanText(value) {
  let text = String(value || "")
    .replace(/\r/g, "")
    .replace(/\[ 1\.[\s\S]*$/g, "")
    .replace(/[^.!?。\n]*(은|는)\s+Wikidata 기준[\s\S]*$/g, "")
    .replace(/Wikidata 기준[\s\S]*$/g, "")
    .replace(/genus of mammals|축구팀 운영에 대한 전반적인 책임을 지는 사람/gi, "")
    .replace(/각주 각주[\s\S]*$/g, "")
    .replace(/참고\s*・[\s\S]*$/g, "")
    .replace(/공식\s*홈페이지[\s\S]*$/g, "")
    .replace(/위키피디아|위키백과/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^-\s+\*\*.*?\*\*\s*/gm, "")
    .replace(/^-\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  const paragraphs = text
    .split(/\n+/)
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !/^미디어 자산|내부 편집 메모|PDF 매칭|검수 대기/.test(part))
    .filter(part => !/Wikidata|각주|참고 ・|위키피디아|위키백과|https?:\/\//.test(part));
  return paragraphs.join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+[가-힣A-Za-z0-9&.'-]+(은|는)$/g, "")
    .trim();
}

function parseTimeline(section) {
  return String(section || "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.startsWith("- **"))
    .map(line => {
      const match = line.match(/^\-\s+\*\*(\d{4})\*\*\s+(.+)$/);
      if (!match) return null;
      const description = cleanText(match[2])
        .replace(/^Chapter\s*\d+\s*/i, "")
        .replace(/^.+?\)\s+/, "");
      if (!description || /각주|참고|위키피디아|https?:\/\//.test(description)) return null;
      return { year: Number(match[1]), description };
    })
    .filter(Boolean)
    .filter(item => item.year >= 1800 && item.year <= 2100)
    .slice(0, 12);
}

function parseMedia(section) {
  const rows = [];
  for (const line of String(section || "").split(/\n+/)) {
    const cols = line.split("|").map(col => col.trim()).filter(Boolean);
    if (cols.length < 3 || cols[0] === "역할" || cols[0].startsWith("---")) continue;
    rows.push({ role: cols[0], path: normalizePath(cols[1]), description: cols[2] || "" });
  }
  return rows;
}

function betterText(next, current) {
  const currentText = String(current || "").trim();
  return next && (next.length > currentText.length || /\s+[가-힣A-Za-z0-9&.'-]+(은|는)$/.test(currentText) || /Wikidata|각주 각주|참고 ・|위키피디아|위키백과/.test(currentText));
}

let files = 0;
let matched = 0;
let sectionUpdates = 0;
let timelineUpdates = 0;
let imageUpdates = 0;

for (const file of await readdir(wikiDir)) {
  if (!file.endsWith(".md")) continue;
  files += 1;
  const md = await readFile(join(wikiDir, file), "utf8");
  const slug = frontmatterValue(md, "slug") || file.replace(/\.md$/, "");
  const brand = (data.allBrands || []).find(item => item.slug === slug);
  if (!brand) continue;
  matched += 1;
  const sections = parseSections(md);
  brand.sections = brand.sections || {};

  for (const [title, key] of Object.entries(sectionMap)) {
    const cleaned = cleanText(sections[title]);
    if (betterText(cleaned, brand.sections[key]?.body)) {
      brand.sections[key] = { body: cleaned };
      if (key === "overview") {
        brand.definition = cleaned;
        brand.summary = cleaned;
      }
      if (key === "insights") brand.insight = cleaned;
      sectionUpdates += 1;
    }
  }

  const timeline = parseTimeline(sections["연표 후보"]);
  if (timeline.length > (brand.timeline || []).length) {
    brand.timeline = timeline.map(item => ({ ...item, brand: brand.name }));
    timelineUpdates += 1;
  }

  const media = parseMedia(sections["미디어 자산"]);
  const hero = media.find(item => item.role === "hero" && item.path);
  if (hero?.path && (!brand.image || String(brand.image).includes("brand_atlas_logo_mark"))) {
    brand.image = hero.path;
    imageUpdates += 1;
  }
}

for (const brand of data.brands || []) {
  const canonical = (data.allBrands || []).find(item => item.slug === brand.slug);
  if (!canonical) continue;
  Object.assign(brand, {
    definition: canonical.definition,
    summary: canonical.summary,
    image: canonical.image,
    logo: canonical.logo,
    insight: canonical.insight,
    sections: canonical.sections,
    timeline: canonical.timeline,
    logoHistory: canonical.logoHistory,
  });
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ files, matched, sectionUpdates, timelineUpdates, imageUpdates }, null, 2));
