import { koreanName, latinName } from "./brand-seo.mjs";

// 브랜드 그룹(모기업 아래 묶음) 축 — brand.group 에는 그룹 대표 레코드의 slug 가 들어간다.
//
// 근거는 두 가지뿐이다(assign-groups.mjs):
//   1) QID 확정 레코드의 Wikidata P749(모기업) 중 종료·deprecated 가 아닌 값. 모기업 QID 가 사전 레코드일 때만 쓴다.
//      지분 보유자(P127: 뱅가드·정부·개인)는 브랜드 그룹이 아니므로 쓰지 않는다.
//   2) 아래 CURATED — QID 가 없는 레코드를 사람이 공개 출처로 확인해 넣은 목록. 출처 URL 을 남긴다.
// 이름이 비슷하다고 묶지 않는다. 라이선스·지분 일부 보유·병행 소유(슈웹스·몬스터·뉴발란스 한국 등)는 넣지 않는다.

// head: 그룹 대표 레코드 slug. 사전에 레코드가 없으면 name(그룹 표기)을 함께 적는다 — 이때 허브에는 대표 링크가 없다.
export const CURATED = [
  {
    head: "lvmh",
    aliases: ["LVMH", "루이 비통 모에 헤네시"],
    source: "https://www.lvmh.com/houses/",
    include: ["louis-vuitton", "dior", "christian-dior", "fendi", "givenchy", "celine", "bulgari", "tiffany-and-co", "tag-heuer", "sephora", "marc-jacobs", "rimowa", "benefit", "moet-and-chandon", "veuve-clicquot", "dom-p-rignon", "hennessy", "glenmorangie-distillery"],
  },
  {
    head: "the-coca-cola-company",
    aliases: ["Coca-Cola Company", "코카콜라 컴퍼니", "코카-콜라 컴퍼니"],
    source: "https://www.coca-colacompany.com/brands",
    include: ["coca-cola", "fanta", "sprite", "minute-maid", "powerade"],
  },
  {
    head: "e-land",
    aliases: ["이랜드", "E-Land"],
    source: "https://www.eland.co.kr/",
    include: ["spao", "mixxo", "kims-club", "e-world", "k-swiss"],
  },
  {
    head: "nike",
    aliases: ["Nike", "나이키"],
    source: "https://about.nike.com/en/brands",
    include: ["converse", "air-jordan"],
  },
  {
    head: "samsung-group",
    aliases: ["삼성", "Samsung"],
    source: "https://ko.wikipedia.org/wiki/삼성",
    include: ["samsung-electronics", "samsung-sdi", "samsung-biologics", "samsung-life", "samsung-fire", "samsung-heavy", "samsung-securities", "samsung-ct", "everland", "samsung-card", "samsung-engineering", "cheil-worldwide", "samsung-sds", "samsung-display", "harman-international-industries"],
  },
  {
    head: "sk-group",
    aliases: ["SK", "에스케이"],
    source: "https://ko.wikipedia.org/wiki/SK_그룹",
    include: ["sk-telecom", "sk-hynix", "sk-innovation", "sk-biopharm", "sk-inc", "sk-energy", "sk-ecoplant", "sk-on"],
  },
  {
    head: "lotte",
    aliases: ["롯데", "Lotte"],
    name: "롯데",
    source: "https://www.lotte.co.kr/",
    include: ["lotte-department-store", "lotte-mart", "lotte-chilsung", "lotte-wellfood", "lotte-chemical", "lotteria", "lotte-world", "lotte-confectionery", "lotte-hotels-resorts", "lotte-himart", "lotte-cinema", "lotte-duty-free"],
  },
  {
    head: "cj-group",
    aliases: ["CJ"],
    source: "https://www.cj.net/",
    include: ["olive-young", "bibigo", "cj-enm", "tous-les-jours", "cj-logistics", "cgv", "cj-cheil-jedang", "tving", "cj-wellcare"],
  },
  {
    head: "shinsegae",
    aliases: ["신세계", "Shinsegae"],
    source: "https://www.shinsegae.com/",
    include: ["emart", "emart24", "no-brand", "ssg-com", "no-brand-burger"],
  },
  {
    head: "kakao",
    aliases: ["카카오", "Kakao"],
    source: "https://www.kakaocorp.com/page/service/service",
    include: ["kakao-entertainment", "kakaobank", "kakao-games", "kakao-pay", "kakaopage", "kakao-t", "kakaotalk", "kakao-friends"],
  },
  {
    head: "naver",
    aliases: ["네이버", "Naver"],
    source: "https://www.navercorp.com/",
    include: ["naver-shopping", "webtoon"],
  },
  {
    head: "amorepacific",
    aliases: ["아모레퍼시픽", "Amorepacific", "AmorePacific"],
    source: "https://www.apgroup.com/int/ko/brands/brands.html",
    include: ["sulwhasoo", "laneige", "innisfree", "hera", "mamonde", "etude"],
  },
  {
    head: "hanwha-group",
    aliases: ["한화", "Hanwha"],
    source: "https://www.hanwha.co.kr/",
    include: ["hanwha-solutions", "hanwha-ocean", "hanwha-aerospace", "hanwha-life", "hanwha-vision", "qcells"],
  },
  {
    head: "gs-group",
    aliases: ["GS"],
    source: "https://www.gsgroup.com/",
    include: ["gs25", "gs-caltex", "gs-construction", "gs-the-fresh"],
  },
  {
    head: "kolon-group",
    aliases: ["코오롱그룹", "코오롱", "Kolon"],
    source: "https://www.kolon.com/kr/",
    include: ["kolon-industries", "kolon-sport", "kolon-fnc", "raekodeu"],
  },
  {
    head: "hyosung",
    aliases: ["효성", "Hyosung"],
    source: "https://www.hyosung.com/",
    include: ["hyosung-tnc", "hyosung-heavy-industries"],
  },
  {
    head: "hyundai-motor-group",
    aliases: ["현대자동차", "Hyundai Motor"],
    source: "https://www.hyundai.com/worldwide/ko/company/about-hyundai",
    include: ["hyundai-motor", "kia", "genesis", "hyundai-mobis", "hyundai-steel", "hyundai-card", "hyundai-enc"],
  },
  {
    head: "nestl",
    aliases: ["네슬레", "Nestlé", "Nestle"],
    source: "https://www.nestle.com/brands",
    include: ["nescafe", "perrier", "maggi"],
  },
  {
    head: "pepsico",
    aliases: ["PepsiCo", "펩시코"],
    source: "https://www.pepsico.com/our-brands",
    include: ["pepsi", "cheetos", "gatorade", "mountain-dew", "quaker-oats-company"],
  },
  {
    head: "mondelez-international",
    aliases: ["Mondelez", "몬덜리즈"],
    source: "https://www.mondelezinternational.com/brands/",
    include: ["cadbury", "toblerone", "milka"],
  },
  {
    head: "mars-incorporated",
    aliases: ["Mars, Incorporated", "Mars Inc", "마즈"],
    source: "https://www.mars.com/brands",
    include: ["m-and-m-s", "snickers"],
  },
  {
    head: "yum-brands",
    aliases: ["Yum! Brands", "얌! 브랜드", "Yum Brands"],
    source: "https://www.yum.com/wps/portal/yumbrands/Yumbrands/brands",
    include: ["kentucky-fried-chicken", "pizza-hut", "taco-bell"],
  },
  {
    head: "restaurant-brands-international",
    aliases: ["Restaurant Brands International"],
    name: "Restaurant Brands International",
    source: "https://www.rbi.com/English/brands/",
    include: ["burger-king", "popeyes", "tim-hortons"],
  },
  {
    head: "alphabet-inc",
    aliases: ["Alphabet", "알파벳"],
    source: "https://abc.xyz/",
    include: ["google", "youtube", "waymo", "google-deepmind", "gmail", "google-play"],
  },
  {
    head: "meta-platforms",
    aliases: ["Meta Platforms", "메타 플랫폼스", "Meta"],
    source: "https://about.meta.com/technologies/",
    include: ["facebook", "whatsapp", "instagram", "threads", "messenger"],
  },
  {
    head: "microsoft",
    aliases: ["Microsoft", "마이크로소프트"],
    source: "https://www.microsoft.com/en-us/about",
    include: ["linkedin", "github", "xbox", "activision-blizzard", "skype", "microsoft-copilot"],
  },
  {
    head: "amazon",
    aliases: ["Amazon", "아마존"],
    source: "https://www.aboutamazon.com/",
    include: ["twitch", "imdb", "whole-foods-market", "amazon-kindle"],
  },
  {
    head: "the-walt-disney-company",
    aliases: ["Walt Disney Company", "월트 디즈니 컴퍼니", "Disney", "디즈니"],
    source: "https://thewaltdisneycompany.com/about/",
    include: ["pixar", "marvel-studios", "marvel-comics", "20th-century-studios", "disneyland", "walt-disney-world-resort", "disney-plus", "walt-disney-animation-studios", "walt-disney-pictures", "walt-disney-records"],
  },
  {
    head: "warner-bros-discovery",
    aliases: ["Warner Bros. Discovery", "워너 브라더스 디스커버리", "WarnerMedia", "워너미디어"],
    source: "https://www.wbd.com/",
    include: ["hbo", "dc-comics", "warner-bros-entertainment"],
  },
  {
    head: "comcast",
    aliases: ["Comcast", "컴캐스트", "NBCUniversal"],
    source: "https://corporate.comcast.com/company",
    include: ["nbc", "universal-pictures", "dreamworks-animation"],
  },
  {
    head: "sony-group",
    aliases: ["Sony", "소니"],
    source: "https://www.sony.com/en/SonyInfo/CorporateInfo/",
    include: ["sony-music", "sony-pictures", "sony-interactive-entertainment", "playstation", "columbia-pictures", "epic-records"],
  },
  {
    head: "toyota",
    aliases: ["Toyota", "도요타"],
    source: "https://global.toyota/en/company/profile/",
    include: ["lexus", "daihatsu"],
  },
  {
    head: "bavarian-motor-works-bayerische-motoren-werke",
    aliases: ["BMW"],
    source: "https://www.bmwgroup.com/en/brands.html",
    include: ["mini", "rolls-royce-motor-cars"],
  },
  {
    head: "mercedes-benz-group",
    aliases: ["Mercedes-Benz Group", "메르세데스-벤츠 그룹", "Daimler"],
    source: "https://group.mercedes-benz.com/company/",
    include: ["mercedes-benz", "mercedes-amg", "maybach"],
  },
  {
    head: "geely",
    aliases: ["Geely", "지리"],
    source: "https://global.geely.com/",
    include: ["volvo-cars", "polestar", "lotus-cars"],
  },
  {
    head: "tata-group",
    aliases: ["Tata", "타타"],
    source: "https://www.tata.com/business",
    include: ["tata-motors-ltd", "jaguar-cars", "land-rover", "jaguar-land-rover", "air-india"],
  },
  {
    head: "renault",
    aliases: ["Renault", "르노"],
    source: "https://www.renaultgroup.com/en/our-brands/",
    include: ["renault-korea", "alpine"],
  },
  {
    head: "inditex",
    aliases: ["Inditex", "인디텍스"],
    source: "https://www.inditex.com/itxcomweb/en/brands",
    include: ["zara", "pull-and-bear", "bershka", "massimo-dutti"],
  },
  {
    head: "loreal",
    aliases: ["L'Oréal", "로레알", "L’Oréal"],
    source: "https://www.loreal.com/en/brands/",
    include: ["lanc-me", "kiehl-s"],
  },
  {
    head: "unilever",
    aliases: ["Unilever", "유니레버"],
    source: "https://www.unilever.com/brands/",
    include: ["dove", "vaseline"],
  },
  {
    head: "procter-gamble",
    aliases: ["Procter & Gamble", "프록터 앤드 갬블", "P&G"],
    source: "https://us.pg.com/brands/",
    include: ["gillette", "always", "braun"],
  },
  {
    head: "diageo",
    aliases: ["Diageo", "디아지오"],
    source: "https://www.diageo.com/en/our-brands",
    include: ["johnnie-walker", "baileys-irish-cream", "captain-morgan", "smirnoff", "tanqueray", "guinness", "gordons-london-dry-gin"],
  },
  {
    head: "pernod-ricard",
    aliases: ["Pernod Ricard", "페르노리카"],
    source: "https://www.pernod-ricard.com/en/our-brands",
    include: ["absolut", "absolut-vodka", "chivas-regal", "jameson", "plymouth"],
  },
  {
    head: "alibaba-group",
    aliases: ["Alibaba", "알리바바"],
    source: "https://www.alibabagroup.com/en-US/about-alibaba-businesses",
    include: ["hema", "aliexpress", "taobao"],
  },
  {
    head: "richemont",
    aliases: ["Richemont", "리슈몽"],
    name: "리슈몽",
    source: "https://www.richemont.com/our-maisons/",
    include: ["montblanc", "cartier", "international-watch-company", "van-cleef-and-arpels", "vacheron-constantin", "chloe"],
  },
  {
    head: "swatch-group",
    aliases: ["Swatch Group", "스와치 그룹"],
    name: "스와치 그룹",
    source: "https://www.swatchgroup.com/en/brands",
    include: ["swatch", "omega", "longines", "rado"],
  },
  {
    head: "vf-corporation",
    aliases: ["VF Corporation", "VF 코퍼레이션"],
    name: "VF Corporation",
    source: "https://www.vfc.com/brands",
    include: ["the-north-face", "vans", "the-timberland-company"],
  },
];

