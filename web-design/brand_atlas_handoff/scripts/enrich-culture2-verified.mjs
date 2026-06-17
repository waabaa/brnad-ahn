// Batch 8: WEB-VERIFIED content. Agency pages + design press (Principal Studio,
// Derek&Eric, Manual, Landor, Koto, Wedge, For The People, Porto Rocha, Stockholm
// Design Lab; Brand New/Creative Review/Dieline/BP&O/It's Nice That/Fast Company).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-musée-des-beaux-arts-de-montréal": {
    definition: "몬트리올 미술관(Musée des beaux-arts de Montréal, MBAM)은 다섯 개 파빌리온에 걸친 캐나다에서 가장 오래된 미술관이자 퀘벡 최대 규모의 미술관이다. 아이덴티티는 몬트리올 스튜디오 Principal이 맡았다.",
    overview: "몬트리올 미술관(Musée des beaux-arts de Montréal, MBAM)은 몬트리올 도심의 다섯 개 파빌리온에 걸쳐 있는 캐나다에서 가장 오래된 미술관이자 퀘벡 최대 규모의 미술관이다. 약 4만 7천 점의 작품을 소장한 캐나다 문화계의 핵심 기관이다.",
    identity: "Principal(몬트리올)이 작업한 아이덴티티는 미술관의 상징인 'M'을 유지하되 단순화한 것이 핵심으로, 기존의 일곱 가지 대비색을 걷어내고 투명성(transparency) 원리를 도입해 로고가 주변 색을 흡수하도록 설계했다. 로고는 자신의 색을 강요하기보다 배경색을 받아들여 반투명하게 존재하며, 콘텐츠가 전면에 서도록 한 발 물러난다는 개념을 담았다. 타이포그래피는 단일 서체 MBAM Habitus로 통합되어 사이니지·인쇄물·디지털 인터페이스 전반의 일관성을 강화하며, 크리에이티브 디렉션은 Bryan-K. Lamonde가 맡았다.",
  },
  "brandarchive-innocent-rebrand-2025": {
    definition: "이노센트(innocent)는 1999년 영국에서 출범한 스무디·주스 브랜드로, '더 듀드(the dude)' 마크로 친근한 인상을 쌓았으며 2013년 코카콜라가 인수했다. 2025년 리프레시는 Derek&Eric이 맡았다.",
    overview: "이노센트(innocent)는 1999년 영국에서 출범한 스무디·주스 브랜드로, 스무디 외에 주스·헬스 샷·코코넛 워터 등으로 제품군을 넓혀왔다. 2013년 코카콜라가 인수했으며, 둥근 얼굴에 후광이 얹힌 캐릭터 '더 듀드(the dude)' 마크와 소문자 워드마크로 친근한 인상을 쌓아왔다. 제품군이 확장되며 스타일이 흩어져 선반에서의 통일감이 약해졌다는 진단이 2025년 리프레시의 배경이 됐다.",
    identity: "2025년 데렉앤에릭(Derek&Eric)이 전략가 사일러스 에이모스(Silas Amos)와 함께 진행한 작업은, 흩어진 스타일을 걷어내고 '더 듀드'를 선함의 상징(beacon of goodness)으로 전면에 내세우는 단일 아이디어를 중심으로 시스템을 재정비했다. 듀드는 기울어진 형태를 매끄럽게 다듬어 구도에서 최대 공간을 차지하도록 다시 그려졌고, 워드마크는 아치형으로 부드럽게 다듬어 듀드와 자연스럽게 결합되도록 했다. 색상·일러스트·사진을 아우르는 핵심 자산 세트를 정비해 현재와 향후 제품군에 적용되는 유연한 시스템을 만들었다.",
  },
  "brandarchive-obama-foundation": {
    definition: "오바마 재단(The Obama Foundation)은 버락·미셸 오바마가 2014년 설립한 비영리 기관으로, 리더십 양성과 지역사회 프로그램, 시카고의 오바마 대통령 센터를 추진한다. 2025년 리브랜딩은 스튜디오 Manual이 맡았다.",
    overview: "오바마 재단(The Obama Foundation)은 버락 오바마와 미셸 오바마가 2014년 설립한 비영리 기관으로, 리더십 양성과 지역사회 프로그램(Obama Foundation Leaders, My Brother's Keeper Alliance 등)을 운영한다. 핵심 사업으로 시카고 잭슨파크에 2026년 개관 예정인 오바마 대통령 센터를 준비하고 있다.",
    identity: "샌프란시스코·암스테르담 기반 스튜디오 Manual이 대통령 센터 개관에 앞서 리브랜딩을 이끌었으며, 2008년 캠페인의 떠오르는 태양(rising sun) 로고와 Gotham 서체를 계승하되 더 역동적인 표현을 위해 Gotham Condensed를 결합했다. Monotype의 Sara Soskolne와 협업해 Gotham을 확장한 맞춤 변형(Gotham Slab·Stencil·Inline 등)을 제작했고, Gotham Inline Condensed의 줄무늬 형태는 떠오르는 태양 로고를 변주한 것이다. 작은 행동이 큰 변화로 번지는 파급 효과를 표현하는 방사형 기하 패턴과 모션 가이드라인을 도입했으며, 시그니처 색상으로 코발트 블루를 사용한다.",
  },
  "brandarchive-lobos-1707": {
    definition: "Lobos 1707은 Diego Osorio가 2020년 출시한 초프리미엄 아가베 증류주(테킬라·메스칼) 브랜드로, NBA 스타 LeBron James가 투자자로 참여한 것으로 알려져 있다. 2024~2025년 리뉴얼은 Landor가 맡았다.",
    overview: "Lobos 1707은 Diego Osorio가 자신의 동명 선조에게서 영감을 받아 2020년 출시한 초프리미엄 아가베 증류주 브랜드로, 100% 블루 웨버 아가베 테킬라와 에스파딘 메스칼을 무첨가로 선보인다. NBA 스타 LeBron James가 초기부터 투자자로 참여한 것으로 확인되며, 2024년 11월 'UnDOMESTICATE' 캠페인과 함께 리뉴얼된 아이덴티티를 공개했다.",
    identity: "리뉴얼은 Landor가 맡았으며, 늑대(wolf)의 길들여지지 않은 야성과 비순응적 정신을 핵심 콘셉트로 삼아 늑대 로고와 정교한 인시그니아(insignia)를 중심으로 구성된다. 색상은 강렬한 오렌지 라벨을 시그니처로 내세워 야성과 독립성의 상징으로 사용한다. 기존 병 형태는 변경할 수 없어, Landor는 패키지·POS·머천다이즈·소셜로 일관되게 확장되는 유연한 디자인 시스템을 구축하고 셰리 캐스크 피니시를 반영한 레이어드 디테일을 더했다. 구체적 서체는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-huntington-bank": {
    definition: "헌팅턴 뱅크(The Huntington National Bank)는 1866년 설립된 미국 오하이오주 컬럼버스 기반의 지역 은행으로, 자산 약 2,100억 달러 규모다. 2025년 리브랜딩은 에이전시 Koto가 맡았다.",
    overview: "헌팅턴 뱅크(The Huntington National Bank)는 미국 오하이오주 컬럼버스에 본사를 둔 지역 은행으로, 1866년 설립되어 약 160년의 역사를 가진다. 자산 규모 약 2,100억 달러대의 중서부 기반 은행으로, 최근 미국 전역으로 사업을 확장하며 전국 단위 은행으로의 전환을 추진하고 있다.",
    identity: "2025년 8월 공개된 코토(Koto)와의 리브랜딩은 '풍요는 하나의 기예다(Abundance is a Craft)'라는 개념을 중심으로, 금융을 거래적 행위에서 인간의 기술과 정성이 담긴 기예로 재해석했다. 로고는 타이포그래피를 갱신하고 'bank'라는 단어를 추가해 새로운 시장에서의 인지도를 강화했다. 전용 서체로는 루이스 맥거피(Lewis McGuffie)가 작업한 플레어드 세리프 'Huntington Serif'를 도입하고 디지털용 보조 서체로 ABC Monument Grotesk를 함께 쓴다. 색상은 시그니처 그린을 발전시킨 'Huntington Abundant Green'을 핵심으로 Prosperous Sage·Dark Teal에 Magenta·Teal 악센트를 더한 팔레트로 구성된다.",
  },
  "brandarchive-bancomat": {
    definition: "BANCOMAT S.p.A.는 1983년 이탈리아 최초의 ATM 현금인출망에서 출발한 이탈리아 대표 결제·인출 사업자다. 2025년 리브랜딩으로 산하 브랜드를 단일 BANCOMAT 이름 아래로 통합했으며, 작업은 Landor가 맡았다.",
    overview: "BANCOMAT S.p.A.는 1983년 이탈리아 최초의 ATM 현금인출망에서 출발해 40년 넘게 운영돼 온 이탈리아 대표 결제·인출 사업자다. ATM 인출망 BANCOMAT, POS 카드결제망 PagoBancomat, 2019년 도입된 모바일 결제 BANCOMAT Pay를 운영하며, 2025년 리브랜딩에서 PagoBancomat·Bpay를 단일 BANCOMAT 이름 아래로 흡수해 브랜드 구조를 단순화했다.",
    identity: "Landor가 맡은 새 아이덴티티는 '하이퍼비전(hyper-vision)'을 핵심 콘셉트로, 기존 형태에서 진화한 갈매기 형상의 'B' 심벌을 중심에 둔다. 초광각·반구형 조감(bird's-eye view) 시점을 사진·레이아웃·모션 전반에 적용하고, 시장의 역동성에 맞춰 유연하게 변형되는 전용 서체와 표현적 일러스트레이션을 결합했다. 컬러는 블루 계열을 중심으로 하며, 정확한 컬러 코드·전용 서체명 등 세부 사양은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-live-soda": {
    definition: "Live(Live Soda)는 프리바이오틱·프로바이오틱을 함유한 유기농 발효 탄산음료 브랜드로, 미국의 장 건강(gut-health) 소다 카테고리에 속한다. 아이덴티티는 몬트리올 스튜디오 Wedge가 맡았다.",
    overview: "Live(Live Soda)는 프리바이오틱·프로바이오틱을 함유한 유기농 발효 탄산음료 브랜드로, 미국 시장의 장 건강 소다 카테고리에 속한다. 2013년 텍사스 오스틴에서 시작해 2024년 Better Booch에 인수된 뒤 재포지셔닝됐으며, Olipop·Poppi 같은 경쟁 브랜드와 함께 거론된다.",
    identity: "몬트리올 기반 스튜디오 Wedge가 브랜드 아이덴티티·패키지 시스템·크리에이티브 디렉션을 맡았다. 콘셉트는 웰니스 트렌드를 따르기보다 클래식 탄산음료의 향수를 끌어와 차별화하는 방향으로, 캔 전면을 가득 채우는 굵고 큰 로고타입과 과감한 색 사용이 특징이다. 레터폼은 곡선과 날카로운 모서리를 함께 써 경쾌하면서도 단호한 인상을 주며, 컬러 팔레트는 블루·브라운·핑크·레드·화이트로 구성된다.",
  },
  "brandarchive-meander-valley": {
    definition: "Meander Valley는 호주 태즈메이니아의 지역 자치체 Meander Valley Council을 위한 장소 브랜드다(낙농 브랜드 아님). 농업 유산과 비옥한 토지를 지닌 지역으로, 브랜딩은 호주 스튜디오 For The People이 맡았다.",
    overview: "Meander Valley는 호주 태즈메이니아의 지역 자치체 Meander Valley Council을 위한 장소 브랜드(place brand)로, 런서스턴 외곽에서 Great Western Tiers에 이르는 농업 유산과 비옥한 토지를 지닌 지역이다. 크림·버터 등 낙농 제품 브랜드가 아니라 지역(목적지) 브랜딩 프로젝트다.",
    identity: "For The People이 제시한 핵심 콘셉트는 'fertile ground(비옥한 토지)'와 풍요로움으로, 120여 회 대화·50여 곳 현장 방문·3회 워크숍을 거친 커뮤니티 리서치에서 도출됐다. 로고는 굽이치는 강의 흐름을 따르며 Great Western Tiers를 표현한 'M'과 그 아래 비옥한 계곡을 상징하는 숨은 'V'를 담는다. 타이포그래피는 고속도로변 농가 문패와 옛 간판에서 영감받은 손글씨·사인페인팅 스타일이며 커뮤니티가 직접 쓸 수 있도록 오픈소스 서체를 활용했다. 색상은 라즈베리·달리아·토종 꿀벌·풀빛 등 지역 풍경에서 가져왔고, 300여 명의 주민이 함께 만든 태피스트리에서 비롯한 패치워크 그리드 패턴이 지형을 따라 엮인다.",
  },
  "brandarchive-church": {
    definition: "Church는 브라질 출신 영상 편집자 Mah Ferraz가 설립한 로스앤젤레스 기반 포스트프로덕션(영상 편집) 스튜디오다(종교 건물 아님). 브랜딩은 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "Church는 브라질 출신 영상 편집자 Mah Ferraz가 설립한 로스앤젤레스 기반 포스트프로덕션(영상 편집) 스튜디오로, 전 세계 편집자들이 모인 집단을 표방한다. Nike·Google·Spotify 등의 브랜드 광고와 Rosalía·Travis Scott 등의 뮤직비디오 편집 작업을 다룬다.",
    identity: "워드마크는 지상에서 첨탑을 올려다볼 때 느껴지는 대성당의 기울어진 수직성에서 착안했고, 시각 아티스트 Chloe Corriveau가 개발한 뒤 Porto Rocha가 다듬었다. 다양한 각도에서 본 여러 로고 변형을 도입해 '다양한 관점을 존중한다'는 Church의 신념을 시각화했으며, 줌·기울임·회전·리프레임 같은 극단적 시점 변화의 모션 시스템이 핵심이다. 타이포그래피는 본문용 모노스페이스 Superstudio와 헤드라인용 Studio Pro Ultra Bold의 조합을 쓰고, 컬러는 흑백에 네온에 가까운 형광 옐로그린과 간헐적 블루 악센트로 구성된다.",
  },
  "brandarchive-sigma": {
    definition: "여기서 다룬 Sigma는 일본 후쿠시마현 아이즈에 본거지를 둔 카메라 렌즈·광학기기 제조사 Sigma Corporation이다(1961년 설립). 2025년 리뉴얼은 Stockholm Design Lab이 맡았다.",
    overview: "Sigma는 일본 후쿠시마현 아이즈에 본거지를 둔 카메라 렌즈·광학기기 제조사 Sigma Corporation으로, 1961년 설립된 가족 경영 기업이다. 정밀 광학 제품과 독립적 장인정신으로 알려져 있으며, Stockholm Design Lab이 2023년부터 협업해 2025년 초 글로벌 프리미엄 브랜드로 리뉴얼했다.",
    identity: "핵심 콘셉트는 독립성·장인정신·혁신, 그리고 일본의 유산과 공학적 정밀함의 결합이다. 심볼은 그리스 문자 시그마(Σ)를 기하학적으로 재해석한 형태로, 원형이 두 번 등장해 광학 렌즈라는 기업의 토대를 암시한다. 타이포그래피는 일본 문자의 구조적 특성에서 영감을 받은 Sigma Serif와 보다 중립적인 Sigma Sans 두 종의 전용 서체로 구성되며, 색상은 절제된 자연 톤을 매끈한 흑백의 기술적 표면과 대비시키는 팔레트를 쓴다.",
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
