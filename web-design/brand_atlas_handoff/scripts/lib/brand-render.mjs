// 브랜드 페이지 본문 렌더러 (SSG 전용).
//
// 구조: 머리(빵부스러기·h1·정의문·메타 칩·로고) → 본문(질문형 H2 섹션) + 사이드(팩트 표·목차).
//  - H2는 질문형이지만 데이터가 있는 섹션만 만든다. 없는 사실을 만들지 않는다(FAQ와 같은 규율).
//  - 팩트 표는 factRows()가 검증한 값만 싣고, 값마다 출처(정의문/위키데이터/공식)를 남긴다.
//  - 본문 산문·연표·BI/CI·관련 브랜드는 app.js의 함수(VM 샌드박스)를 그대로 써서 SPA와 같다.
import { esc, breadcrumbs } from "./page-shell.mjs";
import { koreanName, latinName, displayName, headingMarkup, factRows, topicParticle, urlSlugOf, countryOf } from "./brand-seo.mjs";
import { tiles, logoImg, assetHref } from "./markup.mjs";
import { isDirectory, isNoindex, hasLogo } from "./archive.mjs";
import { collectionsOf, COLLECTION_BY_SLUG } from "./collections.mjs";

const COUNTRY_SLUG_REF = { 미국: "usa", 한국: "korea", 독일: "germany", 영국: "uk", 프랑스: "france", 일본: "japan", 이탈리아: "italy", 네덜란드: "netherlands", 스웨덴: "sweden", 스위스: "switzerland", 캐나다: "canada", 스페인: "spain", 호주: "australia", 뉴질랜드: "new-zealand", 노르웨이: "norway", 핀란드: "finland", 덴마크: "denmark", 벨기에: "belgium", 오스트리아: "austria", 러시아: "russia", 중국: "china", 폴란드: "poland", 대만: "taiwan", 브라질: "brazil", 아이슬란드: "iceland", 자메이카: "jamaica", 그리스: "greece", 포르투갈: "portugal", 홍콩: "hong-kong", 터키: "turkey", 남아프리카공화국: "south-africa", 인도: "india", 멕시코: "mexico", 아일랜드: "ireland", 싱가포르: "singapore", 태국: "thailand", 베트남: "vietnam", 체코: "czech", 헝가리: "hungary", 이스라엘: "israel", 칠레: "chile", 아르헨티나: "argentina", 말레이시아: "malaysia", 인도네시아: "indonesia", 필리핀: "philippines", 우크라이나: "ukraine" };

const SOURCE_LABEL = { definition: "정의문", wikidata: "위키데이터", data: "수록 자료" };

/**
 * @param brand
 * @param ctx { sandbox, faq, dates, countryHubs:Set<slug>, collectionHubs:Set<slug>, related:Brand[] }
 */
// 같은 항목이 여러 벌 들어온 레코드가 있다(예: "창업자: X; CEO: Y; 창업자: X").
// 중복은 본문과 JSON-LD에 그대로 반복돼 저품질 신호가 되므로 렌더 단계에서 걷어낸다.
// `키: 값` 목록일 때만 항목 단위로 다시 쪼갠다 — 산문은 콜론이 문장 부호라 건드리지 않는다.
function dedupeSegments(text) {
  const raw = String(text || "");
  if (!raw.includes(";")) return raw;
  let segs = raw.split(";").map(s => s.trim()).filter(Boolean);
  const kv = segs.filter(s => /^[^:;]{1,18}\s*:/.test(s)).length >= Math.ceil(segs.length / 2);
  if (kv) {
    segs = segs.flatMap(s => s.split(/\s+(?=[^\s:;]{1,18}\s*:\s)/).map(x => x.trim()).filter(Boolean));
  }
  const seen = new Set();
  const out = [];
  for (const seg of segs) {
    const key = seg.replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(seg);
  }
  return out.join("; ");
}

