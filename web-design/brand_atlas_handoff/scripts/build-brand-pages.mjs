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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");               // brand_atlas_handoff/
const ORIGIN = "https://brandatlas.co.kr";
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];

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

function jsonLd(brand) {
  const url = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(brand))}.html`;
  const facts = brand.facts || {};
  const org = {
    "@type": "Organization",
    name: brand.name,
    alternateName: brand.nameEn || undefined,
    description: short(`${brand.definition || brand.summary || ""}`, 200) || undefined,
    url: facts.officialWebsite || brand.officialWebsite || undefined,
    logo: brand.logo ? absAsset(brand.logo) : undefined,
    foundingDate: brand.timeline && brand.timeline[0] && brand.timeline[0].year ? String(brand.timeline[0].year) : undefined,
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
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function pageHtml(brand) {
  const url = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(brand))}.html`;
  const title = `${brand.name} 브랜드 매거진 | 브랜드 아틀라스`;
  const desc = short(`${brand.definition || ""} ${brand.insight || ""}`.trim(), 155);
  const ogImg = absAsset(brand.image);
  const headerHtml = sandbox.header("브랜드 매거진");
  const bodyHtml = renderBrandMagazine(brand);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImg}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../assets/objects/brand_atlas_logo_mark.png"><link rel="canonical" href="${url}"><link rel="alternate" type="application/rss+xml" title="브랜드 아틀라스 RSS" href="${ORIGIN}/rss.xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles.css?v=20260630t"><script type="application/ld+json">${jsonLd(brand)}</script></head>
<body><a href="#main-content" class="skip-nav">본문 바로가기</a><div id="head">${headerHtml}</div><main id="main-content" class="wrap"><div id="brandPage">${bodyHtml}</div></main></body></html>`;
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
  // Regenerate sitemap: static pages + new /brand/<slug>.html, NO ?brand= query URLs.
  const today = new Date().toISOString().slice(0, 10);
  const statics = ["/", "/pages/brands.html", "/pages/industry.html", "/pages/insights.html", "/pages/timeline.html", "/pages/bici.html", "/pages/search.html"];
  const urls = [
    ...statics.map(u => `${ORIGIN}${u}`),
    ...BRANDS.map(b => `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
  console.log(`sitemap.xml: ${urls.length} URLs (0 query-string)`);
}
