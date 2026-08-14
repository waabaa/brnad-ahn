// SEO extras for Naver/Google crawlability.
//
// 2026-08 SEO audit found the crawl graph was effectively a single flat page: only
// /pages/brands.html carried static links to the 1,452 brand pages, while
// industry/bici/insights/timeline rendered their lists in JS (invisible to Naver's
// Yeti). Naver had indexed 473/1,452 (32.6%).
//
// This builder now emits:
//   1) /category/<domainSlug>.html  — 12 industry hubs covering every brand
//   2) /country/<slug>.html         — origin-country hubs (definition-verified only)
//   3) /pages/brands.html           — full static index, grouped by industry
//   4) static link lists injected into the four JS-rendered hubs
//   5) static brand links on the home page
//   6) sitemap index + split sitemaps with real lastmod, excluding noindex pages
//   7) /rss.xml — 100 most recently updated brands
//
// Usage: node scripts/build-seo-extras.mjs   (run AFTER build-brand-pages.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORIGIN, CSS_V, urlSlugOf, countryOf, foundedYear, isThin, displayName,
} from "./lib/brand-seo.mjs";
import { esc, page, collectionJsonLd } from "./lib/page-shell.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];
const total = BRANDS.length;

const brandHref = (b, prefix = "../") => `${prefix}brand/${encodeURIComponent(urlSlugOf(b))}.html`;
const byName = (a, b) => String(a.name).localeCompare(String(b.name), "ko");

/** 목록 항목 — 브랜드명(한/영) + 한 줄 설명. 설명이 있으면 크롤러가 읽을 텍스트가 늘어난다. */
function entry(b, prefix = "../") {
  const en = b.nameEn && b.nameEn !== b.name ? ` <span class="bx-en">${esc(b.nameEn)}</span>` : "";
  return `<li><a href="${brandHref(b, prefix)}">${esc(b.name)}${en}</a></li>`;
}

function listSection(titleText, arr, anchor, prefix = "../") {
  return `<section class="bx-group" id="${anchor}"><h2>${esc(titleText)} <small>${arr.length}</small></h2><ul class="bx-list">${arr.map(b => entry(b, prefix)).join("")}</ul></section>`;
}

// ─── 1) 산업 카테고리 허브 ──────────────────────────────────────────────────
const byIndustry = new Map();
for (const b of BRANDS) {
  const key = b.domainSlug || "etc";
  if (!byIndustry.has(key)) byIndustry.set(key, { label: b.industry || "기타", items: [] });
  byIndustry.get(key).items.push(b);
}
const industryGroups = [...byIndustry.entries()].sort((a, b) => b[1].items.length - a[1].items.length);
for (const [, g] of industryGroups) g.items.sort(byName);

fs.mkdirSync(path.join(ROOT, "category"), { recursive: true });
const categoryLinks = industryGroups
  .map(([slug, g]) => `<a href="../category/${slug}.html">${esc(g.label)} <small>${g.items.length}</small></a>`)
  .join("");

