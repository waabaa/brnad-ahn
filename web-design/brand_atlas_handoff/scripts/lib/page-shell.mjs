// 정적 페이지 공용 셸 — 헤더(검색·모바일 메뉴)·푸터·<head>.
// 모든 허브·브랜드 페이지가 이 셸을 쓴다. app.js는 붙이지 않는다(허브는 정적으로 완결).
// 모바일 메뉴는 체크박스(:checked)로 열리므로 JS 없이도 동작한다.

import { ORIGIN, CSS_V, gaSnippet } from "./brand-seo.mjs";

export const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// [표시명, 경로, 활성 키]
export const NAV = [
  ["브랜드 사전", "pages/ganada.html", "ganada"],
  ["산업별", "pages/industry.html", "industry"],
  ["국가별", "pages/countries.html", "countries"],
  ["컬렉션", "pages/collections.html", "collections"],
  ["로고 아카이브", "pages/bici.html", "bici"],
  ["타임라인", "pages/timeline.html", "timeline"],
  ["인사이트", "pages/insights.html", "insights"],
];

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

/** prefix: 루트 기준 상대 경로 접두("" 또는 "../"). */
export function header(active = "", prefix = "../") {
  const links = NAV.map(([name, href, key]) =>
    `<a class="${key === active ? "active" : ""}" href="${prefix}${href}">${name}</a>`).join("");
  const search = (id) => `<form class="hdr-search" role="search" action="${prefix}pages/search.html" method="get"><label class="sr-only" for="${id}">브랜드 검색</label><input id="${id}" name="q" type="search" placeholder="브랜드명·초성으로 검색" autocomplete="off"><button type="submit" aria-label="검색">${SEARCH_ICON}</button></form>`;
  return `<header class="site-header"><input type="checkbox" id="menu-toggle" aria-hidden="true"><div class="bar"><a class="logo" href="${prefix}index.html"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a><nav class="nav" aria-label="주 메뉴">${links}</nav>${search("hdr-q")}<label class="menu-btn" for="menu-toggle" aria-label="메뉴 열기"><span></span><span></span><span></span></label></div><div class="mobile-menu"><div class="inner"><form role="search" action="${prefix}pages/search.html" method="get"><label class="sr-only" for="m-q">브랜드 검색</label><input id="m-q" name="q" type="search" placeholder="브랜드명·초성으로 검색"><button type="submit">검색</button></form><nav aria-label="모바일 메뉴">${links}<a href="${prefix}pages/about.html">소개</a></nav></div></div></header>`;
}

export function footer(prefix = "../") {
  const col = (title, items) => `<div><h4>${title}</h4><ul>${items.map(([n, h]) => `<li><a href="${prefix}${h}">${n}</a></li>`).join("")}</ul></div>`;
  return `<footer class="site-footer"><div class="inner"><div class="brand"><a class="logo" href="${prefix}index.html"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a><p>브랜드의 역사·아이덴티티·로고 변천을 한글로 정리한 브랜드 사전. 검증된 사실만 싣고, 없는 표기는 만들지 않습니다.</p></div>${col("찾아보기", [["가나다 · ABC 색인", "pages/ganada.html"], ["산업별 브랜드", "pages/industry.html"], ["국가별 브랜드", "pages/countries.html"], ["테마별 컬렉션", "pages/collections.html"], ["전체 브랜드 목록", "pages/brands.html"], ["브랜드 검색", "pages/search.html"]])}${col("아카이브", [["로고 아카이브", "pages/bici.html"], ["브랜드 타임라인", "pages/timeline.html"], ["브랜드 인사이트", "pages/insights.html"], ["최근 갱신(RSS)", "rss.xml"]])}${col("안내", [["브랜드 아틀라스 소개", "pages/about.html"], ["편집 원칙", "pages/about.html#principles"], ["문의", "pages/contact.html"], ["개인정보 처리방침", "pages/privacy.html"]])}</div><div class="legal"><img src="${prefix}assets/objects/archetypos_logo.png" alt="브랜드성장연구소 아키타이포스 로고" width="284" height="66" loading="lazy" decoding="async"><span>운영 브랜드성장연구소 아키타이포스</span><span>© 브랜드 아틀라스. 로고·상표의 권리는 각 브랜드 소유자에게 있습니다.</span></div></footer>`;
}

/** <head> 공용부. */
export function head({ title, desc, canonical, ogImage, ogType = "website", robots = "index,follow", prefix = "../", jsonLd = "", extraHead = "" }) {
  const img = ogImage || `${ORIGIN}/assets/objects/brand_atlas_logo_mark.png`;
  const ld = jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : "";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="${robots}"><meta property="og:type" content="${ogType}"><meta property="og:site_name" content="브랜드 아틀라스"><meta property="og:locale" content="ko_KR"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${img}"><meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}"><link rel="icon" href="${prefix}assets/objects/brand_atlas_logo_mark.png"><link rel="manifest" href="${prefix}site.webmanifest"><link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="브랜드 아틀라스 RSS" href="${ORIGIN}/rss.xml"><link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="${prefix}styles.css?v=${CSS_V}">${ld}${extraHead}${gaSnippet()}</head>`;
}

/** 완성 HTML. */
export function page({ title, desc, canonical, bodyHtml, jsonLd, active = "", prefix = "../", ogImage, ogType, robots, extraHead = "", bodyClass = "" }) {
  return `${head({ title, desc, canonical, ogImage, ogType, robots, prefix, jsonLd, extraHead })}
<body${bodyClass ? ` class="${bodyClass}"` : ""}><a href="#main-content" class="skip-nav">본문 바로가기</a>${header(active, prefix)}<main id="main-content">${bodyHtml}</main>${footer(prefix)}</body></html>`;
}

export function collectionJsonLd({ name, description, url, crumbs, items }) {
  const graph = [
    { "@type": "CollectionPage", name, description, url, inLanguage: "ko-KR", isPartOf: { "@type": "WebSite", name: "브랜드 아틀라스", url: `${ORIGIN}/` } },
    { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) },
  ];
  if (items && items.length) {
    graph.push({ "@type": "ItemList", numberOfItems: items.length, itemListElement: items.slice(0, 200).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url })) });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

export const breadcrumbs = (items) => `<nav class="crumbs" aria-label="현재 위치">${items.map((it, i) => i === items.length - 1 ? `<b>${esc(it.name)}</b>` : `<a href="${it.href}">${esc(it.name)}</a> <span>›</span>`).join(" ")}</nav>`;
