// SEO audit over the built static site. Run before/after a build to measure the
// acceptance criteria in .omc/plans/brand-atlas-search-visibility-2026-08.md.
//
// Usage: node scripts/audit-seo.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const asJson = process.argv.includes("--json");

const files = fs.readdirSync(path.join(ROOT, "brand")).filter(f => f.endsWith(".html"));
const TAG = /<[^>]+>/g;

// 속성값은 HTML escape된 상태로 저장돼 있다("&"→"&amp;"). 길이 기준은 사람이 보는
// 문자열 기준이어야 하므로 되돌린 뒤 잰다.
const unescapeHtml = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&"); // &amp; 는 마지막에 — 먼저 풀면 "&amp;lt;" 같은 이중 이스케이프가 깨진다
const pick = (h, re) => { const m = re.exec(h); return m ? unescapeHtml(m[1]) : ""; };
const titles = new Map(), descs = new Map(), canons = new Map();
let koEnTitle = 0, magazineTitle = 0, titleOver = 0;
let h1KoEn = 0, faqPages = 0, noindex = 0, emptyNote = 0;
const bodyLens = [], titleLens = [], descLens = [];

for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, "brand", f), "utf8");
  const t = pick(h, /<title>(.*?)<\/title>/s);
  const d = pick(h, /<meta name="description" content="(.*?)"/s);
  const c = pick(h, /<link rel="canonical" href="(.*?)"/);
  titles.set(t, (titles.get(t) || 0) + 1);
  descs.set(d, (descs.get(d) || 0) + 1);
  canons.set(c, (canons.get(c) || 0) + 1);
  titleLens.push(t.length);
  descLens.push(d.length);
  if (t.length > 62) titleOver++;
  if (t.includes("브랜드 매거진")) magazineTitle++;
  // "한글(영문)" 병기 판정
  if (/[가-힣].*\([A-Za-z0-9][^)]*\)/.test(t.split(" — ")[0])) koEnTitle++;
  if (/<h1>[^<]*<span class="h1-en">/.test(h)) h1KoEn++;
  if (h.includes('"@type":"FAQPage"')) faqPages++;
  if (/name="robots" content="noindex/.test(h)) noindex++;
  if (h.includes("empty-note")) emptyNote++;

  const m = /<section class="mag-grid">([\s\S]*?)<\/section>\s*<\/div><footer/.exec(h);
  let body = m ? m[1] : "";
  body = body.replace(/<section class="cell wide related-cell"[\s\S]*/, " ");
  bodyLens.push(body.replace(TAG, " ").replace(/\s+/g, " ").trim().length);
}
bodyLens.sort((a, b) => a - b);
titleLens.sort((a, b) => a - b);
const p = (arr, q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];

// 허브·사이트맵
const countFiles = (dir) => fs.existsSync(path.join(ROOT, dir))
  ? fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith(".html")).length : 0;
const staticBrandLinks = (rel) => {
  const p2 = path.join(ROOT, rel);
  if (!fs.existsSync(p2)) return null;
  const h = fs.readFileSync(p2, "utf8");
  const set = new Set();
  for (const m of h.matchAll(/href="([^"]*brand\/[^"]+\.html)"/g)) set.add(m[1]);
  return set.size;
};

let sitemapLocs = 0, sitemapFiles = 0, lastmods = new Set();
const smIndex = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(smIndex)) {
  const s = fs.readFileSync(smIndex, "utf8");
  const children = [...s.matchAll(/<loc>[^<]*\/(sitemap-[^<]+\.xml)<\/loc>/g)].map(m => m[1]);
  sitemapFiles = children.length;
  for (const c of children) {
    const p3 = path.join(ROOT, c);
    if (!fs.existsSync(p3)) continue;
    const x = fs.readFileSync(p3, "utf8");
    sitemapLocs += (x.match(/<loc>/g) || []).length;
    for (const m of x.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) lastmods.add(m[1]);
  }
  if (!children.length) {
    sitemapLocs = (s.match(/<loc>/g) || []).length;
    for (const m of s.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) lastmods.add(m[1]);
  }
}

