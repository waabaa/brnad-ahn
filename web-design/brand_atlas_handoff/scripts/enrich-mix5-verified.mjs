// Batch 17: WEB-VERIFIED content. Agency pages + design press (jkr/Monotype, Perron-
// Roettinger, Porto Rocha, Ragged Edge, Landor, NB Studio, Marx Design; Brand New/
// Creative Review/Design Week/Creative Boom/BP&O/Dieline/It's Nice That).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-m-and-ms": {
    definition: "M&M's는 Mars가 1941년 미국에서 출시한 컬러 설탕 코팅 초콜릿 캔디 브랜드로, 의인화된 스포크스캔디로 유명하다. 2022년 글로벌 리프레시는 jkr(Jones Knowles Ritchie)이 Monotype와 함께 맡았다.",
    overview: "M&M's는 Mars(마스)가 만든 컬러 설탕 코팅 초콜릿 캔디 브랜드로, 1941년 미국에서 탄생했으며 두 개의 'M'은 창업자 Forrest E. Mars Sr.와 Bruce Murrie의 성에서 유래했다. 둥글납작한 렌즈콩(lentil) 모양의 알갱이와 의인화된 캐릭터인 스포크스캔디(spokescandies)로 널리 알려져 있으며, 2022년 1월 Mars는 jkr가 주도한 글로벌 브랜드 리프레시를 공개했다.",
    identity: "2022년 리프레시의 핵심 콘셉트는 포용(inclusivity)으로, '모두가 소속감을 느끼는 세상을 만든다'는 새 브랜드 목적을 내세웠다. 시각적으로는 기존의 대각선 로고를 수평으로 바로 세우고 두 M 사이의 앰퍼샌드(&)를 연결의 상징으로 강조했으며, 한 봉지를 쏟았을 때의 색채감을 연상시키는 확장된 컬러 팔레트를 도입했다. 스포크스캔디는 각 캐릭터의 개성을 살리는 방향으로 디자인이 갱신되었다. 타이포그래피는 Monotype가 jkr와 협업해 제작한 브랜드 최초의 전용 서체 'All Together'로, 스마일을 암시하는 잉크 트랩과 캔디를 닮은 볼 터미널, 렌즈콩 형태를 참조한 글자꼴, 다양한 굵기·폭의 가변 폰트를 특징으로 한다.",
  },
  "brandarchive-ghia-non-alcoholic-aperitif": {
    definition: "Ghia는 2020년 멜라니 마사랭이 선보인 무알코올 아페리티프 브랜드로, 지중해 식물 재료로 술을 모방하기보다 그 자체로 완결된 쌉쌀한 음료를 지향한다. 패키지는 스튜디오 Perron-Roettinger가 맡았다.",
    overview: "Ghia는 2020년 멜라니 마사랭(Melanie Masarin)이 선보인 무알코올 아페리티프 브랜드로, 지중해의 한낮부터 저녁까지 이어지는 휴식·사교 문화에서 영감을 얻었다. 화이트 그레이프 주스, 유자, 젠티안 뿌리 등 지중해 식물 재료를 배합해 술을 모방하기보다 그 자체로 완결된 쌉쌀한 음료를 지향하며, 브랜드명은 이탈리아 자동차 디자이너 자친토 기아에서 따왔다.",
    identity: "Perron-Roettinger(Willo Perron, Brian Roettinger)는 고전적인 환대 사이니지와 지중해 아페리티프 브랜드에서 출발해, 유럽 자동차 엠블럼·유로 디스코·손으로 그린 간판 등을 참조한 친근하면서도 시대를 타지 않는 패키지를 만들었다. 워드마크는 19세기 캐슬런(Caslon)의 팻 스트레스 실험에서 영감받은 이탈리아풍 스크립트로 둥근 삼각형 라벨을 가로질러 배치되며, 병은 둥근 나무 마개로 독특한 실루엣을 완성했다. 이후 2.0 버전에서는 리브(ribbed) 가공 유리와 'Clear Eyed & High Minded' 양각 문구가 더해져 재사용 가능한 오브제를 지향했다.",
  },
  "brandarchive-olympikus": {
    definition: "올림피쿠스(Olympikus)는 1975년 설립된 브라질의 스포츠 신발 브랜드로, 제조사 Vulcabras가 보유한 브라질 최대 규모의 스포츠 브랜드다. 2022년 아이덴티티는 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "올림피쿠스(Olympikus)는 1975년 설립된 브라질의 스포츠 신발 브랜드로, 브라질 신발 제조사 불카브라스(Vulcabras)가 보유하고 있다. 연간 1,500만 켤레 이상을 판매하는 브라질 최대 규모의 스포츠 브랜드로 알려져 있으며, 퍼포먼스·편안함·합리적 가격을 결합한 운동화로 시장을 넓혀왔다.",
    identity: "디자인 스튜디오 Porto Rocha는 2022년 기존 자산을 새로 만드는 대신 '가장 확신에 찬 형태로' 강화하는 방향으로 아이덴티티를 다듬어, 이탤릭은 더 기울이고 블루는 더 진하게, 볼드 워드마크는 더 굵게 정제했다. 타이포그래피는 플로리안 카르스텐(Florian Karsten)이 제작한 커스텀 디스플레이 서체 FK Olympikus를 중심으로 Production Type의 Signal 서체와 함께 운용한다. 전체 시스템은 육상 트랙과 스포츠 깃발에서 흔히 보이는 줄무늬와 기하 형태에서 착안한 모듈러 구조로 구성되어 다양한 접점에 유연하게 적용된다.",
  },
  "brandarchive-first-choice": {
    definition: "퍼스트 초이스(First Choice)는 TUI 그룹에 속한 영국의 패키지 휴가 브랜드로, 약 30년간 올인클루시브 패키지 휴가로 알려져 왔다. 2023년 리브랜딩은 런던 에이전시 Ragged Edge가 맡았다.",
    overview: "퍼스트 초이스(First Choice)는 영국의 패키지 휴가 브랜드로, TUI 그룹에 속해 있다. 영국 번화가 매장에서 시작해 온라인으로 전환하며 약 30년간 올인클루시브 패키지 휴가로 알려져 왔으며, 2023년 런던 브랜딩 에이전시 Ragged Edge와 함께 여행자가 자신의 취향에 맞춰 휴가를 직접 구성하도록 돕는 플랫폼으로 재정비되었다.",
    identity: "리브랜딩의 핵심 개념은 'Proudly Picky(까다로움을 자랑스럽게)'로, 더 나은 선택지를 놓칠까 두려워하는 심리(FOBO)에 대응해 여러 예약 플랫폼을 거치지 않고도 맞춤 휴가를 구성할 수 있다는 점을 표현한다. 로고는 파도·산·도시·바다 등 여행자가 선택할 수 있는 옵션을 상징하는 아이콘 묶음을 결합한 형태로, 시퀀스로 배열되면 버튼 형태의 기능적 장치로도 작동한다. 타이포그래피는 Order Type Foundry와 협업해 Pastiche Grotesque를 기반으로 제작한 맞춤 헤드라인 서체로 의도적으로 균일하지 않고 대담하면서도 유쾌한 성격을 띠며, 색상은 부드러운 핑크를 중심으로 한다.",
  },
  "brandarchive-orchestra-sinfonica-di-milano": {
    definition: "오케스트라 신포니카 디 밀라노(Orchestra Sinfonica di Milano)는 이탈리아 밀라노를 기반으로 한 교향악단으로, 2022년 기존 'LaVerdi'에서 현재 명칭으로 전환했다. 리브랜딩은 Landor(Landor & Fitch)가 맡았다.",
    overview: "오케스트라 신포니카 디 밀라노(Orchestra Sinfonica di Milano)는 이탈리아 밀라노를 기반으로 한 교향악단으로, 이탈리아에서 가장 중요한 교향악단 중 하나로 소개된다. 2022년 기존 명칭 'LaVerdi'에서 도시와의 깊은 연관성을 더 분명히 드러내는 현재의 명칭으로 전환했다.",
    identity: "Landor(Landor & Fitch) 밀라노 오피스가 진행한 2022년 리브랜딩은 음악의 템포와 밀라노의 빠른 리듬·미래주의(Futurism)·혁신을 동시에 가리키는 'Growing Uptempo' 콘셉트를 토대로 한다. 로고는 M 글리프에서 파생된 음파 형태로 밀라노 대성당(두오모)의 형상을 연상시키도록 설계됐으며, 음악의 강도에 따라 로고타입과 타이포그래피가 넓어지거나 좁아지는 모션 시스템을 갖췄다. 전용 서체는 'TUMB TUMB'로 두오모의 각진 건축과 20세기 초 건물 파사드에서 영감을 받은 작은 세리프가 특징이며, 컬러 팔레트는 미래주의 미술 운동에서 유래한 것으로 보도됐다.",
  },
  "brandarchive-philharmonie-luxembourg": {
    definition: "필하모니 룩셈부르크는 룩셈부르크시 키르히베르크 지구의 콘서트홀로, 823개의 흰색 강철 기둥 파사드가 상징이다(2005년 완공). 2023년 아이덴티티는 스튜디오 NB Studio가 맡았다.",
    overview: "필하모니 룩셈부르크는 룩셈부르크시 키르히베르크 지구에 위치한 콘서트홀(정식 명칭 Grande-Duchesse Joséphine-Charlotte Concert Hall)로, 건축가 크리스티앙 드 포르장파르크가 설계해 2005년 완공되었다. 약 1,500석 규모이며, 흰색 강철로 된 823개의 파사드 기둥이 건물의 상징적 특징이다.",
    identity: "NB Studio는 2023년 새 아이덴티티를 공개하며 산하 브랜드들을 통합 마스터 브랜드로 재구성했다. 로고는 건물의 수직 기둥을 형상화했고, 크리에이티브 코더 Patrik Hübner와 협업해 JavaScript·WebGL 기반의 제너러티브 도구로 실제 음악 파형에 반응해 기둥이 진동·물결치도록 했다. 타이포그래피는 '모든 음악은 진동으로 경험된다'는 발상에서 음계를 이루는 글자 A–G가 화면에서 공명하도록 처리했으며, 서체로 Basel Grotesk를 사용했다. 컬러 팔레트는 다양한 음악 장르를 아우르도록 폭넓고 다양하게 구성됐다.",
  },
  "brandarchive-eager": {
    definition: "Eager는 영국에 기반을 둔 과일 주스 음료 브랜드로, 주류업계 B2B에서 성공한 뒤 일반 소비자 시장으로 확장했다. 2023년 리브랜딩은 런던 에이전시 Ragged Edge가 맡았다.",
    overview: "Eager는 영국에 기반을 둔 과일 주스 음료 브랜드로, 원래 바텐더와 주류업계 거래(B2B)에서 성공한 뒤 일반 소비자 및 DTC 시장으로 확장하고자 했다. 런던 브랜딩 에이전시 Ragged Edge가 2023년 무렵 정체성 시스템·패키지·이커머스 사이트를 포함한 전면 리브랜딩을 수행했다.",
    identity: "핵심 콘셉트는 과장된 건강 강조 문구나 과일 사진 같은 카테고리 관행을 모두 배제하고 '지극히 평범해서 오히려 특별한' 정직함을 내세우는 것이었다. 과일 이미지 대신 밝고 제한된 색상으로 맛을 구분하는 컬러 블로킹을 사용했고, 'Is what it is orange juice', 'A is for apple juice'처럼 솔직한 카피를 전면에 배치했다. 타이포그래피는 산세리프가 아닌 동시대적 세리프(자료에 따르면 P22 Mackinac)를 활용해 저가 PB 패키지의 절제된 미감을 디자인 지향적으로 재해석했으며, D&AD·Dieline 어워즈 등에서 수상했다.",
  },
  "brandarchive-autex-acoustics": {
    definition: "오텍스 어쿠스틱스(Autex Acoustics)는 뉴질랜드 최대의 실내 음향 제품 제조사로, 벽 마감재·패널·배플 등 음향 솔루션을 만든다. 2022년 리브랜딩은 스튜디오 Marx Design이 맡았다.",
    overview: "오텍스 어쿠스틱스(Autex Acoustics)는 뉴질랜드 최대의 실내 음향 제품 제조사로, 호주·영국·미국에 판매·제조 조직을 두고 있다. 벽 마감재·패널·배플·스크린 등 실내 공간의 잔향과 소음을 줄이는 음향 솔루션을 만들며, 재활용 섬유를 포함한 PET 소재 기반으로 알려져 있다.",
    identity: "Marx Design이 진행한 리브랜딩은 브랜드 인식을 '기능적 제조사'에서 '디자인 주도 혁신가'로 전환하는 것을 목표로, 1960년대 스위스 디자인 전통을 차용한 정제되고 시대를 초월하는 시각 체계를 구축했다. 제품 패널과 음파의 감쇠에서 착안한 건축적·입체적 그래픽 패턴을 핵심 자산으로 개발했으며, 서체는 Co Type의 RM Neue를 사용했다. 색상은 흑백 위주의 미니멀한 기조로 다채로운 제품 색이 사진에서 주연이 되도록 했고, 인포그래픽용으로 제품에서 파생한 보조 색상을 별도 운용했다.",
  },
  "brandarchive-berg": {
    definition: "Berg(버그)는 뉴질랜드 음료 회사 Lion이 출시한 알코올 하드 셀처 브랜드로, 인공 색소·방부제를 배제한 정제된 음료를 표방한다. 2022년 브랜드·패키지는 오클랜드 스튜디오 Marx Design이 맡았다.",
    overview: "Berg(버그)는 뉴질랜드 음료 회사 Lion이 출시한 알코올 하드 셀처(hard seltzer) 브랜드로, 인공 색소와 방부제를 배제한 정제된 음료를 표방하며 뉴질랜드와 호주 시장을 겨냥했다. 2022년 오클랜드 기반 스튜디오 Marx Design이 브랜드 정체성·패키지 디자인·아트 디렉션을 맡았으며, 워터멜론·레몬&유자·블랙베리 세 가지 맛으로 출시되었다.",
    identity: "핵심 콘셉트는 '빙산(iceberg)' 메타포로, 단순한 음료가 복잡한 공정의 결과물이라는 점과 브랜드명을 연결해 'Refreshingly deep(상쾌하게 깊은)'이라는 약속으로 발전시켰다. 패키지는 일반적인 가로형 대신 빙산 실루엣을 담은 세로 밴드를 중심에 두고, 사진·일러스트·패키지를 가로지르는 수평선(horizontal plane) 그래픽 장치로 수면 위아래의 대비를 표현했다. 색상은 채도 높은 블루 계열을 폭넓게 사용해 현대적이고 눈에 띄는 인상을 주며, 멀리서는 강한 그래픽 임팩트, 가까이서는 정교한 일러스트 디테일과 매트 마감의 질감 대비를 의도했다.",
  },
  "brandarchive-everybird": {
    definition: "Everybird는 뉴질랜드의 스페셜티 커피 브랜드로, 카페 겸 로스터 Kōkako가 일상 소비자를 겨냥해 선보인 라인이다. 공정무역·유기농·기후중립 인증과 퇴비화 가능 패키지가 특징이며, 2022년 브랜드 작업은 Marx Design이 맡았다.",
    overview: "Everybird는 뉴질랜드의 스페셜티 커피 브랜드로, 카페 겸 로스터인 Kōkako Organic Coffee Roasters가 일상 소비자를 겨냥해 선보인 라인이다. 공정무역·유기농·기후중립 인증을 갖추고 가정에서 퇴비화가 가능한 패키지를 사용하며, Everyday와 Half-Caf 두 블렌드로 출시되었다. 브랜드 작업은 뉴질랜드 오클랜드 기반의 Marx Design이 2022년 무렵 맡았다.",
    identity: "Marx Design은 환경적 실천을 부담이 아닌 사람들을 모으는 일로 풀어내, 포용성과 공동의 책임을 핵심 개념으로 삼았다. 굵은 대문자 콘덴스드 산세리프 타이포그래피와 라인 드로잉 일러스트레이션, 네온 톤의 선명한 색을 결합했고, 진열대에서 눈에 띄도록 고대비의 흰색 바탕과 밝은 스폿 컬러로 브랜드 마크를 구성했다. 잉크블루는 손글씨 간판을 연상시키는 장난기 있는 일러스트에 쓰여 모브랜드 Kōkako와의 연결고리 역할을 하며, 브랜드명은 Kōkako(뉴질랜드 고유종 새)를 가리키되 '모두를 위한 커피'라는 더 넓은 포용 개념으로 확장했다.",
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
