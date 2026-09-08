// SSG: 브랜드별 정적 페이지 /brand/<slug>.html
//
// 본문 산문·연표·BI/CI·관련 브랜드는 app.js의 렌더 함수를 Node VM 샌드박스에서 그대로 써서
// SPA와 결과가 같다. 페이지 골격(머리·팩트 표·목차·질문형 H2)은 lib/brand-render.mjs.
//
//   node scripts/build-brand-pages.mjs                 # 전량 빌드 + thin 리포트 + 신선도 원장
//   node scripts/build-brand-pages.mjs --sample gucci,nike   # /tmp 샘플, 원장 미기록
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  buildTitle, buildDescription, buildFaq, koreanName, latinName, displayName,
  countryOf, foundedYear, bodyTextLength, urlSlugOf, THIN_THRESHOLD,
} from "./lib/brand-seo.mjs";
import { page as shell, esc } from "./lib/page-shell.mjs";
import { renderBrandPage } from "./lib/brand-render.mjs";
import { isDirectory, isNoindex, byScore } from "./lib/archive.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://brandatlas.co.kr";
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];

const args = new Map(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true] : [a, true]));
const sampleSlugs = typeof args.get("sample") === "string" ? args.get("sample").split(",").map(s => s.trim()) : null;

// ---- VM shim: app.js를 브라우저 전역 흉내 위에서 로드 ----
const appSrc = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const sandbox = {
  location: { pathname: "/pages/_ssg_", search: "", href: `${ORIGIN}/pages/_ssg_` },
  document: { addEventListener() {}, head: { querySelector: () => null, appendChild() {} }, createElement: () => ({ setAttribute() {}, appendChild() {} }), getElementById: () => null, querySelector: () => null },
  window: { addEventListener() {} },
  URL, console,
};
sandbox.window.brandAtlasData = DATA;
vm.createContext(sandbox);
vm.runInContext(appSrc, sandbox, { filename: "app.js" });
// /brand/<slug>.html 깊이에 맞춘 링크
sandbox.brandUrl = (b) => `../brand/${encodeURIComponent(urlSlugOf(b))}.html`;

// 국가 허브 존재 여부 — 머리 칩에서 국가 허브로 링크할지 결정한다(없는 파일로 링크 금지).
const countryHubs = new Set(fs.existsSync(path.join(ROOT, "country")) ? fs.readdirSync(path.join(ROOT, "country")).filter(f => f.endsWith(".html")).map(f => f.replace(/\.html$/, "")) : []);

