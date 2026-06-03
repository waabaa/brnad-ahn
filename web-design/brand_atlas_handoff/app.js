async function loadData() {
  const dataPath = location.pathname.includes("/pages/") ? "../data/brand-atlas.json" : "./data/brand-atlas.json";
  const res = await fetch(`${dataPath}?v=20260604a`, { cache: "no-store" });
  return await res.json();
}

const SITE_ORIGIN = "https://brand.resort.co.kr";
const isPage = () => location.pathname.includes("/pages/");
const fallbackImage = () => isPage() ? "../assets/objects/brand_atlas_logo_mark.png" : "assets/objects/brand_atlas_logo_mark.png";

document.addEventListener("error", event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const fallback = fallbackImage();
  if (img.src.endsWith(fallback)) return;
  img.src = fallback;
  img.classList.add("image-fallback");
}, true);

function asset(src) {
  if (!src) return fallbackImage();
  const clean = src.replaceAll("\\", "/");
  if (clean.startsWith("assets/")) return isPage() ? `../${clean}` : clean;
  if (clean.startsWith("images/")) return isPage() ? `../${clean}` : clean;
  if (clean.startsWith("archive/")) return isPage() ? `../${clean}` : clean;
  return clean;
}

function absoluteUrl(path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path || "").replace(/^\.?\//, "");
  return `${SITE_ORIGIN}/${clean}`;
}

function pageLink(path) {
  return isPage() ? path : `pages/${path}`;
}

function header(active = "") {
  const nav = [
    ["브랜드 사전", isPage() ? "../index.html" : "index.html"],
    ["산업별 탐색", pageLink("industry.html")],
    ["브랜드 매거진", pageLink("brand-artemio.html")],
    ["브랜드 인사이트", pageLink("insights.html")],
    ["타임라인", pageLink("timeline.html")],
    ["BI/CI 아카이브", pageLink("bici.html")],
    ["검색", pageLink("search.html")],
  ];
  const links = nav.map(([name, href]) => `<a class="${name === active ? "active" : ""}" href="${href}">${name}</a>`).join("");
  const home = isPage() ? "../index.html" : "index.html";
  return `<header class="header">
    <a class="logo" href="${home}"><span class="logo-mark"></span><span>브랜드 아틀라스<small>BRAND ATLAS</small></span></a>
    <nav class="nav">${links}</nav>
    <div class="tools"><a aria-label="검색" href="${pageLink("search.html")}">⌕</a><a href="${pageLink("industry.html")}">Menu</a><a class="hamb" aria-label="전체 메뉴" href="${pageLink("industry.html")}">≡</a></div>
  </header>`;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("ko-KR");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFC").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function cleanPublicText(text) {
  return String(text || "")
    .replace(/\[\s*\d+\.\s*/g, "")
    .replace(/\]/g, "")
    .replace(/\b(\d{4})-\d{2}-\d{2}T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-\d{2}-00T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-00-00T00:00:00Z\b/g, "$1년")
    .replace(/\b(\d{4})-00-00\b/g, "$1년")
    .replace(/미국로/g, "미국으로")
    .replace(/독일로/g, "독일로")
    .replace(/Wikidata 기준으로\s*/g, "")
    .replace(/\s*Wikidata 항목 '[^']+'와 매칭되었습니다\./g, "")
    .replace(/로 식별됩니다\./g, "입니다.")
    .replace(/(^|[^\d,.])(\d{5,})(?![\d,.])/g, (_, pre, num) => pre + Number(num).toLocaleString("ko-KR"))
    .replace(/\s+/g, " ")
    .trim();
}

function tierLabel(tier) {
  const key = String(tier || "").toLowerCase();
  if (key.includes("a_")) return "매거진 완성";
  if (key.includes("b_")) return "편집 검수";
  if (key.includes("c_")) return "자료 기반";
  if (key.includes("d_")) return "디렉토리";
  return tier || "자료 기반";
}

function fieldLabel(label) {
  const map = {
    founder: "창업자",
    founded_by: "창업자",
    chief_executive_officer: "CEO",
    revenue: "매출",
    official_website: "공식 웹사이트",
    country: "국가",
    headquarters: "본사",
    industry: "산업",
  };
  return map[label] || label.replaceAll("_", " ");
}

function brandSearchText(b) {
  return [b.name, b.nameKo, b.nameEn, b.slug, b.industry, b.definition, b.insight].join(" ");
}

function brandScore(b, query) {
  const q = normalizeText(query);
  if (!q) return Number(b.rating || 0);
  const name = normalizeText(b.name);
  const nameKo = normalizeText(b.nameKo);
  const nameEn = normalizeText(b.nameEn);
  const slug = normalizeText(b.slug);
  const haystack = normalizeText(brandSearchText(b));
  let score = 0;
  if (name === q || nameKo === q || nameEn === q) score += 1000;
  if (name.startsWith(q) || nameKo.startsWith(q) || nameEn.startsWith(q)) score += 600;
  if (slug === q || slug.split(" ").includes(q)) score += 450;
  if (haystack.includes(q)) score += 120;
  score += Number(b.rating || 0) * 10;
  return score;
}

