// Batch 9: WEB-VERIFIED content. Agency pages + design press (DixonBaxi, Instrument,
// Manual, Fold7, Koto/Hot Type, DNCO, Wildish & Co., SomeOne, Mucho; Brand New/
// Creative Review/Design Week/Creative Boom/BP&O/Fonts In Use + trade press).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-roblox-2025": {
    definition: "로블록스(Roblox)는 이용자가 직접 게임·가상 경험을 제작하고 함께 즐기는 온라인 게임·제작 플랫폼으로, 2004년 개발돼 2006년 공개됐다. 2025년 새 브랜드 시스템은 DixonBaxi가 맡았다.",
    overview: "로블록스(Roblox)는 이용자가 직접 게임과 가상 경험을 제작하고 함께 즐길 수 있는 온라인 게임·제작 플랫폼으로, 데이비드 바수츠키와 에릭 카셀이 2004년 개발해 2006년 일반에 공개했다. 일일 활성 이용자 평균 8천만 명대를 보유하며, 4천만 개 이상의 이용자 제작 경험이 운영되는 대규모 플랫폼으로 성장했다.",
    identity: "2025년 디자인 스튜디오 딕슨박시(DixonBaxi)가 로블록스 사내 브랜드팀과 함께 새 브랜드 시스템을 정비했으며, 핵심 원리는 수년간 로고에 은연중 담겨 있던 15도 기울기(Tilt)를 추진력·기대감·창의적 에너지의 상징으로 끌어올린 것이다. 이 기울기는 작은 모바일 아이콘부터 대규모 몰입형 디지털 공간까지 4천만 개 이상의 경험을 하나로 묶는 유연한 시스템의 토대가 된다. 워드마크는 깔끔한 기하학적 형태로, 빨강을 고채도로 검정·흰색과 함께 쓴다. 딕슨박시는 플랫폼 내부에 스튜디오를 두고 사내팀·커뮤니티와 함께 아이디어를 시험·프로토타이핑하는 방식으로 작업했다.",
  },
  "brandarchive-electronic-arts": {
    definition: "일렉트로닉 아츠(EA)는 1982년 설립된 미국의 비디오 게임 기업으로, 두 글자 'EA' 모노그램 마크로 오랫동안 인지되어 왔다. 2025년 리브랜딩은 스튜디오 Instrument가 맡았다.",
    overview: "일렉트로닉 아츠(EA)는 1982년 설립된 미국의 비디오 게임 기업으로, 캘리포니아 레드우드시티에 본사를 둔다. 두 글자 'EA'를 결합한 모노그램 마크로 오랫동안 인지되어 왔으며, 스포츠를 비롯한 다양한 게임 포트폴리오를 보유한 대형 퍼블리셔로 성장했다.",
    identity: "2025년 Instrument가 주도한 리브랜딩은 EA를 전통적 게임 퍼블리셔에서 다이내믹한 엔터테인먼트 기업으로 재포지셔닝하는 것을 목표로, 기존 상징 형태에 새로운 차원을 탐색해 헤리티지를 계승하면서 전진감을 강조했다. 타이포그래피는 Electronic Arts Display를 Serif·Mono·Text 스타일을 갖춘 동적 시스템으로 확장했고, 색상은 헤리티지 블루를 중심에 두되 그 주위에 다채로운 팔레트를 구축해 EA가 대표하는 다양한 플레이를 담았다. 모션 툴킷, 커스텀 아이콘 라이브러리, 서브브랜드 시스템 등 확장 가능한 디자인 체계를 함께 마련했다.",
  },
  "brandarchive-care.com": {
    definition: "Care.com은 가족이 돌봄 서비스를 찾고 제공자가 일자리를 구하는 미국 기반 온라인 돌봄 마켓플레이스로, 육아·노인·반려동물 돌봄 등을 아우른다. 2025년 설립 18년 만의 최대 개편을 스튜디오 Manual이 맡았다.",
    overview: "Care.com은 가족이 돌봄 서비스를 찾고 돌봄 제공자가 일자리를 구하는 미국 기반 온라인 돌봄 마켓플레이스로, 육아·노인 돌봄·성인 돌봄·반려동물 돌봄·가사 영역을 아우른다. 2025년 회사 설립 18년 만의 가장 큰 폭의 브랜드 개편을 단행하며 새 로고·색상 팔레트·실제 인물 중심 이미지를 함께 공개했다.",
    identity: "디자인 스튜디오 Manual이 작업한 새 아이덴티티의 핵심 심볼은 대문자 C 안에 소문자 c를 품은 형태로, 큰 C는 돌보는 사람(보호·감싸 안음)을, 작은 c는 돌봄을 받는 사람을 나타낸다. 워드마크는 직접 커스터마이즈한 Oceanic Text를 사용하며, 대문자 C를 한쪽에만 세리프를 둔 비대칭 구조로 바꾼 것이 가장 큰 변화다. 타이포그래피 시스템은 Oceanic Text·Oceanic Grotesk와 NaN Druid Sans 세 서체로 구성되며, 색상은 차분함과 성장을 환기하는 그린 계열 팔레트로 정비됐다.",
  },
  "brandarchive-cazoo": {
    definition: "Cazoo는 영국의 온라인 중고차 검색·거래 플랫폼으로, 2024년 MOTORS에 인수된 뒤 소비자 중심 검색 경험으로 전환했다. 리브랜드는 에이전시 Fold7(Fold7Design)이 맡았다.",
    overview: "Cazoo는 영국의 온라인 중고차 검색·거래 플랫폼이다. 2024년 6월 MOTORS에 인수된 이후 새로운 국면에 들어섰으며, 소비자가 손쉽게 중고차를 찾는 대표 플랫폼으로 자리매김하기 위해 거래 중심에서 소비자 중심의 검색 경험으로 전환을 추진했다.",
    identity: "Fold7(Fold7Design)이 맡은 리브랜드는 차량 측면 형상의 'A'와 검색을 상징하는 돋보기를 결합한 중심 아이콘을 핵심으로 삼아 검색 플랫폼으로의 전환을 시각화했다. 'Cazoo Sans'라는 전용 서체를 제작했고 커닝과 글자 형태를 정교하게 다듬어 로고를 재작도했다. 컬러 팔레트는 기존을 연상시키되 디지털 화면에 적합하도록 더 선명하게 보강했으며 민트와 오렌지가 핵심 색이다. 모션 디자인과 콜라주 스타일 이미지로 더 인간적이고 역동적인 무드를 더했다.",
  },
  "brandarchive-kit": {
    definition: "Kit은 크리에이터를 위한 이메일·마케팅 플랫폼으로, 2024년 ConvertKit에서 Kit으로 사명을 변경했다. 리브랜드는 Koto, 전용 서체는 Hot Type이 맡았다.",
    overview: "Kit은 크리에이터를 위한 이메일·마케팅 플랫폼으로, 2024년 ConvertKit에서 Kit으로 사명을 변경하고 프리미엄 도메인 kit.com을 확보했다. 변경은 2024년 7월 Craft + Commerce 컨퍼런스에서 발표되어 10월에 공식 적용되었으며, 단순 이메일 도구를 넘어 디지털 상품 판매·뉴스레터 스폰서십·추천 등을 포함하는 크리에이터용 종합 도구로의 확장을 표방했다.",
    identity: "리브랜딩은 디자인 스튜디오 Koto가 맡았고, 커스텀 서체 Kit Sans는 Hot Type(Marko Hrastovec, Mihael Šandro)이 제작했다. 로고는 K와 T 사이 네거티브 스페이스의 화살표로 크리에이터와 오디언스 간 가치 교환을, 중앙의 소문자 i로 핵심 주체인 크리에이터를 상징한다. 핵심 색상은 'Kit 블루'로 ConvertKit 초기의 파란색을 계승하면서 에너지와 신뢰감을 함께 의도했다. Kit Sans는 프랭클린 고딕 계열 골격의 콘덴스드·볼드 산세리프로, 안팎이 둥글게 처리되고 자간이 좁아 친근한 인상을 준다.",
  },
  "brandarchive-70-hudson-yards": {
    definition: "70 허드슨 야드는 맨해튼 허드슨 야드 지구에 들어서는 대형 오피스 타워로, Related Companies와 Oxford Properties가 공동 개발한다. 플레이스 브랜딩은 DNCO가 맡았다.",
    overview: "70 허드슨 야드는 맨해튼 허드슨 야드 지구에 들어서는 대형 오피스 타워로, 리레이티드 컴퍼니스(Related Companies)와 옥스퍼드 프로퍼티스(Oxford Properties)가 공동 개발하고 있다. 약 140만 제곱피트 규모의 클래스 AA급 오피스 건물로, 딜로이트가 80만 제곱피트 이상을 임차하는 핵심 입주사이며, 전량 전기·탄소중립을 지향하는 친환경 빌딩으로 설계됐다.",
    identity: "DNCO는 이 건물을 일과 현대적 라이프스타일 서비스를 결합한 '라이프스타일 오피스'로 규정하는 브랜드 전략을 전개했다. 로고는 건물의 특징인 핀(fin) 형태 파사드에서 착안한 베벨(beveled) 형태로 정밀함·고성능·격조 있는 서비스를 상징하며, 핀이 드리우는 그림자에서 파생된 보조 패턴으로 확장되어 깊이와 리듬을 더한다. 컬러 팔레트는 건축의 따뜻한 구리(copper) 톤에서 가져와 차가운 기업 이미지에서 벗어나려는 의도를 담았고, 사진가 라이언 라우리와 협업해 따뜻하고 정제된 비주얼 언어를 구축했다.",
  },
  "brandarchive-ding": {
    definition: "여기서 다룬 Ding은 영국 HomeServe가 만든 가정 수리·집수리 서비스 앱이다(아일랜드 모바일 충전사 아님). 트레이드맨과 고객을 잇는 마켓플레이스로, 브랜딩은 런던 스튜디오 Wildish & Co.가 맡았다.",
    overview: "Ding은 영국 HomeServe가 만든 가정 수리·집수리 서비스 앱으로, 트레이드맨과 고객을 연결하는 마켓플레이스형 서비스다. 2024년 말 무렵 출시되었으며, 런던 브랜딩 스튜디오 Wildish & Co.가 네이밍부터 브랜드 전략, 비주얼·버벌 아이덴티티, 일러스트, 모션까지 전체를 맡았다.",
    identity: "핵심은 'Ding'이라는 동명의 집 모양 마스코트로, 지붕에 얼굴이 있고 다리가 달린 의인화된 캐릭터이며 여러 표정과 Big·Odd·Urgent·Tricky 같은 '작업' 캐릭터, 30종 이상의 일러스트로 확장된다. 색상은 세 가지 톤의 오렌지를 주조색으로 하고 그린·옐로·블루를 보조색으로 써 에너지와 현대성을 강조하는 '도파민 디자인'을 표방한다. 서체는 Work Sans를 사용하며, 'Don''t wing it, Ding it' 같은 밝고 구어체적인 톤으로 딱딱한 업계 관행과 차별화했다.",
  },
  "brandarchive-peckish": {
    definition: "Peckish는 영국 Co-op이 선보인 지역 식료품 배달 앱·서비스 브랜드로, 동네 소규모 소매점을 지원하는 것을 핵심 전략으로 한다. 브랜딩은 런던 에이전시 SomeOne이 맡았다.",
    overview: "Peckish는 영국 Co-op(코업)이 선보인 지역 식료품 배달 앱·서비스 브랜드로, 대형 유통사에 맞서 동네 소규모 소매점을 지원하는 것을 핵심 전략으로 삼는다. 영국 디자인 에이전시 SomeOne(런던)이 전략·네이밍·아이덴티티·브랜드 UX를 담당했으며, 이름 'Peckish'는 사람들이 실제로 음식을 이야기하는 일상 표현에서 착안했다.",
    identity: "핵심 콘셉트는 로고·일러스트·디지털 인터페이스에서 한 입 베어 문 듯한 'bite(베어 물기)' 그래픽 장치로, 디지털 화면에서는 이 모션이 제품을 드러내는 방식으로 활용된다. 워드마크는 모기업 Co-op의 커스텀 헤드라인 서체를 기반으로 하되 전체를 이탤릭 처리하고 'P'와 'h' 글자를 미세하게 변형해 독자성을 부여했다. 컬러는 Co-op 특유의 블루를 유지해 모브랜드와의 연계를 분명히 했다.",
  },
  "brandarchive-iaac": {
    definition: "IAAC(Institute for Advanced Architecture of Catalonia)는 2001년 설립된 바르셀로나 소재 건축 교육·연구 기관이다. 리브랜드는 바르셀로나·샌프란시스코 스튜디오 Mucho가 맡았다.",
    overview: "IAAC(Institute for Advanced Architecture of Catalonia)는 2001년 설립된 바르셀로나 소재 건축 교육·연구 기관이다. 도시·건물·사회의 미래를 위한 지식을 생산하는 플랫폼을 표방하며, 기술·디자인·도시 생활의 교차점에서 재료 혁신, 디지털 패브리케이션, 생태 시스템, 로보틱스 등을 다룬다.",
    identity: "Mucho는 IAAC를 약어 중심에서 'Advanced Architecture Barcelona'라는 서술형 디스크립터를 가진 독립 브랜드로 전환하고, 미래를 프로토타이핑하는 허브이자 'architects of change'를 지향하는 기관으로 포지셔닝했다. 워드마크는 Optimo의 Clarendon Graphic을 대소문자·크기를 섞어 구성했고, 보조 서체로 Florian Karsten의 FK Grotesk를 사용했다. 컬러는 강렬한 핑크와 브루털리즘적 그레이에 레드·그린을 더해 기술과 자연을 환기하며, Fil Studio와 협업해 일관성 있는 비주얼을 생성하는 커스텀 제너러티브 도구를 개발했다.",
  },
  "brandarchive-bastian-beach": {
    definition: "Bastian Beach는 스페인 바르셀로나 바르셀로네타 해변에 2024년 개장한 고급 비치클럽이다. 브랜딩은 바르셀로나 스튜디오 Mucho가 맡았다.",
    overview: "Bastian Beach는 스페인 바르셀로나 바르셀로네타(산세바스티안) 해변에 새로 조성된 고급 비치클럽으로, 2024년 7월 개장했다. 도심 바로 옆 해변이라는 입지와 식음 경험을 핵심으로 내세우며, 브랜딩은 바르셀로나 스튜디오 Mucho가 맡았다.",
    identity: "Mucho는 프로젝트가 진행되는 동시에 브랜드를 처음부터 구축하며, '해방과 축하(liberation and celebration)'를 주제로 Bastian이라는 인물의 신화와 전설을 새로 지어내는 스토리텔링 전략을 택했다. 작업 범위는 브랜드 아이덴티티·전략·비주얼 언어·일러스트레이션·디지털이며, 일러스트레이션은 Victoria Diaz가 담당했고 서체는 Commercial Type의 Ergon을 사용했다. 로고의 구체적 형태와 컬러 팔레트는 공개 자료로 확인되지 않는다.",
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