// Wikidata P749 자동 편입에서 사람이 걸러낸 레코드 — 이미 매각·합병됐거나(와이드 발행 전 값), 지분 일부 보유·합작이어서
// "산하"가 아닌 경우, 사업이 끝난 브랜드. 위키데이터에는 종료일이 없는 낡은 모기업 값이 남아 있다(2026-11-16 검수).
export const EXCLUDE = new Set([
  "nissan", "infiniti", "smart", "wella", "tropicana-products", "agfa-gevaert", "daimler-company", "united-launch-alliance",
  "mcdonnell-douglas", "fao-schwarz", "toys-r-us", "corel", "a-w-restaurants", "loon", "asia-motors", "nsu-motorenwerke",
  "oldsmobile", "pontiac", "holden", "arc-teryx", "virgin-america",
]);

// 그룹이 아니라 사업부·부문이라 허브를 만들지 않는 대표 레코드(산하는 기록하지 않는다).
export const DROP_HEADS = new Set(["cj-enm-entertainment-division"]);

// 허브를 만드는 최소 브랜드 수(대표 레코드가 사전에 있으면 대표 포함, 목록 노출분 기준).
export const MIN_GROUP_BRANDS = 3;

export const groupOf = (b) => (typeof b.group === "string" && b.group ? b.group : null);

/** 발행되는 그룹: Map<slug, {head|null, label, members[]}> — 빌더 두 곳이 같은 값을 쓴다. */
export function publishedGroups(brands, isListed, slugOf) {
  const bySlug = new Map(brands.map(b => [slugOf(b), b]));
  const virtual = new Map(CURATED.filter(c => c.name).map(c => [c.head, c.name]));
  const m = new Map();
  for (const b of brands) {
    const g = groupOf(b);
    if (!g || !isListed(b) || slugOf(b) === g) continue;
    if (!m.has(g)) m.set(g, []);
    m.get(g).push(b);
  }
  const out = new Map();
  for (const [g, members] of m) {
    const rec = bySlug.get(g);
    const head = rec && isListed(rec) ? rec : null;
    const label = head ? (koreanName(head) || latinName(head) || head.name) : virtual.get(g);
    if (!label) continue;
    if (members.length + (head ? 1 : 0) >= MIN_GROUP_BRANDS) out.set(g, { head, label, members });
  }
  return out;
}
