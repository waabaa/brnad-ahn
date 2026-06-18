// Add 27 more major Korean brands (liquor/beverage, chemical/materials, finance,
// retail/dining, game/ent, beauty). Parallel-agent-verified (each fact cross-checked
// against >=2 independent sources). No hallucination: unverifiable specifics omitted
// (JYP founding day/co-founder, Woongjin Uni-President acquisition year, etc.).
// Duplicates already in DB excluded: yg-entertainment, beauty-of-joseon, romand.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;
const IND = {
  "food-beverage":"식음료","brand-business":"브랜드·비즈니스","retail-commerce":"리테일·커머스",
  "media-entertainment":"미디어·엔터테인먼트","technology-electronics":"기술·전자",
  "beauty-personal-care":"뷰티·퍼스널케어"
};

const NEW = [
  // --- Liquor / Beverage ---
  { s:"muhak", ko:"무학", en:"Muhak", dom:"food-beverage", r:4.0, web:"https://www.muhak.co.kr/",
    def:"무학(Muhak)은 경남 지역을 기반으로 저도주 '좋은데이'를 생산하는 한국의 소주 제조 기업이다.",
    ov:"무학(Muhak)은 1929년 마산에서 출발해 1965년 최위승 회장 인수 후 현대적 소주회사로 성장했다. 2006년 국내 최초 16.9도 저도수 소주 '좋은데이'를 출시해 순한소주 시장을 선도했으며 부산·경남권에서 높은 점유율을 가진 코스피 상장사다.",
    id:"경남권을 기반으로 저도수 소주 시장을 개척한 지역 대표 주류기업이다." },
  { s:"bohae", ko:"보해양조", en:"Bohae", dom:"food-beverage", r:3.9, web:"https://www.bohae.co.kr/",
    def:"보해양조(Bohae)는 호남권을 기반으로 소주 '잎새주'와 매실주 '매취순'을 생산하는 한국의 주류 제조 기업이다.",
    ov:"보해양조(Bohae)는 1950년 전남 목포에서 설립된 호남 대표 주류회사로 60년 이상의 전통을 가진다. 잎새주·매취순·복분자주 등을 주력으로 하며 2011년 창해에탄올에 인수되어 그 계열로 운영되는 코스피 상장사다.",
    id:"호남권을 대표하는 전통 소주·과실주 제조기업이다." },
  { s:"kooksoondang", ko:"국순당", en:"Kooksoondang", dom:"food-beverage", r:4.0, web:"https://www.ksdb.co.kr/",
    def:"국순당(Kooksoondang)은 약주 '백세주'로 대표되는 한국의 전통주 제조 전문 기업이다.",
    ov:"국순당(Kooksoondang)은 배상면이 생쌀발효법 특허를 바탕으로 키운 전통주 기업으로, 1992년 백세주를 출시해 한국 약주 시장의 지평을 넓혔다. 2000년 코스닥에 상장했으며 막걸리·약주 등 전통주 라인업을 보유한다.",
    id:"백세주로 한국 약주 시장을 개척한 전통주 전문기업이다." },
  { s:"woongjin-food", ko:"웅진식품", en:"Woongjin Food", dom:"food-beverage", r:3.9, web:"https://www.wjfood.co.kr/",
    def:"웅진식품(Woongjin Food)은 쌀음료 '아침햇살'과 보리차 음료 '하늘보리'로 알려진 한국의 비알코올 음료 제조 기업이다.",
    ov:"웅진식품(Woongjin Food)은 1976년 설립된 전신을 거쳐 1996년 출범했으며 아침햇살·하늘보리 등 곡물·차 음료로 성장했다. 2013년 한앤컴퍼니에 매각된 뒤 대만 통일기업 계열로 편입됐고 곡물음료·주스·차 라인업을 보유한다.",
    id:"곡물·차 기반 천연음료를 개척한 한국 음료기업이다." },
  { s:"donga-otsuka", ko:"동아오츠카", en:"Dong-A Otsuka", dom:"food-beverage", r:4.1, web:"https://www.donga-otsuka.co.kr/",
    def:"동아오츠카(Dong-A Otsuka)는 이온음료 '포카리스웨트'와 비타민음료 '오로나민C'를 생산하는 한국·일본 합작 음료 기업이다.",
    ov:"동아오츠카(Dong-A Otsuka)는 1979년 동아제약과 일본 오츠카제약의 합작으로 '동아식품'으로 설립돼 1992년 현 사명으로 변경됐다. 동아쏘시오홀딩스와 오츠카제약이 약 50대 50으로 지분을 보유하며 포카리스웨트가 주력 음료다.",
    id:"포카리스웨트로 대표되는 한일 합작 기능성 음료기업이다." },
  // --- Chemical / Materials ---
  { s:"kumho-petrochemical", ko:"금호석유화학", en:"Kumho Petrochemical", dom:"brand-business", r:4.1, web:"https://www.kkpc.com/",
    def:"금호석유화학(Kumho Petrochemical)은 합성고무·합성수지·정밀화학을 주력으로 하는 한국의 석유화학 기업이다.",
    ov:"금호석유화학(Kumho Petrochemical)은 1970년 일본 JSR과의 합작 한국합성고무공업으로 출발해 합병을 거쳐 자리잡았다. 2015년 금호아시아나그룹에서 계열분리해 독립 그룹을 이루었으며 BR·SBR 등에서 세계 최대급 합성고무 생산능력을 갖췄다.",
    id:"세계 최대급 합성고무 생산능력을 보유한 한국 대표 석유화학 소재 기업이다." },
  { s:"oci", ko:"OCI", en:"OCI", dom:"brand-business", r:4.0, web:"https://www.oci.co.kr/",
    def:"OCI(오씨아이)는 폴리실리콘과 카본화학을 주력으로 하는 한국의 화학·신재생에너지 소재 기업이다.",
    ov:"OCI(오씨아이)는 1959년 동양화학공업으로 출발해 여러 사명 변경을 거쳐 2009년 OCI로 사명을 바꿨다. 2008년 폴리실리콘 사업 진출로 태양광 소재 기업으로 도약했고 2023년 지주회사 OCI홀딩스와 사업회사 OCI로 분할됐다.",
    id:"폴리실리콘 등 태양광·카본 소재를 아우르는 화학 기반 신재생에너지 소재 기업이다." },
  { s:"kolon-industries", ko:"코오롱인더스트리", en:"Kolon Industries", dom:"brand-business", r:4.1, web:"https://www.kolonindustries.com/",
    def:"코오롱인더스트리(Kolon Industries)는 산업자재·화학소재·필름·패션을 영위하는 한국의 종합 소재·화학 기업이다.",
    ov:"코오롱인더스트리(Kolon Industries)는 1957년 한국나이롱에 뿌리를 두며 2009년 코오롱의 지주회사 전환에 따른 인적분할로 신설됐다. 타이어코드·아라미드 등 산업자재와 화학소재, 필름·전자재료, 패션 사업을 영위하며 파라아라미드 글로벌 상위권 생산능력을 보유한다.",
    id:"아라미드·산업자재를 축으로 한 코오롱그룹의 핵심 종합 소재 기업이다." },
  { s:"hyosung-tnc", ko:"효성티앤씨", en:"Hyosung TNC", dom:"brand-business", r:4.1, web:"https://www.hyosungtnc.com/",
    def:"효성티앤씨(Hyosung TNC)는 스판덱스 브랜드 크레오라를 주력으로 하는 한국의 섬유·무역 기업이다.",
    ov:"효성티앤씨(Hyosung TNC)는 2018년 효성의 지주회사 전환에 따른 인적분할로 신설된 섬유·무역 사업회사다. 스판덱스 브랜드 크레오라로 세계 시장 점유율 1위를 보유하며 나일론·폴리에스터 원사와 친환경 리사이클 섬유 regen도 생산한다.",
    id:"스판덱스 세계 1위 크레오라를 보유한 효성그룹의 섬유 소재 기업이다." },
  { s:"hansol-chemical", ko:"한솔케미칼", en:"Hansol Chemical", dom:"brand-business", r:4.0, web:"https://www.hansolchemical.com/",
    def:"한솔케미칼(Hansol Chemical)은 과산화수소와 반도체·디스플레이 전자소재를 주력으로 하는 한국의 정밀화학 기업이다.",
    ov:"한솔케미칼(Hansol Chemical)은 1980년 한국퍼록사이드로 설립돼 과산화수소 사업으로 출발했으며 1994년 한솔그룹에 편입됐다. 제지·정밀화학 약품을 기반으로 반도체·디스플레이용 전자소재로 사업을 확장한 정밀화학 기업이다.",
    id:"과산화수소에서 출발해 반도체 전자소재로 영역을 넓힌 한솔그룹의 정밀화학 기업이다." },
  // --- Finance ---
  { s:"woori-bank", ko:"우리은행", en:"Woori Bank", dom:"brand-business", r:4.2, web:"https://www.wooribank.com/",
    def:"우리은행(Woori Bank)은 우리금융지주 산하의 대한민국 시중은행이다.",
    ov:"우리은행(Woori Bank)은 1999년 상업은행과 한일은행의 합병으로 출범한 한빛은행을 전신으로 하며 2002년 우리은행으로 사명을 변경했다. 한때 정부의 공적자금 회수를 위한 민영화를 거쳐 2019년 재출범한 우리금융지주의 완전자회사로 편입됐다.",
    id:"상업·한일은행의 헤리티지를 계승한 대형 시중은행이다." },
  { s:"nh-securities", ko:"NH투자증권", en:"NH Investment & Securities", dom:"brand-business", r:4.2, web:"https://www.nhqv.com/",
    def:"NH투자증권(NH Investment & Securities)은 NH농협금융지주 산하의 대한민국 증권회사다.",
    ov:"NH투자증권(NH Investment & Securities)은 1969년 설립된 증권사로 LG투자증권·우리투자증권을 거쳐 2014년 농협금융지주에 인수되며 현 사명이 됐다. 2015년 NH농협증권과 합병해 통합법인으로 출범한 국내 대형 증권사다.",
    id:"농협금융그룹의 핵심 증권 자회사인 국내 대형 증권사다." },
  { s:"kb-securities", ko:"KB증권", en:"KB Securities", dom:"brand-business", r:4.2, web:"https://www.kbsec.com/",
    def:"KB증권(KB Securities)은 KB금융그룹 산하의 대한민국 증권회사다.",
    ov:"KB증권(KB Securities)은 1962년 국일증권으로 설립돼 현대증권으로 운영되던 회사가 KB금융지주에 인수된 뒤, 2017년 1월 기존 KB투자증권과 합병해 통합 출범했다. KB금융그룹의 완전자회사로 리테일과 투자은행을 아우른다.",
    id:"현대증권의 리테일 기반과 KB금융그룹의 자본력을 결합한 종합 증권사다." },
  { s:"hanwha-life", ko:"한화생명", en:"Hanwha Life", dom:"brand-business", r:4.2, web:"https://www.hanwhalife.com/",
    def:"한화생명(Hanwha Life)은 한화그룹 계열의 대한민국 생명보험회사다.",
    ov:"한화생명(Hanwha Life)은 1946년 설립된 대한민국 최초의 생명보험사 대한생명을 전신으로 한다. 2002년 한화그룹이 인수했고 2012년 한화생명으로 사명을 변경했으며 여의도 63빌딩을 본사로 둔다.",
    id:"대한민국 최초의 생명보험사 헤리티지를 가진 한화그룹의 핵심 금융 계열사다." },
  { s:"citibank-korea", ko:"한국씨티은행", en:"Citibank Korea", dom:"brand-business", r:4.0, web:"https://www.citibank.co.kr/",
    def:"한국씨티은행(Citibank Korea)은 미국 씨티그룹이 지배하는 대한민국의 외국계 시중은행이다.",
    ov:"한국씨티은행(Citibank Korea)은 1981년 설립된 한미금융을 전신으로 하는 한미은행이 2004년 씨티그룹에 인수되어, 같은 해 11월 씨티은행 서울지점과 합병하면서 출범했다. 씨티그룹이 사실상 전량 지분으로 운영하는 외국계 은행이다.",
    id:"글로벌 씨티그룹 네트워크를 배경으로 한 대한민국 대표 외국계 은행이다." },
  // --- Retail / Dining ---
  { s:"emart24", ko:"이마트24", en:"emart24", dom:"retail-commerce", r:4.1, web:"https://www.emart24.co.kr/",
    def:"이마트24(emart24)는 신세계그룹이 운영하는 한국의 편의점 프랜차이즈다.",
    ov:"이마트24(emart24)는 신세계그룹이 2014년 편의점 위드미를 인수해 사업을 시작했고 2017년 브랜드 파워가 높은 '이마트'를 앞세워 이마트24로 사명을 변경했다. 사명 변경과 함께 대규모 투자 계획을 발표하며 편의점 사업을 본격화했다.",
    id:"대형 유통 모기업의 신뢰도를 결합한 신세계그룹의 편의점 브랜드다." },
  { s:"no-brand", ko:"노브랜드", en:"No Brand", dom:"retail-commerce", r:4.2, web:"https://emart.ssg.com/",
    def:"노브랜드(No Brand)는 이마트가 운영하는 가성비 중심의 자체 브랜드(PB)다.",
    ov:"노브랜드(No Brand)는 2015년 이마트가 '브랜드가 아니다, 소비자다'를 캐치프레이즈로 론칭한 PB로, 생수·물티슈·과자 등 생활필수품을 저가에 공급한다. 노란색을 상징색으로 한 실용주의 콘셉트로 'PB는 저품질'이라는 편견을 깨며 가성비 대명사로 성장했다.",
    id:"불필요한 마케팅·포장을 줄여 가격을 낮춘 이마트의 대표 PB다." },
  { s:"hollys", ko:"할리스", en:"Hollys", dom:"food-beverage", r:4.0, web:"https://www.hollys.co.kr/",
    def:"할리스(Hollys)는 KG그룹 계열이 운영하는 한국의 커피전문점 프랜차이즈다.",
    ov:"할리스(Hollys)는 1998년 강남역에 1호점을 연 국내 1세대 커피 브랜드다. 2020년 KG그룹이 인수했고 2021년 'COFFEE'를 떼고 '할리스'로 브랜드를 개편해 라이프스타일 브랜드로의 확장을 선언했다.",
    id:"한국 토종 1세대에서 라이프스타일 브랜드로 확장 중인 KG그룹 계열 카페다." },
  { s:"angelinus", ko:"엔제리너스", en:"Angel-in-us", dom:"food-beverage", r:4.0, web:"https://www.angelinus.com/",
    def:"엔제리너스(Angel-in-us)는 롯데GRS가 운영하는 한국의 커피전문점 프랜차이즈다.",
    ov:"엔제리너스(Angel-in-us)는 2000년 자바커피로 출발해 2006년 '우리 안의 천사'라는 의미의 엔제리너스로 브랜드를 변경했다. 롯데그룹 외식 계열사 롯데GRS가 운영하며 2021년 새 BI를 도입해 리브랜딩을 진행했다.",
    id:"롯데그룹 외식 인프라를 기반으로 한 감성 콘셉트의 커피 프랜차이즈다." },
  { s:"paiks-coffee", ko:"빽다방", en:"Paik's Coffee", dom:"food-beverage", r:4.1, web:"https://paikdabang.com/",
    def:"빽다방(Paik's Coffee)은 더본코리아가 운영하는 한국의 저가 커피 프랜차이즈다.",
    ov:"빽다방(Paik's Coffee)은 2006년 백종원이 시작해 상표 분쟁을 거쳐 '빽다방'으로 정착한 더본코리아의 핵심 외식 브랜드다. 큰 용량과 저렴한 가격을 내세우며 창업자의 방송 인지도를 발판으로 2010년대 중반 폭발적으로 성장했다.",
    id:"가성비와 창업자 브랜드 파워를 결합한 더본코리아의 대표 저가 커피 프랜차이즈다." },
  // --- Game / Entertainment / IT ---
  { s:"doubleu-games", ko:"더블유게임즈", en:"DoubleU Games", dom:"media-entertainment", r:4.0, web:"https://www.doubleugames.com/",
    def:"더블유게임즈(DoubleU Games)는 소셜카지노 게임을 개발·서비스하는 한국의 상장 게임기업이다.",
    ov:"더블유게임즈(DoubleU Games)는 2012년 설립돼 대표작 '더블유카지노'로 글로벌 소셜카지노 시장에서 성장했다. 2015년 코스닥 상장 후 2019년 코스피로 이전했으며 미국 더블다운인터랙티브를 인수해 나스닥 상장까지 이뤄냈다.",
    id:"소셜카지노에 특화된 글로벌 모바일 게임 퍼블리셔다." },
  { s:"com2us-holdings", ko:"컴투스홀딩스", en:"Com2uS Holdings", dom:"media-entertainment", r:4.0, web:"https://www.com2us.com/",
    def:"컴투스홀딩스(Com2uS Holdings)는 모바일 게임 사업과 컴투스 그룹 지주 기능을 수행하는 한국의 상장 게임기업이다.",
    ov:"컴투스홀딩스(Com2uS Holdings)는 2000년 게임빌로 설립된 1세대 모바일 게임사로, 2021년 컴투스홀딩스로 사명을 변경하며 그룹 사업지주회사로 전환했다. 블록체인·플랫폼을 포함한 종합 콘텐츠 기업으로 비전을 확장했다.",
    id:"컴투스 그룹의 게임·블록체인 사업을 아우르는 지주형 게임기업이다." },
  { s:"jyp", ko:"JYP엔터테인먼트", en:"JYP Entertainment", dom:"media-entertainment", r:4.3, web:"https://www.jype.com/",
    def:"JYP엔터테인먼트(JYP Entertainment)는 박진영이 설립한 한국의 대형 K-팝 연예기획사다.",
    ov:"JYP엔터테인먼트(JYP Entertainment)는 1990년대 후반 설립돼 god·원더걸스·2PM 등을 배출했고 2010년대 이후 트와이스·스트레이 키즈·ITZY·엔믹스 등 글로벌 K-팝 그룹을 연이어 성공시켰다. 음반 제작·매니지먼트·콘텐츠 사업을 영위하는 코스닥 상장사다.",
    id:"트와이스·스트레이 키즈를 중심으로 한 글로벌 K-팝 종합 엔터테인먼트사다." },
  { s:"douzone", ko:"더존비즈온", en:"Douzone Bizon", dom:"technology-electronics", r:4.0, web:"https://www.douzone.com/",
    def:"더존비즈온(Douzone Bizon)은 ERP·회계 소프트웨어와 클라우드 플랫폼을 제공하는 한국의 대표 기업용 SW 기업이다.",
    ov:"더존비즈온(Douzone Bizon)은 1991년 회계 패키지로 출발해 1997년 더존디지털웨어로 ERP 사업을 본격화했고 국내 ERP 점유율 1위에 올랐다. 클라우드 플랫폼 '위하고(WEHAGO)'를 중심으로 사업을 확장하고 있다.",
    id:"국내 ERP 1위의 기업용 비즈니스 소프트웨어·클라우드 플랫폼 기업이다." },
  // --- Beauty ---
  { s:"etude", ko:"에뛰드", en:"ETUDE", dom:"beauty-personal-care", r:4.1, web:"https://www.etudehouse.com/",
    def:"에뛰드(ETUDE)는 아모레퍼시픽그룹 계열의 색조 메이크업 중심 화장품 브랜드다.",
    ov:"에뛰드(ETUDE)는 1985년 창립돼 1990년대 색조 화장품 로드숍 브랜드로 성장했다. 현재 아모레퍼시픽그룹이 다수 지분을 보유하며 K-뷰티 메이크업의 선두 브랜드 중 하나로 꼽힌다.",
    id:"밝고 사랑스러운 무드의 색조 메이크업을 표방하는 K-뷰티 대표 브랜드다." },
  { s:"dr-g", ko:"닥터지", en:"Dr.G", dom:"beauty-personal-care", r:4.1, web:"https://www.dr-g.co.kr/",
    def:"닥터지(Dr.G)는 고운세상코스메틱이 운영하는 더마코스메틱 스킨케어 브랜드다.",
    ov:"닥터지(Dr.G)는 피부과 전문의가 설립한 고운세상코스메틱이 2003년 론칭했다. 민감·트러블 피부를 위한 기능성 스킨케어를 표방하며 진정 케어와 선케어 제품으로 알려져 글로벌 확장을 추진하고 있다.",
    id:"피부과학에 기반한 더마코스메틱 스킨케어 브랜드다." },
  { s:"abib", ko:"아비브", en:"ABIB", dom:"beauty-personal-care", r:4.0, web:"https://abib.com/",
    def:"아비브(ABIB)는 포컴퍼니가 운영하는 한국 스킨케어 화장품 브랜드다.",
    ov:"아비브(ABIB)는 여러 분야 전문가들이 2016년 설립한 포컴퍼니에서 시작됐다. '껌딱지팩'으로 입소문을 타고 올리브영을 통해 확산됐으며 어성초 진정 라인을 중심으로 토탈 스킨케어 브랜드로 확장했다.",
    id:"피부 진정에 초점을 둔 어성초 기반 K-뷰티 스킨케어 브랜드다." },
];

let added = 0;
for (const n of NEW) {
  if (existing.has(n.s)) { console.log("SKIP dup", n.s); continue; }
  const industry = IND[n.dom];
  const b = {
    id: nextId++, slug: n.s, urlSlug: n.s, name: n.ko, nameKo: n.ko, nameEn: n.en,
    definition: n.def, summary: n.def, industry, domainSlug: n.dom,
    tier: "C_source_backed", rating: n.r, image: "", logo: "", insight: n.id,
    logoHistory: [],
    sections: {
      overview: { title: "개요", body: n.ov },
      identity: { title: "브랜드 정체성", body: n.id },
    },
    timeline: [], publicReady: true, displayPriority: "normal", officialWebsite: n.web,
  };
  all.push(b);
  const ind = (data.industries || []).find(i => i.id === n.dom || i.name === industry);
  if (ind) ind.count = (ind.count || 0) + 1;
  existing.add(n.s);
  added++;
  console.log("ADD", n.s);
}
if (data.stats) data.stats.brands = all.length;
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nadded ${added}. allBrands now ${all.length}.`);
