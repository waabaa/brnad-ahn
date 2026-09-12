// 허브·홈·사이트맵·RSS·robots·llms.txt·검색 인덱스 빌더 (build-brand-pages.mjs 다음에 실행).
//
// 모든 허브는 완결된 정적 HTML이다 — 네이버 Yeti는 JS를 실행하지 않는다(2026-08 감사).
// 산출물:
//   category/<slug>.html   산업 허브 12    country/<slug>.html   국가 허브(본문 700자 이상만)
//   pages/ganada.html      가나다·ABC 색인  pages/countries.html  국가 허브 목록
//   pages/brands.html      전체 목록        pages/directory.html  디렉토리 등급(noindex)
//   pages/industry.html    산업 카드        pages/bici.html       로고 아카이브(로고 월)
//   pages/timeline.html    연대별 연혁      pages/insights.html   브랜드 관점
//   pages/about|privacy|contact.html        index.html
//   data/search-index.json 슬림 검색 인덱스(초성 포함)
//   sitemap*.xml rss.xml robots.txt llms.txt
//
// 디렉토리 등급(한글 표기·로고 모두 없음)은 목록·홈·llms에서 제외하고 pages/directory.html
// 과 카테고리 하단 접힘 목록에서만 링크한다. 색인 여부는 등급이 아니라 본문 분량으로
// 가른다(archive.mjs isNoindex) — 본문이 충실한 항목은 sitemap에 남는다.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ORIGIN, CSS_V, urlSlugOf, countryOf, foundedYear, displayName, koreanName, latinName, bodyTextLength } from "./lib/brand-seo.mjs";
import { esc, page, collectionJsonLd, breadcrumbs, header, footer } from "./lib/page-shell.mjs";
import { isListed, isDirectory, byScore, hasLogo, hasKoreanName, groupByIndex, chosungString, indexKey, GANADA_KEYS, ALPHA_KEYS, archiveTier } from "./lib/archive.mjs";
import { tile, tiles, nameList, nameItem, oneLine, brandHref, assetHref, logoImg } from "./lib/markup.mjs";
import { COLLECTIONS, collectionsOf, publishedCollections } from "./lib/collections.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const BRANDS = DATA.allBrands || [];
const LISTED = BRANDS.filter(isListed);
const DIRECTORY = BRANDS.filter(isDirectory);
const total = BRANDS.length;
const listedTotal = LISTED.length;
const byName = (a, b) => String(koreanName(a) || a.name).localeCompare(String(koreanName(b) || b.name), "ko");
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const TODAY = kstDay(Date.now());

function writeIfChanged(p, content) {
  try { if (fs.readFileSync(p, "utf8") === content) return false; } catch { /* new */ }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return true;
}
const P = "../";
const crumbsHub = (name) => breadcrumbs([{ name: "브랜드 사전", href: `${P}index.html` }, { name }]);
const hubHead = (kicker, h1, lead, extra = "") => `<div class="page-head"><div class="wrap">${extra}${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ""}<h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}</div></div>`;

/** 집계 문장 — 전부 수록 데이터를 센 값. */
function hubFacts(items) {
  const out = [];
  const years = items.map(foundedYear).filter(Boolean);
  if (years.length >= 3) {
    const era = { "1900년 이전": 0, "1900~1949년": 0, "1950~1999년": 0, "2000년 이후": 0 };
    for (const y of years) { if (y < 1900) era["1900년 이전"]++; else if (y < 1950) era["1900~1949년"]++; else if (y < 2000) era["1950~1999년"]++; else era["2000년 이후"]++; }
    const min = Math.min(...years), max = Math.max(...years);
    out.push(`설립연도가 확인된 브랜드는 ${years.length}개이며 가장 오래된 곳은 ${min}년, 가장 최근은 ${max}년에 시작했습니다. 시기별로는 ${Object.entries(era).filter(([, n]) => n).map(([k, n]) => `${k} ${n}개`).join(", ")}입니다.`);
  }
  const withLogo = items.filter(hasLogo).length;
  const withBici = items.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1).length;
  const withTimeline = items.filter(b => Array.isArray(b.timeline) && b.timeline.length).length;
  const assets = [];
  if (withLogo) assets.push(`로고 이미지 ${withLogo}개`);
  if (withBici) assets.push(`로고 변천 자료 ${withBici}개`);
  if (withTimeline) assets.push(`연혁 타임라인 ${withTimeline}개`);
  if (assets.length) out.push(`수록 자료로는 ${assets.join(", ")}를 갖췄습니다.`);
  const withEntity = items.filter(b => b.entityLinks && b.entityLinks.wikidata).length;
  if (withEntity) out.push(`이 가운데 ${withEntity}개는 공식 웹사이트가 일치하는 위키데이터 개체로 연결해 두었습니다.`);
  return out;
}

/** 허브 본문 공용: 상위 타일 + 나머지 이름 목록 (+ 디렉토리 접힘). */
function hubListing(items, { tileCount = 48, directoryItems = [], prefix = P } = {}) {
  const sorted = [...items].sort(byScore);
  const top = sorted.slice(0, tileCount);
  const rest = sorted.slice(tileCount).sort(byName);
  let html = tiles(top, prefix, { sub: "origin", size: "", desc: true });
  if (rest.length) html += `<h2 class="sr-only">전체 목록</h2><div style="margin-top:26px">${nameList(rest, prefix, { desc: true })}</div>`;
  if (directoryItems.length) {
    html += `<details class="fold"><summary>디렉토리 등급 항목 ${directoryItems.length}개 (한글 표기·로고 미확인)</summary>${nameList([...directoryItems].sort(byName), prefix)}</details>`;
  }
  return html;
}

// ─── 1) 산업 카테고리 허브 ─────────────────────────────────────────────────
const INDUSTRY_DESC = Object.fromEntries((DATA.industries || []).map(i => [i.id, i.description || ""]));
const byIndustry = new Map();
for (const b of BRANDS) {
  const key = b.domainSlug || "etc";
  if (!byIndustry.has(key)) byIndustry.set(key, { label: b.industry || "기타", items: [], directory: [] });
  (isListed(b) ? byIndustry.get(key).items : byIndustry.get(key).directory).push(b);
}
// 산업 순서는 수록 수 내림차순이되, pinned 산업(data.industries[].pinned — 현재 AI)은 맨 앞에 둔다.
const PINNED = new Set((DATA.industries || []).filter(i => i.pinned).map(i => i.id));
const industryGroups = [...byIndustry.entries()].sort((a, b) => (PINNED.has(b[0]) - PINNED.has(a[0])) || (b[1].items.length - a[1].items.length));
const categoryChips = (current) => `<nav class="chips" aria-label="다른 산업">${industryGroups.map(([slug, g]) => `<a class="chip${slug === current ? " active" : ""}" href="${P}category/${slug}.html">${esc(g.label)} <small>${g.items.length}</small></a>`).join("")}</nav>`;

for (const [slug, g] of industryGroups) {
  const url = `${ORIGIN}/category/${slug}.html`;
  const withCountry = g.items.filter(b => countryOf(b));
  const tally = new Map();
  for (const b of withCountry) tally.set(countryOf(b), (tally.get(countryOf(b)) || 0) + 1);
  const topCountries = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lead = `${INDUSTRY_DESC[slug] ? `${INDUSTRY_DESC[slug]} ` : ""}브랜드 아틀라스에 수록된 ${g.label} 브랜드 ${g.items.length}개를 로고와 함께 모았습니다. 각 항목은 설립 배경, 브랜드 아이덴티티, 로고 변천, 제품과 서비스, 현재 상태를 정리한 상세 페이지로 이어집니다.`;
  const facts = [];
  if (topCountries.length) facts.push(`기원 국가가 확인된 브랜드는 ${withCountry.length}개이며 ${topCountries.map(([c, n]) => `${c} ${n}개`).join(", ")} 순으로 많습니다.`);
  facts.push(...hubFacts(g.items));
  const title = `${g.label} 브랜드 ${g.items.length}개 — 로고·역사·설립 정보 | 브랜드 아틀라스`;
  const desc = `${g.label} 브랜드 ${g.items.length}개를 로고와 함께 정리한 목록. ${topCountries.length ? `${topCountries.map(([c]) => c).join("·")} 등 ` : ""}각 브랜드의 설립 배경과 아이덴티티, 로고 변천사를 확인할 수 있습니다.`;
  const body = `${hubHead("산업별 브랜드", `${esc(g.label)} 브랜드 <span class="en count">${g.items.length}</span>`, esc(lead), crumbsHub(g.label))}
<div class="wrap section"><div class="section-head"><h2>다른 산업 보기</h2></div>${categoryChips(slug)}<p class="hub-note" style="margin-top:22px">${esc(facts.join(" "))}</p></div>
<div class="wrap section" id="cat-${slug}"><div class="section-head"><h2>${esc(g.label)} 브랜드 목록</h2><p>품질 점수 순 상위는 로고 타일로, 나머지는 가나다순 목록으로 보입니다.</p></div>${hubListing(g.items, { directoryItems: g.directory })}</div>`;
  writeIfChanged(path.join(ROOT, "category", `${slug}.html`), page({
    title, desc, canonical: url, bodyHtml: body, active: "industry",
    jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "산업별", url: `${ORIGIN}/pages/industry.html` }, { name: g.label, url }], items: [...g.items].sort(byScore).slice(0, 100).map(b => ({ name: displayName(b), url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) }),
  }));
}
console.log(`category/: ${industryGroups.length} pages, ${LISTED.length} listed + ${DIRECTORY.length} directory`);

