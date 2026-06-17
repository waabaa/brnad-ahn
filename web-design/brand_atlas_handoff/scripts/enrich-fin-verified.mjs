// Batch 13: WEB-VERIFIED content. Agency pages + design press (Porto Rocha, Turner
// Duckworth, jkr, Manual, Studio Nari, Analogue, Gander, Earthling, Bond; Brand New/
// Creative Boom/Dieline/BP&O/It's Nice That/Marketing Dive). Unverified colors/type
// not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-robinhood-2024": {
    definition: "로빈후드(Robinhood)는 2013년 설립된 미국 핀테크 기업으로, 수수료 없는 주식·ETF 거래 앱으로 개인 투자자의 시장 접근성을 낮췄다. 2024년 리브랜딩은 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "로빈후드(Robinhood Markets)는 2013년 블라디미르 테네브와 바이주 바트가 설립한 미국 핀테크 기업으로, 수수료 없는(commission-free) 주식·ETF 거래를 모바일 앱으로 제공하며 개인 투자자의 시장 접근성을 낮춘 것으로 알려져 있다. 현재 나스닥에 HOOD로 상장돼 있으며 본사는 캘리포니아주 멘로파크에 있다.",
    identity: "2024년 뉴욕 스튜디오 Porto Rocha가 진행한 리브랜딩은 'fintech 동질화 속에서 less is more'라는 콘셉트로, 신생 도전자에서 성숙한 투자자를 겨냥한 금융 플랫폼으로의 진화를 표방했다. 상징인 깃털(feather) 마크는 단순화되어 그 안에 숨은 상승 화살표를 강조하도록 다듬어졌고 워드마크 글자꼴도 정돈되었다. 서체는 잉크트랩이 특징인 커스텀 산세리프 Robinhood Phonic과 헤드라인용 세리프 Martina Plantijn을 병용한다. 색상은 경쟁사들의 무지개식 팔레트에서 벗어나 블랙·화이트와 성숙한 중성색을 기조로 하고, 여기에 고유의 전기빛 옐로그린 'Robin Neon'을 새 강조색으로 더했다.",
  },
  "brandarchive-kleenex-2024": {
    definition: "클리넥스(Kleenex)는 1924년 출시된 킴벌리클라크의 미용 티슈 브랜드로, 일회용 페이셜 티슈 카테고리를 처음 만들었다. 출시 100주년인 2024년 글로벌 리브랜딩은 Turner Duckworth가 맡았다.",
    overview: "클리넥스(Kleenex)는 1924년 출시된 킴벌리클라크(Kimberly-Clark)의 미용 티슈 브랜드로, 일회용 페이셜 티슈 카테고리를 처음 만든 대표 브랜드다. 현재까지 티슈를 비롯한 개인 위생용품 라인을 글로벌 시장에서 전개하고 있다.",
    identity: "2024년 브랜드 출시 100주년을 맞아 Turner Duckworth가 글로벌 통합 비주얼 시스템을 새로 설계했으며, 시장마다 제각각이던 표현을 단일화하는 데 초점을 맞췄다. 핵심은 접힌 티슈를 연상시키는 왕관(crown) 형태의 컨테이너로, 1961년 솔 바스(Saul Bass)가 다듬은 클래식 스크립트 워드마크를 감싸 어느 매체에서나 가독성과 일관성을 보장하고 브랜드의 리더십을 상징한다. 타입 디자이너 Alec Tear, Lewis Macdonald와 함께 원본 스크립트의 뉘앙스를 살린 전용 서체 'Kleenex Serif'를 개발했고, 'Kleenex Blue'를 모든 접점의 주요 색상으로 표준화했다.",
  },
  "brandarchive-chime": {
    definition: "Chime은 미국의 핀테크 기업으로, 파트너 은행과 제휴해 모바일 앱 중심의 무수수료 입출금·저축 계좌를 제공하는 네오뱅크다. 2024년 리프레시는 jkr(Jones Knowles Ritchie)이 맡았다.",
    overview: "Chime은 미국의 핀테크 기업으로, 자체 은행이 아니라 파트너 은행과 제휴해 모바일 앱 중심의 무수수료(no-fee) 입출금·저축 계좌를 제공하는 네오뱅크다. 월 이용료·최소 잔액·당좌대월 수수료가 없는 구조와 미국 전역의 수만 개 ATM 무료 이용을 핵심으로 내세우며, 미국 최대 규모의 네오뱅크 중 하나로 성장했다.",
    identity: "2024년 jkr(Jones Knowles Ritchie)이 진행한 리프레시는 Chime의 두 핵심 접점인 카드와 앱을 'forward progress의 창(windows)'으로 규정하는 콘셉트를 제시했다. 상징적인 Chime 그린은 더 부드럽고 선명하게 다듬어 성장과 재정적 진전을 표현했고, 타이포그래피는 더 단순하면서도 친근한 인상을 주도록 정리됐으며 전용 서체 작업은 Colophon·Displaay 계열과의 협업으로 진행됐다. 또한 식물(성장)·자물쇠(보안) 등 단색 아이콘과 이모지를 본문에 통합하는 표현 체계를 도입했다.",
  },
  "brandarchive-pac-nyc": {
    definition: "PAC NYC(퍼렐먼 공연예술센터)는 뉴욕 세계무역센터 부지에 2023년 개관한 공연예술센터로, 9·11 이후 WTC 재건의 마지막 단계로 꼽힌다. 아이덴티티는 뉴욕 스튜디오 Porto Rocha가 맡았다.",
    overview: "PAC NYC(퍼렐먼 공연예술센터, Perelman Performing Arts Center)는 뉴욕 로어맨해튼 세계무역센터 부지에 자리한 공연예술센터로, 2023년 9월에 문을 열었다. 9·11 이후 진행된 세계무역센터 재건의 마지막 단계이자 문화적 정점으로 평가되며, 가변형 극장 공간을 갖춰 동시대 오페라부터 연극까지 다양한 공연을 수용한다.",
    identity: "뉴욕 기반 스튜디오 Porto Rocha가 네이밍·브랜드 전략·보이스 톤·비주얼 아이덴티티를 맡았다. 위에서 내려다보면 완벽한 정사각형으로 보이는 건축물의 큐브 형태를 출발점으로 삼아 정사각형을 아이덴티티의 핵심 도형으로 설정했고, 워드마크는 'PAC'와 'NYC' 세 글자씩 두 묶음을 위아래로 쌓아 단정한 정사각형을 이루도록 구성했다. 전용 디스플레이 서체 'PAC Display'는 파운드리 AllCaps와 협업해 건물 형태와 19세기 미국식 고딕 거리 간판 활자를 결합한 굵고 각진 레터폼으로 만들었다. 색상은 고정 팔레트 대신 사진과 강렬한 단색(오렌지·핑크·옐로 등)을 포맷·프로그램에 맞춰 유연하게 적용한다.",
  },
  "brandarchive-quilt": {
    definition: "Quilt는 화석연료 냉난방을 전기식 히트펌프로 대체하는 미국의 가정용 기후 기술 스타트업이다. 2024년 브랜드 아이덴티티는 스튜디오 Manual이 맡았다.",
    overview: "Quilt는 화석연료 기반 냉난방을 전기식 히트펌프 시스템으로 대체하는 미국의 가정용 기후(냉난방) 기술 스타트업이다. 방마다 개별 제어가 가능한 덕트리스 히트펌프 하드웨어와 소프트웨어를 결합한 주거용 시스템을 제공하며, 디자인 스튜디오 Manual이 2024년 브랜드 아이덴티티를 맡았다.",
    identity: "Manual은 'Better Climate by Design'이라는 콘셉트 아래, 정밀함과 인간미를 결합하고 미세한 대비와 캘리그래피적 느낌을 가진 커스텀 워드마크를 만들었으며 곡선과 개구부를 강조한 새로운 'Q'를 도입했다. 타이포그래피는 STK Bureau에서 파생한 Quilt Serif 서체를 UI와 앱에 사용했다. 또한 creative technologist Kiel Danger Mutschelknaus와 함께 공기 흐름을 모사한 Processing 기반의 제너러티브 타입 툴을, Kelsey Robinson과 함께 아이소메트릭 일러스트레이션을 제작했고, 컬러는 차분하면서도 동시대적인 절제된 팔레트를 채택했다.",
  },
  "brandarchive-living-things": {
    definition: "Living Things는 영국 런던 기반의 기능성 음료 브랜드로, 장 건강을 겨냥한 프리바이오틱/프로바이오틱 소다다. 브랜드 작업은 런던 스튜디오 Studio Nari가 맡았다.",
    overview: "Living Things는 영국 런던 기반의 기능성 음료 브랜드로, 장 건강(gut health)을 겨냥한 프리바이오틱/프로바이오틱 소다 제품이다. 저당·천연 원료를 내세우며 트렌디한 카페부터 일반 슈퍼마켓 매대까지 폭넓게 자리 잡는 것을 목표로 했고, 출시 첫해 The Grocer의 2024 라벨·패키지 디자인 부문을 수상하며 다수 시장으로 확장했다.",
    identity: "런던 디자인 스튜디오 Studio Nari가 브랜드 네이밍과 비주얼 전반을 맡아, 건강 효능을 앞세우는 통상적 카테고리 공식을 뒤집고 에너지와 재미를 먼저 내세우는 '장난스럽지만 기분 좋은(playfully irreverent)' 콘셉트를 설정했다. 워드마크는 둥근 모서리와 엉뚱한 디테일을 가진 맞춤형 레터링으로 글자 자체가 살아 움직이는 느낌을 주도록 설계했고, 서체는 Pangram Pangram의 Agrandir를 사용했다. 친근한 박테리아 군집을 연상시키는 일러스트 스티커와 해 모양 모티프, 강렬한 컬러 시스템으로 소셜·매장·신제품까지 유연하게 확장되도록 했다.",
  },
  "brandarchive-fibe": {
    definition: "Fibe는 영국 기반의 기능성 음료 브랜드로, 클래식 탄산음료 맛을 유지하면서 캔당 식이섬유 5g을 담은 '건강에 좋은 탄산음료'를 표방한다. 2024년 브랜드 작업은 스튜디오 Analogue가 맡았다.",
    overview: "Fibe는 영국 기반의 기능성 음료 브랜드로, 클래식한 탄산음료의 맛을 유지하면서 캔당 식이섬유 5g과 30kcal를 담은 '건강에 좋은 탄산음료'를 표방한다. 칼슘과 비타민 C를 더한 제품으로 소개되며, 디자인 스튜디오 Analogue가 2024년 브랜드 아이덴티티 작업을 맡았다.",
    identity: "Analogue는 Fibe를 위해 활기차고 'newstalgic(향수와 새로움을 결합한)' 브랜드 세계를 구축했으며, 작업 범위는 브랜드 아이덴티티·가이드라인·패키지·캔 렌더링·모션 그래픽·광고에 걸친다. 핵심 전략은 식이섬유 섭취를 무겁지 않고 즐겁게 만드는 것으로, 영양 관련 전문 용어를 배제하고 '부담 없이 더 이로운 탄산음료'로 포지셔닝했다. 로고의 구체적 형태와 서체·색상 팔레트 등 세부 시각 사양은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-mercado-famous": {
    definition: "Mercado Famous는 뉴욕에 기반을 둔 스페인 이베리코 햄·큐어드 미트 전문 식품 브랜드로, 고품질 스페인산 육가공품을 미국 시장에 소개한다. 브랜드 시스템은 브루클린 스튜디오 Gander가 맡았다.",
    overview: "Mercado Famous는 뉴욕에 기반을 둔 스페인 이베리코 햄(하몽)·큐어드 미트 전문 식품 브랜드로, 고품질 스페인산 육가공품을 미국 시장에 소개하는 것을 지향한다. 창업자는 카르멘 첸 우와 아론 루오이며, 스페인 전통에 뿌리를 두되 미국 시장을 겨냥한 샤퀴테리·델리 카테고리에 속한다.",
    identity: "브루클린의 브랜딩 스튜디오 Gander가 브랜드 시스템을 맡았다. 유럽의 정육점·델리카트슨이 단일 컬러를 일관되게 쓰는 점에서 착안해 대담한 로열 블루를 핵심 색으로 삼고 갈색·녹색·주황·흰색을 보조로 운용했다. 타이포그래피는 동시대 서체 GT Walsheim과 빈티지 소스 기반의 Jeff Levine 서체를 혼합해 바르셀로나 등 스페인 도시 간판을 연상시키는 커스텀 워드마크를 만들었으며, 전통과 현대를 잇는 진정성 있는 스페인 감성과 동네 시장의 따뜻함을 결합했다. 왕관(크라운) 모티프 로고 요소가 사용된다.",
  },
  "brandarchive-jaffa": {
    definition: "Jaffa는 영국 시장의 대표 시트러스(오렌지·감귤류) 과일 브랜드로, 최근 포도·멜론·파인애플 등으로 품목을 넓히고 있다. 2024년 리브랜딩은 영국 Earthling Studio가 맡았다.",
    overview: "Jaffa는 영국 시장의 대표 시트러스(오렌지·감귤류) 과일 브랜드로, 오렌지·감귤뿐 아니라 포도·멜론·파인애플 등으로 품목을 넓히고 있다. Earthling Studio가 2024년 9월 이 브랜드의 확장기와 디지털 강화를 겨냥해 아이덴티티와 패키지 전면 리브랜딩을 진행했다.",
    identity: "처음엔 기존 브랜드의 '근접 진화'를 요청받았으나 논의 끝에 더 과감하고 변혁적인 방향으로 전환했다. 워드마크는 아카이브 버전에서 영감을 받아 디지털 가독성을 위해 현대화했으며, 과일 스티커 유산을 암시하는 뜻에서 로고 라운델에 한 줄기의 'Jaffa 블루'를 넣었다. 타이포그래피는 과일의 통통함을 닮은 부드럽고 둥근 형태이고, 노랑·초록·파랑 색조를 더 밝고 선명하게 끌어올렸으며, 브루클린 일러스트레이터 Spencer Gabor가 'The Juice Crew' 캐릭터와 초현실적 과일 장면을 그렸다. 슬로건은 'Naturally joyful fruit'이다.",
  },
  "brandarchive-olo": {
    definition: "OLO는 부동산 개발사 Rize Alliance가 캐나다 메트로 밴쿠버에 추진한 38층·555세대 주거 개발 프로젝트다. 이름은 '존재의 느낌'을 뜻하는 핀란드어에서 따왔으며, 브랜딩은 스튜디오 Bond가 맡았다.",
    overview: "OLO는 모듈러·프리팹 주택이 아니라, 부동산 개발사 Rize Alliance Properties가 캐나다 메트로 밴쿠버에 추진한 38층 규모의 임대·분양 주거 개발 프로젝트로 555세대 규모다. 이름 OLO는 '존재의 느낌'을 뜻하는 핀란드어에서 따왔고, 메트로 밴쿠버의 자연과 연결된 유연한 삶을 표방한다.",
    identity: "Bond가 맡은 작업 범위는 브랜드 전략·아이덴티티·네이밍·브랜드 내러티브다. 콘셉트는 'A place to simply be'로, 거주자의 다양한 감정을 담되 단순·명료함을 유지하는 표현적이고 인간적인 비주얼과, 친근한 이웃처럼 대화적이면서 사생활을 존중하는 보이스를 핵심으로 한다. 인허가·사전판매·시공·입주 등 장기 단계 전반에 쓰일 수 있도록 유연성을 갖추도록 설계됐으며, 로고 형태와 서체·컬러 팔레트의 구체적 사양은 공개 자료로 확인되지 않는다.",
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
