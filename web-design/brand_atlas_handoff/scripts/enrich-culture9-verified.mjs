// Batch 27: WEB-VERIFIED content. Cross-checked across 2+ independent sources
// (olympics.com/theolympicdesign, Logo Histories, Wikipedia, airline-livery refs,
// company official histories). Hallucination guards (verified by research agents):
//  - Sarajevo 1984: Miroslav Antonić Roko (1978); color palette unverified -> omitted.
//  - Calgary 1988: Gary W. Pampu (designer 2-source; year 1979 single-source -> phrased softly).
//  - HemisFair '68: Richard Wilson (1965); confluence double-spiral.
//  - Hughes Airwest: Mario Zamparelli (1971), Sundance Yellow; after Flight 706.
//  - Kawasaki Shinkin Bank: Mitsuo Katsui (1972), tree + sun, orange/blue.
//  - Portopia '81: exposition + symbol FORM verified; DESIGNER unverified -> not named.
//  - Austrian Airlines: red chevron + red-white-red verified; "Oberauer/1969" attribution
//    FAILED (single source, year conflicts) -> not asserted; 2003 Landor redesign verified.
//  - Iwate Broadcasting: Ikko Tanaka + 1985 verified (2 sources); mark FORM unverified -> not described.
//  - National: 1973 wordmark change verified; designer "TBC" -> not named (Unimark did the 1971
//    Panasonic mark, NOT confirmed for National's 1973 mark).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-sarajevo-1984": {
    definition: "사라예보 1984(Sarajevo '84)는 공산권에서 처음 열린 1984년 사라예보 동계올림픽의 브랜드로, 엠블럼은 디자이너 미로슬라프 안토니치 로코가 1978년 디자인했다.",
    overview: "사라예보 1984(Sarajevo '84)는 옛 유고슬라비아 사라예보에서 열린 1984년 동계올림픽의 브랜드로, 공산권 국가에서 처음 열린 동계올림픽이다. 엠블럼은 디자이너 미로슬라프 안토니치 로코(Miroslav Antonić Roko)가 1978년 디자인했으며, 유고슬라비아가 1977년 IOC에 제출한 유치 신청서 단계부터 본 대회까지 사용된 장기 사용 사례다.",
    identity: "엠블럼은 양식화된 눈송이 형태인데, 동시에 그 지역 전통 자수의 기하학적 모티프를 차용했다. 그 아래에 올림픽 오륜이 결합된다. 전통 직물 문양을 현대적 눈송이 심볼로 끌어들여 개최지의 문화적 정체성과 동계 스포츠를 함께 담아낸 점이 특징이다.",
  },
  "brandarchive-calgary-1988": {
    definition: "캘거리 1988(Calgary '88)은 1988년 캘거리 동계올림픽의 브랜드로, 엠블럼은 캘거리의 그래픽 아티스트 게리 W. 팜푸가 디자인했다.",
    overview: "캘거리 1988(Calgary '88)은 캐나다 캘거리에서 열린 1988년 동계올림픽의 브랜드다. 엠블럼은 캘거리 기반 그래픽 아티스트 게리 W. 팜푸(Gary W. Pampu)가 유치 단계에서 디자인했으며, 다른 대회와 달리 유치 확정 후에도 심볼이 바뀌지 않고 그대로 쓰였다. 대회의 모토는 'Come together in Calgary'였다.",
    identity: "엠블럼은 캘거리 시민과 캐나다 국민의 '어울림(coming together)'을 표현하기 위해 겹쳐지고 동심을 이루는 대·소문자 'C'들로 구성된다. 이 'C'는 캘거리(Calgary)와 캐나다(Canada)를 함께 가리키며, 같은 형태가 캐나다의 상징인 단풍잎으로도, 겨울을 나타내는 눈송이로도 읽히는 중의적 구성이다. 그 위에 올림픽 오륜이 결합된다.",
  },
  "brandarchive-hemisfair-'68": {
    definition: "헤미스페어 '68(HemisFair '68)은 1968년 미국 텍사스주 샌안토니오에서 열린 세계박람회로, 로고는 디자이너 리처드 윌슨이 1965년 디자인했다.",
    overview: "헤미스페어 '68(HemisFair '68)은 1968년 미국 텍사스주 샌안토니오에서 열린 세계박람회로, '아메리카 대륙 문명의 합류(The Confluence of Civilizations in the Americas)'를 주제로 삼았다. 샌안토니오 창립 250주년과 맞물려 열렸고, 높이 750피트의 '아메리카의 탑(Tower of the Americas)'을 남겼다. 로고는 디자이너 리처드 윌슨(Richard Wilson)이 1965년 디자인했다.",
    identity: "로고는 박람회 주제인 '합류'를 나타내는 소용돌이형 심볼로, 두 개의 맞물린 나선이 하나는 중앙 원에서 다른 하나는 바깥에서 출발해 수렴하는 형태다. 윌슨은 이를 완전한 원(세계)에서 서반구로, 다시 구대륙에서 신대륙으로의 탐험 경로로, 끝내 문명의 융합과 새로운 삶의 방식으로 이어지는 서사로 설명했다. 채도와 대비가 높은 색을 써 화려한 박람회의 성격을 반영했다.",
  },
  "brandarchive-hughes-airwest": {
    definition: "휴즈 에어웨스트(Hughes Airwest)는 하워드 휴즈가 소유했던 미국의 지역 항공사로, 1971년 디자이너 마리오 잠파렐리가 기체 전체를 선명한 노랑으로 칠한 'Sundance Yellow' 도장을 도입했다.",
    overview: "휴즈 에어웨스트(Hughes Airwest)는 하워드 휴즈의 서마 코퍼레이션이 소유했던 미국의 지역 항공사다. 휴즈의 전속 수석 디자이너 마리오 잠파렐리(Mario Zamparelli)가 1971년 새 도장을 디자인했으며, 1971년 6월의 공중 충돌 사고(Flight 706) 이후 이미지 쇄신을 위한 마케팅 캠페인의 일환으로 도입됐다.",
    identity: "기체 전체를 선명한 노랑 'Sundance Yellow'로 칠하고 파랑 'Universe Blue'로 트림을 처리한 것이 특징으로, 수직 꼬리날개에는 다이아몬드를 닮은 파란 로고를 두고 사명은 객실 창문 아래에 배치하는 비전형적 레이아웃을 썼다. 잠파렐리가 함께 디자인한 승무원 유니폼도 같은 노랑·파랑 배색이었다. 전면이 노란 외관 때문에 '나는 바나나(flying bananas)'라는 별명과 'Top Banana in the West'라는 슬로건으로 불렸다.",
  },
  "brandarchive-kawasaki-shinkin-bank": {
    definition: "가와사키 신용금고(川崎信用金庫)는 일본 가와사키시의 신용금고로, 1972년 디자이너 가쓰이 미쓰오가 나무와 태양을 결합한 심볼마크를 디자인했다.",
    overview: "가와사키 신용금고(川崎信用金庫)는 일본 가와사키시의 신용금고다. 창립 50주년을 앞두고 1972년 명칭을 정비하면서 그래픽 디자이너 가쓰이 미쓰오(勝井三雄)에게 새 코퍼레이트 아이덴티티를 의뢰했다. 단순하고 강력하면서 은행의 성격을 정확히 반영하고 고객과 친숙해지기 쉬운 마크가 요구 조건이었다.",
    identity: "심볼은 땅에 뿌리내리고 하늘을 향해 자라는 나무를 형상화해 고객의 번영과 믿고 맡길 수 있는 자산을 상징하는 동시에, 사방으로 빛을 비추는 태양의 이미지를 결합했다. 색상은 건강과 활력, 친밀감을 나타내는 따뜻한 오렌지와 하늘·물을 나타내는 파랑의 두 가지로 구성해 신선하고 모던한 인상을 의도했다. 로고타입은 약칭 '가와신(かわしん)'을 부드럽고 친근한 고딕체로, 정식 사명을 신뢰감 있는 명조체로 대비시켰다.",
  },
  "brandarchive-portopia-81": {
    definition: "포토피아 '81(Portopia '81)은 1981년 일본 고베의 인공섬 포트아일랜드에서 열린 박람회로, '새로운 바다의 문화도시 창조'를 주제로 삼았다.",
    overview: "포토피아 '81(Portopia '81)은 1981년 3월부터 9월까지 180일간 일본 고베의 인공섬 포트아일랜드에서 열린 박람회로, '새로운 바다의 문화도시 창조'를 주제로 삼았다. 31개국이 참가했고 1,600만 명 이상이 관람했다.",
    identity: "심볼마크는 창조의 세계를 나타내는 '빛'과 진보·발전을 나타내는 '파도'를 추상화해 구성했다. 흰 바탕에 마린 블루를 써서 여섯 갈래의 빛이 방사형으로 뻗고 각 끝에 파도 무늬를 형상화한 형태다. 마스코트는 인어를 의인화한 남녀 한 쌍의 캐릭터였다. 심볼과 마스코트의 구체적 디자이너는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-austrian-airlines": {
    definition: "오스트리아 항공(Austrian Airlines)은 오스트리아의 국적 항공사로, 오스트리아 국기의 적·백·적 배색과 이륙하는 비행기를 상징하는 붉은 화살표(셰브론)를 시각 정체성의 핵심으로 삼는다.",
    overview: "오스트리아 항공(Austrian Airlines)은 오스트리아의 국적 항공사다. 제트 시대에 진입한 1960~70년대에 코퍼레이트 아이덴티티를 현대화하며, 오스트리아 국기에서 온 적·백·적 배색과 붉은 화살표 모티프를 정립했다.",
    identity: "시각 정체성의 핵심은 이륙하는 비행기를 상징하는 양식화된 붉은 화살표(셰브론)다. 1960년 무렵 종이비행기 측면이나 나는 새를 연상시키던 초기 형태에서 출발해 1972년경 더 정형화된 화살표 형태로 발전했고, 오스트리아 국기의 적·백·적 배색이 모든 시대를 관통하는 일관 요소로 유지됐다. 2003년 리브랜딩은 디자인사 Landor가 맡아 셰브론에 입체·그림자 효과를 더해 현대화했다.",
  },
  "brandarchive-iwate-broadcasting-company": {
    definition: "IBC이와테방송(岩手放送)은 일본 이와테현의 지역 방송사로, 1985년 그래픽 디자이너 다나카 잇코가 코퍼레이트 아이덴티티를 디자인했다.",
    overview: "IBC이와테방송(岩手放送)은 일본 이와테현의 지역 방송사다. 1985년 코퍼레이트 아이덴티티를 도입했으며, 무인양품(MUJI)의 초대 아트 디렉터이자 세이부·세종 계열 작업으로 알려진 그래픽 디자이너 다나카 잇코(田中一光)가 제작을 맡았다.",
    identity: "다나카 잇코는 1960~80년대 일본 그래픽 디자인을 대표하는 인물로, 세이부 유통그룹의 크리에이티브 디렉션과 무인양품 론칭 아트 디렉션으로 잘 알려져 있다. IBC이와테방송의 1985년 CI도 그러한 작업의 연장선에 있다. 다만 이 CI에서 도입된 마크의 구체적 형태와 색상 사양은 공개 자료로 충분히 확인되지 않는다.",
  },
  "brandarchive-national": {
    definition: "내셔널(National)은 1927년부터 2008년까지 쓰인 마쓰시타전기(현 파나소닉)의 가전 브랜드로, 1973년 모회사 파나소닉의 워드마크에 맞춰 영문 표기를 정비했다.",
    overview: "내셔널(National)은 마쓰시타전기(현 파나소닉)가 1927년부터 2008년까지 사용한 가전 브랜드다. 일본 내 가전 브랜드로 오래 쓰였으며, 2008년 파나소닉으로 브랜드가 통합되며 사라졌다.",
    identity: "내셔널은 'ナショ文字'로 불리는 전용 표기를 1937년에, 'N' 마크를 1959년에 제정해 오래 사용했다. 1973년에는 2년 앞서 1971년 도입된 모회사 파나소닉의 영문 워드마크에 맞춰 'National'의 영문 표기를 정비하며 그룹 영문 아이덴티티의 통일성을 높였다. 다만 1973년 내셔널 워드마크를 맡은 구체적 디자이너는 공개 자료로 확인되지 않는다.",
  },
};

const bySlug = new Map((data.allBrands || []).map((b) => [b.slug, b]));
let changed = 0, missing = [];
for (const [slug, u] of Object.entries(updates)) {
  const b = bySlug.get(slug);
  if (!b) { missing.push(slug); continue; }
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
if (missing.length) console.error("MISSING:", missing.join(", "));
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nwrote ${changed} brands → data/brand-atlas.json (indent=2)`);
