// Phase 1 SSG: per-brand static HTML at /brand/<slug>.html
// Reuses app.js render functions (renderBrandMagazine + safety filters) via a Node
// VM shim so static pages match the SPA exactly. Emits static <head> (title/desc/
// canonical/OG/JSON-LD) so each brand is independently indexable without JS.
//
// Usage:
//   node scripts/build-brand-pages.mjs            # build all + sitemap
//   node scripts/build-brand-pages.mjs --sample apple,nike,absolut   # sample to /tmp, no sitemap
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  buildTitle, buildDescription, buildFaq, headingMarkup,
  countryOf, foundedYear, isThin, bodyTextLength, THIN_THRESHOLD, CSS_V,
} from "./lib/brand-seo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");               // brand_atlas_handoff/
const ORIGIN = "https://brandatlas.co.kr";
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];

// 운영사 크레딧 footer (depth-1 페이지: brand/, pages/ 공용 — 상대경로 ../).
const SUB_FOOTER = `<footer class="footer"><nav class="footer-nav" aria-label="사이트맵"><a href="../pages/brands.html">전체 브랜드 목록</a> · <a href="../pages/industry.html">산업별 탐색</a> · <a href="../pages/insights.html">브랜드 인사이트</a> · <a href="../pages/timeline.html">타임라인</a> · <a href="../pages/bici.html">BI/CI 아카이브</a> · <a href="../pages/search.html">검색</a></nav><span>브랜드는 시대를 기록하고, 문화를 만들며, 미래를 설계합니다.</span><div class="footer-brand"><img src="../assets/objects/archetypos_logo.png" alt="아키타이포스 로고" width="284" height="66" decoding="async"><span>브랜드성장연구소 <b>아키타이포스</b></span></div></footer>`;

const args = new Map(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true] : [a, true]));
const sampleSlugs = typeof args.get("sample") === "string" ? args.get("sample").split(",").map(s => s.trim()) : null;

// ---- VM shim: load app.js with browser globals so its functions run in Node ----
const appSrc = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const sandbox = {
  // isPage() checks location.pathname.includes("/pages/"); set it true so asset()/
  // fallbackImage() emit "../" prefixes — correct for /brand/<slug>.html (depth 1).
  location: { pathname: "/pages/_ssg_", search: "", href: `${ORIGIN}/pages/_ssg_` },
  document: { addEventListener() {}, head: { querySelector: () => null, appendChild() {} }, createElement: () => ({ setAttribute() {}, appendChild() {} }), getElementById: () => null },
  window: { addEventListener() {} },
  URL,
  console,
};
sandbox.window.brandAtlasData = DATA;
vm.createContext(sandbox);
vm.runInContext(appSrc, sandbox, { filename: "app.js" });

