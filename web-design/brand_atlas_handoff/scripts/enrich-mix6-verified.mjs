// Batch 18: WEB-VERIFIED content. Agency pages + design press (Wolff Olins, Turner
// Duckworth, Collins, Porto Rocha, Pentagram, Mother Design, Nomad, Seachange;
// Brand New/Creative Review/Design Week/Creative Boom/BP&O/Dieline/It's Nice That).
// Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-instacart": {
    definition: "인스타카트(Instacart)는 2012년 설립된 북미 식료품 배송·기술 기업으로, 제휴 매장에서 상품을 대신 구매해 배달한다. 2022년 새 아이덴티티는 Wolff Olins와 사내 스튜디오가 맡았다.",
    overview: "인스타카트(Instacart)는 2012년 설립된 북미 식료품 배송·기술 기업으로, 사용자가 주문한 상품을 제휴 매장에서 대신 구매해 배달한다. 750곳이 넘는 소매 파트너와 수천 개 소비재 브랜드와 연계해 운영하며, 식료품을 넘어 뷰티·생활용품 등으로 카테고리를 확장해 왔다.",
    identity: "2022년 인스타카트는 Wolff Olins와 사내 크리에이티브 스튜디오 협업으로 새 아이덴티티 시스템을 선보였으며, 핵심 콘셉트는 효율적 쇼핑과 정서적 만족을 결합한 'Shop+Savor(쇼핑하고 음미하다)'이다. 상징인 당근은 동적 심볼로 재해석되어, 잎 부분이 화살표로 기능해 카트에 무엇이든 담을 수 있음을 보여주고 뿌리의 부드러운 곡선은 '음미'를 표현한다. 타이포그래피로는 디자이너 Ryan Bugden과 함께 효율을 상징하는 Instacart Sans와 식욕을 자극하는 Instacart Contrast 두 개의 가변 글꼴 패밀리를 제작했고, 색상 팔레트는 음식에서 착안한 'Kale'(녹색)·'Turmeric'(노랑)·'Guava'(분홍) 등으로 구성된다.",
  },
  "brandarchive-sprite-2026": {
    definition: "스프라이트(Sprite)는 코카콜라가 1961년 선보인 레몬·라임 향 무카페인 탄산음료다. 2022년 첫 글로벌 통합 비주얼 시스템은 코카콜라 사내팀과 Turner Duckworth가 맡았으며, 같은 해 상징적 초록 페트병을 투명 페트로 전환하기 시작했다.",
    overview: "스프라이트(Sprite)는 코카콜라가 1961년 선보인 레몬·라임 향 무카페인 탄산음료로, 전 세계 190개국 이상에서 판매되는 코카콜라의 주력 브랜드 중 하나다. 2022년 코카콜라는 60여 년간 이어온 상징적인 초록색 페트병을 북미부터 투명 페트(clear PET)로 전환하기 시작했는데, 이는 재활용 과정에서 색이 있는 페트가 분리·다운사이클되는 문제를 줄이기 위함이다.",
    identity: "2022년 5월, 스프라이트는 코카콜라 사내 디자인팀과 Turner Duckworth의 협업으로 첫 글로벌 통합 비주얼 시스템을 공개했으며, 핵심 방향은 단순성과 명료함으로 브랜드를 본질만 남기는 것이었다. 로고는 기존 별 모양(스타버스트) 테두리를 워드마크에서 떼어내 병뚜껑 등으로 옮기고, 워드마크를 새로운 수평 기준선에 정렬했으며, 'r i t' 글자 상단을 연결해 유려한 흐름을 만들었다. 그래픽은 밝은 초록을 바탕으로 한 통합 팔레트를 쓰고 제로 슈거에는 검정을 더했으며, 헤드라인용으로 Aktiv Grotesk 기반 커스텀 디스플레이 웨이트 'Refraktiv'를 개발했다.",
  },
  "brandarchive-san-francisco-symphony": {
    definition: "샌프란시스코 심포니는 1911년 창단된 미국 캘리포니아의 오케스트라로, 데이비스 심포니 홀을 본거지로 한다. 음악감독 에사페카 살로넨 취임에 맞춘 2022년 리브랜딩은 스튜디오 Collins가 맡았다.",
    overview: "샌프란시스코 심포니(San Francisco Symphony)는 1911년 창단된 미국 캘리포니아주 샌프란시스코의 오케스트라로, 데이비스 심포니 홀을 본거지로 활동한다. 25년간 음악감독을 맡은 마이클 틸슨 토머스가 2020년 물러나고 핀란드 출신 지휘자 겸 작곡가 에사페카 살로넨이 음악감독으로 취임하면서 새 예술적 방향에 맞춘 브랜드 개편이 추진되었다.",
    identity: "2022년 디자인 컨설팅사 Collins가 새 비주얼 아이덴티티를 선보였으며, 클래식 음악을 동시대적이고 유의미한 예술로 재정의하는 것을 핵심 콘셉트로 삼았다. 핵심은 소리와 음악에 반응하는 반응형 가변 폰트(variable font) 시스템으로, 글자가 악보의 음표처럼 위아래로 움직이며 형태를 바꾸도록 설계되었고, Collins는 파운드리 Dinamo와 협업해 자사 서체 ABC Arizona에 기반한 가변 세리프 서체를 제작했다. 마이크로 녹음한 소리에 맞춰 서체가 움직이는 포스터를 생성하는 폰트 모듈레이터 도구도 함께 만들어졌으며, 색상은 흑백의 격식과 베이 에어리어 지역 풍경에서 영감을 받은 동시대적 팔레트를 병치했다.",
  },
  "brandarchive-vevo": {
    definition: "Vevo는 2009년 출범한 뮤직비디오 배급 네트워크로, 음반사 제작 뮤직비디오를 다양한 플랫폼에 유통한다. 2021년 리뉴얼은 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "Vevo는 2009년 출범한 뮤직비디오 배급 네트워크로, 음반사들이 제작한 뮤직비디오를 다양한 플랫폼과 채널에 유통하는 사업을 운영한다. 워드마크 자체는 널리 알려져 있었으나 브랜드 전반에 대한 인지가 상대적으로 약하다는 과제를 안고 있었다.",
    identity: "2021년 Porto Rocha가 진행한 리뉴얼은 '모션 우선(motion-first)'과 아티스트 중심을 핵심으로, 음악과 뮤지션을 전면에 내세워 정적인 상태에서도 통하는 동적 시스템을 구축했다. 기존의 인지도 높은 워드마크는 유지하되, 텍스트·이미지·영상을 담는 모듈형 그래픽 블록 시스템을 도입해 적용 범위를 편집(에디토리얼) 영역까지 확장했다. 서체는 스위스 활자 주조소 Optimo의 François Rappo가 디자인한 산세리프 'Plain'을 사용해 로고의 기하학적 형태와 조화를 이루도록 했고, 색상은 유연한 팔레트의 톤 변주로 정보 위계를 지원하며 음악 장르를 구분하는 단서로도 활용된다.",
  },
  "brandarchive-moth-drinks": {
    definition: "MOTH는 'Mix Of Total Happiness'의 약자인 영국의 프리미엄 RTD 캔 칵테일 브랜드로, '호텔 바 수준의 칵테일을 캔에서'를 표방한다. 2021년 아이덴티티는 Pentagram이 맡았다.",
    overview: "MOTH는 영국의 프리미엄 RTD(ready-to-drink) 캔 칵테일 브랜드로, 'Mix Of Total Happiness'의 약자다. 칵테일 애호가 Rob Wallis와 Samuel Hunt가 설립했으며, '호텔 바 수준의 칵테일을 캔에서 바로' 제공한다는 콘셉트로 2021년 영국 프리미엄 식료품 체인 Waitrose를 통해 선보였다.",
    identity: "2021년 출시에 앞서 Pentagram 파트너 Harry Pearce와 Naresh Ramchandani가 브랜드명·스토리·철학·비주얼 아이덴티티를 함께 구축했다. 핵심은 나방을 기하학적으로 재해석한 심벌로, 겹쳐진 옵아트(op art)풍 구성을 통해 신비롭고 오해받는 나방의 본성을 표현하며 화면에서 가볍게 날갯짓하는 듯한 인상을 준다. 타이포그래피는 Gradient Type의 PolySans Slim을 전부 대문자로 사용해 심벌을 보완했고, 컬러는 캔마다 각 칵테일을 직접 반영하는 강렬하면서도 절제된 색을 적용했다. 이후 이커머스 사이트 리뉴얼과 디지털 디자인 시스템은 Neverbland가 담당했다.",
  },
  "brandarchive-nuud": {
    definition: "Nuud는 영국 스타트업의 식물성·무플라스틱·생분해성 친환경 껌 브랜드로, 천연 수액(치클) 기반 껌을 표방한다. 2021년 아이덴티티는 Mother Design이 맡았다.",
    overview: "Nuud는 영국 스타트업의 식물성·무플라스틱·생분해성 친환경 껌 브랜드로, 식음료 섹터에 속한다. 합성 폴리머로 만든 기존 껌의 대안으로 지속가능하게 채취한 천연 수액(치클) 기반 껌을 표방하며, 창업자 Keir Carnie와 Mother의 인큐베이터 조직 Broody가 함께 출범시켰다. 2021년 Mother Design이 브랜드 아이덴티티를 맡았다.",
    identity: "항의 피켓(protest sign)에서 영감을 받은 대담하고 반항적이면서도 유쾌한 콘셉트로, 'chew plants, not plastic!(플라스틱 말고 식물을 씹어라)'라는 거침없는 슬로건과 '두려움 없고 재미있고 투명하며 친환경적'이라는 핵심 정서를 축으로 한다. 활짝 웃는 입 형태에서 출발한 큼직한 로고와 입·껌 형태를 닮은 둥글둥글한 전용 서체를 사용했고, 성중립 마스코트 Charlie(일러스트레이터 Daye Kim 디자인)를 더해 지속가능성 메시지를 친근하게 전달한다. 컬러 팔레트는 맛별로 페퍼민트는 파랑, 스피어민트는 초록, 베리는 분홍의 세 톤을 쓰며 패키지를 작은 빌보드처럼 다뤘다.",
  },
  "brandarchive-ceria": {
    definition: "Ceria는 미국의 Ceria Brewing Company로, Blue Moon 브루마스터 Keith Villa 박사가 설립해 무알코올 크래프트 맥주와 카나비스(THC) 인퓨즈드 무알코올 맥주를 만든다. 2022년 아이덴티티는 Mother Design이 맡았다.",
    overview: "Mother Design이 2022년 작업한 Ceria는 미국의 Ceria Brewing Company로, Blue Moon 브루마스터 Keith Villa 박사와 아내 Jodi가 설립한 가족 운영 양조 회사다. 무알코올(AF) 크래프트 맥주와 카나비스(THC) 인퓨즈드 무알코올 맥주를 만드는 음료 브랜드다.",
    identity: "콘셉트는 '유산과 미래주의(legacy and futurism)'의 균형으로, 회사명의 어원인 농업·곡물의 여신 케레스(Ceres)를 핵심 심볼로 삼아 단순화된 형태로 표현했다. 케레스는 AF 라인에는 얼굴 측면(portrait), THC 인퓨즈드 라인에는 전신(full figure) 형태로 구분 적용되며, 아이코노그래피는 밀의 꽃차례에서 착안한 잎 형태 요소로 구성된다. 워드마크는 전통적 영향과 미래지향적 디테일을 결합해 클래식과 모던 사이의 균형을 노렸고, 색상 팔레트는 밝고 정제된 톤으로 제품별로 대체로 모노크롬에 가깝게 운용된다.",
  },
  "brandarchive-sing-king": {
    definition: "싱 킹(Sing King)은 노래방(가라오케) 콘텐츠를 다루는 유튜브 채널이자 온라인 가라오케 플랫폼으로, 가라오케 부문에서 유튜브 최다 검색 브랜드로 소개된다. 아이덴티티는 런던 스튜디오 Nomad가 맡았다.",
    overview: "싱 킹(Sing King)은 노래방(가라오케) 콘텐츠를 다루는 유튜브 채널이자 온라인 가라오케 플랫폼으로, 가라오케 부문에서 유튜브 최다 검색 브랜드로 소개된다. 누적 수십억 회 조회수와 월간 수천만 명 이용자 규모로 보도되며, 전 세계 이용자를 잇는 공통점은 '함께 노래하는 즐거움'으로 설명된다.",
    identity: "런던 소재 디자인 스튜디오 Nomad가 맡은 작업으로, 문화적 장벽을 넘는 보편적 비주얼 아이덴티티를 목표로 가라오케의 기쁨·해방감·흥분·연대감을 시각화했다. 워드마크와 보조 서체로 Sharp Grotesk를 사용하고, 'RGBOMG'로 표현된 강렬하고 폭넓은 컬러 팔레트, 펠트펜 같은 굵은 외곽선, 스티커 소재감을 살린 적층·레이어링 요소, 일관된 모션 거동으로 시스템을 구성했다. 디지털 중심 브랜드 특성에 맞춰 색·모션·형태를 강하게 끌어올린 점이 핵심이다.",
  },
  "brandarchive-mama-mexa": {
    definition: "마마 멕사(Mama Mexa)는 뉴질랜드 오클랜드 기반의 팝업 타케리아(멕시코식 타코 푸드) 브랜드다. 2022년 브랜드 작업은 스튜디오 Seachange가 맡았다.",
    overview: "마마 멕사(Mama Mexa)는 뉴질랜드 오클랜드(Auckland)를 기반으로 한 팝업 타케리아(taqueria), 즉 멕시코식 타코 푸드 브랜드다. 빠르고 건강한 패스트푸드를 표방하며, 2022년 디자인 스튜디오 Seachange가 브랜드 작업을 수행했다.",
    identity: "Seachange는 전형적인 '멕시코 클리셰'를 피하고 멕시코의 색채 짙은 문화와 토착 식물·꽃 문화에서 영감을 얻는 전략을 택했다. 핵심은 각 글자가 너비가 다른 꽃잎(petal)들로 구성되어 '꽃이 만개한(full flora)' 인상을 주는 화려한 커스텀 디스플레이 타입페이스이며, 이것이 워드마크이자 개별 레터로 다양하게 전개된다. 강렬한 레드 컬러가 주조색으로 사용되었고, 보조 서체로 Founders Grotesk가 짝지어졌으며 팝업 특성상 대형 인쇄물을 주요 메시지 매체로 활용했다.",
  },
  "brandarchive-the-wool-pot": {
    definition: "더 울 팟(The Wool Pot)은 100% 재활용 뉴질랜드 양모로 만든 완전 생분해성 화분을 만드는 뉴질랜드 친환경 브랜드로, 원예 산업의 플라스틱 화분을 대체하는 것을 목표로 한다. 브랜드는 스튜디오 Seachange가 맡았다.",
    overview: "더 울 팟(The Wool Pot)은 뉴질랜드의 친환경 혁신 브랜드로, 100% 재활용 뉴질랜드 양모로 만든 완전 생분해성 화분을 만든다. 세계 최초를 표방하는 이 제품은 원예 산업의 플라스틱 화분을 대체하는 것을 목표로 하며, 흙 속에서 흔적 없이 분해된다. 즉 일반 양모 소비재가 아니라 원예·지속가능성 분야의 제품 브랜드다.",
    identity: "Seachange는 양의 얼굴과 화분으로 동시에 읽히는 상징적 캐릭터를 핵심 로고로 만들었으며, 눈은 씨앗을, 바깥 양모 형태는 꽃을 암시한다. 단색을 양화(positive)와 음화(reversed)로 함께 사용해 흑백 양을 은유하며, 가라앉은 그린과 그레이 팔레트로 소박하고 흙냄새 나는 분위기를 유지한다. 타이포그래피는 Grilli Type의 Walsheim 서체를 사용해 인간적이면서도 정교한 기하학적 인상을 주며, '울리(woolly)'한 외곽 형태가 메시지와 아이콘을 담는 프레임으로 확장되어 패키징·태그·제품 사진 전반에 일관된 캐릭터를 부여한다.",
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
