// Add 24 more major Korean brands (beauty, fashion-licensed, dining/retail,
// finance, mobility/parts, defense/heavy/materials). Parallel-agent-verified
// (each fact cross-checked against >=2 independent sources). No hallucination:
// unverifiable specifics (e.g. Dr.Jart founding year, Hyundai Marine interim
// names) are intentionally omitted. Duplicates already in DB excluded:
// innisfree, sulwhasoo, laneige, dr-jart, musinsa, olive-young.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const all = data.allBrands || (data.allBrands = []);
const existing = new Set(all.map(b => String(b.urlSlug || b.slug)));
let nextId = Math.max(...all.map(b => Number(b.id) || 0)) + 1;
const IND = {
  "beauty-personal-care":"뷰티·퍼스널케어","fashion-luxury":"패션·럭셔리",
  "food-beverage":"식음료","retail-commerce":"리테일·커머스",
  "brand-business":"브랜드·비즈니스","mobility":"모빌리티"
};

const NEW = [
  // --- Beauty ---
  { s:"clio", ko:"클리오", en:"CLIO", dom:"beauty-personal-care", r:4.2, web:"https://www.cliocosmetic.com/",
    def:"클리오(CLIO)는 한현옥이 1993년 창업한 한국의 색조 화장품 전문 브랜드이자 독립 상장 화장품 기업이다.",
    ov:"클리오(CLIO)는 1993년 전문가용 색조 화장품 브랜드로 출발해 1997년 법인으로 전환했다. 국내에서 가장 오래된 메이크업 전문 회사 중 하나로 꼽히며 2016년 코스닥에 상장했고, 페리페라 등 자매 브랜드를 보유한다.",
    id:"변화를 즐기는 소비자를 겨냥한 색조 중심의 K-뷰티 메이크업 전문 브랜드다." },
  // --- Fashion (licensed/D2C) ---
  { s:"discovery-expedition", ko:"디스커버리 익스페디션", en:"Discovery Expedition", dom:"fashion-luxury", r:4.1, web:"https://www.discovery-expedition.com/",
    def:"디스커버리 익스페디션(Discovery Expedition)은 한국 F&F가 디스커버리 채널 라이선스를 받아 전개하는 라이프스타일 아웃도어 의류 브랜드다.",
    ov:"디스커버리 익스페디션(Discovery Expedition)은 글로벌 다큐멘터리 채널 디스커버리의 브랜드명을 F&F가 2012년 말 의류 라이선스로 들여와 한국에서 독자 기획·전개한 패션 브랜드다. 원본 미디어 채널과 별개로 한국 시장 전용 아웃도어·라이프스타일 라인으로 운영된다.",
    id:"라이선스 기반으로 대중적 아웃도어·라이프스타일을 지향하는 한국 패션 브랜드다." },
  { s:"xexymix", ko:"젝시믹스", en:"XEXYMIX", dom:"fashion-luxury", r:4.0, web:"https://www.xexymix.com/",
    def:"젝시믹스(XEXYMIX)는 대한민국의 여성용 요가복·애슬레저 전문 패션 브랜드다.",
    ov:"젝시믹스(XEXYMIX)는 2015년 온라인 직판(D2C) 기반 요가복 브랜드로 출시됐다. 소셜미디어 마케팅을 앞세워 비대면 소비 확산기에 급성장했고, 운영사 브랜드엑스코퍼레이션은 2020년 코스닥에 상장했다.",
    id:"온라인 직판 중심으로 성장한 국내 대표 애슬레저 브랜드다." },
  { s:"stylenanda", ko:"스타일난다", en:"STYLENANDA", dom:"fashion-luxury", r:4.1, web:"https://www.stylenanda.com/",
    def:"스타일난다(STYLENANDA)는 색조 브랜드 3CE를 보유한 대한민국의 여성 패션·뷰티 브랜드다.",
    ov:"스타일난다(STYLENANDA)는 창업자 김소희가 동대문 기반 온라인 의류 쇼핑몰로 시작해 법인 난다로 키운 브랜드다. 자체 색조 브랜드 3CE로 크게 성장했고, 2018년 로레알이 지분 100%를 인수해 그룹 산하로 편입됐다.",
    id:"트렌디한 여성 패션과 색조 뷰티(3CE)로 아시아에서 확장한 브랜드다." },
  { s:"national-geographic-apparel", ko:"내셔널지오그래픽 어패럴", en:"National Geographic Apparel", dom:"fashion-luxury", r:4.1, web:"https://natgeokorea.com/",
    def:"내셔널지오그래픽 어패럴(National Geographic Apparel)은 한국 더네이처홀딩스가 내셔널지오그래픽 라이선스로 전개하는 라이프스타일 아웃도어 패션 브랜드다.",
    ov:"내셔널지오그래픽 어패럴(National Geographic Apparel)은 더네이처홀딩스가 내셔널지오그래픽의 라이선스를 확보해 가방·캠핑에 이어 2016년 의류 라인을 출시하며 빠르게 성장한 한국 패션 브랜드다. 원본 잡지·미디어 브랜드와 별개로 한국 시장에서 대중적 성공을 거뒀다.",
    id:"탐험·아웃도어 감성을 입은 라이선스 기반 라이프스타일 패션 브랜드다." },
  // --- Dining / Retail ---
  { s:"starbucks-korea", ko:"스타벅스코리아", en:"Starbucks Korea", dom:"food-beverage", r:4.4, web:"https://www.starbucks.co.kr/",
    def:"스타벅스코리아(Starbucks Korea)는 미국 스타벅스 브랜드를 한국에서 운영하는 커피 전문점 체인으로, 운영법인은 에스씨케이컴퍼니다.",
    ov:"스타벅스코리아(Starbucks Korea)는 1997년 이마트와 미국 스타벅스 본사의 합작으로 설립돼 1999년 이화여대 앞에 1호점을 열었다. 2021년 이마트가 지분을 추가 인수해 최대주주가 됐고 나머지는 싱가포르 GIC가 보유하며, 같은 시기 법인명을 SCK컴퍼니로 바꿨다.",
    id:"프리미엄 커피와 '제3의 공간'을 표방하는 한국 최대 커피 체인이다." },
  { s:"daiso", ko:"다이소", en:"DAISO", dom:"retail-commerce", r:4.3, web:"https://www.daiso.co.kr/",
    def:"다이소(DAISO)는 아성다이소가 운영하는 대한민국의 균일가 생활용품·잡화 전문 소매 체인이다.",
    ov:"다이소(DAISO)는 박정부가 1992년 설립한 아성산업이 1997년 서울 천호동에 1호점을 열며 시작했다. '국민가게'를 표방하며 저가 균일가 정책으로 전국에 매장을 확장한 한국 대표 생활용품 체인이다.",
    id:"필요한 건 다 있는 초저가 균일가 생활용품 국민가게다." },
  { s:"baskin-robbins-korea", ko:"배스킨라빈스", en:"Baskin Robbins Korea", dom:"food-beverage", r:4.2, web:"https://www.baskinrobbins.co.kr/",
    def:"배스킨라빈스(Baskin Robbins Korea)는 SPC그룹 계열 비알코리아가 운영하는 미국 배스킨라빈스 아이스크림 브랜드의 한국 사업체다.",
    ov:"배스킨라빈스(Baskin Robbins Korea)는 1985년 SPC그룹과 미국 배스킨라빈스의 합작으로 설립된 비알코리아가 전개한다. 1988년 가맹사업을 시작했고, 같은 계열로 던킨 브랜드도 함께 운영한다.",
    id:"'31가지 맛'으로 알려진 한국 프리미엄 아이스크림 시장의 선도 브랜드다." },
  { s:"gong-cha", ko:"공차", en:"Gong Cha", dom:"food-beverage", r:4.1, web:"https://www.gong-cha.co.kr/",
    def:"공차(Gong Cha)는 대만에서 시작된 버블티 브랜드의 한국 사업을 운영하는 공차코리아의 브랜드다.",
    ov:"공차(Gong Cha)는 2006년 대만 가오슝에서 창업한 버블티 브랜드로, 한국에는 2012년 홍대 1호점을 열며 진출해 국내 버블티 대중화를 이끌었다. 2017년 공차코리아가 대만 글로벌 본사를 인수했고 이후 글로벌 사모펀드가 지배구조를 이어받았다.",
    id:"프리미엄 대만식 밀크티·버블티를 앞세운 글로벌 티 브랜드다." },
  // --- Finance ---
  { s:"ibk", ko:"IBK기업은행", en:"Industrial Bank of Korea", dom:"brand-business", r:4.2, web:"https://www.ibk.co.kr/",
    def:"IBK기업은행(Industrial Bank of Korea)은 중소기업 금융 지원을 목적으로 중소기업은행법에 따라 설립된 대한민국의 국책 특수은행이다.",
    ov:"IBK기업은행(Industrial Bank of Korea)은 1961년 중소기업은행법에 근거해 설립된 국책은행이다. 기획재정부가 최대주주인 정책금융기관으로 중소기업·소상공인 여신을 핵심 사업으로 하며, 2007년부터 'IBK기업은행' 브랜드를 사용한다.",
    id:"중소기업의 성장을 지원하는 대한민국 대표 국책 중소기업 전문은행이다." },
  { s:"samsung-securities", ko:"삼성증권", en:"Samsung Securities", dom:"brand-business", r:4.2, web:"https://www.samsungsecurities.com/",
    def:"삼성증권(Samsung Securities)은 삼성그룹 계열의 대한민국 종합 증권회사다.",
    ov:"삼성증권(Samsung Securities)은 1982년 한일투자금융으로 출발해 1991년 국제증권을 거쳐 1992년 삼성그룹에 편입되면서 현 사명이 됐다. 자산관리와 투자은행 사업을 아우르는 한국 대표 증권사 중 하나다.",
    id:"삼성그룹의 자본력을 바탕으로 한 대한민국 대표 종합 증권·자산관리 브랜드다." },
  { s:"kyobo-life", ko:"교보생명", en:"Kyobo Life Insurance", dom:"brand-business", r:4.2, web:"https://www.kyobo.com/",
    def:"교보생명(Kyobo Life Insurance)은 1958년 대한교육보험으로 출발한 대한민국의 대형 생명보험회사다.",
    ov:"교보생명(Kyobo Life Insurance)은 창업주 신용호가 1958년 대한교육보험을 세워 세계 최초로 교육보험을 선보였고 1995년 현 사명으로 변경했다. 삼성생명·한화생명과 함께 한국 3대 생명보험사로 꼽힌다.",
    id:"교육보험에서 출발한 고객 중심의 대한민국 대표 생명보험 브랜드다." },
  { s:"hyundai-marine", ko:"현대해상", en:"Hyundai Marine & Fire Insurance", dom:"brand-business", r:4.2, web:"https://www.hi.co.kr/",
    def:"현대해상(Hyundai Marine & Fire Insurance)은 1955년 동방해상보험으로 출발한 대한민국의 대형 손해보험회사다.",
    ov:"현대해상(Hyundai Marine & Fire Insurance)은 1955년 설립된 동방해상보험을 전신으로 하며, 현대그룹 인수를 거쳐 1985년 현대해상화재보험으로 사명을 바꿨다. 1999년 현대그룹에서 계열 분리됐고 자동차·일반·장기보험을 아우르는 한국 주요 손해보험사다.",
    id:"오랜 역사를 바탕으로 한 종합 손해보험 분야의 대한민국 대표 브랜드다." },
  { s:"meritz-fire", ko:"메리츠화재", en:"Meritz Fire & Marine Insurance", dom:"brand-business", r:4.1, web:"https://www.meritzfire.com/",
    def:"메리츠화재(Meritz Fire & Marine Insurance)는 1922년 조선화재해상보험으로 출발한 대한민국의 손해보험회사다.",
    ov:"메리츠화재(Meritz Fire & Marine Insurance)는 국내 최초의 손해보험사인 조선화재해상보험을 전신으로 하며, 1950년 동양화재해상보험을 거쳐 2005년 한진그룹에서 분리되면서 현 사명이 됐다. 2023년 메리츠금융지주가 지분 100%를 취득해 완전자회사가 됐다.",
    id:"100년 역사의 국내 최초 손해보험사를 계승한 메리츠금융그룹의 핵심 손해보험 브랜드다." },
  // --- Mobility / Auto parts ---
  { s:"kg-mobility", ko:"KG모빌리티", en:"KG Mobility", dom:"mobility", r:4.0, web:"https://www.kg-mobility.com/",
    def:"KG모빌리티(KG Mobility)는 KG그룹 산하의 대한민국 완성차 제조 기업으로, 옛 쌍용자동차다.",
    ov:"KG모빌리티(KG Mobility)는 오랜 역사를 가진 완성차 회사로 상하이차·마힌드라 등 외국 자본을 거쳐 2022년 KG그룹 컨소시엄에 인수됐다. 2023년 35년간 쓰던 '쌍용자동차' 사명을 KG모빌리티로 변경했으며 토레스·렉스턴 등 SUV·픽업이 주력이다.",
    id:"SUV·픽업 중심의 정통 오프로드·실용 모빌리티 브랜드다." },
  { s:"renault-korea", ko:"르노코리아", en:"Renault Korea", dom:"mobility", r:4.0, web:"https://www.renault.co.kr/",
    def:"르노코리아(Renault Korea)는 프랑스 르노그룹이 지배하는 대한민국의 완성차 제조 기업이다.",
    ov:"르노코리아(Renault Korea)는 1995년 삼성자동차로 출발해 2000년 르노 인수 후 르노삼성자동차가 됐고, 2022년 삼성 상표 계약 종료로 르노코리아자동차를 거쳐 르노코리아로 사명을 바꿨다. 부산공장을 중심으로 생산하며 중국 지리자동차가 2대주주로 참여한다.",
    id:"글로벌 르노그룹의 기술과 국내 생산 기반을 결합한 대중 완성차 브랜드다." },
  { s:"hl-mando", ko:"HL만도", en:"HL Mando", dom:"mobility", r:4.1, web:"https://www.hlmando.com/",
    def:"HL만도(HL Mando)는 HL그룹 계열의 대한민국 자동차 부품(섀시·제동·조향) 제조 기업이다.",
    ov:"HL만도(HL Mando)는 1962년 현대양행에 뿌리를 둔 자동차 부품사로, 2014년 지주사 전환으로 만도가 재상장됐다. 2022년 한라그룹이 HL그룹으로 사명을 바꾸면서 '만도' 앞에 HL을 붙여 HL만도가 됐으며 제동·조향·자율주행 부품이 주력이다.",
    id:"제동·조향 등 섀시 부품과 자율주행 기술을 아우르는 글로벌 자동차 부품 브랜드다." },
  { s:"nexen-tire", ko:"넥센타이어", en:"Nexen Tire", dom:"mobility", r:4.1, web:"https://www.nexentire.com/",
    def:"넥센타이어(Nexen Tire)는 넥센그룹 계열의 대한민국 타이어 제조 기업이다.",
    ov:"넥센타이어(Nexen Tire)는 1942년 흥아고무공업으로 출발한 국내 최초의 타이어 생산업체로, 여러 차례 주인이 바뀐 뒤 1999년 강병중 회장이 인수해 2000년 넥센타이어로 사명을 바꿨다. 한국타이어·금호타이어와 함께 국내 3대 타이어 제조사로 꼽힌다.",
    id:"가성비와 모터스포츠 마케팅을 앞세운 글로벌 타이어 브랜드다." },
  { s:"hanon-systems", ko:"한온시스템", en:"Hanon Systems", dom:"mobility", r:4.0, web:"https://www.hanonsystems.com/",
    def:"한온시스템(Hanon Systems)은 자동차 열관리(공조) 시스템을 제조하는 대한민국의 부품 기업이다.",
    ov:"한온시스템(Hanon Systems)은 1986년 한라공조로 출범한 자동차 공조·열관리 부품사로, 포드·비스테온과의 합작 변천을 거쳐 2013년 한라비스테온공조, 2015년 한온시스템으로 사명을 바꿨다. 전동화 차량 열관리 분야의 글로벌 상위권 기업이다.",
    id:"내연·전기차 전 영역의 차량 열관리 솔루션을 제공하는 글로벌 부품 브랜드다." },
  // --- Defense / Heavy / Materials ---
  { s:"hanwha-aerospace", ko:"한화에어로스페이스", en:"Hanwha Aerospace", dom:"brand-business", r:4.3, web:"https://www.hanwhaaerospace.com/",
    def:"한화에어로스페이스(Hanwha Aerospace)는 항공기 엔진·우주발사체·지상방산을 주력으로 하는 한화그룹의 방위산업 핵심 기업이다.",
    ov:"한화에어로스페이스(Hanwha Aerospace)는 1977년 삼성정밀공업으로 출발해 삼성항공·삼성테크윈을 거쳐 2015년 한화그룹에 인수됐다. 2018년 시큐리티 부문 분할 후 현 사명으로 바꾸며 항공엔진·방산 전문기업으로 정체성을 재정립했고 K9 자주포 등으로 글로벌 방산 수출을 주도한다.",
    id:"항공엔진에서 우주·지상방산까지 아우르는 한화그룹 방산의 중핵이다." },
  { s:"kai", ko:"한국항공우주산업", en:"Korea Aerospace Industries", dom:"brand-business", r:4.2, web:"https://www.koreaaero.com/",
    def:"한국항공우주산업(KAI)은 군용·민수 항공기와 우주발사체를 종합 개발·생산하는 대한민국의 항공우주 전문기업이다.",
    ov:"한국항공우주산업(KAI)은 1999년 외환위기 구조조정 과정에서 국내 3개 기업의 항공사업을 통합해 설립됐다. 한국수출입은행이 최대주주인 사실상 공기업 성격을 가지며, KF-21 보라매·FA-50·수리온 헬기 등을 개발한 국내 유일의 완제기 종합 개발사다.",
    id:"대한민국 항공우주산업을 대표하는 국가 기간 항공기 종합 개발사다." },
  { s:"lig-nex1", ko:"LIG넥스원", en:"LIG Nex1", dom:"brand-business", r:4.1, web:"https://www.lignex1.com/",
    def:"LIG넥스원(LIG Nex1)은 정밀유도무기·감시정찰·항공전자를 주력으로 하는 LIG그룹의 방위산업 전문기업이다.",
    ov:"LIG넥스원(LIG Nex1)은 1976년 금성정밀공업으로 설립돼 LG그룹 방산부문이었다가 2004년 계열분리로 넥스원퓨처를 거쳐 2007년 현 사명으로 재출범했다. 천궁 등 정밀유도무기 분야에서 국내 선도적 위치를 점한다.",
    id:"정밀유도무기를 핵심으로 하는 LIG그룹 방산의 기술 선도 기업이다." },
  { s:"korea-zinc", ko:"고려아연", en:"Korea Zinc", dom:"brand-business", r:4.2, web:"https://www.koreazinc.co.kr/",
    def:"고려아연(Korea Zinc)은 아연·납 등 비철금속을 제련·생산하는 세계 1위급 비철금속 제련 기업이다.",
    ov:"고려아연(Korea Zinc)은 1974년 장병희·최기호 공동 창업으로 설립돼 영풍그룹의 핵심 계열사로 성장했다. 다종의 비철금속을 대량 생산하는 세계 1위 아연 제련사로 꼽히며 전략광물 사업으로 영역을 넓혀 왔다.",
    id:"세계 최대 규모의 비철금속 제련 리더이자 전략광물 생산 기업이다." },
  { s:"kcc", ko:"KCC", en:"KCC Corporation", dom:"brand-business", r:4.1, web:"https://www.kccworld.co.kr/",
    def:"KCC(케이씨씨)는 도료(페인트)·건축자재·실리콘을 주력으로 하는 대한민국의 종합 화학·소재 기업이다.",
    ov:"KCC(케이씨씨)는 1958년 정상영이 금강스레트공업으로 창업해 금강·금강고려화학을 거쳐 2005년 KCC로 사명을 바꿨다. 도료·건축자재에서 출발해 실리콘 등 첨단 소재로 사업을 확장한 범현대가 계열 소재기업이다.",
    id:"도료·소재·실리콘을 아우르는 국내 대표 종합 화학소재 기업이다." },
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
