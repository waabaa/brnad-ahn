// Batch 7: WEB-VERIFIED content for cultural-institution + consumer rebrands.
// Sourced from agency project pages + design press (Porto Rocha, North, Kontrapunkt,
// Bond, Marx Design, Omse, Mucho, Interbrand; Brand New/Creative Review/Dieline/BP&O/
// Creative Boom + institutional/financial press). Unverified colors/type not asserted.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-masp": {
    definition: "MASP(Museu de Arte de São Paulo)는 브라질 상파울루의 대표 미술관으로, Lina Bo Bardi가 설계한 브루탈리즘 건물과 유리 이젤 전시로 유명하다. 2025년 새 아이덴티티는 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "MASP는 브라질 상파울루의 대표 미술관 Museu de Arte de São Paulo Assis Chateaubriand이다. 건축가 Lina Bo Bardi가 설계한 브루탈리즘 건물로 잘 알려져 있으며, 미술관 내부의 유리 이젤(glass easel) 전시 시스템이 상징적 특징이다. 2025년 신관 개관과 함께 새 브랜드 아이덴티티가 도입됐다.",
    identity: "뉴욕 스튜디오 Porto Rocha(Leo Porto, Felipe Rocha)가 브라질 모더니즘 디자인 전통을 계승하면서 미래 지향성을 담은 시스템을 설계했다. 워드마크는 Lina Bo Bardi 건물의 브루탈리즘 양식에 맞춘 블록형·직선형으로 다듬어졌고, 확장된 캠퍼스를 상징하기 위해 두 건물(하나는 빨강, 하나는 검정)을 표현하는 그래픽 요소를 도입했다. 색상은 빨강·검정을 중심으로 하며, 전용 서체는 Formula Type의 FT Aktual MASP이다. 모션 디자인은 미술관 내부의 유리 이젤 시스템에서 영감을 받았다.",
  },
  "brandarchive-somerset-house-2025": {
    definition: "서머셋 하우스(Somerset House)는 런던 스트랜드의 신고전주의 건물로, 영국을 대표하는 예술·문화 허브다. 개관 25주년을 맞은 2025년 1월 새 아이덴티티를 런던 스튜디오 North가 선보였다.",
    overview: "서머셋 하우스(Somerset House)는 런던 스트랜드와 템스강 사이에 자리한 신고전주의 건물로, 현재는 영국을 대표하는 예술·문화 허브다. 과거 정부 청사로 쓰였고 중앙 안뜰은 주차장이었으나, 1999년부터 갤러리·창작 스튜디오·다양한 이벤트 프로그램을 갖춘 창의 공간으로 탈바꿈했다.",
    identity: "2025년 1월, 개관 25주년을 맞아 런던 디자인 스튜디오 노스(North)가 새 비주얼 아이덴티티를 선보였다. 기존 콘셉트 'Step inside, think outside'를 계승하되, 과거 안뜰을 상징하던 사각형을 글자에서 물리적으로 도려내(redact) 레터폼 안에 네거티브 스페이스로 녹여 넣은 점이 핵심으로, 글리치(glitch) 느낌의 기술적 분위기를 만든다. 워드마크와 전용 서체는 타입 디자이너 플로리안 카르스텐(Florian Karsten)과의 협업으로 제작됐으며, 메인 색상은 흑백에 건물 난간 색에서 가져온 선명한 블루를 강조색으로 더했다.",
  },
  "brandarchive-den-kongelige-samling": {
    definition: "덴 콩엘리에 삼링(The Royal Danish Collection)은 로젠보르 성과 아말리엔보르 박물관 등 여러 왕실 성·궁을 아우르는 덴마크의 대표 문화기관이다. 2024~2025년 아이덴티티는 코펜하겐 스튜디오 Kontrapunkt가 맡았다.",
    overview: "덴 콩엘리에 삼링(The Royal Danish Collection)은 덴마크의 대표적 문화기관으로, 로젠보르 성과 아말리엔보르 박물관을 비롯해 여러 왕실 성과 궁을 하나로 묶는다. 왕관 보석을 포함한 미술품과 대광간 등 수세기에 걸친 덴마크 왕실의 역사를 보존하고 전시한다.",
    identity: "Kontrapunkt가 제작한 비주얼 아이덴티티의 핵심은 방패(shield)와 왕관(crown) 두 요소로, 파비콘부터 전체 레이아웃 시스템까지 매끄럽게 확장되도록 설계됐다. 로고타입은 전통적인 합자(ligature)와 현대적 정밀함을 결합했고, 색상 팔레트는 컬렉션 소장품에서 직접 추출했다. 구체적 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-siuru-–-tartu-cultural-centre": {
    definition: "Siuru는 에스토니아 제2도시 타르투 도심에 들어서는 복합 문화센터(2029년 개관 예정)로, 이름은 에스토니아 민담의 마법의 새에서 따왔다. 브랜딩은 에이전시 Bond가 맡았다.",
    overview: "Siuru는 에스토니아 제2도시 타르투의 도심에 들어서는 복합 문화센터로, 미술관·도서관 등 여러 기능을 아우르는 다목적 문화기관이다. 명칭 'Siuru'는 에스토니아 민담에 등장하는 마법의 새에서 따왔으며 280여 개 응모작 중에서 선정되었고, 건물은 2029년 개관 예정이다.",
    identity: "핀란드·에스토니아 기반 디자인 에이전시 Bond가 브랜드 작업을 맡았고, 로고는 건물 기둥의 리듬과 모듈성, 파사드의 시각적 운율에서 영감을 받아 둥근 형태로 친근하게 다듬어졌다. 다이내믹 모듈형 워드마크는 타이포그래퍼 Aimur Takk가 타르투 인쇄박물관(TYPA)의 목제 활자 컬렉션 연구를 바탕으로 만든 Newfound Type 서체를 사용하며, 해체·재조합을 통해 새(Siuru) 모티프 등 다른 상징으로 변형될 수 있다. 브랜드는 2024년 11월 공개됐다.",
  },
  "brandarchive-phoenix-organics": {
    definition: "Phoenix Organics는 1986년 설립된 뉴질랜드의 원조 유기농 음료 브랜드다. 흩어진 제품군을 통합한 리브랜드는 뉴질랜드 스튜디오 Marx Design이 맡았다.",
    overview: "Phoenix Organics는 1986년 설립된 뉴질랜드의 원조 유기농 음료 브랜드로, 한때 사랑받던 가정용 브랜드였으나 여러 제품군과 에이전시로 분산되며 디자인 일관성과 소비자 신뢰가 약화되었다. Marx Design은 소다·주스 등 흩어진 라인을 단일 브랜드 언어 아래 재정비하는 과제를 맡았다.",
    identity: "콘셉트는 브랜드 아카이브에서 추출한 1986년 야자수 로고를 토대로, 트렌드나 노스탤지어에 기대지 않고 단순화·현대화하는 것이다. 야자수 마크는 삼각형과 곡선 잎으로 기하학적으로 평면화됐다. 타이포그래피는 'Phoenix'에 볼드한 빅토리안 포스터풍 레터프레스 서체를, 'Organics'에 미드센추리 산세리프를 사용했다. 색상은 단순함을 강조해 음료 본연의 색이 두드러지게 하고 변종별로 다른 색 조합을 적용했으며, 1990년대 '로켓' 병 형태로 전 라인을 통일하고 소다는 원형 프레임, 주스는 유기적 블롭 형태의 라벨을 썼다.",
  },
  "brandarchive-cash-flow-vodka": {
    definition: "Cashflow 보드카는 Departed Spirits가 내놓은 보드카 브랜드로, 재정난을 숨기지 않고 전면에 드러내는 솔직한 콘셉트가 특징이다. 브랜딩·패키지는 뉴질랜드 스튜디오 Marx Design이 맡았다.",
    overview: "Cashflow(캐시플로우) 보드카는 Departed Spirits가 내놓은 보드카 브랜드로, 뉴질랜드 스튜디오 Marx Design이 브랜딩과 패키지를 담당했다. 콘셉트는 재정적 어려움을 숨기지 않고 오히려 전면에 드러내, 잉여 재고로 만든 제품임을 솔직하게 내세우는 생존 전략 그 자체다.",
    identity: "로고타입은 Astrae Studio의 Therma 서체를 사용했으며, 두껍고 차가운 브루탈리즘 계열의 블록형 글자로 묘사된다. 색상은 검정·흰색에 초기 컴퓨터 모니터 인광을 연상시키는 밝은 '터미널 그린'을 핵심 강조색으로 쓴다. 흰색 라벨 위에 과장되게 큰 녹색 타이포그래피를 얹고 'Makes Dollars, Not Sense' 같은 문구로 건조한 유머를 더했으며, 영수증과 Web 1.0(저해상도·픽셀) 감성을 차용했다. 보드카의 통상적 투명 병 대신 갈색 병을 써서 카테고리의 균질함에 의도적으로 반기를 들었다.",
  },
  "brandarchive-sessions": {
    definition: "Sessions는 영국 기반의 식음료(F&B) 성장 플랫폼으로, 신생 식품 브랜드를 만들고 지원하며 영국 전역에 유통한다. 2025년 2월 공개된 리브랜드는 런던 스튜디오 Omse가 맡았다.",
    overview: "Sessions는 영국 기반의 식음료(F&B) 성장 플랫폼으로, 신생 식품 브랜드를 직접 만들고 지원하며 영국 전역에 독창적인 음식을 유통하는 사업을 한다. 런던 스튜디오 Omse가 진행해 2025년 2월 공개한 리브랜딩의 대상이다.",
    identity: "핵심 콘셉트는 '논스톱 오리지낼리티(Non-Stop Originality)'로, 상표(trademark)의 논리에서 착안한 'S' 심볼을 중심에 두어 Sessions가 만들고 협업하는 식품 브랜드들과의 연결성과 정통성을 부여한다. 강렬한 타이포그래피, 선명하고 비비드한 컬러, 'Who's hungry?' 같은 대담한 카피를 활용하며, 사진은 음식을 예상 밖의 초현실적 장면으로 연출한다(사진가 Philotheus Nisch 협업). 구체적 서체명과 컬러 코드는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-amatrice": {
    definition: "Amatrice는 호주 멜버른 크레모른에 위치한 멀티레벨 이탈리아 다이닝 공간으로, 1층 카페(Caffè Amatrice)와 상층 루프톱 레스토랑으로 구성된다. 브랜드 작업은 멜버른 스튜디오 Mucho가 맡았다.",
    overview: "Amatrice는 호주 멜버른의 이너시티 지역 크레모른(Cremorne)에 위치한 멀티레벨 이탈리아 다이닝 공간으로, 1층의 캐주얼하면서도 세련된 카페(Caffè Amatrice)와 상층부의 루프톱 레스토랑으로 구성된다. 이름은 아마트리치아나 파스타의 발상지인 이탈리아 마을 아마트리체에서 따왔으며, 인테리어는 디자이너 Brahman Perera가 밀라노에서 영감을 받아 설계했다.",
    identity: "Mucho는 타이포그래피를 정체성의 중심에 두고, 격식과 유희·전통과 현대·정제됨과 거칠음 사이의 균형을 추구하며 진부한 클리셰 없이 이탈리아 문화의 본질을 담고자 했다. 이탈리아 거리 간판에서 영감을 받은 전용 서체를 제작했고, 로고타입에서 추출한 약식 'A' 심볼로 따뜻함과 장난기를 더했다. 색상은 밀라노 지하철 타일에서 영감을 받은 카나리아 옐로, 레드 벨벳 톤, 마룬 대리석 색조를 사용해 인테리어와 조응하도록 했다.",
  },
  "brandarchive-banamax-2024": {
    definition: "Banamex(Banco Nacional de México)는 140년이 넘는 역사의 멕시코 대표 은행이다(아카이브상 'Banamax'는 표기 오류). Citi 분리·향후 IPO를 앞두고 2025년 Interbrand가 새 정체성을 도입했다.",
    overview: "Banamex(Banco Nacional de México, '멕시코 국민은행')는 140년이 넘는 역사를 가진 멕시코의 대표적 은행으로 고객 약 2천만 명을 보유한다. 2024년 12월 Citibanamex가 분리되면서 Citi 분리 및 향후 IPO를 앞두고 독립 은행으로서 새 정체성을 도입했다.",
    identity: "Interbrand가 2023년부터 1년 이상 작업해 2025년 3월 공개한 리브랜딩의 핵심은 알파벳 'b'를 닮은 다섯 요소로 구성된 상징 '로세타(roseta)'의 현대화였다(원형은 1975년 Walter Landor Associates가 제작한, 합병된 5개 기관을 상징하는 마크). 새 디자인은 더 정돈되고 대칭적인 심볼, 전용 서체, 확장된 색상 팔레트, 유연한 그래픽 시스템, 멕시코 정체성을 담은 사진 스타일을 포함하며, 기존 종소리를 다듬은 소닉 브랜딩도 더했다. 슬로건은 'Aquí. Para ti. Siempre.'(여기, 당신을 위해, 언제나)이다. 전용 서체명과 정확한 색상값은 공개 자료로 확인되지 않는다.",
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
