// Batch 12: WEB-VERIFIED content. Agency pages + design press (Wolff Olins, Leo
// Burnett, Gretel, Wedge, Red Antler, Gander, Werklig, Blurr Bureau, Bold; Brand
// New/Creative Review/Creative Boom/BP&O/Transform/D&AD/It's Nice That).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-lloyds": {
    definition: "로이즈(Lloyds)는 검은 말 심볼로 잘 알려진 영국의 대형 소매은행으로, 로이즈 뱅킹 그룹에 속한다. 2024~2025년 정체성 리뉴얼은 Wolff Olins가, 캠페인은 adam&eveDDB가 맡았다.",
    overview: "로이즈(Lloyds)는 검은 말 심볼로 잘 알려진 영국의 대형 소매은행으로, 로이즈 뱅킹 그룹(Lloyds Banking Group)에 속한다. 검은 말은 오랜 기간 이어져 온 브랜드 상징이며, 2024~2025년 브랜드 디자인 에이전시 Wolff Olins가 정체성 리뉴얼을 맡고 광고 캠페인은 adam&eveDDB가 함께했다.",
    identity: "새 포지셔닝은 'Lloyds moves everyone forward'로, 누구에게나 다음 단계가 있다는 통찰에서 출발했다. 검은 말 칸카라(Cancara)는 말의 해부학 전문가 자문을 거쳐 머리가 몸과 같은 방향을 향하도록 다듬어졌고, 캔터·갤럽 등 실제 말의 움직임에서 착안한 모션을 통해 더 동적이고 상호작용적인 요소로 발전했다. 서체는 GT Ultra를 커스터마이즈한 것으로 20세기 초 영국 서체에서 영감을 받았으며, 색상은 로이즈 고유의 그린을 재해석해 영국 풍경의 녹음을 연상시키는 보완 팔레트로 확장했다.",
  },
  "brandarchive-new-york-botanical-garden": {
    definition: "뉴욕 식물원(NYBG)은 1891년 설립된 뉴욕시 브롱크스의 약 250에이커 식물원으로, 식물 연구·보호 기관이자 관람 공간이다. 2024년 약 10년 만의 대규모 브랜드 리프레시는 Wolff Olins가 맡았다.",
    overview: "뉴욕 식물원(New York Botanical Garden, NYBG)은 1891년 설립되어 뉴욕시 브롱크스의 약 250에이커 부지에 자리한 식물원으로, 식물을 연구하고 보호하는 기관이자 방문객이 자연을 배우고 즐기는 공간이다. 132년 역사를 지닌 이 기관은 2024년 글로벌 브랜드 컨설팅사 Wolff Olins와 협업해 약 10년 만에 대규모 브랜드 리프레시를 단행했다.",
    identity: "새 아이덴티티의 핵심 개념은 'Do right by nature'로, 자연을 연구하고 보호하며 배우고 즐긴다는 의미를 담는다. 더 짧고 굵은 'NYBG' 약자를 중심으로 한 손그림(hand-drawn) 로고를 도입했으며, 자연에서 발견되는 형태와 뉴욕 및 브롱크스의 대담한 태도를 결합한 디자인을 지향한다. 컬러 팔레트는 식물원의 식물·나무·균류·조류와 부지를 흐르는 브롱크스강, 뉴욕의 상징적 기관들에서 영감을 받아 유연한 조합이 가능하도록 설계됐다.",
  },
  "brandarchive-royal-ontario-museum": {
    definition: "로열 온타리오 박물관(ROM)은 토론토에 위치한 캐나다 최대 규모의 예술·문화·자연사 박물관으로 약 1,300만 점의 소장품을 보유한다. 2024년 리브랜딩은 Leo Burnett Design이 맡았다.",
    overview: "로열 온타리오 박물관(ROM)은 토론토에 위치한 캐나다 최대 규모의 예술·문화·자연사 박물관으로, 약 1,300만 점의 소장품과 표본을 보유하고 있다. 미술품·조각·직물부터 화석과 자연사 표본까지 폭넓은 컬렉션을 아우르며 캐나다를 대표하는 문화 기관으로 꼽힌다.",
    identity: "Leo Burnett Design이 진행한 리브랜딩은 1,300만 점의 소장품을 시간 속의 순간들이 이어진 '불멸의 타임라인(immortal timeline)'으로 해석한 콘셉트를 핵심으로 한다. 새 워드마크와 함께 Colophon과 협업해 개발한 전용 서체 'ROM Coign'을 도입했는데, 7개 굵기와 4개 너비를 갖춘 초압축형 서체로 확대·축소되며 개별 유물의 순간으로 들어갔다 전체 규모로 물러나는 감각을 표현하도록 설계됐다. 매우 굵은 산세리프 모노그램을 중심에 두고 사이니지·웨이파인딩·사진·인쇄물 전반에 적용되는 가변형 시스템으로 확장됐다.",
  },
  "brandarchive-new-york-city-fc": {
    definition: "뉴욕 시티 FC(NYCFC)는 미국 MLS의 뉴욕 연고 축구 구단으로, 2013년 창단해 2015시즌부터 참가했다. 시티 풋볼 그룹이 모회사이며, 2024~2025년 크레스트 갱신은 스튜디오 Gretel이 맡았다.",
    overview: "뉴욕 시티 FC(NYCFC)는 미국 프로축구 리그 메이저 리그 사커(MLS)에 속한 뉴욕 연고 구단으로, 2013년 창단해 2015시즌부터 리그에 참가했다. 잉글랜드 맨체스터 시티 등을 보유한 다국적 축구 그룹 시티 풋볼 그룹(City Football Group)이 모회사다.",
    identity: "뉴욕 기반 스튜디오 Gretel이 진행한 작업은 기존 지하철 토큰 모티프 크레스트를 계승하면서 작은 크기에서의 가독성을 높이고 비례를 다듬은 갱신을 핵심으로 한다. 중앙의 NYC 모노그램은 더 굵고 균형 잡힌 형태로 정제되었고, 배지 양옆의 오각형(펜타곤)은 뉴욕의 5개 자치구를 상징하며 'Five Borough Bond'가 콘셉트 축으로 제시되었다. Frere-Jones Type이 통합 이전 뉴욕 지하철 사인 레터링에서 영감을 받아 Local·Express 두 전용 서체를 제작했고, 도시 지형에서 도출한 모자이크 그래픽 시스템이 더해졌으며 색상은 기존 스카이 블루와 네이비의 대비를 강화했다.",
  },
  "brandarchive-ami-ami": {
    definition: "AMI AMI는 미국 캘리포니아 기반의 프랑스 와인 브랜드로, 1.5리터 박스형 와인을 판매한다. 리브랜딩은 몬트리올 스튜디오 Wedge가 맡았다.",
    overview: "AMI AMI는 미국 캘리포니아를 기반으로 한 프랑스 와인 브랜드로, 1.5리터 박스형 와인을 판매한다. '규칙 없는 와인'을 표방하는 격식 없고 친근한 소비자 와인으로, 리브랜딩은 몬트리올 스튜디오 Wedge가 진행했다.",
    identity: "Wedge는 '규칙 없는 와인'이라는 콘셉트 아래 격식 없고 친근한(unfussy and friendly) 분위기를 전 접점에 적용했다. 워드마크는 반원 컵 모양을 그래픽 장치로 활용해 'A'의 안쪽 공간과 'i'의 점을 형성하며, 빈티지 프랑스 와인 상자 레터링에서 영감을 얻은 전용 서체 'Ami Ami Vin'을 사용한다. 컬러는 차분한 그린·연보라·머스터드·더스티 핑크에 선명한 레드를 포인트로 더했고, 일러스트는 몬트리올 일러스트레이터 Mathieu Dionne가 이탈리아 미래주의 작가 Fortunato Depero에서 영감을 받아 제작했다.",
  },
  "brandarchive-bezi": {
    definition: "Bezi(베지)는 중동·지중해식 유제품 라브네(labneh)를 미국 시장에 새로운 스낵 카테고리로 소개하는 식음료 브랜드다. 뉴욕 기반으로 2024년 데뷔했으며, 브랜드 작업은 Red Antler가 맡았다.",
    overview: "Bezi(베지)는 중동·지중해식 유제품 라브네(요거트를 거른 크림 형태의 딥)를 미국 시장에 새로운 스낵 카테고리로 소개하는 식음료 브랜드다. 뉴욕을 기반으로 이스탄불 출신 창업자가 설립했으며 생산은 터키에서 이뤄지고 2024년 뉴욕 식료품점을 통해 데뷔했다. 브랜드명 'Bezi'는 라브네 제조에 쓰이는 치즈클로스를 뜻하는 터키어 'bez'에서 따왔다.",
    identity: "Red Antler는 새 스낵 카테고리 구축을 목표로 네이밍·전략·로고타입·패키지·모션·일러스트를 담당했다. 로고타입은 두껍고 곡선적인 글자꼴로 유머·자신감·친근함을 표현했고, WordArt·클립아트·90년대 그라데이션 같은 초기 데스크톱 퍼블리싱 정서를 차용했다. 컬러는 맛별로 구분되는 팔레트(플레인=라이트 블루, 레드 페퍼=웜 레드, 에브리싱=머스터드 옐로)를 적용했고, 라브네의 크리미한 소용돌이에서 착안한 마스코트와 말풍선 요소를 패키지에 넣었으며 태그라인은 'There''s no wrong way to labneh'이다.",
  },
  "brandarchive-drumroll": {
    definition: "Drumroll은 미국 로스앤젤레스에서 2019년 GreenHouse Foods로 출발한 포장 미니 도넛 브랜드로, 그레인프리·고단백 스낵 도넛을 만든다. 리브랜딩은 브루클린 스튜디오 Gander가 맡았다.",
    overview: "Drumroll은 미국 로스앤젤레스에서 2019년 GreenHouse Foods라는 이름으로 출발한 포장 미니 도넛 브랜드로, 한 입 크기의 그레인프리·글루텐프리·고단백 스낵 도넛을 만든다. 브루클린 기반 스튜디오 Gander가 리브랜딩하면서 제품명을 GreenHouse Foods에서 Drumroll로 바꾸고 로고·패키지·아트디렉션을 새로 구축했다.",
    identity: "Gander는 '건강식품'의 임상적 인상 대신 기대감과 즐거운 탐닉을 전면에 내세우고, 도넛 구멍을 브랜드 세계로 들어가는 에너지 넘치는 창(window)으로 삼아 어안렌즈(fisheye) 사진과 초현실적 아트디렉션을 적용했다. 워드마크는 도넛에서 흘러내리는 초콜릿을 연상시키는 매끈한 형태로, 대소문자를 섞고 'R'이 다음 글자로 굴러 들어가며 'o'의 타원형 창이 실제 도넛을 표현한다. 패키지·웹 전반에 Grilli Type의 GT Haptik Black 서체가 쓰였고, 컬러는 선명한 보라색과 밝은 파스텔 블루를 중심으로 구성된다.",
  },
  "brandarchive-teller": {
    definition: "Teller는 핀란드 헬싱키 Töölö 지구에 2024년 문을 연 파인다이닝 레스토랑으로, 식사를 '이야기하기'로 풀어내는 콘셉트가 핵심이다. 브랜드는 헬싱키 스튜디오 Werklig이 맡았다.",
    overview: "Teller는 핀란드 헬싱키 Töölö 지구에 2024년 문을 연 파인다이닝 레스토랑으로, 식음 분야에 속한다. 헬싱키 스튜디오 Werklig가 브랜드를 맡았으며, 식사를 '이야기하기(storytelling)'라는 행위로 풀어내는 콘셉트를 핵심으로 삼았다.",
    identity: "콘셉트는 '마술적 사실주의(magical realism)'로, 음식의 사실성에 초자연적 요소를 더해 식사를 초현실적이고 꿈같은 여정으로 만든다. 로고타입은 손으로 그린 듯한 불규칙한 선과 들뜬 성격을 지녀 마치 무너지기 직전처럼 보이며, 보조 서체로 Arizona Flair와 Ostia Antica Italic이 사용되었다. 컬러 팔레트는 따뜻하면서도 다소 거칠고 변덕스러운 성격으로, 식재료를 단색 블록 실루엣으로 표현한 요소가 더해진다. 우화·민담에서 영감받아 테이블에 둘러앉은 손그림 캐릭터들과 입구의 나비 모티프가 반복적으로 등장한다.",
  },
  "brandarchive-lucia": {
    definition: "Lucia(루치아)는 호주 멜버른 사우스멜버른의 지중해풍 외식 공간으로, 바·레스토랑·카페·지하 와인 볼트를 아우른다. 브랜딩은 멜버른·뉴욕 스튜디오 Blurr Bureau가 맡았다.",
    overview: "Lucia(루치아)는 호주 멜버른 사우스멜버른에 위치한 지중해풍 외식 공간으로, 바·레스토랑·카페·지하 와인 볼트를 아우르는 3개 층 규모의 복합 다이닝이며 자매 카페·마켓플레이스 Via Lucia를 함께 운영한다. 멜버른과 뉴욕을 기반으로 하는 브랜딩 스튜디오 Blurr Bureau가 전략·브랜딩·아트디렉션·사이니지·웹을 포함한 전방위 작업을 맡았다.",
    identity: "아이덴티티는 빛과 시각의 로마 성인 성 루치아 전설에서 출발하며, 자신의 눈을 스스로 떼어냈다는 일화를 현대적·낭만적 뮤즈로 재해석해 공간 곳곳에서 그녀의 눈을 의도적으로 감추는 방식으로 표현했다. 이는 6점의 대형 맞춤 아트워크와 콜라주·일러스트레이션을 중심으로 50개 이상의 응용 표현으로 확장되었으며, 건축은 멜버른의 Rothelowman이 담당했다. 로고 형태와 서체·컬러의 구체적 사양은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-postmuseum": {
    definition: "Postmuseum은 스웨덴 스톡홀름의 우편 박물관으로, 약 400년에 걸친 스웨덴 우편 역사를 다룬다. 리노베이션 후 2024년 가을 재개관했으며, 리브랜딩은 스칸디나비아 스튜디오 Bold가 맡았다.",
    overview: "Postmuseum은 스웨덴 스톡홀름에 있는 우편 박물관(The Swedish Postal Museum)으로, 약 400년에 걸친 스웨덴 우편 역사를 다룬다. 대대적인 리노베이션을 거쳐 2024년 가을 새 브랜드와 함께 재개관했으며, 리브랜딩은 스칸디나비아 기반 브랜드 컨설팅 스튜디오 Bold(Bold Scandinavia)가 맡았다.",
    identity: "아이덴티티의 핵심은 'PM Display'라는 전용 서체로, 스웨덴 왕립 우편의 역사적 상징인 우편 나팔(post horn)과 과거 우편 타이포그래피에서 영감을 받았다. 서체는 미묘한 세리프와 곧은 스템의 대비, 굵고 응축된 형태와 리드미컬한 곡선으로 강하면서도 친근한 목소리를 표현하고 전시별로 개별성이 드러나도록 설계되었다. 박물관의 우편 유산을 기리면서 현대적 존재감으로 갱신하는 것이 콘셉트로, 구체적 색상 팔레트는 공개 자료로 확인되지 않는다.",
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
