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
// 2026-09 GEO 감사 지표
let withDateModified = 0, withSameAs = 0, withUpdatedLine = 0;
let crumbLinked = 0, crumbToCategory = 0, crumbMismatch = 0;
let dupAltPages = 0, artemioLinked = 0, staleEllipsis = 0;
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

  // 신선도·엔티티
  if (/"dateModified":"\d{4}-\d{2}-\d{2}"/.test(h)) withDateModified++;
  if (/"sameAs":\[/.test(h)) withSameAs++;
  if (/<p class="page-updated">최종 업데이트 <time datetime="\d{4}-\d{2}-\d{2}"/.test(h)) withUpdatedLine++;

  // 가시 breadcrumb ↔ JSON-LD BreadcrumbList 일치
  const crumbs = /<nav class="crumbs"[^>]*>([\s\S]*?)<\/nav>/.exec(h);
  if (crumbs) {
    const hrefs = [...crumbs[1].matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    if (hrefs.length === 2) crumbLinked++;
    const cat = hrefs.find(x => x.includes("/category/"));
    if (cat) crumbToCategory++;
    const ld = /"@type":"ListItem","position":2,"name":"([^"]*)","item":"([^"]*)"/.exec(h);
    const visibleSecond = /<a href="[^"]*category\/[^"]*">([^<]*)<\/a>/.exec(crumbs[1]);
    if (!ld || !visibleSecond || unescapeHtml(visibleSecond[1]) !== unescapeHtml(ld[1]) || !ld[2].includes("/category/")) crumbMismatch++;
  } else {
    crumbMismatch++;
  }

  // 한 페이지 안에서 같은 alt가 반복되면 이미지 검색에서 서로 구분되지 않는다.
  const alts = [...h.matchAll(/<img [^>]*alt="([^"]*)"/g)].map(m => m[1]).filter(Boolean);
  if (alts.length !== new Set(alts).size) dupAltPages++;

  if (h.includes("pages/brand-artemio.html")) artemioLinked++;
  if (/<article class="timeline-node">[\s\S]*?\.\.\.<\/span>/.test(h)) staleEllipsis++;

  // 2026-09 재설계: 본문은 <div class="brand-main" id="brandPage"> … <!--related--> 구간(사이드·관련 제외)
  const m = /<div class="brand-main" id="brandPage">([\s\S]*?)<!--related-->/.exec(h)
    || /<section class="mag-grid">([\s\S]*?)<\/section>\s*<\/div><footer/.exec(h);
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

let sitemapLocs = 0, sitemapFiles = 0, sitemapImages = 0, sitemapHubLocs = 0, lastmods = new Set();
const smIndex = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(smIndex)) {
  const s = fs.readFileSync(smIndex, "utf8");
  const children = [...s.matchAll(/<loc>[^<]*\/(sitemap-[^<]+\.xml)<\/loc>/g)].map(m => m[1]);
  sitemapFiles = children.length;
  for (const c of children) {
    const p3 = path.join(ROOT, c);
    if (!fs.existsSync(p3)) continue;
    const x = fs.readFileSync(p3, "utf8");
    if (c === "sitemap-hubs.xml") sitemapHubLocs += (x.match(/<loc>/g) || []).length;
    sitemapLocs += (x.match(/<loc>/g) || []).length;
    sitemapImages += (x.match(/<image:loc>/g) || []).length;
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
      "pages/ganada.html": staticBrandLinks("pages/ganada.html"),
      "pages/countries.html": staticBrandLinks("pages/countries.html") ?? 0,
    },
    insightsBytes: fs.existsSync(path.join(ROOT, "pages/insights.html"))
      ? fs.statSync(path.join(ROOT, "pages/insights.html")).size : 0,
  },
  geo: {
    dateModified: withDateModified,
    visibleUpdatedLine: withUpdatedLine,
    sameAs: withSameAs,
    breadcrumbLinked: crumbLinked,
    breadcrumbToCategory: crumbToCategory,
    breadcrumbMismatch: crumbMismatch,
    duplicateAltPages: dupAltPages,
    pagesLinkingSpaShell: artemioLinked,
    timelineHardTruncation: staleEllipsis,
    llmsTxt: fs.existsSync(path.join(ROOT, "llms.txt")),
    robotsAiAgents: (() => {
      try { return (fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").match(/^User-agent: (?!\*)/gm) || []).length; }
      catch { return 0; }
    })(),
    shellsNoindex: ["pages/brand-artemio.html", "pages/mobile.html", "pages/other-pages.html"]
      .filter(f => { try { return /content="noindex/.test(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch { return false; } }).length,
  },
  // 허브가 얇으면 색인되지 않고, 색인되지 않으면 하위 브랜드로 링크 에퀴티가 가지 않는다.
  // 2026-09 감사에서 카테고리·국가 허브 28개가 네이버 색인 0건이었고 원인이 이것이었다.
  hubProse: (() => {
    const strip = (h) => h
      .replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<nav[\s\S]*?<\/nav>/g, " ").replace(/<header[\s\S]*?<\/header>/g, " ")
      .replace(/<footer[\s\S]*?<\/footer>/g, " ")
      .replace(TAG, " ").replace(/\s+/g, " ").trim().length;
    const lens = [];
    for (const dir of ["category", "country", "collection"]) {
      const d = path.join(ROOT, dir);
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d).filter(x => x.endsWith(".html"))) {
        lens.push(strip(fs.readFileSync(path.join(d, f), "utf8")));
      }
    }
    lens.sort((a, b) => a - b);
    return { pages: lens.length, min: lens[0] ?? 0, p50: lens[Math.floor(lens.length / 2)] ?? 0, under700: lens.filter(x => x < 700).length };
  })(),
  sitemap: { childFiles: sitemapFiles, totalLocs: sitemapLocs, hubLocs: sitemapHubLocs, brandLocs: sitemapLocs - sitemapHubLocs, distinctLastmod: lastmods.size, imageEntries: sitemapImages },
  rssItems: fs.existsSync(path.join(ROOT, "rss.xml"))
    ? (fs.readFileSync(path.join(ROOT, "rss.xml"), "utf8").match(/<item>/g) || []).length : 0,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 1));
} else {
  console.log(JSON.stringify(report, null, 1));
  const ac = [
    ["AC-A1 허브 정적 링크 > 0", Object.entries(report.hubs.staticBrandLinks).filter(([k]) => k !== "pages/countries.html").every(([, v]) => v > 0)],
    ["AC-A2 카테고리 페이지 == 12", report.hubs.categoryPages === 12],
    // 2026-09 개정: 개수 기준(>=15)에서 품질 기준으로 바꿨다. 종전에는 브랜드 5개짜리
    // 국가도 발행해 본문 600자대 껍데기가 섞였고, 그런 허브는 색인되지 않아 크롤 경로로
    // 기능하지 못했다. 얇은 허브를 빼면 14개가 되지만 커버 브랜드는 497개로 거의 그대로다
    // (직전 507). 개수보다 "발행된 허브가 실제로 색인될 수 있는가"가 목적에 맞다.
    ["AC-A3 국가 페이지 >= 12 (전부 본문 기준 충족)", report.hubs.countryPages >= 12 && report.hubProse.under700 === 0],
    ["AC-A5 홈 정적 링크 >= 60", (report.hubs.staticBrandLinks["index.html"] || 0) >= 60],
    // 2026-09: 디렉토리 등급(noindex)을 sitemap에서 빼므로 절대 수 대신 "색인 대상 == sitemap 브랜드 수"를 본다.
    ["AC-A6 sitemap == 색인 대상(브랜드 페이지 − noindex) + 허브", report.sitemap.childFiles >= 2 && report.sitemap.brandLocs === report.brandPages - report.noindexThin && report.sitemap.hubLocs >= 20],
    ["AC-B1 '브랜드 매거진' 잔존 == 0", report.title.containsMagazineFiller === 0],
    ["AC-B1 title <= 62자 95%+", report.title.over62chars / files.length <= 0.05],
    ["AC-B3 desc 80~155 95%+", report.description.within80to155 / files.length >= 0.95],
    ["AC-B4 FAQPage >= 색인 대상의 85%", report.faqPageJsonLd >= Math.floor((report.brandPages - report.noindexThin) * 0.85)],
    ["AC-B5 desc 중복 0 / title 중복은 canonical 통합됨", report.description.duplicateGroups === 0 && report.title.duplicateGroups <= report.canonicalMerged],
    ["AC-C1 empty-note == 0", report.emptyNotePages === 0],
    ["AC-D1 rss >= 100", report.rssItems >= 100],
    ["canonical 중복 = 의도된 통합분만", report.canonicalMerged <= 2],
    ["AC-G2 dateModified == 전 브랜드 페이지", report.geo.dateModified === files.length && report.geo.visibleUpdatedLine === files.length],
    ["AC-G3 sameAs > 300 (Wikidata 검증분)", report.geo.sameAs >= 300],
    ["AC-G4 껍데기 3종 noindex + 내부링크 0", report.geo.shellsNoindex === 3 && report.geo.pagesLinkingSpaShell === 0],
    ["AC-G5 breadcrumb 가시↔JSON-LD 일치", report.geo.breadcrumbMismatch === 0 && report.geo.breadcrumbToCategory === files.length],
    ["AC-G6 타임라인 하드 절단 0", report.geo.timelineHardTruncation === 0],
    ["AC-G7 페이지 내 중복 alt 0", report.geo.duplicateAltPages === 0],
    ["AC-G8 llms.txt + AI 크롤러 명시 + 이미지 sitemap", report.geo.llmsTxt && report.geo.robotsAiAgents >= 10 && report.sitemap.imageEntries > 1000],
    ["AC-G9 허브 본문 700자 미만 == 0", report.hubProse.under700 === 0 && report.hubProse.pages >= 24],
  ];
  console.log("\n=== 수용기준 ===");
  for (const [name, ok] of ac) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