// ─── 2) 국가 허브 ──────────────────────────────────────────────────────────
const COUNTRY_SLUG = { 미국: "usa", 한국: "korea", 독일: "germany", 영국: "uk", 프랑스: "france", 일본: "japan", 이탈리아: "italy", 네덜란드: "netherlands", 스웨덴: "sweden", 스위스: "switzerland", 캐나다: "canada", 스페인: "spain", 호주: "australia", 뉴질랜드: "new-zealand", 노르웨이: "norway", 핀란드: "finland", 덴마크: "denmark", 벨기에: "belgium", 오스트리아: "austria", 러시아: "russia", 중국: "china", 폴란드: "poland", 대만: "taiwan", 브라질: "brazil", 아이슬란드: "iceland", 자메이카: "jamaica", 그리스: "greece", 포르투갈: "portugal", 홍콩: "hong-kong", 터키: "turkey", 남아프리카공화국: "south-africa", 인도: "india", 멕시코: "mexico", 아일랜드: "ireland", 싱가포르: "singapore", 태국: "thailand", 베트남: "vietnam", 체코: "czech", 헝가리: "hungary", 이스라엘: "israel", 칠레: "chile", 아르헨티나: "argentina", 말레이시아: "malaysia", 인도네시아: "indonesia", 필리핀: "philippines", 우크라이나: "ukraine" };
const MIN_COUNTRY_BRANDS = 5;
const HUB_MIN_PROSE = 700;
const byCountry = new Map();
for (const b of LISTED) {
  const c = countryOf(b);
  if (!c || !COUNTRY_SLUG[c]) continue;
  if (!byCountry.has(c)) byCountry.set(c, []);
  byCountry.get(c).push(b);
}
const countryGroups = [...byCountry.entries()].filter(([, arr]) => arr.length >= MIN_COUNTRY_BRANDS).sort((a, b) => b[1].length - a[1].length);
const prosePreview = (html) => html.replace(/<nav[\s\S]*?<\/nav>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
const countryDrafts = [];
for (const [c, arr] of countryGroups) {
  const slug = COUNTRY_SLUG[c];
  const indTally = new Map();
  for (const b of arr) indTally.set(b.industry, (indTally.get(b.industry) || 0) + 1);
  const topInd = [...indTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const lead = `${c}에서 시작한 브랜드 ${arr.length}개를 로고와 함께 모았습니다. 수록 기준은 검수된 브랜드 설명이나 공식 웹사이트가 일치하는 위키데이터 개체에서 기원 국가가 확인된 경우로 한정했습니다.`;
  const facts = [];
  if (topInd.length) facts.push(`산업별로는 ${topInd.map(([i, n]) => `${i} ${n}개`).join(", ")} 순입니다.`);
  facts.push(...hubFacts(arr));
  const head = hubHead("국가별 브랜드", `${esc(c)} 브랜드 <span class="en count">${arr.length}</span>`, esc(lead), crumbsHub(`${c} 브랜드`));
  const rest = `<div class="wrap section"><p class="hub-note">${esc(facts.join(" "))}</p></div><div class="wrap section" id="country-${slug}"><div class="section-head"><h2>${esc(c)} 브랜드 목록</h2></div>${hubListing(arr)}</div>`;
  const prose = prosePreview(head + rest);
  if (prose < HUB_MIN_PROSE) {
    console.log(`  country/${slug}: 본문 ${prose}자 < ${HUB_MIN_PROSE} — 발행 생략`);
    const stale = path.join(ROOT, "country", `${slug}.html`);
    if (fs.existsSync(stale)) fs.unlinkSync(stale);
    continue;
  }
  countryDrafts.push({ c, slug, arr, topInd, head, rest });
}
const countryChips = (current) => `<nav class="chips" aria-label="다른 국가">${countryDrafts.map(({ c, slug, arr }) => `<a class="chip${slug === current ? " active" : ""}" href="${P}country/${slug}.html">${esc(c)} <small>${arr.length}</small></a>`).join("")}</nav>`;
for (const { c, slug, arr, topInd, head, rest } of countryDrafts) {
  const url = `${ORIGIN}/country/${slug}.html`;
  const title = `${c} 브랜드 ${arr.length}개 — 로고·설립 역사 | 브랜드 아틀라스`;
  const desc = `${c}에서 시작한 브랜드 ${arr.length}개 목록. ${topInd.map(([i]) => i).join("·")} 등 각 브랜드의 로고와 설립 배경, 아이덴티티, 로고 변천사를 정리했습니다.`;
  const body = `${head}<div class="wrap section"><div class="section-head"><h2>다른 국가 보기</h2><a class="more" href="${P}pages/countries.html">국가별 전체 →</a></div>${countryChips(slug)}</div>${rest}`;
  writeIfChanged(path.join(ROOT, "country", `${slug}.html`), page({
    title, desc, canonical: url, bodyHtml: body, active: "countries",
    jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "국가별", url: `${ORIGIN}/pages/countries.html` }, { name: c, url }], items: [...arr].sort(byScore).slice(0, 100).map(b => ({ name: displayName(b), url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) }),
  }));
}
// 살아남지 못한 국가 파일 정리
for (const f of fs.existsSync(path.join(ROOT, "country")) ? fs.readdirSync(path.join(ROOT, "country")) : []) {
  if (f.endsWith(".html") && !countryDrafts.some(d => `${d.slug}.html` === f)) fs.unlinkSync(path.join(ROOT, "country", f));
}
console.log(`country/: ${countryDrafts.length} pages (얇아서 생략 ${countryGroups.length - countryDrafts.length})`);

