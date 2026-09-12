// 컬렉션(테마) 축 — 산업 12분류와 별개로 한 브랜드가 여러 컬렉션에 속한다.
//
// 분류 체계는 brandarchive.xyz의 컬렉션(archive/brandarchive/structure.json, 2026-05 스냅샷)에서
// 우리 산업 분류에 없는 관점만 가져왔다. 자동 편입 기준은 Wikidata 분류다:
//   p31  — P31/P279* 가 이 클래스 중 하나
//   p452 — P452(업종)가 이 값 중 하나
// QID는 대표 개체의 실제 값으로 확인했다(2026-09-12: OpenAI·Anthropic P452=Q11660, 스타벅스 P31=Q76212517,
// 맥도날드 P31=Q18509232 등). 추측한 QID를 넣지 말 것 — 엉뚱한 브랜드가 편입된다.
// include 는 QID가 없는(또는 Wikidata 분류가 빠진) 레코드를 설명문으로 사람이 확인해 넣은 목록(slug),
// exclude 는 Wikidata 분류상 걸리지만 사람이 보기에 이 컬렉션이 아닌 레코드다(어도비=AI, 파리바게뜨=패스트푸드 등).
//
// lead 는 컬렉션이라는 분류 자체의 설명이다. 개별 브랜드에 대한 사실 주장은 넣지 않는다.

