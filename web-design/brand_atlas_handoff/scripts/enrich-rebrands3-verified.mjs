// Batch 6: WEB-VERIFIED content for recent rebrands. Sourced from agency project
// pages + design press (Mother Design, Gretel, Made Thought, B&B Studio, Wedge,
// Midday, How&How, DixonBaxi, Otherway; Brand New/Dieline/Creative Boom/BP&O/
// It's Nice That/Creative Review). Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-adobe-2025": {
    definition: "어도비(Adobe)는 1982년 설립된 미국의 소프트웨어 기업으로 포토샵과 크리에이티브 클라우드로 잘 알려져 있다. 2025년 Mother Design과 사내팀이 글로벌 브랜드 아이덴티티를 정비했다.",
    overview: "어도비(Adobe)는 1982년 설립된 미국의 소프트웨어 기업으로, 포토샵(Photoshop)을 비롯한 크리에이티브 제작 도구와 구독형 소프트웨어 묶음인 크리에이티브 클라우드(Creative Cloud)로 잘 알려져 있다. 디자인·사진·영상·문서 등 광범위한 디지털 창작 영역에서 쓰이는 제품군을 보유하고 있다.",
    identity: "2025년 어도비는 머더 디자인(Mother Design)과 사내 디자인팀이 협업해 글로벌 브랜드 아이덴티티 시스템을 정비했으며, 이는 전면 교체보다 기존 자산을 다듬어 통합한 리프레시에 가깝다. 핵심은 1982년 마바 워녹(Marva Warnock)이 만든 원형 'A'에서 출발해 아이콘과 워드마크를 하나로 통합한 새 로고타입으로, 기존의 네거티브 스페이스 'A'를 포지티브 스페이스 방식으로 전환했다. 색상은 블랙·화이트와 한층 선명해진 '어도비 레드'로 단순화했고, 이미지를 담아 강조하는 붉은 프레임 요소 '어도비 렌즈(Adobe Lens)'를 새로 도입했다. 전용 서체는 어도비 타입팀과 MCKL Type이 함께 개발한 Adobe Clean Display로 보도된다.",
  },
  "brandarchive-hart-bageri": {
    definition: "하트 바게리(Hart Bageri)는 2018년 코펜하겐에서 제빵사 리처드 하트가 노마의 르네 레드제피와 파트너십으로 설립한 베이커리다. 매장 확장에 맞춘 비주얼 정비는 스튜디오 Gretel이 맡았다.",
    overview: "하트 바게리(Hart Bageri)는 2018년 코펜하겐 프레데릭스베르에서 제빵사 리처드 하트(Richard Hart)가 노마의 르네 레드제피(René Redzepi)와 파트너십으로 설립한 베이커리다. 단일 매장으로 출발해 10개 이상의 매장과 제품 라인으로 확장했으며, 장인정신에 대한 몰입을 핵심 가치로 삼는다.",
    identity: "Gretel은 2018년 원래 브랜딩을 만든 뒤 매장 확장에 맞춰 비주얼 시스템을 재정비했다. 단일 로고 대신 적용처마다 달라지는 손그림 워드마크를 두고, 리처드 하트의 문신에서 가져온 손(hand) 심볼을 메이커스 마크로 고정 앵커 삼는다. 초기의 흑백 팔레트는 딥블루(네이비)와 크림을 중심으로 한 유기적 색조로 확장됐으며, 서체는 견고한 Basel Grotesk를 기반으로 한다. 일러스트레이터 브라울리오 아마도(Bráulio Amado)와 협업해 따뜻함과 위트를 더한 그래픽·타이포 언어를 구축했다.",
  },
  "brandarchive-sarah-&-sebastian": {
    definition: "Sarah & Sebastian은 2012년 호주 시드니에서 설립된 파인 주얼리 스튜디오로, 책임 있게 조달한 귀금속과 보석으로 수공 제작한다. 새 비주얼 표현은 스튜디오 Made Thought가 협업했다.",
    overview: "Sarah & Sebastian은 2012년 Sarah Gittoes와 Robert Sebastian Grynkofski가 설립한 호주의 파인 주얼리 스튜디오로, 시드니에서 디자인하고 책임 있게 조달한 귀금속·다이아몬드·보석으로 수공 제작하는 것으로 알려져 있다. 호주의 자연과 유럽 디자인 감성의 교차점에서 출발해 절제된 럭셔리와 전위적 혁신을 결합한 미니멀하고 컨템포러리한 미학을 추구한다.",
    identity: "Made Thought는 창업자들과 협업 파트너로서 브랜드의 새로운 비주얼 표현을 지원하고 'New Natural Icons Forged by Nature'라는 크리에이티브 포지셔닝을 정립했으며, 이를 통해 파인 주얼리 혁신가라는 정체성을 독자적 서사와 한층 격상된 에지를 갖춘 현대적 브랜드로 옮겨 놓았다. 작업 범위에는 패키징, 리테일 적용, 자연·원소 이미지를 활용한 포토그래피 디렉션과 애셋 시스템이 포함됐다. 구체적 로고 형태와 서체·컬러 팔레트는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-sauce-shop": {
    definition: "Sauce Shop은 2014년 영국 노팅엄에서 부부가 창업한 소스·조미료 챌린저 브랜드로, 시장 좌판에서 출발해 대형 식료품 매대까지 진출했다. 2025년 리프레시는 B&B Studio가 맡았다.",
    overview: "Sauce Shop은 2014년 Pam·James Digva 부부가 창업한 영국 노팅엄 기반 소스·조미료 브랜드로, West Bridgford 농산물 시장 좌판에서 출발해 대형 식료품 체인 매대까지 진출한 챌린저 브랜드다. 핫소스·BBQ 소스·케첩 등 다양한 제품을 노팅엄 자체 공장에서 생산한다.",
    identity: "2025년 5월 도입된 B&B Studio의 작업은 전면 재창조가 아닌 '존중하는 리프레시(respectful refresh)'로, 창업자들이 만든 기존 디자인의 본질과 엣지를 유지하면서 강화하는 방향으로 진행됐다. 로고는 아주 미세하게 다듬었고, 제품별 고유 식별 컬러를 부여한 대담한 컬러 팔레트와 컬러 코딩 라벨, 더 명확한 제품 설명·테이스팅 노트를 도입해 매대 내 탐색성을 높였다. 품질감을 강조하는 매트 라벨과, 브랜드 본래의 수공예적 감성에서 착안한 손그림 아이콘·일러스트 세트를 새로 제작했다.",
  },
  "brandarchive-diana's-seafood": {
    definition: "다이애나스 시푸드(Diana's Seafood)는 1979년부터 영업해 온 캐나다 토론토 스카버러의 가족 경영 수산물 판매점으로, 미슐랭 주방부터 가정 식탁까지 공급한다. 리브랜드는 몬트리올 스튜디오 Wedge가 맡았다.",
    overview: "다이애나스 시푸드(Diana's Seafood)는 캐나다 토론토 스카버러에 자리한 가족 경영 수산물 판매점이자 어물전으로, 1979년부터 영업해왔다. 1970년대 도매 유통으로 시작해 1980년대 일반 소비자에게 개방됐으며, 토론토 정상급 레스토랑에 납품하고 30종 이상의 굴을 비롯한 전 세계 수산물을 취급한다.",
    identity: "몬트리올 스튜디오 Wedge는 창업자가 어머니였다는 점에 착안해 'The Mother of Seafood'를 핵심 콘셉트로 삼아 신뢰·자양·보살핌의 정체성을 구축했다. 심볼은 물고기 두 마리가 어우러져 은은하게 D와 S를 이루는 모노그램이며, 워드마크는 항구에 정박한 어선에 칠해진 이름에서 영감을 받아 멀리서도 보이도록 설계한 선명한 블루를 핵심 색으로 쓴다. 타이포그래피는 Vocal Type의 Martin(S 끝에 지느러미 형태를 가미해 커스텀)을 로고타입에, Alex Lescieux의 가변 서체 Milano를 본문에 활용하며, Lobster Orange·Salmon Pink 등 해산물에서 따온 색을 더한다.",
  },
  "brandarchive-eat-real": {
    definition: "Eat Real은 콩류·퀴노아·채소를 원료로 한 영국 기반의 건강 지향 스낵 브랜드다. 2024~2025년 브랜드 리프레시는 스튜디오 Midday가 맡았다.",
    overview: "Eat Real은 감자 대신 콩류(후무스·렌틸·병아리콩)·퀴노아·채소를 원료로 만든 영국 기반의 건강 지향 스낵 브랜드로, 후무스·퀴노아·렌틸·베지 네 가지 베이스에 여러 맛 변형으로 구성된다. 디자인 스튜디오 Midday가 브랜드 리프레시를 진행했다.",
    identity: "Midday의 리브랜딩은 '건강' 소구에서 '맛·즐거움' 중심으로 포지셔닝을 전환한 것이 핵심으로, 'Love Food? Eat Real'이라는 슬로건과 요리책에서 영감을 받은 비주얼을 채택했다. 로고는 기존의 낡은 타원형 홀딩 셰이프를 메시지용 라운델로 발전시키고, 워드마크를 보다 유기적으로 다듬어 잎(leaf) 모티프로 마무리했다. 컬러는 음식 중심의 선명하고 식욕을 돋우는 팔레트를, 사진은 갓 수확한 듯한 채소·과일 이미지를 사용했으며, 톤은 영양사 권고가 아닌 레스토랑 메뉴처럼 들리도록 설계됐다.",
  },
  "brandarchive-jupi": {
    definition: "Jupi는 360 Learning 창업자 Nick Hernandez가 선보인 신생 벤처로, 성장 기업을 위한 AI 기반 의사결정 운영체제다. 아이덴티티는 스튜디오 How&How가 맡았다.",
    overview: "Jupi는 360 Learning 창업자 Nick Hernandez가 선보인 신생 벤처로, 성장 기업을 위한 AI 기반 의사결정 운영체제(operating system)다. 사용자의 습관·행동·조직 문화를 학습해 예산 배분부터 조직 설계까지 경영 의사결정을 보조하는 것을 표방하는 B2B 경영 기술 제품이다.",
    identity: "How&How는 '초현실적 단순함(surreal simplicity)'을 콘셉트로 작업했다. 로고는 로댕의 '생각하는 사람'을 일어서서 걸음을 내딛는 형상으로 재해석한 마크로, 머리와 다리를 결합해 사고에서 행동·전진으로 이어지는 지능을 표현한다. 비주얼은 마그리트풍 초현실 일러스트레이션을 중심으로 리더십의 균형·정렬·복잡성을 은유적으로 표현하며 모션 그래픽으로 생동감을 더한다. 타이포그래피는 진지하되 딱딱하지 않은 맞춤형 세리프 계열이며, 색상은 명료함을 위해 절제한 미니멀 팔레트로 확인된다.",
  },
  "brandarchive-delta": {
    definition: "여기서 다루는 Delta는 미국 항공사 Delta Air Lines로, DixonBaxi가 창립 100주년(2025)에 맞춰 2008년 이후 처음으로 핵심 아이덴티티를 리프레시했다. '라이프스타일 항공사'로의 포지셔닝 전환이 목표다.",
    overview: "Delta Air Lines는 미국을 대표하는 대형 항공사 중 하나로, DixonBaxi가 창립 100주년(2025)에 맞춰 2008년 이후 처음으로 핵심 브랜드 아이덴티티를 리프레시했다. 단순한 디자인 갱신이 아니라 '라이프스타일 항공사'로의 포지셔닝 전환을 목표로 한 작업이다.",
    identity: "콘셉트는 단순 진화가 아니라 사고방식의 전환(mindset shift)으로 설명되며, 'Keep Climbing' 정신에 기반한 모션 거동을 핵심으로 삼는다. 로고는 기존 삼각형 위젯(widget) 형태를 보존하되 모션·깊이·빛을 더해 정적 심볼에서 역동적 힘으로 확장했다. 색상은 전통적인 적·청을 넘어 스카이 블루·민트 그린·네온 핑크 등 감성적 색조로 팔레트를 확장했고, 타이포그래피는 기존 코어 서체를 유지하면서 Pangram Pangram과 협업해 디스플레이용 전용 서체 두 종(Delta Sans, Delta Serif)을 신규 제작했다.",
  },
  "brandarchive-fhirst": {
    definition: "Fhirst는 벨기에 창업자들이 선보인 프로바이오틱 음료로, 장 건강과 정신적 웰빙의 연결을 내세운 식음료(soda) 제품이다. 아이덴티티는 Mother Design이 맡았다.",
    overview: "Fhirst는 벨기에 창업자 Catherine·Steven Van Middelem이 선보인 프로바이오틱 음료로, 장 건강과 정신적 웰빙의 연결을 내세운 식음료(soda) 부문 제품이다. 스스로를 'Superfunktional Soda'로 규정하며, 라이브 균주를 장기간 보존하는 마이크로캡슐화 기술을 핵심으로 한다.",
    identity: "Mother Design은 전통적 대형 탄산음료 비주얼과 건강식품 미학을 충돌시키는 맥시멀리즘 콘셉트를 제시하며, 웰니스 미니멀리즘 대신 향수 어린 타이포그래피와 거리낌 없는 유희성을 채택했다. 워드마크는 오스트리아 디자이너 Othmar Motter의 1999년 Motter Regatta 서체에서 영감을 받아 글자마다 미세하게 다른 리듬과 그라데이션을 적용했고, 보조 서체로 90년대 건강식품 매장 간판을 연상시키는 폰트들을 사용했다. 컬러는 고대비 그라데이션을 중심으로 'Fhirst cyan'과 'Fhirst purple'을 기본색으로 삼고 맛별로 별도 컬러 유니버스를 부여했으며, 독수리·나비·돌고래·말 등 동물 일러스트를 핵심 그래픽 요소로 쓴다.",
  },
  "brandarchive-natural-innovations": {
    definition: "Natural Innovations는 영국 기반 B2B 식품 회사로, 식물 중심 원료와 즉시 사용 가능한 메뉴 솔루션을 외식·식품 제조 업체에 공급한다. 기존 사명 Freshcut Foods에서 개명했으며 리브랜드는 Otherway가 맡았다.",
    overview: "Natural Innovations는 영국 기반 B2B 식품 회사로, 식물 중심(plant-led) 원료와 즉시 사용 가능한 메뉴 솔루션을 외식·식품 제조·밀키트 업체에 공급한다. 기존 사명은 Freshcut Foods였으며, 신선 농산물 공급사에서 출발해 풍미 개발 중심의 식품 혁신 파트너로 사업을 확장하면서 리브랜딩과 함께 사명을 변경했다.",
    identity: "Otherway는 '자연과 기술의 연결'을 핵심 콘셉트로 삼아, 자연적 성장과 미래 지향을 상징하는 다이내믹한 브랜드 마크를 중심에 두었다. 활기차고 모듈식 디자인 시스템과 에너지·명료함을 주는 현대적 컬러 팔레트를 적용했고, 사진은 농산물의 생생함을 진하고 채도 높은 톤으로, 공장 이미지는 공정의 정밀함과 장인성을 담아 두 갈래로 전개했다. 구체적 서체명과 색상 코드, 로고의 세부 형태는 공개 자료로 확인되지 않는다.",
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
