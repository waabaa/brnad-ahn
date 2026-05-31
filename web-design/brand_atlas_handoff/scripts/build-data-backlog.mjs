import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const reportDir = resolve(root, "reports");
const data = JSON.parse(await readFile(dataPath, "utf8"));

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function textLength(value) {
  return String(value || "").replace(/\s+/g, " ").trim().length;
}

function sectionBody(brand, key) {
  return brand.sections?.[key]?.body || "";
}

function hasLogoHistory(brand) {
  return Array.isArray(brand.logoHistory) && brand.logoHistory.some(item => item?.src && !isPlaceholder(item.src));
}

function hasEnoughBody(brand) {
  const keys = ["overview", "origin", "identity", "products", "people", "current"];
  return keys.reduce((sum, key) => sum + textLength(sectionBody(brand, key)), 0) >= 700;
}

function issueList(brand) {
  const issues = [];
  if (isPlaceholder(brand.image)) issues.push("대표 이미지 없음");
  if (!brand.logo || isPlaceholder(brand.logo)) issues.push("현재 로고 없음");
  if (!hasLogoHistory(brand)) issues.push("BI/CI 변천사 없음");
  if (!hasEnoughBody(brand)) issues.push("본문 부족");
  if (!sectionBody(brand, "people")) issues.push("인물 정보 없음");
  if (!Array.isArray(brand.timeline) || !brand.timeline.length) issues.push("타임라인 없음");
  if (/분야의 브랜드입니다|정체성을 만든|이동 경험과 제품 설계|제품 스타일과 착용 경험|고객 접점|반복 구매/.test(JSON.stringify(brand.sections || {}))) {
    issues.push("범용 문장 제거 필요");
  }
  return issues;
}

function priority(brand, issues) {
  const tier = String(brand.tier || "");
  let score = 0;
  if (tier.startsWith("A_")) score += 100;
  if (tier.startsWith("B_")) score += 80;
  if (tier.startsWith("C_")) score += 55;
  score += Math.round(Number(brand.rating || 0) * 10);
  score += issues.length * 12;
  if (brand.publicReady !== false) score += 20;
  return score;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const rows = (data.allBrands || []).map(brand => {
  const issues = issueList(brand);
  return {
    slug: brand.slug,
    name: brand.name,
    industry: brand.industry,
    domainSlug: brand.domainSlug,
    tier: brand.tier,
    rating: brand.rating,
    priority: priority(brand, issues),
    issues: issues.join(" | "),
    nextAction: issues.includes("BI/CI 변천사 없음") ? "로고/BI/CI 우선 수집" : issues.includes("본문 부족") ? "검증 사실 기반 본문 보강" : "QA 확인",
  };
}).filter(row => row.issues).sort((a, b) => b.priority - a.priority || String(a.name).localeCompare(String(b.name), "ko"));

await mkdir(reportDir, { recursive: true });
const headers = ["priority", "slug", "name", "industry", "domainSlug", "tier", "rating", "issues", "nextAction"];
const csv = [
  headers.join(","),
  ...rows.map(row => headers.map(key => csvEscape(row[key])).join(",")),
].join("\n");

const summary = {
  updatedAt: new Date().toISOString(),
  totalBrands: (data.allBrands || []).length,
  backlogBrands: rows.length,
  missingRepresentativeImage: rows.filter(row => row.issues.includes("대표 이미지 없음")).length,
  missingCurrentLogo: rows.filter(row => row.issues.includes("현재 로고 없음")).length,
  missingLogoHistory: rows.filter(row => row.issues.includes("BI/CI 변천사 없음")).length,
  weakBody: rows.filter(row => row.issues.includes("본문 부족")).length,
  topPriority: rows.slice(0, 40),
};

await writeFile(resolve(reportDir, "data-completion-backlog.csv"), `${csv}\n`, "utf8");
await writeFile(resolve(reportDir, "data-completion-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(JSON.stringify(summary, null, 2));