for (const [slug, g] of industryGroups) {
  const url = `${ORIGIN}/category/${slug}.html`;
  const withCountry = g.items.filter(b => countryOf(b));
  const countryTally = new Map();
  for (const b of withCountry) countryTally.set(countryOf(b), (countryTally.get(countryOf(b)) || 0) + 1);
  const topCountries = [...countryTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const years = g.items.map(foundedYear).filter(Boolean);
  const oldest = years.length ? Math.min(...years) : null;

  // 큐레이션 문단 — 전부 집계값이며 새로운 사실을 만들지 않는다.
  const lead = `브랜드 아틀라스의 ${g.label} 브랜드 ${g.items.length}개를 한자리에 모았습니다. 각 항목은 설립 배경, 브랜드 아이덴티티, BI/CI 변천, 제품과 서비스, 현재 상태를 정리한 상세 페이지로 이어집니다.`;
  const facts = [];
  if (topCountries.length) facts.push(`기원 국가가 확인된 브랜드는 ${withCountry.length}개이며 ${topCountries.map(([c, n]) => `${c} ${n}개`).join(", ")} 순으로 많습니다.`);
  if (oldest) facts.push(`가장 이른 설립 연도는 ${oldest}년입니다.`);
  // lead는 hero에 이미 나오므로 여기서는 집계 사실만 덧붙인다(중복 출력 방지).
  const note = facts.length ? `<p class="bx-note">${esc(facts.join(" "))}</p>` : "";

  const title = `${g.label} 브랜드 ${g.items.length}개 목록 — 역사·BI/CI | 브랜드 아틀라스`;
  const desc = `${g.label} 브랜드 ${g.items.length}개를 정리한 목록. ${topCountries.length ? `${topCountries.map(([c]) => c).join("·")} 등 ` : ""}각 브랜드의 설립 배경과 아이덴티티, BI/CI 변천사를 확인할 수 있습니다.`;

  const body = `<section class="page-title"><div><p class="kicker">CATEGORY</p><h1>${esc(g.label)} 브랜드</h1><p class="lead">${esc(lead)}</p></div></section>
<nav class="bx-toc" aria-label="다른 산업">${categoryLinks}</nav>
${note}
${listSection(g.label, g.items, `cat-${slug}`)}`;

  fs.writeFileSync(path.join(ROOT, "category", `${slug}.html`), page({
    title, desc, canonical: url, bodyHtml: body, active: "산업별 탐색",
    jsonLd: collectionJsonLd({
      name: title, description: desc, url,
      crumbs: [
        { name: "브랜드 사전", url: `${ORIGIN}/` },
        { name: "산업별 탐색", url: `${ORIGIN}/pages/industry.html` },
        { name: g.label, url },
      ],
    }),
  }));
}
console.log(`category/: ${industryGroups.length} pages, ${industryGroups.reduce((s, [, g]) => s + g.items.length, 0)} links`);

// ─── 2) 국가 허브 ──────────────────────────────────────────────────────────
// countryOf()는 definition에서 검증된 기원 국가만 돌려준다. `country` 필드는
// 소유주 국적 오염으로 폐기했다(lib/brand-seo.mjs 주석 참조).
const COUNTRY_SLUG = {
  미국: "usa", 한국: "korea", 독일: "germany", 영국: "uk", 프랑스: "france",
  일본: "japan", 이탈리아: "italy", 네덜란드: "netherlands", 스웨덴: "sweden",
  스위스: "switzerland", 캐나다: "canada", 스페인: "spain", 호주: "australia",
  뉴질랜드: "new-zealand", 노르웨이: "norway", 핀란드: "finland", 덴마크: "denmark",
  벨기에: "belgium", 오스트리아: "austria", 러시아: "russia", 중국: "china",
  폴란드: "poland", 대만: "taiwan", 브라질: "brazil", 아이슬란드: "iceland",
  자메이카: "jamaica", 그리스: "greece", 포르투갈: "portugal", 홍콩: "hong-kong",
  터키: "turkey", 남아프리카공화국: "south-africa", 인도: "india", 멕시코: "mexico",
  아일랜드: "ireland", 싱가포르: "singapore", 태국: "thailand", 베트남: "vietnam",
  체코: "czech", 헝가리: "hungary", 이스라엘: "israel", 칠레: "chile",
  아르헨티나: "argentina", 말레이시아: "malaysia", 인도네시아: "indonesia",
  필리핀: "philippines", 우크라이나: "ukraine",
};
const MIN_COUNTRY_BRANDS = 5; // 이보다 적으면 목록 페이지로서 얇다.

const byCountry = new Map();
for (const b of BRANDS) {
  const c = countryOf(b);
  if (!c || !COUNTRY_SLUG[c]) continue;
  if (!byCountry.has(c)) byCountry.set(c, []);
  byCountry.get(c).push(b);
}
const countryGroups = [...byCountry.entries()]
  .filter(([, arr]) => arr.length >= MIN_COUNTRY_BRANDS)
  .sort((a, b) => b[1].length - a[1].length);
for (const [, arr] of countryGroups) arr.sort(byName);

fs.mkdirSync(path.join(ROOT, "country"), { recursive: true });
const countryLinks = countryGroups
  .map(([c, arr]) => `<a href="../country/${COUNTRY_SLUG[c]}.html">${esc(c)} <small>${arr.length}</small></a>`)
  .join("");

for (const [c, arr] of countryGroups) {
  const slug = COUNTRY_SLUG[c];
  const url = `${ORIGIN}/country/${slug}.html`;
  const indTally = new Map();
  for (const b of arr) indTally.set(b.industry, (indTally.get(b.industry) || 0) + 1);
  const topInd = [...indTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const years = arr.map(foundedYear).filter(Boolean);

  const lead = `${c}에서 시작한 브랜드 ${arr.length}개를 모았습니다. 수록 기준은 각 브랜드 설명에서 기원 국가가 확인된 경우로 한정했습니다.`;
  const facts = [];
  if (topInd.length) facts.push(`산업별로는 ${topInd.map(([i, n]) => `${i} ${n}개`).join(", ")} 순입니다.`);
  if (years.length) facts.push(`설립 연도가 확인된 ${years.length}개 중 가장 이른 해는 ${Math.min(...years)}년입니다.`);

  const title = `${c} 브랜드 ${arr.length}개 목록 — 설립 역사·BI/CI | 브랜드 아틀라스`;
  const desc = `${c}에서 시작한 브랜드 ${arr.length}개 목록. ${topInd.map(([i]) => i).join("·")} 등 각 브랜드의 설립 배경과 아이덴티티, BI/CI 변천사를 정리했습니다.`;

  const body = `<section class="page-title"><div><p class="kicker">COUNTRY</p><h1>${esc(c)} 브랜드</h1><p class="lead">${esc(lead)}</p></div></section>
<nav class="bx-toc" aria-label="다른 국가">${countryLinks}</nav>
<p class="bx-note">${esc(facts.join(" "))}</p>
${listSection(`${c} 브랜드`, arr, `country-${slug}`)}`;

  fs.writeFileSync(path.join(ROOT, "country", `${slug}.html`), page({
    title, desc, canonical: url, bodyHtml: body, active: "산업별 탐색",
    jsonLd: collectionJsonLd({
      name: title, description: desc, url,
      crumbs: [
        { name: "브랜드 사전", url: `${ORIGIN}/` },
        { name: "국가별 브랜드", url: `${ORIGIN}/pages/brands.html` },
        { name: c, url },
      ],
    }),
  }));
}
console.log(`country/: ${countryGroups.length} pages, ${countryGroups.reduce((s, [, a]) => s + a.length, 0)} links`);

// ─── 3) /pages/brands.html — 전체 정적 인덱스 ────────────────────────────────
{
  const url = `${ORIGIN}/pages/brands.html`;
  const sections = industryGroups.map(([slug, g]) =>
    `<section class="bx-group" id="ind-${slug}"><h2><a href="../category/${slug}.html">${esc(g.label)}</a> <small>${g.items.length}</small></h2><ul class="bx-list">${g.items.map(b => entry(b)).join("")}</ul></section>`
  ).join("\n");
  const title = `전체 브랜드 목록 ${total}개 — 산업별 브랜드 사전 | 브랜드 아틀라스`;
  const desc = `브랜드 아틀라스에 수록된 ${total}개 브랜드를 산업별로 정리한 전체 목록. 각 브랜드의 설립 역사·BI/CI·제품·인물·인사이트를 확인할 수 있습니다.`;
  const body = `<section class="page-title"><div><p class="kicker">ALL BRANDS</p><h1>전체 브랜드 목록</h1><p class="lead">브랜드 아틀라스에 수록된 <b>${total}</b>개 브랜드를 산업별로 정리했습니다. 각 항목은 해당 브랜드의 상세 매거진으로 연결됩니다.</p></div></section>
<nav class="bx-toc" aria-label="산업 바로가기">${categoryLinks}</nav>
<nav class="bx-toc" aria-label="국가 바로가기">${countryLinks}</nav>
${sections}`;
  fs.writeFileSync(path.join(ROOT, "pages", "brands.html"), page({
    title, desc, canonical: url, bodyHtml: body, active: "전체 브랜드",
    jsonLd: collectionJsonLd({
      name: title, description: desc, url,
      crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "전체 브랜드", url }],
    }),
  }));
  console.log(`pages/brands.html: ${total} brands, ${industryGroups.length} groups`);
}

