// Batch 15: WEB-VERIFIED content. Agency pages + design press (Pentagram, Ragged
// Edge, DesignStudio, New Commercial Arts, Koto, For The People, Marx Design, Wedge,
// Order, jkr; Brand New/Creative Review/Design Week/It's Nice That/BP&O/Dieline).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-cohere": {
    definition: "Cohere는 2019년 캐나다 토론토에서 설립된 엔터프라이즈 AI 기업으로, 기업 고객을 겨냥한 대규모 언어 모델(LLM)에 집중한다. 2023년 아이덴티티는 Pentagram이 맡았다.",
    overview: "Cohere는 2019년 Aidan Gomez, Ivan Zhang, Nick Frosst가 설립한 캐나다 토론토 기반 엔터프라이즈 AI 기업으로, 소비자가 아닌 기업 고객을 겨냥한 대규모 언어 모델(LLM)과 자연어 처리 제품에 집중한다. 공동창업자 Aidan Gomez는 트랜스포머 구조를 제시한 2017년 논문 'Attention Is All You Need'의 공동 저자이며, 금융·의료·공공 부문 등 규제 산업의 문서 분석·정리·분류를 지원하는 언어 AI 플랫폼을 제공한다.",
    identity: "2023년 Pentagram이 파트너 Jody Hudson-Powell과 Luke Powell 주도로 정체성을 디자인했으며, 핵심 콘셉트는 자연의 유동성과 컴퓨팅의 합리성을 결합한 'new nature'로, 기린 무늬와 벌집 등 자연·건축에 나타나는 보로노이(Voronoi) 패턴의 세포(cell) 구조를 시각 언어로 삼는다. 심벌은 서로 다른 확장 단계의 세 개 세포가 연결되어 추상화된 알파벳 'C'를 형성하며, 워드마크의 글자 개구부도 세포 형태를 닮도록 설계됐다. 전용 서체군으로 Cohere Text, 헤드라인용 Outline, 코드용 Mono 등이 제작됐고, 색상은 침엽수 녹색·버섯 회색 같은 자연 톤과 모의 코랄·합성 쿼츠 같은 합성 색을 짝지어 그러데이션으로 확장한다.",
  },
  "brandarchive-wise": {
    definition: "와이즈(Wise)는 2011년 영국 런던에서 창업한 핀테크로, 출범 당시 사명은 트랜스퍼와이즈(TransferWise)였다. 국경 간 송금·다중 통화 결제가 핵심이며, 2023년 리브랜드는 Ragged Edge가 맡았다.",
    overview: "와이즈(Wise)는 2011년 에스토니아 출신 크리스토 캐르만과 타베트 힌리쿠스가 영국 런던에서 창업한 핀테크로, 출범 당시 사명은 트랜스퍼와이즈(TransferWise)였다. 국경 간 송금·다중 통화 결제를 저비용으로 제공하는 것이 핵심 사업이며, 2021년 런던증권거래소에 직상장했고 170개국 이상에서 서비스를 운영한다.",
    identity: "2023년 3월 런던 브랜딩 에이전시 Ragged Edge와 함께 진행한 리브랜드는 'The World''s Money(세계의 돈)'라는 단일 콘셉트를 축으로, 핀테크의 관습적 파랑을 버리고 움직임과 진보를 상징하는 선명한 초록을 핵심 색으로 채택했다. 기존 워드마크와 송금의 이동성을 상징하는 패스트 플래그(Fast Flag) 아이콘은 가독성과 확장성을 위해 다시 다듬어졌다. 전 세계의 통화·언어·문자·장소에서 영감을 받은 그래픽 자산 'graphic tapestries'와, 세계 각지 문자를 참고해 다국어를 지원하도록 설계된 전용 서체 Wise Sans가 도입됐다.",
  },
  "brandarchive-borussia-dortmund-2023": {
    definition: "보루시아 도르트문트(BVB)는 1909년 창단된 독일 분데스리가 축구 클럽으로, 검정과 노랑을 상징색으로 쓰며 홈구장 '노란 벽'으로 유명하다. 2023년 비주얼 아이덴티티는 DesignStudio가 맡았다.",
    overview: "보루시아 도르트문트(BVB)는 1909년 창단된 독일 분데스리가 축구 클럽으로, 정식 명칭은 Ballspielverein Borussia 09 e. V. Dortmund이며 검정과 노랑을 상징색으로 쓴다. 홈구장은 베스트팔렌슈타디온(스폰서명 지그날 이두나 파크)으로 독일 최대 규모 경기장이며, 남쪽 스탠딩석 쥐트트리뷔네는 '노란 벽(Die Gelbe Wand)'으로 불린다.",
    identity: "2023년 10월 DesignStudio가 새 비주얼 아이덴티티를 공개했는데, 핵심 콘셉트는 '노란 벽'과 지그날 이두나 파크 스탠딩석의 34도 경사 각도로, 이 대각선을 전체 시스템의 중심축으로 삼았다. 타이포그래피는 Blaze Type의 Surt 패밀리를 커스텀한 것으로, 헤드라인 서체 'BVB Classic'에는 34도 각도의 틈을 가진 대체 글자가 포함되며 번호 시스템도 같은 각도에서 파생됐다. 색상은 전통적인 검정·노랑을 유지하되 경기장·빈티지 유니폼·도시에서 영감을 받은 네온과 그레이로 확장 팔레트를 추가했고, 전략 라인은 'Together we go all in'이다. 클럽 엠블럼(크레스트) 자체는 변경되지 않았다.",
  },
  "brandarchive-nationwide": {
    definition: "네이션와이드(Nationwide Building Society)는 영국 최대의 빌딩 소사이어티로, 회원이 소유하는 상호조합 형태의 금융기관이다. 2023년 36년 만의 최대 리브랜드는 New Commercial Arts가 맡았다.",
    overview: "네이션와이드 빌딩 소사이어티(Nationwide Building Society)는 영국 최대의 빌딩 소사이어티로, 주주가 아닌 회원(예금·대출 고객)이 소유하는 상호조합(mutual) 형태의 금융기관이다. 전통 은행과 신생 핀테크 양쪽을 동시에 겨냥하는 위치를 잡고 있으며, 2023년 10월 36년 만의 최대 규모 리브랜드를 공개했다.",
    identity: "2023년 리브랜드는 에이전시 New Commercial Arts가 맡았으며, 브랜드를 'dependable disrupter(믿음직한 파괴자)'로 포지셔닝하고 'A Good Way to Bank'라는 새 브랜드 약속을 도입했다. 로고는 기존의 집(house) 아이콘을 기하학적 형태와 여백을 활용해 단순화했고, 워드마크는 소문자 'n'으로 전환해 아이콘이 글자로 자연스럽게 이어지도록 했으며 'Building Society' 표기를 제거했다. 타이포그래피는 헤딩용 Editorial 세리프와 본문용 Founders Grotesk를 사용했고, 컬러는 기존의 레드와 블루를 약간 조정해 연속성과 접근성을 유지하되 더 어두운 블루에 레드 액센트를 더한 팔레트를 채택했다.",
  },
  "brandarchive-de-extinction": {
    definition: "De-Extinction은 마이애미 기반의 친환경 패키징 제조 기업으로, 레스토랑·식료품점에 플라스틱 없는 식기·식품 포장을 공급한다(멸종복원 과학과 무관). 사명과 브랜드 모두 스튜디오 Koto가 만들었다.",
    overview: "Koto가 약 2023년 작업한 De-Extinction은 마이애미 기반의 친환경 패키징 제조 기업으로, 레스토랑과 식료품점에 플라스틱 없는 식기·커틀러리·식품 포장을 공급한다. Colossal Biosciences나 멸종복원 과학 벤처와는 무관하며, Koto는 브랜드 이미지뿐 아니라 'De-Extinction'이라는 사명 자체를 함께 만들었다.",
    identity: "핵심 콘셉트는 'Leave No Trace(흔적을 남기지 않는다)'로, 풀뿌리 행동주의와 시위 문화에서 영감을 받아 반항적이면서 장난스러운 톤을 지향했다. 로고는 네 다리를 한 줄로 늘어놓은, 아이가 그린 듯 통통한 브론토사우루스 캐릭터이며 곡선이 커스텀 워드마크와 호응한다. 타이포그래피는 URW의 Grotesque No.9를 사용해 시위 플래카드를 연상시키되 가독성을 유지했고, 컬러는 보랏빛 핑크와 네온 '터미널 그린'을 중심으로 한 제한적이면서 자극적인 팔레트를 쓴다.",
  },
  "brandarchive-mux": {
    definition: "Mux는 2015년 설립된 개발자용 비디오 인프라 플랫폼으로, 라이브 스트리밍·온디맨드 등 영상 기능을 몇 줄의 코드로 구현하도록 지원한다. 2023년 리브랜드는 호주 에이전시 For The People이 맡았다.",
    overview: "Mux는 2015년 설립된 개발자용 비디오 인프라 플랫폼으로, 라이브 스트리밍·온디맨드·비디오 챗 같은 영상 기능을 몇 줄의 코드로 구현하고 상세 지표로 성능을 모니터링하도록 지원한다. Vimeo·TED·Paramount 등과 협업한 것으로 알려져 있다.",
    identity: "호주 에이전시 For The People이 2023년 작업한 리브랜딩은 'Built to Play'를 슬로건으로 삼아, 개발자를 단순한 실용적 빌더가 아니라 코드에서 가능성과 즐거움을 찾는 창의적 존재로 재정의했다. 로고는 조립식 완구 세트(Erector set)에서 영감을 받아 빌드와 플레이 상태를 오가는 슬라이더 토글 형태로 다시 그려졌고, 영상 처리의 매크로블록에서 따온 16x16 그리드를 핵심 시각 단위로 사용했다. 전용 서체 Rotonto(Supernulla Creative Studio 협업)는 각진 사각 카운터와 둥근 외곽선을 결합했으며, Aeonik과 JetBrains Mono를 함께 운용한다. 컬러는 중립색에서 네온까지 아우르는 팔레트로 기능성과 유희성의 긴장을 표현했다.",
  },
  "brandarchive-departed-spirits": {
    definition: "Departed Spirits는 호주 멜버른 기반으로 2023년 출시된 증류주 브랜드로, 크래프트 트렌드에 반대하는 '안티 크래프트'와 풍자적 톤을 표방한다. 디자인은 뉴질랜드 스튜디오 Marx Design이 맡았다.",
    overview: "Departed Spirits는 호주 멜버른을 기반으로 2023년 출시된 증류주 브랜드로, 초기 라인업에는 진·보드카·위스키 계열 제품이 포함됐다. 크래프트 증류주 트렌드에 반대하는 '안티 크래프트(anti-craft)'와 순수함을 표방하며, 'top shelf spirits for bottom shelf people'라는 풍자적 태그라인을 내세운다. 디자인은 뉴질랜드 스튜디오 Marx Design이 맡았다.",
    identity: "Marx Design은 기능성과 대담함을 핵심으로, 1950년대 NASA 브랜딩과 실용주의 디자인에서 영감을 받아 유리병 대신 알루미늄 양철 플라스크(틴) 패키지를 채택했다. 로고는 출입구·묘비·터널 등 다양하게 해석될 수 있도록 의도적으로 모호하게 설계됐고, 타이포그래피는 전 대문자에 넓게 자간을 둔 스위스 스타일 산세리프 Neue Montreal을 사용했다. 컬러 시스템은 한 면은 브랜드용 흰색, 다른 면은 변형 구분용 단일 컬러로 구성되며 보드카는 파랑, 진은 노랑, 위스키는 붉은 주황으로 구분된다.",
  },
  "brandarchive-brami": {
    definition: "Brami는 이탈리아의 고대 루피니(lupini) 콩을 핵심 재료로 삼아 고단백·저탄수 식품을 만드는 캘리포니아 기반 식품 회사다. 브랜드 작업은 몬트리올 스튜디오 Wedge가 맡았다.",
    overview: "Brami는 이탈리아의 고대 루피니(lupini) 콩을 핵심 재료로 삼아 고단백·저탄수 식품을 만드는 캘리포니아 기반 식품 회사다. 처음에는 다양한 맛의 절임 루피니 콩 파우치 스낵으로 출발해, 이후 루피니 콩 기반의 고단백 파스타 등 'better-for-you' 이탈리안 식품으로 제품군을 넓혔다. 이탈리아 음식이 흔히 과식과 연결되는 인식을 깨고 건강 지향성과 문화적 진정성을 함께 지향한다.",
    identity: "몬트리올 기반 스튜디오 Wedge가 전략·내러티브, 브랜드 보이스, 패키징, 크리에이티브 디렉션, 론칭 캠페인, 웹 디자인까지 포괄하는 작업을 진행했다. 디자인은 파스타를 연상시키는 밝은 노란색을 중심 컬러로 쓰고, 굵은 타이포그래피와 손으로 그린 재료 일러스트레이션으로 현대성과 이탈리아 전통의 진정성을 병치했다. 루피니 콩 형태에서 영감을 받은 빈(bean) 셰이프가 시스템 요소로 활용되며, 로고의 정확한 서체명과 전체 컬러 코드는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-munson": {
    definition: "Munson은 미국 뉴욕주 유티카에 위치한 종합 예술기관으로, 미술관과 예술학교를 아우르는 104년 역사의 비영리 문화 기관이다(기존 Munson-Williams-Proctor Arts Institute). 2023년 리브랜드는 스튜디오 Order가 맡았다.",
    overview: "Munson은 미국 뉴욕주 유티카(Utica)에 위치한 종합 예술기관으로, 미술관과 예술학교를 아우르는 104년 역사의 비영리 문화 기관이다. 기존의 Munson-Williams-Proctor Arts Institute에서 'Munson'으로 리브랜딩되었으며, 디자인 스튜디오 Order(뉴욕)가 2023년 8월에 새 아이덴티티를 선보였다.",
    identity: "Order는 기관의 아카이브 자료를 발굴해 1960년 미술관 건물의 원본 손글씨 레터링(그래픽 디자이너 Elaine Lustig Cohen 작업)에서 출발한 독자 타이포그래피 시스템을 핵심 토대로 삼았다. 심볼은 미술관 건물을 위에서 내려다본 기하학적 형태에서 착안해 여러 부분이 하나로 통합되는 모듈형 마크로, 단일성·중심성·관계를 상징한다. 전용 서체는 Munson Slab·Munson Grotesque·Munson Grotesque Oblique 세 종으로 구성되며, 컬러 팔레트는 기관의 정기 간행물 등 아카이브 출판물에 쓰인 생동감 있는 색 조합에서 도출되었다.",
  },
  "brandarchive-center-square": {
    definition: "Centersquare는 미국 데이터센터·콜로케이션 기업으로, 브룩필드 산하의 Cyxtera와 Evoque를 통합해 2024년 출범했다. 아이덴티티는 jkr(Jones Knowles Ritchie)이 맡았다.",
    overview: "Centersquare는 미국(북미 중심) 데이터센터·콜로케이션 분야 기업으로, 브룩필드(Brookfield) 산하의 Cyxtera와 Evoque를 통합해 2024년 4월 단일 브랜드로 출범했다. 데이터센터 인프라가 핵심 사업이다.",
    identity: "jkr(Jones Knowles Ritchie)가 설계한 아이덴티티의 핵심 콘셉트는 'Infinite Flexibility. Absolute Certainty'로, 데이터가 흐르는 중심과 사각형의 네 벽이라는 발상에서 출발한다. 단순한 정사각형(square)을 모든 요소의 기반으로 삼고, 국가별 데이터로 큐브 크기·전환을 제어하는 데이터 시각화를 로고에 결합한 동적(generative) 시스템을 구축했다. 컬러는 업계 관행인 블루·퍼플 대신 서버룸 케이블의 색상·라벨링에서 착안해 블루·그린·옐로·핑크의 선명한 팔레트를 사용하고, 전용 서체는 Peregrin Studio의 Systemia(사각형 비례 기반)다.",
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