function searchBrands(allBrands, query, limit = 12) {
  const q = normalizeText(query);
  return [...(allBrands || [])]
    .map(b => ({ b, score: brandScore(b, q) }))
    .filter(row => !q || row.score >= 120)
    .sort((a, b) => b.score - a.score || String(a.b.name).localeCompare(String(b.b.name), "ko"))
    .slice(0, limit)
    .map(row => row.b);
}

function allAtlasBrands() {
  const data = window.brandAtlasData || {};
  return uniqueBrandsBySlug([...(data.brands || []), ...(data.allBrands || [])]);
}

function findBrand(data, slug) {
  const brands = [...(data.brands || []), ...(data.allBrands || [])];
  const key = normalizeText(slug || data.featuredBrand?.slug);
  const aliases = { bmw: "bavarian motor works bayerische motoren werke" };
  return brands.find(b => normalizeText(b.slug) === key)
    || brands.find(b => normalizeText(b.name) === key || normalizeText(b.nameEn) === key)
    || (aliases[key] ? brands.find(b => normalizeText(b.slug) === aliases[key]) : null);
}

function brandUrl(b) {
  return pageLink(`brand-artemio.html?brand=${encodeURIComponent(b.slug)}`);
}

function searchUrl(query) {
  return pageLink(`search.html?q=${encodeURIComponent(query || "")}`);
}

