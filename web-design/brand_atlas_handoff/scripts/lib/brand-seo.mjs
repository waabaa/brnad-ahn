// Shared SEO metadata derivation for brand pages, category/country hubs and sitemaps.
//
// Hard rule (inherited from the project's no-hallucination policy): every value here is
// EXTRACTED from existing brand data — never invented. If a field is missing we omit the
// clause rather than guessing. Korean readings are only used when they already appear in
// the data (`name`/`nameKo`) or in the opening "한글명(영문명)는 …" pattern of `definition`.

export const ORIGIN = "https://brandatlas.co.kr";

const HANGUL = /[가-힣]/;
const LATIN = /[A-Za-z]/;

// "코치넬레(Coccinelle)는 1978년 …" → ["코치넬레", "Coccinelle"]
const KO_EN_LEAD = /^([가-힣][가-힣A-Za-z0-9·&'’\s.\-]*?)\s*\(([^)]{1,60})\)\s*(?:는|은|이|가)\s/;
// "노스페이스는 1966년 …" (괄호 없는 한글 리드)
const KO_LEAD = /^([가-힣][가-힣A-Za-z0-9·&'’\s.\-]{0,30}?)\s*(?:는|은|이|가)\s/;

/** 데이터로 확인되는 한글 표기. 없으면 null (음차 생성 금지). */
export function koreanName(brand) {
  if (HANGUL.test(String(brand.name || ""))) return String(brand.name).trim();
  if (HANGUL.test(String(brand.nameKo || ""))) return String(brand.nameKo).trim();
  const def = String(brand.definition || brand.summary || "");
  const m = KO_EN_LEAD.exec(def);
  if (m) return m[1].trim();
  const m2 = KO_LEAD.exec(def);
  // 괄호 없는 경우는 오탐(일반 명사로 시작하는 문장) 위험이 있어 길이를 제한한다.
  if (m2 && m2[1].length <= 12) return m2[1].trim();
  return null;
}

/** 영문/원어 표기. 없으면 null. */
export function latinName(brand) {
  for (const v of [brand.nameEn, brand.name, brand.nameKo]) {
    const s = String(v || "").trim();
    if (s && LATIN.test(s) && !HANGUL.test(s)) return s;
  }
  const m = KO_EN_LEAD.exec(String(brand.definition || ""));
  if (m && LATIN.test(m[2]) && !HANGUL.test(m[2])) return m[2].trim();
  return null;
}

/** 표시용 제목 앞머리: "코치넬레(Coccinelle)" 또는 단일 표기. */
export function displayName(brand) {
  const ko = koreanName(brand);
  const en = latinName(brand);
  if (ko && en && ko.toLowerCase() !== en.toLowerCase()) return `${ko}(${en})`;
  return ko || en || String(brand.name || "").trim();
}

/** h1용 한/영 병기 마크업. 병기할 영문이 없으면 브랜드명 단독. */
export function headingMarkup(brand, esc) {
  const ko = koreanName(brand);
  const en = latinName(brand);
  if (ko && en && ko.toLowerCase() !== en.toLowerCase()) {
    return `${esc(ko)} <span class="h1-en">${esc(en)}</span>`;
  }
  return esc(ko || en || brand.name || "");
}

// ─────────────────────────────────────────────────────────────────────────────
// 국가·설립연도는 `country` / `foundedYear` 필드를 쓰지 않는다.
//
// 2026-08-15 감사에서 두 필드가 신뢰 불가로 확인됐다. `country`는 설립국이 아니라
// 현 소유주 국적이 섞여 있고(구찌="프랑스"/케링, 아크테릭스="중국"/안타스포츠,
// 코치넬레="한국"/이랜드) 그와 무관한 오류도 있다(롤렉스="영국", 지멘스="러시아",
// 하인즈="한국"). definition 대조 시 명시적 불일치 161건, 검증 불가 418건.
// `foundedYear`/timeline 최소연도도 모기업 창업연도가 섞여 281건 불일치
// (말보로=1847 ← 실제 브랜드 도입 1924, 아디다스=1926 ← 1949).
//
// 따라서 사람이 검수한 `definition` 문장만을 근거로 삼고, 근거가 없으면 생략한다.
// 커버리지가 줄더라도 사전의 신뢰도가 우선이다.
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRY_NAMES = [
  "대한민국", "한국", "미국", "영국", "독일", "프랑스", "일본", "이탈리아", "네덜란드",
  "호주", "뉴질랜드", "캐나다", "스웨덴", "스페인", "스위스", "핀란드", "노르웨이",
  "러시아", "벨기에", "덴마크", "오스트리아", "브라질", "중국", "폴란드", "대만",
  "인도", "멕시코", "아일랜드", "포르투갈", "그리스", "터키", "튀르키예", "남아프리카공화국",
  "아르헨티나", "싱가포르", "홍콩", "태국", "베트남", "체코", "헝가리", "이스라엘",
  "자메이카", "아이슬란드", "칠레", "말레이시아", "인도네시아", "필리핀", "우크라이나",
];
const COUNTRY_ALIAS = { 대한민국: "한국", 튀르키예: "터키" };
const countryAlt = COUNTRY_NAMES.join("|");

// 기원을 나타내는 강한 문맥만 채택한다.
// `guard: false` — 설립 동사가 패턴 안에 이미 있어 기원이 확정되므로 소유 문맥 검사를
//   하지 않는다("미국에서 창립한 VF 코퍼레이션 산하의"에서 미국을 버리면 안 된다).
// `guard: true`  — "…의 브랜드" 류는 소유 주체를 가리킬 수 있어 앞쪽 문맥을 확인한다.
const ORIGIN_PATTERNS = [
  { re: new RegExp(`(${countryAlt})\\s*(?:[가-힣A-Za-z0-9]+\\s*){0,3}?(?:에서|에)\\s*(?:설립|창립|창업|시작|출발|탄생)`), guard: false },
  { re: new RegExp(`(${countryAlt})\\s*(?:[가-힣]+(?:주|시|현)?\\s*){0,2}?에\\s*본사`), guard: true },
  { re: new RegExp(`(${countryAlt})\\s*의\\s*[^,.]{0,24}?(?:브랜드|기업|회사|레이블|제조사|그룹|백화점|항공사|소매|유통)`), guard: true },
  { re: new RegExp(`(${countryAlt})\\s*(?:최대|최초|대표)\\s*의?\\s*[^,.]{0,20}?(?:브랜드|기업|회사)`), guard: true },
];
// 소유·유통 문맥에서 등장한 국가는 기원이 아니다("한국 이랜드그룹에 인수된").
const OWNERSHIP_CONTEXT = /(?:인수|소유|산하|자회사|모기업|진출|수입|판매|합작|편입)/;

/**
 * definition에서 기원 국가를 추출한다. 강한 문맥 패턴만 채택하고,
 * 소유·유통 문맥과 겹치면 버린다. 근거가 없으면 null.
 */
export function countryOf(brand) {
  const def = String(brand.definition || brand.summary || "");
  if (!def) return null;
  for (const { re, guard } of ORIGIN_PATTERNS) {
    const m = re.exec(def);
    if (!m) continue;
    if (guard) {
      // 국가명 바로 앞 20자에 소유·유통 어휘가 있으면 기원 근거로 쓰지 않는다.
      const before = def.slice(Math.max(0, m.index - 20), m.index);
      if (OWNERSHIP_CONTEXT.test(before)) continue;
    }
    const raw = m[1];
    return COUNTRY_ALIAS[raw] || raw;
  }
  return null;
}

// "1978년 … 설립", "1966년에 창립", "1924년 도입" 등 연도가 기원 문맥에 붙은 경우만.
// 사이 구간에 마침표를 허용한다 — "1869년 헨리 J. 하인즈가 … 설립한"처럼 약어의
// 마침표가 끼면 문장 경계로 오인해 근거를 놓친다. 40자 제한이 문장 경계 역할을 한다.
const YEAR_ORIGIN = new RegExp(
  `(1[89]\\d{2}|20\\d{2})\\s*년(?:도)?(?:에)?[^다]{0,40}?(?:설립|창립|창업|시작|출발|탄생|선보|도입|런칭|출시|문을)`
);

/** 설립연도 — definition의 기원 문맥 연도만. 없으면 null. */
export function foundedYear(brand) {
  const def = String(brand.definition || brand.summary || "");
  const m = YEAR_ORIGIN.exec(def);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1800 && n <= 2100 ? n : null;
}

/** 실제 BI/CI 이미지 보유 여부 (플레이스홀더 제외). */
export function hasLogoAsset(brand) {
  const rows = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
  const real = rows.filter(r => r && r.src && !String(r.src).includes("brand_atlas_logo_mark"));
  return real.length > 0 || Boolean(brand.logo);
}

const TITLE_SUFFIX = " | 브랜드 아틀라스";
const TITLE_SOFT_MAX = 62; // 접미사 포함. 네이버 노출 한계를 넘어서면 앞쪽 키워드만 남는다.

/**
 * 정보 의도 롱테일을 겨냥한 title.
 * 형태: "코치넬레(Coccinelle) — 이탈리아 1978년 설립 가죽 브랜드 역사·로고 | 브랜드 아틀라스"
 * 수식어는 데이터가 있는 것만 좌→우 순으로 채우고, 길이 초과 시 뒤에서부터 뺀다.
 */
export function buildTitle(brand) {
  const base = displayName(brand);
  const country = countryOf(brand);
  const year = foundedYear(brand);
  // "브랜드·비즈니스"는 첫 토큰이 "브랜드"라 "브랜드 브랜드"가 되므로 산업어를 쓰지 않는다.
  const raw = String(brand.industry || "").split("·")[0].trim();
  const industry = raw && raw !== "브랜드" ? raw : "";

  // "이탈리아 1978년 설립 패션 브랜드" 형태로 한 구를 이루게 조립한다.
  const origin = [country, year ? `${year}년 설립` : ""].filter(Boolean).join(" ");
  const noun = `${industry ? `${industry} ` : ""}브랜드`;

  // 우선순위 순 수식어. 뒤쪽부터 잘라내며 길이를 맞춘다.
  const parts = [];
  if (origin) parts.push(`${origin} ${noun}`);
  else if (industry) parts.push(noun);
  parts.push(hasLogoAsset(brand) ? "역사·로고" : "역사·연혁");

  while (parts.length) {
    const t = `${base} — ${parts.join(" ")}${TITLE_SUFFIX}`;
    if (t.length <= TITLE_SOFT_MAX) return t;
    parts.pop();
  }
  return `${base}${TITLE_SUFFIX}`;
}

/** 80~155자 목표. definition을 축으로 하고 부족하면 insight로 보강한다. */
export function buildDescription(brand) {
  const def = String(brand.definition || brand.summary || "").trim();
  const insight = String(brand.insight || "").trim();
  let d = def;
  if (d.length < 80 && insight) d = `${d} ${insight}`.trim();
  if (d.length < 80) {
    const country = countryOf(brand);
    const year = foundedYear(brand);
    const bits = [];
    if (country) bits.push(`${country}`);
    if (year) bits.push(`${year}년 설립`);
    if (brand.industry) bits.push(`${brand.industry} 브랜드`);
    if (bits.length) d = `${d} ${bits.join(" · ")}.`.trim();
  }
  if (d.length > 155) d = `${d.slice(0, 152).replace(/[\s,·]+$/, "")}…`;
  return d;
}

/** 문장 단위 절삭 — 원문 문장을 그대로 쓰되 길면 첫 문장만. */
function firstSentence(text, max = 220) {
  const s = String(text || "").trim();
  if (!s) return "";
  const m = /^(.+?[.다])\s/.exec(s);
  const out = m ? m[1] : s;
  return out.length > max ? `${out.slice(0, max - 1)}…` : out;
}

/**
 * FAQ — 전부 기존 필드에서 인용/절삭한 것만. 새 사실을 만들지 않는다.
 * 근거가 없는 질문은 생성하지 않으므로 브랜드마다 개수가 다르다.
 */
export function buildFaq(brand) {
  const label = koreanName(brand) || latinName(brand) || String(brand.name || "");
  const faq = [];
  const country = countryOf(brand);
  const year = foundedYear(brand);
  const industry = String(brand.industry || "").trim();

  // foundedLocation도 country/foundedYear와 같은 배치에서 온 미검증 필드라 쓰지 않는다.
  if (country) {
    faq.push({
      q: `${label}는 어느 나라 브랜드인가요?`,
      a: industry ? `${label}는 ${country}의 ${industry} 브랜드입니다.` : `${label}는 ${country}의 브랜드입니다.`,
    });
  }
  if (year) {
    faq.push({ q: `${label}는 언제 설립되었나요?`, a: `${label}는 ${year}년 설립되었습니다.` });
  }
  const identity = firstSentence(brand.sections?.identity?.body);
  if (identity) faq.push({ q: `${label}의 브랜드 아이덴티티는 무엇인가요?`, a: identity });

  const products = firstSentence(brand.sections?.products?.body);
  if (products && products.length >= 18) faq.push({ q: `${label}의 대표 제품은 무엇인가요?`, a: products });

  // current 섹션은 브랜드마다 첫 문장의 주제가 달라(본사 위치 / 소유 구조 / 실적)
  // 질문을 답변에 맞춘다. FAQ 리치리절트에서 질문-답변이 어긋나면 품질 신호가 나빠진다.
  const current = firstSentence(brand.sections?.current?.body);
  if (current) {
    const q = /^본사(는|가)/.test(current) ? `${label}의 본사는 어디에 있나요?`
      : /(인수|소유|산하|모기업|지주)/.test(current) ? `${label}는 어느 기업이 소유하고 있나요?`
      : `${label}는 현재 어떤 상태인가요?`;
    faq.push({ q, a: current });
  }

  const site = brand.facts?.officialWebsite || brand.officialWebsite;
  if (site) faq.push({ q: `${label}의 공식 웹사이트는 어디인가요?`, a: `${label}의 공식 웹사이트는 ${site} 입니다.` });

  return faq.slice(0, 6);
}

/** 본문(헤더/푸터/관련브랜드 제외) 실텍스트 길이 — thin 판정용. */
export function bodyTextLength(brand) {
  const keys = ["overview", "insights", "origin", "identity", "external", "products", "people", "current"];
  let n = 0;
  for (const k of keys) n += String(brand.sections?.[k]?.body || "").trim().length;
  if (!n) n = String(brand.definition || brand.summary || "").length;
  return n;
}

export const THIN_THRESHOLD = 800;

export function isThin(brand) {
  return bodyTextLength(brand) < THIN_THRESHOLD;
}

export const urlSlugOf = (b) => b.urlSlug || b.slug;
export const brandPath = (b) => `/brand/${encodeURIComponent(urlSlugOf(b))}.html`;

export function slugifyAscii(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 정적 자산 캐시버스터. 배포마다 갱신한다. */
export const CSS_V = "20260815a";