// pages/countries.html — 국가 허브 목록
{
  const url = `${ORIGIN}/pages/countries.html`;
  const cards = countryDrafts.map(({ c, slug, arr }) => {
    const top = [...arr].sort(byScore).slice(0, 5);
    return `<a class="cat-card" href="${P}country/${slug}.html"><span class="head"><b>${esc(c)}</b><span class="n">${arr.length}개 브랜드</span></span><p>${esc(top.map(b => koreanName(b) || latinName(b) || b.name).join(" · "))}</p><span class="logos">${top.map(b => `<span>${hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="" loading="lazy" decoding="async">` : ""}</span>`).join("")}</span></a>`;
  }).join("");
  const rest = countryGroups.filter(([c]) => !countryDrafts.some(d => d.c === c));
  const restNote = rest.length ? `<p class="hub-note" style="margin-top:22px">브랜드 수가 적어 별도 허브를 두지 않은 국가: ${esc(rest.map(([c, arr]) => `${c} ${arr.length}개`).join(", "))}. 해당 브랜드는 산업 카테고리에서 찾을 수 있습니다.</p>` : "";
  const title = `국가별 브랜드 — ${countryDrafts.length}개국 ${countryDrafts.reduce((s, d) => s + d.arr.length, 0)}개 브랜드 | 브랜드 아틀라스`;
  const desc = `기원 국가가 확인된 브랜드를 국가별로 모았습니다. ${countryDrafts.slice(0, 6).map(d => `${d.c} ${d.arr.length}개`).join(", ")} 등 ${countryDrafts.length}개국.`;
  const body = `${hubHead("국가별 브랜드", "국가별 브랜드", esc(`기원 국가가 확인된 브랜드만 국가 허브에 넣습니다. 검수된 브랜드 설명, 또는 공식 웹사이트가 일치하는 위키데이터 개체에서 확인된 값만 근거로 씁니다. 현 소유주 국적은 기원 국가가 아니므로 쓰지 않습니다.`), crumbsHub("국가별"))}<div class="wrap section"><div class="cat-grid">${cards}</div>${restNote}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "countries.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "countries", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "국가별", url }] }) }));
}

// ─── 2-b) 컬렉션(테마) 허브 ────────────────────────────────────────────────
// 편입은 scripts/assign-collections.mjs 가 Wikidata 분류·수동 확인 목록으로 정한다(brand.collections).
const COLLECTION_HUBS = publishedCollections(BRANDS, isListed);
const collectionDrafts = COLLECTIONS.filter(c => COLLECTION_HUBS.has(c.slug)).map(c => ({ c, arr: LISTED.filter(b => collectionsOf(b).includes(c.slug)) }));
const collectionChips = (current) => `<nav class="chips" aria-label="다른 컬렉션">${collectionDrafts.map(({ c, arr }) => `<a class="chip${c.slug === current ? " active" : ""}" href="${P}collection/${c.slug}.html">${esc(c.name)} <small>${arr.length}</small></a>`).join("")}</nav>`;
for (const { c, arr } of collectionDrafts) {
  const url = `${ORIGIN}/collection/${c.slug}.html`;
  const indTally = new Map();
  for (const b of arr) indTally.set(b.industry, (indTally.get(b.industry) || 0) + 1);
  const topInd = [...indTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const cTally = new Map();
  for (const b of arr) { const k = countryOf(b); if (k) cTally.set(k, (cTally.get(k) || 0) + 1); }
  const topC = [...cTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const facts = [];
  if (topC.length) facts.push(`기원 국가가 확인된 브랜드는 ${arr.filter(b => countryOf(b)).length}개이며 ${topC.map(([k, n]) => `${k} ${n}개`).join(", ")} 순으로 많습니다.`);
  if (topInd.length > 1) facts.push(`산업 분류로는 ${topInd.map(([i, n]) => `${i} ${n}개`).join(", ")}에 걸쳐 있습니다.`);
  facts.push(...hubFacts(arr));
  const lead = `${c.lead} 브랜드 아틀라스에 수록된 ${c.name} ${arr.length}개를 로고와 함께 정리했습니다. 편입 기준은 위키데이터의 분류와 업종 정보, 그리고 편집자가 브랜드 설명을 확인한 경우로 한정했습니다.`;
  const title = `${c.name} ${arr.length}개 — 로고·역사·아이덴티티 | 브랜드 아틀라스`;
  const desc = `${c.name}(${c.en}) ${arr.length}개를 로고와 함께 모은 컬렉션. ${[...arr].sort(byScore).slice(0, 4).map(b => koreanName(b) || latinName(b) || b.name).join("·")} 등 각 브랜드의 설립 배경과 아이덴티티, 로고 변천을 정리했습니다.`;
  const body = `${hubHead("컬렉션", `${esc(c.name)} <span class="en count">${arr.length}</span>`, esc(lead), crumbsHub(c.name))}
<div class="wrap section"><div class="section-head"><h2>다른 컬렉션 보기</h2><a class="more" href="${P}pages/collections.html">컬렉션 전체 →</a></div>${collectionChips(c.slug)}<p class="hub-note" style="margin-top:22px">${esc(facts.join(" "))}</p></div>
<div class="wrap section" id="collection-${c.slug}"><div class="section-head"><h2>${esc(c.name)} 목록</h2><p>품질 점수 순 상위는 로고 타일로, 나머지는 가나다순 목록으로 보입니다.</p></div>${hubListing(arr)}</div>`;
  if (prosePreview(body) < HUB_MIN_PROSE) console.warn(`  collection/${c.slug}: 본문 ${prosePreview(body)}자 < ${HUB_MIN_PROSE}`);
  writeIfChanged(path.join(ROOT, "collection", `${c.slug}.html`), page({
    title, desc, canonical: url, bodyHtml: body, active: "collections",
    jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "컬렉션", url: `${ORIGIN}/pages/collections.html` }, { name: c.name, url }], items: [...arr].sort(byScore).slice(0, 100).map(b => ({ name: displayName(b), url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) }),
  }));
}
for (const f of fs.existsSync(path.join(ROOT, "collection")) ? fs.readdirSync(path.join(ROOT, "collection")) : []) {
  if (f.endsWith(".html") && !collectionDrafts.some(d => `${d.c.slug}.html` === f)) fs.unlinkSync(path.join(ROOT, "collection", f));
}
console.log(`collection/: ${collectionDrafts.length} pages (${collectionDrafts.map(d => `${d.c.slug} ${d.arr.length}`).join(", ")})`);

// pages/collections.html — 컬렉션 목록
{
  const url = `${ORIGIN}/pages/collections.html`;
  const cards = collectionDrafts.map(({ c, arr }) => {
    const top = [...arr].sort(byScore).slice(0, 5);
    return `<a class="cat-card" href="${P}collection/${c.slug}.html"><span class="head"><b>${esc(c.name)}</b><span class="n">${arr.length}개 브랜드</span></span><p>${esc(top.map(b => koreanName(b) || latinName(b) || b.name).join(" · "))}</p><span class="logos">${top.map(b => `<span>${hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="" loading="lazy" decoding="async">` : ""}</span>`).join("")}</span></a>`;
  }).join("");
  const title = `브랜드 컬렉션 ${collectionDrafts.length}개 — AI·핀테크·항공사·박물관 등 테마별 | 브랜드 아틀라스`;
  const desc = `산업 분류와 별도로 AI 브랜드, 핀테크·결제, 은행, 에너지, 항공사, 박물관·미술관, 패스트푸드, 카페 등 테마별로 브랜드를 모은 컬렉션 ${collectionDrafts.length}개입니다.`;
  const lead = "산업 분류가 브랜드가 무엇을 파는지로 나눈다면, 컬렉션은 같은 관점에서 함께 볼 만한 브랜드를 묶습니다. 한 브랜드가 여러 컬렉션에 들어갈 수 있고, 편입 기준은 위키데이터 분류와 편집자 확인으로 한정했습니다.";
  const body = `${hubHead("컬렉션", `테마별 브랜드 컬렉션 <span class="en count">${collectionDrafts.length}</span>`, esc(lead), crumbsHub("컬렉션"))}<div class="wrap section"><div class="cat-grid">${cards}</div></div>`;
  writeIfChanged(path.join(ROOT, "pages", "collections.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "collections", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "컬렉션", url }] }) }));
}

// ─── 3) 가나다·ABC 색인 ───────────────────────────────────────────────────
const indexGroups = groupByIndex(LISTED);
const indexNav = (current = "", prefix = P) => `<nav class="index-nav" aria-label="색인">${[...GANADA_KEYS, ...ALPHA_KEYS, "0-9", "기타"].filter(k => indexGroups.some(([g]) => g === k)).map(k => { const n = indexGroups.find(([g]) => g === k)[1].length; return `<a class="${k === current ? "on" : ""}" href="${prefix}pages/ganada.html#idx-${encodeURIComponent(k)}">${esc(k)}<small>${n}</small></a>`; }).join("")}</nav>`;
{
  const url = `${ORIGIN}/pages/ganada.html`;
  const groups = indexGroups.map(([k, arr]) => `<section class="group" id="idx-${esc(k)}"><h2>${esc(k)} <small>${arr.length}개</small></h2>${nameList(arr)}</section>`).join("");
  const title = `브랜드 사전 가나다·ABC 색인 — ${listedTotal}개 브랜드 | 브랜드 아틀라스`;
  const desc = `브랜드 아틀라스에 수록된 브랜드 ${listedTotal}개를 한글 가나다순과 알파벳순으로 찾아보는 색인. 한글 표기와 원어 표기를 함께 적어 어느 쪽으로도 찾을 수 있습니다.`;
  const body = `${hubHead("브랜드 사전", `가나다 · ABC 색인 <span class="en count">${listedTotal}</span>`, esc("한글 표기가 있는 브랜드는 첫 글자의 초성으로, 원어만 있는 브랜드는 알파벳으로 묶었습니다. 된소리(ㄲ·ㄸ·ㅃ·ㅆ·ㅉ)는 사전 관행대로 예사소리에 합쳤습니다."), crumbsHub("가나다 색인"))}<div class="wrap">${indexNav()}${groups}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "ganada.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "ganada", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "가나다 색인", url }] }) }));
  console.log(`pages/ganada.html: ${indexGroups.length} groups`);
}

// ─── 4) 전체 목록 / 디렉토리 ─────────────────────────────────────────────
{
  const url = `${ORIGIN}/pages/brands.html`;
  const sections = industryGroups.map(([slug, g]) => `<section class="group" id="ind-${slug}"><h2><a href="${P}category/${slug}.html">${esc(g.label)}</a> <small>${g.items.length}개</small></h2>${nameList([...g.items].sort(byName))}</section>`).join("");
  const title = `전체 브랜드 목록 ${listedTotal}개 — 산업별 브랜드 사전 | 브랜드 아틀라스`;
  const desc = `브랜드 아틀라스에 수록된 ${listedTotal}개 브랜드를 산업별로 정리한 전체 목록. 각 브랜드의 로고·설립 역사·아이덴티티·제품·현재 상태를 확인할 수 있습니다.`;
  const body = `${hubHead("전체 목록", `전체 브랜드 목록 <span class="en count">${listedTotal}</span>`, esc(`산업 ${industryGroups.length}개 분류로 정리했습니다. 한글 표기와 로고가 모두 확인되지 않은 ${DIRECTORY.length}개 항목은 디렉토리 등급으로 분리해 별도 목록에 두었습니다.`), crumbsHub("전체 브랜드"))}<div class="wrap section" style="padding-bottom:0">${categoryChips("")}<p class="hub-note" style="margin-top:16px"><a class="more" href="${P}pages/ganada.html">가나다 · ABC 색인으로 보기 →</a> &nbsp; <a class="more" href="${P}pages/directory.html">디렉토리 등급 ${DIRECTORY.length}개 →</a></p></div><div class="wrap">${sections}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "brands.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "ganada", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "전체 브랜드", url }] }) }));

  const durl = `${ORIGIN}/pages/directory.html`;
  const dsections = industryGroups.filter(([, g]) => g.directory.length).map(([slug, g]) => `<section class="group"><h2><a href="${P}category/${slug}.html">${esc(g.label)}</a> <small>${g.directory.length}개</small></h2>${nameList([...g.directory].sort(byName))}</section>`).join("");
  const dbody = `${hubHead("디렉토리", `디렉토리 등급 항목 <span class="en count">${DIRECTORY.length}</span>`, esc("한글 표기와 로고가 아직 확인되지 않은 항목입니다. 수록 자료를 그대로 옮긴 페이지이며 목록과 홈에는 올리지 않습니다. 본문이 얇은 항목은 검색 색인에서도 제외됩니다. 한글 표기나 로고가 확인되면 자동으로 본 목록으로 올라갑니다."), crumbsHub("디렉토리"))}<div class="wrap">${dsections}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "directory.html"), page({ title: `디렉토리 등급 항목 ${DIRECTORY.length}개 | 브랜드 아틀라스`, desc: "한글 표기·로고가 미확인인 수록 항목 목록.", canonical: durl, bodyHtml: dbody, active: "ganada", robots: "noindex,follow" }));
  console.log(`pages/brands.html: ${listedTotal} / pages/directory.html: ${DIRECTORY.length}`);
}

