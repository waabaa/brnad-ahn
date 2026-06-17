// Batch 5: WEB-VERIFIED content for recent rebrands (Pro-locked source), sourced
// from agency project pages + design press (Pentagram, DNCO, Otherway, Fiasco, For
// The People, Onfire, Oker, Motto; Brand New/Dieline/Creative Boom/BP&O). Unverified
// colors/typeface not asserted. Avoids SSG filter words. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-twelve-labs": {
    definition: "Twelve Labs는 영상의 내용을 의미 단위로 검색·요약·분석하는 비디오 이해(video understanding) 멀티모달 AI 플랫폼 기업이다. 아이덴티티는 Pentagram이 맡았다.",
    overview: "Twelve Labs는 영상의 내용을 의미 단위로 검색·요약·분석하는 비디오 이해(video understanding) 멀티모달 AI 플랫폼을 개발하는 기업이다. 샌프란시스코와 서울에 거점을 두고 한국계 창업진이 이끄는 스타트업으로, Pegasus 등 영상 언어 모델을 통해 영상을 프레임의 나열이 아닌 의미적 정보로 다루는 기술을 표방한다.",
    identity: "2025년 공개된 새 브랜드는 Pentagram의 파트너 Jody Hudson-Powell과 Luke Powell이 주도했다. 핵심 개념은 영상을 선형적 타임라인이 아니라 하나의 부피(volume)로 보는 'video as volume'이며, 심벌은 에드워드 마이브리지(Eadweard Muybridge)의 1878년 질주하는 말 연속사진 모션 연구를 차용한 갤러핑 호스로, 회사가 AI 모델에 말 이름을 붙여온 점과 연결된다. 시각 시스템은 프레임에서 라이브러리로 확장되는 스레드형 다이어그램과 렌즈(로젠지) 형태의 인터페이스 모티프를 활용한다. 구체적 서체명과 색상값은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-snickers": {
    definition: "스니커즈(Snickers)는 미국 제과 기업 마스(Mars)가 1930년 출시한 초콜릿 바로, 누가·캐러멜·구운 땅콩을 밀크초콜릿으로 감싼 구성이 특징이다. 2026년 jkr과 Studio Drama가 새 비주얼 시스템을 선보였다.",
    overview: "스니커즈(Snickers)는 미국 제과 기업 마스(Mars)가 1930년 출시한 초콜릿 바로, 누가·캐러멜·구운 땅콩을 밀크초콜릿으로 감싼 구성이 특징이다. 출시 이후 핵심 레시피가 크게 바뀌지 않은 채 이어져 세계에서 가장 많이 팔리는 초콜릿 바 중 하나로 꼽힌다. 영국 등 일부 시장에서는 1990년까지 '마라톤(Marathon)'으로 판매되다 글로벌 명칭 통일 과정에서 스니커즈로 일원화됐다.",
    identity: "2026년 글로벌 브랜딩 에이전시 jkr(Jones Knowles Ritchie)가 타입 스튜디오 Studio Drama와 협업해 스니커즈의 새 비주얼 시스템을 선보였다. 핵심은 워드마크의 'S' 척추 형태, 수직 획의 리듬, 각진 종단부에서 단서를 얻어 개발한 전용 서체 'Snickers Sans'로, 디스플레이용 Epic·Everyday와 본문용 Text(Regular·Bold)로 구성된다. 기존 로고타입은 자간과 글자 간 구조 관계를 다듬는 미세 조정 수준으로 손봐 특유의 태도를 유지하면서 표현을 현대화했다.",
  },
  "brandarchive-westbund-central": {
    definition: "웨스트번드 센트럴(Westbund Central, 西岸中央)은 홍콩랜드(Hongkong Land)가 상하이 쉬후이 황푸강 변에 개발 중인 초대형 복합단지로, 단일 투자로는 홍콩랜드 최대 규모다. 플레이스 브랜딩은 DNCO가 맡았다.",
    overview: "웨스트번드 센트럴(Westbund Central, 西岸中央)은 홍콩랜드(Hongkong Land)가 상하이 쉬후이 황푸강 변 웨스트번드 워터프런트에 개발 중인 초대형 복합단지로, 총 사업비 약 80억 달러, 연면적 약 110만 제곱미터 규모다. 12개 오피스, 약 600개의 리테일·다이닝, 1,500세대 주거, 호텔과 공원·강변 산책로·문화시설로 구성된 세계 최대급 혼합용도 개발이다.",
    identity: "DNCO는 황푸강에서 영감을 받아 '흐름(flow)'을 핵심 원리로 삼았고, 치열한 업무 문화에 대비되는 균형 잡힌 삶을 제안하는 'Enjoy Life'를 슬로건으로 내세워 이 단지를 상하이의 새로운 도심으로 포지셔닝했다. 워드마크는 Lock Serif의 날카로운 세리프와 Noto의 부드러운 곡선을 결합해 각 글자에 움직임의 감각을 부여했으며, 타이포그래피가 물의 유동성을 따라 흐르고 가라앉는 방식으로 설계됐다. 적용 사례에서는 오렌지·틸·블루·그린 계열이 사용된다.",
  },
  "brandarchive-16th-dean-street": {
    definition: "16th Street는 미국 콜로라도주 덴버 도심을 가로지르는 보행자 거리로, 1982년 개장한 16th Street Mall이 대규모 재정비를 거쳐 2025년 'Mall'을 떼고 16th Street로 개명됐다. 플레이스 브랜딩은 DNCO가 맡았다.",
    overview: "16th Street는 미국 콜로라도주 덴버 도심을 가로지르는 보행자 중심 거리로, 1982년 개장 당시 명칭은 16th Street Mall이었으나 대규모 재정비를 거치며 2025년 'Mall'을 떼어낸 16th Street로 공식 개명됐다. 다운타운 덴버 파트너십이 이 거리를 소매 중심에서 문화·이벤트·예술이 어우러진 도심의 중심 무대로 재정의하기 위해 플레이스 브랜딩을 추진했고, DNCO가 작업을 맡았다.",
    identity: "'The Denver way'를 핵심 콘셉트이자 태그라인으로 삼아, 거리가 도시의 간선이자 덴버의 성격이 펼쳐지는 무대라는 이중 의미를 담았다. 로고는 덴버의 상징이 된 방울뱀 무늬 포장 패턴과 I.M. Pei의 원설계에서 따온 다이아몬드 형태의 양끝 장식을 쓰며, 거리를 닮아 가변적으로 확장되는 선이 방문객을 도심으로 이끈다. 색상은 콜로라도의 자연 풍경에서 착안해 오렌지·퍼플·그린·블루가 보도되었고, 덴버의 스티커 문화에서 영감을 받은 커스텀 아이콘은 지역 아티스트 YAMZ와 협업해 제작했다.",
  },
  "brandarchive-robin": {
    definition: "Robin(Robin AI)은 변호사·엔지니어·교육자가 함께 만든 법률 AI(리걸테크) 플랫폼이다. 2025년 리브랜드는 런던 스튜디오 Otherway가 맡았다.",
    overview: "Robin(Robin AI)은 법률 AI 플랫폼으로, 변호사·엔지니어·교육자가 함께 만든 리걸테크 서비스다. 런던 스튜디오 Otherway가 2025년 리브랜딩을 맡았으며, 법무를 단순한 병목이나 보호 장치가 아니라 비즈니스 가치를 창출하는 동력으로 재정의하는 'New Legal' 전략을 핵심으로 삼았다.",
    identity: "심볼은 브랜드명과 같은 울새(robin) 모티프를 더 정밀하고 기하학적으로 다듬은 아이콘이며, 워드마크는 권위와 따뜻함을 동시에 주는 무겁고 응축된 세리프 서체로 구성됐다. 색상은 리걸테크에서 흔한 블루·퍼플을 벗어나 울새의 가슴 깃에서 착안한 '레드브레스트(red-breast)' 컬러를 핵심으로 도입했다. 일러스트레이터 Ariel Lee와 협업해 울창한 숲과 자연 질감, 유기적 형태를 담은 회화적 일러스트 생태계를 '의미 있는 성장'의 은유로 구축했다.",
  },
  "brandarchive-pigment-ai": {
    definition: "Pigment(피그먼트)는 2019년 파리에서 설립된 기업용 비즈니스 플래닝·예측(FP&A) SaaS로, 재무·영업·HR·공급망 팀의 계획 수립을 지원한다. 2025년 에이전트형 AI 제품 아이덴티티는 Fiasco가 맡았다.",
    overview: "Pigment(피그먼트)는 2019년 파리에서 설립된 기업용 비즈니스 플래닝·예측(FP&A) SaaS로, 재무·영업·HR·공급망 팀이 데이터와 전략을 결합해 계획을 수립하도록 지원한다. Figma·Klarna·Siemens·Unilever 등을 고객으로 두며, 최근에는 비즈니스 의사결정을 돕는 전문 AI 에이전트 네트워크로 제품을 확장하고 있다.",
    identity: "Fiasco는 Pigment의 에이전트형 AI 제품을 위한 아이덴티티를 개발하며 크리에이티브 플랫폼을 'A Spectrum of Specialists'로 정의했다. 화가의 캔버스 위 색을 데이터의 조합·층위에 빗댄 브랜드명에서 출발해, 프리즘 효과로 분광되는 애니메이션 스펙트럼을 핵심 그래픽 장치로 삼아 개별 에이전트가 섞이고 협업하는 모습을 표현했다. 컬러는 AI 기술임을 신호하는 그라데이션과 밝은 톤으로 낙관적 정서를 주었고, 각 전문 에이전트는 크기·성격이 확장되는 기하학적 도형으로 구분했다. 구체적 서체와 색상 코드는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-equator": {
    definition: "Equator는 호주 스튜디오 For The People가 작업한 지속가능 여행(sustainable travel) 플랫폼이자 컨설팅 서비스다. 환경·사회 영향 데이터를 분석해 여행자와 사업자의 의사결정을 돕는다.",
    overview: "Equator는 지속가능 여행 플랫폼이자 컨설팅 서비스로, 환경·사회 영향 데이터를 수백 개 지표로 분석해 여행자에게는 지속가능한 선택을 돕는 인사이트로 번역하고 여행 사업자에게는 의사결정 근거를 제공한다. 리브랜드는 호주 스튜디오 For The People가 맡았다.",
    identity: "로고는 적도선과 지구 자전축 기울기를 활용해 지구본 형태를 만들면서 동시에 알파벳 소문자 'e' 형태를 이루고, 모션에서는 지구의 회전을 모사하며 방대한 데이터를 훑고 정렬하는 움직임을 표현한다. 타이포그래피는 René Bieder의 Stakkat와 Displaay Type Foundry의 Azeret를 사용하며, 색상은 전형적인 친환경 팔레트를 벗어나 회색·라벤더·중성 브라운 톤에 '오키드 핑크'를 강조색으로 더한다. 브랜드 시스템은 무한한 데이터 포인트로 이뤄진 그리드 위에 내비게이션 태그와 아이콘을 배치해 길을 안내한다.",
  },
  "brandarchive-veesey": {
    definition: "Veesey는 뉴질랜드의 유제품을 쓰지 않는(dairy-free) 치즈 브랜드로, 성장 중인 식물성 치즈 카테고리에 속한다. 리브랜드는 오클랜드 스튜디오 Onfire Design이 맡았다.",
    overview: "Veesey는 뉴질랜드의 유제품을 쓰지 않는(dairy-free) 치즈 브랜드로, 성장 중인 식물성 치즈 카테고리에 속한다. 자리를 잡은 뒤 경쟁 제품들과 비슷해진 표현에서 차별화하기 위해 패키지와 포지셔닝을 다듬는 리브랜딩을 진행했으며, 뉴질랜드 오클랜드의 브랜딩·패키지 스튜디오 Onfire Design이 맡았다.",
    identity: "포지셔닝은 'Intolerant to boring'으로, 행복·과감한 음식·열정을 키워드로 한 표현 언어를 통해 '브랜드는 약하게, 제품 중심으로'라는 카테고리 관행에서 '크고 당당하게'로 서사를 전환했다. 워드마크는 부드럽게 녹아내리는 치즈 질감을 담아 활기차고 즉흥적인 느낌으로 표현했으며, 카테고리 표준인 파스텔·화이트 대신 밝은 노란색 브랜드 블록을 채택하고 강렬한 컬러와 손그림 두들로 제품 탐색과 음식 제안을 표현했다. 구체적 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-ouch-burgers": {
    definition: "Ouch는 유럽 패스트캐주얼 시장을 겨냥한 스매시버거 브랜드로, 노르웨이 스타방에르 스튜디오 Oker가 2024년 브랜드와 디자인을 맡았다. 슬랩스틱 코미디를 핵심 콘셉트로 한다.",
    overview: "Ouch는 유럽 패스트캐주얼 시장을 겨냥한 스매시버거 브랜드로, 노르웨이 스타방에르 소재 디자인 스튜디오 Oker가 2024년 브랜드 전략·플랫폼·디자인·웹·아트디렉션·일러스트레이션을 맡아 작업했다. 브랜드명 'Ouch'는 스매시버거의 'smash(으깨다·부딪히다)'에서 출발한 말장난으로, 무성영화 시대 슬랩스틱부터 인터넷 fail 컬처까지 이어지는 신체 코미디를 핵심 콘셉트로 삼는다.",
    identity: "로고타입은 감탄사처럼 디자인되었고, 밈에서 행동·소리·반응을 강조할 때 쓰는 별표(애스터리스크)로 보강된다. 본문 서체로는 Founders Grotesk가 쓰인 것으로 보도되었다. 컬러는 신선함과 현지 조달 고품질 식재료를 신호하는 비비드 그린을 유니폼·사이니지 전반의 앵커 색으로 사용한다. 시각 언어의 중심은 갈퀴를 밟거나 포탄에 맞는 등 과장된 실수 장면을 묘사한 느슨한 스케치풍 일러스트다.",
  },
  "brandarchive-perfomance-golf": {
    definition: "퍼포먼스 골프(Performance Golf)는 미국의 온라인 골프 교습·트레이닝 브랜드로, 스윙 영상을 분석하는 SwingFix AI 등으로 아마추어의 스윙 교정을 돕는다. 리브랜드는 에이전시 Motto가 맡았다.",
    overview: "퍼포먼스 골프(Performance Golf)는 미국의 온라인 골프 교습·트레이닝 브랜드로, 아마추어 골퍼의 스윙 교정과 실력 향상을 돕는 디지털 플랫폼을 운영한다. 스윙 영상을 분석해 근본 결함을 찾아 교정하는 SwingFix AI와 강사 코스 등을 제공하며, 초보자용 입문 프로그램도 갖췄다.",
    identity: "Motto는 'Love Your Game'이라는 핵심 아이디어를 중심으로 브랜드 전략과 비주얼 시스템을 정리했다. 컬러는 중립적인 기본 팔레트에 정열을 표현하는 선명한 'Performance Orange'를 강조색으로 두었고, 타이포그래피는 기술적이면서도 대화체로 느껴지도록 설계했다. 진단·드릴·장비를 하나의 연결된 생태계로 시각화하는 아이콘과 UI 등 데이터 중심의 비주얼 시스템을 구축했으며, 아트디렉션은 노력·돌파·환희의 서사를 담은 시네마틱 리얼리즘을 지향한다.",
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