function linkBrandMentions(text, currentBrand, limit = 6) {
  let output = cleanPublicText(text);
  const currentId = String(currentBrand?.id || "");
  const candidates = allAtlasBrands()
    .filter(b => String(b.id || "") !== currentId)
    .filter(b => !String(b.tier || "").toLowerCase().startsWith("d_"))
    .flatMap(b => [b.name, b.nameKo, b.nameEn].filter(Boolean).map(name => ({ b, name })))
    .filter(x => /[가-힣]/.test(x.name) ? x.name.length >= 2 : x.name.length >= 3)
    .sort((a, b) => b.name.length - a.name.length);
  let count = 0;
  const linkedIds = new Set();
  for (const { b, name } of candidates) {
    if (count >= limit || linkedIds.has(String(b.id))) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^가-힣A-Za-z0-9])(${escaped})(?=$|[^가-힣A-Za-z0-9])`);
    if (!pattern.test(output)) continue;
    output = output.replace(pattern, `$1<a class="text-link" href="${brandUrl(b)}">$2</a>`);
    linkedIds.add(String(b.id));
    count += 1;
  }
  return output;
}

function relatedBrands(brand, limit = 8) {
  const text = normalizeText([brand.name, brand.nameEn, brand.industry, brand.definition, brand.insight, Object.values(brand.sections || {}).map(v => v.body).join(" ")].join(" "));
  const stopwords = new Set(["brand", "company", "corporation", "american", "global", "multinational", "브랜드", "기업", "회사", "미국", "독일", "영국", "프랑스", "일본", "한국", "설립", "정의", "기원", "제조", "판매", "산업", "현재", "제품"]);
  const domainKeywords = {
    "sports-outdoor": ["스포츠", "운동", "운동화", "아웃도어", "등반", "러닝", "축구", "농구", "선수", "신발", "athletic", "sports", "outdoor", "footwear"],
    "food-beverage": ["커피", "음료", "식품", "주류", "맥주", "레스토랑", "프랜차이즈", "초콜릿", "피자", "샴페인", "와인", "베이커리", "food", "coffee", "beverage", "restaurant"],
    mobility: ["자동차", "모터", "항공", "모빌리티", "차량", "오토바이", "car", "motor", "automotive"],
    "tech-electronics": ["기술", "전자", "소프트웨어", "컴퓨터", "반도체", "디지털", "technology", "software", "computer"],
  };
  return allAtlasBrands()
    .filter(b => String(b.id) !== String(brand.id))
    .map(b => {
      let score = 0;
      const nameVariants = [b.name, b.nameKo, b.nameEn].filter(Boolean).map(normalizeText).filter(x => x.length >= 2);
      const nameTokens = normalizeText([b.name, b.nameEn].join(" ")).split(" ").filter(x => x.length >= 2);
      const bodyTokens = normalizeText([b.industry, b.definition, b.insight].join(" ")).split(" ")
        .filter(x => x.length >= 3 && !stopwords.has(x))
        .slice(0, 34);
      const directMention = nameVariants.some(name => text.includes(name));
      const sameDomain = Boolean(b.domainSlug && b.domainSlug === brand.domainSlug);
      const sameIndustry = Boolean(b.industry && b.industry === brand.industry);
      const domainText = normalizeText([b.industry, b.definition, b.insight].join(" "));
      const domainTerms = domainKeywords[brand.domainSlug] || [];
      const domainRelevant = !domainTerms.length || domainTerms.some(token => domainText.includes(token));
      if (!directMention && !sameDomain && !sameIndustry) return { b, score: 0 };
      if ((sameDomain || sameIndustry) && !domainRelevant && !directMention) return { b, score: 0 };
      if (directMention) score += 100;
      if (sameDomain) score += 58;
      if (sameIndustry) score += 34;
      for (const token of bodyTokens) {
        if (text.includes(token)) score += 9;
      }
      if (String(b.tier || "").startsWith("A_")) score += 24;
      if (String(b.tier || "").startsWith("B_")) score += 12;
      score += Number(b.rating || 0);
      return { b, score };
    })
    .filter(row => row.score >= 68)
    .sort((a, b) => b.score - a.score || String(a.b.name).localeCompare(String(b.b.name), "ko"))
    .slice(0, limit)
    .map(row => row.b);
}

function relatedLinks(brand) {
  const rows = relatedBrands(brand, 8);
  if (!rows.length) return "";
  return `<section class="cell wide related-cell" id="related"><h2>함께 읽을 브랜드</h2><div class="related-grid">${rows.map(b => `<a class="related-card" href="${brandUrl(b)}"><img src="${asset(b.image && !String(b.image).includes("brand_atlas_logo_mark") ? b.image : (b.logo || b.image))}" alt="${b.name}"><span>${b.industry} · ${tierLabel(b.tier)}</span><b>${b.name}</b><p>${short(b.definition, 92)}</p></a>`).join("")}</div></section>`;
}

function short(text, length = 120) {
  const value = cleanPublicText(text);
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function brandInitials(brand) {
  const en = String(brand?.nameEn || "").trim();
  const ko = String(brand?.nameKo || brand?.name || "").trim();
  const isLatin = /^[\x00-\x7F]+$/.test(en) && en && en !== ko;
  if (isLatin) {
    const words = en
      .replace(/\b(the|inc|co|ltd|corp|company|group|brand|gmbh|sa|ag)\.?\b/gi, "")
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0] || en).slice(0, 2).toUpperCase();
  }
  return ko.replace(/\s+/g, "").slice(0, 2) || "BA";
}

// Renders a brand's logo as an <img>, or a typographic wordmark placeholder when
// no logo asset exists, so missing logos read as intentional rather than broken.
function logoMarkup(brand, variant = "panel") {
  if (brand?.logo) {
    return `<img src="${asset(brand.logo)}" alt="${escapeHtml(brand.name)} 로고" decoding="async">`;
  }
  return `<div class="brand-wordmark ${variant}" role="img" aria-label="${escapeHtml(brand?.name || "")} 로고 자리">
    <span class="wordmark-initials">${escapeHtml(brandInitials(brand))}</span>
    <strong>${escapeHtml(brand?.name || "")}</strong>
  </div>`;
}

function teaserText(text, length = 150) {
  const value = cleanPublicText(text)
    .split(/공식 웹사이트|국가 정보|설립\/시작 시점|소유\/상위 조직 정보|의 정의 및 기원|Wikidata/i)[0]
    .replace(/\s+/g, " ")
    .trim();
  return short(value || text, length);
}

function brandCard(b) {
  return `<a class="brand-card" href="${pageLink(`brand-artemio.html?brand=${encodeURIComponent(b.slug)}`)}">
    <div class="txt"><small>${b.industry} · ${tierLabel(b.tier)}</small><br><b>${b.name}</b><p>${teaserText(b.definition || b.summary, 62)}<br>★ ${b.rating}</p></div>
    <img src="${asset(b.image)}" alt="${b.name} 브랜드 이미지" loading="lazy" decoding="async">
  </a>`;
}

function brandQualityScore(b) {
  let score = Number(b.rating || 0) * 10;
  if (String(b.tier || "").startsWith("A_")) score += 90;
  if (String(b.tier || "").startsWith("B_")) score += 60;
  if (String(b.tier || "").startsWith("C_")) score += 30;
  if (String(b.tier || "").startsWith("D_")) score -= 20;
  if (b.logo || (b.logoHistory || []).length) score += 14;
  if (b.image && !String(b.image).includes("brand_atlas_logo_mark")) score += 12;
  if (b.publicReady === false || b.displayPriority === "low") score -= 80;
  const sections = b.sections || {};
  score += ["insights", "origin", "identity", "products", "people", "current"].filter(key => String(sections[key]?.body || "").trim().length > 24).length * 8;
  return score;
}

function sortBrandsForListing(brands) {
  return [...(brands || [])].sort((a, b) => brandQualityScore(b) - brandQualityScore(a) || String(a.name).localeCompare(String(b.name), "ko"));
}

function uniqueBrandsBySlug(brands) {
  const rows = [];
  const seen = new Set();
  for (const brand of brands || []) {
    const key = normalizeText(brand.slug || brand.name || brand.nameEn);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(brand);
  }
  return rows;
}

function hasRealVisuals(brand) {
  return Boolean(brand?.image && !String(brand.image).includes("brand_atlas_logo_mark"))
    && Boolean(brand?.logo || (brand?.logoHistory || []).length);
}

function hasMagazineBody(brand) {
  const text = [
    brand?.definition,
    brand?.summary,
    brand?.sections?.overview?.body,
    brand?.sections?.insights?.body,
    brand?.sections?.origin?.body,
    brand?.sections?.identity?.body,
  ].join(" ");
  return cleanPublicText(text).length >= 220;
}

function isThinOrGeneric(brand) {
  const text = [
    brand?.definition,
    brand?.summary,
    brand?.sections?.overview?.body,
    brand?.sections?.origin?.body,
    brand?.sections?.identity?.body,
  ].join(" ");
  return /이동 경험과 제품 설계|제품 스타일과 착용 경험|정체성을 만든|로 정리됩니다|연결됩니다|horology|quick service restaurant sector|xkektl|H51가|리슈몽가|로레알가|그룹가|컴퍼니가/.test(text);
}

function dailyCalendarKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dailyRotationKey() {
  const params = new URLSearchParams(location.search);
  const forced = params.get("dailySeed") || params.get("previewDate");
  return forced ? `preview:${forced}` : dailyCalendarKey();
}

function dailyDisplayKey() {
  const params = new URLSearchParams(location.search);
  const forced = params.get("dailySeed") || params.get("previewDate");
  return forced ? `프리뷰 ${forced}` : dailyCalendarKey();
}

function dailyPreviewHref() {
  const url = new URL(location.href);
  url.searchParams.set("dailySeed", Date.now().toString(36));
  return `${url.pathname}${url.search}${url.hash}`;
}

function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dailyPick(items, count, salt = "") {
  const date = dailyRotationKey();
  return [...(items || [])]
    .map((item, index) => ({
      item,
      score: hashText(`${date}:${salt}:${item.slug || item.id || item.name}:${index}`),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(row => row.item);
}

function homeBrandPool(data) {
  const magazineBrands = data.brands || [];
  const preferred = sortBrandsForListing(uniqueBrandsBySlug(magazineBrands));
  return preferred
    .filter(b => b.publicReady !== false)
    .filter(b => !String(b.tier || "").toLowerCase().startsWith("d_"))
    .filter(b => hasRealVisuals(b))
    .filter(b => hasMagazineBody(b))
    .filter(b => !isThinOrGeneric(b));
}

function dailyHomeSelection(data) {
  const pool = homeBrandPool(data);
  const featurePool = pool.filter(b => b.image && !String(b.image).includes("brand_atlas_logo_mark")).slice(0, 160);
  const featured = dailyPick(featurePool.length ? featurePool : pool, 1, "featured")[0] || data.featuredBrand;
  const cardPool = pool.filter(b => String(b.slug) !== String(featured?.slug)).slice(0, 260);
  const cards = dailyPick(cardPool, 5, "cards");
  const insightPool = pool
    .filter(b => String(b.slug) !== String(featured?.slug))
    .filter(b => String(b.sections?.insights?.body || b.insight || "").trim().length > 40)
    .slice(0, 180);
  const insights = dailyPick(insightPool, 3, "insights").map(b => ({
    brand: b.name,
    image: b.image,
    title: b.sections?.insights?.body || b.insight || b.summary || b.definition,
    slug: b.slug,
  }));
  if (insights.length < 3) {
    const used = new Set(insights.map(i => normalizeText(i.brand)));
    const allBrands = data.allBrands || data.brands || [];
    const insightRows = dailyPick(data.insights || [], 8, "fallback-insights")
      .map(row => {
        const match = searchBrands(allBrands, row.brand, 1)[0]
          || allBrands.find(b => normalizeText(b.name) === normalizeText(row.brand) || normalizeText(b.nameEn) === normalizeText(row.brand));
        return {
          brand: row.brand,
          image: row.image || match?.image,
          title: row.title,
          slug: match?.slug,
        };
      })
      .filter(row => row.brand && row.title && !used.has(normalizeText(row.brand)));
    for (const row of insightRows) {
      if (insights.length >= 3) break;
      insights.push(row);
      used.add(normalizeText(row.brand));
    }
  }
  if (insights.length < 3) {
    const used = new Set(insights.map(i => normalizeText(i.brand)));
    for (const b of dailyPick(pool, 8, "fallback-brand-insights")) {
      if (insights.length >= 3 || used.has(normalizeText(b.name))) continue;
      insights.push({
        brand: b.name,
        image: b.image,
        title: b.insight || b.summary || b.definition,
        slug: b.slug,
      });
      used.add(normalizeText(b.name));
    }
  }
  return { featured, cards, insights, dateKey: dailyDisplayKey(), previewHref: dailyPreviewHref() };
}

function homeDomainCards(data) {
  const allBrands = uniqueBrandsBySlug(data.allBrands || data.brands || []);
  return (data.industries || []).map(industry => {
    const brands = sortBrandsForListing(allBrands.filter(b => b.domainSlug === industry.id));
    const topBrands = brands.filter(b => b.publicReady !== false).slice(0, 4);
    const href = `pages/industry.html?industry=${encodeURIComponent(industry.id)}#brand-list`;
    return `<a class="home-domain-card" href="${href}">
      <span><img src="${asset(industry.icon)}" alt="${industry.name} 산업 아이콘" loading="lazy" decoding="async"><small>ISIC ${industry.isicCode}</small></span>
      <b>${industry.name}</b>
      <p>${short(industryEditorialDescription(industry), 96)}</p>
      <em>${fmt(brands.length)}개 항목</em>
      <strong>${topBrands.map(b => b.name).join(" · ")}</strong>
    </a>`;
  }).join("");
}

