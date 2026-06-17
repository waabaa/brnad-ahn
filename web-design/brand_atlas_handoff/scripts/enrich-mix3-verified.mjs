// Batch 14: WEB-VERIFIED content. Agency pages + design press (Collins, How&How,
// Campbell Hay, Dutchscot, The Colour Club, Land of Plenty, Here For Studio; Brand
// New/Creative Review/Creative Boom/BP&O/It's Nice That/Dieline). Unverified colors/
// type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-bose-2024": {
    definition: "Bose는 1964년 Amar Bose가 설립한 미국의 오디오 기업으로, 헤드폰과 스피커 등 음향 제품으로 알려져 있다. 2024년 약 60년 만의 리브랜딩은 스튜디오 Collins가 맡았다.",
    overview: "Bose는 1964년 Amar Bose가 설립한 미국의 오디오 기업으로, 헤드폰과 스피커 등 음향 제품으로 알려져 있다. 2024년 디자인 스튜디오 Collins와 협업해 약 60년 된 브랜드를 현대적으로 재정비했다.",
    identity: "2024년 리브랜딩은 'Sound is Power'라는 전략적 관점 아래 몰입형 오디오 경험으로 브랜드 가치를 끌어올리는 데 초점을 맞췄다. 1960년대 손으로 그린 오리지널 워드마크는 대부분 유지하되 'B' 하단과 'E' 상단의 바(bar) 부분만 변경했다. 바르샤바 기반 타입 파운드리 Tekio와 협업해 워드마크의 이탤릭 레터폼을 기반으로 한 전용 서체를 개발했으며, 음계의 음(note)에서 착안한 8가지 색상 팔레트를 도입했다.",
  },
  "brandarchive-chester-zoo": {
    definition: "체스터 동물원(Chester Zoo)은 1931년 설립된 영국 최대 규모의 동물원이자 보전 자선단체로, 정부 지원 없이 멸종 위기종 보전 사업을 전개한다. 2024년 정체성은 스튜디오 How&How가 맡았다.",
    overview: "체스터 동물원(Chester Zoo)은 1931년 모터스헤드 가문이 설립한 영국의 동물원으로, 1934년 등록 자선단체 체제로 운영되기 시작했다. 500종 이상·2만 7천여 마리의 동물을 보유하며 정부 지원 없이 운영되는 영국 최대 규모의 야생동물 보전 기관이자 자선단체로, 여러 나라의 보전 파트너와 함께 멸종 위기종 보전 사업을 전개한다.",
    identity: "How&How가 2년간의 협업을 거쳐 2024년 공개한 정체성은 'Force for Nature(자연을 위한 힘)'라는 콘셉트를 중심으로 행동 지향성과 긍정적 추진력을 강조한다. 로고는 각진 'C' 자의 안쪽 여백이 코뿔소 뿔 형태를 이루도록 설계되었으며(동물원이 지원해 온 동부검은코뿔소 보전 사업에 대한 은유), 깜빡이는 눈을 더한 모션으로 구현된다. 전용 서체는 Sharp Type와 협업해 제작된 그로테스크 변형으로 잎·꼬리·발톱 등 자연 모티프를 연상시키는 곡선 장식을 특징으로 하며, 색채는 'Forest Mode'로 불리는 짙은 숲 녹색·흙빛 갈색·노을빛 색조에 선명한 강조색을 더한 구성이다.",
  },
  "brandarchive-muse-group": {
    definition: "뮤즈 그룹(Muse Group)은 얼티밋 기타·뮤즈스코어·오데시티 등을 보유한 음악 소프트웨어 기업으로, 전 세계 수억 명이 사용한다. 2024년 통합 브랜드는 스튜디오 Collins가 맡았다.",
    overview: "뮤즈 그룹은 전 세계 4억 명 이상이 쓰는 음악 소프트웨어 기업으로, 기타 코드·악보 서비스 얼티밋 기타, 악보 작성 도구 뮤즈스코어, 오디오 편집기 오데시티, 음악 교육 도구 뮤즈클래스를 보유한다. 강력한 제품군에도 회사 차원의 통합된 브랜드가 없어 정체성이 파편화되어 있던 것이 리브랜딩의 배경이다.",
    identity: "Collins는 뮤즈 그룹을 숙달이 아닌 자연스러운 흐름을 강조하는 '크리에이티브 플루언시 컴퍼니(Creative Fluency Company)'로 재정의하고, 'Inspire the artist. Unleash their sound'를 브랜드 목적으로 제시했다. 시각 언어는 절대주의(Suprematism), 악보 표기, 음향 진동의 물리학에서 영감을 얻어 악보 조각이 글자 M으로 모이는 구성을 사용한다. 검은 배경과 오선보의 위·아래 선을 구조적 기준으로 삼고 소리에 반응해 움직이는 키네틱 타이포그래피를 적용했으며, 전용 서체 Muse Display는 네 가지 스타일로 구성된다.",
  },
  "brandarchive-aruba-conservation-foundation": {
    definition: "아루바 컨서베이션 파운데이션(ACF)은 카리브해 섬 아루바의 자연 보전을 담당하는 비영리 단체로, 기존 FPNA에서 명칭을 바꿔 2024년 새 정체성을 공개했다. 작업은 스튜디오 How&How가 맡았다.",
    overview: "아루바 컨서베이션 파운데이션(Aruba Conservation Foundation, ACF)은 카리브해 섬 아루바의 자연 보전을 담당하는 비영리 단체로, 기존의 Fundacion Parke Nacional Aruba(FPNA)에서 명칭을 바꾸어 2024년 지구의 날에 새 정체성을 공개했다. 섬 육지 면적의 약 25%를 관리하며 람사르 습지·해양 보호구역·사구 등 여러 보호구역을 책임지고, 올빼미(쇼코) 보전과 산호·맹그로브 복원, 토종 앵무새 재도입 등 생태 복원·교육 활동을 수행한다.",
    identity: "How&How는 ACF를 '자연의 목소리(Voice of Nature)'로 포지셔닝해, 관광 유치보다 지역 주민의 자연에 대한 애착과 보전 행동을 일깨우는 데 초점을 맞췄다. 로고는 파도·선인장·사람의 형상을 결합해 환경을 위한 공동 행동을 상징하며, 중심에는 섬과 주민의 회복력을 나타내는 선인장 줄기 실루엣을 두었다. 컬러 팔레트는 섬의 지형을 반영해 습지는 라일락, 황야는 레몬, 바다는 시안, 사구는 오렌지로 구성했고, 일러스트레이션은 아루바 전통 가옥 장식에서 영감을 받아 레이아웃 크기에 맞춰 '자라나도록' 설계됐다.",
  },
  "brandarchive-islington-square": {
    definition: "이즐링턴 스퀘어(Islington Square)는 런던 어퍼 스트리트 인근 옛 로열 메일 우편 분류소 부지를 재개발한 리테일·레저·다이닝 복합 단지다. 플레이스 브랜딩은 스튜디오 Campbell Hay가 맡았다.",
    overview: "이즐링턴 스퀘어(Islington Square)는 런던 어퍼 스트리트 인근 옛 로열 메일 우편 분류소 부지를 재개발한 복합 단지로, 에드워드 시대 양식의 붉은 벽돌 건물들을 보존하며 주거와 더불어 리테일·다이닝·레저·문화 공간을 결합했다. 두 개의 대형 아케이드와 가로수길 형태의 공공 공간을 갖춘 새로운 런던의 리테일 목적지로 소개된다.",
    identity: "Campbell Hay는 부지 입구의 에드워드 양식 아치 구조를 핵심 모티프로 삼아, 주택 분양 중심이던 기존 브랜드를 장소와 경험을 내세우는 목적지 브랜드로 전환했다. 아치 형태를 로고타입과 사이니지의 맞춤형 글자꼴에 녹여 2D 그래픽과 3D 애니메이션을 오가도록 설계했고, 대담한 그래픽과 색상, 표현적인 모션 디자인을 통해 행사에 따라 변주되는 가변형 비주얼 시스템을 구축했다. 'Visit·Discover·Explore' 같은 행동 유도형 언어로 버벌 아이덴티티를 구성했으며, 구체적 컬러 값과 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-tameko": {
    definition: "Tameko(타메코)는 식탁·침구·홈을 위한 패브릭을 다루는 덴마크의 홈 텍스타일 브랜드다. 브랜드 작업은 런던 스튜디오 DutchScot가 맡았다.",
    overview: "Tameko(타메코)는 식탁·침구·홈을 위한 패브릭을 다루는 덴마크의 홈 텍스타일 브랜드다. 런던 스튜디오 DutchScot가 전략·비주얼·카피라이팅·톤앤매너·인쇄·패키지·아트디렉션·디지털 채널까지 폭넓게 작업했다.",
    identity: "타자기 아트(typewriter art)에서 출발한 타이포그래피 중심 아이덴티티로, 글자들이 직물처럼 상자를 감싸고 접히고 흘러내리는 방식으로 패턴과 텍스처를 만든다. 단일 서체로 Cast 파운드리의 모노스페이스 서체 Xanti Typewriter를 사용했으며, 컬러는 모노크롬으로 운용된다. 카피라이터 Nick Asbury와 협업해 '그래픽하면서도 섬세한' 미니멀 컬렉션에 어울리는 표현을 구성했다.",
  },
  "brandarchive-tsukiyo": {
    definition: "Tsukiyo(츠키요)는 호주 시드니 달링스퀘어의 일본식 스트리트 푸드 레스토랑으로, 오사카 도톤보리의 활기찬 밤 풍경을 재현하는 콘셉트다. 브랜드는 시드니 스튜디오 The Colour Club이 맡았다.",
    overview: "Tsukiyo(츠키요)는 호주 시드니 달링스퀘어에 자리한 일본식 스트리트 푸드 레스토랑으로, 오사카 도톤보리의 활기찬 밤 풍경을 재현하는 것을 콘셉트로 한다. 'Tsukiyo'는 '달빛 비치는 밤'을 뜻하며, 타코야키 등 일본 길거리 음식을 제공한다.",
    identity: "디자인 코어는 하늘을 가로지르는 달의 움직임에서 착안한 회전형 초승달 아이콘으로, 가로형 로크업은 원형 타이포그래피 배열을 사용한다. 서체는 Grilli Type의 GT Maru Mono(둥근 터미널의 모노스페이스체)로 일본 공예 전통과 현대 도시 사이니지 감성을 결합한다. 컬러는 블루·레드·핑크를 중심으로 한 파스텔 톤이며, 오사카 도시 야경에서 차용한 블루-핑크 그라데이션 웨이브 그래픽이 달빛 반사와 도톤보리 운하 물결을 상징한다. 네온 사이니지와 타코야키용 커스텀 패키지가 도톤보리의 역동적 분위기를 확장한다.",
  },
  "brandarchive-happy-endings": {
    definition: "Happy Endings는 페이스트리 셰프 Terri Mercieca가 2014년 설립한 아이스크림 디저트 브랜드로, 아이스크림 샌드위치가 시그니처다. 2023년 리브랜드는 런던 스튜디오 Land of Plenty가 맡았다.",
    overview: "Happy Endings는 호주 출신 페이스트리 셰프 Terri Mercieca가 2014년에 설립한 아이스크림 디저트 브랜드로, 영국 런던을 기반으로 활동한다. 시그니처 제품은 아이스크림 샌드위치이며, 다채롭고 유쾌한 정체성을 특징으로 한다. 런던의 브랜딩·디자인 스튜디오 Land of Plenty가 2023년 의뢰를 받아 브랜드를 재정비하고 지속가능한 패키징 시스템을 함께 개발했다.",
    identity: "Land of Plenty는 '모든 좋은 이야기에는 해피엔딩이 있듯 모든 좋은 식사에는 맛있는 디저트가 있다'는 전제를 바탕으로, 글(written word)에서 영감을 얻은 로고 마크를 만들었다. 각 아이스크림 맛마다 고유한 캐릭터·배경 이야기·맞춤 워드마크를 부여해 다양성과 개별적 표현을 기리는 타이포그래피 중심 체계를 구성했다. 컬러는 빈티지 아이스크림 메뉴와 LGBTQIA+ 가치를 함께 참조한 무지개 그라데이션 시스템으로 계절에 따라 변하는 유연한 팔레트를 쓰며, 패키징은 식물 기반 생분해 필름 NatureFlex를 적용한 지속가능한 시스템으로 설계됐다.",
  },
  "brandarchive-wild-thingz": {
    definition: "Wild Thingz는 영국 기반의 식물성 캔디·스위트 브랜드로, 인공 첨가물 없이 설탕을 낮춘 제품을 내세운다. 기존 명칭 Just Wholefoods에서 2024년 리브랜드했으며, 작업은 스튜디오 How&How가 맡았다.",
    overview: "Wild Thingz는 영국 기반의 식물성(plant-based) 캔디·스위트(과자) 브랜드로, 인공 첨가물이 없고 설탕 함량을 기존 제품의 절반 수준으로 낮춘 제품을 내세운다. 기존 명칭은 Just Wholefoods였으며, 2024년 런던·로스앤젤레스 거점 디자인 스튜디오 How&How가 네이밍부터 웹사이트까지 리브랜딩을 수행했다. '왜 정크푸드만 재미를 독차지하는가'라는 반항적 포지셔닝이 핵심이다.",
    identity: "How&How는 건강식품 특유의 흰색·헴프 톤 클리셰를 버리고, 정크푸드의 장난스럽고 반항적인 펑크 감성을 차용한 어두운(dark) 컬러 팔레트를 적용했다. 로고는 타투의 태도에서 영감받아 가시 돋친 덩굴과 잎으로 구성했고, 모히칸 헤어를 한 파리지옥(Venus flytrap) 마스코트 'Vee'를 핵심 캐릭터로 삼았다. 타이포그래피는 헤드라인용 Konrad(펑크록 태도)와 본문용 Jokker를 사용했으며, 녹슨 쇼핑카트와 버려진 건물이 등장하는 3D 환경으로 세계관을 확장했다.",
  },
  "brandarchive-yaté": {
    definition: "Yaté는 예르바 마테를 베이스로 한 저당 클린에너지 스파클링 음료 브랜드로, 'No Bad Energy'를 태그라인으로 한다. 브랜드 작업은 스튜디오 Here For(Herefor)가 맡았다.",
    overview: "Yaté는 천연 카페인을 함유한 남미산 차인 예르바 마테(yerba mate)를 베이스로 한 저당 클린에너지 스파클링 음료로, 단순한 원료를 사용하고 경쟁 제품의 약 3분의 1 수준 칼로리를 표방한다. Here For Studio(Herefor)가 2024년 무렵 브랜드 아이덴티티·패키징 시스템·브랜드 메시징을 맡았다.",
    identity: "콘셉트는 웰니스 음료의 전형성을 피하고 나이트라이프·음악 신(scene)에서 영감을 끌어와 '사회적이고 에너지 넘치며 차별화되는' 브랜드 세계를 구축하는 것이었다. 워드마크는 Commercial Type의 Druk Wide Heavy를 사용해 클럽 포스터·음악 매체의 인상을 주고, 보조 서체로 Klim Type Foundry의 타자기풍 Pitch Sans를 썼다. 색상은 새까만 배경 위에 형광 네온 톤을 대비시키며 맛별로 오렌지·그린 등으로 구분하고, 태그라인은 'No Bad Energy'이며 적용 범위는 캔뿐 아니라 포스터·프린트 캠페인·머치·멀티팩 박스까지 확장된다.",
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
