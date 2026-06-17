// Batch 11: WEB-VERIFIED content. Agency pages + design press (jkr, Red Antler,
// Koto, Robot Food, Landor, Gander, Center, Velvele, Odds Studio, Cotton; Brand
// New/Creative Review/Dieline/BP&O/Creative Boom/Fonts In Use/It's Nice That).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-mozilla-2024": {
    definition: "모질라(Mozilla)는 인터넷을 자유롭고 개방적으로 유지하는 것을 사명으로 하는 비영리 중심 기술 조직으로, 오픈소스 브라우저 파이어폭스로 잘 알려져 있다. 2024년 리브랜딩은 jkr이 맡았다.",
    overview: "모질라(Mozilla)는 인터넷을 자유롭고 개방적이며 누구나 접근 가능하게 유지하는 것을 사명으로 25년 넘게 활동해 온 비영리 중심의 기술 조직이다. 가장 널리 알려진 제품은 오픈소스 웹 브라우저 파이어폭스(Firefox)이며, 최근에는 AI 등 새로운 제품 영역으로 활동을 넓히고 있다.",
    identity: "2024년 모질라는 디자인 스튜디오 jkr(Jones Knowles Ritchie)과 협업해 'Reclaim the Internet(인터넷을 되찾자)'을 핵심 개념으로 하는 새 브랜드 아이덴티티를 공개했다. 새 심벌은 알파벳 'M'을 깃발(flag) 형태로 구성한 것으로, 픽셀 하나를 어긋나게 배치해 셰퍼드 페어리가 디자인한 상징적 티렉스(T-rex) 마스코트를 암시하며 애니메이션으로 움직인다. 워드마크에는 세미 슬랩 계열 전용 서체가 쓰였고, 전용 서체군은 Mozilla Semi-Slab·Mozilla Sans·Mozilla Sans Text로 구성된다. 색상은 흑백을 기반으로 RGB 계열의 녹색을 강조색으로 쓴다.",
  },
  "brandarchive-fuku": {
    definition: "Fuku는 셰프 데이비드 창의 Momofuku에서 비밀 메뉴로 시작된 매운 프라이드 치킨 샌드위치가 인기를 끌며 2015년 독립 출범한 패스트캐주얼 브랜드다. 리브랜드는 스튜디오 Red Antler가 맡았다.",
    overview: "Fuku는 셰프 데이비드 창의 Momofuku 누들바에서 비밀 메뉴로 시작된 매운 프라이드 치킨 샌드위치('산도')가 인기를 끌면서 2015년 독립 매장으로 출범한 패스트캐주얼 브랜드다. 군더더기 없는 좋은 음식을 표방하며 뉴욕 다운타운 특유의 직설적인 에너지를 정체성의 기반으로 삼고, 이후 여러 도시와 경기장 매대 등으로 확장됐다.",
    identity: "Red Antler가 약 10주년에 맞춰 브랜드 전략·아이덴티티·비주얼 디자인·아트디렉션·패키징·리테일 콘셉트 전반을 맡아 리브랜딩을 수행했다. 로고는 빵 사이에 치킨을 끼운 직설적인 형상으로 군더더기 없는 자신감을 표현하며, 워드마크는 다운타운 맨해튼 차양 간판 서체에서 착안한 Akzidenz-Grotesk BQ Condensed를 쓴다. 보조 서체로 Pangram Pangram의 PP Neue Montreal과 PP Right Serif를 함께 운용하고, 다운타운 간판과 플래시 촬영의 야간 분위기를 차용했으며 핵심 슬로건은 'Take it or Take it'이다.",
  },
  "brandarchive-mssivemusic": {
    definition: "매시브뮤직(MassiveMusic)은 암스테르담에 본사를 둔 글로벌 음악·소닉브랜딩 에이전시로, 2021년 음악 플랫폼 Songtradr에 인수됐다. 2024~2025년 리브랜드는 Koto가 맡았다.",
    overview: "매시브뮤직(MassiveMusic)은 암스테르담에 본사를 둔 글로벌 음악·소닉브랜딩 에이전시로, 베를린·런던·뉴욕·로스앤젤레스·도쿄 등에 사무소를 두고 브랜드를 위한 음악 제작과 소닉 아이덴티티 전략을 제공한다. 2021년 B2B 음악 플랫폼 송트레이더(Songtradr)에 인수되었으며, 나이키·하이네켄·UEFA 등을 고객으로 둔다.",
    identity: "코토(Koto)가 작업한 리브랜드는 'New Dimensions in Sound'를 전략 플랫폼으로 삼아 흩어져 있던 사업 부문을 하나의 서사로 묶었다. 비대칭 특성을 유지하되 선을 더 날카롭게 다듬은 로고·워드마크, 모노크롬을 기조로 시그니처 오렌지를 절제해 쓰는 색 팔레트, 소리의 강약을 표현하도록 quiet·medium·loud 세 모드로 운용되는 Forma DJR Display 서체가 핵심이다. 시스템 중심에는 소름·동공 확장 같은 음악에 대한 생리적 반응에서 착안한 제너러티브 패턴 언어가 자리하며, 그라데이션과 모션이 주파수처럼 박동하도록 설계됐다.",
  },
  "brandarchive-hip-pop": {
    definition: "Hip Pop은 2019년 영국 맨체스터에서 설립된 콤부차·대체 탄산음료 브랜드로, 장 건강 영역에서 알려졌다. 2025년경 리브랜드는 리즈 스튜디오 Robot Food가 맡았다.",
    overview: "Hip Pop(힙팝)은 2019년 영국 맨체스터에서 설립된 음료 브랜드로, 콤부차와 대체 탄산음료(소다)를 만들며 장 건강(gut health) 영역에서 알려졌다. 천연 재료와 대담한 맛 조합을 내세우며, 인디 크래프트 생산자에서 주류 탄산음료에 맞서는 브랜드로 도약하고자 리즈 소재 디자인 스튜디오 Robot Food와 협업해 리브랜딩을 진행했다.",
    identity: "핵심 콘셉트와 슬로건은 'Get real'로, 솔직함을 무기로 대형 탄산음료에 맞서는 태도를 담았다. 워드마크는 기존 로고의 '스코비(scoby)' 형태 'O'를 키우고 더 굵고 강렬하게 다듬은 진화형이며, 패키지에서는 'Hip Pop'을 두 줄로 배치하고 과일 이미지가 캔에서 터져 나오는 듯한 구성을 사용한다. 컬러는 업계의 흐릿한 파스텔 관행에서 벗어나 일관된 블랙을 기반으로, 소다에는 강렬하게 충돌하는 색, 콤부차에는 크림색을 적용하며 캔은 라벨 대신 전면 스크린 인쇄 방식을 쓴다.",
  },
  "brandarchive-west-loop": {
    definition: "West Loop은 미국 시카고의 동네로, 옛 정육·공업 지구에서 인기 지역으로 변모한 곳이다. 비영리단체 West Loop Community Organization 의뢰로 Landor가 2024년 플레이스 브랜딩을 진행했다.",
    overview: "West Loop은 미국 시카고의 한 동네로, 옛 정육·공업 지구에서 레스토랑과 신규 주민이 몰리는 인기 지역으로 변모한 곳이다. 의뢰 주체는 1991년 설립된 비영리단체 West Loop Community Organization(WLCO)이며, Landor가 2024년 이 동네의 플레이스 브랜딩을 새로 설계했다. 인접한 시카고 도심 'the Loop'과 구별되면서 지역 공동체를 대변하는 것이 핵심 과제였다.",
    identity: "콘셉트는 'Into the Loop'로, 동네의 과거·현재·사람을 모티프로 삼아 모두가 공유할 수 있는 장치를 지향한다. 핵심 그래픽은 이름을 반영한 '루프(고리)' 또는 연속된 루프들로, 모션 기반의 가변적·상호작용형 시스템이며 주민이 각자의 루프 로고를 만들 수 있게 했다. 컬러는 시카고 정육·공업 지구 유산(지하철 노선 색, 옛 벽돌·새 벽돌, 주철 건물 등)에서 끌어온 선명한 팔레트를 사용했고, 타이포그래피는 산업 유산에서 영감을 받은 커스텀 디스플레이 서체다.",
  },
  "brandarchive-yellowbird": {
    definition: "옐로버드(Yellowbird)는 2012년 미국 텍사스주 오스틴에서 시작된 핫소스 브랜드로, 일상적으로 즐기기 좋은 접근 가능한 매움을 내세운다. 리브랜드는 스튜디오 Gander가 맡았다.",
    overview: "옐로버드(Yellowbird)는 미국 텍사스주 오스틴에서 시작된 핫소스 브랜드로, 2012년 창업자 조지 밀턴과 에린 링크가 만들었다. 극단적인 매운맛보다 단순하지만 개성 있는 재료 구성과 일상적으로 즐기기 좋은 접근 가능한 매움 정도를 내세우며, 파머스 마켓 판매에서 전국 유통으로 성장했다.",
    identity: "갠더(Gander)는 '단순화하여 증폭한다(simplify to amplify)'는 전략 아래 새 브랜드 아이덴티티·패키지·웹을 작업하고, 대량 생산과 수제 사이의 '골디락스' 포지션으로 자리매김했다. 모든 병에 따뜻하고 채도 높은 단일 옐로를 기본으로 쓰되 변형 제품마다 색이 다른 소형 서브 라벨을 부여했다(아가베 스리라차는 핫핑크, 스트로베리 진저는 딸기 레드, 플럼 리퍼는 퍼플). 기존의 단정하던 새 마스코트를 뾰족한 깃털 패턴의 발랄하고 당돌한 캐릭터로 재해석해 브랜드의 중심 요소로 삼았다. 구체적 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-ayoh": {
    definition: "Ayoh!는 요리책 저자 몰리 배즈(Molly Baz)가 2024년 선보인 마요네즈 중심의 소스 브랜드다. 브랜드 작업은 뉴욕 스튜디오 CENTER가 맡았다.",
    overview: "Ayoh!는 베스트셀러 요리책 저자이자 샌드위치 애호가인 몰리 배즈(Molly Baz)가 공동창업자 데이비드 매코믹과 함께 2024년 선보인 마요네즈 중심의 소스 브랜드다. 오리지널 마요, 딜 피클 마요, 탱기 디종, 핫 지아르디네라 등 여러 맛으로 출시됐으며, 누구나 손쉽게 맛있는 샌드위치를 만들 수 있게 한다는 콘셉트를 내세운다.",
    identity: "뉴욕 스튜디오 CENTER가 크리에이티브 전략·브랜드 디자인·패키지·톤 앤 보이스를 맡았으며, 미국 전역의 다이너·델리·샌드위치 가게 간판과 메뉴보드에서 영감을 받은 디자인 시스템을 구축했다. 핵심 워드마크는 디자이너 Alec Tear와 협업한 커스텀 레터링으로, 마요로 쓴 듯한 글자와 'o'의 미세한 흘러내림(drip)이 특징이다. 보조 서체는 Dinamo의 ABC Rom과 1936년 Kaufmann 스크립트를 조합했고, 컬러 팔레트는 고전 다이너의 포마이카 표면을 오마주한 오렌지·그린·블루·옐로의 선명한 색조로 기존 마요 카테고리의 베이지/크림 톤을 의도적으로 탈피했다. 'Sando Sam' 마스코트와 펜·잉크 일러스트가 정체성을 보완한다.",
  },
  "brandarchive-razz-burger": {
    definition: "Razz(라즈 버거)는 튀르키예 이즈미르의 스매시 버거 매장으로, 손님이 직접 재료를 골라 버거를 완성하는 DIY 콘셉트가 핵심이다. 2024년 브랜드 작업은 밀라노 스튜디오 Velvele이 맡았다.",
    overview: "Razz(라즈 버거)는 튀르키예 이즈미르(İzmir)에 위치한 스매시 버거 매장으로, 손님이 직접 재료를 골라 자기만의 버거를 완성하는 DIY 콘셉트를 핵심으로 한다. 메뉴 자체를 선호 항목을 체크하는 양식(form) 형태로 설계해 모든 주문이 개인 맞춤 창작이 되도록 했으며, 2024년 밀라노 기반 스튜디오 Velvele이 네이밍·슬로건·패키징·비주얼 아이덴티티·브랜드 전략 전반을 담당했다.",
    identity: "크리에이티브 디렉터 Çağıl Aygen이 주도한 아이덴티티는 거리 그래피티에서 영감을 받은 커스텀 로고타입을 중심으로 한다. 두껍고 불완전한 소문자 레터폼이 DIY의 개성을 표현하며, 보조 서체로 TT Rounds Neue Compressed가 사용되었다. 핵심 컬러는 켈리 그린(Kelly Green)으로 메뉴·패키징·전반 브랜딩에 일관되게 적용되어 거리 문화와 DIY의 에너지를 담아내며, 적용 범위는 패키징·접시·스티커·유니폼·소셜미디어 자산·브랜드 가이드라인으로 확장됐다.",
  },
  "brandarchive-lolo": {
    definition: "Lolo는 스페인 살라망카에 기반을 둔 가족 경영 이베리코 하몽(생햄) 브랜드다. 가업 승계에 맞춘 리브랜드는 프랑스 스튜디오 Odds Studio가 맡았다.",
    overview: "Lolo는 스페인 살라망카(Salamanca)에 기반을 둔 가족 경영 이베리코 하몽(스페인 생햄) 브랜드로, 식음료(육가공) 분야에 속한다. 최근 가업이 형제 파블로와 발렌틴에게 승계되었고, 더 넓은 소비자층에 다가가기 위해 프랑스 기반 디자인 스튜디오 Odds Studio에 리브랜딩을 맡겼다.",
    identity: "콘셉트는 형제의 가족사와 스페인 문화에 대한 깊은 연결을 바탕으로, 옛 부티크 간판에서 영감을 받아 전통의 진정성을 현대적으로 풀어내는 것이다. 로고와 스탬프는 진중하기 쉬운 고급 식품 카테고리와 달리 더 장난스럽고 친근하게 다듬었고, 전통 정육 도해 대신 동물에 대한 존중을 담은 표현적인 돼지 일러스트를 새로 그렸다. 컬러는 살라망카 풍경에서 영감을 얻은 따뜻하고 자연스러운 톤으로 업계 표준인 흑백을 대체했으며, 타이포그래피는 Dum Dum Studio가 디자인한 Serial 서체를 사용하고 전통 타파스 바의 세라믹 타일과 아치형 창에서 따온 컷아웃 요소를 적용했다.",
  },
  "brandarchive-eternal-research": {
    definition: "Eternal Research는 아티스트 겸 엔지니어 알렉산드라 피에라가 로스앤젤레스에서 설립한 음악 기술 브랜드로, 전자기장을 소리로 변환하는 아날로그 악기 '데몬 박스'로 알려져 있다. 아이덴티티는 스튜디오 Cotton이 맡았다.",
    overview: "Eternal Research는 아티스트 겸 엔지니어 알렉산드라 피에라(Alexandra Fierra)가 미국 로스앤젤레스에서 설립한 음악 기술(music-tech) 브랜드다. 대표 제품은 데몬 박스(Demon Box)로, 전자기기의 전자기장을 감지해 소리로 변환하는 아날로그 악기다.",
    identity: "Cotton이 만든 시스템은 빅토리아풍 장식과 제너러티브 코드를 결합한 레트로-퓨처리즘 콘셉트로, 정밀함과 실험성의 균형을 지향한다. 로고는 MCKL의 인그레이빙(engraved) 산세리프 서체 Trust를 커스텀한 워드마크로 수공 조각의 미세한 불규칙성을 살렸다. 헤드라인에는 TT Globs·P22 Clementine·New Spirit Condensed 등 11종의 다양한 서체를 의도적으로 혼용했으며('cabinet of curiosities'), 핵심은 수백 점의 빅토리아 아카이브 문양을 연구해 만든, 소리에 실시간 반응하는 무한 생성형 장식 패턴이다. 색상 팔레트는 공개 자료로 확인되지 않는다.",
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