function industryEditorialDescription(industry) {
  const map = {
    "food-beverage": "스타벅스부터 코카-콜라까지, 일상을 채우는 음료·식품 브랜드의 역사와 전략을 연결합니다.",
    "retail-commerce": "아마존, 유니클로, 립톤처럼 구매 경험과 유통 방식을 바꾼 브랜드를 탐색합니다.",
    "fashion-luxury": "루이비통, 샤넬, 에르메스처럼 욕망과 정체성을 설계한 브랜드들의 계보를 읽습니다.",
    "media-entertainment": "콘텐츠, 캐릭터, 플랫폼, 팬덤을 통해 문화적 영향력을 확장한 브랜드를 정리합니다.",
    "technology-electronics": "제품, 인터페이스, 반도체, 디지털 생태계로 생활 방식을 바꾼 기술 브랜드를 봅니다.",
    "beauty-personal-care": "피부, 향, 자기표현을 둘러싼 뷰티·퍼스널케어 브랜드의 감각과 시장을 다룹니다.",
    mobility: "자동차와 이동 경험을 통해 기술, 디자인, 라이프스타일을 결합한 모빌리티 브랜드를 연결합니다.",
    "sports-outdoor": "나이키부터 파타고니아까지 운동, 장비, 아웃도어 문화를 만든 브랜드를 탐색합니다.",
    "home-lifestyle": "주방, 가구, 생활용품처럼 일상의 사용성을 브랜드 자산으로 만든 사례를 모읍니다.",
    "health-pharma": "헬스케어와 제약 브랜드가 신뢰, 효능, 생활 습관을 어떻게 구축했는지 정리합니다.",
    "travel-hospitality": "호텔, 여행, 리조트 경험을 통해 장소와 환대를 브랜드화한 사례를 읽습니다.",
    "brand-business": "브랜드 평가, 컨설팅, 비즈니스 지표처럼 브랜드를 산업으로 다루는 항목을 모읍니다.",
  };
  return map[industry.id] || industry.description || "";
}

