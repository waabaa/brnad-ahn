// Batch 10: WEB-VERIFIED content. Agency pages + design press (Studio fnt, Wolff
// Olins, DNCO, Analogue, Earthling Studio, Taxi Studio, Universal Favourite, 27b.,
// Caserne; Brand New/Dieline/Creative Boom/Design Week/BP&O/Korean press).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-lotteria": {
    definition: "롯데리아(Lotteria)는 롯데GRS가 운영하는 햄버거 패스트푸드 체인으로, 한국을 기반으로 아시아 시장에서 전개된다. 2024년 12년 만에 BI를 전면 개편했으며, 작업은 서울 스튜디오 fnt가 맡았다.",
    overview: "롯데리아(Lotteria)는 롯데GRS가 운영하는 햄버거 패스트푸드 체인으로, 한국을 기반으로 일본을 비롯한 아시아 시장에서 전개된다. 2024년에는 동남아시아에 이어 미국 진출 등 글로벌 확장을 앞두고 12년 만에 브랜드 아이덴티티(BI)를 전면 개편했다.",
    identity: "서울 기반 스튜디오 fnt가 롯데GRS 디자인센터와 협업해 'Taste the Fun'을 핵심으로 한 새 BI를 개발했으며, 크리에이티브 디렉션은 김희선, 아트 디렉션은 이재민·길우경이 맡았다. 기존의 'L' 이니셜과 제품을 상징하던 원형 조합을 보다 추상적이고 표현적인 심벌로 대체해 기능적 표현을 넘어선 정서적 연결을 지향했다. 워드마크는 가독성을 개선하고 한글 워드마크를 새로 개발해 한국 브랜드로서의 K-아이덴티티를 강조했으며, 변경된 BI는 2024년 9월부터 패키지·매장 그래픽·홍보물 등에 순차 적용됐다.",
  },
  "brandarchive-bmg": {
    definition: "BMG는 2008년 설립된 글로벌 음악 기업으로, 음악 퍼블리싱과 음원(레코딩) 사업을 하나로 통합해 운영한다. 2025년 2월 'BMG Next' 전략에 맞춘 새 아이덴티티를 Wolff Olins와 함께 발표했다.",
    overview: "BMG는 2008년 설립된 글로벌 음악 기업으로, 아티스트와 작곡가를 대리하며 음악 퍼블리싱과 음원(레코딩) 사업을 하나로 통합해 운영한다. 2025년 2월 'BMG Next' 전략에 맞춘 새 브랜드 아이덴티티를 발표하며 진화를 알렸다.",
    identity: "Wolff Olins가 작업했으며 'grow boldly together(함께 대담하게 성장한다)'를 핵심 지향점으로 삼았다. 기존 워드마크는 유지하되, 중앙의 재생(play) 버튼을 독립적으로 회전하는 두 개의 다이얼이 감싸는 새 심벌을 도입해 '플레이·전진·연결된 생태계'를 표현했고, 이를 음악과 움직임을 연상시키는 패턴·아이콘 시스템으로 확장했다. 컬러는 오랫동안 연상되던 레드에서 벗어나 활기찬 'Limelight'와 차분한 'Midnight', 메탈릭 계열 뉴트럴을 히어로 컬러로 두고 다채로운 보조 색상으로 보완했다.",
  },
  "brandarchive-sandals": {
    definition: "샌달스 리조트(Sandals Resorts)는 1981년 고든 '부치' 스튜어트가 자메이카에서 시작한 카리브해 올인클루시브 리조트 브랜드로, 커플 중심 럭셔리 휴양으로 자리 잡았다. 2024~2025년 아이덴티티 리프레시는 Wolff Olins가 맡았다.",
    overview: "샌달스 리조트(Sandals Resorts)는 1981년 자메이카 출신 기업가 고든 '부치' 스튜어트가 몽고베이의 해변 호텔을 인수해 개장하며 시작된 카리브해 올인클루시브 리조트 브랜드다. 럭셔리·로맨스·커플 중심의 휴양으로 자리 잡았으며 카리브해 전역에 다수의 리조트를 운영한다. 가족 자매 브랜드인 비치스 리조트(Beaches Resorts)는 가족 단위 여행객을 대상으로 한다.",
    identity: "2024년 말~2025년 초 Wolff Olins가 샌달스와 비치스의 비주얼 아이덴티티를 리프레시했으며, 콘셉트는 카리브해 고유의 색과 그래픽 요소에서 영감을 얻은 'Natural Vibrancy', 캠페인 태그라인은 'Made of Caribbean'이다. 로고는 완전히 새로 만들지 않고 시그니처 스크립트 워드마크를 다듬어 곡선을 부드럽게 하고 비례를 균형 있게 조정했으며, 카운터를 열어 가독성을 높였다. 타이포그래피는 스크립트와 슬래브 세리프를 함께 쓰고, 컬러와 그래픽은 섬에서 발견되는 요소를 기반으로 하며 두 브랜드가 통합된 시각 언어를 공유한다.",
  },
  "brandarchive-dumbo-nyc": {
    definition: "덤보(Dumbo)는 뉴욕 브루클린의 워터프런트 지역으로, 이름은 'Down Under the Manhattan Bridge Overpass'의 약자다. 지역 단체 Dumbo BID 의뢰로 DNCO가 2025년 플레이스 브랜딩을 진행했다.",
    overview: "덤보(Dumbo)는 뉴욕시 브루클린의 워터프런트 지역으로, 이름은 'Down Under the Manhattan Bridge Overpass'의 약자다. 맨해튼교와 브루클린교 사이 자갈길과 옛 공장 건물이 밀집한 동네로, 기술 스타트업과 산업 건물을 개조한 로프트가 집중되어 있으며, 비영리 지역 단체 Dumbo Improvement District(BID)가 이 구역을 관리·운영한다.",
    identity: "DNCO가 BID 의뢰로 진행해 2025년 6월경 공개했다. 핵심 콘셉트는 맨해튼교를 담은 엽서식 이미지를 넘어 '뉴욕의 다른 면(a different side of New York)'으로 동네를 재포지셔닝하는 것으로, 덤보에서 발명된 골판지 상자에서 착안해 공간을 가로지르며 비틀리는 테이프(tape) 그래픽 장치를 도입했다. 컬러 팔레트는 다리를 연상시키는 스틸 블루와 벽돌 공장을 가리키는 딥 레드로 구성되며, 기존의 사선형 워드마크는 유지하고 BID 조직명은 'Team Dumbo'로 리네이밍됐다.",
  },
  "brandarchive-ito-gin": {
    definition: "ITO Gin(이토 진)은 일본 가고시마현 사쓰마 지역의 고마키 증류소와 영국 진 브랜드 Kokoro가 협업해 만든 크로스컬처 진으로, 일본의 쇼추 증류 전통을 기반으로 한다. 디자인은 영국 리즈 스튜디오 Analogue가 맡았다.",
    overview: "ITO Gin(이토 진)은 일본 가고시마현 사쓰마 지역의 고마키 증류소(Komaki Distillery)와 영국 진 브랜드 Kokoro가 협업해 만든 크로스컬처 진으로, 일본의 쇼추 증류 전통을 기반으로 한다. 웨일스-일본 환경운동가 C.W. 니콜의 유산에서 영감을 받은 프로젝트로, 디자인은 영국 리즈 기반 스튜디오 Analogue가 맡았다.",
    identity: "브랜드명 'ITO'는 '실(thread)'을 뜻하며 사람과 문화를 잇는 연결의 은유로, 한자 글자를 중심에 둔 그래픽 패키지로 표현했다. 색은 고마키 증류소가 위치한 사쓰마 지역에서 영감을 받은 형광 오렌지와 깊은 블랙 조합이며, 글로스 UV 디테일로 오렌지가 블랙 위에서 도드라지게 했다. 타이포그래피는 로만 문자에 Giga-Sans Bold, 일본어에 히라기노 가쿠 고딕을 사용해 두 문자 체계의 가독성을 맞췄고, 라벨 컷아웃으로 내용물이 보이게 했으며 숲과 활화산을 가리키는 픽토그램형 아이콘을 더했다.",
  },
  "brandarchive-half-day": {
    definition: "Halfday(하프데이)는 프리바이오틱 식이섬유를 넣고 당을 낮춘 미국의 아이스티 음료 브랜드다. 90년대 아이스티의 향수를 건강하게 재해석하며, 2024~2025년 리브랜드는 런던 Earthling Studio가 맡았다.",
    overview: "Halfday(하프데이)는 프리바이오틱 식이섬유를 넣고 당을 캔당 3~5g으로 낮춘 미국 시장의 아이스티 음료 브랜드로, 뉴저지에 기반을 둔다. 90년대 아이스티의 향수를 자극하는 맛을 더 건강한 방식으로 재해석하는 것을 지향하며, 단기간에 소매 입점처를 크게 확대하며 성장 중인 신생 브랜드다. 런던 기반 Earthling Studio가 리브랜딩을 진행했다.",
    identity: "Earthling Studio는 'Make a Break for It(잠시 벗어나기)'라는 콘셉트를 중심에 두고, 일상에서 쉼과 충전을 갈망하는 정서를 반차(half-day)라는 발상으로 풀어냈다. 로고는 타입 디자이너 Rob Clarke와 협업해 만든 아치형 워드마크로, 세로 배열에 짙은 그림자가 있던 기존 로고를 수평으로 펴고 그림자를 제거해 더 밝고 또렷하게 다듬었다. 비주얼은 과감한 색채, 90년대 노스탤지어, 호숫가 카누·수영장 튜브·해변 의자 같은 탈출의 순간을 담은 맞춤 일러스트와 자른 과일 모티프 패턴으로 구성된다.",
  },
  "brandarchive-yoloh": {
    definition: "Yoloh는 주택·자동차 및 결합 보험을 제공하는 인슈어테크 스타트업으로, 유럽·중동·미국에 걸쳐 사업을 전개한다. 2025년 리브랜딩은 브리스톨 스튜디오 Taxi Studio가 맡았다.",
    overview: "Yoloh는 주택·자동차 및 자동차-주택 결합 보험을 제공하는 보험(인슈어테크) 스타트업으로, 유럽·중동·미국에 걸쳐 투자와 사업을 전개한다. 브리스톨의 Taxi Studio가 2025년 리브랜딩을 맡았으며, 핵심 전략은 복잡한 보험을 단순화한다는 'Insurance Dejumbled'이다.",
    identity: "로고는 위아래로 뒤집어도 동일하게 읽히는 앰비그램(ambigram)으로, 불투명한 업계 속 명료함의 상징으로 설계되었다. 손짓 제스처로 복잡한 보험 개념을 풀어 안내하는 디지털 어시스턴트 캐릭터 'Andi'를 중심에 두었고, 브랜드 라이터 Nick Carson과 협업해 따뜻하고 위트 있으며 접근성 있는 톤앤보이스를 만들었다. 컬러는 밝고 대담한 컬러웨이로 'refreshingly human'한 인상을 의도했으며, 구체적 폰트명과 컬러 코드는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-when": {
    definition: "When은 호주의 펨테크(여성 건강) 스타트업으로, 자가 난자 수 검사와 난임 전문가 상담을 결합한 서비스를 제공한다. 아이덴티티는 시드니 스튜디오 Universal Favourite이 맡았다.",
    overview: "When은 호주의 펨테크(여성 건강) 스타트업으로, 자가 난자 수 검사(at-home egg count test)와 난임 전문가 상담 접근을 결합한 서비스를 제공한다. 사용자가 클리닉이 아닌 일상 환경에서 자신의 생식 관련 생체 정보에 직접 접근하도록 돕는, 난임·가임력(fertility) 영역의 브랜드다.",
    identity: "호주 시드니 스튜디오 Universal Favourite의 작업으로, 신뢰성과 따뜻함을 동시에 담아 차갑고 임상적인 기존 난임 카테고리와 차별화하는 것이 핵심 콘셉트다. 비주얼 중심에는 'When' 워드마크가 놓이고, 주변에 반응하는 유기적인 cell(세포) 형태가 결합되어 변화 속 안정감을 표현한다. 타이포그래피는 ABC Diatype 단일 서체로 워드마크부터 본문까지 사용해 현대적이면서 과학적인 인상을 주며, 색은 레몬 톤과 부드러운 뉴트럴로 밝고 따뜻하며 접근성 높은 분위기를 만든다.",
  },
  "brandarchive-kokoro": {
    definition: "여기서 다룬 Kokoro는 네덜란드 암스테르담의 일본풍 팝업 레스토랑이다(영국 라이스볼 체인 아님). 브랜드 작업은 스튜디오 27b.가 맡았다.",
    overview: "27b.가 작업한 Kokoro는 네덜란드 암스테르담의 일본풍 팝업 레스토랑으로, 라멘과 스시 등 일본식 메뉴를 팝업 형식으로 운영한다. 27b.는 네이밍과 전략부터 아트 디렉션, 머천다이즈, 헤드리스 Shopify 커머스까지 전체 브랜드 작업을 맡았다.",
    identity: "콘셉트는 팝업 특유의 유쾌하고 캐릭터 가득한 브랜드 세계로, 약간 비뚤어지고 물결치는 손그림 워드마크가 핵심이다. 워드마크는 Mariel Nils의 PicNic 서체를 바탕으로 커스텀 제작되었고, 워드마크에서 'ORO' 글자를 추출해 얼굴 형태의 로고 스탬프를 만들었다. 암스테르담 일러스트레이터 Andrew Tseng의 과장되고 질감 있는 캐릭터 일러스트가 그래픽 언어와 메뉴를 보완하며, 팝업마다 재사용 가능한 캔디 핑크 메뉴 슬리브가 대표 색상 요소로 쓰였다.",
  },
  "brandarchive-club-prescine": {
    definition: "클럽 피신(Club Piscine)은 캐나다 퀘벡의 아웃도어 리빙·수영장 용품 소매 브랜드로 35년 역사를 가진다. 2024년 리브랜딩은 몬트리올 스튜디오 Caserne이 맡았다.",
    overview: "클럽 피신(Club Piscine)은 캐나다 퀘벡의 아웃도어 리빙·수영장 용품 소매 브랜드로, 35년 역사를 가진 지역 대표 브랜드다. 다수의 프랜차이즈 매장을 운영하며, 몬트리올 디자인 스튜디오 카세른(Caserne)이 2024년 리브랜딩을 진행했다. 따뜻함·행복·가족적 분위기라는 본질을 유지하면서 신세대의 기대에 부응하도록 이미지를 현대화하는 것이 목표였다.",
    identity: "카세른은 브랜드 유산을 존중하면서도 유연한 비주얼 시스템을 구축했고, 워드마크에는 Dinamo의 Diatype Rounded 서체를 적용해 둥글고 부드러운 형태로 안정감과 친근함을 부여했다. 컬러 팔레트는 활기찬 레드와 블루를 중심으로 재정비해 태양과 물을 연상시키며, 'Le meilleur de l''été(여름의 최고)'라는 새 태그라인을 도입했다. 퀘벡에서 널리 알려진 상징적 스마일 심볼은 삼각형 눈 주름과 입꼬리의 미세한 세리프형 끝단 같은 핵심 디테일을 보존하면서 현대화했다.",
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