// ─── 5) 산업별 카드 페이지 ────────────────────────────────────────────────
// pinned 산업(AI)은 줄 전체를 차지하는 카드로 맨 앞에 둔다 — 13개가 4·3·2열 어디서나 1 + 12로 딱 맞는다.
// 스타일은 인라인으로 둔다(styles.css 를 바꾸면 CSS_V 를 올려 전 페이지를 다시 써야 한다).
function catCard(slug, g, prefix = P) {
  const pinned = PINNED.has(slug);
  const top = [...g.items].sort(byScore).filter(b => !pinned || hasLogo(b)).slice(0, pinned ? 10 : 5);
  return `<a class="cat-card" href="${prefix}category/${slug}.html"${pinned ? ` style="grid-column:1/-1"` : ""}><span class="head"><b>${esc(g.label)}</b><span class="n">${g.items.length}개</span></span><p>${esc(pinned ? (INDUSTRY_DESC[slug] || "") : oneLineIndustry(slug))}</p><span class="logos"${pinned ? ` style="grid-template-columns:repeat(auto-fill,minmax(52px,1fr))"` : ""}>${top.map(b => `<span>${hasLogo(b) ? `<img src="${assetHref(b.logo, prefix)}" alt="" loading="lazy" decoding="async">` : ""}</span>`).join("")}</span></a>`;
}
function oneLineIndustry(slug) { return (INDUSTRY_DESC[slug] || "").replace(/\s+/g, " ").slice(0, 70); }
{
  const url = `${ORIGIN}/pages/industry.html`;
  const cards = industryGroups.map(([slug, g]) => catCard(slug, g)).join("");
  const blocks = industryGroups.map(([slug, g]) => `<section class="group" id="ind-${slug}"><div class="section-head"><h2><a href="${P}category/${slug}.html">${esc(g.label)}</a> <small>${g.items.length}개</small></h2><a class="more" href="${P}category/${slug}.html">${esc(g.label)} 전체 보기 →</a></div>${tiles([...g.items].sort(byScore).slice(0, 12), P, { sub: "origin", size: "sm" })}</section>`).join("");
  const title = `산업별 브랜드 탐색 — ${industryGroups.length}개 산업 ${listedTotal}개 브랜드 | 브랜드 아틀라스`;
  const desc = `${industryGroups.map(([, g]) => g.label).join("·")} 등 ${industryGroups.length}개 산업으로 브랜드 ${listedTotal}개를 분류했습니다. 산업별 대표 브랜드의 로고와 설립 정보를 한눈에 봅니다.`;
  const body = `${hubHead("산업별 브랜드", "산업별로 찾는 브랜드", esc(`브랜드가 실제로 경쟁하는 시장을 기준으로 ${industryGroups.length}개 산업으로 나눴습니다. 카드를 누르면 해당 산업의 전체 브랜드 목록으로 이동합니다.`), crumbsHub("산업별"))}<div class="wrap section"><div class="cat-grid">${cards}</div></div><div class="wrap">${blocks}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "industry.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "industry", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "산업별", url }] }) }));
}

// ─── 6) 로고 아카이브(로고 월) ───────────────────────────────────────────
{
  const url = `${ORIGIN}/pages/bici.html`;
  const withLogo = LISTED.filter(hasLogo);
  const withHist = withLogo.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1);
  const blocks = industryGroups.map(([slug, g]) => {
    const arr = g.items.filter(hasLogo).sort(byScore);
    if (!arr.length) return "";
    return `<section class="group" id="logo-${slug}"><div class="section-head"><h2>${esc(g.label)} <small>${arr.length}개</small></h2><a class="more" href="${P}category/${slug}.html">산업 허브 →</a></div>${tiles(arr, P, { sub: "none", size: "sm" })}</section>`;
  }).join("");
  const title = `브랜드 로고 아카이브 — ${withLogo.length}개 로고·BI/CI 변천 | 브랜드 아틀라스`;
  const desc = `${withLogo.length}개 브랜드의 로고를 산업별로 모은 로고 아카이브. 이 가운데 ${withHist.length}개는 로고 변천사(BI/CI 아카이브)를 함께 수록했습니다.`;
  const body = `${hubHead("로고 아카이브", `브랜드 로고 아카이브 <span class="en count">${withLogo.length}</span>`, esc(`로고가 확인된 브랜드 ${withLogo.length}개를 산업별로 모았습니다. ${withHist.length}개 브랜드는 상세 페이지에 로고 변천사를 함께 실었습니다. 로고·상표의 권리는 각 브랜드 소유자에게 있으며, 아카이브는 식별과 학습 목적의 자료입니다.`), crumbsHub("로고 아카이브"))}<div class="wrap section" style="padding-bottom:0"><nav class="chips" aria-label="산업 바로가기">${industryGroups.map(([slug, g]) => `<a class="chip" href="#logo-${slug}">${esc(g.label)} <small>${g.items.filter(hasLogo).length}</small></a>`).join("")}</nav></div><div class="wrap">${blocks}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "bici.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "bici", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "로고 아카이브", url }] }) }));
  console.log(`pages/bici.html: ${withLogo.length} logos`);
}