export const COLLECTIONS = [
  {
    // industry: 이 컬렉션은 허브 대신 산업 분류(category/ai.html)로 발행한다 — 편입 브랜드의 domainSlug 를
    // 이 값으로 옮긴다(assign-collections). 같은 목록의 허브가 두 벌 생기지 않도록 컬렉션 허브는 만들지 않는다.
    slug: "ai", name: "AI 브랜드", en: "AI Brands", industry: "ai",
    p452: ["Q11660"], p31: ["Q117246174", "Q870780", "Q115305900", "Q133284163"],
    include: ["cohere", "gemini", "robin", "twelve-labs", "perplexity", "hook-ai", "faculty-ai", "jupi", "analog", "visual-electric", "isomorphic-labs", "crowdworks"],
    exclude: ["adobe"],
    lead: "인공지능을 핵심 사업으로 삼는 기업과, 대화형 AI·대규모 언어 모델처럼 AI 자체가 제품인 서비스를 모았습니다. 이 분야의 브랜드는 대부분 2010년대 이후에 등장해 역사가 짧지만, 기술을 설명하는 대신 사람과 대화하는 인상을 주기 위해 이름과 로고를 설계하는 경우가 많습니다.",
  },
  {
    slug: "fintech", name: "핀테크·결제", en: "Fintech & Payments",
    p452: ["Q16319025", "Q97466005"], p31: ["Q12738586", "Q351764", "Q5038204"],
    include: ["coinbase", "bolt", "bancomat", "nippon-shinpan", "robinhood", "chime", "sendwave", "paysafe", "afterpay", "wise", "paypal", "visa", "mastercard", "monzo", "kakao-pay", "dunamu", "viva-republica", "jobis-villains", "bithumb", "finda", "banksalad", "8percent", "hyundai-card", "shinhan-card", "samsung-card"],
    lead: "카드 네트워크, 결제 대행, 간편결제와 모바일 금융처럼 돈의 이동을 다루는 기술 브랜드를 모았습니다. 은행과 달리 이용자가 브랜드를 결제 버튼이나 앱 아이콘으로 먼저 만나는 경우가 많아, 작은 크기에서도 알아볼 수 있는 단순한 마크가 중요한 분야입니다.",
  },
  {
    slug: "banking", name: "은행·금융", en: "Banking",
    p452: ["Q806718"], p31: ["Q22687"],
    include: ["nationwide", "banamax", "monzo", "lloyds", "hongkongbank", "banco-ita", "citibank", "huntington-bank", "kawasaki-shinkin-bank", "kb-kookmin-bank", "shinhan-financial-group", "hana-financial-group", "woori-financial-group", "nh-financial-group", "citibank-korea", "k-bank", "ibk-industrial-bank-of-korea", "welcome-savings-bank", "hana-bank", "export-import-bank-of-korea", "im-financial-group", "bnk-financial-group"],
    lead: "예금과 대출을 기반으로 하는 은행과 금융지주 브랜드를 모았습니다. 신뢰와 안정감을 전해야 하는 업종이라 오래된 문장(紋章)이나 이니셜을 현대적으로 다듬어 쓰는 경우가 많고, 인수합병을 거치며 이름과 로고가 바뀐 사례도 흔합니다.",
  },
  {
    slug: "energy", name: "에너지", en: "Energy",
    p452: ["Q862571", "Q2316331"], p31: ["Q14941854", "Q1326624", "Q1341478"],
    include: ["aneo", "s-o-paulo-petr-leo", "japan-energy-corporation", "cosmo-oil", "repsol", "elf", "tepco", "pam", "mobil", "agip", "london-electricity-board", "gs-caltex", "s-oil", "gazprom", "korea-electric-power-corporation", "qcells", "korea-gas-corporation", "sk-energy"],
    lead: "석유·가스 기업과 전력 회사, 에너지 기업을 모았습니다. 주유소 간판과 발전소, 요금 고지서처럼 생활 곳곳에서 브랜드가 노출되는 업종으로, 최근에는 친환경 전환을 알리기 위해 이름이나 색을 바꾸는 사례가 이어지고 있습니다.",
  },
  {
    slug: "property", name: "부동산·건설", en: "Property & Construction",
    p452: ["Q695829", "Q385378"], p31: ["Q811930", "Q1660104"],
    include: ["olo-homes", "tembo", "bovis", "hdc-hyundai", "daewoo-enc", "zigbang", "gs-xi", "e-pyeonhansesang", "raemian", "hillstate", "prugio", "r114", "hj-shipbuilding-construction", "ssangyong-engineering-and-construction", "kumho-engineering-and-construction"],
    exclude: ["kangwon-land"],
    lead: "건설사와 부동산 개발·운영 기업을 모았습니다. 회사 이름과 별도로 아파트나 복합단지에 붙이는 주거 브랜드를 따로 운영하는 경우가 많아, 기업 아이덴티티와 상품 브랜드가 어떻게 나뉘는지 비교해 볼 수 있습니다.",
  },
  {
    slug: "airlines", name: "항공사", en: "Airlines",
    p452: [], p31: ["Q46970"],
    include: ["delta", "american-airlines", "swissair", "austrian-airlines", "norwegian", "japan-airlines", "eastern-airlines", "bea", "hughes-airwest", "klm", "israel-airlines", "air-seoul"],
    lead: "여객과 화물을 나르는 항공사를 모았습니다. 항공사 로고는 기체 꼬리날개와 공항 카운터, 탑승권까지 크기와 재질이 전혀 다른 곳에 똑같이 쓰여야 해서, 국가 상징과 속도감을 함께 담는 방식이 오래 발전해 온 분야입니다.",
  },
  {
    slug: "museums", name: "박물관·미술관", en: "Museums & Galleries",
    p452: [], p31: ["Q33506"],
    include: ["the-norton", "mit-museum", "philadelphia-art-museum", "masp", "den-kongelige-samling", "munson", "postmuseum", "art-museum", "the-met", "mus-e-des-beaux-arts-de-montr-al", "vitenskapsmuseet", "whitney-museum-of-american-art", "royal-ontario-museum-rom", "helsinki-city-museum", "natural-history-museum", "philbrook-museum-of-art", "national-museum-of-modern-and-contemporary-art-korea-mmca", "jeju-museum-of-art"],
    lead: "박물관과 미술관의 아이덴티티를 모았습니다. 소장품과 전시가 계속 바뀌는 기관이라 로고 하나보다 전시마다 변주할 수 있는 체계를 설계하는 경우가 많고, 건물 자체가 상징이 되는 곳도 있습니다.",
  },
  {
    slug: "fast-food", name: "패스트푸드", en: "Fast Food",
    p452: ["Q1442415"], p31: ["Q18509232"],
    include: ["mcdonald-s", "kentucky-fried-chicken", "burger-king", "brusco-burger", "tugg", "ouch", "razz-burger", "fuku", "burger-service", "the-mean-tomato", "kyochon", "moms-touch", "bhc-chicken", "seokbong-toast", "gimbap-cheonguk", "sinjeon-tteokbokki", "jaws-tteokbokki", "nene-chicken", "goobne-chicken", "chegajip-yangnyeom-chicken", "ddukki-tteokbokki", "bonggu-s-bapburger", "big-mac", "pelicana-chicken"],
    exclude: ["paris-baguette", "paris-croissant"],
    lead: "햄버거·치킨·피자처럼 빠르게 주문하고 받는 외식 체인을 모았습니다. 멀리서도 매장을 알아보게 해야 하는 업종이라 강한 원색과 굵은 글자, 마스코트를 쓰는 전통이 있고, 최근에는 이를 덜어내는 리브랜딩도 늘었습니다.",
  },
  {
    slug: "cafes", name: "카페·커피", en: "Cafés & Coffee",
    p452: ["Q10302044"], p31: ["Q76212517"],
    include: ["starbucks", "starbucks-korea", "paul-bassett", "simon-l-velt", "mecca-coffee", "sauvage", "shy-bird", "everybird", "dunkin", "brewbird", "blank-street-coffee", "nescafe", "dongsuh-foods", "mega-coffee", "mega-mgc-coffee", "hollys", "hollys-coffee", "angelinus", "london-bagel-museum", "osulloc", "fritz-coffee", "terarosa", "caffe-bene", "tom-n-toms"],
    lead: "커피 전문점 체인과 로스터리 브랜드를 모았습니다. 컵과 슬리브, 매장 인테리어가 곧 브랜드의 얼굴이 되는 업종이라, 로고가 들고 다니는 물건 위에서 어떻게 보이는지가 중요한 분야입니다.",
  },
  {
    slug: "digital-services", name: "디지털 서비스", en: "Digital Products & Services",
    p452: [], p31: ["Q620615", "Q59152282", "Q3220391", "Q2462003"],
    include: ["twitch", "vevo", "yahoo", "roblox", "lyft", "reddit", "tripadvisor", "deezer", "mailchimp", "kit", "mux", "mode", "uniqode", "big-cartel", "cazoo", "go-compare", "peerspace", "reveri", "otta", "ding", "peckish", "perfomance-golf", "google-play", "quora", "musinsa", "kakao", "baemin", "danggeun-market", "yanolja", "ohou", "zigbang", "bunjang", "coupang-eats", "kakaopage", "melon", "kakao-t", "dabang", "stayfolio", "kream", "myrealtrip", "ridi", "banksalad", "ably", "wanted", "gangnam-unni", "doctornow", "yogiyo", "watcha", "yeogi-eottae", "jobkorea", "saramin", "finda"],
    lead: "앱과 스트리밍, 소셜 네트워크, 메신저처럼 화면 안에서 쓰는 서비스를 모았습니다. 스마트폰 홈 화면의 작은 아이콘이 가장 자주 보이는 브랜드 접점이라, 정사각형 안에서 완결되는 심볼과 색이 특히 중요한 분야입니다.",
  },
  {
    slug: "olympics-expos", name: "올림픽·엑스포", en: "Olympic & Expo Design",
    p452: [], p31: ["Q5389", "Q172754"],
    include: ["tokyo-1964", "mexico-1968", "munich-1972", "sapporo-1972", "montreal-1976", "moscow-1980", "la-1984", "sarajevo-1984", "calgary-1988", "sydney-2000", "osaka-candidate-city-2008", "expo-70", "expo-74", "expo-75", "expo-85", "expo-90"],
    lead: "올림픽과 세계 박람회를 위해 만든 아이덴티티를 모았습니다. 몇 년 동안만 쓰이지만 개최 도시와 국가의 인상을 세계에 알리는 일이라, 시대마다 가장 앞선 그래픽 디자인이 시험된 분야이기도 합니다.",
  },
];

export const COLLECTION_BY_SLUG = new Map(COLLECTIONS.map(c => [c.slug, c]));
export const collectionsOf = (b) => (Array.isArray(b.collections) ? b.collections : []).filter(s => COLLECTION_BY_SLUG.has(s));

// 목록 노출(isListed) 브랜드가 이 수 미만이면 허브를 발행하지 않는다. 브랜드 페이지의 칩도 같은 기준을 쓴다.
export const MIN_COLLECTION_BRANDS = 5;
/** 발행되는 컬렉션 허브 slug 집합 — 빌더 두 곳이 같은 값을 쓰도록 여기서 계산한다. */
export function publishedCollections(brands, isListed) {
  const n = new Map();
  for (const b of brands) if (isListed(b)) for (const s of collectionsOf(b)) n.set(s, (n.get(s) || 0) + 1);
  return new Set([...n].filter(([s, c]) => c >= MIN_COLLECTION_BRANDS && !COLLECTION_BY_SLUG.get(s).industry).map(([s]) => s));
}
