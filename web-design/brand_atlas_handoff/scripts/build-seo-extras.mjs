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

// 내용이 같으면 파일을 다시 쓰지 않는다 — sitemap lastmod가 mtime에서 나오므로
// 무의미한 덮어쓰기는 "전부 갱신됨"이라는 거짓 신선도 신호가 된다.
function writeIfChanged(p, content) {
  try {
    if (fs.readFileSync(p, "utf8") === content) return false;
  } catch { /* 없으면 새로 쓴다 */ }
  fs.writeFileSync(p, content);
  return true;
}

const brandHref = (b, prefix = "../") => `${prefix}brand/${encodeURIComponent(urlSlugOf(b))}.html`;
const byName = (a, b) => String(a.name).localeCompare(String(b.name), "ko");

/** definition 첫 문장. 없는 말을 만들지 않고 있는 문장을 잘라 쓴다. */
function oneLine(b, limit = 95) {
  const raw = String(b.definition || b.summary || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const m = /^[\s\S]{10,}?(?:다\.|요\.|[.!?])(?=\s|$)/.exec(raw);
  const first = m ? m[0].trim() : raw;
  if (first.length <= limit) return first;
  const cut = first.slice(0, limit);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > limit * 0.6 ? cut.slice(0, sp) : cut).trim()}…`;
}

/** 목록 항목. withDesc면 한 줄 설명을 붙인다.
 *
 * 2026-09 감사: 카테고리·국가 허브 28개가 네이버 색인 0건이었다. 원인은 기술이 아니라
 * 내용이었다 — 산문이 200~300자뿐이라(브랜드 페이지 중앙값 1,820자) 우리 자신의 thin
 * 기준(700자)에도 미달했다. 크롤 그래프의 핵심 허브가 정작 색인되지 않으면 하위 브랜드로
 * 링크 에퀴티가 전달되지 않는다. 설명을 붙여 목록 자체를 정보로 만든다.
 *
 * brands.html(1,449개)에는 붙이지 않는다 — 페이지가 과대해진다.
 */
function entry(b, prefix = "../", withDesc = false) {
  const en = b.nameEn && b.nameEn !== b.name ? ` <span class="bx-en">${esc(b.nameEn)}</span>` : "";
  const link = `<a href="${brandHref(b, prefix)}">${esc(b.name)}${en}</a>`;
  if (!withDesc) return `<li>${link}</li>`;
  const d = oneLine(b);
  return `<li class="bx-entry">${link}${d ? `<p>${esc(d)}</p>` : ""}</li>`;
}

function listSection(titleText, arr, anchor, prefix = "../", withDesc = false) {
  return `<section class="bx-group" id="${anchor}"><h2>${esc(titleText)} <small>${arr.length}</small></h2><ul class="bx-list">${arr.map(b => entry(b, prefix, withDesc)).join("")}</ul></section>`;
}

/** 허브 본문에 실을 집계 문장. 전부 수록 데이터를 센 값이며 새 사실을 만들지 않는다. */
function hubFacts(items) {
  const out = [];
  const years = items.map(foundedYear).filter(Boolean);
  if (years.length >= 3) {
    const era = { "1900년 이전": 0, "1900~1949년": 0, "1950~1999년": 0, "2000년 이후": 0 };
    for (const y of years) {
      if (y < 1900) era["1900년 이전"]++;
      else if (y < 1950) era["1900~1949년"]++;
      else if (y < 2000) era["1950~1999년"]++;
      else era["2000년 이후"]++;
    }
    const parts = Object.entries(era).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}개`);
    out.push(`설립 연도가 확인된 ${years.length}개를 시기별로 나누면 ${parts.join(", ")}입니다.`);
    const oldest = items.filter(b => foundedYear(b) === Math.min(...years))[0];
    const newest = items.filter(b => foundedYear(b) === Math.max(...years))[0];
    if (oldest && newest && oldest !== newest) {
      out.push(`가장 이른 브랜드는 ${displayName(oldest)}(${Math.min(...years)}년), 가장 늦은 브랜드는 ${displayName(newest)}(${Math.max(...years)}년)입니다.`);
    }
  }
  const withLogo = items.filter(b => b.logo && !String(b.logo).includes("brand_atlas_logo_mark")).length;
  const withBici = items.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1).length;
  const withTimeline = items.filter(b => Array.isArray(b.timeline) && b.timeline.length).length;
  const assets = [];
  if (withLogo) assets.push(`로고 이미지 ${withLogo}개`);
  if (withBici) assets.push(`BI/CI 변천 자료 ${withBici}개`);
  if (withTimeline) assets.push(`연혁 타임라인 ${withTimeline}개`);
  if (assets.length) out.push(`수록 자료로는 ${assets.join(", ")}를 갖췄습니다.`);
  const withEntity = items.filter(b => b.entityLinks && b.entityLinks.wikidata).length;
  if (withEntity) out.push(`이 가운데 ${withEntity}개는 공식 웹사이트가 일치하는 위키데이터 개체로 연결해 두었습니다.`);
  return out;
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

  // 큐레이션 문단 — 전부 집계값이며 새로운 사실을 만들지 않는다.
  const lead = `브랜드 아틀라스의 ${g.label} 브랜드 ${g.items.length}개를 한자리에 모았습니다. 각 항목은 설립 배경, 브랜드 아이덴티티, BI/CI 변천, 제품과 서비스, 현재 상태를 정리한 상세 페이지로 이어집니다.`;
  const facts = [];
  if (topCountries.length) facts.push(`기원 국가가 확인된 브랜드는 ${withCountry.length}개이며 ${topCountries.map(([c, n]) => `${c} ${n}개`).join(", ")} 순으로 많습니다.`);
  facts.push(...hubFacts(g.items));
  // lead는 hero에 이미 나오므로 여기서는 집계 사실만 덧붙인다(중복 출력 방지).
  const note = facts.length ? `<p class="bx-note">${esc(facts.join(" "))}</p>` : "";

  const title = `${g.label} 브랜드 ${g.items.length}개 목록 — 역사·BI/CI | 브랜드 아틀라스`;
  const desc = `${g.label} 브랜드 ${g.items.length}개를 정리한 목록. ${topCountries.length ? `${topCountries.map(([c]) => c).join("·")} 등 ` : ""}각 브랜드의 설립 배경과 아이덴티티, BI/CI 변천사를 확인할 수 있습니다.`;

  const body = `<section class="page-title"><div><p class="kicker">CATEGORY</p><h1>${esc(g.label)} 브랜드</h1><p class="lead">${esc(lead)}</p></div></section>
<nav class="bx-toc" aria-label="다른 산업">${categoryLinks}</nav>
${note}
${listSection(g.label, g.items, `cat-${slug}`, "../", true)}`;

  writeIfChanged(path.join(ROOT, "category", `${slug}.html`), page({
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
// 국가 허브는 브랜드 수가 아니라 **발행될 본문 길이**로 거른다. 브랜드 페이지에는
// 렌더 본문 700자 미만이면 noindex를 걸면서, 정작 크롤 그래프의 핵심인 허브는 200~300자로
// 발행하고 있었다(2026-09 감사 — 카테고리·국가 허브 28개 네이버 색인 0건). 기준을 하나로
// 맞춘다. 수가 적어 내용이 안 나오는 국가는 아예 만들지 않는다 — 그 브랜드들은 산업
// 카테고리 허브 12개가 이미 전량 커버한다.
const MIN_COUNTRY_BRANDS = 5;   // 본문 판정 전 1차 컷(계산 낭비 방지)
const HUB_MIN_PROSE = 700;      // 브랜드 페이지 thin 임계와 동일

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

/** 발행될 본문의 순수 텍스트 길이. 헤더·푸터·다른 국가 nav는 보일러플레이트라 뺀다. */
function prosePreview(bodyHtml) {
  return bodyHtml
    .replace(/<nav[\s\S]*?<\/nav>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

// 1차: 본문을 만들어 길이를 잰다(링크는 아직 붙이지 않는다 — 살아남는 국가가 정해져야
// 서로를 링크할 수 있다).
const countryDrafts = [];
for (const [c, arr] of countryGroups) {
  const slug = COUNTRY_SLUG[c];
  const indTally = new Map();
  for (const b of arr) indTally.set(b.industry, (indTally.get(b.industry) || 0) + 1);
  const topInd = [...indTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const lead = `${c}에서 시작한 브랜드 ${arr.length}개를 모았습니다. 수록 기준은 각 브랜드 설명에서 기원 국가가 확인된 경우로 한정했습니다.`;
  const facts = [];
  if (topInd.length) facts.push(`산업별로는 ${topInd.map(([i, n]) => `${i} ${n}개`).join(", ")} 순입니다.`);
  facts.push(...hubFacts(arr));

  const head = `<section class="page-title"><div><p class="kicker">COUNTRY</p><h1>${esc(c)} 브랜드</h1><p class="lead">${esc(lead)}</p></div></section>`;
  const rest = `<p class="bx-note">${esc(facts.join(" "))}</p>
${listSection(`${c} 브랜드`, arr, `country-${slug}`, "../", true)}`;
  const prose = prosePreview(head + rest);
  if (prose < HUB_MIN_PROSE) {
    console.log(`  country/${slug}: 본문 ${prose}자 < ${HUB_MIN_PROSE} — 발행 생략`);
    const stale = path.join(ROOT, "country", `${slug}.html`);
    if (fs.existsSync(stale)) fs.unlinkSync(stale);   // 과거 발행분이 남으면 고아가 된다
    continue;
  }
  countryDrafts.push({ c, slug, arr, topInd, head, rest, prose });
}

const countryLinks = countryDrafts
  .map(({ c, slug, arr }) => `<a href="../country/${slug}.html">${esc(c)} <small>${arr.length}</small></a>`)
  .join("");

for (const { c, slug, arr, topInd, head, rest } of countryDrafts) {
  const url = `${ORIGIN}/country/${slug}.html`;
  const title = `${c} 브랜드 ${arr.length}개 목록 — 설립 역사·BI/CI | 브랜드 아틀라스`;
  const desc = `${c}에서 시작한 브랜드 ${arr.length}개 목록. ${topInd.map(([i]) => i).join("·")} 등 각 브랜드의 설립 배경과 아이덴티티, BI/CI 변천사를 정리했습니다.`;
  const body = `${head}
<nav class="bx-toc" aria-label="다른 국가">${countryLinks}</nav>
${rest}`;

  writeIfChanged(path.join(ROOT, "country", `${slug}.html`), page({
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
console.log(`country/: ${countryDrafts.length} pages, ${countryDrafts.reduce((s, d) => s + d.arr.length, 0)} links (얇아서 생략 ${countryGroups.length - countryDrafts.length})`);

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
  writeIfChanged(path.join(ROOT, "pages", "brands.html"), page({
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
  writeIfChanged(p, s);
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
  writeIfChanged(p, s);
  console.log(`index.html: ${featured.length} static brand links`);
}

// ─── 6) sitemap index + 분할 ───────────────────────────────────────────────
// lastmod는 실제 파일 mtime을 쓴다. 이전에는 전량 동일한 고정 날짜라 갱신 신호로
// 기능하지 않았다.
// KST 기준 날짜로 찍는다. UTC로 자르면 오전 9시 이전에 만든 파일이 전날로 기록되어
// 방금 갱신한 페이지가 하루 묵은 것처럼 보인다.
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);

function mtime(relPath) {
  try {
    return kstDay(fs.statSync(path.join(ROOT, relPath)).mtimeMs);
  } catch {
    return kstDay(Date.now());
  }
}
// 이미지 sitemap을 함께 낸다. 이 사이트의 실제 클릭 상당수가 로고·BI/CI 이미지
// 검색에서 나오는데(네이버 서치어드바이저), sitemap에 이미지가 한 건도 없었다.
function urlset(entries) {
  const hasImages = entries.some(([, , imgs]) => imgs && imgs.length);
  const ns = hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : "";
  const body = entries.map(([loc, lm, imgs]) => {
    const images = (imgs || []).map(({ url, title }) =>
      `\n    <image:image><image:loc>${esc(url)}</image:loc><image:title>${esc(title)}</image:title></image:image>`).join("");
    return `  <url><loc>${loc}</loc><lastmod>${lm}</lastmod>${images}${images ? "\n  " : ""}</url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}>\n${body}\n</urlset>\n`;
}

/** 브랜드 페이지에 실제로 실리는 이미지 — 대표 이미지·로고·BI/CI 앞 2건. */
function brandImages(b) {
  const abs = (src) => {
    const clean = String(src || "").replace(/^\.\.\//, "").replaceAll("\\", "/");
    if (!clean || clean.includes("brand_atlas_logo_mark")) return null;
    // 외부 호스트(위키미디어 등) 이미지는 넣지 않는다. 이미지 sitemap은 소유가
    // 확인된 도메인의 이미지만 유효하고, 남의 도메인 URL을 넣으면 무시된다.
    if (/^https?:\/\//.test(clean)) return clean.startsWith(`${ORIGIN}/`) ? clean : null;
    return `${ORIGIN}/${clean}`;
  };
  const name = displayName(b);
  const out = new Map();
  const push = (src, title) => { const u = abs(src); if (u && !out.has(u)) out.set(u, { url: u, title }); };
  push(b.image, `${name} 브랜드 이미지`);
  push(b.logo, `${name} 로고`);
  for (const item of (Array.isArray(b.logoHistory) ? b.logoHistory : []).slice(0, 2)) {
    push(item && item.src, `${name} ${(item && item.label) || "BI/CI"}`);
  }
  return [...out.values()].slice(0, 4);
}

/** dateModified(신선도 원장)와 sitemap lastmod를 같은 값으로 맞춘다. */
const pageDateLedger = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, "reports", "page-dates.json"), "utf8")).pages || {}; }
  catch { return {}; }
})();

const hubEntries = [
  ["/", "index.html"],
  ["/pages/brands.html", "pages/brands.html"],
  ["/pages/industry.html", "pages/industry.html"],
  ["/pages/insights.html", "pages/insights.html"],
  ["/pages/timeline.html", "pages/timeline.html"],
  ["/pages/bici.html", "pages/bici.html"],
  ["/pages/search.html", "pages/search.html"],
  ...industryGroups.map(([slug]) => [`/category/${slug}.html`, `category/${slug}.html`]),
  ...countryDrafts.map(({ slug }) => [`/country/${slug}.html`, `country/${slug}.html`]),
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
  const led = pageDateLedger[slug];
  return [
    `${ORIGIN}/brand/${encodeURIComponent(slug)}.html`,
    (led && led.modified) || mtime(`brand/${slug}.html`),
    brandImages(b),
  ];
});

const CHUNK = 1000;
const files = [];
writeIfChanged(path.join(ROOT, "sitemap-hubs.xml"), urlset(hubEntries));
files.push("sitemap-hubs.xml");
for (let i = 0; i < brandEntries.length; i += CHUNK) {
  const name = `sitemap-brands-${Math.floor(i / CHUNK) + 1}.xml`;
  writeIfChanged(path.join(ROOT, name), urlset(brandEntries.slice(i, i + CHUNK)));
  files.push(name);
}
// 오래된 단일 sitemap을 남기면 크롤러가 noindex URL을 계속 물고 간다.
for (const stale of fs.readdirSync(ROOT).filter(f => /^sitemap-brands-\d+\.xml$/.test(f))) {
  if (!files.includes(stale)) fs.unlinkSync(path.join(ROOT, stale));
}
const today = kstDay(Date.now());
writeIfChanged(path.join(ROOT, "sitemap.xml"),
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
  writeIfChanged(path.join(ROOT, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
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

// ─── 8) robots.txt — AI 크롤러 명시 ────────────────────────────────────────
// 구글은 llms.txt 같은 AI 전용 파일이 검색 순위·노출에 영향을 주지 않는다고 명시했다.
// 여기서 AI 크롤러를 명시하는 것은 순위 목적이 아니라, 기본 규칙만 있을 때 보수적으로
// 판단하는 크롤러(GPTBot·ClaudeBot·PerplexityBot 등)의 접근을 확실히 열어두기 위한 것이다.
{
  const AI_AGENTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "meta-externalagent"];
  const sitemaps = [`${ORIGIN}/sitemap.xml`, ...files.map(f => `${ORIGIN}/${f}`)];
  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    "# 네이버 Yeti·구글봇은 전체 허용(별도 제한 없음)",
    "User-agent: Yeti",
    "Allow: /",
    "",
    "User-agent: Googlebot",
    "Allow: /",
    "",
    "# AI 검색 크롤러 — 인용 노출을 위해 명시적으로 허용한다",
    ...AI_AGENTS.flatMap(a => [`User-agent: ${a}`, "Allow: /", ""]),
    ...sitemaps.map(u => `Sitemap: ${u}`),
    "",
  ].join("\n");
  writeIfChanged(path.join(ROOT, "robots.txt"), robots);
  console.log(`robots.txt: AI 크롤러 ${AI_AGENTS.length}종 명시, sitemap ${sitemaps.length}건`);
}

// ─── 9) llms.txt ───────────────────────────────────────────────────────────
// 구글 검색에는 영향이 없다(공식 문서). 다른 AI 시스템이 사이트 구조를 파악할 때
// 쓰라고 두는 안내 파일이며, 여기 적는 수치는 전부 실제 집계값이다.
{
  const top = [...indexable]
    .sort((a, b) => (b.displayPriority || 0) - (a.displayPriority || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 60);
  const lines = [
    "# 브랜드 아틀라스 (Brand Atlas)",
    "> 브랜드의 설립 배경, 브랜드 아이덴티티, BI/CI 변천, 제품과 서비스, 현재 상태를 정리한 한국어 브랜드 사전입니다.",
    `> 수록 브랜드 ${total}개, 색인 대상 ${indexable.length}개. 운영 브랜드성장연구소 아키타이포스.`,
    "",
    "## 데이터 원칙",
    "- 브랜드명은 한글과 원어를 함께 표기합니다. 데이터에 없는 표기는 만들지 않습니다.",
    "- 기원 국가·설립연도는 사람이 검수한 정의문에서 확인된 경우에만 표기합니다.",
    `- 위키데이터 개체 연결(sameAs)은 공식 웹사이트 URL 완전 일치로 확인된 ${BRANDS.filter(b => b.entityLinks).length}개 브랜드에만 붙어 있습니다.`,
    "",
    "## 허브",
    `- [전체 브랜드 목록](${ORIGIN}/pages/brands.html): ${total}개 브랜드 색인`,
    `- [산업별 탐색](${ORIGIN}/pages/industry.html): 산업 분류 진입점`,
    `- [브랜드 인사이트](${ORIGIN}/pages/insights.html): 브랜드별 관점 글 모음`,
    `- [타임라인](${ORIGIN}/pages/timeline.html): 연도별 브랜드 사건`,
    `- [BI/CI 아카이브](${ORIGIN}/pages/bici.html): 로고·아이덴티티 변천`,
    "",
    "## 산업 카테고리",
    ...industryGroups.map(([slug, g]) => `- [${g.label}](${ORIGIN}/category/${slug}.html): ${g.items.length}개 브랜드`),
    "",
    "## 기원 국가",
    ...countryDrafts.map(({ c, slug, arr }) => `- [${c}](${ORIGIN}/country/${slug}.html): ${arr.length}개 브랜드`),
    "",
    "## 주요 브랜드",
    ...top.map(b => `- [${displayName(b)}](${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html): ${String(b.definition || b.summary || "").replace(/\s+/g, " ").slice(0, 120)}`),
    "",
    "## 기타",
    `- [RSS](${ORIGIN}/rss.xml): 최근 갱신 100건`,
    `- [사이트맵](${ORIGIN}/sitemap.xml)`,
    "",
  ];
  writeIfChanged(path.join(ROOT, "llms.txt"), lines.join("\n"));
  console.log(`llms.txt: 허브 ${industryGroups.length + countryDrafts.length}건 + 주요 브랜드 ${top.length}건`);
}

console.log(`\ncssV=${CSS_V} — styles.css 캐시버스터 확인 필요`);