export function renderBrandPage(brand, ctx) {
  const { sandbox, faq, countryHubs, collectionHubs } = ctx;
  const P = "../";
  const label = koreanName(brand) || latinName(brand) || String(brand.name || "");
  const t = topicParticle(label);
  const sectionBody = (key) => sandbox.sectionBody(brand, key);
  const prose = (text) => sandbox.prose(text, brand);
  const metaList = (text) => sandbox.metaList(text);
  const directory = isDirectory(brand);

  // ── 섹션 정의 (질문형 H2 — 데이터가 있을 때만) ──
  const defs = [
    ["overview", `${esc(label)}${t} 어떤 브랜드인가`, "feature", "prose"],
    ["insights", `${esc(label)}${t} 어떻게 봐야 할까`, "", "quote"],
    ["origin", `${esc(label)}${t} 어떻게 시작되고 성장했나`, "", "prose"],
    ["identity", `${esc(label)}의 브랜드 아이덴티티는 무엇인가`, "", "prose"],
    ["products", `${esc(label)}의 대표 제품과 서비스는 무엇인가`, "", "smart"],
    ["people", `${esc(label)}${t} 누가 만들고 이끌었나`, "", "smart"],
    ["current", `${esc(label)}${t} 지금 어떤 상태인가`, "", "smart"],
    ["external", "더 알아둘 것", "", "prose"],
  ];
  const sections = [];
  for (const [id, title, cls, mode] of defs) {
    const body = dedupeSegments(sectionBody(id));
    if (!body || !body.trim()) continue;
    let inner = "";
    if (mode === "quote") inner = `<div class="prose quote-box">${prose(body)}</div>`;
    else if (mode === "smart") {
      const segs = body.split(";").map(s => s.trim()).filter(Boolean);
      const structured = segs.length >= 2 && segs.filter(s => /^[^:]{1,18}:/.test(s)).length >= Math.ceil(segs.length / 2);
      inner = structured ? metaList(body) : `<div class="prose">${prose(body)}</div>`;
    } else inner = `<div class="prose">${prose(body)}</div>`;
    if (!inner.replace(/<[^>]+>/g, "").trim()) continue;
    sections.push({ id, title, html: `<section id="${id}"${cls ? ` class="${cls}"` : ""}><h2>${title}</h2>${inner}</section>` });
  }

  const timelineHtml = sandbox.timelineRail(brand.timeline || [], false);
  if (!timelineHtml.includes("empty-note")) {
    sections.push({ id: "timeline", title: `${esc(label)} 연혁`, html: `<section id="timeline" class="timeline"><h2>${esc(label)} 연혁 — 주요 사건은 언제였나</h2>${timelineHtml}</section>` });
  }
  const biciHtml = sandbox.logoArchive(brand);
  if (!biciHtml.includes("empty-note") && hasLogo(brand)) {
    sections.push({ id: "bici", title: `${esc(label)} 로고 변천사`, html: `<section id="bici"><h2>${esc(label)} 로고는 어떻게 변해왔나</h2>${biciHtml}</section>` });
  }
  if (faq && faq.length) {
    sections.push({ id: "faq", title: "자주 묻는 질문", html: `<section id="faq"><h2>자주 묻는 질문</h2><div class="faq-list">${faq.map(({ q, a }) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join("")}</div></section>` });
  }
  sections.push({ id: "sources", title: "출처와 검증", html: sourcesSection(brand, label) });

  // 관련 브랜드는 boilerplate라 본문 길이·해시 산정에서 뺀다(빌더가 마커로 잘라낸다).
  const related = ctx.related || [];
  const relatedHtml = related.length
    ? `<section id="related" class="related"><h2>함께 읽을 브랜드</h2>${tiles(related, P, { sub: "industry" })}</section>`
    : "";

  // ── 머리 ──
  const catHref = brand.domainSlug ? `${P}category/${brand.domainSlug}.html` : `${P}pages/industry.html`;
  const crumbs = breadcrumbs([
    { name: "브랜드 사전", href: `${P}index.html` },
    { name: brand.industry || "산업", href: catHref },
    { name: displayName(brand) },
  ]);
  const country = countryOf(brand);
  const cslug = country && COUNTRY_SLUG_REF[country];
  const chips = [];
  if (brand.industry) chips.push(`<a class="chip" href="${catHref}">${esc(brand.industry)}</a>`);
  if (country) chips.push(cslug && countryHubs && countryHubs.has(cslug) ? `<a class="chip" href="${P}country/${cslug}.html">${esc(country)} 브랜드</a>` : `<span class="chip">${esc(country)}</span>`);
  for (const s of collectionsOf(brand)) if (collectionHubs && collectionHubs.has(s)) chips.push(`<a class="chip" href="${P}collection/${s}.html">${esc(COLLECTION_BY_SLUG.get(s).name)}</a>`);
  if (hasLogo(brand)) chips.push(`<a class="chip" href="#bici">로고</a>`);
  const lead = sandbox.short(brand.definition || brand.summary || "", 260);
  const head = `<div class="brand-head"><div class="wrap"><div class="grid"><div class="info">${crumbs}<h1>${headingMarkup(brand, esc)}</h1><p class="lead">${esc(lead)}</p><div class="meta">${chips.join("")}</div>__UPDATED__</div><div class="logo-panel${hasLogo(brand) ? "" : " is-wordmark"}">${logoImg(brand, P, { lazy: false, width: 480, height: 480 })}</div></div></div></div>`;

  // ── 사이드 ──
  const rows = factRows(brand);
  const factsHtml = rows.length ? `<div class="facts"><h2>브랜드 정보</h2><table><tbody>${rows.map(r => `<tr><th scope="row">${esc(r.label)}</th><td>${r.href ? `<a href="${r.external ? esc(r.href) : P + r.href}"${r.external ? ' rel="noopener" target="_blank"' : ""}>${esc(r.value)}</a>` : esc(r.value)}</td></tr>`).join("")}</tbody></table><p class="src">출처: ${[...new Set(rows.map(r => SOURCE_LABEL[r.source] || r.source))].join(" · ")}. 검증된 값만 표기하며 빈 칸은 채우지 않습니다.</p></div>` : "";
  const tocHtml = `<nav class="toc" aria-label="목차"><h2>목차</h2><ol>${[...sections, ...(related.length ? [{ id: "related", title: "함께 읽을 브랜드" }] : [])].map(s => `<li><a href="#${s.id}">${s.title.replace(/ — .*$/, "")}</a></li>`).join("")}</ol></nav>`;

  // 안내 문구는 실제 robots 값과 어긋나면 안 된다. 디렉토리 등급이어도 본문이 충실하면
  // 색인 대상이므로(archive.mjs isNoindex), 색인 제외라고 적을 수 있는 것은 그 안에서도
  // 본문이 얇은 항목뿐이다.
  const note = directory
    ? (isNoindex(brand)
      ? `<p class="directory-note">이 항목은 한글 표기와 로고가 아직 확인되지 않은 <b>디렉토리 등급</b> 자료입니다. 본문은 수록 자료를 그대로 옮긴 것이며 검색 색인에서는 제외됩니다.</p>`
      : `<p class="directory-note">이 항목은 한글 표기와 로고가 아직 확인되지 않은 <b>디렉토리 등급</b> 자료입니다. 본문은 수록 자료를 그대로 옮긴 것이며 목록과 홈에는 올리지 않습니다. 표기나 로고가 확인되면 자동으로 본 목록에 올라갑니다.</p>`)
    : "";

  const body = `${head}<div class="wrap brand-body"><div class="brand-main" id="brandPage">${note}${sections.map(s => s.html).join("")}<!--related-->${relatedHtml}</div><aside class="aside">${factsHtml}${tocHtml}</aside></div>`;
  return body;
}

