// Add major Korean brands MISSING from the DB, using ONLY deep-research
// 3-vote-verified facts (no hallucination). Refuted/0-vote claims (Hyundai 1967,
// LG 1947, SK, Coupang founding details) are NOT asserted — for those brands only
// the verified Interbrand 2025 ranking + a neutral industry descriptor is stated.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;

// industry id -> Korean label
const IND = {
  "beauty-personal-care": "뷰티·퍼스널케어",
  "food-beverage": "식음료",
  "technology-electronics": "기술·전자",
  "mobility": "모빌리티",
  "retail-commerce": "리테일·커머스",
};

const NEW = [
  {
    urlSlug: "amorepacific", nameKo: "아모레퍼시픽", nameEn: "Amorepacific",
    domainSlug: "beauty-personal-care", rating: 4.7, web: "https://www.apgroup.com/",
    definition: "아모레퍼시픽(Amorepacific)은 1945년 서성환이 태평양화학공업사로 창업한 한국의 대표 뷰티 기업으로, 2002년 현 사명을 채택했다. 설화수·라네즈·이니스프리·에뛰드·마몽드 등 다수 브랜드를 보유한다.",
    overview: "아모레퍼시픽(Amorepacific)은 한국의 대표 뷰티 기업이다. 1945년 창업자 서성환이 태평양화학공업사로 설립했고, 현 사명 '아모레퍼시픽'은 2002년에 채택했다. 설화수(1997)·라네즈(1994)·이니스프리(2000)·에뛰드(1995)·마몽드(1991) 등 다수의 화장품 브랜드를 거느린다.",
    identity: "아모레퍼시픽은 한국적 헤리티지와 혁신을 결합한 뷰티 기업으로 자리매김해 왔다. 1966년에는 세계 최초의 한방 화장품으로 꼽히는 ABC인삼크림을, 2008년에는 세계 최초의 쿠션 파운데이션(에어쿠션)을 선보였다. 플래그십 럭셔리 브랜드 설화수는 '시간의 흐름에 지지 않는 아름다움'을 콘셉트로 한국 인삼 헤리티지를 현대적으로 해석하며, 라네즈는 프리미엄 스킨케어, 이니스프리는 자연주의 데일리 뷰티로 포지셔닝된다.",
  },
  {
    urlSlug: "lg-household-health-care", nameKo: "LG생활건강", nameEn: "LG H&H",
    domainSlug: "beauty-personal-care", rating: 4.5, web: "https://www.lghnh.com/",
    definition: "LG생활건강(LG H&H Co., Ltd.)은 화장품·생활용품·음료를 아우르는 한국 기업으로, 현 법인은 2001년 LG화학에서 분할 신설됐다.",
    overview: "LG생활건강(영문 법인명 LG H&H Co., Ltd.)은 한국의 생활밀착형 소비재 기업이다. 현재의 법인은 2001년 4월 LG화학에서 분할 신설됐다.",
    identity: "사업은 화장품(Beautiful), 생활용품·퍼스널케어(Healthy), 음료(Refreshing)의 세 부문으로 구성된다. 화장품 부문은 럭셔리·매스 뷰티 브랜드를, 생활용품 부문은 퍼스널케어와 홈케어 제품을, 음료 부문은 코카콜라 코리아와 해태htb 등을 포함한다. 'Healthy & Beautiful'을 슬로건으로 세 부문을 아우르는 구조를 표방한다.",
  },
  {
    urlSlug: "bibigo", nameKo: "비비고", nameEn: "bibigo",
    domainSlug: "food-beverage", rating: 4.5, web: "https://www.cj.co.kr/kr/brands/bibigo",
    definition: "비비고(bibigo)는 CJ제일제당이 2010년 출시한 글로벌 한식 브랜드로, 만두·김치·즉석밥·한식 소스 등 100여 종의 한국 식품을 약 70개국에서 판매한다.",
    overview: "비비고(bibigo)는 CJ제일제당이 2010년 선보인 글로벌 한식 브랜드다. 브랜드명은 '비빔(bibim)'과 '고(go)'를 결합한 것으로, 한식을 세계에 알린다는 지향을 담는다.",
    identity: "비비고는 만두·김치·즉석밥·한식 소스·김·스프링롤 등 100여 종의 한국 식품을 약 70개국에서 판매하는 가공식품 브랜드다. 특히 만두는 글로벌 시장에서 한식 만두를 대표하는 제품군으로 성장해, K-푸드의 세계화를 이끄는 대표 브랜드로 자리 잡았다.",
  },
  {
    urlSlug: "samsung-electronics", nameKo: "삼성전자", nameEn: "Samsung Electronics",
    domainSlug: "technology-electronics", rating: 4.8, web: "https://www.samsung.com/",
    definition: "삼성전자(Samsung Electronics)는 한국을 대표하는 전자·반도체 기업으로, 인터브랜드 2025 베스트 코리아 브랜드 1위(브랜드 가치 약 122.2조 원)에 올랐다.",
    overview: "삼성전자(Samsung Electronics)는 한국을 대표하는 전자·반도체 기업이다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 브랜드 가치 약 122.2조 원으로 1위를 차지했다.",
    identity: "스마트폰·반도체·디스플레이·가전을 아우르는 사업 포트폴리오를 갖춘 글로벌 기업으로, 한국 브랜드 가치 순위에서 압도적 1위를 지키고 있다. 인터브랜드 2025 기준 전년 대비 약 12% 증가한 브랜드 가치를 기록했다.",
  },
  {
    urlSlug: "hyundai-motor", nameKo: "현대자동차", nameEn: "Hyundai Motor",
    domainSlug: "mobility", rating: 4.7, web: "https://www.hyundai.com/",
    definition: "현대자동차(Hyundai Motor)는 한국을 대표하는 자동차 기업으로, 인터브랜드 2025 베스트 코리아 브랜드 2위(브랜드 가치 약 27.9조 원)에 올랐다.",
    overview: "현대자동차(Hyundai Motor)는 한국을 대표하는 자동차 제조 기업이다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 브랜드 가치 약 27.9조 원으로 2위에 올랐다.",
    identity: "한국 자동차 산업을 대표하는 글로벌 완성차 브랜드로, 인터브랜드 2025 기준 전년 대비 약 14.6% 증가한 브랜드 가치를 기록하며 국내 브랜드 순위 2위를 지켰다.",
  },
  {
    urlSlug: "kia", nameKo: "기아", nameEn: "Kia",
    domainSlug: "mobility", rating: 4.6, web: "https://www.kia.com/",
    definition: "기아(Kia)는 한국의 자동차 기업으로, 인터브랜드 2025 베스트 코리아 브랜드 3위(브랜드 가치 약 9.8조 원)에 올랐다.",
    overview: "기아(Kia)는 한국의 대표적 자동차 제조 브랜드다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 브랜드 가치 약 9.8조 원으로 3위에 올랐다.",
    identity: "한국 자동차 산업을 대표하는 완성차 브랜드로, 인터브랜드 2025 기준 전년 대비 약 16.6% 증가한 브랜드 가치를 기록하며 국내 브랜드 순위 3위를 차지했다.",
  },
  {
    urlSlug: "naver", nameKo: "네이버", nameEn: "Naver",
    domainSlug: "technology-electronics", rating: 4.6, web: "https://www.naver.com/",
    definition: "네이버(Naver)는 한국을 대표하는 인터넷·기술 기업으로, 인터브랜드 2025 베스트 코리아 브랜드 4위(브랜드 가치 약 7.9조 원)에 올랐다.",
    overview: "네이버(Naver)는 검색 포털을 기반으로 한 한국의 대표 인터넷·기술 기업이다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 브랜드 가치 약 7.9조 원으로 4위에 올랐다.",
    identity: "한국 인터넷 산업을 대표하는 플랫폼 브랜드로, 인터브랜드 2025 기준 전년 대비 약 8.9% 증가한 브랜드 가치를 기록하며 국내 브랜드 순위 4위를 차지했다.",
  },
  {
    urlSlug: "lg-electronics", nameKo: "LG전자", nameEn: "LG Electronics",
    domainSlug: "technology-electronics", rating: 4.6, web: "https://www.lge.co.kr/",
    definition: "LG전자(LG Electronics)는 한국을 대표하는 전자·가전 기업으로, 인터브랜드 2025 베스트 코리아 브랜드 5위(브랜드 가치 약 7.9조 원)에 올랐다.",
    overview: "LG전자(LG Electronics)는 한국을 대표하는 전자·가전 기업이다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 브랜드 가치 약 7.9조 원으로 5위에 올랐다.",
    identity: "가전과 전자 제품을 아우르는 글로벌 브랜드로, 인터브랜드 2025 기준 전년 대비 약 40.9%라는 큰 폭의 브랜드 가치 성장을 기록하며 국내 브랜드 순위 5위에 올랐다.",
  },
  {
    urlSlug: "coupang", nameKo: "쿠팡", nameEn: "Coupang",
    domainSlug: "retail-commerce", rating: 4.6, web: "https://www.coupang.com/",
    definition: "쿠팡(Coupang)은 한국을 대표하는 이커머스 기업으로, 인터브랜드 2025 베스트 코리아 브랜드에서 처음으로 Top 10(10위)에 진입했다.",
    overview: "쿠팡(Coupang)은 한국의 대표적 전자상거래·디지털 유통 기업이다. 인터브랜드의 2025 베스트 코리아 브랜드 평가에서 처음으로 Top 10에 진입하며 10위에 올랐다.",
    identity: "빠른 배송을 앞세운 한국 이커머스를 대표하는 브랜드로, 인터브랜드 2025에서 사상 처음으로 국내 브랜드 가치 Top 10에 진입한 점이 주목받았다.",
  },
];

