// Shared static page shell for hub pages (/pages/, /category/, /country/).
// Every hub is emitted as complete HTML — Naver's crawler does not run JS, so any
// link that exists only after app.js runs is invisible to it (2026-08 SEO audit).

import { ORIGIN, CSS_V } from "./brand-seo.mjs";

export const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NAV = [
  ["브랜드 사전", "index.html", true],
  ["전체 브랜드", "pages/brands.html", false],
  ["산업별 탐색", "pages/industry.html", false],
  ["브랜드 인사이트", "pages/insights.html", false],
  ["타임라인", "pages/timeline.html", false],
  ["BI/CI 아카이브", "pages/bici.html", false],
  ["검색", "pages/search.html", false],
];

/** depth=1 인 페이지(/pages/, /category/, /country/)는 "../" 접두가 필요하다. */
export function header(active = "", prefix = "../") {
  const links = NAV.map(([name, href]) =>
    `<a class="${name === active ? "active" : ""}" href="${prefix}${href}">${name}</a>`).join("");
  return `<header class="header"><a class="logo" href="${prefix}index.html"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a><nav class="nav">${links}</nav><div class="tools"><a aria-label="검색" href="${prefix}pages/search.html">⌕</a><a href="${prefix}pages/industry.html">Menu</a><a class="hamb" aria-label="전체 메뉴" href="${prefix}pages/industry.html">≡</a></div></header>`;
}

export function footer(prefix = "../") {
  return `<footer class="footer"><nav class="footer-nav" aria-label="사이트맵"><a href="${prefix}pages/brands.html">전체 브랜드 목록</a> · <a href="${prefix}pages/industry.html">산업별 탐색</a> · <a href="${prefix}pages/insights.html">브랜드 인사이트</a> · <a href="${prefix}pages/timeline.html">타임라인</a> · <a href="${prefix}pages/bici.html">BI/CI 아카이브</a> · <a href="${prefix}pages/search.html">검색</a></nav><span>브랜드는 시대를 기록하고, 문화를 만들며, 미래를 설계합니다.</span><div class="footer-brand"><img src="${prefix}assets/objects/archetypos_logo.png" alt="아키타이포스 로고" width="284" height="66" decoding="async"><span>브랜드성장연구소 <b>아키타이포스</b></span></div></footer>`;
}

/** 목록형 허브 공용 스타일. brands.html이 쓰던 규칙을 그대로 공유한다. */
export const HUB_STYLE = `<style>.bx-toc{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 28px}.bx-toc a{font-size:13px;padding:6px 12px;border:1px solid var(--line,#ddd);border-radius:999px;text-decoration:none;color:inherit}.bx-toc a small{opacity:.55}.bx-group{margin:30px 0}.bx-group h2{font-size:20px;border-bottom:2px solid currentColor;padding-bottom:6px;margin-bottom:14px}.bx-group h2 small{font-size:13px;opacity:.5;font-weight:400;margin-left:6px}.bx-list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px 18px}.bx-list a{text-decoration:none;color:inherit;display:block;padding:4px 0;border-bottom:1px solid transparent}.bx-list a:hover{border-bottom-color:currentColor}.bx-en{opacity:.5;font-size:12px}.bx-note{margin:0 0 6px;opacity:.75;font-size:14px;line-height:1.7}.bx-entry{margin:0 0 14px}.bx-entry p{margin:2px 0 0;font-size:13px;opacity:.7;line-height:1.6}</style>`;

/**
 * 완성 HTML 셸. app.js는 붙이지 않는다 — 허브는 정적 콘텐츠만으로 완결한다.
 */
export function page({ title, desc, canonical, bodyHtml, jsonLd, active = "", prefix = "../", extraStyle = "" }) {
  const ld = jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : "";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ORIGIN}/assets/objects/brand_atlas_logo_mark.png"><meta name="twitter:card" content="summary"><link rel="icon" href="${prefix}assets/objects/brand_atlas_logo_mark.png"><link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="브랜드 아틀라스 RSS" href="${ORIGIN}/rss.xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="${prefix}styles.css?v=${CSS_V}">${HUB_STYLE}${extraStyle}${ld}</head>
<body><a href="#main-content" class="skip-nav">본문 바로가기</a><div id="head">${header(active, prefix)}</div><main id="main-content" class="wrap">${bodyHtml}${footer(prefix)}</main></body></html>`;
}

export function collectionJsonLd({ name, description, url, crumbs }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name, description, url,
        isPartOf: { "@type": "WebSite", name: "브랜드 아틀라스", url: `${ORIGIN}/` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem", position: i + 1, name: c.name, item: c.url,
        })),
      },
    ],
  });
}
