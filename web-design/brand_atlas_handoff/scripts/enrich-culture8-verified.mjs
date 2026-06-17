// Batch 26: WEB-VERIFIED content (Olympics/expo/CI classics, 1967-1985).
// Cross-checked across 2+ independent sources (olympics.com/theolympicdesign,
// Logo Histories/BP&O, Wolff Olins history, PAOS portfolio, Expo official sites,
// FHK Henrion refs). Hallucination guards applied (verified by research agents):
//  - Moscow 1980: emblem by Vladimir Arsentyev (1976); Misha bear mascot = Chizhikov (separate).
//  - BEA: Henrion's 1967-68 "Speedjack" REPLACED the 1956 de Saulles red square (not the same).
//  - BOC: Wolff Olins 1967 (NOT 1970-71); logo visual form unverified -> not asserted.
//  - Expo '70: emblem by Takeshi Otaka (Kamekura did posters, NOT the emblem);
//    Tower of the Sun = Taro Okamoto (separate); exact color weakly sourced -> not asserted.
//  - INAX: PAOS, Ina Seito->INAX, project 1983 / effective 1985.
//  - Kenwood: PAOS 1982, Trio->Kenwood; inverted red triangle from the "W" angle.
//  - Daiei: PAOS + Rei Yoshimura, competition 1974 / introduced Oct 1975; "waxing moon".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-moscow-1976": {
    definition: "모스크바 1980(Moscow '80)은 동구권에서 처음 열린 1980년 모스크바 하계올림픽의 브랜드로, 엠블럼은 디자이너 블라디미르 아르센티예프가 1976년 디자인했다.",
    overview: "모스크바 1980(Moscow '80)은 사회주의권에서 처음 열린 1980년 모스크바 하계올림픽의 브랜드다. 엠블럼은 디자이너 블라디미르 아르센티예프(Vladimir Arsentyev)가 1976년 디자인했다. 이 대회는 소련의 아프가니스탄 침공에 항의한 미국 주도의 보이콧으로 66개국이 불참해 1956년 이래 최소 규모로 치러졌다.",
    identity: "엠블럼은 위로 수렴하는 평행 수직선들이 육상 트랙의 단면을 이루며 모스크바 특유의 건축적 실루엣, 특히 크렘린의 스파스카야 탑 같은 탑 형태를 형성하고 그 정점을 오각별이 장식한다. 아래에는 단색의 올림픽 오륜이 결합된다. 정점의 붉은 오각별은 크렘린 탑의 별과 소비에트 이념을 환기한다. 한편 이 대회의 곰 마스코트 '미샤(Misha)'는 엠블럼과 별개로 아동 도서 일러스트레이터 빅토르 치지코프가 디자인해 1977년 공식 마스코트로 선정됐다.",
  },
  "brandarchive-bea": {
    definition: "BEA(영국유럽항공)는 영국의 옛 단거리 국적 항공사로, 1967~1968년 디자이너 FHK 헨리온이 유니언잭을 변형한 'Speedjack' 도장과 체계적 아이덴티티를 디자인했다.",
    overview: "BEA(British European Airways, 영국유럽항공)는 영국의 단거리 국적 항공사였다. 1946년 국유화로 출범했으며 경쟁이 심화된 1960년대 후반, 코퍼레이트 아이덴티티의 선구자 FHK 헨리온(FHK Henrion)이 자신의 회사 헨리온 디자인 어소시에이츠를 통해 1967년 새 아이덴티티를 개발해 1968년 도입했다. BEA는 1974년 BOAC와 합병해 브리티시 에어웨이스가 됐다.",
    identity: "헨리온은 영국 국기 유니언잭의 요소를 수직 꼬리날개의 각도에 맞춰 잘라낸 'Speedjack'으로 재조형해 속도와 현대성을 표현했다. 항공기 도장에 국가 국기를 인시그니아로 쓴 항공사가 거의 없었다는 점에서 독창적이었다. 이는 1956년 메리 드 솔이 만든 붉은 사각형(red square) 아이덴티티를 대체한 것으로, 헨리온은 이전의 붉은 날개는 유지하되 로고타입을 더 가로로 길고 운동감 있게 재설계했다. 승인 후에는 항공기·차량·건물 전반에 일관 적용하기 위한 두 권 분량의 디자인 매뉴얼이 제작됐다. 헨리온은 이런 매뉴얼 기반 CI 실무를 영국에 정착시킨 선구자였다.",
  },
  "brandarchive-bovis": {
    definition: "보비스(Bovis)는 영국의 건설 기업으로, 1971년 울프 올린스가 '섬세한 정밀함'을 상징하는 벌새(hummingbird) 로고를 디자인한 것으로 유명하다.",
    overview: "보비스(Bovis)는 영국의 건설 기업이다. 1965년 마이클 울프와 월리 올린스가 런던에 세운 디자인 회사 울프 올린스(Wolff Olins)가 1971년 보비스의 아이덴티티를 디자인했으며, 로고를 단순한 시각적 포장이 아니라 회사의 관점과 전략으로 다룬 초기 사례로 평가된다.",
    identity: "핵심은 벌새 마크다. 건설사에 흔한 황소 같은 물리적 힘이 아니라, 섬세한 정밀함으로 일하는 회사를 표상하도록 의도됐는데, 당시 건설업 관행으로는 매우 이례적인 선택이었다. 보비스 회장은 처음에 황소 같은 남성적 힘의 상징을 원하며 회의적이었으나, 마이클 울프의 설득으로 벌새 안이 채택됐다고 전한다.",
  },
  "brandarchive-boc": {
    definition: "BOC(영국산소회사, British Oxygen Company)는 산소·가스 등으로 다각화한 영국 기업으로, 1967년 울프 올린스가 약칭 'BOC'를 중심으로 한 코퍼레이트 아이덴티티를 디자인했다.",
    overview: "BOC(British Oxygen Company, BOC Group)는 산업용 가스를 비롯해 용접 장비·화학·극저온 사업으로 다각화한 영국 기업이다. 국제적 확장과 다각화에 'British'와 'Oxygen'이라는 이름이 더는 들어맞지 않는다고 판단해, 1967년 울프 올린스(Wolff Olins)에 약칭 'BOC'를 중심으로 그룹의 여러 사명을 일관되게 묶는 아이덴티티를 의뢰했다.",
    identity: "울프 올린스는 로고를 넘어 레터헤드·차량 도장·서식·사내 커뮤니케이션 절차까지 아우르는 체계를 구축했으며, 회사를 국제적으로 적용 가능하게 활기차게 투영하는 것을 목표로 삼았다. 임원부터 트럭 기사까지 폭넓은 이해관계자를 인터뷰한 초기 아이덴티티 컨설팅 사례로, 한 임원이 의사결정이 말단까지 전달되는 데 오래 걸리는 회사를 '공룡의 신경계'에 빗댄 일화가 전한다.",
  },
  "brandarchive-expo-'70": {
    definition: "엑스포 '70(Expo '70)은 1970년 오사카에서 열린 일본 만국박람회로, 다섯 꽃잎의 벚꽃 엠블럼은 디자이너 다카시 오타카가 디자인했다.",
    overview: "엑스포 '70(Expo '70)은 1970년 오사카에서 열린 일본 만국박람회로, 일본과 아시아에서 처음 열린 세계박람회다. '인류의 진보와 조화'를 주제로 1970년 3월부터 9월까지 183일간 열려 6천4백만 명 넘게 관람했다. 엠블럼은 오사카 기반 그래픽 디자이너 다카시 오타카(大髙猛)가 디자인해 1966년 지명 공모에서 선정됐다.",
    identity: "엠블럼은 일본의 상징 꽃인 벚꽃을 양식화한 마크로, 다섯 장의 꽃잎이 다섯 대륙을 상징하며 원형으로 배열돼 박람회에 참가하는 세계 각국의 협력을 표현한다. 중앙의 원은 일본을 상징한다. 도쿄 1964 올림픽 엠블럼으로 유명한 가메쿠라 유사쿠는 엠블럼 공모에 응모했으나 낙선했고 이후 박람회의 국제 포스터를 맡았으므로, 벚꽃 엠블럼의 디자이너로 흔히 잘못 인용되는 점은 주의가 필요하다. 박람회의 상징물인 '태양의 탑'은 별개로 예술가 오카모토 다로가 제작했다.",
  },
  "brandarchive-inax": {
    definition: "INAX(이낙스)는 일본의 타일·건축자재·위생도기 기업으로, 1985년 이나세이토에서 사명을 바꾸며 PAOS가 동적인 'I' 형태의 공간 심볼을 디자인했다.",
    overview: "INAX(이낙스)는 타일과 위생도기 등을 만드는 일본의 건축자재 기업이다. 1924년 이나 하츠노조가 설립한 이나세이토(Ina Seito)가 모태로, 모토오 나카니시의 PAOS가 1983년부터 코퍼레이트 아이덴티티 작업을 진행해 1985년 'INAX'로 사명을 바꾸며 새 정체성을 도입했다. 새 사명은 국내외 3만 7천여 개 후보를 추려 선정됐다.",
    identity: "심볼은 양·음의 공간과 예각으로 구성된 동적인 대문자 'I' 형태의 '공간 심볼(space symbol)'로, 표면에서 떠오르는 듯한 인상을 주어 욕실·공간의 성격과 기업의 공간 디자인 지향을 표현한다. 수직·수평으로 확대·축소돼 차량 도장부터 점포 사이니지까지 다양하게 적용되도록 설계됐고, 주색으로는 'Amenity Blue'로 명명된 파랑을 흑·백과 함께 사용했다. CI 전략에는 기업 비전을 객체화한 'INAX 5' 같은 원칙과 쇼룸 등 파생 프로그램이 포함됐다.",
  },
  "brandarchive-kenwood": {
    definition: "켄우드(Kenwood)는 일본의 오디오·전자 기업으로, 1982년 트리오(Trio)에서 사명을 전환하며 PAOS가 역삼각형 심볼의 아이덴티티를 디자인했다.",
    overview: "켄우드(Kenwood)는 일본의 오디오·전자 기업이다. 1946년 가스가 라디오로 출발해 1960년 트리오(Trio)로, 1964년 미국 시장용으로 'Kenwood' 명칭을 도입했다. 모토오 나카니시의 PAOS가 1981년 CI 프로그램을 제안해 1982년 새 아이덴티티를 도입했고, 1986년 Kenwood가 공식 사명으로 통합됐다.",
    identity: "로고타입은 전부 대문자의 기하학적 산세리프이며, 심볼은 붉은 역삼각형이다. 삼각형의 각도는 로고타입의 'W' 각에서 도출됐고, 단순한 기하 구성이 확대될 때 사선이 전진감을 주는 광학적 효과를 낸다. PAOS는 네 개의 최종 후보안을 제시한 끝에 이 안을 채택했으며, 품질·진취성·독창성의 가치를 표현하고 사이니지·패키징·차량 도장 전반으로 확장했다.",
  },
  "brandarchive-daiei": {
    definition: "다이에이(Daiei)는 일본의 대형 종합 소매 체인으로, PAOS와 디자이너 요시무라 레이가 1975년 '차오르는 달'을 형상화한 오렌지색 심볼을 디자인했다.",
    overview: "다이에이(Daiei)는 1957년 나카우치 이사오가 오사카에서 창업한 일본의 슈퍼마켓·종합 소매 체인으로, 1972년 미쓰코시 백화점을 제치고 일본 1위 소매업체에 올랐다. 1973년 CI 팀을 꾸려 모토오 나카니시의 PAOS에 의뢰했고, 1974년 디자인 경쟁을 거쳐 1975년 10월 새 로고를 도입했다. 최종안은 디자이너 요시무라 레이(Rei Yoshimura)가 맡았다.",
    identity: "심볼은 한쪽이 잘린 원, 즉 차오르는 달(waxing moon)을 형상화해 영원히 미완성이며 끊임없이 성장하고 지속한다는 의미를 담았다. 기업색은 '다이에이 오렌지'이며, 표준색과 권장 배경색을 폭넓게 갖춘 컬러 프로그램과 솔리드·스트라이프·아웃라인 등 네 가지 로고 버전으로 구성됐다. 오렌지 원이 높이 걸리면 일장기처럼 보일 수 있다는 우려가 있어 녹색 버전 로고를 함께 쓰는 경우가 많았다. 이 정체성은 도입 후 약 30년간 쓰이다 2005년 교체됐다.",
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
