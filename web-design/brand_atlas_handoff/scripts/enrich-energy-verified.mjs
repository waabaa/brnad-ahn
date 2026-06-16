// One-off: write WEB-VERIFIED identity content for the Energy/brandarchive cluster.
// Every sentence here was cross-checked across >=2 independent reputable sources
// (Wikipedia, official corporate sites, Nippon Design Center, Logo Histories, AGI,
// Norwegian Petroleum Museum, Dutch Graphic Roots, Saffron/Dalton Maag press).
// Unverified specifics (exact hex, unnamed typefaces) are intentionally NOT asserted.
// No source fields are written into the public DB (QA gate forbids them).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-elf": {
    definition: "Elf(엘프)는 프랑스의 석유·연료 브랜드로, 1965년 12월 3개 국영 석유회사가 합병해 형성된 ERAP를 모태로 1967년 4월 통합 브랜드로 출범했다. 1976년 Société Nationale Elf Aquitaine로 확장되었고, 2000년 Total·Fina와의 합병으로 TotalFinaElf가 되었다. 모회사는 2003년 Total, 2021년 TotalEnergies로 사명을 바꾸었으며 Elf는 그 산하 브랜드로 존속하고 있다.",
    overview: "Elf(엘프)는 프랑스의 석유·연료 브랜드로, 1965년 12월 3개 국영 석유회사가 합병해 형성된 ERAP를 모태로 1967년 4월 통합 브랜드로 출범했다. 1976년 Société Nationale Elf Aquitaine로 확장되었고, 2000년 Total·Fina와의 합병으로 TotalFinaElf가 되었다. 모회사는 2003년 Total, 2021년 TotalEnergies로 사명을 바꾸었으며 Elf는 그 산하 브랜드로 존속하고 있다.",
    identity: "1967년 코퍼레이트 아이덴티티는 Jean-Roger Rioux를 비롯한 디자인팀이 약 3년에 걸쳐 비공개로 제작했다. 심볼은 석유 시추용 드릴 비트(trépan)의 톱니 형태에서 착안했으며, 빨간 점과 함께 파랑·빨강을 사용해 통합된 기업을 상징했다. 이 명칭과 로고는 1967년 4월 프랑스 내 약 1,250개 주유소에 공개되었고, 1987년 개정 가이드라인에서 배색이 프랑스 삼색기 기조로 정리되며 심볼이 명칭 앞에 배치되었다. 전용 워드마크 서체가 함께 디자인되었으나 구체적 서체명은 공개 자료로 확인되지 않는다.",
    current: "Elf는 현재 TotalEnergies의 브랜드로 엔진오일·고급 윤활유를 중심으로 운영되며, 포뮬러 1에서 다수의 우승을 기록한 모터스포츠 후원 이력을 보유한다.",
  },
  "brandarchive-repsol-2025": {
    definition: "Repsol(렙솔)은 마드리드에 본사를 둔 스페인의 다국적 에너지·석유화학 기업으로, 1980년대 후반 스페인 국영 석유·가스 기업들을 통합해 설립되었다. 탐사·생산부터 정제·유통까지 전 가치사슬을 아우르며 50개국 이상에서 사업을 전개한다. 'Repsol'이라는 명칭은 1951년부터 사용되던 윤활유 브랜드명에서 유래했다.",
    overview: "Repsol(렙솔)은 마드리드에 본사를 둔 스페인의 다국적 에너지·석유화학 기업으로, 1980년대 후반 스페인 국영 석유·가스 기업들을 통합해 설립되었다. 탐사·생산(업스트림)부터 정제·유통(다운스트림)까지 전 가치사슬을 아우르며, 50개국 이상에서 사업을 전개한다. 'Repsol'이라는 명칭은 1951년부터 사용되던 윤활유 브랜드명에서 유래했다.",
    identity: "2025년 6월, Repsol은 브랜드 컨설팅사 Saffron이 주도한 새 비주얼 아이덴티티를 공개했으며, 핵심 개념은 '에너지의 합류(Confluence of energies)'로 다(多)에너지 기업·에너지 전환 리더로의 전환을 표현한다. 태양 모티프의 실루엣은 유지하되 평면 색면을 걷어내고 입체감과 움직임을 부여했으며, 색채의 중심축은 주황에서 마젠타로 이어지는 그라데이션이다. 워드마크는 Dalton Maag가 제작한 전용 서체 'Sole Repsol'로, 소문자 기반의 부드럽고 둥근 형태를 통해 친근함과 동시대성을 강조한다. 아이보리가 새 시그니처 색으로 도입되고 기존 블루가 재정의되었으며, 주유·충전 접점에서 작동하는 첫 소닉 아이덴티티(오디오 로고)도 함께 도입되었다.",
    current: "새 아이덴티티는 2025년 공개와 함께 Repsol의 약 4,500개 주유·충전소 등 전 영역에 걸쳐 순차 적용되고 있으며, 로고부터 연료 색상 체계, 매장 내외관까지 포괄하는 전면 리디자인으로 진행되고 있다.",
  },
  "brandarchive-mobil": {
    definition: "Mobil(모빌)은 1911년 분할된 Standard Oil의 직계 후신으로, 뉴욕 스탠더드오일(Socony)이 1931년 Vacuum Oil Company와 합병해 출범한 미국 석유 브랜드다. Socony-Vacuum, Socony Mobil을 거쳐 1966년 Mobil Oil Corporation으로 개칭했고, 1999년 Exxon과 합병해 ExxonMobil이 되었다.",
    overview: "Mobil(모빌)은 1911년 미 대법원 판결로 분할된 Standard Oil의 직계 후신으로, 뉴욕 스탠더드오일(Socony)이 1931년 Vacuum Oil Company와 합병해 출범한 미국 석유 브랜드다. 'Mobil'이라는 이름은 Vacuum Oil 계열에서 유래했으며, 회사는 Socony-Vacuum, Socony Mobil을 거쳐 1966년 Mobil Oil Corporation으로 개칭했다. 1999년 11월 30일에는 Exxon과 합병해 ExxonMobil이 탄생했다.",
    identity: "1964년 Mobil은 뉴욕의 디자인 스튜디오 Chermayeff & Geismar(주도 디자이너 Tom Geismar)에 통합 아이덴티티 개발을 의뢰했고, 이 작업은 건축가 Eliot Noyes의 현대식 주유소 프로토타입 프로그램과 동시에 진행됐다. 핵심은 청색 'Mobil' 로고타입에서 'o'만 적색으로 처리한 워드마크로, 붉은 'o'는 주유소의 원형 디자인 모티프를 강화하는 동시에 정확한 발음을 유도하는 기능을 했다. 로고타입은 Helvetica와 Futura에서 파생된 전용 알파벳으로 그려졌으며, 1930년대 이래의 상징인 Pegasus(날개 달린 붉은 말)는 독립적 그래픽 요소로 재드로잉됐다.",
    current: "Mobil은 1999년 합병 이후 ExxonMobil 산하의 브랜드로 존속하며, 주유소·연료와 Mobil 1 엔진오일 등에 계속 사용되고 있다.",
  },
  "brandarchive-jomo": {
    definition: "일본에너지(Japan Energy Corporation)는 닛폰광업 계열의 일본 석유회사로, 주유소·석유제품을 'JOMO'(Joy of Motoring) 브랜드로 판매했다. 1966년 교도석유 설립과 1992년 합병을 거쳐 1993년 'Japan Energy Corporation'으로 사명이 변경되었고, JOMO는 그 소매 브랜드였다.",
    overview: "일본에너지(Japan Energy Corporation)는 닛폰광업(Nippon Mining) 계열의 일본 석유회사로, 그 주유소·석유제품은 'JOMO'(Joy of Motoring) 브랜드로 판매되었다. 기업의 뿌리는 1905년 이바라키현 히타치의 광업회사이며, 1966년 교도석유(Kyodo Oil) 설립과 1992년 합병을 거쳐 1993년 'Japan Energy Corporation'으로 사명이 변경되었다. JOMO는 이 회사의 소매(주유소) 브랜드였다.",
    identity: "JOMO와 일본에너지의 1993년 아이덴티티는 사울 바스(Saul Bass), 야마구치 도시히로, 키타 히로유키의 작업으로 복수 출처에서 확인된다. 다만 디자인 아카이브는 사울 바스의 역할을 컨설턴트로 기술하는 등 기여 비중에 대한 서술에는 자료 간 차이가 있다. 마크의 구체적 형태와 상징, 컬러와 서체에 대한 신뢰할 만한 기술은 공개 자료에서 충분히 확인되지 않는다.",
    current: "2010년 7월 1일 일본에너지(JOMO)와 닛폰석유(ENEOS)는 JX Nippon Oil & Energy로 통합되었고, JOMO 주유소 간판은 ENEOS로 교체되며 브랜드가 흡수·단종되었다.",
  },
  "brandarchive-tepco": {
    definition: "도쿄전력(TEPCO)은 1951년 5월 설립된 일본 최대 전력회사로, 그 뿌리는 1883년 창립된 도쿄전등으로 거슬러 올라간다. 본사는 도쿄 지요다구에 있으며 도쿄를 포함한 간토 광역권에 전력을 공급한다.",
    overview: "도쿄전력(TEPCO, Tokyo Electric Power Company)은 1951년 5월 1일 설립된 일본 최대 전력회사로, 그 뿌리는 1883년 창립된 도쿄전등(Tokyo Electric Light Co.)으로 거슬러 올라간다. 본사는 도쿄 지요다구 우치사이와이초에 있으며, 도쿄를 포함한 간토(Kanto) 광역권 전역에 전력을 공급한다. 일본 1위이자 세계 4위 규모의 전력 사업자로 평가된다.",
    identity: "1987년 닛폰디자인센터(NDC)가 도쿄전력의 기업 아이덴티티를 개발했으며, NDC 창립 멤버이자 사장을 지낸 나가이 가즈마사(永井一正)가 아트디렉션과 디자인을 모두 맡았다. 전력회사들이 흔히 쓰던 번개 모양 대신, 삶을 풍요롭게 하는 전기는 원(circle)으로 표현해야 한다는 발상에서 출발해 여섯 개의 원을 T자 형태로 배열한 부드러운 심벌을 만들었다. 작은 원 다섯 개가 'T'를 이루고 큰 원 하나가 그 기둥을 감싸는 구성으로, 밝은 집에 모인 가족이 느끼는 전기의 따뜻함을 표현했으며 일본 적색을 주조색으로 썼다.",
    current: "이 1987년 로고는 1987년부터 2016년 3월까지 사용된 뒤 지주회사 체제 전환과 함께 새 아이덴티티로 교체되었다. 2011년 후쿠시마 제1원전 사고 이후 도쿄전력은 원자력손해배상·폐로지원기구를 통해 정부가 약 54.74% 지분을 보유하는 구조로 재편되었다.",
  },
  "brandarchive-pam": {
    definition: "PAM은 네덜란드 대기업 SHV가 석유·가스 사업으로 다각화하면서 사용한 주유·연료 브랜드로, 네덜란드·오스트리아·서독에 걸친 주유소 체인과 석유 제품에 쓰였다.",
    overview: "PAM은 네덜란드 대기업 SHV(Steenkolen Handelsvereeniging)가 석유·가스 사업으로 다각화하면서 사용한 주유·연료 브랜드다. 복수의 자료가 PAM을 네덜란드·오스트리아·서독에 걸친 주유소 체인 및 석유 제품에 쓰인 SHV의 상표로 기록한다.",
    identity: "SHV의 사명 전환에 맞춰 신생 디자인 회사 Total Design이 비주얼 아이덴티티를 의뢰받았고, 파트너 베노 비싱(Benno Wissing)의 지휘 아래 작업이 진행됐다. 핵심 마크는 직각의 빨강 삼각형으로, 위트레흐트 시 문장(紋章)에서 유래했으며 시의 수호성인 성 마르티노가 망토를 반으로 잘라 나눈 일화를 절반으로 자른 형태로 상징했다. 제작 연도는 자료에 따라 1964년 착수, 1965년 완성으로 기록된다.",
    current: "SHV 석유·PAM 브랜드가 언제 어떻게 종료되었는지는 공개 자료로 명확히 확인되지 않는다.",
  },
  "brandarchive-leb": {
    definition: "런던전기위원회(London Electricity Board, LEB)는 1947년 전기법에 따른 영국 전력산업 국유화의 일환으로 1948년 4월 설립된 공공 전력 공급·배전 사업체로, 런던 지역의 가정·상업·산업 수요자에게 전기를 공급했다.",
    overview: "런던전기위원회(London Electricity Board, LEB)는 1947년 전기법(Electricity Act 1947)에 따른 영국 전력산업 국유화의 일환으로 1948년 4월 1일 설립된 공공 전력 공급·배전 사업체로, 런던 지역의 가정·상업·산업 수요자에게 전기를 공급했다. 지역 쇼룸을 통해 가정용 전기제품을 판매·대여하고 요금 수납 창구 역할도 겸했다.",
    identity: "1971년 LEB의 시각 아이덴티티는 FHK 헨리온(Frederick Henri Kay Henrion)이 자신의 컨설팅사 HDA International을 통해 디자인했다. 1969년 수행된 시장조사에서 기존 아이덴티티가 구식이라는 진단이 나온 것을 계기로 새 로고가 제작되었다. 새 마크는 'LEB' 세 글자를 번개 형상으로 결합한 디자인으로, 금속·콘크리트 주조나 저가 플라스틱 간판에도 적용 가능한 실용성과 현대적 조형미를 함께 갖춘 것으로 평가된다. 구체적인 색상과 서체는 공개 자료로 확인되지 않는다.",
    current: "LEB는 1990년 London Electricity plc로 민영화된 뒤 1996년 미국 Entergy, 1998년 프랑스 EDF에 인수되었고, 2010년 EDF가 배전망을 매각하면서 현재는 UK Power Networks의 일부가 되었다.",
  },
};

const bySlug = new Map((data.allBrands || []).map((b) => [b.slug, b]));
let changed = 0;
for (const [slug, u] of Object.entries(updates)) {
  const b = bySlug.get(slug);
  if (!b) { console.error(`MISSING ${slug}`); continue; }
  b.sections = b.sections || {};
  if (u.definition) b.definition = u.definition;
  for (const key of ["overview", "insights", "identity", "products", "people", "current"]) {
    if (u[key] != null) {
      b.sections[key] = b.sections[key] || { body: "" };
      b.sections[key].body = u[key];
    }
  }
  changed++;
  console.log(`updated ${slug} (${b.name})`);
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nwrote ${changed} brands → data/brand-atlas.json (indent=2)`);
