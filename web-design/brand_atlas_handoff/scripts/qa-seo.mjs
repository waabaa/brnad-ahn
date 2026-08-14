// 배포 전 정합성 QA — 빌드 산출물이 서로 모순되지 않는지 확인한다.
//
// audit-seo.mjs가 "지표가 목표에 닿았는가"를 본다면, 이 스크립트는 "산출물이
// 깨지지 않았는가"를 본다. sitemap이 없는 파일을 가리키거나, noindex 페이지가
// sitemap에 남아 있거나, JSON-LD가 파싱되지 않으면 배포하면 안 된다.
//
// Usage: node scripts/qa-seo.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://brandatlas.co.kr";

const problems = [];
const fail = (msg) => problems.push(msg);
const localPath = (url) => {
  const rel = decodeURIComponent(url.replace(ORIGIN, "")).replace(/^\//, "");
  return path.join(ROOT, rel === "" ? "index.html" : rel);
};

// ── sitemap ───────────────────────────────────────────────────────────────
const smIndex = path.join(ROOT, "sitemap.xml");
let sitemapUrls = [];
if (!fs.existsSync(smIndex)) {
  fail("sitemap.xml 없음");
} else {
  const s = fs.readFileSync(smIndex, "utf8");
  const children = [...s.matchAll(/<loc>([^<]+\/sitemap-[^<]+\.xml)<\/loc>/g)].map(m => m[1]);
  if (!children.length) fail("sitemap.xml이 sitemap index 형식이 아님");
  for (const c of children) {
    const p = localPath(c);
    if (!fs.existsSync(p)) { fail(`sitemap index가 없는 파일을 가리킴: ${c}`); continue; }
    const x = fs.readFileSync(p, "utf8");
    sitemapUrls.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
  }
}
// sitemap의 모든 URL이 실제 파일로 존재해야 한다.
let missing = 0;
for (const u of sitemapUrls) {
  if (!fs.existsSync(localPath(u))) {
    if (missing < 5) fail(`sitemap URL에 해당하는 파일 없음: ${u}`);
    missing++;
  }
}
if (missing > 5) fail(`... sitemap 누락 총 ${missing}건`);

// ── 브랜드 페이지 ──────────────────────────────────────────────────────────
const brandFiles = fs.readdirSync(path.join(ROOT, "brand")).filter(f => f.endsWith(".html"));
const sitemapSet = new Set(sitemapUrls);
let noindexInSitemap = 0, badJsonLd = 0, badCanonical = 0, legacySlug = 0, indexableMissing = 0;

for (const f of brandFiles) {
  const h = fs.readFileSync(path.join(ROOT, "brand", f), "utf8");
  const isNoindex = /name="robots" content="noindex/.test(h);
  const url = `${ORIGIN}/brand/${encodeURIComponent(f)}`;

  if (isNoindex && sitemapSet.has(url)) {
    if (noindexInSitemap < 3) fail(`noindex인데 sitemap에 있음: ${f}`);
    noindexInSitemap++;
  }
  if (!isNoindex && !sitemapSet.has(url)) {
    if (indexableMissing < 3) fail(`색인 대상인데 sitemap에 없음: ${f}`);
    indexableMissing++;
  }

  // JSON-LD 파싱
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const graph = j["@graph"] || [j];
      for (const node of graph) {
        if (node["@type"] === "FAQPage") {
          const qs = node.mainEntity || [];
          if (!qs.length) { badJsonLd++; fail(`FAQPage에 질문 없음: ${f}`); }
          for (const q of qs) {
            if (!q.name || !q.acceptedAnswer?.text) { badJsonLd++; fail(`FAQ 항목 불완전: ${f}`); break; }
          }
        }
      }
    } catch {
      badJsonLd++;
      if (badJsonLd < 4) fail(`JSON-LD 파싱 실패: ${f}`);
    }
  }

  // canonical이 실존해야 한다(중복 통합된 경우 정본 파일).
  const c = /<link rel="canonical" href="([^"]+)"/.exec(h);
  if (!c) { badCanonical++; fail(`canonical 없음: ${f}`); }
  else if (!fs.existsSync(localPath(c[1]))) {
    if (badCanonical < 4) fail(`canonical이 없는 파일을 가리킴: ${f} → ${c[1]}`);
    badCanonical++;
  }

  // Phase E 이후 남아 있으면 안 되는 slug 형태
  if (/^brand-\d+\.html$/.test(f) || /^brandarchive-/.test(f)) legacySlug++;
}

// ── 허브 ──────────────────────────────────────────────────────────────────
for (const rel of ["index.html", "pages/brands.html", "pages/industry.html",
  "pages/insights.html", "pages/bici.html", "pages/timeline.html"]) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { fail(`허브 없음: ${rel}`); continue; }
  const h = fs.readFileSync(p, "utf8").replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  const links = new Set([...h.matchAll(/href="([^"]*brand\/[^"]+\.html)"/g)].map(m => m[1]));
  if (!links.size) fail(`허브에 정적 브랜드 링크 없음: ${rel}`);
  // 허브가 가리키는 파일이 실제로 있어야 한다(slug 이전 후 링크 깨짐 검출).
  let broken = 0;
  for (const l of links) {
    const target = path.resolve(path.dirname(p), decodeURIComponent(l));
    if (!fs.existsSync(target)) broken++;
  }
  if (broken) fail(`${rel}: 깨진 브랜드 링크 ${broken}건`);
}

// ── RSS ───────────────────────────────────────────────────────────────────
const rssPath = path.join(ROOT, "rss.xml");
if (!fs.existsSync(rssPath)) fail("rss.xml 없음");
else {
  const r = fs.readFileSync(rssPath, "utf8");
  const items = [...r.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]).filter(u => u.includes("/brand/"));
  let rssBroken = 0;
  for (const u of items) if (!fs.existsSync(localPath(u))) rssBroken++;
  if (rssBroken) fail(`rss.xml: 없는 파일을 가리키는 항목 ${rssBroken}건`);
  if (items.length < 50) fail(`rss.xml 항목이 적음: ${items.length}`);
}

// ── 결과 ──────────────────────────────────────────────────────────────────
console.log(JSON.stringify({
  brandPages: brandFiles.length,
  sitemapUrls: sitemapUrls.length,
  sitemapMissingFiles: missing,
  noindexInSitemap,
  indexableMissingFromSitemap: indexableMissing,
  badJsonLd,
  badCanonical,
  legacySlugRemaining: legacySlug,
}, null, 1));

if (problems.length) {
  console.log(`\nFAIL — 문제 ${problems.length}건`);
  for (const p of problems.slice(0, 25)) console.log(`  ${p}`);
  process.exit(1);
}
console.log("\nPASS: 산출물 정합성 문제 없음");