// ─── 4) JS 렌더 허브에 정적 목록 주입 ───────────────────────────────────────
// 기존 페이지의 빈 컨테이너(<div id="X"></div>)를 정적 마크업으로 채운다. app.js가
// 나중에 같은 컨테이너를 다시 그리더라도, 크롤러와 JS 미실행 환경은 이 내용을 본다.
// 멱등해야 한다 — 이미 주입된 컨테이너도 매번 새 내용으로 교체한다. 컨테이너를 여는
// 태그부터 첫 </div>까지를 통째로 갈아끼우므로, 주입하는 마크업에 <div>를 쓰지 않는다
// (section/article/ul/p만 사용).
function injectContainer(file, containerId, html) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, "utf8");
  const re = new RegExp(`(id="${containerId}"[^>]*>)[\\s\\S]*?(</div>)`);
  if (!re.test(s)) {
    console.warn(`  ! ${file}: #${containerId} 컨테이너를 찾지 못해 건너뜀`);
    return false;
  }
  if (/<div[\s>]/.test(html)) {
    throw new Error(`injectContainer(${containerId}): 주입 마크업에 <div>가 있으면 재실행 시 구조가 깨집니다`);
  }
  s = s.replace(re, `$1${html}$2`);
  fs.writeFileSync(p, s);
  return true;
}

