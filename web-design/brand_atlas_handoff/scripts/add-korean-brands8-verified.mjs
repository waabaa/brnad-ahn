// Add 26 more major Korean brands (outdoor, construction, pharma/bio,
// home-appliance/rental, food, game/fintech). Parallel-agent-verified
// (each fact cross-checked against >=2 independent sources). No hallucination:
// unverifiable specifics omitted. Duplicates already in DB excluded:
// kolon-sport, blackyak, k2(korea), toss.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;
const IND = {
  "sports-outdoor":"스포츠·아웃도어","brand-business":"브랜드·비즈니스",
  "health-pharma":"헬스·제약","home-lifestyle":"홈·라이프스타일",
  "food-beverage":"식음료","media-entertainment":"미디어·엔터테인먼트",
  "technology-electronics":"기술·전자"
};

const NEW = [
  // --- Outdoor / Sports ---
  { s:"nepa", ko:"네파", en:"NEPA", dom:"sports-outdoor", r:4.0, web:"https://www.nepamall.com/",
    def:"네파(NEPA)는 1996년 이탈리아에서 시작해 2005년부터 한국에서 본격 전개된 아웃도어 브랜드다.",
    ov:"네파(NEPA)는 1996년 이탈리아 베르가모에서 등산화 브랜드로 출발했고, 2005년 평안L&C가 인수해 국내에 론칭했다. 2013년 사모펀드 MBK파트너스가 인수해 현재 운영하며 본사는 서울 강남에 있다.",
    id:"자유로운 감성을 표방하는 라이프스타일형 아웃도어 브랜드다." },
  { s:"eider", ko:"아이더", en:"EIDER", dom:"sports-outdoor", r:4.0, web:"https://www.eider.co.kr/",
    def:"아이더(EIDER)는 1962년 프랑스에서 설립돼 현재 한국 K2코리아가 전개·보유한 아웃도어 브랜드다.",
    ov:"아이더(EIDER)는 1962년 프랑스에서 시작해 2008년 라푸마 자회사가 됐다. K2코리아가 2006년 라이선스로 한국 사업을 시작해 2009년 국내 상표권, 2020년 글로벌 상표권까지 인수하며 한국 기업이 보유한 글로벌 브랜드가 됐다.",
    id:"프랑스 헤리티지를 가진, K2코리아가 글로벌 전개하는 프리미엄 아웃도어 브랜드다." },
  // --- Construction ---
  { s:"gs-construction", ko:"GS건설", en:"GS E&C", dom:"brand-business", r:4.2, web:"https://www.gsenc.com/",
    def:"GS건설(GS E&C)은 GS그룹 계열의 종합건설회사로, 자이(Xi) 아파트 브랜드를 보유한 한국 대표 건설사다.",
    ov:"GS건설(GS E&C)은 1969년 락희개발로 출발해 LG건설을 거쳐 2005년 GS그룹 편입과 함께 현 사명이 됐다. 주택·건축·토목·플랜트·환경 사업을 영위하며 2002년 출시한 자이(Xi)를 주력 아파트 브랜드로 운영한다.",
    id:"고급 주거 브랜드 자이를 앞세운 한국 종합건설 대표 기업이다." },
  { s:"dl-enc", ko:"DL이앤씨", en:"DL E&C", dom:"brand-business", r:4.1, web:"https://www.dlenc.co.kr/",
    def:"DL이앤씨(DL E&C)는 2021년 대림산업에서 분할 설립된 DL그룹 계열 건설사로, e편한세상·아크로 아파트 브랜드를 보유한 기업이다.",
    ov:"DL이앤씨(DL E&C)는 2021년 DL그룹의 지주회사 체제 전환에 따라 옛 대림산업의 건설부문이 인적분할로 설립됐다. 토목·주택·플랜트 사업을 국내외에서 수행하며 주력 주거 브랜드는 e편한세상, 하이엔드 브랜드는 아크로다.",
    id:"글로벌 디벨로퍼를 지향하는 DL그룹 핵심 건설사다." },
  { s:"hdc-hyundai", ko:"HDC현대산업개발", en:"HDC Hyundai Development", dom:"brand-business", r:4.0, web:"https://www.hdc-dvp.com/",
    def:"HDC현대산업개발(HDC)은 2018년 현대산업개발의 건설부문이 분할 설립된 HDC그룹 핵심 건설사로, 아이파크(IPARK) 아파트 브랜드를 보유한다.",
    ov:"HDC현대산업개발(HDC)은 2018년 지주회사 HDC와 사업회사로 분할되며 HDC그룹이 정식 출범할 때 설립됐다. 주택·건축·토목·개발 사업을 영위하며 2001년 출시한 아이파크를 주력 브랜드로 운영한다.",
    id:"아이파크 브랜드 중심의 디벨로퍼형 종합건설사다." },
  { s:"daewoo-enc", ko:"대우건설", en:"Daewoo E&C", dom:"brand-business", r:4.1, web:"https://www.daewooenc.com/",
    def:"대우건설(Daewoo E&C)은 1973년에 기원을 둔 한국의 종합건설사로, 2021년 중흥그룹에 인수됐으며 푸르지오 아파트 브랜드를 보유한다.",
    ov:"대우건설(Daewoo E&C)은 1973년 대우개발에서 출발해 여러 차례 소유권 변동을 겪었고, 산업은행 체제를 거쳐 2021년 중흥건설에 인수됐다. 주택·토목·플랜트·해외 사업을 수행하며 푸르지오를 주력 주거 브랜드로 운영한다.",
    id:"푸르지오 브랜드를 보유한 중흥그룹 산하 대형 건설사다." },
  { s:"samsung-ct", ko:"삼성물산", en:"Samsung C&T", dom:"brand-business", r:4.3, web:"https://www.samsungcnt.com/",
    def:"삼성물산(Samsung C&T)은 건설·상사·패션·리조트 사업을 아우르는 삼성그룹의 핵심 기업으로, 래미안 아파트 브랜드로 알려져 있다.",
    ov:"삼성물산(Samsung C&T)은 1938년 삼성상회에 기원을 두며, 건설부문은 1977년 삼성종합건설로 출범했다. 2015년 제일모직과 옛 삼성물산의 합병으로 현재 체제가 됐고, 부르즈 칼리파 등 글로벌 프로젝트를 수행하며 2000년 출시한 래미안을 주력 주거 브랜드로 운영한다.",
    id:"래미안과 글로벌 랜드마크 시공으로 대표되는 삼성그룹의 사실상 지주격 기업이다." },
  // --- Pharma / Bio ---
  { s:"daewoong", ko:"대웅제약", en:"Daewoong Pharmaceutical", dom:"health-pharma", r:4.2, web:"https://www.daewoong.co.kr/",
    def:"대웅제약(Daewoong Pharmaceutical)은 우루사·나보타 등을 보유한 한국의 종합 제약회사다.",
    ov:"대웅제약(Daewoong Pharmaceutical)은 1945년 대한비타민화학공업사에 기원을 두며 2002년 인적분할로 지주회사 체제 산하 신설법인으로 재편됐다. 전문의약품과 일반의약품을 모두 생산하며 보툴리눔 톡신 나보타로 글로벌 시장에 진출했다.",
    id:"우루사로 대표되는 국내 대표 제약사이자 보툴리눔 톡신 수출 기업이다." },
  { s:"dong-a-st", ko:"동아에스티", en:"Dong-A ST", dom:"health-pharma", r:4.1, web:"https://www.donga-st.com/",
    def:"동아에스티(Dong-A ST)는 동아쏘시오그룹 산하의 전문의약품·바이오 전문 제약회사다.",
    ov:"동아에스티(Dong-A ST)는 2013년 동아제약의 인적분할로 신설됐으며 동아쏘시오홀딩스를 지주회사로 두는 그룹 체제에 속한다. 전문의약품과 신약개발, 바이오의약품, 의료기기 사업을 영위한다.",
    id:"동아제약에서 분리된 전문의약품 중심의 신약개발 기업이다." },
  { s:"sk-biopharm", ko:"SK바이오팜", en:"SK Biopharmaceuticals", dom:"health-pharma", r:4.2, web:"https://www.skbp.com/",
    def:"SK바이오팜(SK Biopharmaceuticals)은 SK그룹 산하의 중추신경계 신약개발 전문 바이오 기업이다.",
    ov:"SK바이오팜(SK Biopharmaceuticals)은 1993년 SK그룹의 신약연구로 출발해 2011년 분사했다. 뇌전증 치료제 세노바메이트(미국 브랜드 엑스코프리)와 솔리암페톨 두 신약으로 FDA 승인을 받은 한국 유일 기업으로 중추신경계와 항암 영역에 집중한다.",
    id:"세노바메이트로 미국 직접 진출에 성공한 한국 대표 혁신신약 기업이다." },
  { s:"hugel", ko:"휴젤", en:"Hugel", dom:"health-pharma", r:4.1, web:"https://www.hugel.co.kr/",
    def:"휴젤(Hugel)은 보툴리눔 톡신 보툴렉스(레티보)를 보유한 한국의 미용 의료 바이오 기업이다.",
    ov:"휴젤(Hugel)은 2001년 설립된 국내 최대 보툴리눔 톡신 제조사로, 보툴렉스를 수출명 레티보로 미국·유럽·중국 3대 미용시장에 모두 진출시켰다. 2021년 CBC그룹 주축 컨소시엄이 최대주주가 됐다.",
    id:"보툴렉스·레티보로 글로벌 미용 톡신 시장을 공략하는 K-뷰티 바이오 기업이다." },
  { s:"boryung", ko:"보령", en:"Boryung", dom:"health-pharma", r:4.0, web:"https://www.boryung.co.kr/",
    def:"보령(Boryung)은 고혈압 치료제 카나브와 제산제 겔포스를 보유한 한국의 제약·헬스케어 기업이다.",
    ov:"보령(Boryung)은 1957년 보령약국에서 출발해 심혈관계 의약품과 겔포스로 성장했다. 2022년 사명을 보령제약에서 보령으로 변경하며 우주·항암 등 신사업 확장 의지를 반영했다.",
    id:"고혈압 치료제 카나브로 대표되며 우주헬스케어로 영역을 넓히는 제약사다." },
  // --- Home appliance / Rental ---
  { s:"coway", ko:"코웨이", en:"Coway", dom:"home-lifestyle", r:4.3, web:"https://www.coway.com/",
    def:"코웨이(Coway)는 정수기·공기청정기 등 환경가전을 렌탈·판매하는 대한민국의 생활가전 기업이다.",
    ov:"코웨이(Coway)는 1989년 한국코웨이로 설립돼 정수기 렌탈 사업으로 국내 렌탈 시장 1위에 올랐다. 웅진그룹 계열을 거쳐 2020년 넷마블에 인수되며 사명을 코웨이로 확정했고 본사는 충남 공주에 있다.",
    id:"국내 렌탈 시장을 개척한 환경가전 렌탈 분야의 선도 기업이다." },
  { s:"cuckoo", ko:"쿠쿠", en:"CUCKOO", dom:"home-lifestyle", r:4.2, web:"https://www.cuckoo.co.kr/",
    def:"쿠쿠(CUCKOO)는 전기밥솥을 주력으로 하는 대한민국의 종합 생활가전 브랜드다.",
    ov:"쿠쿠(CUCKOO)는 1978년 성광전자로 출발해 밥솥 OEM을 생산했고, 1998년 자체 브랜드 쿠쿠를 출시한 뒤 국내 전기밥솥 시장 1위에 올랐다. 2017년 지주사 체제(쿠쿠홀딩스)로 전환했다.",
    id:"'국민 밥솥' 신화를 쓴 전기밥솥 1위 가전 기업이다." },
  { s:"sk-magic", ko:"SK매직", en:"SK Magic", dom:"home-lifestyle", r:4.0, web:"https://www.skmagic.com/",
    def:"SK매직(SK Magic)은 SK네트웍스가 보유한 대한민국의 환경가전·렌탈 브랜드다.",
    ov:"SK매직(SK Magic)은 동양매직을 전신으로 2016년 SK네트웍스에 인수되며 현 브랜드명이 됐다. 식기세척기·가스레인지·정수기 등 주방·환경가전을 주력으로 하며, 2025년 법인명을 SK인텔릭스로 변경했다.",
    id:"주방·환경가전 중심의 SK그룹 렌탈 가전 브랜드다." },
  { s:"winia", ko:"위니아", en:"WINIA", dom:"home-lifestyle", r:3.9, web:"https://www.winia.com/",
    def:"위니아(WINIA)는 김치냉장고 '딤채'로 알려진 대한민국의 생활가전 브랜드다.",
    ov:"위니아(WINIA)는 만도기계 가전부문에서 출발해 1993년 위니아 브랜드, 1995년 김치냉장고 딤채를 출시하며 김치냉장고 시장을 개척했다. 위니아만도·대유위니아를 거쳐 2022년 위니아로 사명을 바꿨으나 2023년 부도 이후 회생절차를 밟았다.",
    id:"김치냉장고 '딤채'를 탄생시킨 김치냉장고의 원조 브랜드다." },
  { s:"cheongho-nais", ko:"청호나이스", en:"Cheongho Nais", dom:"home-lifestyle", r:4.0, web:"https://www.chungho.co.kr/",
    def:"청호나이스(Cheongho Nais)는 정수기를 주력으로 하는 대한민국의 생활가전 렌탈 기업이다.",
    ov:"청호나이스(Cheongho Nais)는 1993년 정휘동이 설립해 정수기 전문 기업으로 성장했으며, 세계 최초 얼음정수기 등 정수 기술로 알려졌다. 정수·공기·비데 등 환경가전을 렌탈·판매한다.",
    id:"'정수기 명가'로 불리는 정수 기술 중심의 렌탈 가전 기업이다." },
  // --- Food ---
  { s:"sempio", ko:"샘표", en:"Sempio", dom:"food-beverage", r:4.2, web:"https://www.sempio.com/",
    def:"샘표(Sempio)는 1946년 설립된 대한민국에서 가장 오래된 간장·발효식품 브랜드다.",
    ov:"샘표(Sempio)는 1946년 설립돼 간장을 비롯한 장류로 성장한 국내 최고(最古) 발효식품 기업이다. 2016년 지주사 체제로 전환했으며 연두·폰타나·티아시아 등으로 제품군을 넓혔다.",
    id:"전통 발효 기술을 기반으로 한국의 맛을 세계에 알리는 발효식품 전문 브랜드다." },
  { s:"crown-confectionery", ko:"크라운제과", en:"Crown Confectionery", dom:"food-beverage", r:4.1, web:"https://www.crown.co.kr/",
    def:"크라운제과(Crown Confectionery)는 크라운해태홀딩스를 지주회사로 하는 대한민국의 종합 제과 기업이다.",
    ov:"크라운제과(Crown Confectionery)는 1947년 영일당제과로 출발해 1956년 크라운제과로 이름을 바꿨고 1968년 현 법인이 설립됐다. 2005년 해태제과를 인수했고 2017년 지주사 체제로 분리됐으며 죠리퐁·산도·쿠크다스 등이 대표 제품이다.",
    id:"죠리퐁과 산도로 상징되는 대한민국 대표 장수 제과 브랜드다." },
  { s:"spc-samlip", ko:"SPC삼립", en:"SPC Samlip", dom:"food-beverage", r:4.1, web:"https://www.spcsamlip.co.kr/",
    def:"SPC삼립(SPC Samlip)은 1945년 창업한 상미당을 모태로 하는 SPC그룹 계열의 종합 제빵·식품 기업이다.",
    ov:"SPC삼립(SPC Samlip)은 1945년 상미당에서 출발해 1968년 삼립식품공업으로 법인화했고, 2016년 SPC삼립으로 사명을 바꿨다. 호빵·크림빵 등 양산빵으로 잘 알려졌으며 2026년 사명을 삼립으로 재변경하기로 의결했다.",
    id:"호빵으로 상징되는 80년 역사의 한국 양산빵 대표 브랜드다." },
  { s:"hy", ko:"hy", en:"hy", dom:"food-beverage", r:4.1, web:"https://www.hy.co.kr/",
    def:"hy(에치와이)는 1969년 한국야쿠르트로 설립돼 2021년 현재 사명으로 바꾼 대한민국의 발효유·유통전문 기업이다.",
    ov:"hy(에치와이)는 1969년 한국야쿠르트로 설립돼 야쿠르트와 발효유로 성장했고 2021년 사명을 hy로 변경했다. 헬리코박터 프로젝트 윌 등 기능성 발효유와 냉장 유통 네트워크, 온라인몰 프레딧을 운영한다.",
    id:"유산균·발효유 전문성과 냉장 유통 네트워크를 결합한 유통·물류 플랫폼 기업이다." },
  { s:"sajo", ko:"사조", en:"Sajo", dom:"food-beverage", r:4.0, web:"https://www.sajo.co.kr/",
    def:"사조(Sajo)는 1971년 설립된 사조산업을 모태로 원양어업과 수산·식품가공을 핵심으로 하는 대한민국의 기업집단이다.",
    ov:"사조(Sajo)는 1971년 사조산업으로 출발해 원양어업과 참치캔 사업으로 성장했고 사조대림·사조씨푸드 등 다수 식품 계열사를 거느린다. 참치캔·어묵·김·맛살 등 폭넓은 수산·가공식품을 생산한다.",
    id:"'바다에서 식탁까지'를 표방하는 원양어업·수산식품 종합 기업집단이다." },
  // --- Game / Fintech / IT ---
  { s:"neowiz", ko:"네오위즈", en:"NEOWIZ", dom:"media-entertainment", r:4.1, web:"https://www.neowiz.com/",
    def:"네오위즈(NEOWIZ)는 'P의 거짓'으로 대표되는 한국의 게임 개발·퍼블리싱 기업이다.",
    ov:"네오위즈(NEOWIZ)는 1997년 창업한 그룹에서 2007년 게임 사업이 분할돼 출범했고 네오위즈홀딩스를 모회사로 둔다. 2023년 콘솔 액션 RPG 'P의 거짓'으로 대한민국 게임대상 대상을 받았으며 DJMAX 시리즈 등도 보유한다.",
    id:"모바일에서 콘솔·PC로 전략을 전환해 'P의 거짓'으로 글로벌에 안착한 게임사다." },
  { s:"lionheart-studio", ko:"라이온하트 스튜디오", en:"Lionheart Studio", dom:"media-entertainment", r:4.0, web:"https://lionhearts.co.kr/",
    def:"라이온하트 스튜디오(Lionheart Studio)는 MMORPG '오딘: 발할라 라이징'을 개발한 카카오게임즈 계열의 한국 게임 개발 스튜디오다.",
    ov:"라이온하트 스튜디오(Lionheart Studio)는 2018년 설립돼 2021년 MMORPG '오딘: 발할라 라이징'을 출시하며 구글플레이 매출 1위와 대한민국 게임대상 대상을 차지했다. 2021년 카카오게임즈의 자회사로 편입됐다.",
    id:"고품질 그래픽 MMORPG를 지향하는 카카오게임즈 산하 개발 스튜디오다." },
  { s:"nhn", ko:"NHN", en:"NHN Corporation", dom:"technology-electronics", r:4.0, web:"https://nhn.com/",
    def:"NHN은 게임을 기반으로 PAYCO 간편결제, 클라우드, 커머스·콘텐츠를 영위하는 한국의 종합 IT 기업이다.",
    ov:"NHN은 2013년 네이버에서 분할된 NHN엔터테인먼트가 2019년 현 사명으로 바꾼 회사로, 네이버와는 별개의 독립 상장사다. 한게임을 기반으로 PAYCO 결제, NHN Cloud, 커머스·콘텐츠로 사업을 확장했다.",
    id:"게임 DNA에서 출발해 결제·클라우드·콘텐츠로 확장한 종합 IT 테크 기업이다." },
  { s:"zigbang", ko:"직방", en:"Zigbang", dom:"technology-electronics", r:4.0, web:"https://www.zigbang.com/",
    def:"직방(Zigbang)은 대한민국의 부동산 중개·정보 플랫폼을 운영하는 프롭테크 기업이다.",
    ov:"직방(Zigbang)은 2010년 채널브리즈로 설립돼 2012년 부동산 앱을 출시했고 2015년 사명을 직방으로 바꿨다. 호갱노노·네모 인수와 삼성SDS 홈IoT 사업 인수 등으로 영역을 넓혀 부동산 정보와 스마트홈을 아우른다.",
    id:"부동산 정보 비대칭을 기술로 해소하려는 한국 대표 프롭테크 플랫폼이다." },
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
