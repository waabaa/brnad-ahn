// Batch 20: WEB-VERIFIED content. Agency pages + design press (Zak Group, DNCO, B&B
// Studio, Paul Belford, Collins, Marx Design, Blok Design; Brand New/Creative Review/
// Dezeen/BP&O/Dieline/Creative Boom). Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-paco-rabanne": {
    definition: "파코 라반(Paco Rabanne)은 스페인 태생 디자이너 파코 라반이 1966년 설립한 프랑스 패션·향수 하우스로, 금속·체인메일 드레스로 유명하다(현 모기업 Puig). 2016년 아이덴티티는 런던 스튜디오 Zak Group이 맡았다.",
    overview: "파코 라반(Paco Rabanne, 현 Rabanne)은 스페인 태생의 프랑스 디자이너 프란시스코(파코) 라반이 1966년 설립한 패션 하우스로, 금속과 체인메일 등 비전통 소재로 만든 드레스로 패션사의 전환점을 만든 것으로 잘 알려져 있다. 1968년 푸이그(Puig)와 향수 라이선스 계약을 맺고 1969년 첫 향수 칼랑드르를 선보였으며, 1986년 푸이그가 하우스 전체를 인수해 현재까지 모기업으로 두고 있다. 향수가 사업의 핵심 축이다.",
    identity: "2016년 런던 기반 스튜디오 Zak Group이 크리에이티브 디렉터 쥘리앵 도세나와 협업해 10년 만의 신규 매장 개점에 맞춰 새 비주얼 아이덴티티를 전개했다. 1970년대 원형 로고타입을 다시 그려 이전 버전의 자간 문제를 바로잡고 획 대비를 높여 가독성을 개선했으며, 모노그램은 단일 굵기(monowidth) 획으로 재구성해 구조를 드러내고 더 가볍고 동시대적인 느낌을 부여했다. 또한 기하학적 성격과 따뜻한 인간적 형태를 결합한 전용 서체 파코 산스(Paco Sans)를 개발해 로고·인쇄물·패키지·캠페인·웹사이트 전반에 적용했다.",
  },
  "brandarchive-here-east": {
    definition: "히어 이스트(Here East)는 런던 퀸 엘리자베스 올림픽 파크 내 옛 올림픽 프레스·방송 센터를 재생한 약 120만 제곱피트 규모의 기술·창업·제조 캠퍼스다. 아이덴티티는 스튜디오 DNCO가 맡았다.",
    overview: "히어 이스트(Here East)는 런던 퀸 엘리자베스 올림픽 파크 내, 2012 런던 올림픽의 프레스 및 방송 센터를 재생해 만든 약 120만 제곱피트 규모의 기술·창업·제조 캠퍼스다. 해크니 윅 인근에 자리하며, 디자인·기술·제조 기업과 스타트업, 대규모 기업이 함께 모이는 혁신 거점으로 조성되었다.",
    identity: "dn&co(DNCO)는 '런던의 메이킹(making)을 위한 거점'이라는 포지셔닝 아래, 디지털 생성적 요소와 물리적 수공 디테일의 대비로 연결성을 표현했다. 핵심 심벌은 대각선 분할·교차·노드가 적용된 '분절된 H' 모노그램으로, 모바일 화면부터 건물 외벽 슈퍼그래픽까지 확장 가능하다. 전용 서체는 Aktiv Grotesk를 기반으로 DNCO·Colophon·Dalton Maag가 협업해 제작했으며, 글리프 곳곳의 작은 절단(small cuts)으로 픽셀 같은 인상을 준다. 컬러는 형광 터쿼이즈·밝은 오렌지·그레이·블랙·화이트로 절제해 일관 적용했다.",
  },
  "brandarchive-bol": {
    definition: "BOL은 Innocent 식품 부문 전 총괄 폴 브라운이 2015년 출범시킨 영국의 식물 기반 간편식 브랜드로, '보울 속의 세계'를 표방한다. 2015년 아이덴티티·패키지는 B&B Studio가 맡았다.",
    overview: "BOL은 폴 브라운(Innocent 식품 부문 전 총괄)이 2015년에 출범시킨 영국의 식물 기반 간편식 브랜드로, 신선한 자연 재료로 만든 채소 보울 제품으로 시작했다. 세계 여러 지역의 현지 셰프와 길거리 시장에서 영감을 받은 레시피를 바탕으로 '보울 속의 세계(world in a bowl)'라는 발상에서 이름을 따왔으며, 이후 누들·파워 셰이크 등 식물 기반 간편식 라인업으로 범주를 확장했다.",
    identity: "2015년 영국 디자인 스튜디오 B&B Studio가 로고·브랜드 아이덴티티·패키지 디자인을 맡았다. 로고타이프는 거친 스탬프 질감을 입힌 굵은 대문자 산세리프이며, O의 카운터 안에 미소 짓는 입과 혀 형태의 '보울/스마일' 디테일을 넣어 맛을 상징하고 O 위 다이아크리틱(부호)으로 글로벌함을 표현했다. 컬러와 아이코노그래피는 항공우편 스티커·수출 신고서·여권 스탬프의 형태 언어에서 끌어와 여행자적 진정성을 부여했고, 형태와 색으로 채소·누들·수퍼 라인을 구분하도록 설계했다. 이후 'Bring On Life' 리포지셔닝은 BOL 내부 팀이 진행했다.",
  },
  "brandarchive-cuckoo-muesli": {
    definition: "Cuckoo는 영국에서 출시된 '모던 비르허 뮤즐리' 브랜드로, 점보 오트·요거트·과일을 휴대용 컵에 담아 판매한다. 네임·아이덴티티·패키지는 런던 스튜디오 B&B Studio가 맡았다.",
    overview: "Cuckoo는 영국에서 출시된 '모던' 비르허 뮤즐리(bircher muesli) 브랜드로, 점보 오트·요거트·과일을 섞어 휴대용 컵(on-the-go pot) 형태로 판매되며 스위스식 건강한 식생활에서 영감을 얻었다. 망고&코코넛, 엘더플라워&크랜베리, 다크초콜릿&사워체리 등 모험적인 플레이버를 갖췄고 'the modern muesli'를 슬로건으로 내세운다.",
    identity: "B&B Studio는 알프스풍 노스탤지어를 의도적으로 피하고 스위스 그래픽 포스터에서 영감을 얻은 '모던 스위스' 디자인 톤을 잡았다. 로고는 스타일라이즈된 C와 K를 결합해 뻐꾸기(cuckoo) 새 형상을 만들어내며, K의 네거티브 스페이스를 패키지 위 다이컷(die-cut)으로 재현해 안쪽의 층층이 쌓인 제품이 보이도록 한 점이 특징이다. 패키지는 대담하고 독특한 멀티레이어 사진 스타일을 활용해 재료를 부각시키고 포스터풍의 동시대적 인상을 준다.",
  },
  "brandarchive-bear-paws": {
    definition: "Bear Paws는 영국 헬스푸드 브랜드 Bear가 내놓은, 굽고 모양을 낸 순수 과일 스낵 라인으로 어린이 건강 스낵 카테고리에 속한다. 브랜드 작업은 런던 스튜디오 B&B Studio가 맡았다.",
    overview: "Bear Paws는 영국 헬스푸드 브랜드 Bear(Bear Nibbles)가 내놓은, 굽고 모양을 낸 순수 과일 스낵 라인으로 어린이 대상 건강 스낵 섹터에 속한다. 영국에서 시작해 이후 벨기에 Lotus Bakeries 산하로 편입됐으며, Bear는 농축액·첨가당 없는 순수 과일 스낵을 표방하며 Yoyos·Paws 등으로 라인을 확장했다.",
    identity: "B&B Studio(런던)는 Bear의 출범부터 함께하며 브랜드 전략·네이밍·비주얼 아이덴티티·패키지 디자인을 담당했고, 어린이 스낵의 흔한 '귀여움' 관습을 거부하고 곰 캐릭터와 'No added nonsense'라는 직설적·유머러스한 메시지로 성분 투명성을 강조했다. 로고는 평면적·2차원의 단순한 형태이며 일러스트는 소박한(naive) 스타일을 따른다. Paws 한정판 패키지는 멸종위기 곰(판다·북극곰·태양곰)을 알리는 WWF 연계 디자인으로, 우리(cage)형 다이컷과 스탬프 같은 질감·거친 종이 절단 가장자리, 기존 팩에서 가져온 밝고 현대적인 컬러 팔레트를 사용했다.",
  },
  "brandarchive-social-enterprise-uk": {
    definition: "Social Enterprise UK는 2002년 설립된 영국 사회적기업의 전국 회원·대변 기구다. 2016년 아이덴티티는 런던 스튜디오 Paul Belford Ltd가 맡았다.",
    overview: "Social Enterprise UK는 영국 사회적기업의 전국 회원 단체이자 대변 기구로, 2002년에 설립되어 사회적·환경적 목적을 가진 기업들의 네트워크를 운영한다. 대형 의료·공공서비스 사업자부터 지역 공동체 조직, 소매업체까지 다양한 사회적기업을 회원으로 두고, 영국 각 지역의 유사 단체와 연계해 정책 결정자에게 사회적기업 부문을 옹호한다.",
    identity: "2016년 5월 런던 스튜디오 Paul Belford Ltd가 선보인 디자인은 알파벳 S에서 등호(equals sign)를 끌어내는 마크로, 더 평등한 사회에 기여한다는 조직의 지향을 시각화한다. 마크는 S 형태를 유지하면서 여백(negative space)을 강조하고, 폭이 넓은 마크와 대비되도록 콘덴스트(condensed) 서체를 함께 사용한다. 여러 하위 브랜드는 색상으로 구분되며 'Social enterprise for a more equal society'라는 슬로건이 함께 적용되고, 구체적 색상 값과 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-freewheel": {
    definition: "여기서 다룬 Freewheel은 케이블비전(Cablevision)이 2015년 선보인 와이파이 전용 저가 모바일 폰 서비스다(광고기술 FreeWheel과 무관). 아이덴티티는 스튜디오 Collins가 맡았다.",
    overview: "이 Freewheel은 케이블비전(Cablevision)이 2015년 1월 선보인 와이파이 전용 저가 모바일 폰 서비스로, 광고 기술 기업 FreeWheel(Comcast/NBCUniversal)과는 다른 별개의 브랜드다. 뉴욕 일대에 깔린 100만 개 이상의 와이파이 핫스폿망을 활용해 통신사 데이터 요금제 없이 무제한 데이터·통화·문자를 제공하는 것을 골자로 했다.",
    identity: "Collins가 2016년경 이 서비스의 로고·브랜딩·패키지를 설계했다. 핵심 콘셉트는 평등과 연결성으로, 깃발(flag) 형태의 통합 그래픽 장치를 기반으로 선과 교차로 확장되는 역동적·다채색 시각 언어를 구성했다. 로고마크는 와이파이 신호가 어디서나 닿는다는 의미의 날아오르는 선에서 출발했고, 로고타입은 깃발 안에 배치된 모노라인 산세리프로 F 자가 등호(=) 기호처럼 쪼개진 형태가 특징이다. 색상은 패키지에서는 선명한 다색, 인쇄 가이드에서는 가독성을 위한 파스텔 톤으로 운용됐다.",
  },
  "brandarchive-from-babies-with-love": {
    definition: "From Babies with Love는 유기농 베이비 의류·선물을 판매하고 수익 전액을 전 세계 고아·버려진 아동 지원에 기부하는 영국의 사회적 기업이다. 2015년 브랜드 작업은 Paul Belford Ltd가 맡았다.",
    overview: "From Babies with Love는 영국의 사회적 기업으로, 유기농 베이비 의류·담요·액세서리와 인사 카드를 온라인으로 판매한다. 수익 전액을 전 세계 고아 및 버려진 아동 지원(SOS Children's Villages)에 기부하는 구조로 운영되며, 설립자는 런던의 Cecilia Crossley다.",
    identity: "Paul Belford Ltd가 2015년경 진행한 브랜드 작업의 핵심 콘셉트는 우편 소인(postmark) 장치로, 온라인 쇼핑과 해외로 보내는 원조 사이를 잇는 연결고리로 사용되었다. 재활용 우편 자재로 만든 동물 콜라주 일러스트가 더해져 봉투·명함·태그·웹사이트 전반에 적용되었으며, 선명한 빨간색 잉크가 주요 색으로 쓰였다(무광 크림 보드, 빨간 끈, 표백하지 않은 구멍 보강재, 캔버스 소포백 등 우편 미감의 소재 사용). 사용 서체에 관한 구체 정보는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-bruce-juice": {
    definition: "Bruce Juice는 2015년 호주 시장에 출시된 100% 콜드프레스 과일·채소 주스 및 식물성 밀크 브랜드다. 브랜딩·패키지는 뉴질랜드 오클랜드 스튜디오 Marx Design이 맡았다.",
    overview: "Bruce Juice는 2015년 호주 시장에 출시된 100% 생(生) 콜드프레스 과일·채소 주스 및 식물성 밀크(아몬드 밀크 포함) 브랜드다. 뉴질랜드 오클랜드 소재 디자인 스튜디오 Marx Design이 브랜딩과 패키지 디자인을 맡았으며, 제품 라인업은 Red·Redder·Orange·Greener·Golden과 아몬드 밀크 Nutter로 구성된다.",
    identity: "Marx Design은 손으로 그린 듯한 느슨하고 불규칙한 획의 대문자 로고타입과 활기·가독성·개성을 동시에 노린 커스텀 서체를 사용했다. 변형(맛)별로 손으로 그린 고유 일러스트 로고를 적용하고, 주먹·번개·폭탄·파도 같은 모티프로 천연 재료의 강렬한 에너지를 표현했으며 종이를 오린 듯한 질감의 과일·채소 일러스트를 더했다. 색은 인공적이지 않은 '밝지만 자연스러운' 톤(브라운·그린·오렌지·화이트 계열)으로 맛을 구분했고 넉넉한 여백으로 순수함과 프리미엄 인상을 강조했다('Good. Better. Bruce.').",
  },
  "brandarchive-f32": {
    definition: "f32는 미국 LA에 본사를 둔 트렌드 워칭(trend-watching) 회사로, 패션 분야의 떠오르는 아티스트·브랜드를 발굴·육성한다. 이름은 카메라의 최대 심도 조리개값에서 따왔으며, 2016년 아이덴티티는 토론토 스튜디오 Blok Design이 맡았다.",
    overview: "f32는 LA에 본사를 둔 미국의 트렌드 워칭 회사로, Gina와 Lisa Priolo 자매가 설립했다. 패션 분야에서 떠오르는 아티스트와 브랜드를 발굴·육성하고, 브랜드·리테일러·쇼룸·에디터가 빠르게 변하는 패션 흐름을 헤쳐 나가도록 돕는 것을 핵심 업으로 한다. 토론토 스튜디오 Blok Design이 2016년 론칭 시점에 네이밍과 비주얼 아이덴티티를 함께 맡았다.",
    identity: "'f32'라는 이름은 카메라에서 가장 깊은 심도(depth of field)를 얻는 조리개 설정값에서 따온 것으로, 과거와 현재·정제된 것과 개인적인 것 사이의 깊이를 은유한다. 타이포그래피는 세리프 Bauer Bodoni와 디지털용 산세리프 Montserrat를 조합했고, 컬러는 여성적인 핑크에 클래식한 크림과 도시적인 쿨 그레이를 더하고 금·검정 메탈릭 포일을 악센트로 썼다. 마감은 광택 블록 포일과 비코팅 질감의 대비, 블라인드 엠보싱, 스탬프·스티커 같은 수작업 요소를 결합해 명함·문구류·트렌드 리포트와 반응형 사이트 전반에 적용됐다.",
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