// ---- Overrides for /brand/<slug>.html depth (nav lives in /pages/, brand pages in /brand/) ----
const esc = sandbox.escapeHtml || ((s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
// Non-ASCII (Korean) slugs are not served by the Cloudflare Worker proxy; use the
// ASCII urlSlug baked into the data when present.
const urlSlugOf = (b) => b.urlSlug || b.slug;
sandbox.brandUrl = (b) => `../brand/${encodeURIComponent(urlSlugOf(b))}.html`;
sandbox.header = (active = "") => {
  const nav = [
    ["브랜드 사전", "../index.html"],
    ["전체 브랜드", "../pages/brands.html"],
    ["산업별 탐색", "../pages/industry.html"],
    ["브랜드 매거진", "../pages/brand-artemio.html"],
    ["브랜드 인사이트", "../pages/insights.html"],
    ["타임라인", "../pages/timeline.html"],
    ["BI/CI 아카이브", "../pages/bici.html"],
    ["검색", "../pages/search.html"],
  ];
  const links = nav.map(([name, href]) => `<a class="${name === active ? "active" : ""}" href="${href}">${name}</a>`).join("");
  return `<header class="header"><a class="logo" href="../index.html"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a><nav class="nav">${links}</nav><div class="tools"><a aria-label="검색" href="../pages/search.html">⌕</a><a href="../pages/industry.html">Menu</a><a class="hamb" aria-label="전체 메뉴" href="../pages/industry.html">≡</a></div></header>`;
};
// Re-eval render functions are closures over the original brandUrl/header? No — app.js
// functions reference the global names, which in a VM context resolve to sandbox props.
// Reassigning sandbox.brandUrl/header above is picked up by later calls. Verify in output.

const short = sandbox.short || ((t, n) => String(t || "").slice(0, n));
const asset = sandbox.asset;
const renderBrandMagazine = sandbox.renderBrandMagazine;

function absAsset(src) {
  // brand.image like "images/..."/"assets/..." → absolute for OG
  const a = asset(src).replace(/^\.\.\//, "");
  return /^https?:\/\//.test(a) ? a : `${ORIGIN}/${a}`;
}

function jsonLd(brand, faq) {
  const url = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(brand))}.html`;
  const facts = brand.facts || {};
  const year = foundedYear(brand);
  const country = countryOf(brand);
  const org = {
    "@type": "Organization",
    name: brand.name,
    alternateName: brand.nameEn || undefined,
    description: short(`${brand.definition || brand.summary || ""}`, 200) || undefined,
    url: facts.officialWebsite || brand.officialWebsite || undefined,
    logo: brand.logo ? absAsset(brand.logo) : undefined,
    // foundingDate/foundingLocation은 definition에서 검증된 값만 쓴다. timeline 최소연도는
    // 모기업 창업연도가 섞여 있어(2026-08 감사) 근거로 쓰지 않는다.
    foundingDate: year ? String(year) : undefined,
    foundingLocation: country ? { "@type": "Place", name: country } : undefined,
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "브랜드 사전", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: brand.industry || "산업", item: `${ORIGIN}/pages/industry.html` },
      { "@type": "ListItem", position: 3, name: brand.name, item: url },
    ],
  };
  const graph = [org, breadcrumb];
  if (faq && faq.length >= 2) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// 렌더된 본문(헤더/푸터/관련 브랜드 제외) 기준 thin 임계. 실제 페이지에 실리는 글자 수다.
const RENDERED_THIN_THRESHOLD = 700;
const renderedLen = new Map();

// 같은 브랜드가 두 레코드로 들어온 경우(마르디 메크르디, 롯데리아)를 중복 콘텐츠로
// 두지 않는다. 본문이 긴 쪽을 정본으로 삼고 나머지는 canonical을 정본으로 돌린 뒤
// 색인에서 뺀다. 판정 기준은 title이 아니라 정규화한 브랜드명이다 — 같은 브랜드라도
// 설립연도 확보 여부에 따라 title이 갈려 title 기준으로는 잡히지 않는다.
const canonicalOverride = new Map(); // slug → 정본 URL
{
  const normName = (b) => String(b.name || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  // 브랜드명이 같은 경우와 title이 같은 경우를 모두 잡는다(롯데리아는 name이 갈리고
  // 마르디 메크르디는 title이 갈린다).
  for (const keyOf of [normName, (b) => buildTitle(b)]) {
    const groups = new Map();
    for (const b of BRANDS) {
      const k = keyOf(b);
      if (!k) continue;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(b);
    }
    for (const [, group] of groups) {
      if (group.length < 2) continue;
      // 이미 다른 정본으로 합쳐진 레코드는 그 판정을 유지한다.
      if (group.every(b => canonicalOverride.has(urlSlugOf(b)))) continue;
      const primary = group.reduce((a, b) => (bodyTextLength(b) >= bodyTextLength(a) ? b : a));
      const primaryUrl = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(primary))}.html`;
      for (const b of group) {
        if (b === primary || canonicalOverride.has(urlSlugOf(b))) continue;
        canonicalOverride.set(urlSlugOf(b), primaryUrl);
        console.log(`  dup → canonical: ${urlSlugOf(b)} → ${urlSlugOf(primary)}`);
      }
    }
  }
}

