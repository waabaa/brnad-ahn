// Add 24 more major Korean brands (electronics/telecom, games, airlines, pharma/bio,
// food/dining, fashion/beauty/tire), parallel-agent-verified (each ≥2 sources).
// Rename vs founding dates distinguished per research.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;
const IND = { "technology-electronics":"기술·전자","media-entertainment":"미디어·엔터테인먼트","mobility":"모빌리티","travel-hospitality":"여행·호스피탈리티","health-pharma":"헬스·제약","food-beverage":"식음료","beauty-personal-care":"뷰티·퍼스널케어","sports-outdoor":"스포츠·아웃도어" };

const NEW = [
  { s:"sk-hynix", ko:"SK하이닉스", en:"SK Hynix", dom:"technology-electronics", r:4.7, web:"https://www.skhynix.com/",
    def:"SK하이닉스(SK Hynix)는 SK그룹 계열의 메모리 반도체 기업으로, 1983년 현대전자로 출발해 2012년 SK그룹에 인수되며 현 사명이 됐다.",
    ov:"SK하이닉스(SK Hynix)는 SK그룹 계열의 메모리 반도체 기업이다. 1983년 현대전자로 창립해 2001년 하이닉스반도체로 사명을 바꿨고, 2012년 SK그룹이 인수하며 SK하이닉스가 됐다.",
    id:"삼성전자·마이크론과 함께 세계 메모리 반도체 '빅3'로 꼽히는 DRAM·낸드 플래시 제조사로, 고대역폭 메모리(HBM) 등 첨단 메모리 분야에서 세계적 경쟁력을 갖췄다." },
  { s:"kt", ko:"KT", en:"KT Corporation", dom:"technology-electronics", r:4.5, web:"https://www.kt.com/",
    def:"KT(KT Corporation)는 한국의 대표 통신 기업으로, 1981년 한국전기통신공사로 설립돼 2002년 사명을 KT로 바꿨다.",
    ov:"KT(KT Corporation)는 한국의 대표 통신 기업이다. 1981년 한국전기통신공사로 설립돼 한국통신을 거쳐 2002년 민영화와 함께 사명을 'KT'로 변경했다.",
    id:"유선전화·초고속인터넷·이동통신·IPTV를 아우르는 한국 1호 통신사로, 2009년 국내에 처음으로 아이폰을 도입하며 스마트폰 대중화를 이끌었다." },
  { s:"lg-uplus", ko:"LG유플러스", en:"LG Uplus", dom:"technology-electronics", r:4.4, web:"https://www.lguplus.com/",
    def:"LG유플러스(LG Uplus)는 LG그룹 계열의 통신 기업으로, 1996년 LG텔레콤으로 출발해 2010년 데이콤·파워콤 합병 후 현 사명이 됐다.",
    ov:"LG유플러스(LG Uplus)는 LG그룹 계열의 통신 기업이다. 1996년 LG텔레콤으로 설립됐고, 2010년 데이콤·파워콤과 합병하면서 'LG유플러스'로 사명을 바꿨다.",
    id:"이동통신과 초고속인터넷을 제공하는 한국 3위 통신사로, 통신·미디어·기업 솔루션을 아우르며 LG그룹의 통신 사업을 담당한다." },
  { s:"samsung-sdi", ko:"삼성SDI", en:"Samsung SDI", dom:"technology-electronics", r:4.5, web:"https://www.samsungsdi.com/",
    def:"삼성SDI(Samsung SDI)는 삼성그룹 계열의 2차전지·전자재료 기업으로, 1970년 삼성-NEC로 출발해 1999년 현 사명이 됐다.",
    ov:"삼성SDI(Samsung SDI)는 삼성그룹 계열의 배터리·전자재료 기업이다. 1970년 삼성과 일본 NEC의 합작 삼성-NEC로 설립돼 삼성전관을 거쳐 1999년 삼성SDI로 사명을 바꿨다.",
    id:"과거 브라운관·디스플레이 사업에서 전기차·IT·ESS용 리튬이온 배터리와 반도체·디스플레이용 전자재료 제조사로 전환한 기업으로, 글로벌 2차전지 산업의 주요 플레이어다." },
  { s:"ncsoft", ko:"엔씨소프트", en:"NCSoft", dom:"media-entertainment", r:4.5, web:"https://www.ncsoft.com/",
    def:"엔씨소프트(NCSoft)는 1997년 김택진이 설립한 한국의 게임 기업으로, MMORPG 리니지로 잘 알려져 있다.",
    ov:"엔씨소프트(NCSoft)는 1997년 김택진이 설립한 한국의 비디오 게임 개발·퍼블리싱 기업이다.",
    id:"1998년 출시한 리니지(Lineage)를 비롯해 아이온·블레이드앤소울·리니지W 등 MMORPG를 대표작으로 하는 한국 1세대 온라인 게임 명가다." },
  { s:"pearl-abyss", ko:"펄어비스", en:"Pearl Abyss", dom:"media-entertainment", r:4.4, web:"https://www.pearlabyss.com/",
    def:"펄어비스(Pearl Abyss)는 2010년 설립된 한국의 게임 기업으로, 검은사막(Black Desert)으로 알려져 있다.",
    ov:"펄어비스(Pearl Abyss)는 2010년 김대일이 설립한 한국의 비디오 게임 개발·퍼블리싱 기업이다.",
    id:"2014년 출시한 오픈월드 MMORPG 검은사막(Black Desert)을 대표작으로 하며, 자체 게임 엔진과 뛰어난 그래픽 기술로 글로벌 시장에서 성공을 거뒀다. EVE 온라인을 만든 CCP게임즈를 자회사로 둔다." },
  { s:"netmarble", ko:"넷마블", en:"Netmarble", dom:"media-entertainment", r:4.4, web:"https://company.netmarble.com/",
    def:"넷마블(Netmarble)은 2000년 방준혁이 창업한 한국의 모바일 게임 중심 기업이다.",
    ov:"넷마블(Netmarble)은 2000년 방준혁이 창업한 한국의 비디오 게임 개발·퍼블리싱 기업으로, 모바일 게임에 강점을 둔다. 주요 주주로 텐센트·CJ ENM·엔씨소프트가 참여한다.",
    id:"리니지2 레볼루션·세븐나이츠·마블 퓨처파이트·일곱 개의 대죄 등 모바일 게임 흥행작을 다수 배출한 한국의 대표 모바일 게임사다." },
  { s:"kakao-games", ko:"카카오게임즈", en:"Kakao Games", dom:"media-entertainment", r:4.3, web:"https://kakaogames.com/",
    def:"카카오게임즈(Kakao Games)는 카카오의 게임 자회사로, 2016년 법인이 설립됐다.",
    ov:"카카오게임즈(Kakao Games)는 카카오 계열의 게임 퍼블리싱·개발 기업이다. 다음게임을 기반으로 2016년 법인이 설립됐고 2020년 코스닥에 상장했다.",
    id:"검은사막·배틀그라운드의 국내 서비스와 오딘: 발할라 라이징, 가디언테일즈 등 PC·모바일 게임 퍼블리싱을 맡아 온 카카오 게임 사업의 중심이다." },
  { s:"korean-air", ko:"대한항공", en:"Korean Air", dom:"travel-hospitality", r:4.6, web:"https://www.koreanair.com/",
    def:"대한항공(Korean Air)은 한진그룹 계열의 대한민국 대표 국적 항공사로, 1969년 한진이 국영 항공사를 인수해 출범했다.",
    ov:"대한항공(Korean Air)은 대한민국을 대표하는 플래그 캐리어로 한진그룹 계열이다. 1962년 국영으로 출발한 항공사를 1969년 한진그룹이 인수해 현재의 대한항공이 됐다.",
    id:"기단·국제선 규모에서 한국 최대 항공사로, 2024년 아시아나항공을 인수해 메가 캐리어로 부상했다. 한진칼이 지주회사 역할을 한다." },
  { s:"asiana-airlines", ko:"아시아나항공", en:"Asiana Airlines", dom:"travel-hospitality", r:4.4, web:"https://flyasiana.com/",
    def:"아시아나항공(Asiana Airlines)은 1988년 설립된 한국 2위 항공사로, 2024년 대한항공에 인수됐다.",
    ov:"아시아나항공(Asiana Airlines)은 1988년 설립된 대한민국의 풀서비스 항공사로, 대한항공의 독점을 깨고 등장한 제2 국적사다. 스타얼라이언스 회원이다.",
    id:"한국 2위 항공사로 자리해 왔으며, 2024년 12월 대한항공이 지분 약 63.9%를 취득해 인수를 완료했다. 통합 작업이 마무리되기까지 한동안 별도 브랜드로 운영된다." },
  { s:"jeju-air", ko:"제주항공", en:"Jeju Air", dom:"travel-hospitality", r:4.3, web:"https://www.jejuair.net/",
    def:"제주항공(Jeju Air)은 애경그룹 계열의 항공사로, 2005년 설립된 한국 최초이자 최대 저비용 항공사(LCC)다.",
    ov:"제주항공(Jeju Air)은 애경그룹 계열의 저비용 항공사다. 2005년 애경그룹과 제주특별자치도의 합작으로 설립됐다.",
    id:"대한민국 최초이자 최대 규모의 저비용 항공사로, 한국 LCC 중 처음으로 증시에 상장했고 합리적 운임으로 국내외 단거리 노선을 확장해 왔다." },
  { s:"celltrion", ko:"셀트리온", en:"Celltrion", dom:"health-pharma", r:4.5, web:"https://www.celltrion.com/",
    def:"셀트리온(Celltrion)은 2002년 서정진이 설립한 한국의 바이오제약 기업으로, 바이오시밀러로 잘 알려져 있다.",
    ov:"셀트리온(Celltrion)은 2002년 서정진이 설립한 한국의 바이오제약 기업으로, 항체 바이오시밀러 개발·제조에 강점을 둔다.",
    id:"자가면역질환 치료제 램시마(Remsima)는 2013년 세계 최초로 승인된 항체 바이오시밀러로, 셀트리온은 트룩시마·허쥬마 등을 잇따라 내놓으며 한국 바이오시밀러 산업을 대표하는 기업이 됐다." },
  { s:"samsung-biologics", ko:"삼성바이오로직스", en:"Samsung Biologics", dom:"health-pharma", r:4.5, web:"https://samsungbiologics.com/",
    def:"삼성바이오로직스(Samsung Biologics)는 삼성그룹 계열의 바이오의약품 위탁개발생산(CDMO) 기업으로, 2011년 설립됐다.",
    ov:"삼성바이오로직스(Samsung Biologics)는 삼성그룹 계열의 바이오의약품 위탁개발생산(CDMO) 기업으로, 2011년 인천 송도에서 설립됐다.",
    id:"세계 최대 규모의 바이오의약품 CDMO로, 항체·이중항체 등 바이오의약품을 글로벌 제약사로부터 수탁 생산하며 한국 바이오 산업의 성장을 상징하는 기업이다." },
  { s:"yuhan", ko:"유한양행", en:"Yuhan Corporation", dom:"health-pharma", r:4.4, web:"https://www.yuhan.co.kr/",
    def:"유한양행(Yuhan Corporation)은 1926년 유일한이 설립한 한국의 대표 장수 제약 기업이다.",
    ov:"유한양행(Yuhan Corporation)은 1926년 유일한이 설립한 한국의 대표 제약 기업이다. 매출 기준 국내 1위급으로, 의약품·건강기능식품 등을 다룬다.",
    id:"한국을 대표하는 장수 제약기업으로, 3세대 폐암 표적치료제 렉라자(레이저티닙)를 개발해 글로벌 라이선스 계약을 맺었다. 창업자 유일한의 기업윤리와 사회환원 정신으로도 잘 알려져 있다." },
  { s:"samyang-foods", ko:"삼양식품", en:"Samyang Foods", dom:"food-beverage", r:4.5, web:"https://www.samyangfoods.com/",
    def:"삼양식품(Samyang Foods)은 1961년 설립된 한국의 라면 기업으로, 국내 최초의 인스턴트 라면 삼양라면과 불닭볶음면으로 알려져 있다.",
    ov:"삼양식품(Samyang Foods)은 1961년 전중윤이 설립한 한국의 식품 기업이다. 1963년 국내 최초의 인스턴트 라면 '삼양라면'을 선보였다.",
    id:"2012년 출시한 불닭볶음면(Buldak)은 매운맛 챌린지 등으로 전 세계에서 바이럴 히트하며 K-푸드 수출을 견인하는 대표 제품이 됐다." },
  { s:"pulmuone", ko:"풀무원", en:"Pulmuone", dom:"food-beverage", r:4.4, web:"https://www.pulmuone.co.kr/",
    def:"풀무원(Pulmuone)은 포장두부와 콩나물 등 식물성 식품으로 알려진 한국의 식품 기업으로, 1980년대 초 출범했다.",
    ov:"풀무원(Pulmuone)은 한국의 대표 식물성 식품 기업이다. 1981년 설립돼 1984년 풀무원식품으로 포장두부 사업을 본격화했다.",
    id:"국내에 포장두부를 상용화한 기업으로, 두부·콩나물·두부면 등 건강 지향 식물성 식품을 중심으로 성장해 왔다." },
  { s:"ottogi", ko:"오뚜기", en:"Ottogi", dom:"food-beverage", r:4.5, web:"https://www.ottogi.co.kr/",
    def:"오뚜기(Ottogi)는 1969년 설립된 한국의 종합 식품 기업으로, 국산 카레와 다양한 가공식품으로 알려져 있다.",
    ov:"오뚜기(Ottogi)는 1969년 함태호가 설립한 한국의 종합 식품 기업이다. 창업과 함께 국내 최초의 국산 카레를 선보였다.",
    id:"카레로 출발해 케첩·마요네즈·라면·즉석밥 등 폭넓은 가공식품 포트폴리오를 갖춘 한국의 대표 식품 기업으로, 친근한 이미지로 사랑받는 국민 브랜드다." },
  { s:"kyochon", ko:"교촌치킨", en:"Kyochon Chicken", dom:"food-beverage", r:4.3, web:"https://www.kyochon.com/",
    def:"교촌치킨(Kyochon Chicken)은 교촌에프앤비가 운영하는 한국식 프라이드치킨 프랜차이즈로, 1991년 경북 구미에서 시작됐다.",
    ov:"교촌치킨(Kyochon Chicken)은 한국을 대표하는 치킨 프랜차이즈다. 1991년 경북 구미에서 창업했고, 운영사는 교촌에프앤비다.",
    id:"붓으로 소스를 바르는 간장마늘(소이갈릭) 치킨을 시그니처로 하는 한국식 프라이드치킨 브랜드로, 두 번 튀기는 조리법과 프리미엄 포지셔닝으로 K-치킨을 대표한다." },
  { s:"mega-coffee", ko:"메가MGC커피", en:"Mega MGC Coffee", dom:"food-beverage", r:4.2, web:"https://www.mega-mgccoffee.com/",
    def:"메가MGC커피(Mega MGC Coffee)는 2015년 시작된 한국의 저가 대용량 커피 프랜차이즈다.",
    ov:"메가MGC커피(Mega MGC Coffee)는 2015년 출범한 한국의 저가 커피 프랜차이즈다.",
    id:"가성비 높은 대용량 커피를 앞세워 빠르게 매장을 확장했으며, 2024년 국내 저가 커피 브랜드 중 처음으로 3,000개 매장을 돌파하며 매장 수 기준 국내 상위권 커피 브랜드로 성장했다." },
  { s:"missha", ko:"미샤", en:"MISSHA", dom:"beauty-personal-care", r:4.3, web:"https://www.missha.co.kr/",
    def:"미샤(MISSHA)는 에이블씨엔씨가 운영하는 한국의 로드숍 화장품 브랜드로, 2000년 온라인 브랜드로 시작됐다.",
    ov:"미샤(MISSHA)는 에이블씨엔씨(Able C&C)의 화장품 브랜드다. 2000년 온라인 브랜드로 론칭해 2002년 첫 직영점을 열었다.",
    id:"'고품질 저가' 전략으로 2000년대 로드숍 화장품 붐을 이끈 브랜드로, 고가 에센스의 합리적 대체재를 표방한 타임레볼루션 라인 등으로 큰 인기를 얻었다." },
  { s:"andar", ko:"안다르", en:"Andar", dom:"sports-outdoor", r:4.2, web:"https://www.andar.co.kr/",
    def:"안다르(Andar)는 2015년 설립된 한국의 애슬레저 브랜드로, 요가복·레깅스로 잘 알려져 있다.",
    ov:"안다르(Andar)는 2015년 설립된 한국의 애슬레저 의류 브랜드다. 2021년 에코마케팅이 지분을 인수해 최대주주가 됐다.",
    id:"요가복과 레깅스에서 출발한 한국의 대표 애슬레저 브랜드로, 기능성 원단 기반 레깅스로 시장을 선도하고 아우터·라이프스타일 라인으로 확장했다." },
  { s:"hankook-tire", ko:"한국타이어", en:"Hankook Tire", dom:"mobility", r:4.5, web:"https://www.hankooktire.com/",
    def:"한국타이어(Hankook Tire & Technology)는 1941년 설립된 한국 최초이자 점유율 1위의 타이어 기업이다.",
    ov:"한국타이어(한국타이어앤테크놀로지)는 한국의 대표 타이어 제조 기업이다. 1941년 조선다이야공업으로 출발했고 2019년 현재의 사명으로 바꿨다.",
    id:"대한민국 최초이자 시장점유율 1위의 타이어 기업으로 세계 6~7위권 규모이며, 글로벌 완성차에 신차용(OE) 타이어를 공급하는 한국 자동차 부품 산업의 대표 브랜드다." },
  { s:"fila-holdings", ko:"휠라", en:"FILA", dom:"sports-outdoor", r:4.4, web:"https://www.fila.com/",
    def:"휠라(FILA)는 1911년 이탈리아에서 창립된 스포츠웨어 브랜드로, 2007년 한국의 휠라코리아가 전 세계 브랜드 사업권을 인수해 현재 한국 기업(휠라홀딩스)이 소유한다.",
    ov:"휠라(FILA)는 스포츠웨어 브랜드다. 1911년 이탈리아 비엘라 인근에서 필라 형제가 창립했으나, 1991년 설립된 휠라코리아가 2007년 전 세계 브랜드 사업권을 인수해 이탈리아 원조 브랜드를 한국 기업이 역인수한 사례가 됐다. 2020년 지주사 전환으로 휠라홀딩스가 됐다.",
    id:"테니스 후원으로 부상한 헤리티지 스포츠웨어 브랜드로, 복고풍 디자인의 재유행과 함께 글로벌 인기를 누렸다. 2011년 골프용품사 아큐시네트(타이틀리스트)를 인수해 골프 사업도 보유한다." },
];

const indCount = {}; let added = 0;
for (const n of NEW) {
  if (existing.has(n.s)) { console.log("SKIP", n.s); continue; }
  all.push({ id: nextId++, slug:n.s, urlSlug:n.s, name:n.ko, nameKo:n.ko, nameEn:n.en, definition:n.def, summary:n.def,
    industry: IND[n.dom], domainSlug:n.dom, tier:"C_source_backed", rating:n.r, image:"", logo:"", insight:n.id, logoHistory:[],
    sections:{ overview:{title:"개요",body:n.ov}, identity:{title:"브랜드 정체성",body:n.id} }, timeline:[], publicReady:true, displayPriority:"normal", officialWebsite:n.web });
  indCount[n.dom]=(indCount[n.dom]||0)+1; added++; console.log("ADD", n.s, "("+n.ko+")");
}
for (const ind of data.industries||[]) if (indCount[ind.id]) ind.count=(Number(ind.count)||0)+indCount[ind.id];
if (data.stats) data.stats.brands = all.length;
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nadded ${added}. allBrands now ${all.length}.`);