const report = {
  brandPages: files.length,
  title: {
    koEnParen: koEnTitle,
    containsMagazineFiller: magazineTitle,
    over62chars: titleOver,
    p50: p(titleLens, 0.5), p95: p(titleLens, 0.95),
    duplicateGroups: [...titles.values()].filter(v => v > 1).length,
  },
  description: {
    p50: p([...descLens].sort((a, b) => a - b), 0.5),
    within80to155: descLens.filter(x => x >= 80 && x <= 155).length,
    duplicateGroups: [...descs.values()].filter(v => v > 1).length,
  },
  h1KoEnPair: h1KoEn,
  faqPageJsonLd: faqPages,
  noindexThin: noindex,
  emptyNotePages: emptyNote,
  bodyChars: {
    p10: p(bodyLens, 0.1), p50: p(bodyLens, 0.5), p90: p(bodyLens, 0.9),
    under800: bodyLens.filter(x => x < 800).length,
  },
  // 중복 레코드를 정본으로 합친 canonical은 의도된 것이다. 그 외 중복이 없어야 한다.
  canonicalSelfUnique: canons.size,
  canonicalMerged: files.length - canons.size,
  hubs: {
    categoryPages: countFiles("category"),
    countryPages: countFiles("country"),
    staticBrandLinks: {
      "index.html": staticBrandLinks("index.html"),
      "pages/brands.html": staticBrandLinks("pages/brands.html"),
      "pages/industry.html": staticBrandLinks("pages/industry.html"),
      "pages/insights.html": staticBrandLinks("pages/insights.html"),
      "pages/bici.html": staticBrandLinks("pages/bici.html"),
      "pages/timeline.html": staticBrandLinks("pages/timeline.html"),
    },
    insightsBytes: fs.existsSync(path.join(ROOT, "pages/insights.html"))
      ? fs.statSync(path.join(ROOT, "pages/insights.html")).size : 0,
  },
  sitemap: { childFiles: sitemapFiles, totalLocs: sitemapLocs, distinctLastmod: lastmods.size },
  rssItems: fs.existsSync(path.join(ROOT, "rss.xml"))
    ? (fs.readFileSync(path.join(ROOT, "rss.xml"), "utf8").match(/<item>/g) || []).length : 0,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 1));
} else {
  console.log(JSON.stringify(report, null, 1));
  const ac = [
    ["AC-A1 허브 정적 링크 > 0", Object.values(report.hubs.staticBrandLinks).every(v => v > 0)],
    ["AC-A2 카테고리 페이지 == 12", report.hubs.categoryPages === 12],
    ["AC-A3 국가 페이지 >= 15", report.hubs.countryPages >= 15],
    ["AC-A5 홈 정적 링크 >= 60", (report.hubs.staticBrandLinks["index.html"] || 0) >= 60],
    ["AC-A6 sitemap index 구성", report.sitemap.childFiles >= 2 && report.sitemap.totalLocs > 1400],
    ["AC-B1 '브랜드 매거진' 잔존 == 0", report.title.containsMagazineFiller === 0],
    ["AC-B1 title <= 62자 95%+", report.title.over62chars / files.length <= 0.05],
    ["AC-B3 desc 80~155 95%+", report.description.within80to155 / files.length >= 0.95],
    ["AC-B4 FAQPage >= 1200", report.faqPageJsonLd >= 1200],
    ["AC-B5 desc 중복 0 / title 중복은 canonical 통합됨", report.description.duplicateGroups === 0 && report.title.duplicateGroups <= report.canonicalMerged],
    ["AC-C1 empty-note == 0", report.emptyNotePages === 0],
    ["AC-D1 rss >= 100", report.rssItems >= 100],
    ["canonical 중복 = 의도된 통합분만", report.canonicalMerged <= 2],
  ];
  console.log("\n=== 수용기준 ===");
  for (const [name, ok] of ac) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