function sourcesSection(brand, label) {
  const items = [];
  const site = brand.facts?.officialWebsite || brand.officialWebsite;
  if (site && /^https?:\/\//.test(site)) items.push(`<a href="${esc(site)}" rel="noopener nofollow" target="_blank">공식 웹사이트</a>`);
  const same = brand.entityLinks?.sameAs || [];
  for (const u of same) {
    if (/wikidata\.org/.test(u)) items.push(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">위키데이터 ${esc(brand.entityLinks.wikidata || "")}</a>`);
    else if (/ko\.wikipedia\.org/.test(u)) items.push(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">한국어 위키백과</a>`);
    else if (/en\.wikipedia\.org/.test(u)) items.push(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">영어 위키백과</a>`);
  }
  const basis = [];
  basis.push("브랜드명은 한글과 원어를 함께 표기하되 데이터에 없는 표기는 만들지 않습니다.");
  basis.push("기원 국가·설립연도는 검수된 정의문에서 확인된 값을 우선하고, 없을 때만 공식 웹사이트 URL이 일치하는 위키데이터 개체의 값을 씁니다.");
  if (brand.wikidata) basis.push(`위키데이터 값은 ${esc(brand.wikidata.fetchedAt || "")} 기준입니다.`);
  return `<section id="sources"><h2>출처와 검증</h2><p class="sources">${items.length ? `${esc(label)} 관련 참고: ${items.join(" · ")}. ` : ""}${basis.join(" ")}</p></section>`;
}
