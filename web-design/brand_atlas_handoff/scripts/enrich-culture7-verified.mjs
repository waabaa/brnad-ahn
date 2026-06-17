// Batch 25: WEB-VERIFIED content (mid-century transit/airline identity classics).
// Cross-checked across 2+ independent sources (Lance Wyman + Mexico Metro history,
// Museum für Gestaltung + Lars Müller, Tel Design/Dumbar refs, CN official + BP&O +
// Eye, olympics.com + NDC, Logo Histories + Yesterday's Airlines).
// Hallucination guards applied (verified by research agents):
//  - SBB: Müller-Brockmann did the SIGNAGE/wayfinding system (1978~); the SBB signet
//    logo is Hans Hartmann (1972), the station clock is Hilfiker (1944) — kept distinct.
//  - Sapporo 1972: emblem by Kazumasa Nagai (AD+designer); Kamekura did POSTERS, not the emblem.
//  - Eastern: "Wings of Man" was a Young & Rubicam AD slogan, NOT the Lippincott livery -> not used.
//  - Mexico Metro: pictogram-per-station system for a partly low-literacy ridership.
//  - CN: Allan Fleming, designed 1959 / introduced 1960; "route line that spells CN".
//  - NS: Tel Design (Gert Dumbar + Gert-Jan Leuvelink) 1968, double-arrow.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-mexico-city-metro": {
    definition: "멕시코시티 메트로(Sistema de Transporte Colectivo)는 1969년 개통한 멕시코의 지하철로, 디자이너 랜스 와이먼이 역마다 고유한 픽토그램을 부여한 길찾기 체계로 유명하다.",
    overview: "멕시코시티 메트로(Sistema de Transporte Colectivo)는 1969년 9월 개통한 멕시코의 지하철이다. 시각 정체성과 길찾기 체계는 디자이너 랜스 와이먼(Lance Wyman)이 건축가 페드로 라미레스 바스케스와 팀을 이뤄 설계했으며, 와이먼은 직전에 멕시코 1968 올림픽 아이덴티티를 맡았던 흐름의 연장선에서 이 작업을 진행했다.",
    identity: "핵심은 모든 역에 고유한 픽토그램 아이콘을 부여한 체계로, 모든 역에 시각 로고를 둔 최초의 지하철망이었다. 아이콘은 지역 역사, 기존 구조물, 역명, 주변 기능 중 하나에서 따왔다. 1969년 당시 인구의 약 3분의 1이 글을 읽지 못했기에, 문자보다 색과 친숙한 시각 모티프에 기댄 이 체계는 글을 못 읽는 이용자도 길을 찾게 했다. 각 노선은 고유 색과 번호를 가지며 픽토그램도 노선색을 따른다. 예컨대 후아나카틀란 역 아이콘은 나우아틀어로 '나비의 장소'라는 뜻에서 나비를 쓴다.",
  },
  "brandarchive-sbb": {
    definition: "SBB(스위스 연방철도)는 스위스의 국영 철도로, 1978년 디자이너 요제프 뮐러브로크만이 전국 역의 표준 사인·정보 체계를 설계했다.",
    overview: "SBB(스위스 연방철도, Schweizerische Bundesbahnen)는 스위스의 국영 철도다. 국제 타이포그래피 양식(스위스 스타일)의 선구자 요제프 뮐러브로크만(Josef Müller-Brockmann)이 1978년 전국 모든 역과 정차장을 아우르는 표준 사인·정보 체계를 의뢰받아, 1980년 디자인 매뉴얼을 펴내고 1992년 이를 대폭 확장했다.",
    identity: "뮐러브로크만의 체계는 단순한 그리드에 기반해 모든 상황에 적응하도록 설계됐고, 가독성을 위해 헬베티카 서체를 썼으며 스위스의 다언어 환경을 고려해 문자를 최소화하고 픽토그램으로 직관적 길찾기를 구현했다. 교통 표지는 빨강, 지명 표지는 파랑으로 기능에 따라 색을 구분했다. 한편 SBB의 로고(signet)는 뮐러브로크만이 아니라 한스 하르트만이 1972년 스위스 십자를 변형해 디자인한 것이며, 역 승강장의 상징적 시계는 1944년 한스 힐피커의 작업으로 모두 별개다.",
  },
  "brandarchive-nederlandse-spoorwegen": {
    definition: "네덜란드 철도(Nederlandse Spoorwegen, NS)는 네덜란드의 국영 철도로, 1968년 Tel Design의 헤르트 둠바르 등이 양방향 화살표 로고와 노랑·파랑 아이덴티티를 디자인했다.",
    overview: "네덜란드 철도(Nederlandse Spoorwegen, NS)는 네덜란드의 국영 철도다. 유럽 대륙에서 가장 먼저 현대적 코퍼레이트 스타일을 도입한 철도사로, 정체되고 관료적이라는 인상을 현대적 이미지로 바꾸기 위해 델프트의 디자인 회사 Tel Design이 1968년 새 아이덴티티를 만들었다. 디자인은 헤르트 둠바르(Gert Dumbar)와 헤르트얀 뢰벨링크가 맡았다.",
    identity: "로고는 두 개의 화살표로, 양방향으로 오가는 열차의 운동을 나타내고 가운데 두 줄은 선로를 상징한다. 공식 설명은 '폐쇄 회로 안의 양방향 수송'이다. 색상은 진한 노랑 바탕에 파랑(또는 검정)을 쓰며 차량 도색도 노랑으로 바뀌었는데, 둠바르는 노랑이 회색 역사를 더 산뜻하고 햇살처럼 만든다고 설명했다. 역명 표지에는 위니버스 서체를 파랑 바탕에 흰 글자로 적용하고 픽토그램을 함께 썼다. 둠바르는 이 로고를 위해 1,800장이 넘는 스케치를 그렸으며, 1968년의 양방향 화살표와 노랑·파랑 조합은 지금까지 이어지고 있다.",
  },
  "brandarchive-canadian-national-railway": {
    definition: "캐나다 국철(Canadian National Railway, CN)의 로고는 디자이너 앨런 플레밍이 1959년 디자인해 1960년 도입한 것으로, 끊김 없는 하나의 흐르는 선으로 'CN'을 이룬 북미 코퍼레이트 아이덴티티의 명작이다.",
    overview: "캐나다 국철(Canadian National Railway, CN)은 캐나다의 대형 철도 기업이다. 1959년 설문에서 대중이 회사를 구식이고 후진적이라 인식한다는 결과가 나오자 이미지 쇄신에 나섰고, 뉴욕의 산업 디자이너 제임스 발커스가 총괄한 전사적 아이덴티티 프로그램에서 토론토의 디자이너 앨런 플레밍(Allan Fleming)이 1959년 로고를 디자인해 1960년 도입했다.",
    identity: "플레밍은 'C'와 'N'을 하나의 연속된, 끊김 없는 흐르는 선으로 결합했다. 그는 이를 '우연히 CN을 철자하는 노선(route)의 선'이라 설명하며, 한 지점에서 다른 지점으로 사람과 물자, 메시지가 이동하는 것을 상징한다고 밝혔다. 플레밍이 뉴욕행 비행기 안에서 칵테일 냅킨에 아이디어를 스케치했다는 일화가 전한다. 'Railways'의 R을 없애 영어 'Canadian National'과 프랑스어 'Canadien National' 모두에 통용되게 한 점도 캐나다 맥락에서 큰 이점이었다. 이 로고는 60년 넘게 거의 변하지 않고 쓰이며 역대 최고의 기업 로고 중 하나로 꼽힌다.",
  },
  "brandarchive-sapporo": {
    definition: "삿포로 1972(Sapporo '72)는 아시아 최초의 동계올림픽인 1972년 삿포로 동계올림픽의 브랜드로, 엠블럼은 그래픽 디자이너 나가이 카즈마사가 디자인했다.",
    overview: "삿포로 1972(Sapporo '72)는 홋카이도에서 열린 아시아 최초의 동계올림픽인 1972년 삿포로 동계올림픽의 브랜드다. 엠블럼은 일본 정상급 디자이너들의 지명 경쟁을 거쳐 그래픽 디자이너 나가이 카즈마사(永井一正)의 안이 선정됐으며, 그는 아트 디렉션과 디자인을 함께 맡았다. 도쿄 1964 올림픽 엠블럼으로 유명한 가메쿠라 유사쿠는 이 대회에서 포스터를 담당했다.",
    identity: "엠블럼은 세 요소를 결합한 구성이다. 일장기에서 온 떠오르는 태양의 붉은 원반, 겨울을 상징하는 눈송이, 그리고 올림픽 오륜과 'Sapporo '72' 레터링이다. 눈송이는 헤이안 시대까지 거슬러 올라가는 일본 가문 문장의 '첫눈' 문양을 재해석한 것으로 은색으로 처리돼, 금색을 쓴 도쿄 1964 엠블럼과 대비를 이룬다. 세 요소를 세 개의 정사각형 안에 조직해 세로·가로·정사각 포맷으로 자유롭게 변형할 수 있는 모듈형 시스템으로, 1960년대로서는 선진적인 적응형 아이덴티티였다.",
  },
  "brandarchive-eastern-airlines": {
    definition: "이스턴 항공(Eastern Air Lines)은 미국의 옛 항공사로, 1964~1965년 디자인 회사 리핀콧 앤 마굴리스가 추상화한 매 심볼과 '하키 스틱' 도장을 도입했다.",
    overview: "이스턴 항공(Eastern Air Lines)은 1991년까지 운항한 미국의 항공사다. 1960년대 초 잦은 사고와 서비스 악평, 막대한 적자에 직면하자 신임 사장 플로이드 홀이 이미지 회복을 위해 코퍼레이트 아이덴티티 전문 회사 리핀콧 앤 마굴리스(Lippincott & Margulies)에 의뢰했고, 1964년 디자인해 1965년 함대 전반에 전개했다.",
    identity: "리핀콧 앤 마굴리스는 이스턴의 기존 상징인 매를 추상화해, 두 개의 직선을 결합한 매이자 항공기를 연상시키는 실루엣으로 다듬었다. 동체를 따라 이어지는 두 색조의 파란 줄이 꼬리에서 각도를 틀어 위로 솟구치는 도장은 그 형태 때문에 '하키 스틱(hockey stick)'으로 불렸다. 두 파랑의 공식 명칭은 위가 '캐리비안 블루', 아래가 '아이오노스피어 블루'다. 이 도장은 거의 변하지 않고 1991년 운항 종료까지 약 26년간 쓰여 이스턴의 최장수 도장이 됐다. 참고로 자주 함께 거론되는 'Wings of Man'은 이 도장의 이름이 아니라 1960년대 후반 광고 대행사 영 앤 루비캄의 광고 슬로건이다.",
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
