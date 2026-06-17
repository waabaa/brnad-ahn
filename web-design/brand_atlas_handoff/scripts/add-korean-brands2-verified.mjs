// Add 21 major Korean brands across industries, using parallel-agent-verified
// facts (each ≥2 independent sources). No hallucination; dates that sources
// split are phrased with both milestones.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;
const IND = {
  "technology-electronics": "기술·전자", "media-entertainment": "미디어·엔터테인먼트",
  "mobility": "모빌리티", "retail-commerce": "리테일·커머스",
  "food-beverage": "식음료", "brand-business": "브랜드·비즈니스",
};

const NEW = [
  { urlSlug:"kakao", nameKo:"카카오", nameEn:"Kakao", dom:"technology-electronics", r:4.7, web:"https://www.kakaocorp.com/",
    def:"카카오(Kakao)는 2006년 김범수가 설립한 한국의 인터넷·모바일 플랫폼 기업으로, 국민 메신저 카카오톡을 운영한다.",
    ov:"카카오(Kakao Corporation)는 한국의 대표 인터넷·모바일 플랫폼 기업이다. 2006년 김범수가 설립했고, 2014년 다음커뮤니케이션과 합병한 뒤 2015년 사명을 '카카오'로 통일했다.",
    id:"대표 서비스인 카카오톡(KakaoTalk)은 한국 메신저 시장을 사실상 독점하는 슈퍼앱으로, 메시징을 기반으로 결제·모빌리티·콘텐츠·금융 등으로 사업을 확장한 한국형 플랫폼 생태계의 중심이다." },
  { urlSlug:"baemin", nameKo:"배달의민족", nameEn:"Baemin", dom:"technology-electronics", r:4.5, web:"https://www.baemin.com/",
    def:"배달의민족(Baemin)은 우아한형제들이 2010년 출시한 한국 1위 음식 배달 플랫폼으로, 현재 모회사는 독일 딜리버리히어로다.",
    ov:"배달의민족(Baemin)은 우아한형제들(Woowa Brothers)이 2010년 선보인 한국의 대표 음식 배달 플랫폼이다. 창업자는 김봉진이며, 2019~2021년 독일 딜리버리히어로(Delivery Hero)가 인수해 모회사가 됐다.",
    id:"한국 음식 배달 시장 1위 앱으로, 'B급 감성'의 위트 있는 브랜드 보이스와 한나체·주아체 등 자체 무료 글꼴 배포 등 디자인·브랜딩으로도 주목받았다." },
  { urlSlug:"nexon", nameKo:"넥슨", nameEn:"Nexon", dom:"media-entertainment", r:4.5, web:"https://www.nexon.com/",
    def:"넥슨(Nexon)은 1994년 김정주가 설립한 한국 출신의 비디오 게임 개발·퍼블리싱 기업으로, 메이플스토리·던전앤파이터 등으로 알려져 있다.",
    ov:"넥슨(Nexon Co., Ltd.)은 1994년 서울에서 김정주가 설립한 비디오 게임 기업으로, 2005년 본사를 도쿄로 옮기고 도쿄 증시에 상장했다.",
    id:"온라인 라이브 서비스 게임의 선구자로, 메이플스토리(MapleStory)와 던전앤파이터(Dungeon & Fighter) 등 장수 온라인 게임으로 세계적 성공을 거뒀다." },
  { urlSlug:"krafton", nameKo:"크래프톤", nameEn:"Krafton", dom:"media-entertainment", r:4.5, web:"https://www.krafton.com/",
    def:"크래프톤(KRAFTON)은 배틀그라운드(PUBG)로 유명한 한국의 게임 기업으로, 2007년 설립된 블루홀을 전신으로 2018년 지주회사로 출범했다.",
    ov:"크래프톤(KRAFTON, Inc.)은 한국의 비디오 게임 기업이다. 2007년 장병규가 세운 블루홀(Bluehole)이 전신이며, 2018년 게임 제작 연합을 아우르는 지주회사 크래프톤으로 출범했다.",
    id:"대표작 'PUBG: 배틀그라운드'는 배틀로열 장르를 세계적으로 대중화한 게임으로, 크래프톤은 이 IP를 중심으로 글로벌 퍼블리싱과 다중 스튜디오 체제를 구축했다." },
  { urlSlug:"socar", nameKo:"쏘카", nameEn:"Socar", dom:"mobility", r:4.3, web:"https://www.socar.kr/",
    def:"쏘카(Socar)는 2011년 제주에서 시작한 한국 최대의 카셰어링 모빌리티 기업으로, 2022년 한국거래소에 상장했다.",
    ov:"쏘카(Socar)는 한국 최대의 카셰어링 플랫폼이다. 다음 공동창업자 이재웅이 2011년 제주에서 차량 100대로 시작했고, 2022년 8월 한국거래소에 상장했다.",
    id:"시간·일 단위로 차량을 공유하는 모빌리티 서비스로 한국 카셰어링 시장을 개척했으며, 모바일 앱 기반 무인 대여 모델로 자동차 소유 대신 이용이라는 문화를 확산시켰다." },
  { urlSlug:"shinsegae", nameKo:"신세계", nameEn:"Shinsegae", dom:"retail-commerce", r:4.5, web:"https://www.shinsegae.com/",
    def:"신세계(Shinsegae)는 신세계그룹의 대표 백화점 기업으로, 1963년 신세계 명칭을 채택한 한국 3대 백화점 중 하나다.",
    ov:"신세계(Shinsegae Inc.)는 신세계그룹의 핵심 백화점 기업이다. 전신은 1930년 미쓰코시 경성점으로, 1963년 '신세계'로 명명됐고 1990년대 후반 삼성그룹에서 분리 독립했다.",
    id:"롯데·현대와 함께 한국 3대 백화점으로 꼽히며, 부산 센텀시티점은 세계 최대 규모 백화점으로 기네스에 등재됐다. 1967년 한국 최초의 신용카드를 발급한 유통 선구자이기도 하다." },
  { urlSlug:"lotte-mart", nameKo:"롯데마트", nameEn:"Lotte Mart", dom:"retail-commerce", r:4.3, web:"https://www.lottemart.com/",
    def:"롯데마트(Lotte Mart)는 롯데쇼핑이 운영하는 대형마트 체인으로, 1998년 서울에 1호점을 열었다.",
    ov:"롯데마트(Lotte Mart)는 롯데그룹 계열 롯데쇼핑이 운영하는 대형마트(하이퍼마켓) 체인이다. 1998년 4월 서울 강변에 1호점을 열었다.",
    id:"한국의 대표 대형마트 체인 중 하나로, 중국·인도네시아 등 해외 시장에 진출한 초기 한국 소매 브랜드로 동아시아·동남아 확장을 추진했다." },
  { urlSlug:"gs25", nameKo:"GS25", nameEn:"GS25", dom:"retail-commerce", r:4.4, web:"https://www.gs25.gsretail.com/",
    def:"GS25는 GS리테일이 운영하는 한국 선두권 편의점 체인으로, 1990년 LG25로 출발해 2005년 GS25로 바뀌었다.",
    ov:"GS25는 GS그룹 계열 GS리테일이 운영하는 편의점 체인이다. 1990년 서울에 1호점을 'LG25'라는 이름으로 열었고, 2005년 GS그룹이 LG에서 분리되며 'GS25'로 변경됐다.",
    id:"한국 편의점 업계 선두권 브랜드로, 자체 PB 상품과 차별화된 점포 운영, 해외 로열티 수출 등으로 확장한 한국 자생 편의점의 대표 사례다." },
  { urlSlug:"kurly", nameKo:"컬리", nameEn:"Kurly", dom:"retail-commerce", r:4.3, web:"https://www.kurly.com/",
    def:"컬리(Kurly)는 마켓컬리를 운영하는 한국의 온라인 신선식품 기업으로, 새벽배송 '샛별배송'을 개척했다.",
    ov:"컬리(Kurly Inc.)는 김슬아가 2014년 'The Farmers'로 설립하고 2015년 온라인 식료품 서비스 마켓컬리를 출시한 기업으로, 2018년 'Kurly'로 리브랜딩했다.",
    id:"밤 11시 이전 주문 시 다음 날 오전 7시 전에 콜드체인으로 배송하는 '샛별배송'으로 한국 새벽배송 시장을 열었으며, 2021년 기업가치 10억 달러를 넘긴 유니콘으로 성장했다." },
  { urlSlug:"danggeun-market", nameKo:"당근마켓", nameEn:"Karrot", dom:"retail-commerce", r:4.3, web:"https://www.daangn.com/",
    def:"당근마켓(영문 Karrot)은 2015년 설립된 한국 최대의 지역 기반 중고거래·동네 커뮤니티 플랫폼이다.",
    ov:"당근마켓(Danggeun Market, 영문 서비스명 Karrot)은 2015년 전 카카오 출신 창업자들이 세운 하이퍼로컬 플랫폼이다. '당근'은 '당신 근처'를 줄인 말이다.",
    id:"동네 반경 기반으로 이웃 간 중고거래와 지역 커뮤니티를 연결하는 한국 최대 중고거래 플랫폼으로, 캐나다·미국·일본 등 해외에도 진출했다." },
  { urlSlug:"nongshim", nameKo:"농심", nameEn:"Nongshim", dom:"food-beverage", r:4.6, web:"https://www.nongshim.com/",
    def:"농심(Nongshim)은 신라면으로 유명한 한국의 대표 라면·스낵 기업으로, 1965년 설립돼 1978년 농심으로 사명을 바꿨다.",
    ov:"농심(農心, Nongshim)은 한국의 대표 라면·스낵 제조 기업이다. 1965년 롯데공업으로 설립됐고 1978년 '농심'으로 사명을 변경했으며, 2003년 농심홀딩스 지주 체제로 전환했다.",
    id:"1986년 출시한 신라면(Shin Ramyun)은 한국을 대표하는 라면으로 세계 100여 개국에 수출되며 K-푸드의 상징이 됐고, 새우깡 등 스낵으로도 친숙한 국민 식품 브랜드다." },
  { urlSlug:"orion", nameKo:"오리온", nameEn:"Orion", dom:"food-beverage", r:4.5, web:"https://www.orionworld.com/",
    def:"오리온(Orion)은 초코파이로 유명한 한국의 대표 제과 기업으로, 1956년 동양제과로 설립됐다.",
    ov:"오리온(Orion Corporation)은 한국의 대표 제과 기업이다. 1956년 동양제과로 설립됐으며, 현재 오리온홀딩스 지주 체제로 운영된다.",
    id:"1974년 출시한 초코파이(Choco Pie)는 '정(情)' 마케팅과 함께 한국을 대표하는 과자로 자리 잡았고, 중국·베트남·러시아 등 해외 시장에서도 큰 성공을 거뒀다." },
  { urlSlug:"lotte-chilsung", nameKo:"롯데칠성음료", nameEn:"Lotte Chilsung Beverage", dom:"food-beverage", r:4.3, web:"https://company.lottechilsung.co.kr/",
    def:"롯데칠성음료(Lotte Chilsung Beverage)는 칠성사이다로 유명한 한국의 대표 음료 기업으로, 롯데그룹 계열사다.",
    ov:"롯데칠성음료(Lotte Chilsung Beverage)는 한국의 대표 음료 제조 기업으로 롯데그룹 계열이다. 1950년 출시된 칠성사이다에 뿌리를 둔다.",
    id:"한국에서 가장 오래된 음료 브랜드 중 하나인 칠성사이다(1950)를 중심으로 탄산·생수·주스·주류까지 폭넓은 음료 포트폴리오를 보유한다. '칠성'은 북두칠성에서 따온 이름이다." },
  { urlSlug:"binggrae", nameKo:"빙그레", nameEn:"Binggrae", dom:"food-beverage", r:4.3, web:"https://www.bing.co.kr/",
    def:"빙그레(Binggrae)는 바나나맛우유로 유명한 한국의 유제품·빙과 기업으로, 1967년 설립됐다.",
    ov:"빙그레(Binggrae)는 한국의 대표 유제품·빙과 기업이다. 1967년 대일양행으로 설립됐으며 과거 한화그룹 계열이었다가 1992년 독립했다. 사명 '빙그레'는 미소를 뜻한다.",
    id:"1974년 출시한 바나나맛우유는 항아리 모양 용기로 상징되는 한국의 국민 음료가 됐고, 메로나·투게더 등 빙과류와 함께 친숙한 식품 브랜드로 자리 잡았다." },
  { urlSlug:"hitejinro", nameKo:"하이트진로", nameEn:"HiteJinro", dom:"food-beverage", r:4.4, web:"https://www.hitejinro.com/",
    def:"하이트진로(HiteJinro)는 참이슬 소주와 하이트·테라 맥주로 유명한 한국의 대표 주류 기업으로, 그 기원은 1924년으로 거슬러 올라간다.",
    ov:"하이트진로(HiteJinro)는 한국의 대표 주류 기업이다. 진로의 전신은 1924년, 하이트의 전신 조선맥주는 1933년에 출발했으며, 2005년 하이트가 진로를 인수한 뒤 2011년 '하이트진로'로 통합·사명 변경했다.",
    id:"소주 참이슬(1998)과 맥주 하이트·테라를 대표 제품으로 하는 한국 1위 주류 기업으로, 한국 소주를 세계에 알리는 K-주류의 중심 브랜드다." },
  { urlSlug:"hybe", nameKo:"하이브", nameEn:"HYBE", dom:"media-entertainment", r:4.7, web:"https://hybecorp.com/",
    def:"하이브(HYBE)는 방탄소년단(BTS)으로 알려진 한국의 대표 엔터테인먼트 기업으로, 2005년 빅히트 엔터테인먼트로 설립돼 2021년 하이브로 사명을 바꿨다.",
    ov:"하이브(HYBE Co., Ltd.)는 한국의 대표 음악·엔터테인먼트 기업이다. 2005년 방시혁이 빅히트 엔터테인먼트로 설립했고, 2021년 3월 사명을 '하이브'로 바꾸면서 음반 레이블은 빅히트 뮤직으로 분리했다.",
    id:"방탄소년단(BTS)을 세계적 그룹으로 키워낸 기업으로, 빅히트 뮤직·쏘스뮤직·플레디스 등 다수 레이블을 거느린 멀티 레이블 체제와 위버스 같은 팬덤 플랫폼으로 K-팝 산업 구조를 재편했다." },
  { urlSlug:"sm-entertainment", nameKo:"SM엔터테인먼트", nameEn:"SM Entertainment", dom:"media-entertainment", r:4.6, web:"https://www.smentertainment.com/",
    def:"SM엔터테인먼트(SM Entertainment)는 이수만이 세운 한국의 대표 K-팝 기획사로, 1995년 법인이 설립됐다.",
    ov:"SM엔터테인먼트(SM Entertainment)는 한국의 대표 음악·엔터테인먼트 기업이다. 이수만이 1989년 'SM 스튜디오'로 시작해 1995년 법인을 설립했으며, 2023년 카카오·카카오엔터테인먼트가 최대주주가 됐다.",
    id:"H.O.T.·보아·동방신기·슈퍼주니어·소녀시대·EXO·NCT·aespa 등 한류를 이끈 아티스트를 배출하며 K-팝의 세계화를 주도한 1세대 대표 기획사다." },
  { urlSlug:"kakao-entertainment", nameKo:"카카오엔터테인먼트", nameEn:"Kakao Entertainment", dom:"media-entertainment", r:4.4, web:"https://www.kakaoent.com/",
    def:"카카오엔터테인먼트(Kakao Entertainment)는 카카오 산하의 콘텐츠 기업으로, 2021년 카카오페이지와 카카오M의 합병으로 출범했다.",
    ov:"카카오엔터테인먼트(Kakao Entertainment)는 카카오(약 63.5% 보유) 산하의 디지털 콘텐츠·미디어 기업이다. 2021년 3월 카카오페이지와 카카오M의 합병으로 출범했다.",
    id:"웹툰·웹소설(카카오웹툰·카카오페이지), 음원 플랫폼 멜론, 영상·음악 제작과 IP를 아우르며, 미국 타파스·래디시 인수 등으로 글로벌 스토리텔링 사업을 확장했다." },
  { urlSlug:"kb-kookmin-bank", nameKo:"KB국민은행", nameEn:"KB Kookmin Bank", dom:"brand-business", r:4.5, web:"https://www.kbstar.com/",
    def:"KB국민은행(KB Kookmin Bank)은 자산 기준 한국 최대급 시중은행으로, KB금융지주 산하다.",
    ov:"KB국민은행(KB Kookmin Bank)은 한국의 대표 시중은행이다. 1962년 정부 설립으로 출발해 2001년 주택은행과 합병하며 현재 형태를 완성했고, 모지주인 KB금융지주는 2008년 설립됐다.",
    id:"자산 기준 한국 최대급 은행으로, 폭넓은 소매금융 기반과 전국 점포망을 갖춘 한국 5대 금융그룹의 핵심 은행이다." },
  { urlSlug:"shinhan-financial-group", nameKo:"신한금융그룹", nameEn:"Shinhan Financial Group", dom:"brand-business", r:4.5, web:"https://www.shinhangroup.com/",
    def:"신한금융그룹(Shinhan Financial Group)은 2001년 설립된 한국 최초의 민간 금융지주회사다.",
    ov:"신한금융그룹(Shinhan Financial Group)은 한국의 대표 금융지주회사다. 2001년 한국 최초의 민간 금융지주회사로 설립됐으며, 핵심 자회사 신한은행은 1982년 순수 민간자본 은행으로 출발했다.",
    id:"신한은행·신한카드·신한투자증권·신한라이프 등을 거느린 한국 5대 금융그룹 중 하나로, 은행·카드·증권·보험을 아우르는 종합 금융 포트폴리오를 갖췄다." },
  { urlSlug:"kakaobank", nameKo:"카카오뱅크", nameEn:"KakaoBank", dom:"brand-business", r:4.5, web:"https://www.kakaobank.com/",
    def:"카카오뱅크(KakaoBank)는 카카오 계열의 인터넷전문은행으로, 2016년 법인 설립 후 2017년 서비스를 시작했다.",
    ov:"카카오뱅크(KakaoBank)는 한국의 대표 인터넷전문은행이다. 2016년 법인을 설립하고 2017년 7월 서비스를 출범했으며, 주요 주주로 카카오와 한국투자 계열이 참여한다.",
    id:"점포 없는 모바일 기반 은행으로 출범 직후 폭발적 가입자 증가를 기록했고, 카카오톡 연계와 간편한 비대면 인증 등 디지털 혁신으로 한국 모바일 뱅킹을 대표하는 브랜드가 됐다." },
];

const indCount = {};
let added = 0;
for (const n of NEW) {
  if (existing.has(n.urlSlug)) { console.log("SKIP exists:", n.urlSlug); continue; }
  all.push({
    id: nextId++, slug: n.urlSlug, urlSlug: n.urlSlug, name: n.nameKo, nameKo: n.nameKo, nameEn: n.nameEn,
    definition: n.def, summary: n.def, industry: IND[n.dom], domainSlug: n.dom,
    tier: "C_source_backed", rating: n.r, image: "", logo: "", insight: n.id, logoHistory: [],
    sections: { overview: { title: "개요", body: n.ov }, identity: { title: "브랜드 정체성", body: n.id } },
    timeline: [], publicReady: true, displayPriority: "normal", officialWebsite: n.web,
  });
  indCount[n.dom] = (indCount[n.dom] || 0) + 1;
  added++;
  console.log("ADD", n.urlSlug, "(" + n.nameKo + ") ->", n.dom);
}
for (const ind of data.industries || []) if (indCount[ind.id]) ind.count = (Number(ind.count) || 0) + indCount[ind.id];
if (data.stats) data.stats.brands = all.length;
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nadded ${added}. allBrands now ${all.length}.`);