// ─── 7) 타임라인 ─────────────────────────────────────────────────────────
{
  const url = `${ORIGIN}/pages/timeline.html`;
  const dated = LISTED.map(b => ({ b, y: foundedYear(b) })).filter(x => x.y).sort((a, b) => a.y - b.y || byName(a.b, b.b));
  const decades = new Map();
  for (const { b, y } of dated) { const d = Math.floor(y / 10) * 10; if (!decades.has(d)) decades.set(d, []); decades.get(d).push({ b, y }); }
  const list = [...decades.entries()].sort((a, b) => a[0] - b[0]);
  const nav = `<nav class="index-nav" aria-label="연대">${list.map(([d, rows]) => `<a href="#y-${d}">${d}s<small>${rows.length}</small></a>`).join("")}</nav>`;
  const blocks = list.map(([d, rows]) => `<section class="group" id="y-${d}"><h2>${d}년대 <small>${rows.length}개</small></h2><div class="name-list">${rows.map(({ b, y }) => nameItem(b).replace("<span>", `<span><b class="count" style="margin-right:8px;color:var(--red)">${y}</b>`)).join("")}</div></section>`).join("");
  const title = `브랜드 타임라인 — 설립연도로 보는 ${dated.length}개 브랜드 | 브랜드 아틀라스`;
  const desc = `설립연도가 확인된 브랜드 ${dated.length}개를 연대별로 정리한 타임라인. ${list[0] ? `${list[0][0]}년대부터 ${list[list.length - 1][0]}년대까지` : ""} 브랜드의 시작을 시간축으로 읽습니다.`;
  const body = `${hubHead("타임라인", `브랜드 타임라인 <span class="en count">${dated.length}</span>`, esc("설립연도는 검수된 브랜드 설명이나 공식 웹사이트가 일치하는 위키데이터 개체에서 확인된 값만 씁니다. 모기업 창업연도가 섞이지 않도록 원본의 연도 필드는 쓰지 않습니다."), crumbsHub("타임라인"))}<div class="wrap">${nav}${blocks}</div>`;
  writeIfChanged(path.join(ROOT, "pages", "timeline.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "timeline", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "타임라인", url }] }) }));
  console.log(`pages/timeline.html: ${dated.length} dated brands`);
}

// ─── 8) 인사이트 ─────────────────────────────────────────────────────────
{
  const url = `${ORIGIN}/pages/insights.html`;
  const withInsight = LISTED.filter(b => String(b.insight || "").trim().length >= 30).sort(byScore).slice(0, 300);
  const entries = withInsight.map(b => `<a class="recent" style="display:flex" href="${brandHref(b)}">${hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="" loading="lazy" decoding="async">` : `<span class="none"></span>`}<span><b>${esc(displayName(b))}</b><small>${esc(String(b.insight).replace(/\s+/g, " ").slice(0, 140))}</small></span></a>`).join("");
  const title = `브랜드 인사이트 — ${withInsight.length}개 브랜드의 관점 | 브랜드 아틀라스`;
  const desc = `브랜드마다 한 줄로 정리한 관점(인사이트) ${withInsight.length}개. 각 브랜드가 시장에서 어떤 위치와 태도를 취하는지 요약합니다.`;
  const body = `${hubHead("인사이트", `브랜드 인사이트 <span class="en count">${withInsight.length}</span>`, esc("각 브랜드 페이지의 '어떻게 봐야 할까' 절을 한 줄로 요약한 관점 모음입니다. 항목을 누르면 브랜드 상세로 이동합니다."), crumbsHub("인사이트"))}<div class="wrap section"><div class="recent" style="grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr))">${entries}</div></div>`;
  writeIfChanged(path.join(ROOT, "pages", "insights.html"), page({ title, desc, canonical: url, bodyHtml: body, active: "insights", jsonLd: collectionJsonLd({ name: title, description: desc, url, crumbs: [{ name: "브랜드 사전", url: `${ORIGIN}/` }, { name: "인사이트", url }] }) }));
  console.log(`pages/insights.html: ${withInsight.length} entries`);
}

// ─── 9) 소개·개인정보·문의 ───────────────────────────────────────────────
{
  const stats = {
    total: listedTotal, logos: LISTED.filter(hasLogo).length, ko: LISTED.filter(hasKoreanName).length,
    entity: BRANDS.filter(b => b.entityLinks && b.entityLinks.wikidata).length,
    country: LISTED.filter(b => countryOf(b)).length, year: LISTED.filter(b => foundedYear(b)).length,
    bici: LISTED.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1).length,
  };
  const about = `${hubHead("소개", "브랜드 아틀라스 소개", esc("브랜드 아틀라스는 브랜드의 역사·아이덴티티·로고 변천을 한글로 정리한 브랜드 사전입니다. 브랜드성장연구소 아키타이포스가 운영합니다."), crumbsHub("소개"))}<div class="wrap"><article class="doc">
<h2>무엇을 모으나</h2><p>브랜드 이름의 한글·원어 표기, 정의, 시작과 성장, 브랜드 아이덴티티, 대표 제품과 서비스, 현재 상태, 연혁, 로고 변천사를 브랜드마다 한 페이지에 정리합니다. 현재 ${stats.total}개 브랜드를 수록하고 있으며 이 가운데 ${stats.logos}개는 로고 이미지, ${stats.bici}개는 로고 변천 자료, ${stats.country}개는 기원 국가, ${stats.year}개는 설립연도가 확인되어 있습니다.</p>
<h2 id="principles">편집 원칙</h2>
<ul><li><b>없는 표기를 만들지 않습니다.</b> 브랜드명은 한글과 원어를 함께 적되, 확인된 한글 표기가 없는 브랜드는 원어만 씁니다. 임의로 음차하지 않습니다.</li>
<li><b>검증된 사실만 표에 넣습니다.</b> 기원 국가와 설립연도는 검수된 브랜드 설명에서 확인된 값을 우선하고, 없을 때만 공식 웹사이트 URL이 정확히 일치하는 위키데이터 개체의 값을 씁니다. 현재 소유주의 국적이나 모기업의 창업연도는 기원 정보로 쓰지 않습니다. 빈 칸은 채우지 않습니다.</li>
<li><b>개체 연결은 URL 일치로만 합니다.</b> 위키데이터·위키백과 링크(sameAs)는 공식 웹사이트가 완전히 일치하는 ${stats.entity}개 브랜드에만 붙어 있습니다. 이름이 비슷하다는 이유로 연결하지 않습니다.</li>
<li><b>등급을 나눕니다.</b> 한글 표기와 로고가 모두 확인되지 않은 항목은 디렉토리 등급으로 분류해 목록과 홈에서 분리합니다. 그 가운데 본문이 얇은 항목은 검색 색인에서도 제외합니다. 자료가 보강되면 자동으로 본 목록에 올라갑니다.</li>
<li><b>갱신일은 실제 변경이 있을 때만 바꿉니다.</b> 본문이 바뀐 페이지만 '최종 업데이트'가 갱신됩니다.</li></ul>
<h2>로고와 상표에 대해</h2><p>로고·상표의 권리는 각 브랜드 소유자에게 있습니다. 브랜드 아틀라스는 브랜드를 식별하고 그 역사를 설명하기 위한 자료로 로고를 싣습니다. 권리자가 삭제나 수정을 원하면 <a href="${P}pages/contact.html">문의</a>로 알려 주시면 확인 후 처리합니다.</p>
<h2>운영</h2><p>브랜드성장연구소 아키타이포스가 기획·편집·운영합니다. 데이터 보강과 페이지 생성은 자동화되어 있으며, 사실 검증 기준은 위 편집 원칙을 따릅니다. 사이트 이용 통계는 Google Analytics로 집계하며 자세한 내용은 <a href="${P}pages/privacy.html">개인정보 처리방침</a>에 있습니다.</p>
</article></div>`;
  writeIfChanged(path.join(ROOT, "pages", "about.html"), page({ title: "브랜드 아틀라스 소개 — 편집 원칙과 운영 | 브랜드 아틀라스", desc: `브랜드 ${stats.total}개의 역사·아이덴티티·로고 변천을 한글로 정리한 브랜드 사전. 없는 표기를 만들지 않고 검증된 사실만 싣는 편집 원칙을 설명합니다.`, canonical: `${ORIGIN}/pages/about.html`, bodyHtml: about, active: "" }));

  const privacy = `${hubHead("안내", "개인정보 처리방침", "", crumbsHub("개인정보 처리방침"))}<div class="wrap"><article class="doc">
<p>브랜드 아틀라스(brandatlas.co.kr, 이하 '사이트')는 회원 가입이나 로그인 없이 이용하는 정보 제공 사이트이며, 이용자의 개인정보를 직접 수집하지 않습니다. 다만 아래와 같이 서비스 이용 과정에서 자동으로 생성되는 정보와 이용자가 자발적으로 제출하는 정보가 있습니다.</p>
<h2>1. 자동으로 수집되는 정보</h2>
<table><tr><th>항목</th><th>목적</th><th>보관</th></tr>
<tr><td>접속 로그(IP 주소, 접속 시각, 요청 페이지, 브라우저 정보)</td><td>서버 운영·보안, 크롤러 방문 분석</td><td>웹서버 로그 보관 정책에 따라 순환 삭제</td></tr>
<tr><td>Google Analytics 4 이용 통계(쿠키 기반 식별자, 페이지 조회, 유입 경로, 기기 정보)</td><td>방문 추이와 인기 페이지 파악</td><td>Google의 데이터 보존 설정에 따름</td></tr></table>
<p>Google Analytics의 수집을 원하지 않으면 브라우저의 쿠키 차단 설정이나 <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener" target="_blank">Google Analytics 차단 부가기능</a>을 사용할 수 있습니다.</p>
<h2>2. 이용자가 제출하는 정보</h2>
<p>문의 페이지로 보내는 내용(문의 내용, 회신을 위해 적어 주신 연락처)은 문의 처리 목적으로만 사용하며, 처리 완료 후 1년 이내에 삭제합니다.</p>
<h2>3. 제3자 제공과 위탁</h2>
<p>수집한 정보는 법령에 따른 요청이 있는 경우를 제외하고 제3자에게 제공하지 않습니다. 이용 통계 처리는 Google LLC(Google Analytics)에 위탁되며, 웹 폰트는 jsDelivr CDN에서 제공됩니다. 이 과정에서 해당 서비스에 접속 정보가 전달될 수 있습니다.</p>
<h2>4. 외부 링크</h2>
<p>사이트에는 각 브랜드의 공식 웹사이트, 위키데이터, 위키백과로 가는 외부 링크가 있습니다. 외부 사이트의 개인정보 처리에 대해서는 해당 사이트의 방침이 적용됩니다.</p>
<h2>5. 문의</h2>
<p>개인정보 처리에 관한 문의는 <a href="${P}pages/contact.html">문의 페이지</a>로 보내 주세요. 운영 주체는 브랜드성장연구소 아키타이포스입니다.</p>
<p class="muted">시행일: 2026년 9월 7일</p>
</article></div>`;
  writeIfChanged(path.join(ROOT, "pages", "privacy.html"), page({ title: "개인정보 처리방침 | 브랜드 아틀라스", desc: "브랜드 아틀라스의 개인정보 처리방침. 회원 가입 없이 이용하는 정보 사이트이며 접속 로그와 Google Analytics 이용 통계만 자동 수집됩니다.", canonical: `${ORIGIN}/pages/privacy.html`, bodyHtml: privacy, active: "" }));

  const contact = `${hubHead("안내", "문의", esc("자료 오류 신고, 로고·상표 관련 요청, 협업 제안을 받습니다. 남겨 주신 내용은 운영 관리 화면에 저장되어 담당자가 확인합니다."), crumbsHub("문의"))}<div class="wrap"><article class="doc">
<form class="form" id="contactForm" method="post" action="/contact-api/submit">
<label>구분<select name="kind" style="border:1.5px solid var(--line-2);border-radius:10px;padding:11px 14px;font-size:15px;background:#fff"><option value="correction">자료 오류·수정 요청</option><option value="rights">로고·상표 권리 관련</option><option value="partnership">협업·제휴 제안</option><option value="other">기타</option></select></label>
<label>브랜드 또는 페이지<input name="subject" maxlength="200" placeholder="예: 구찌 — 설립연도가 다릅니다"></label>
<label>내용 <span class="note">필수 · 2,000자 이내</span><textarea name="message" maxlength="2000" required></textarea></label>
<label>회신 연락처 <span class="note">선택 · 이메일 등. 회신이 필요할 때만 적어 주세요.</span><input name="reply" maxlength="200" autocomplete="email"></label>
<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<button class="btn" type="submit">보내기</button>
<p class="form-status" id="contactStatus" aria-live="polite"></p>
</form>
<p class="muted" style="margin-top:22px;font-size:14px">제출한 내용은 문의 처리 목적으로만 사용하며 <a href="${P}pages/privacy.html">개인정보 처리방침</a>에 따라 보관·삭제합니다.</p>
</article></div>
<script>
(function(){var f=document.getElementById("contactForm"),s=document.getElementById("contactStatus");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();var fd=new FormData(f),o={};fd.forEach(function(v,k){o[k]=v});if(!String(o.message||"").trim()){s.textContent="내용을 입력해 주세요.";return}s.textContent="보내는 중…";fetch(f.action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){return[r.ok,j]})}).then(function(x){if(x[0]){s.textContent="접수되었습니다. 확인 후 필요한 경우 회신드립니다.";f.reset()}else{s.textContent=(x[1]&&x[1].error)||"전송에 실패했습니다. 잠시 후 다시 시도해 주세요."}}).catch(function(){s.textContent="전송에 실패했습니다. 잠시 후 다시 시도해 주세요."})})})();
</script>`;
  writeIfChanged(path.join(ROOT, "pages", "contact.html"), page({ title: "문의 | 브랜드 아틀라스", desc: "브랜드 아틀라스 자료 오류 신고, 로고·상표 관련 요청, 협업 제안 문의.", canonical: `${ORIGIN}/pages/contact.html`, bodyHtml: contact, active: "" }));
  console.log("pages/about|privacy|contact.html");
}

// ─── 10) 홈 ─────────────────────────────────────────────────────────────
const pageDateLedger = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "reports", "page-dates.json"), "utf8")).pages || {}; } catch { return {}; } })();
const thinReport = (() => {
  const p = path.join(ROOT, "reports", "thin-pages.json");
  if (!fs.existsSync(p)) { console.warn("  ! reports/thin-pages.json 없음 — build-brand-pages.mjs를 먼저 실행하세요."); return new Set(); }
  return new Set(JSON.parse(fs.readFileSync(p, "utf8")).slugs || []);
})();
// thin-pages.json의 slugs가 noindex 전건이다(렌더 thin + 본문 얇은 디렉토리 등급).
// 등급으로 한 번 더 거르지 않는다 — 디렉토리 등급이어도 본문이 충실하면 색인 대상이다.
const indexable = BRANDS.filter(b => !thinReport.has(urlSlugOf(b)));
const koMonthDay = (iso) => { const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(iso || "")); return m ? `${Number(m[1])}월 ${Number(m[2])}일` : ""; };

{
  const H = "";
  const core = LISTED.filter(b => archiveTier(b) === "core").sort(byScore);
  // 오늘의 브랜드 — 빌드 날짜로 결정(주간 리프레시마다 바뀐다). 사진·본문·로고가 다 있는 브랜드만.
  const magazineIds = new Set((DATA.brands || []).map(b => String(b.id)));
  const pool = core.filter(b => magazineIds.has(String(b.id)) && /^[AB]_/.test(String(b.tier || "")) && b.image && !/logos\/|brand_atlas_logo_mark/.test(String(b.image)) && String(b.sections?.insights?.body || "").length > 120);
  const seed = [...TODAY].reduce((h, ch) => (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0), 2166136261);
  const featured = pool.length ? pool[seed % pool.length] : core[0];
  const popular = core.filter(b => b !== featured).slice(0, 48);
  const recent = Object.entries(pageDateLedger).map(([slug, d]) => ({ slug, m: d.modified })).sort((a, b) => b.m.localeCompare(a.m)).map(x => LISTED.find(b => urlSlugOf(b) === x.slug)).filter(Boolean).filter(b => !popular.includes(b) && b !== featured).slice(0, 12);
  const stats = { brands: listedTotal, logos: LISTED.filter(hasLogo).length, bici: LISTED.filter(b => Array.isArray(b.logoHistory) && b.logoHistory.length > 1).length, industries: industryGroups.length, countries: countryDrafts.length, collections: collectionDrafts.length };
  // 숫자는 빌드 때 데이터를 센 실제 값을 HTML에 그대로 넣는다(JS 없이도, 크롤러에게도 같은 값).
  // data-count 는 화면에 보일 때 0에서 이 값까지 올라가는 표시용이다.
  const stat = (href, n, label) => `<a href="${H}${href}"><b data-count="${n}">${n.toLocaleString("ko-KR")}</b><span>${label}</span></a>`;
  const keywords = (DATA.keywords || []).slice(0, 8);
  const insightText = String(featured.sections?.insights?.body || featured.insight || featured.definition || "").replace(/\s+/g, " ");
  // 카드 높이는 오른쪽 사진이 정한다 — 글이 짧으면 빈 칸이 남으므로 문장 단위로 최대 520자까지 싣는다.
  // 인사이트가 짧으면(280자 미만) 정의 문장을 앞에 붙인다. 중간에서 자르지 않고 마지막 온전한 문장에서 끊는다.
  const FEATURED_MAX = 520;
  const defText = String(featured.definition || "").replace(/\s+/g, " ").trim();
  const baseText = insightText.length < 280 && defText && !insightText.includes(defText.slice(0, 20)) ? `${defText} ${insightText}` : insightText;
  const featuredText = (() => {
    if (baseText.length <= FEATURED_MAX) return baseText;
    const cut = baseText.slice(0, FEATURED_MAX);
    const end = Math.max(cut.lastIndexOf("다. "), cut.lastIndexOf("다."));
    return end > 200 ? cut.slice(0, end + 2) : `${cut.trimEnd()}…`;
  })();
  const feat = `<div class="today"><div class="card dark"><span class="kicker" style="color:#ff8a8e">오늘의 브랜드 · ${TODAY}</span><h3>${esc(displayName(featured))}</h3><p>${esc(featuredText)}</p><div class="chips"><a class="chip" href="${H}brand/${encodeURIComponent(urlSlugOf(featured))}.html">브랜드 읽기</a><a class="chip" href="${H}category/${featured.domainSlug}.html">${esc(featured.industry)}</a></div></div><a class="card photo" href="${H}brand/${encodeURIComponent(urlSlugOf(featured))}.html"><img src="${assetHref(featured.image, H)}" alt="${esc(displayName(featured))} 브랜드 이미지" decoding="async"></a></div>`;
  const body = `<section class="hero"><div class="wrap"><span class="kicker">브랜드 사전 · 로고 아카이브</span><h1>브랜드의 역사와 <span class="red">아이덴티티</span>를<br>한글로 기록합니다</h1><p class="lead">${stats.brands}개 브랜드의 시작과 성장, 브랜드 아이덴티티, 로고 변천사를 한 페이지에 정리했습니다. 한글 이름으로도, 원어 이름으로도, 초성만으로도 찾을 수 있습니다.</p><form class="hero-search" role="search" action="${H}pages/search.html" method="get"><label class="sr-only" for="home-q">브랜드 검색</label><input id="home-q" name="q" type="search" placeholder="브랜드명 또는 초성 (예: 구찌, ㄱㅉ, gucci)" autocomplete="off"><button type="submit">검색</button></form><div class="chips"><span class="lbl">인기 검색어</span>${keywords.map(k => `<a class="chip" href="${H}pages/search.html?q=${encodeURIComponent(k)}">${esc(k)}</a>`).join("")}</div><div class="stats">${stat("pages/ganada.html", stats.brands, "수록 브랜드")}${stat("pages/bici.html", stats.logos, "로고 이미지")}${stat("pages/industry.html", stats.industries, "산업 분류")}${stat("pages/collections.html", stats.collections, "테마 컬렉션")}${stat("pages/countries.html", stats.countries, "국가 허브")}</div><p class="stats-asof">${TODAY.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (m, y, mo, d) => `${y}년 ${Number(mo)}월 ${Number(d)}일`)} 기준</p></div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>오늘의 브랜드</h2><p>한 브랜드를 골라 깊이 읽어 봅니다</p></div>${feat}</div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>산업별로 찾기</h2><a class="more" href="${H}pages/industry.html">산업별 전체 →</a></div><div class="cat-grid">${industryGroups.map(([slug, g]) => catCard(slug, g, H)).join("")}</div></div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>주요 브랜드</h2><p>한글 표기·로고·본문을 모두 갖춘 브랜드 가운데 자료가 풍부한 순</p></div>${tiles(popular, H, { sub: "origin", size: "lg", eagerFirst: true })}<p style="margin-top:18px"><a class="btn ghost" href="${H}pages/bici.html">로고 아카이브 전체 보기</a></p></div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>새로 다듬은 브랜드 기록</h2><p>본문을 새로 쓰거나 고친 순서입니다</p><a class="more" href="${H}rss.xml">RSS 구독 →</a></div><div class="recent">${recent.map(b => `<a href="${H}brand/${encodeURIComponent(urlSlugOf(b))}.html">${hasLogo(b) ? `<img src="${assetHref(b.logo, H)}" alt="" loading="lazy" decoding="async">` : `<span class="none"></span>`}<span><b>${esc(displayName(b))}</b><small>${esc(b.industry || "")} · ${esc(koMonthDay(pageDateLedger[urlSlugOf(b)]?.modified))} 업데이트</small></span></a>`).join("")}</div></div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>가나다 · ABC 색인</h2><a class="more" href="${H}pages/ganada.html">색인 전체 →</a></div>${indexNav("", H)}<div class="section-head" style="margin-top:26px"><h2>컬렉션</h2><a class="more" href="${H}pages/collections.html">컬렉션 전체 →</a></div><nav class="chips" aria-label="컬렉션">${collectionDrafts.map(({ c, arr }) => `<a class="chip" href="${H}collection/${c.slug}.html">${esc(c.name)} <small>${arr.length}</small></a>`).join("")}</nav><div class="section-head" style="margin-top:26px"><h2>국가별</h2><a class="more" href="${H}pages/countries.html">국가별 전체 →</a></div><nav class="chips" aria-label="국가별">${countryDrafts.map(({ c, slug, arr }) => `<a class="chip" href="${H}country/${slug}.html">${esc(c)} <small>${arr.length}</small></a>`).join("")}</nav></div></section>