function homePathCards(data, daily) {
  const allBrands = uniqueBrandsBySlug(data.allBrands || data.brands || []);
  const seeds = [daily.featured, ...(daily.cards || [])].filter(Boolean);
  const rows = seeds.slice(0, 4).map(seed => {
    const related = relatedBrands(seed, 4);
    const fallback = sortBrandsForListing(allBrands.filter(b => b.domainSlug === seed.domainSlug && b.slug !== seed.slug)).slice(0, 4);
    const links = (related.length ? related : fallback).slice(0, 4);
    return `<article class="path-card">
      <a class="path-main" href="pages/brand-artemio.html?brand=${encodeURIComponent(seed.slug)}">
        <img src="${asset(seed.logo || seed.image)}" alt="${seed.name} 로고" loading="lazy" decoding="async">
        <span>${seed.industry} · ${tierLabel(seed.tier)}</span>
        <b>${seed.name}</b>
      </a>
      <div>${links.map(b => `<a href="pages/brand-artemio.html?brand=${encodeURIComponent(b.slug)}" title="${b.name}">${b.name}</a>`).join("")}</div>
    </article>`;
  });
  return rows.join("");
}

function homeAlphabetIndex(data) {
  const allBrands = uniqueBrandsBySlug(data.allBrands || data.brands || []);
  const groups = new Map();
  for (const brand of allBrands) {
    const name = String(brand.nameKo || brand.name || brand.nameEn || "").trim();
    if (!name) continue;
    const key = /^[A-Za-z]/.test(name) ? name[0].toUpperCase() : name[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(brand);
  }
  const ordered = [...groups.entries()]
    .map(([key, rows]) => [key, sortBrandsForListing(rows)])
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ko"))
    .slice(0, 14);
  return ordered.map(([key, rows]) => {
    const samples = rows.slice(0, 4);
    return `<article class="alpha-group">
      <a class="alpha-key" href="${searchUrl(key)}">${key}<small>${fmt(rows.length)}</small></a>
      <div>${samples.map(b => `<a href="pages/brand-artemio.html?brand=${encodeURIComponent(b.slug)}" title="${b.name}">${b.name}</a>`).join("")}</div>
    </article>`;
  }).join("");
}

function industryCard(i) {
  return `<a class="industry-card" href="${pageLink(`industry.html?industry=${encodeURIComponent(i.id)}#brand-list`)}" data-industry="${i.id}">
    <img src="${asset(i.icon)}" alt="${i.name} 산업 아이콘" loading="lazy" decoding="async">
    <b>${i.name}</b>
    <p class="count">${fmt(i.count)}개 브랜드</p>
    <small>${i.examples.join(", ")}</small>
    <em class="standard-badge" title="ISIC는 UN 국제표준산업분류입니다.">ISIC ${i.isicCode}</em>
    <span class="card-arrow">→</span>
  </a>`;
}

function insightCard(i) {
  const content = `<img src="${asset(i.image)}" alt="${i.brand} 브랜드 이미지" loading="lazy" decoding="async"><b>${i.brand}</b><p>${short(i.title, 92)}</p>`;
  return i.slug ? `<a class="insight" href="${pageLink(`brand-artemio.html?brand=${encodeURIComponent(i.slug)}`)}">${content}</a>` : `<article class="insight">${content}</article>`;
}

function koreanSourceCard(record) {
  const title = escapeHtml(record.title);
  const source = escapeHtml(record.sourceSite);
  const summary = escapeHtml(short(record.summary, 150));
  const date = escapeHtml(record.date || "");
  const description = escapeHtml(record.sourceDescription || "국내 브랜드·마케팅 소스");
  const url = escapeHtml(record.url || "#");
  return `<article class="source-card">
    <a href="${url}" target="_blank" rel="noopener noreferrer">
      <img src="${asset(record.image)}" alt="${title} 대표 이미지" loading="lazy" decoding="async">
      <span>${source}${date ? ` · ${date}` : ""}</span>
      <b>${title}</b>
      <p>${summary}</p>
      <small>${description}</small>
    </a>
  </article>`;
}

function timelineItem(t) {
  return `<div><b>${t.year}</b><br><span>${t.brand ? `${t.brand} · ` : ""}${short(t.description, 72)}</span></div>`;
}

function timelineRail(items) {
  const rows = [...(items || [])]
    .filter(t => isSafePublicText(t.description) && Number(t.year) >= 1800 && Number(t.year) <= 2100)
    .sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
  if (!rows.length) return `<p class="empty-note">정리된 연도형 이벤트가 없습니다.</p>`;
  return `<div class="timeline-rail">${rows.map(t => `<article class="timeline-node"><b>${t.year}</b><span>${t.brand ? `${t.brand} · ` : ""}${short(t.description, 110)}</span></article>`).join("")}</div>`;
}

function enableTimelineAutoFlow(container) {
  const rail = container?.querySelector(".timeline-rail");
  if (!rail || rail.dataset.autoflow === "true") return;
  const items = [...rail.children];
  if (items.length < 4) return;
  rail.dataset.autoflow = "true";
  rail.setAttribute("aria-label", "자동으로 흐르는 브랜드 타임라인");
  items.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    rail.appendChild(clone);
  });
  container.classList.add("autoflow");
}

function sectionBody(brand, key) {
  const body = brand.sections?.[key]?.body;
  if (key === "products" && cleanPublicText(body).length < 18) return "대표 제품과 서비스 정보는 편집 검수 후 공개됩니다.";
  if (body && body.trim() && isSafeSectionText(body, key)) return body;
  if (key === "overview") return brand.definition || brand.summary || "";
  return "";
}

function isSafePublicText(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  const blocked = [
    /각주\s*각주|참고\s*・|레이어\s*닫기/,
    /Chapter\s*\d+/i,
    /공식\s*홈페이지|공식홈페이지|위키피디아|위키백과/i,
    /https?:\/\//i,
    /revenue:\s*\d{7,}/i,
    /국가 정보는|설립\/시작 시점은|소유\/상위 조직 정보로|로 기록되어 있습니다|정리했습니다|연결되어 있습니다/,
    /제품과 브랜드 이미지를 함께 구축한 브랜드입니다|외식 경험과 프랜차이즈 운영을 결합한 브랜드입니다/,
    /이동 경험과 제품 설계|제품 스타일과 착용 경험|정체성을 만든/,
    /[A-Za-z][A-Za-z ,.'’&()\-]{160,}/,
  ];
  return !blocked.some(pattern => pattern.test(value));
}

function isSafeSectionText(text, key = "") {
  const value = String(text || "").trim();
  if (!isSafePublicText(value)) return false;
  if (key === "external" && /[A-Za-z][A-Za-z ,.'’&()\-]{90,}/.test(value)) return false;
  if (/^.{1,45}(은|는) .{1,35} 브랜드입니다\.?$/.test(value)) return false;
  return true;
}

function prose(text, currentBrand) {
  const value = cleanPublicText(text);
  if (!value || !isSafePublicText(value)) return "";
  return value
    .split(/(?<=[.!?。])\s+|(?<=다\.)\s+|;\s+/)
    .map(part => part.trim())
    .filter(part => part.length >= 6)
    .reduce((groups, sentence, index) => {
      const bucket = Math.floor(index / 2);
      groups[bucket] = groups[bucket] ? `${groups[bucket]} ${sentence}` : sentence;
      return groups;
    }, [])
    .map(part => `<p>${linkBrandMentions(part, currentBrand)}</p>`)
    .join("");
}

function metaList(text) {
  const items = (text || "").split(";").map(item => item.trim()).filter(item => isSafePublicText(item));
  if (!items.length) return `<p class="empty-note">확인된 공개 데이터가 아직 없습니다.</p>`;
  return `<dl class="meta-list">${items.map(item => {
    const [label, ...rest] = item.split(":");
    const value = rest.join(":").trim();
    return value ? `<div><dt>${fieldLabel(label.trim())}</dt><dd>${cleanPublicText(value)}</dd></div>` : `<div><dd>${cleanPublicText(item)}</dd></div>`;
  }).join("")}</dl>`;
}

function logoArchive(brand) {
  const candidates = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
  const fallback = brand.logo || brand.image;
  const items = (candidates.length ? candidates : [{ src: fallback, label: "대표 로고", alt: `${brand.name} logo` }])
    .filter(item => item && item.src && !String(item.src).includes("brand_atlas_logo_mark") && !/racing|team|f1/i.test(`${item.label || ""} ${item.note || ""} ${item.alt || ""} ${item.src || ""}`))
    .slice(0, 8);
  if (!items.length || (items.length === 1 && String(items[0].src || "").includes("brand_atlas_logo_mark") && !brand.logo)) {
    return `<p class="empty-note">확인된 BI/CI 이미지가 아직 없습니다.</p>`;
  }
  return `<div class="logo-archive">${items.map((item, index) => {
    const label = item.label || (index === 0 ? "대표 로고" : "BI/CI 아카이브");
    const note = item.year ? `${item.year}` : (index === 0 ? "대표 브랜드 마크" : "BI/CI 아카이브");
    if (item.status === "asset_pending") {
      return `<article class="pending-logo"><div class="logo-text-mark"><strong>${brand.name}</strong><span>BI/CI</span></div><b>${label}</b><span>${note}</span></article>`;
    }
    return `<article><img src="${asset(item.src)}" alt="${item.alt || `${brand.name} ${label}`}" loading="lazy" decoding="async"><b>${label}</b><span>${note}</span></article>`;
  }).join("")}</div>`;
}

function enhanceImages(root = document) {
  root.querySelectorAll("img").forEach((img, index) => {
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    if (index > 2 && !img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
  });
}

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("meta") ? "meta" : "link");
    if (selector.includes("property=")) el.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
    if (selector.includes("name=")) el.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
    if (selector.startsWith("link")) el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function applyBrandSeo(brand) {
  const title = `${brand.name} 브랜드 매거진 | 브랜드 아틀라스`;
  const description = short(`${brand.definition} ${brand.insight || ""}`, 155);
  const related = relatedBrands(brand, 6);
  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:image"]', "content", absoluteUrl(asset(brand.image).replace(/^\.\.\//, "")));
  setMeta('meta[property="og:url"]', "content", `${SITE_ORIGIN}/pages/brand-artemio.html?brand=${encodeURIComponent(brand.slug)}`);
  setMeta('link[rel="canonical"]', "href", `${SITE_ORIGIN}/pages/brand-artemio.html?brand=${encodeURIComponent(brand.slug)}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: absoluteUrl(asset(brand.image).replace(/^\.\.\//, "")),
    url: `${SITE_ORIGIN}/pages/brand-artemio.html?brand=${encodeURIComponent(brand.slug)}`,
    inLanguage: "ko-KR",
    about: {
      "@type": "Brand",
      name: brand.name,
      alternateName: brand.nameEn,
      category: brand.industry,
      foundingDate: brand.timeline?.[0]?.year ? String(brand.timeline[0].year) : undefined,
    },
    mentions: related.map(b => ({
      "@type": "Brand",
      name: b.name,
      alternateName: b.nameEn,
      category: b.industry,
      url: new URL(brandUrl(b), location.href).href,
    })),
  };
  let script = document.getElementById("brand-jsonld");
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "brand-jsonld";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

function renderBrandMagazine(brand) {
  const logo = `<div class="brand-logo-panel${brand.logo ? "" : " is-wordmark"}">${logoMarkup(brand)}</div>`;
  const proseCell = (classes, id, title, key) => {
    const body = sectionBody(brand, key);
    if (!body.trim()) return "";
    const contentClass = id === "insights" ? "quote" : "prose";
    return `<section class="${classes}" id="${id}"><h2>${title}</h2><div class="${contentClass}">${prose(body, brand)}</div></section>`;
  };
  const metaCell = (id, title, key) => {
    const body = sectionBody(brand, key);
    if (!body.trim()) return "";
    return `<section class="cell compact" id="${id}"><h2>${title}</h2>${metaList(body)}</section>`;
  };
  const cells = [
    ["overview", "한눈에 보는 브랜드", proseCell("cell feature wide", "overview", "한눈에 보는 브랜드", "overview")],
    ["insights", "브랜드 관점", proseCell("cell insight-cell", "insights", "브랜드 관점", "insights")],
    ["origin", "시작과 성장", proseCell("cell story", "origin", "시작과 성장", "origin")],
    ["identity", "브랜드 아이덴티티", proseCell("cell story", "identity", "브랜드 아이덴티티", "identity")],
    ["external", "확장 지식", proseCell("cell story wide", "external", "확장 지식", "external")],
    ["products", "제품과 서비스", proseCell("cell compact", "products", "제품과 서비스", "products")],
    ["people", "사람들", metaCell("people", "사람들", "people")],
    ["current", "현재 상태", metaCell("current", "현재 상태", "current")],
    ["timeline", "타임라인", `<section class="cell wide timeline-cell" id="timeline"><h2>타임라인</h2>${timelineRail(brand.timeline || [])}</section>`],
    ["bici", "BI/CI 변천사", `<section class="cell wide" id="bici"><h2>BI/CI 변천사</h2>${logoArchive(brand)}</section>`],
    ["related", "함께 읽을 브랜드", relatedLinks(brand)],
  ].filter(([, , html]) => html && html.trim());
  const tabs = cells.map(([id, title], index) => `<a class="${index === 0 ? "active" : ""}" href="#${id}">${title}</a>`).join("");
  return `<section class="brand-hero">
    <div class="info"><p>홈 > 브랜드 매거진 > ${brand.name}</p><h1>${brand.name}</h1><p class="lead">${short(brand.definition, 260)}</p><hr><p>산업 분야 <b>${brand.industry}</b> · 공개 등급 <b>${tierLabel(brand.tier)}</b> · 브랜드 평가 <b>${brand.rating} ★</b></p></div>
    <img class="photo" src="${asset(brand.image)}" alt="${brand.name} 브랜드 이미지" decoding="async">
    ${logo}
  </section>
  <nav class="tabs">${tabs}</nav>
  <section class="mag-grid">
    ${cells.map(([, , html]) => html).join("")}
  </section>`;
}

function renderBrandNotFound(slug, allBrands = []) {
  const rows = searchBrands(allBrands, slug, 6);
  return `<section class="page-title"><div><p class="kicker">BRAND NOT FOUND</p><h1>브랜드를 찾을 수 없습니다</h1><p class="lead">요청한 브랜드 주소 <b>${slug || ""}</b>와 정확히 일치하는 항목이 없습니다. 아래 후보를 확인하거나 검색으로 이동하세요.</p></div></section>
  <section class="panel"><h2>관련 후보</h2><div class="card-row compact-cards">${rows.map(brandCard).join("") || "<p>관련 후보가 없습니다.</p>"}</div></section>`;
}



// Defensive guard: if the data file fails to load (network/deploy issue), the
// inline page scripts would otherwise leave a blank page. Surface a readable
// message instead of silent failure.
window.addEventListener("unhandledrejection", event => {
  const reason = String(event.reason || "");
  // Cover Chrome ("Failed to fetch"), Firefox ("NetworkError"), Safari ("Load
  // failed"), and JSON parse failures on a truncated/non-JSON response.
  if (!/brand-atlas\.json|Failed to fetch|NetworkError|Load failed|SyntaxError|Unexpected/.test(reason)) return;
  const main = document.querySelector("main") || document.body;
  if (main.querySelector(".data-error")) return;
  const box = document.createElement("div");
  box.className = "data-error";
  box.setAttribute("role", "alert");
  box.innerHTML = '<div class="wrap" style="padding:60px 20px;text-align:center">'
    + '<h1 style="font-size:28px;margin:0 0 12px">데이터를 불러오지 못했습니다</h1>'
    + '<p style="color:#6b7280">잠시 후 다시 시도하거나 새로고침해 주세요.</p>'
    + '<p style="margin-top:18px"></p></div>';
  // Build the reload control via DOM so no javascript: URI is needed (CSP-safe).
  const retry = document.createElement("button");
  retry.className = "chip";
  retry.type = "button";
  retry.textContent = "새로고침";
  retry.addEventListener("click", () => location.reload());
  box.querySelector("p:last-child").appendChild(retry);
  main.prepend(box);
});
