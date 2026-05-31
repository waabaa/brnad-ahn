import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFC").replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function commons(file) {
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file).replaceAll("%20", "_")}` : "";
}

function ensureBrand(row) {
  const brands = data.allBrands || [];
  const key = normalize(row.name);
  let brand = brands.find(b => [b.name, b.nameKo, b.nameEn, b.slug].some(v => normalize(v) === key || normalize(v) === normalize(row.nameEn)));
  if (!brand) {
    const id = Math.max(0, ...brands.map(b => Number(b.id) || 0)) + 1;
    brand = {
      id,
      slug: row.slug || slugify(row.name),
      name: row.name,
      nameKo: row.name,
      nameEn: row.nameEn || row.name,
      definition: "",
      summary: "",
      industry: row.industry,
      domainSlug: row.domainSlug,
      tier: "C_source_backed",
      rating: 4.1,
      image: "assets/objects/brand_atlas_logo_mark.png",
      logo: "",
      insight: "",
      logoHistory: [],
      sections: {
        overview: { body: "" },
        insights: { body: "" },
        origin: { body: "" },
        identity: { body: "" },
        external: { body: "" },
        products: { body: "" },
        people: { body: "" },
        current: { body: "" },
      },
      timeline: [],
    };
    brands.push(brand);
  }
  return brand;
}

function setBrand(row) {
  const brand = ensureBrand(row);
  brand.name = row.name;
  brand.nameKo = row.name;
  brand.nameEn = row.nameEn || brand.nameEn || row.name;
  brand.industry = row.industry;
  brand.domainSlug = row.domainSlug;
  brand.definition = row.overview;
  brand.summary = row.overview;
  brand.publicReady = true;
  brand.displayPriority = "normal";
  brand.tier = row.tier || brand.tier || "C_source_backed";
  brand.rating = Math.max(Number(brand.rating || 0), row.rating || 4.2);
  brand.officialWebsite = row.website || brand.officialWebsite || "";
  if (row.logo) {
    brand.logo = row.logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    if (!brand.logoHistory.some(item => item.src === row.logo)) {
      brand.logoHistory.unshift({ src: row.logo, label: "대표 로고", note: "Primary brand mark", alt: `${row.name} logo` });
    }
  }
  if (row.image && (!brand.image || String(brand.image).includes("brand_atlas_logo_mark"))) {
    brand.image = row.image;
  }
  brand.sections = brand.sections || {};
  brand.sections.overview = { body: row.overview };
  brand.sections.origin = { body: row.origin || "" };
  brand.sections.identity = { body: row.identity || "" };
  brand.sections.products = { body: row.products || "" };
  brand.sections.people = { body: row.people || "" };
  brand.sections.current = { body: row.current || "" };
  for (const key of ["insights", "external"]) {
    if (!brand.sections[key]) brand.sections[key] = { body: "" };
  }
  brand.timeline = Array.isArray(brand.timeline) ? brand.timeline : [];
  if (row.year && !brand.timeline.some(item => Number(item.year) === Number(row.year) && /설립|출시|시작/.test(item.description || ""))) {
    brand.timeline.unshift({ year: Number(row.year), brand: row.name, description: `${row.name} 설립 또는 브랜드 시작 시점` });
  }
  return brand;
}

const rows = [
  {
    name: "이마트", nameEn: "emart", domainSlug: "retail-commerce", industry: "리테일·커머스", year: 1993,
    website: "https://company.emart.com/", logo: commons("Emart Logo.svg"), image: commons("E-mart Gwangju branch 20190521 102824.jpg"),
    overview: "이마트는 대한민국의 대형마트와 유통 브랜드입니다. 오프라인 매장, 식품·생활용품 판매, 자체 브랜드 상품을 중심으로 국내 리테일 시장에서 인지도를 쌓았습니다.",
    origin: "이마트는 1993년 대한민국에서 시작된 대형마트 브랜드로 정리됩니다.",
    identity: "이마트의 브랜드 아이덴티티는 대형 매장, 생활필수품 접근성, 가격 경쟁력, 자체 상품군에서 형성됩니다.",
    products: "주요 제품·서비스: 대형마트, 식품, 생활용품, 자체 브랜드 상품, 오프라인 리테일",
    current: "공식 웹사이트: https://company.emart.com/; 국가: 대한민국; 산업: 대형마트; 리테일·커머스",
  },
  {
    name: "JYP 엔터테인먼트", nameEn: "JYP Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 1996,
    website: "https://www.jype.com", logo: commons("JYP Entertainment Logo.svg"),
    overview: "JYP 엔터테인먼트는 대한민국의 종합 엔터테인먼트 회사입니다. 음악 제작, 아티스트 매니지먼트, 공연, 글로벌 팬덤 비즈니스를 중심으로 성장했습니다.",
    origin: "JYP 엔터테인먼트는 1996년 설립된 한국 엔터테인먼트 기업입니다.",
    identity: "JYP 엔터테인먼트의 정체성은 아티스트 육성 시스템, 음악 제작, 글로벌 팬덤 운영에서 형성됩니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연, 팬덤 콘텐츠",
    current: "공식 웹사이트: https://www.jype.com; 국가: 대한민국; 산업: 엔터테인먼트; 음악",
  },
  {
    name: "SM 엔터테인먼트", nameEn: "SM Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 1995,
    website: "https://www.smentertainment.com/", logo: commons("SM Entertainment Logo.svg"),
    overview: "SM 엔터테인먼트는 대한민국의 엔터테인먼트 회사입니다. K-pop 아티스트 기획, 음악 제작, 공연, 콘텐츠 사업을 중심으로 글로벌 인지도를 구축했습니다.",
    origin: "SM 엔터테인먼트는 1995년 설립된 한국 엔터테인먼트 기업입니다.",
    identity: "SM 엔터테인먼트의 브랜드 정체성은 아이돌 기획 시스템, 음악 세계관, 팬덤 플랫폼, 공연 콘텐츠에서 형성됩니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연, 팬덤 콘텐츠, IP 사업",
    current: "공식 웹사이트: https://www.smentertainment.com/; 국가: 대한민국; 산업: 엔터테인먼트; K-pop",
  },
  {
    name: "YG 엔터테인먼트", nameEn: "YG Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 1995,
    website: "https://ygfamily.com/", logo: commons("YG Entertainment Logo.svg"),
    overview: "YG 엔터테인먼트는 대한민국의 종합 엔터테인먼트 회사입니다. 음악 제작, 아티스트 매니지먼트, 공연, 영상 콘텐츠를 중심으로 K-pop 시장에서 인지도를 쌓았습니다.",
    origin: "YG 엔터테인먼트는 1995년 설립된 한국 엔터테인먼트 기업입니다.",
    identity: "YG 엔터테인먼트의 정체성은 힙합 기반 음악 색채, 아티스트 개성, 글로벌 팬덤 콘텐츠에서 형성됩니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연, 영상 콘텐츠",
    current: "공식 웹사이트: https://ygfamily.com/; 국가: 대한민국; 산업: 엔터테인먼트; 음악",
  },
  {
    name: "큐브엔터테인먼트", nameEn: "Cube Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 2006,
    website: "http://www.cubeent.co.kr/",
    overview: "큐브엔터테인먼트는 대한민국의 엔터테인먼트 회사입니다. 음악 제작, 아티스트 매니지먼트, 공연과 팬덤 콘텐츠를 중심으로 운영됩니다.",
    origin: "큐브엔터테인먼트는 2006년 설립된 한국 엔터테인먼트 기업입니다.",
    identity: "큐브엔터테인먼트의 정체성은 아티스트 기획, 음악 제작, 팬덤 커뮤니케이션에서 형성됩니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연, 팬덤 콘텐츠",
    current: "공식 웹사이트: http://www.cubeent.co.kr/; 국가: 대한민국; 산업: 엔터테인먼트; 음악",
  },
  {
    name: "울림엔터테인먼트", nameEn: "Woollim Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 2003,
    website: "https://www.woolliment.com/", logo: commons("Woollim Entertainment.png"),
    overview: "울림엔터테인먼트는 대한민국의 음악 레이블이자 엔터테인먼트 회사입니다. 아티스트 매니지먼트와 음악 제작을 중심으로 운영됩니다.",
    origin: "울림엔터테인먼트는 2003년 시작된 한국 엔터테인먼트 브랜드입니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연 콘텐츠",
    current: "공식 웹사이트: https://www.woolliment.com/; 국가: 대한민국; 산업: 엔터테인먼트; 음악",
  },
  {
    name: "플레디스엔터테인먼트", nameEn: "Pledis Entertainment", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 2007,
    website: "https://www.pledis.co.kr", logo: commons("Pledis Entertainment logo.png"),
    overview: "플레디스엔터테인먼트는 대한민국의 연예 기획사입니다. 음악 제작, 아티스트 매니지먼트, 공연과 팬덤 콘텐츠를 중심으로 운영됩니다.",
    origin: "플레디스엔터테인먼트는 2007년 설립된 한국 엔터테인먼트 기업입니다.",
    products: "주요 제품·서비스: 음악 제작, 아티스트 매니지먼트, 공연, 팬덤 콘텐츠",
    current: "공식 웹사이트: https://www.pledis.co.kr; 국가: 대한민국; 산업: 엔터테인먼트; 음악",
  },
  {
    name: "JTBC", nameEn: "JTBC", domainSlug: "media-entertainment", industry: "미디어·엔터테인먼트", year: 2011,
    website: "https://jtbc.joins.com/", logo: commons("JTBC logo.svg"), image: commons("JTBC Tower.jpg"),
    overview: "JTBC는 대한민국의 종합편성 방송 채널이자 미디어 브랜드입니다. 뉴스, 드라마, 예능, 디지털 콘텐츠를 중심으로 시청자와 만납니다.",
    origin: "JTBC는 2011년 개국한 대한민국의 종합편성 채널입니다.",
    identity: "JTBC의 브랜드 정체성은 방송 콘텐츠, 뉴스 신뢰도, 드라마·예능 IP, 디지털 시청 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 방송 채널, 뉴스, 드라마, 예능, 디지털 콘텐츠",
    current: "공식 웹사이트: https://jtbc.joins.com/; 국가: 대한민국; 산업: 방송; 미디어",
  },
  {
    name: "SK텔레콤", nameEn: "SK Telecom", domainSlug: "technology-electronics", industry: "기술·전자", year: 1984,
    website: "https://www.sktelecom.com/", logo: commons("SK Telecom Logo.svg"), image: commons("SK Telecom head office.JPG"),
    overview: "SK텔레콤은 대한민국의 이동통신과 ICT 브랜드입니다. 이동통신, 네트워크, AI, 데이터 서비스, 디지털 플랫폼을 중심으로 사업을 확장해왔습니다.",
    origin: "SK텔레콤은 1984년 시작된 한국 통신 기업으로 정리됩니다.",
    identity: "SK텔레콤의 정체성은 통신 인프라, 모바일 서비스, 네트워크 기술, 디지털 플랫폼 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 이동통신, 5G 네트워크, AI 서비스, 데이터 서비스, 디지털 플랫폼",
    current: "공식 웹사이트: https://www.sktelecom.com/; 국가: 대한민국; 산업: 통신; ICT; 기술",
  },
  {
    name: "뚜레쥬르", nameEn: "Tous les Jours", domainSlug: "food-beverage", industry: "식음료", year: 1997,
    website: "https://www.tlj.co.kr/",
    overview: "뚜레쥬르는 대한민국의 베이커리 프랜차이즈 브랜드입니다. 빵, 케이크, 샌드위치, 음료와 매장 경험을 중심으로 운영됩니다.",
    origin: "뚜레쥬르는 1997년 시작된 한국 베이커리 브랜드입니다.",
    identity: "뚜레쥬르의 브랜드 정체성은 일상 베이커리, 매장 접근성, 신선한 제품 이미지에서 형성됩니다.",
    products: "주요 제품·서비스: 빵, 케이크, 샌드위치, 커피, 베이커리 매장",
    current: "공식 웹사이트: https://www.tlj.co.kr/; 국가: 대한민국; 산업: 베이커리; 프랜차이즈; 식음료",
  },
  {
    name: "롯데백화점", nameEn: "Lotte Department Store", domainSlug: "retail-commerce", industry: "리테일·커머스", year: 1979,
    website: "http://store.lotteshopping.com/",
    overview: "롯데백화점은 대한민국의 백화점 리테일 브랜드입니다. 패션, 식품, 명품, 생활용품, 문화 공간을 결합한 오프라인 유통 경험을 제공합니다.",
    origin: "롯데백화점은 1979년 시작된 한국 백화점 브랜드입니다.",
    identity: "롯데백화점의 정체성은 대형 오프라인 점포, 프리미엄 상품 구성, 쇼핑과 문화 경험의 결합에서 형성됩니다.",
    products: "주요 제품·서비스: 백화점, 패션, 식품관, 명품관, 문화센터, 리테일 서비스",
    current: "공식 웹사이트: http://store.lotteshopping.com/; 국가: 대한민국; 산업: 백화점; 리테일",
  },
  {
    name: "무신사", nameEn: "MUSINSA", domainSlug: "retail-commerce", industry: "리테일·커머스", year: 2001,
    website: "https://www.musinsa.com/",
    overview: "무신사는 한국 패션 플랫폼 브랜드입니다. 온라인 패션 커머스, 브랜드 입점, 자체 콘텐츠, 오프라인 스토어를 통해 국내 디자이너 브랜드와 젊은 소비자를 연결합니다.",
    origin: "무신사는 2001년 온라인 패션 커뮤니티에서 출발해 패션 플랫폼으로 성장했습니다.",
    identity: "무신사의 정체성은 스트리트 패션 커뮤니티, 브랜드 큐레이션, 온라인 커머스, 오프라인 편집 매장 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 온라인 패션 플랫폼, 브랜드 스토어, 편집숍, 패션 콘텐츠, PB·입점 브랜드",
    current: "공식 웹사이트: https://www.musinsa.com/; 국가: 대한민국; 산업: 패션 커머스; 리테일·커머스",
  },
  {
    name: "올리브영", nameEn: "Olive Young", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 1999,
    website: "https://www.oliveyoung.co.kr/",
    overview: "올리브영은 대한민국의 헬스앤뷰티 리테일 브랜드입니다. 화장품, 스킨케어, 건강식품, 퍼스널케어 상품을 큐레이션하며 K뷰티 유통의 대표 접점으로 자리 잡았습니다.",
    origin: "올리브영은 1999년 시작된 한국 헬스앤뷰티 스토어 브랜드입니다.",
    identity: "올리브영의 브랜드 정체성은 K뷰티 큐레이션, 매장 접근성, 빠른 트렌드 반영, 온·오프라인 구매 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 화장품, 스킨케어, 건강식품, 퍼스널케어, 헬스앤뷰티 리테일",
    current: "공식 웹사이트: https://www.oliveyoung.co.kr/; 국가: 대한민국; 산업: 헬스앤뷰티; 뷰티 리테일",
  },
  {
    name: "다이소", nameEn: "Daiso Korea", domainSlug: "retail-commerce", industry: "리테일·커머스",
    website: "https://www.daiso.co.kr/",
    overview: "다이소는 대한민국의 생활용품 균일가 리테일 브랜드입니다. 문구, 주방, 수납, 청소, 뷰티, 식품 등 일상용품을 폭넓게 판매합니다.",
    origin: "다이소는 생활용품 전문점으로 성장한 한국 리테일 브랜드입니다.",
    identity: "다이소의 정체성은 생활밀착형 상품, 낮은 가격대, 빠른 상품 회전, 높은 매장 접근성에서 형성됩니다.",
    products: "주요 제품·서비스: 생활용품, 문구, 주방용품, 수납용품, 뷰티 소품, 오프라인 리테일",
    current: "공식 웹사이트: https://www.daiso.co.kr/; 국가: 대한민국; 산업: 생활용품; 리테일",
  },
  {
    name: "젠틀몬스터", nameEn: "Gentle Monster", domainSlug: "fashion-luxury", industry: "패션·럭셔리", year: 2011,
    website: "https://www.gentlemonster.com/",
    overview: "젠틀몬스터는 한국의 아이웨어 브랜드입니다. 선글라스와 안경 제품뿐 아니라 실험적인 플래그십 스토어와 전시형 공간 경험으로 브랜드를 확장했습니다.",
    origin: "젠틀몬스터는 2011년 한국에서 시작된 아이웨어 브랜드입니다.",
    identity: "젠틀몬스터의 정체성은 아이웨어 디자인, 공간 연출, 예술적 매장 경험, 글로벌 패션 협업에서 형성됩니다.",
    products: "주요 제품·서비스: 선글라스, 안경, 아이웨어, 플래그십 스토어, 브랜드 협업",
    current: "공식 웹사이트: https://www.gentlemonster.com/; 국가: 대한민국; 산업: 아이웨어; 패션",
  },
  {
    name: "탬버린즈", nameEn: "TAMBURINS", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://www.tamburins.com/",
    overview: "탬버린즈는 한국의 향과 퍼스널케어 브랜드입니다. 핸드크림, 향수, 바디케어 제품과 감각적인 매장 연출을 통해 브랜드 경험을 구축했습니다.",
    origin: "탬버린즈는 향과 퍼스널케어 제품을 중심으로 성장한 한국 브랜드입니다.",
    identity: "탬버린즈의 정체성은 향, 촉감, 패키지, 설치미술형 매장 경험이 결합된 감각적 브랜딩에서 형성됩니다.",
    products: "주요 제품·서비스: 향수, 핸드크림, 바디케어, 퍼스널케어, 플래그십 스토어",
    current: "공식 웹사이트: https://www.tamburins.com/; 국가: 대한민국; 산업: 향수; 퍼스널케어; 뷰티",
  },
  {
    name: "아더에러", nameEn: "ADER ERROR", domainSlug: "fashion-luxury", industry: "패션·럭셔리", year: 2014,
    website: "https://adererror.com/",
    overview: "아더에러는 한국의 패션 브랜드입니다. 그래픽, 유니섹스 실루엣, 공간 경험, 협업 프로젝트를 통해 글로벌 스트리트 패션 시장에서 인지도를 높였습니다.",
    origin: "아더에러는 2014년 한국에서 시작된 패션 브랜드입니다.",
    identity: "아더에러의 정체성은 실험적인 그래픽, 블루 컬러 포인트, 유니섹스 스타일, 공간형 리테일 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 의류, 액세서리, 협업 컬렉션, 플래그십 스토어",
    current: "공식 웹사이트: https://adererror.com/; 국가: 대한민국; 산업: 패션; 스트리트웨어",
  },
  {
    name: "설화수", nameEn: "Sulwhasoo", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 1997,
    website: "https://www.sulwhasoo.com/",
    overview: "설화수는 한국의 럭셔리 스킨케어 브랜드입니다. 한방 원료와 프리미엄 화장품 이미지를 바탕으로 국내외 뷰티 시장에서 인지도를 구축했습니다.",
    origin: "설화수는 1997년 브랜드로 출시된 한국 프리미엄 스킨케어 브랜드입니다.",
    identity: "설화수의 정체성은 한방 원료, 프리미엄 스킨케어, 한국적 미감, 글로벌 럭셔리 뷰티 포지션에서 형성됩니다.",
    products: "주요 제품·서비스: 스킨케어, 세럼, 크림, 에센스, 프리미엄 뷰티",
    current: "공식 웹사이트: https://www.sulwhasoo.com/; 국가: 대한민국; 산업: 스킨케어; 럭셔리 뷰티",
  },
  {
    name: "라네즈", nameEn: "Laneige", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 1994,
    website: "https://www.laneige.com/",
    overview: "라네즈는 한국의 스킨케어와 메이크업 브랜드입니다. 수분 케어와 립 슬리핑 마스크 등 대표 제품을 통해 글로벌 K뷰티 시장에서 인지도를 쌓았습니다.",
    origin: "라네즈는 1994년 출시된 한국 뷰티 브랜드입니다.",
    identity: "라네즈의 정체성은 수분 케어, 깨끗한 패키지 톤, 글로벌 K뷰티 접근성에서 형성됩니다.",
    products: "주요 제품·서비스: 스킨케어, 수분 크림, 립 마스크, 메이크업",
    current: "공식 웹사이트: https://www.laneige.com/; 국가: 대한민국; 산업: 스킨케어; 메이크업",
  },
  {
    name: "이니스프리", nameEn: "Innisfree", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 2000,
    website: "https://www.innisfree.com/",
    overview: "이니스프리는 한국의 자연주의 뷰티 브랜드입니다. 제주 원료 이미지, 스킨케어, 메이크업 제품을 중심으로 K뷰티 시장에서 성장했습니다.",
    origin: "이니스프리는 2000년 출시된 한국 뷰티 브랜드입니다.",
    identity: "이니스프리의 정체성은 자연 원료 이미지, 제주 지역성, 접근 가능한 스킨케어 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 스킨케어, 메이크업, 마스크팩, 자연주의 뷰티 제품",
    current: "공식 웹사이트: https://www.innisfree.com/; 국가: 대한민국; 산업: 스킨케어; 메이크업",
  },
  {
    name: "닥터자르트", nameEn: "Dr.Jart+", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 2005,
    website: "https://www.drjart.com/",
    overview: "닥터자르트는 한국의 더마 코스메틱 브랜드입니다. 시카페어, 세라마이딘 등 기능성 스킨케어 제품을 중심으로 글로벌 K뷰티 시장에서 인지도를 높였습니다.",
    origin: "닥터자르트는 2005년 한국에서 시작된 더마 코스메틱 브랜드입니다.",
    identity: "닥터자르트의 정체성은 피부 고민 솔루션, 더마 코스메틱 포지션, 기능성 스킨케어 제품군에서 형성됩니다.",
    products: "주요 제품·서비스: 더마 스킨케어, 시카페어, 세라마이딘, 마스크팩",
    current: "공식 웹사이트: https://www.drjart.com/; 국가: 대한민국; 산업: 더마 코스메틱; 스킨케어",
  },
  {
    name: "라운드랩", nameEn: "ROUND LAB", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://roundlab.com/",
    overview: "라운드랩은 한국의 스킨케어 브랜드입니다. 독도 토너 등 지역 원료와 순한 사용감을 내세운 제품군으로 K뷰티 소비자에게 알려졌습니다.",
    origin: "라운드랩은 한국 스킨케어 시장에서 성장한 뷰티 브랜드입니다.",
    identity: "라운드랩의 정체성은 순한 스킨케어, 지역 원료 스토리, 일상적인 피부 관리 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 토너, 크림, 선케어, 스킨케어",
    current: "공식 웹사이트: https://roundlab.com/; 국가: 대한민국; 산업: 스킨케어; K뷰티",
  },
  {
    name: "롬앤", nameEn: "rom&nd", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어", year: 2016,
    website: "https://romand.co.kr/",
    overview: "롬앤은 한국의 색조 화장품 브랜드입니다. 립틴트, 아이섀도, 베이스 메이크업 제품을 중심으로 온라인 뷰티 소비자와 글로벌 K뷰티 시장에서 인지도를 쌓았습니다.",
    origin: "롬앤은 2016년 론칭된 한국 메이크업 브랜드입니다.",
    identity: "롬앤의 정체성은 컬러 큐레이션, 립 제품, 합리적인 가격대, 디지털 중심의 소비자 접점에서 형성됩니다.",
    products: "주요 제품·서비스: 립틴트, 아이섀도, 베이스 메이크업, 색조 화장품",
    current: "공식 웹사이트: https://romand.co.kr/; 국가: 대한민국; 산업: 메이크업; K뷰티",
  },
  {
    name: "달바", nameEn: "d'Alba", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://dalba.co.kr/",
    overview: "달바는 한국의 스킨케어 브랜드입니다. 미스트 세럼과 비건 뷰티 이미지를 중심으로 국내외 K뷰티 시장에서 인지도를 높였습니다.",
    origin: "달바는 한국 스킨케어 시장에서 성장한 뷰티 브랜드입니다.",
    identity: "달바의 정체성은 화이트 트러플 원료 이미지, 미스트 세럼, 비건 뷰티 포지션에서 형성됩니다.",
    products: "주요 제품·서비스: 미스트 세럼, 스킨케어, 선케어, 비건 뷰티 제품",
    current: "공식 웹사이트: https://dalba.co.kr/; 국가: 대한민국; 산업: 스킨케어; K뷰티",
  },
  {
    name: "아누아", nameEn: "Anua", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://anuashop.com/",
    overview: "아누아는 한국의 스킨케어 브랜드입니다. 어성초 토너 등 진정 케어 제품을 중심으로 K뷰티 소비자 접점을 넓혔습니다.",
    origin: "아누아는 한국 스킨케어 시장에서 성장한 뷰티 브랜드입니다.",
    identity: "아누아의 정체성은 순한 성분, 피부 진정, 토너 중심 제품 경험에서 형성됩니다.",
    products: "주요 제품·서비스: 토너, 앰플, 크림, 스킨케어",
    current: "공식 웹사이트: https://anuashop.com/; 국가: 대한민국; 산업: 스킨케어; K뷰티",
  },
  {
    name: "조선미녀", nameEn: "Beauty of Joseon", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://beautyofjoseon.com/",
    overview: "조선미녀는 한국 전통 미감과 스킨케어 제품을 결합한 K뷰티 브랜드입니다. 선크림, 세럼, 클렌징 제품으로 글로벌 소비자에게 알려졌습니다.",
    origin: "조선미녀는 한국적 이미지와 스킨케어 제품을 중심으로 성장한 뷰티 브랜드입니다.",
    identity: "조선미녀의 정체성은 한국적 미감, 한방 원료 이미지, 글로벌 K뷰티 접근성에서 형성됩니다.",
    products: "주요 제품·서비스: 선크림, 세럼, 클렌징, 스킨케어",
    current: "공식 웹사이트: https://beautyofjoseon.com/; 국가: 대한민국; 산업: 스킨케어; K뷰티",
  },
  {
    name: "티르티르", nameEn: "TIRTIR", domainSlug: "beauty-personal-care", industry: "뷰티·퍼스널케어",
    website: "https://tirtir.co.kr/",
    overview: "티르티르는 한국의 뷰티 브랜드입니다. 쿠션 파운데이션과 스킨케어 제품을 중심으로 국내외 K뷰티 소비자에게 알려졌습니다.",
    origin: "티르티르는 한국 뷰티 시장에서 성장한 브랜드입니다.",
    identity: "티르티르의 정체성은 베이스 메이크업, 쿠션 제품, 글로벌 온라인 소비자 접점에서 형성됩니다.",
    products: "주요 제품·서비스: 쿠션 파운데이션, 스킨케어, 메이크업",
    current: "공식 웹사이트: https://tirtir.co.kr/; 국가: 대한민국; 산업: 메이크업; 스킨케어",
  },
  {
    name: "스파오", nameEn: "SPAO", domainSlug: "fashion-luxury", industry: "패션·럭셔리",
    website: "https://spao.elandmall.co.kr/",
    overview: "스파오는 대한민국의 SPA 패션 브랜드입니다. 베이식 의류, 캐주얼웨어, 협업 상품을 중심으로 대중적인 패션 리테일 경험을 제공합니다.",
    origin: "스파오는 한국 SPA 패션 시장에서 성장한 브랜드입니다.",
    identity: "스파오의 정체성은 합리적인 가격대, 베이식 캐주얼, 캐릭터 협업, 넓은 매장 접근성에서 형성됩니다.",
    products: "주요 제품·서비스: 캐주얼 의류, 베이식웨어, 협업 상품, 패션 리테일",
    current: "공식 웹사이트: https://spao.elandmall.co.kr/; 국가: 대한민국; 산업: SPA 패션; 의류",
  },
  {
    name: "탑텐", nameEn: "TOPTEN10", domainSlug: "fashion-luxury", industry: "패션·럭셔리",
    website: "https://www.topten10mall.com/",
    overview: "탑텐은 대한민국의 SPA 패션 브랜드입니다. 베이식 의류와 캐주얼웨어를 중심으로 합리적인 가격대의 일상 패션을 제공합니다.",
    origin: "탑텐은 한국 SPA 패션 시장에서 성장한 의류 브랜드입니다.",
    identity: "탑텐의 정체성은 베이식웨어, 가격 접근성, 일상 캐주얼, 전국 매장 기반 리테일에서 형성됩니다.",
    products: "주요 제품·서비스: 티셔츠, 니트, 아우터, 캐주얼 의류, SPA 패션",
    current: "공식 웹사이트: https://www.topten10mall.com/; 국가: 대한민국; 산업: SPA 패션; 의류",
  },
  {
    name: "코오롱스포츠", nameEn: "Kolon Sport", domainSlug: "sports-outdoor", industry: "스포츠·아웃도어",
    website: "https://www.kolonsport.com/",
    overview: "코오롱스포츠는 대한민국의 아웃도어 브랜드입니다. 등산복, 재킷, 신발, 캠핑 관련 제품을 중심으로 국내 아웃도어 시장에서 인지도를 쌓았습니다.",
    origin: "코오롱스포츠는 한국 아웃도어 시장에서 성장한 스포츠·아웃도어 브랜드입니다.",
    identity: "코오롱스포츠의 정체성은 산악 활동, 기능성 의류, 아웃도어 라이프스타일, 장기적인 브랜드 헤리티지에서 형성됩니다.",
    products: "주요 제품·서비스: 아웃도어 의류, 등산화, 재킷, 캠핑 용품, 라이프스타일웨어",
    current: "공식 웹사이트: https://www.kolonsport.com/; 국가: 대한민국; 산업: 아웃도어; 스포츠웨어",
  },
  {
    name: "블랙야크", nameEn: "Black Yak", domainSlug: "sports-outdoor", industry: "스포츠·아웃도어",
    website: "https://www.blackyak.com/",
    overview: "블랙야크는 대한민국의 아웃도어 브랜드입니다. 등산복, 기능성 의류, 신발, 산악 활동 제품을 중심으로 국내외 아웃도어 시장에서 브랜드를 구축했습니다.",
    origin: "블랙야크는 한국 아웃도어 시장에서 성장한 브랜드입니다.",
    identity: "블랙야크의 정체성은 산악 활동, 기능성 소재, 등산 문화, 아웃도어 라이프스타일에서 형성됩니다.",
    products: "주요 제품·서비스: 아웃도어 의류, 등산화, 배낭, 기능성 장비",
    current: "공식 웹사이트: https://www.blackyak.com/; 국가: 대한민국; 산업: 아웃도어; 스포츠웨어",
  },
];

let updated = 0;
for (const row of rows) {
  setBrand(row);
  updated += 1;
}

for (const industry of data.industries || []) {
  const brands = (data.allBrands || []).filter(b => b.domainSlug === industry.id);
  industry.count = brands.length;
  industry.examples = brands
    .filter(b => b.publicReady !== false)
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 3)
    .map(b => b.name);
}

data.stats = data.stats || {};
data.stats.brands = (data.allBrands || []).length;
data.stats.magazineBrands = (data.allBrands || []).length;
data.stats.aTier = (data.allBrands || []).filter(b => String(b.tier || "").startsWith("A_")).length;
data.stats.images = (data.allBrands || []).filter(b => b.image && !String(b.image).includes("brand_atlas_logo_mark")).length;

data.domesticPush = {
  updated,
  updatedAt: new Date().toISOString(),
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.domesticPush, null, 2));
