// SEO extras for Naver/Google crawlability:
//  1) /pages/brands.html — fully static HTML index of ALL brands as <a> links,
//     grouped by industry. Gives crawlers (esp. Naver Yeti, which barely runs JS)
//     a complete static link graph to every /brand/<slug>.html.
//  2) /rss.xml — RSS 2.0 feed (featured brands) for Naver Search Advisor RSS submit.
//
// Usage: node scripts/build-seo-extras.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://brandatlas.co.kr";
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const urlSlugOf = (b) => b.urlSlug || b.slug;
const cssV = "20260627q";

// ---- static header (depth: /pages/) ----
function header(active = "") {
  const nav = [
    ["브랜드 사전", "../index.html"],
    ["전체 브랜드", "brands.html"],
    ["산업별 탐색", "industry.html"],
    ["브랜드 매거진", "brand-artemio.html"],
    ["브랜드 인사이트", "insights.html"],
    ["타임라인", "timeline.html"],
    ["BI/CI 아카이브", "bici.html"],
    ["검색", "search.html"],
  ];
  const links = nav.map(([n, h]) => `<a class="${n === active ? "active" : ""}" href="${h}">${n}</a>`).join("");
  return `<header class="header"><a class="logo" href="../index.html"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a><nav class="nav">${links}</nav><div class="tools"><a aria-label="검색" href="search.html">⌕</a><a href="industry.html">Menu</a><a class="hamb" aria-label="전체 메뉴" href="industry.html">≡</a></div></header>`;
}

// ---- group by industry, sorted ----
const byIndustry = new Map();
for (const b of BRANDS) {
  const ind = b.industry || "기타";
  if (!byIndustry.has(ind)) byIndustry.set(ind, []);
  byIndustry.get(ind).push(b);
}
// stable order: largest groups first (matches industry distribution)
const groups = [...byIndustry.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [, arr] of groups) arr.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));

const total = BRANDS.length;
const sectionsHtml = groups.map(([ind, arr]) => {
  const items = arr.map(b => {
    const en = b.nameEn && b.nameEn !== b.name ? ` <span class="bx-en">${esc(b.nameEn)}</span>` : "";
    return `<li><a href="../brand/${encodeURIComponent(urlSlugOf(b))}.html">${esc(b.name)}${en}</a></li>`;
  }).join("");
  const anchor = "ind-" + ind.replace(/[^가-힣A-Za-z0-9]/g, "");
  return `<section class="bx-group" id="${anchor}"><h2>${esc(ind)} <small>${arr.length}</small></h2><ul class="bx-list">${items}</ul></section>`;
}).join("\n");

const tocHtml = groups.map(([ind, arr]) => {
  const anchor = "ind-" + ind.replace(/[^가-힣A-Za-z0-9]/g, "");
  return `<a href="#${anchor}">${esc(ind)} <small>${arr.length}</small></a>`;
}).join("");

const title = "전체 브랜드 목록 | 브랜드 아틀라스";
const desc = `브랜드 아틀라스에 수록된 ${total}개 브랜드를 산업별로 한눈에 탐색합니다. 각 브랜드의 역사·BI/CI·제품·인물·인사이트를 정리한 브랜드 사전.`;
const url = `${ORIGIN}/pages/brands.html`;
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      isPartOf: { "@type": "WebSite", name: "브랜드 아틀라스", url: `${ORIGIN}/` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "브랜드 사전", item: `${ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "전체 브랜드", item: url },
      ],
    },
  ],
});

const brandsHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ORIGIN}/assets/objects/brand_atlas_logo_mark.png"><meta name="twitter:card" content="summary"><link rel="icon" href="../assets/objects/brand_atlas_logo_mark.png"><link rel="canonical" href="${url}"><link rel="alternate" type="application/rss+xml" title="브랜드 아틀라스 RSS" href="${ORIGIN}/rss.xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles.css?v=${cssV}"><style>.bx-toc{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 28px}.bx-toc a{font-size:13px;padding:6px 12px;border:1px solid var(--line,#ddd);border-radius:999px;text-decoration:none;color:inherit}.bx-toc a small{opacity:.55}.bx-group{margin:30px 0}.bx-group h2{font-size:20px;border-bottom:2px solid currentColor;padding-bottom:6px;margin-bottom:14px}.bx-group h2 small{font-size:13px;opacity:.5;font-weight:400;margin-left:6px}.bx-list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px 18px}.bx-list a{text-decoration:none;color:inherit;display:block;padding:4px 0;border-bottom:1px solid transparent}.bx-list a:hover{border-bottom-color:currentColor}.bx-en{opacity:.5;font-size:12px}</style></head>
<body><a href="#main-content" class="skip-nav">본문 바로가기</a><div id="head">${header("전체 브랜드")}</div><main id="main-content" class="wrap"><section class="page-title"><div><p class="kicker">ALL BRANDS</p><h1>전체 브랜드 목록</h1><p class="lead">브랜드 아틀라스에 수록된 <b>${total}</b>개 브랜드를 산업별로 정리했습니다. 각 항목은 해당 브랜드의 상세 매거진으로 연결됩니다.</p></div></section><nav class="bx-toc" aria-label="산업 바로가기">${tocHtml}</nav>${sectionsHtml}</main><script type="application/ld+json">${jsonLd}</script><script src="../app.js?v=${cssV}" defer></script></body></html>`;

fs.writeFileSync(path.join(ROOT, "pages", "brands.html"), brandsHtml);
console.log(`pages/brands.html: ${total} brands, ${groups.length} industry groups`);

// ---- RSS 2.0 feed (featured/top brands) ----
const ranked = [...BRANDS]
  .sort((a, b) => (b.displayPriority || 0) - (a.displayPriority || 0) || (b.rating || 0) - (a.rating || 0))
  .slice(0, 80);
const pubDate = new Date().toUTCString();
const items = ranked.map(b => {
  const link = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html`;
  const d = String(b.definition || b.summary || b.insight || "").slice(0, 280);
  return `    <item><title>${esc(b.name)}${b.nameEn && b.nameEn !== b.name ? ` (${esc(b.nameEn)})` : ""}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><category>${esc(b.industry || "")}</category><description>${esc(d)}</description></item>`;
}).join("\n");
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>브랜드 아틀라스 | 브랜드 사전 매거진</title>
    <link>${ORIGIN}/</link>
    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>브랜드의 역사·산업 분류·BI/CI·제품·인물·인사이트를 정리한 브랜드 사전. 전체 ${total}개 브랜드 중 주요 브랜드를 제공합니다.</description>
    <language>ko</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(ROOT, "rss.xml"), rss);
console.log(`rss.xml: ${ranked.length} items`);
