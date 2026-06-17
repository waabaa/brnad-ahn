// Batch 16: WEB-VERIFIED content. Agency pages + design press (Koto, Ragged Edge,
// Collins, Earthling, Mucho, Perky Bros, Wildish & Co., Buddy-Buddy, How&How,
// Kuba & Friends; Brand New/Creative Review/Design Week/Creative Boom/BP&O/Dieline).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-deezer": {
    definition: "Deezer는 2007년 프랑스 파리에서 설립된 온디맨드 음악 스트리밍 서비스로, 세계 최대 독립 음악 스트리밍 플랫폼 중 하나다. 2023년 리브랜드는 스튜디오 Koto가 맡았다.",
    overview: "Deezer는 2007년 프랑스 파리에서 Daniel Marhely와 Jonathan Benassaya가 설립한 온디맨드 음악 스트리밍 서비스다. 초기 Blogmusik 프로젝트에서 출발해 라이선스 계약 확보 후 Deezer로 전환했으며, 현재 세계 최대 독립 음악 스트리밍 플랫폼 중 하나로 다수 국가에서 서비스한다.",
    identity: "2023년 11월 디자인 스튜디오 Koto가 Deezer의 새 브랜드 아이덴티티를 선보였다. 핵심은 음악에 대한 사랑과 열정을 상징하는 '뛰는 심장(beating heart)' 로고로, 박동(인간성)과 음악 리듬이라는 두 상태 사이를 변형·맥동하며 이퀄라이저 같은 패턴을 형성한다. 전용 가변 서체 Deezer Sans는 NaN 활자 주조소 설립자 Luke Prowse와의 협업으로 제작되어 로고 형태에서 형태 언어를 가져왔다. 주조색은 활기찬 'Deezer Purple'이며, 슬로건은 'Live the Music'이다.",
  },
  "brandarchive-marshmallow": {
    definition: "Marshmallow는 2017년 영국 런던에서 설립된 인슈어테크로, 이민자 등 그동안 과도한 보험료로 불이익을 받던 운전자에게 합리적인 자동차 보험을 제공한다. 2023년 리브랜드는 Ragged Edge가 맡았다.",
    overview: "Marshmallow는 2017년 알렉산더·올리버 켄트-브레이엄 쌍둥이 형제와 소프트웨어 엔지니어 데이비드 고아테가 설립한 영국 런던 기반 인슈어테크로, 영국에 새로 정착한 이민자와 과도한 보험료로 불이익을 받던 운전자에게 합리적인 자동차 보험을 제공한다. 2021년 유니콘에 올랐고, 런던과 부다페스트에 조직을 운영한다.",
    identity: "2023년 디자인 스튜디오 Ragged Edge가 '차이를 가치 있게 여긴다(valuing difference)'를 핵심 콘셉트로 새 브랜드를 선보였으며, 평균을 보장하는 경쟁사와 달리 '규칙의 예외'를 지지한다는 전략을 담았다. 로고는 소문자 기하학적 산세리프 워드마크와 'm' 형태의 캔디 핑크 마스코트 'Marshall' 모노그램으로 구성되고, 'Marshforms'라 불리는 무한히 변주되는 모듈형 캐릭터군이 시스템 전반에 쓰인다. 전용 서체는 'Marshmallow Youth'이며 보조 서체로 Grilli Type의 GT Alpina를 함께 쓰고, 색상 팔레트는 본봉 핑크를 주색으로 모시 그린·번트 오렌지·크리미 오프화이트 등으로 정리된다.",
  },
  "brandarchive-freeform": {
    definition: "여기서 다룬 Freeform은 디즈니 산하의 젊은 성인층 대상 엔터테인먼트 사업부(미디어/방송)다. 케이블에서 스트리밍 우선으로 전환하던 시기인 2023년 리브랜딩은 스튜디오 Collins가 맡았다.",
    overview: "Collins가 2023년 브랜딩한 Freeform은 디즈니 산하의 젊은 성인층 대상 엔터테인먼트 사업부로, 케이블 채널에서 스트리밍 우선으로 전환하던 시기의 미디어/방송 브랜드다. 통념을 비트는 젊은 성인 서사를 밀어주는 포지셔닝을 가졌다.",
    identity: "Collins는 '항상 형성 중(constant state of becoming)'이라는 관객 인식을 핵심 개념으로 잡아, FF 이니셜을 감싼 기존 원형 로고를 가변형 타이포그래피 중심 체계로 교체했다. Monotype와 협업해 헬베티카의 원형 컷인 Neue Haas Grotesk를 기반으로 한 가변 서체를 제작했으며, 글자가 여러 축을 따라 비틀리고 휘며 끊임없이 변형되도록 설계됐다. 컬러는 기존의 오션 블루 계열에서 핑크 계열의 강조와 날카로운 표현적 형태로 이동했고, 정지 상태에서도 운동감을 암시하며 모션에서 정점에 이르는 시그니처 무빙 시스템을 갖췄다.",
  },
  "brandarchive-moju": {
    definition: "MOJU는 생강·강황 등을 원료로 한 부스터 샷을 주력으로 하는 영국의 기능성 음료 브랜드다. 2023년 리브랜딩은 런던 스튜디오 Earthling Studio가 맡았다.",
    overview: "MOJU는 영국의 기능성 음료 브랜드로, 생강·강황 등을 원료로 한 부스터 샷(작은 용량의 건강 음료)을 주력으로 한다. 제품군은 Vitality(활력)·Immunity(면역)·Gut Health(장 건강)의 세 가지 효능 중심 카테고리로 구성되며, 영국 기능성 샷 카테고리에서 높은 점유율을 차지하고 주요 유통 채널에 입점해 있다.",
    identity: "런던의 Earthling Studio가 2023년 진행한 리브랜딩으로, 로고를 더 굵고 강렬하게 다시 그려 힘과 대담함을 표현하고 신선함·가독성을 위해 흰색 비중을 키웠다. 로고에서 파생된 커스텀 서체를 타입 파운드리 Colophon과 협업해 제작했으며, 크고 거침없는 타이포그래피와 노랑·빨강(오렌지 계열 포함)의 선명한 색상 팔레트를 핵심으로 삼았다. 천연·신선 원료에 대한 약속을 상징하는 네이처 스탬프 아이콘은 유지하되 더 두드러지게 배치했고, 일곱 회분 복용량을 표시하는 음각 도징 라인을 가진 플라스크 형태의 새 병 구조를 도입했다.",
  },
  "brandarchive-brewbird": {
    definition: "BrewBird는 미국 캘리포니아 베이 에어리어 기반의 스페셜티 커피 테크 스타트업으로, 퇴비화 가능한 캡슐을 즉석 분쇄해 한 잔씩 추출하는 단일 서빙 플랫폼을 만든다. 브랜드 작업은 스튜디오 Mucho가 맡았다.",
    overview: "BrewBird는 미국 캘리포니아(샌프란시스코 베이 에어리어) 기반의 스페셜티 커피 테크 스타트업으로, 통원두를 담은 퇴비화 가능한(compostable) 캡슐을 기계 내에서 즉석 분쇄해 한 잔씩 추출하는 단일 서빙(single-serve) 브루잉 플랫폼을 만든다. 주로 사무실·기업 환경을 겨냥하며 지역 로스터들의 원두를 공급받아 매장 수준의 추출을 자동화하는 것을 표방한다.",
    identity: "디자인 스튜디오 Mucho가 약 2023년 브랜드 아이덴티티와 패키지를 작업했다. 로고는 두 개의 대문자 'B'를 결합해 보는 방식에 따라 새(bird)와 커피잔으로 동시에 읽히도록 설계한 점이 핵심이다. 타이포그래피는 LL Supreme 서체를 사용했고, 컬러는 블랙·화이트·브론즈를 기본으로 절제해 회화 요소가 도드라지게 했다. 스코틀랜드 아티스트 Craig Black이 핸드 푸어 아크릴 페인팅으로 각 커피의 풍미 프로파일을 시각화해 패키지에 적용했다.",
  },
  "brandarchive-tembo": {
    definition: "Tembo는 미국 뉴저지 기반의 부동산 투자·개발 회사로, 자산을 지역 공동체를 향상시키는 '가족의 일부'로 보는 철학을 표방한다(이름은 스와힐리어로 코끼리). 브랜드는 스튜디오 Perky Bros가 맡았다.",
    overview: "Tembo는 미국 뉴저지에 기반을 둔 부동산 투자·개발 회사로, Perky Bros가 2023년 발표한 브랜드 작업의 대상이다. 자산을 단순한 투자 대상이 아니라 지역 공동체를 향상시키는 '가족의 일부'로 본다는 인내심 중심의 철학을 표방하며, 창업 가문의 남아프리카 뿌리를 배경으로 한다.",
    identity: "이름 Tembo는 스와힐리어로 '코끼리'를 뜻하며, 핵심 상징은 손으로 그린 펜 스트로크 방식의 고전적 코끼리 일러스트로 세대를 잇는 신중함과 가족·공동체성을 표현한다. 타이포그래피는 전통적 돌 조각 장인정신에 뿌리를 둔 세리프와 절제되고 엄격한 레이아웃을 사용하며, 로고타입의 쐐기형(wedge) 획에서 아이콘 체계를 파생했다. 컬러는 정제됨과 모험심 사이의 균형을 노린 흙빛 팔레트이며, 금속 다이·박·무광 종이 등 촉각적 마감으로 '느림'의 인상을 강화한다.",
  },
  "brandarchive-curve-club": {
    definition: "Curve Club은 영국 런던 동부 쇼디치에 자리한 럭셔리 프라이빗 멤버스 클럽으로, 창업가를 위한 공간을 표방한다. 브랜드는 스튜디오 Wildish & Co.가 맡았다.",
    overview: "Curve Club은 영국 런던 동부 쇼디치(Shoreditch)에 자리한 럭셔리 프라이빗 멤버스 클럽으로, 창업가(founders)를 위한 공간을 표방한다. 여성 창업팀이 설립했으며, 디지털 기술·물리적 소재·살아있는 것이 만나는 장소라는 콘셉트를 내세운다.",
    identity: "Wildish & Co.는 '피지컬과 디지털의 결합(physical meets digital)'을 핵심 콘셉트로 잡아, 두 세계가 서로 녹아드는 유동적 표현을 전개했다. 로고는 Blaze Type의 Taklobo Display를 살짝 커스터마이즈한 전부 대문자 워드마크이며, 보조 서체로 Futura Std Light를 사용한다. 컬러는 그린·핑크·퍼플·블루 계열의 그라데이션 페어 여러 종으로 유기적이고 자연스러운 톤을 지향하며, 워드마크에서 추상화된 3D 형태가 공간과 모션에 적용되어 액체처럼 흐르는 인상을 준다.",
  },
  "brandarchive-miles": {
    definition: "Miles는 미국 미니애폴리스 기반의 10대(틴·트윈) 대상 데오드란트·바디케어 브랜드로, 성별을 구분하지 않는 젠더 뉴트럴 포지셔닝을 표방한다. 2023년 브랜드 작업은 스튜디오 Buddy-Buddy가 맡았다.",
    overview: "Miles는 미국 미니애폴리스 기반의 틴/트윈(10대) 대상 데오드란트·바디케어 브랜드로, 전직 Target 임원이 설립해 2023년 출시되었다. 의약품이나 반려동물·유아용이 아니라 퍼스널케어(체취 관리) 카테고리에 속하며, 성별을 구분하지 않는 젠더 뉴트럴 포지셔닝을 표방한다. 브랜드 아이덴티티는 미니애폴리스의 브랜딩·패키징 스튜디오 Buddy-Buddy가 맡았다.",
    identity: "콘셉트는 핑크/블루로 성별을 나누는 전통적 데오드란트 마케팅을 거부하고 개개인의 개성과 포용성을 강조하는 것으로, 사용자(10대)와 구매자(부모) 양쪽 모두에게 거슬리지 않게 말 거는 방향으로 잡았다. 로고는 올캡 워드마크로 타원형 컷아웃과 직선적이고 날카로운 기하학을 결합한 커스텀 서체를 사용한다. 컬러는 매대에서 경쟁 제품과 차별화하기 위해 의도적으로 선택한 선명한 오렌지를 주조색으로 쓰고, 패키징에는 향(scent) 변형을 구분하는 추상적 기하 도형을 적용했다.",
  },
  "brandarchive-yum-bun": {
    definition: "Yum Bun은 런던에서 부드러운 찐빵(바오)을 파는 길거리 음식 브랜드로, 푸드트럭·팝업에서 출발해 마켓 상설 매장을 운영한다. 2023년 아이덴티티는 스튜디오 How&How가 맡았다.",
    overview: "Yum Bun은 런던에서 부드러운 찐빵(바오)을 파는 길거리 음식 브랜드로, 푸드트럭과 팝업으로 시작해 Old Spitalfields Market과 Seven Dials Market에 상설 매장을 두고 있다. 런던 최초의 길거리 바오 매장으로 소개되며, 일식 이자카야식 조리에서 영감을 받아 동서양 풍미를 결합한 찐빵을 선보인다.",
    identity: "How&How는 'bounce and rise(바운스 앤 라이즈)'를 핵심 전략으로 삼아, 바오의 부드럽게 솟는 김과 길거리 음식의 품질·윤리 기준을 높인다는 의미를 결합한 낙관적 아이덴티티를 구축했다. 로고는 일본 한코(Hanko) 도장의 굵고 단단한 형태에서 출발해 동서양·전통과 현대의 융합을 표현했고, 워드마크는 브라질 Leme Studio의 Ogre Mono Grotesk를 바탕으로 제작됐다. 컬러는 일출에서 영감받아 노란색을 주조색으로 한 부드러운 파스텔 팔레트와 해질녘 구름·바오의 김을 연상시키는 그라데이션을 사용했으며, 'Bowie'라는 둥글고 명랑한 바오 마스코트를 도입했다.",
  },
  "brandarchive-the-mean-tomato": {
    definition: "The Mean Tomato는 미국 배달 플랫폼 Gopuff를 위해 만들어진 뉴욕 스타일 피자 브랜드(테이크아웃·배달)다. 브랜드 기획·아이덴티티는 스튜디오 Kuba & Friends가 맡았다.",
    overview: "The Mean Tomato는 미국 배달 플랫폼 Gopuff를 위해 만들어진 뉴욕 스타일 피자 브랜드로, 식음료(테이크아웃·배달 피자) 부문에 속하며 미국 시장을 겨냥했다. 크리에이티브 스튜디오 Kuba & Friends가 2023년경 브랜드 기획·네이밍·아이덴티티를 맡았고, 레터링 디자이너 Alec Tear, 일러스트레이터 Dan Woodger가 협업했다.",
    identity: "아이덴티티는 클래식한 뉴욕 피자가게 코드(이탈리아 국기에서 따온 빨강·초록과 흰 바탕)를 비틀어, 짓궂고 자만심 가득하지만 미워할 수 없는 'mean(심술궂은)' 토마토 마스코트를 중심에 둔 것이 핵심이다. 마스코트 캐릭터는 Dan Woodger가 그렸고, 브랜드는 굵고 개성 있는 커스텀 레터링을 전면에 사용한다. 컬러는 흰 바탕 위 빨강·초록을 기조로 하며 빨강이 지배적으로 쓰인다.",
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