{
  // insights — insight 문장이 있는 브랜드를 실제 텍스트와 함께 정적 노출.
  // 전량(1,396건)을 실으면 450KB가 되어 로딩이 무거워진다. 브랜드 전량 링크는 이미
  // category/* 12개가 담당하므로 여기서는 읽을거리로서 상위 300건만 싣는다.
  const INSIGHT_LIMIT = 300;
  const withInsight = BRANDS
    .filter(b => String(b.insight || "").trim().length >= 30)
    .sort((a, b) => (b.displayPriority || 0) - (a.displayPriority || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, INSIGHT_LIMIT)
    .sort(byName);
  const html = `${withInsight.map(b =>
    `<article class="bx-entry"><a href="${brandHref(b)}"><b>${esc(b.name)}</b></a><p>${esc(String(b.insight).slice(0, 160))}</p></article>`).join("")}<p class="bx-note"><a href="../pages/brands.html">전체 ${total}개 브랜드 목록 보기 →</a></p>`;
  injectContainer("pages/insights.html", "insightList", html);
  console.log(`pages/insights.html: +${withInsight.length} static entries (of ${BRANDS.filter(b => String(b.insight || "").trim().length >= 30).length} available)`);

  // bici — 실제 로고 자산이 있는 브랜드
  const withLogo = BRANDS.filter(b => b.logo && !String(b.logo).includes("brand_atlas_logo_mark")).sort(byName);
  const biciHtml = withLogo.map(b =>
    `<article><a href="${brandHref(b)}"><b>${esc(b.name)}</b></a><span>${esc(b.industry || "")}</span></article>`).join("");
  injectContainer("pages/bici.html", "biciList", biciHtml);
  console.log(`pages/bici.html: +${withLogo.length} static entries`);

  // timeline — 설립 연도가 확인된 브랜드를 연대별로
  const dated = BRANDS.map(b => ({ b, y: foundedYear(b) })).filter(x => x.y).sort((a, b) => a.y - b.y);
  const decades = new Map();
  for (const { b, y } of dated) {
    const d = Math.floor(y / 10) * 10;
    if (!decades.has(d)) decades.set(d, []);
    decades.get(d).push({ b, y });
  }
  const tlHtml = [...decades.entries()].sort((a, b) => a[0] - b[0]).map(([d, rows]) =>
    `<section class="bx-group"><h2>${d}년대 <small>${rows.length}</small></h2><ul class="bx-list">${rows.map(({ b, y }) => `<li><a href="${brandHref(b)}">${y} · ${esc(b.name)}</a></li>`).join("")}</ul></section>`).join("");
  injectContainer("pages/timeline.html", "timelineList", tlHtml);
  console.log(`pages/timeline.html: +${dated.length} static entries`);

  // industry — 카테고리 허브로 가는 정적 링크 + 산업별 브랜드 목록
  const indHtml = industryGroups.map(([slug, g]) =>
    `<section class="bx-group"><h2><a href="../category/${slug}.html">${esc(g.label)}</a> <small>${g.items.length}</small></h2><ul class="bx-list">${g.items.slice(0, 60).map(b => entry(b)).join("")}</ul><p class="bx-note"><a href="../category/${slug}.html">${esc(g.label)} 브랜드 ${g.items.length}개 전체 보기 →</a></p></section>`).join("");
  injectContainer("pages/industry.html", "brandCards", indHtml);
  console.log(`pages/industry.html: +${industryGroups.length} category blocks`);
}

// ─── 5) 홈에 정적 브랜드 링크 주입 ──────────────────────────────────────────
// 홈은 사이트에서 권위가 가장 높은 페이지인데 정적 브랜드 링크가 1개뿐이었다.
{
  const p = path.join(ROOT, "index.html");
  let s = fs.readFileSync(p, "utf8");
  const featured = [...BRANDS]
    .sort((a, b) => (b.displayPriority || 0) - (a.displayPriority || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 120)
    .sort(byName);
  const block = `<section class="bx-group" id="static-index"><h2>브랜드 바로가기</h2><nav class="bx-toc" aria-label="산업별">${categoryLinks.replace(/href="\.\.\//g, 'href="')}</nav><nav class="bx-toc" aria-label="국가별">${countryLinks.replace(/href="\.\.\//g, 'href="')}</nav><ul class="bx-list">${featured.map(b => entry(b, "")).join("")}</ul><p class="bx-note"><a href="pages/brands.html">전체 ${total}개 브랜드 목록 보기 →</a></p></section>`;

  const marker = '<section class="bx-group" id="static-index">';
  if (s.includes(marker)) {
    // 재실행 시 기존 블록을 교체한다(중복 누적 방지).
    s = s.replace(/<section class="bx-group" id="static-index">[\s\S]*?<\/section>(?=\s*<footer|\s*<\/main>)/, block);
  } else if (s.includes("</main>")) {
    s = s.replace("</main>", `${block}</main>`);
  } else {
    console.warn("  ! index.html: </main>을 찾지 못해 홈 링크 주입을 건너뜀");
  }
  fs.writeFileSync(p, s);
  console.log(`index.html: ${featured.length} static brand links`);
}

// ─── 6) sitemap index + 분할 ───────────────────────────────────────────────
// lastmod는 실제 파일 mtime을 쓴다. 이전에는 전량 동일한 고정 날짜라 갱신 신호로
// 기능하지 않았다.
function mtime(relPath) {
  try {
    return fs.statSync(path.join(ROOT, relPath)).mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
function urlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([loc, lm]) => `  <url><loc>${loc}</loc><lastmod>${lm}</lastmod></url>`).join("\n")}\n</urlset>\n`;
}

const hubEntries = [
  ["/", "index.html"],
  ["/pages/brands.html", "pages/brands.html"],
  ["/pages/industry.html", "pages/industry.html"],
  ["/pages/insights.html", "pages/insights.html"],
  ["/pages/timeline.html", "pages/timeline.html"],
  ["/pages/bici.html", "pages/bici.html"],
  ["/pages/search.html", "pages/search.html"],
  ...industryGroups.map(([slug]) => [`/category/${slug}.html`, `category/${slug}.html`]),
  ...countryGroups.map(([c]) => [`/country/${COUNTRY_SLUG[c]}.html`, `country/${COUNTRY_SLUG[c]}.html`]),
].map(([loc, rel]) => [`${ORIGIN}${loc}`, mtime(rel)]);

// noindex(thin) 브랜드는 sitemap에서 뺀다. 카테고리 목록 링크는 유지되므로
// 크롤러는 여전히 따라갈 수 있다(follow). 판정은 build-brand-pages.mjs가 실제 렌더
// 결과로 내린 것을 그대로 쓴다 — 여기서 다시 계산하면 두 기준이 어긋난다.
const thinReport = (() => {
  const p = path.join(ROOT, "reports", "thin-pages.json");
  if (!fs.existsSync(p)) {
    console.warn("  ! reports/thin-pages.json 없음 — build-brand-pages.mjs를 먼저 실행하세요. noindex 제외 없이 진행합니다.");
    return new Set();
  }
  return new Set(JSON.parse(fs.readFileSync(p, "utf8")).slugs || []);
})();
const indexable = BRANDS.filter(b => !thinReport.has(urlSlugOf(b)));
const brandEntries = indexable.map(b => {
  const slug = urlSlugOf(b);
  return [`${ORIGIN}/brand/${encodeURIComponent(slug)}.html`, mtime(`brand/${slug}.html`)];
});

const CHUNK = 1000;
const files = [];
fs.writeFileSync(path.join(ROOT, "sitemap-hubs.xml"), urlset(hubEntries));
files.push("sitemap-hubs.xml");
for (let i = 0; i < brandEntries.length; i += CHUNK) {
  const name = `sitemap-brands-${Math.floor(i / CHUNK) + 1}.xml`;
  fs.writeFileSync(path.join(ROOT, name), urlset(brandEntries.slice(i, i + CHUNK)));
  files.push(name);
}
// 오래된 단일 sitemap을 남기면 크롤러가 noindex URL을 계속 물고 간다.
for (const stale of fs.readdirSync(ROOT).filter(f => /^sitemap-brands-\d+\.xml$/.test(f))) {
  if (!files.includes(stale)) fs.unlinkSync(path.join(ROOT, stale));
}
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(f => `  <sitemap><loc>${ORIGIN}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`);
console.log(`sitemap.xml: index of ${files.length} files, ${hubEntries.length} hubs + ${brandEntries.length} brands (${total - indexable.length} noindex excluded)`);

// ─── 7) RSS — 최근 갱신 100건 ──────────────────────────────────────────────
{
  const ranked = indexable
    .map(b => ({ b, m: (() => { try { return fs.statSync(path.join(ROOT, "brand", `${urlSlugOf(b)}.html`)).mtimeMs; } catch { return 0; } })() }))
    .sort((x, y) => y.m - x.m || (y.b.displayPriority || 0) - (x.b.displayPriority || 0))
    .slice(0, 100);
  const items = ranked.map(({ b, m }) => {
    const link = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html`;
    const d = String(b.definition || b.summary || b.insight || "").slice(0, 280);
    return `    <item><title>${esc(displayName(b))}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><category>${esc(b.industry || "")}</category><pubDate>${new Date(m || Date.now()).toUTCString()}</pubDate><description>${esc(d)}</description></item>`;
  }).join("\n");
  fs.writeFileSync(path.join(ROOT, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>브랜드 아틀라스 | 브랜드 사전 매거진</title>
    <link>${ORIGIN}/</link>
    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>브랜드의 역사·산업 분류·BI/CI·제품·인물·인사이트를 정리한 브랜드 사전. 전체 ${total}개 브랜드 중 최근 갱신분을 제공합니다.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`);
  console.log(`rss.xml: ${ranked.length} items`);
}

console.log(`\ncssV=${CSS_V} — styles.css 캐시버스터 확인 필요`);