/** 발행되는 본문의 순수 텍스트 길이 — 관련 브랜드 카드는 보일러플레이트라 제외한다. */
function renderedBodyChars(bodyHtml) {
  const m = /<section class="mag-grid">([\s\S]*)$/.exec(bodyHtml);
  let s = m ? m[1] : bodyHtml;
  s = s.replace(/<section class="cell wide related-cell"[\s\S]*/, " ");
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

/** FAQ 섹션 마크업. 답변은 전부 기존 데이터에서 인용한 것이다(생성 금지). */
function faqSection(faq) {
  if (!faq.length) return "";
  const items = faq.map(({ q, a }) =>
    `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join("");
  return `<section class="cell wide faq-cell" id="faq"><h2>자주 묻는 질문</h2><div class="faq-list">${items}</div></section>`;
}

function pageHtml(brand) {
  const url = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(brand))}.html`;
  const title = buildTitle(brand);
  const desc = buildDescription(brand);
  const faq = buildFaq(brand);
  const ogImg = absAsset(brand.image);
  const headerHtml = sandbox.header("브랜드 매거진");

  let bodyHtml = renderBrandMagazine(brand);

  // h1 한/영 병기 — renderBrandMagazine은 brand.name만 출력한다. 검증된 한글/원어
  // 표기가 둘 다 있을 때만 병기하며, 없으면 원래 마크업을 그대로 둔다.
  const h1 = headingMarkup(brand, esc);
  const h1Plain = `<h1>${esc(brand.name)}</h1>`;
  if (h1 !== esc(brand.name) && bodyHtml.includes(h1Plain)) {
    bodyHtml = bodyHtml.replace(h1Plain, `<h1>${h1}</h1>`);
  }

  // FAQ 셀을 "함께 읽을 브랜드" 앞에 넣고 탭에도 항목을 추가한다.
  const faqHtml = faqSection(faq);
  if (faqHtml) {
    const relatedCell = '<section class="cell wide related-cell"';
    bodyHtml = bodyHtml.includes(relatedCell)
      ? bodyHtml.replace(relatedCell, `${faqHtml}${relatedCell}`)
      : bodyHtml.replace("</section>$", `${faqHtml}</section>`);
    const relatedTab = '<a class="" href="#related">함께 읽을 브랜드</a>';
    if (bodyHtml.includes(relatedTab)) {
      bodyHtml = bodyHtml.replace(relatedTab, `<a class="" href="#faq">자주 묻는 질문</a>${relatedTab}`);
    }
  }

  // 색인 판정은 실제로 발행되는 본문 기준이다. sections 원문 길이만 보면 FAQ·개요
  // 폴백이 더해진 최종 페이지를 과소평가해 리바이스 같은 브랜드까지 색인에서 빠진다.
  const renderedChars = renderedBodyChars(bodyHtml);
  const dupCanonical = canonicalOverride.get(urlSlugOf(brand));
  const robots = (dupCanonical || renderedChars < RENDERED_THIN_THRESHOLD) ? "noindex,follow" : "index,follow";
  renderedLen.set(urlSlugOf(brand), dupCanonical ? 0 : renderedChars);
  const canonical = dupCanonical || url;

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="${robots}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImg}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../assets/objects/brand_atlas_logo_mark.png"><link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="브랜드 아틀라스 RSS" href="${ORIGIN}/rss.xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles.css?v=${CSS_V}"><script type="application/ld+json">${jsonLd(brand, faq)}</script></head>
<body><a href="#main-content" class="skip-nav">본문 바로가기</a><div id="head">${headerHtml}</div><main id="main-content" class="wrap"><div id="brandPage">${bodyHtml}</div>${SUB_FOOTER}</main></body></html>`;
}

// ---- run ----
const outDir = sampleSlugs ? "/tmp/ssg-brand-sample" : path.join(ROOT, "brand");
fs.mkdirSync(outDir, { recursive: true });
const list = sampleSlugs ? BRANDS.filter(b => sampleSlugs.includes(b.slug)) : BRANDS;
let written = 0, failed = 0;
for (const b of list) {
  try {
    const html = pageHtml(b);
    fs.writeFileSync(path.join(outDir, `${urlSlugOf(b)}.html`), html);
    written++;
  } catch (e) {
    failed++;
    console.error(`FAIL ${b.slug}: ${e.message}`);
  }
}
console.log(`wrote ${written} pages, ${failed} failed → ${outDir}`);

if (!sampleSlugs) {
  // sitemap은 카테고리·국가 허브까지 알아야 하므로 build-seo-extras.mjs가 만든다.
  // 여기서는 thin(noindex) 판정 결과만 리포트로 남겨 되돌릴 수 있게 한다.
  const thin = BRANDS
    .filter(b => (renderedLen.get(urlSlugOf(b)) ?? 0) < RENDERED_THIN_THRESHOLD)
    .map(b => ({
      slug: urlSlugOf(b),
      name: b.name,
      industry: b.industry || null,
      renderedChars: renderedLen.get(urlSlugOf(b)) ?? 0,
      sectionChars: bodyTextLength(b),
    }))
    .sort((a, b) => a.renderedChars - b.renderedChars);
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "reports", "thin-pages.json"),
    JSON.stringify({
      threshold: RENDERED_THIN_THRESHOLD,
      basis: "rendered body text (excludes header/footer/related cards)",
      total: BRANDS.length,
      noindexed: thin.length,
      slugs: thin.map(t => t.slug),
      pages: thin,
    }, null, 1)
  );
  console.log(`thin(noindex): ${thin.length}/${BRANDS.length} → reports/thin-pages.json`);
  console.log("run scripts/build-seo-extras.mjs next to regenerate hubs + sitemap");
}