<section class="section"><div class="wrap"><div class="about-strip"><div><b>없는 표기를 만들지 않습니다</b><p>한글 표기가 확인된 브랜드만 한글로 적고, 나머지는 원어를 그대로 씁니다.</p></div><div><b>검증된 사실만 표에 넣습니다</b><p>기원 국가·설립연도는 검수된 설명이나 공식 사이트가 일치하는 위키데이터에서만 가져옵니다.</p></div><div><b>로고 변천까지 기록합니다</b><p>${stats.bici}개 브랜드의 로고 변천사를 상세 페이지에 실었습니다.</p></div></div><p style="margin-top:16px"><a class="more" href="${H}pages/about.html">브랜드 아틀라스 소개와 편집 원칙 →</a></p></div></section>`;
  const title = "브랜드 아틀라스 — 브랜드 사전·로고 아카이브";
  const desc = `${stats.brands}개 브랜드의 역사·아이덴티티·로고 변천을 한글로 정리한 브랜드 사전. 한글·원어·초성으로 검색하고 산업별·국가별·가나다순으로 찾아봅니다.`;
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: "브랜드 아틀라스", alternateName: "Brand Atlas", url: `${ORIGIN}/`, description: desc, inLanguage: "ko-KR", publisher: { "@type": "Organization", name: "브랜드성장연구소 아키타이포스", url: `${ORIGIN}/`, logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/objects/archetypos_logo.png` } }, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${ORIGIN}/pages/search.html?q={search_term_string}` }, "query-input": "required name=search_term_string" } },
    { "@type": "ItemList", name: "주요 브랜드", numberOfItems: popular.length, itemListElement: popular.slice(0, 48).map((b, i) => ({ "@type": "ListItem", position: i + 1, name: displayName(b), url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) },
  ] });
  // 홈 전용 스타일 — styles.css를 바꾸면 CSS_V를 올려야 하고 전 페이지가 다시 쓰인다.
  const homeStyle = `<style>.today .card.dark .chips{margin-top:auto}.stats{grid-template-columns:repeat(5,1fr);max-width:900px}.stats-asof{margin-top:10px;font-size:12px;color:var(--muted)}@media(max-width:767px){.stats{grid-template-columns:repeat(2,1fr)}}</style>`;
  const countUp = `<script>(()=>{const els=document.querySelectorAll('.stats b[data-count]');if(!els.length||!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const run=el=>{const n=+el.dataset.count,t0=performance.now(),d=900;const f=t=>{const p=Math.min(1,(t-t0)/d),v=Math.round(n*(1-Math.pow(1-p,3)));el.textContent=v.toLocaleString('ko-KR');if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)};const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);run(e.target)}}),{threshold:.6});els.forEach(el=>io.observe(el))})();</script>`;
  const html = page({ title, desc, canonical: `${ORIGIN}/`, bodyHtml: homeStyle + body + countUp, active: "", prefix: "", jsonLd, ogImage: `${ORIGIN}/assets/objects/world_map_dots.png`, extraHead: '<meta name="naver-site-verification" content="a5a82f7a952f8b6756924f50e705050cca7aa574">' });
  writeIfChanged(path.join(ROOT, "index.html"), html);
  console.log(`index.html: featured=${featured.name}, popular=${popular.length}, recent=${recent.length}`);
}

// ─── 10-a) 404 ───────────────────────────────────────────────────────────
// nginx error_page 404 /404.html (deploy/patch-nginx-404.py). 상태 코드는 404 그대로다.
{
  const body = `<div class="page-head"><div class="wrap"><span class="kicker">404</span><h1>페이지를 찾을 수 없습니다</h1><p class="lead">주소가 바뀌었거나 없는 페이지입니다. 브랜드 이름이나 초성으로 검색하거나 색인에서 찾아보세요.</p><form class="hero-search" role="search" action="/pages/search.html" method="get" style="margin-top:18px"><label class="sr-only" for="nf-q">브랜드 검색</label><input id="nf-q" name="q" type="search" placeholder="브랜드명 또는 초성 (예: 구찌, ㄱㅉ)"><button type="submit">검색</button></form></div></div><div class="wrap section"><div class="chips"><a class="chip" href="/pages/ganada.html">가나다 · ABC 색인</a><a class="chip" href="/pages/industry.html">산업별</a><a class="chip" href="/pages/countries.html">국가별</a><a class="chip" href="/pages/bici.html">로고 아카이브</a><a class="chip" href="/index.html">홈으로</a></div></div>`;
  // 404는 어떤 깊이의 URL에서도 서빙되므로 절대 경로("/")를 쓴다.
  writeIfChanged(path.join(ROOT, "404.html"), page({ title: "페이지를 찾을 수 없습니다 | 브랜드 아틀라스", desc: "요청한 페이지가 없습니다.", canonical: `${ORIGIN}/404.html`, bodyHtml: body, active: "", prefix: "/", robots: "noindex,follow" }));
}

// ─── 11) 검색 인덱스(슬림) ────────────────────────────────────────────────
// 검색 페이지가 force-cache로 받으므로 URL 버전은 인덱스 내용 해시로 정한다 — CSS_V를 올려
// 전 페이지를 다시 쓰지 않고도 로고·이름이 바뀐 인덱스를 재방문자에게 새로 받게 한다.
let INDEX_V = CSS_V;
{
  const rows = BRANDS.map(b => {
    const ko = koreanName(b), en = latinName(b);
    return {
      s: urlSlugOf(b), n: ko || en || b.name, e: ko && en && ko.toLowerCase() !== en.toLowerCase() ? en : "",
      i: b.industry || "", l: hasLogo(b) ? String(b.logo).replace(/^\.\.\//, "") : "",
      c: ko ? chosungString(ko) : "", d: oneLine(b, 90), t: isDirectory(b) ? "d" : (archiveTier(b) === "core" ? "c" : "s"),
      a: [b.nameKo, b.nameEn, b.name].filter(v => v && v !== ko && v !== en).slice(0, 2),
    };
  });
  writeIfChanged(path.join(ROOT, "data", "search-index.json"), JSON.stringify({ generatedAt: TODAY, count: rows.length, brands: rows }));
  INDEX_V = crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 10);
  console.log(`data/search-index.json: ${rows.length} rows, ${(fs.statSync(path.join(ROOT, "data", "search-index.json")).size / 1024).toFixed(0)}KB, v=${INDEX_V}`);
}

// ─── 11-b) 검색 페이지(템플릿 치환) ──────────────────────────────────────
{
  const tpl = fs.readFileSync(path.join(__dirname, "templates", "search.html"), "utf8");
  const html = tpl.replaceAll("__HEADER__", header("", P)).replaceAll("__FOOTER__", footer(P)).replaceAll("__INDEX_V__", INDEX_V).replaceAll("__CSS_V__", CSS_V);
  writeIfChanged(path.join(ROOT, "pages", "search.html"), html);
}

// ─── 12) sitemap ─────────────────────────────────────────────────────────
function mtime(relPath) { try { return kstDay(fs.statSync(path.join(ROOT, relPath)).mtimeMs); } catch { return TODAY; } }
function urlset(entries) {
  const hasImages = entries.some(([, , imgs]) => imgs && imgs.length);
  const ns = hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : "";
  const body = entries.map(([loc, lm, imgs]) => {
    const images = (imgs || []).map(({ url, title }) => `\n    <image:image><image:loc>${esc(url)}</image:loc><image:title>${esc(title)}</image:title></image:image>`).join("");
    return `  <url><loc>${loc}</loc><lastmod>${lm}</lastmod>${images}${images ? "\n  " : ""}</url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}>\n${body}\n</urlset>\n`;
}
function brandImages(b) {
  const abs = (src) => {
    const clean = String(src || "").replace(/^\.\.\//, "").replaceAll("\\", "/");
    if (!clean || clean.includes("brand_atlas_logo_mark") || clean.startsWith("data:")) return null;
    if (/^https?:\/\//.test(clean)) return clean.startsWith(`${ORIGIN}/`) ? clean : null;
    return `${ORIGIN}/${clean}`;
  };
  const name = displayName(b);
  const out = new Map();
  const push = (src, title) => { const u = abs(src); if (u && !out.has(u)) out.set(u, { url: u, title }); };
  push(b.logo, `${name} 로고`);
  push(b.image, `${name} 브랜드 이미지`);
  for (const item of (Array.isArray(b.logoHistory) ? b.logoHistory : []).slice(0, 3)) push(item && item.src, `${name} ${(item && item.label) || "로고 변천"}`);
  return [...out.values()].slice(0, 4);
}
const hubEntries = [
  ["/", "index.html"], ["/pages/ganada.html", "pages/ganada.html"], ["/pages/brands.html", "pages/brands.html"], ["/pages/industry.html", "pages/industry.html"], ["/pages/countries.html", "pages/countries.html"], ["/pages/collections.html", "pages/collections.html"], ["/pages/bici.html", "pages/bici.html"], ["/pages/timeline.html", "pages/timeline.html"], ["/pages/insights.html", "pages/insights.html"], ["/pages/search.html", "pages/search.html"], ["/pages/about.html", "pages/about.html"], ["/pages/privacy.html", "pages/privacy.html"], ["/pages/contact.html", "pages/contact.html"],
  ...industryGroups.map(([slug]) => [`/category/${slug}.html`, `category/${slug}.html`]),
  ...countryDrafts.map(({ slug }) => [`/country/${slug}.html`, `country/${slug}.html`]),
  ...collectionDrafts.map(({ c }) => [`/collection/${c.slug}.html`, `collection/${c.slug}.html`]),
].map(([loc, rel]) => [`${ORIGIN}${loc}`, mtime(rel)]);
const brandEntries = indexable.map(b => {
  const slug = urlSlugOf(b);
  const led = pageDateLedger[slug];
  return [`${ORIGIN}/brand/${encodeURIComponent(slug)}.html`, (led && led.modified) || mtime(`brand/${slug}.html`), brandImages(b)];
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
for (const stale of fs.readdirSync(ROOT).filter(f => /^sitemap-brands-\d+\.xml$/.test(f))) if (!files.includes(stale)) fs.unlinkSync(path.join(ROOT, stale));
writeIfChanged(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(f => `  <sitemap><loc>${ORIGIN}/${f}</loc><lastmod>${TODAY}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`);
console.log(`sitemap.xml: ${files.length} files, ${hubEntries.length} hubs + ${brandEntries.length} brands (noindex ${total - indexable.length} excluded)`);

// ─── 13) RSS ─────────────────────────────────────────────────────────────
{
  // RSS는 '최근 갱신된 브랜드' 채널이므로 목록 노출 대상만 싣는다 — 디렉토리 등급은
  // 색인 대상이어도 목록·홈에 올리지 않는다는 정책과 같은 기준이다.
  const ranked = indexable.filter(isListed).map(b => ({ b, d: pageDateLedger[urlSlugOf(b)]?.modified || mtime(`brand/${urlSlugOf(b)}.html`) })).sort((x, y) => y.d.localeCompare(x.d) || byScore(x.b, y.b)).slice(0, 100);
  const items = ranked.map(({ b, d }) => {
    const link = `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html`;
    const text = String(b.definition || b.summary || b.insight || "").slice(0, 280);
    return `    <item><title>${esc(displayName(b))}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><category>${esc(b.industry || "")}</category><pubDate>${new Date(`${d}T00:00:00+09:00`).toUTCString()}</pubDate><description>${esc(text)}</description></item>`;
  }).join("\n");
  writeIfChanged(path.join(ROOT, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>브랜드 아틀라스 — 브랜드 사전·로고 아카이브</title>\n    <link>${ORIGIN}/</link>\n    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>\n    <description>브랜드의 역사·아이덴티티·로고 변천을 한글로 정리한 브랜드 사전. 수록 ${listedTotal}개 브랜드 중 최근 갱신분.</description>\n    <language>ko</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`);
  console.log(`rss.xml: ${ranked.length} items`);
}