const indCount = {};
let added = 0;
for (const n of NEW) {
  if (existing.has(n.urlSlug)) { console.log("SKIP exists:", n.urlSlug); continue; }
  const b = {
    id: nextId++,
    slug: n.urlSlug,
    urlSlug: n.urlSlug,
    name: n.nameKo,
    nameKo: n.nameKo,
    nameEn: n.nameEn,
    definition: n.definition,
    summary: n.definition,
    industry: IND[n.domainSlug],
    domainSlug: n.domainSlug,
    tier: "C_source_backed",
    rating: n.rating,
    image: "",
    logo: "",
    insight: n.identity,
    logoHistory: [],
    sections: {
      overview: { title: "개요", body: n.overview },
      identity: { title: "브랜드 정체성", body: n.identity },
    },
    timeline: [],
    publicReady: true,
    displayPriority: "normal",
    officialWebsite: n.web,
  };
  all.push(b);
  indCount[n.domainSlug] = (indCount[n.domainSlug] || 0) + 1;
  added++;
  console.log("ADD", n.urlSlug, "(" + n.nameKo + ")", "->", n.domainSlug);
}

// update industry counts + stats
for (const ind of data.industries || []) {
  if (indCount[ind.id]) ind.count = (Number(ind.count) || 0) + indCount[ind.id];
}
if (data.stats) data.stats.brands = all.length;

fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nadded ${added} Korean brands. allBrands now ${all.length}.`);