const PUBLISHER = {
  "@type": "Organization",
  name: "브랜드성장연구소 아키타이포스",
  url: `${ORIGIN}/`,
  logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/objects/archetypos_logo.png`, width: 284, height: 66 },
};

function absAsset(src) {
  const clean = String(src || "").replace(/^\.\.\//, "").replaceAll("\\", "/");
  if (!clean) return null;
  return /^https?:\/\//.test(clean) ? clean : `${ORIGIN}/${clean}`;
}
const short = sandbox.short;

function jsonLd(brand, faq, dates, url) {
  const facts = brand.facts || {};
  const year = foundedYear(brand);
  const country = countryOf(brand);
  const ko = koreanName(brand), en = latinName(brand);
  const primary = ko || en || brand.name;
  const alternates = [...new Set([ko, en, brand.name, brand.nameEn, brand.nameKo].map(v => String(v || "").trim()).filter(v => v && v !== primary))];
  const wd = brand.wikidata || {};
  const logo = brand.logo ? absAsset(brand.logo) : undefined;
  const org = {
    "@type": "Organization",
    "@id": `${url}#brand`,
    name: primary,
    alternateName: alternates.length ? (alternates.length === 1 ? alternates[0] : alternates) : undefined,
    description: short(`${brand.definition || brand.summary || ""}`, 200) || undefined,
    url: facts.officialWebsite || brand.officialWebsite || undefined,
    logo,
    image: logo,
    foundingDate: year ? String(year) : undefined,
    foundingLocation: country ? { "@type": "Place", name: country } : undefined,
    founder: wd.founders && wd.founders.length ? wd.founders.map(n => ({ "@type": "Person", name: n })) : undefined,
    parentOrganization: wd.parent ? { "@type": "Organization", name: wd.parent } : undefined,
    location: wd.headquarters ? { "@type": "Place", name: wd.headquarters } : undefined,
    sameAs: brand.entityLinks?.sameAs?.length ? brand.entityLinks.sameAs : undefined,
  };
  const categoryUrl = brand.domainSlug ? `${ORIGIN}/category/${brand.domainSlug}.html` : `${ORIGIN}/pages/industry.html`;
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "브랜드 사전", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: brand.industry || "산업", item: categoryUrl },
      { "@type": "ListItem", position: 3, name: displayName(brand), item: url },
    ],
  };
  const article = {
    "@type": "Article",
    headline: short(buildTitle(brand), 110),
    description: buildDescription(brand),
    image: logo || absAsset(brand.image) || undefined,
    inLanguage: "ko-KR",
    datePublished: dates.published,
    dateModified: dates.modified,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: { "@id": `${url}#brand` },
    isPartOf: { "@type": "WebSite", name: "브랜드 아틀라스", url: `${ORIGIN}/` },
    author: PUBLISHER,
    publisher: PUBLISHER,
  };
  const graph = [org, article, breadcrumb];
  if (faq && faq.length >= 2) {
    graph.push({ "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  }
  if (logo) {
    graph.push({ "@type": "ImageObject", contentUrl: logo, name: `${displayName(brand)} 로고`, caption: `${displayName(brand)} 로고`, representativeOfPage: true });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// ─── 신선도 원장 ────────────────────────────────────────────────────────────
// 렌더 본문의 *텍스트* 해시가 바뀐 페이지만 dateModified를 갱신한다. 마크업 해시가 아니라
// 텍스트 해시를 쓰는 이유: 디자인·클래스명만 바뀐 재빌드가 전량 "오늘 갱신"으로 튀면
// sitemap lastmod와 마찬가지로 거짓 신선도 신호가 된다.
const DATES_PATH = path.join(ROOT, "reports", "page-dates.json");
// 한국 사이트이므로 날짜는 KST 기준으로 센다. UTC로 세면 새벽 빌드(주간 cron 월 05:10 KST)에서
// 이 빌더만 하루 이른 날짜를 찍어 build-seo-extras.mjs의 sitemap·RSS와 어긋난다(2026-09-08).
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const TODAY = kstDay(Date.now());
let dateLedger = { version: 2, pages: {} };
try { dateLedger = JSON.parse(fs.readFileSync(DATES_PATH, "utf8")); } catch { /* 최초 실행 */ }
dateLedger.pages = dateLedger.pages || {};

const textOf = (html) => html.replace(/<p class="page-updated">[\s\S]*?<\/p>/, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const contentHash = (text) => crypto.createHash("sha1").update(text).digest("hex").slice(0, 16);

/** 배포본에서 본문 텍스트를 떼어 해시 — 원장이 없거나 유실돼도 판정 가능(자기복구). */
function deployedBodyHash(slug) {
  let html;
  try { html = fs.readFileSync(path.join(ROOT, "brand", `${slug}.html`), "utf8"); } catch { return null; }
  const m = /<div class="brand-main" id="brandPage">([\s\S]*?)<!--related-->/.exec(html)
    || /<div id="brandPage">([\s\S]*)<\/div><footer/.exec(html);
  if (!m) return null;
  return contentHash(textOf(m[1]));
}
function fileDate(slug) {
  try { return kstDay(fs.statSync(path.join(ROOT, "brand", `${slug}.html`)).mtimeMs); }
  catch { return TODAY; }
}
function pageDates(slug, hash, robots) {
  const prev = dateLedger.pages[slug] || {};
  const seed = fileDate(slug);
  const published = prev.published || seed;
  const before = prev.hash || deployedBodyHash(slug);
  // 색인 상태가 바뀐 것도 갱신 사유다. 본문이 그대로여도 noindex → index로 바뀌었으면
  // 크롤러가 다시 와야 하는데, 본문 해시만 보면 lastmod가 옛 날짜로 남아 재수집이
  // 일어나지 않는다(2026-09-08, 디렉토리 등급 202건 색인 복귀 때 확인).
  // robots를 기록하지 않던 시절의 항목은 값이 없으므로 변경으로 치지 않는다.
  const robotsChanged = prev.robots !== undefined && prev.robots !== robots;
  const bodySame = before && before === hash;
  const modified = bodySame && !robotsChanged ? (prev.modified || seed) : TODAY;
  dateLedger.pages[slug] = { published, modified, hash, robots };
  return dateLedger.pages[slug];
}
const koDate = (iso) => { const [y, m, d] = iso.split("-"); return `${y}년 ${Number(m)}월 ${Number(d)}일`; };

const RENDERED_THIN_THRESHOLD = 700;
const renderedLen = new Map();
const tierOf = new Map();

// 같은 브랜드가 두 레코드인 경우 본문이 긴 쪽을 정본으로, 나머지는 canonical → 정본 + noindex.
const canonicalOverride = new Map();
{
  const normName = (b) => String(b.name || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
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

/** 본문 순수 텍스트 길이(관련 브랜드·사이드 제외). */
function mainText(bodyHtml) {
  const m = /<div class="brand-main" id="brandPage">([\s\S]*?)<!--related-->/.exec(bodyHtml);
  return textOf(m ? m[1] : bodyHtml);
}

function relatedFor(brand) {
  return sandbox.relatedBrands(brand, 12).filter(b => !isDirectory(b)).sort(byScore).slice(0, 8);
}

function pageHtml(brand) {
  const slug = urlSlugOf(brand);
  const url = `${ORIGIN}/brand/${encodeURIComponent(slug)}.html`;
  const title = buildTitle(brand);
  const desc = buildDescription(brand);
  const faq = buildFaq(brand);
  let bodyHtml = renderBrandPage(brand, { sandbox, faq, countryHubs, related: relatedFor(brand) });

  const text = mainText(bodyHtml);
  const renderedChars = text.length;
  const dupCanonical = canonicalOverride.get(slug);
  const directory = isDirectory(brand);
  // 디렉토리 등급이라도 본문이 충실하면 색인한다(2026-09-08). 등급은 목록·홈 노출을 가르는
  // 기준이고, 색인 여부는 페이지에 읽을 내용이 있느냐로 판단한다. 종전에는 등급만으로
  // noindex를 걸어, 네이버가 구 URL을 301로 따라와 도착한 곳이 색인 불가라 URL 교체가
  // 진행되지 않았다(웹마스터 '리다이렉션된 페이지' 진단 108건 중 41건이 이 경우).
  const robots = (dupCanonical || isNoindex(brand) || renderedChars < RENDERED_THIN_THRESHOLD) ? "noindex,follow" : "index,follow";
  // 신선도 원장은 robots까지 보고 판정하므로 robots를 먼저 확정한 뒤 호출한다.
  const dates = pageDates(slug, contentHash(text), robots);
  bodyHtml = bodyHtml.replace("__UPDATED__", `<p class="page-updated">최종 업데이트 <time datetime="${dates.modified}">${koDate(dates.modified)}</time></p>`);
  renderedLen.set(slug, dupCanonical ? 0 : renderedChars);
  tierOf.set(slug, directory ? "directory" : "listed");
  const canonical = dupCanonical || url;
  const ogImage = brand.logo ? absAsset(brand.logo) : (absAsset(brand.image) || undefined);

  return shell({
    title, desc, canonical, ogImage, ogType: "article", robots, prefix: "../", active: "ganada",
    jsonLd: jsonLd(brand, faq, dates, url), bodyHtml, bodyClass: "brand-page",
  });
}

// ---- run ----
const outDir = sampleSlugs ? "/tmp/ssg-brand-sample" : path.join(ROOT, "brand");
fs.mkdirSync(outDir, { recursive: true });
const list = sampleSlugs ? BRANDS.filter(b => sampleSlugs.includes(urlSlugOf(b))) : BRANDS;
let written = 0, unchanged = 0, failed = 0;
for (const b of list) {
  try {
    const html = pageHtml(b);
    const out = path.join(outDir, `${urlSlugOf(b)}.html`);
    // 내용이 같으면 다시 쓰지 않는다(sitemap lastmod = mtime 이므로 전량 덮어쓰기는 거짓 신호).
    if (fs.existsSync(out) && fs.readFileSync(out, "utf8") === html) { unchanged++; continue; }
    fs.writeFileSync(out, html);
    written++;
  } catch (e) {
    failed++;
    console.error(`FAIL ${urlSlugOf(b)}: ${e.stack || e.message}`);
  }
}
console.log(`wrote ${written} pages, ${unchanged} unchanged, ${failed} failed → ${outDir}`);

if (!sampleSlugs) {
  // 데이터에서 사라진 브랜드의 고아 페이지를 지운다(배포는 --delete 미러링이지만 로컬 QA가 먼저 본다).
  const valid = new Set(BRANDS.map(b => `${urlSlugOf(b)}.html`));
  let orphans = 0;
  for (const f of fs.readdirSync(outDir).filter(f => f.endsWith(".html"))) {
    if (!valid.has(f)) { fs.unlinkSync(path.join(outDir, f)); orphans++; }
  }
  if (orphans) console.log(`고아 페이지 삭제 ${orphans}건`);

  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(DATES_PATH, JSON.stringify(dateLedger, null, 1));
  const changedToday = Object.values(dateLedger.pages).filter(p => p.modified === TODAY).length;
  console.log(`page-dates: ${Object.keys(dateLedger.pages).length}건 원장, 오늘 갱신 ${changedToday}건`);

  const thin = BRANDS
    .filter(b => (renderedLen.get(urlSlugOf(b)) ?? 0) < RENDERED_THIN_THRESHOLD)
    .map(b => ({ slug: urlSlugOf(b), name: b.name, industry: b.industry || null, renderedChars: renderedLen.get(urlSlugOf(b)) ?? 0, sectionChars: bodyTextLength(b), tier: tierOf.get(urlSlugOf(b)) }))
    .sort((a, b) => a.renderedChars - b.renderedChars);
  const directory = BRANDS.filter(b => isNoindex(b)).map(b => urlSlugOf(b));
  const noindexSlugs = [...new Set([...thin.map(t => t.slug), ...directory])];
  fs.writeFileSync(path.join(ROOT, "reports", "thin-pages.json"), JSON.stringify({
    threshold: RENDERED_THIN_THRESHOLD,
    basis: "rendered main text (excludes header/footer/aside/related) + directory tier",
    total: BRANDS.length,
    noindexed: noindexSlugs.length,
    thinCount: thin.length,
    directoryCount: directory.length,
    slugs: noindexSlugs,
    directorySlugs: directory,
    pages: thin,
  }, null, 1));
  console.log(`noindex: thin ${thin.length} + directory ${directory.length} → ${noindexSlugs.length}/${BRANDS.length} (reports/thin-pages.json)`);
  console.log("run scripts/build-seo-extras.mjs next to regenerate hubs + sitemap");
}