// ─── 14) robots.txt ──────────────────────────────────────────────────────
{
  const AI_AGENTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "meta-externalagent"];
  const sitemaps = [`${ORIGIN}/sitemap.xml`, ...files.map(f => `${ORIGIN}/${f}`)];
  const robots = ["User-agent: *", "Allow: /", "Disallow: /pages/directory.html", "", "# 네이버 Yeti·구글봇은 전체 허용", "User-agent: Yeti", "Allow: /", "", "User-agent: Googlebot", "Allow: /", "", "# AI 검색 크롤러 — 인용 노출을 위해 명시적으로 허용한다", ...AI_AGENTS.flatMap(a => [`User-agent: ${a}`, "Allow: /", ""]), ...sitemaps.map(u => `Sitemap: ${u}`), ""].join("\n");
  writeIfChanged(path.join(ROOT, "robots.txt"), robots);
}

// ─── 15) llms.txt ────────────────────────────────────────────────────────
{
  const top = [...indexable].sort(byScore).slice(0, 80);
  const lines = [
    "# 브랜드 아틀라스 (Brand Atlas)",
    "> 브랜드의 설립 배경, 브랜드 아이덴티티, 로고(BI/CI) 변천, 제품과 서비스, 현재 상태를 정리한 한국어 브랜드 사전입니다.",
    `> 수록 브랜드 ${BRANDS.length}개(목록 노출 ${listedTotal}개 + 디렉토리 등급 ${DIRECTORY.length}개), 색인 대상 ${indexable.length}개, 로고 이미지 ${LISTED.filter(hasLogo).length}개. 운영 브랜드성장연구소 아키타이포스.`,
    "",
    "## 데이터 원칙",
    "- 브랜드명은 한글과 원어를 함께 표기합니다. 데이터에 없는 표기는 만들지 않습니다.",
    "- 기원 국가·설립연도는 검수된 정의문에서 확인된 값을 우선하고, 없을 때만 공식 웹사이트 URL이 완전히 일치하는 위키데이터 개체의 값을 씁니다.",
    `- 위키데이터 개체 연결(sameAs)은 공식 웹사이트 URL 완전 일치로 확인된 ${BRANDS.filter(b => b.entityLinks).length}개 브랜드에만 붙어 있습니다.`,
    "- 각 브랜드 페이지에는 검증된 값만 담은 '브랜드 정보' 표와 출처 절이 있습니다.",
    "",
    "## 허브",
    `- [가나다·ABC 색인](${ORIGIN}/pages/ganada.html): 전체 브랜드 색인`,
    `- [산업별](${ORIGIN}/pages/industry.html): ${industryGroups.length}개 산업`,
    `- [국가별](${ORIGIN}/pages/countries.html): ${countryDrafts.length}개국`,
    `- [컬렉션](${ORIGIN}/pages/collections.html): ${collectionDrafts.length}개 테마(AI·핀테크·항공사 등)`,
    `- [로고 아카이브](${ORIGIN}/pages/bici.html): 로고·BI/CI 변천`,
    `- [타임라인](${ORIGIN}/pages/timeline.html): 설립연도별`,
    `- [인사이트](${ORIGIN}/pages/insights.html): 브랜드별 관점`,
    `- [소개·편집 원칙](${ORIGIN}/pages/about.html)`,
    "",
    "## 산업 카테고리",
    ...industryGroups.map(([slug, g]) => `- [${g.label}](${ORIGIN}/category/${slug}.html): ${g.items.length}개 브랜드`),
    "",
    "## 컬렉션",
    ...collectionDrafts.map(({ c, arr }) => `- [${c.name}](${ORIGIN}/collection/${c.slug}.html): ${arr.length}개 브랜드`),
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
}
console.log(`\ncssV=${CSS_V}`);
