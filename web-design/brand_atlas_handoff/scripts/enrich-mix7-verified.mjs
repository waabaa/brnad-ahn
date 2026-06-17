// Batch 19: WEB-VERIFIED content. Agency pages + design press (jkr/Colophon, Collins/
// Sharp Type, Commission, Pentagram, Ragged Edge, Paul Belford, Heydays, Seachange,
// Order, Freytag Anderson; Brand New/Creative Review/Design Week/Creative Boom/BP&O/
// Dieline/It's Nice That). Unverified colors/type not asserted. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-dunkin": {
    definition: "던킨(Dunkin')은 1950년 미국 매사추세츠에서 시작된 커피·도넛 체인이다. 2018년 이름의 '도넛(Donuts)'을 떼어 '던킨'으로 단순화한 리브랜딩은 jkr이 Colophon과 함께 맡았다.",
    overview: "던킨(Dunkin')은 1950년 미국 매사추세츠주 퀀시에서 문을 연 커피·도넛 체인으로, 창업자 윌리엄 로젠버그가 1948년 시작한 '오픈 케틀(Open Kettle)'을 모태로 한다. 미국 전역과 해외에 걸친 대형 프랜차이즈로 성장했으며, 도넛뿐 아니라 커피와 아침 메뉴를 핵심으로 내세운다.",
    identity: "2018년 9월 발표되어 2019년 1월부터 적용된 리브랜딩에서 이름의 '도넛(Donuts)'을 떼어내고 '던킨(Dunkin')'으로 단순화했으며, 이 작업은 jkr(Jones Knowles Ritchie)가 BBDO New York, Arc Worldwide와 함께 진행했다. 1973년 도입된 핑크·오렌지 색상과 글자 스타일의 헤리티지는 유지하되 2002년 추가됐던 커피컵 그래픽을 제거하고 굵은 라운드 산세리프 워드마크로 정리했다. jkr은 Colophon에 커스텀 서체 제작을 의뢰했고, 그 결과물은 Dunkin Sans와 Dunkin Serif로 구성되며 아랍어·키릴 로고타입도 동반한다.",
  },
  "brandarchive-dropbox": {
    definition: "드롭박스는 2007년 설립된 클라우드 스토리지·파일 동기화 서비스로, 협업 워크스페이스로 사업을 확장해 왔다. 2017년 약 10년 만의 대규모 리브랜딩은 스튜디오 Collins가 사내팀과 함께 맡았다.",
    overview: "드롭박스는 2007년 드루 휴스턴과 아라시 페르도시가 MIT 재학 중 설립한 클라우드 스토리지·파일 동기화 서비스로, 여러 기기와 위치에서 파일을 자동 동기화하고 공유할 수 있게 한다. 이후 단순 파일 저장을 넘어 팀 협업과 워크스페이스 영역으로 사업을 확장했으며, 현재 나스닥 상장사(DBX)로 본사는 샌프란시스코에 있다.",
    identity: "2017년 드롭박스는 디자인 스튜디오 Collins와 사내 브랜드 스튜디오가 협업해 약 10년 만의 대규모 브랜드 개편을 단행했고, 파일 보관 도구에서 창작과 협업의 열린 플랫폼이라는 방향으로 의미를 재설정했다. 로고는 동일한 다이아몬드 형태를 결합해 하나의 마크를 이루는 단순화된 열린 상자 형태로, 부분의 합 이상을 만드는 협업을 상징하도록 설계됐다. 전용 서체로 Sharp Type가 제작한 Sharp Grotesk를 폭넓게 도입하고 강렬한 컬러와 일러스트레이션을 결합했으며, 색상 위 색상 텍스트 등 과감한 표현은 디자인계에서 호불호가 크게 갈리는 반응을 낳았다.",
  },
  "brandarchive-fenty": {
    definition: "Fenty(펜티 메종)는 2019년 LVMH가 리한나와 함께 파리에서 선보인 럭셔리 패션 하우스로, 화장품 라인 Fenty Beauty와는 구별된다. 아이덴티티는 런던 스튜디오 Commission이 맡았다.",
    overview: "Fenty(펜티 메종)는 2019년 LVMH가 리한나(Rihanna)와 함께 파리에서 선보인 럭셔리 패션 하우스로, 화장품 라인인 Fenty Beauty와는 구별되는 별도의 레디투웨어 브랜드다. LVMH가 1987년 크리스찬 라크르와 이후 처음으로 새로 출범시킨 패션 하우스이며, 리한나는 LVMH 산하 메종을 창립한 첫 여성으로 기록됐다. 매장 없이 대부분을 온라인으로 판매하는 디지털 중심 전략을 표방했다.",
    identity: "런던의 Commission Studio가 리한나와 직접 협업해 브랜드 아이덴티티를 설계했으며, 핵심은 이름의 모든 글자를 격자형 기하 도형으로 엮은 모노그램 'The Maze'로, 럭셔리 하우스의 전통 모노그램을 회로(circuitry)나 그리스 키 문양을 연상시키는 현대적 형태로 재해석했다. 워드마크는 새로 그려졌는데, 획이 겹치는 'F'는 리한나의 필체를, 좌우 반전된 'N'은 Fenty Beauty 로고를 잇는 장치로 사용됐고, 전용 서체는 Grilli Type의 GT America Compressed Light를 변형했다. 색상은 바베이도스 주변 바다를 연상시키는 시안 블루를 배경색으로, 패키지에는 금박과 입체 다이아몬드 엠보싱을 적용했다.",
  },
  "brandarchive-openview": {
    definition: "OpenView는 미국 보스턴에 본사를 둔 벤처캐피털로, 소프트웨어 분야의 확장 단계 기업에 집중 투자하는 실무 밀착형 접근을 표방했다. 2016년 아이덴티티는 Pentagram(파트너 Natasha Jen)이 맡았다.",
    overview: "OpenView는 미국 보스턴에 본사를 둔 벤처캐피털 회사로, 소프트웨어 분야의 확장 단계(expansion-stage) 기업에 집중 투자하고 성장을 돕는 실무 밀착형(핸즈온) 접근을 표방했다. 디자인 과정에서 투자팀 OpenView Invest, 지원팀 OpenView Grow, 사고 리더십 플랫폼 OpenView Learn처럼 행동 동사를 활용한 브랜드 아키텍처를 정립했다.",
    identity: "2016년 Pentagram이 진행했으며 담당 파트너는 나타샤 젠(Natasha Jen)이다. 핵심은 'OpenView Stencil'이라는 커스텀 스텐실 서체로, 글자에 사선·수평·수직 단절을 넣어 실용적이고 군더더기 없는(유틸리테리언) 인상을 주며 OV 모노그램을 보조 요소로 둔다. 컬러는 딥 블루를 주조색으로 밝고 낙관적인 보조색을 더했고(인쇄물에서 강하게, 온라인에서는 절제), 포지셔닝·톤앤매너부터 워드마크·아이콘 시스템·웹사이트·오피스 사이니지까지 포괄했다.",
  },
  "brandarchive-assembly": {
    definition: "여기서 다룬 Assembly는 영국 부동산 회사 Criterion Capital이 선보인 단기 숙박 호텔 브랜드로, 첫 지점을 런던 채링크로스에 열고 젊은 여행자를 겨냥했다. 브랜드는 런던 에이전시 Ragged Edge가 맡았다.",
    overview: "Ragged Edge가 2018년 작업한 Assembly는 영국 부동산 회사 Criterion Capital이 선보인 단기 숙박 호텔 브랜드로, 젊은 여행자와 밀레니얼을 겨냥했다. 첫 지점은 런던 채링크로스 로드에 문을 열었고, 객실은 TV·미니바 같은 부가시설을 덜어내고 침대·샤워·방음·와이파이·입지 같은 핵심 요소에 집중하는 방식으로 설계됐다.",
    identity: "핵심 콘셉트는 손님을 방 안에 머물게 하기보다 도시로 나가 탐험하도록 부추기는 'Get Up and Go'로, 일반 호텔의 안락함 지향에 반하는 포지셔닝이다. 로고는 세리프와 산세리프 형태를 뒤섞고 글자 폭이 불규칙하게 변하는 전용 서체로 구성되며, 브루탈리스트·고전적·그로테스크 형태가 공존하는 글립 세트로 묘사된다. 컬러는 다크 퍼플과 라이트 핑크를 코어로 두고 보색 쌍을 보조로 쓴 것으로 보도되며, 아트디렉션은 전문 사진가가 아닌 도시 거주자가 찍은 듯한 즉흥적·캔디드 사진을 활용했다.",
  },
  "brandarchive-new-chapter": {
    definition: "여기서 다룬 New Chapter는 글쓰기를 통한 상담을 돕는 영국의 '워드 테라피(word therapy)' 신생 서비스다. 2018년 아이덴티티는 Paul Belford Ltd가 맡았다.",
    overview: "여기서의 New Chapter는 출판사나 영양제 브랜드가 아니라 영국의 신생 '워드 테라피(word therapy)' 상담 서비스다. 글쓰기를 통해 감정과 경험을 표현하도록 돕는 문필 기반 상담 스타트업으로, 2018년 Paul Belford Ltd가 브랜드 아이덴티티를 작업했다.",
    identity: "핵심 로고는 책을 단순한 선으로 그려내되 그 형태가 앞으로 향하는 화살표가 되도록 설계해, 책장(글쓰기)과 전진·진전의 의미를 하나의 기호로 결합했다. 흑백 단색의 절제된 마크로, 단독으로 쓰거나 헬베티카(Helvetica)로 조판된 워드마크 'New Chapter'와 함께 사이니지·문구류에 적용됐다. 이 작업은 D&AD 2019에서 로고 부문 그래파이트 펜슬을 수상했다(크리에이티브 디렉터 Paul Belford).",
  },
  "brandarchive-aurlands": {
    definition: "Aurlands(Aurland Skofabrikk)는 1907년 시작된 노르웨이의 가장 오래된 수제화 공방으로, 1926년 세계 최초의 페니 로퍼를 만든 것으로 알려져 있다. 2019년 리뉴얼은 오슬로 스튜디오 Heydays가 맡았다.",
    overview: "Aurlands(Aurland Skofabrikk)는 1907년 노르웨이 송네피오르 인근 아우를란 마을에서 시작된, 노르웨이에서 가장 오래 운영 중인 수제화 공방이다. 창업자 Nils G. Tveranger가 1926년 세계 최초의 페니 로퍼를 만든 것으로 알려져 있으며, 이 페니 로퍼가 브랜드의 핵심 유산이다.",
    identity: "2019년 오슬로 스튜디오 Heydays가 브랜드를 리뉴얼하여, 지역 수제 제품에서 현대적 패션 브랜드로의 전환을 전통과 현대의 결합이라는 콘셉트로 풀어냈다. 워드마크는 타원형 테두리와 올캡스 서체로 정밀함을 유지했고, Ellmer Stefan과 협업한 전용 서체 'Aurlands Display'는 산세리프의 명료함에 가죽 형태에서 영감을 받은 곡선과 절단면을 더했다. 1926년부터 신발 안쪽에 노르웨이 10외레 동전을 넣던 전통을 참조한 숫자 10 아이콘이 도입됐고, 미표백 크라프트 보드와 Colorplan Adriatic Blue가 사용됐다.",
  },
  "brandarchive-we-compost": {
    definition: "We Compost는 뉴질랜드 오클랜드 기반의 상업용 퇴비화·음식물쓰레기 수거 서비스로, 매주 4만kg이 넘는 유기성 폐기물을 수거해 퇴비로 전환한다. 2019년 아이덴티티는 스튜디오 Seachange가 맡았다.",
    overview: "We Compost는 뉴질랜드 오클랜드를 기반으로 한 상업용 퇴비화·음식물쓰레기 수거 서비스로, 매주 4만kg이 넘는 유기성 폐기물을 수거해 매립을 막고 퇴비로 전환하는 것으로 알려져 있다. 약 7년간 운영되며 오클랜드를 대표하는 퇴비화 수거 업체로 자리 잡았다.",
    identity: "Seachange는 2019년경 진행한 이 작업에서, 잎사귀·재활용 기호 같은 흔한 친환경 상투형에서 벗어나 지렁이를 핵심 모티프로 삼아 누구나 친근하게 받아들일 수 있는 경쾌하고 현대적인 방향을 제시했다. 지렁이를 형상화한 로고와 함께 둥근 종단과 속파낸 원형으로 지렁이를 표현한 전용 디스플레이 서체 'Worms Display'를 개발했으며, 잘린 지렁이를 느낌표로 쓰는 등의 디테일이 특징이다. 컬러는 여러 톤의 녹색 계열을 사용하고 보조 서체로 Graphik을 함께 운용했으며, 이 작업은 D&AD 등에서 수상했다.",
  },
  "brandarchive-vessel-floats": {
    definition: "Vessel Floats는 미국 뉴욕 브루클린 그린포인트에 위치한 플로테이션(감각차단) 요법 스파·웰니스 시설로, 소금물 탱크의 무중력 부유 경험을 중심으로 한다. 아이덴티티는 뉴욕 스튜디오 Order가 맡았다.",
    overview: "Vessel Floats는 미국 뉴욕 브루클린 그린포인트(Greenpoint)에 위치한 플로테이션(flotation)·감각차단 요법 스파이자 웰니스 시설로, 소금물 탱크에서의 무중력 부유 경험을 중심으로 마음챙김과 휴식을 제공한다. 1950년대부터 존재해 온 감각차단 요법을 현대적 경험으로 재해석하는 것을 지향한다.",
    identity: "뉴욕 스튜디오 Order(파트너 Jesse Reed)가 약 2020년 로고·메뉴·명함·토트백·자수 셔츠·인테리어 사이니지를 포함한 아이덴티티 시스템을 디자인했다. 콘셉트는 부유의 가벼움과 인테리어의 수직적 목재 슬랫 건축 언어를 연결한 것으로, 단일 라인 굵기로 글자와 선을 잇는 미니멀한 선형 시스템과 대문자 타이포그래피를 사용했다. 로고타입은 수직으로 늘어나고 수축하며 부유를 표현하는 2행 구조로, 타입페이스는 Klim의 Untitled Sans를 적용했다. 보조 그래픽은 에른스트 클라드니의 소금-진동판 도형(Chladni figures)에서 영감받은 선형 패턴을 사용했다.",
  },
  "brandarchive-rapscallion-soda": {
    definition: "Rapscallion Soda는 스코틀랜드 글래스고에서 신선한 과일과 저당 레시피로 만드는 크래프트 소다(수제 청량음료) 브랜드다. 패키지·브랜딩은 글래스고 스튜디오 Freytag Anderson이 맡았다.",
    overview: "Rapscallion Soda는 스코틀랜드 글래스고에서 신선한 과일과 저당 레시피로 음료를 손수 만드는 크래프트 소다 브랜드다. 2016년 글래스고의 한 골목에서 수제 소프트드링크를 팔며 시작했고, 인공 원료 없이 더 맛있는 음료를 만든다는 목표를 내세운다. 2020년 무렵 고발스(Gorbals)의 철도 아치 공간으로 확장 이전했으며, 이 공간은 양조장이라기보다 과학 실험실에 가깝다고 묘사된다.",
    identity: "디자인 스튜디오 Freytag Anderson은 'Rapscallion(악동·장난꾸러기)'이라는 이름의 전복적·반항적 톤을 강화하고 전(全)천연 원료와 제조 이면의 과학적 접근을 동시에 전달하는 250ml 캔 패키지와 네이밍 전략을 개발했다. 비주얼은 멸균실처럼 정제된 레이아웃, 과감한 색 사용, 최소한의 타입 처리로 핵심 라인과 시즌 라인을 구분한다. 의도적으로 짧게 끝낸 라벨(short-stop label)이 캔의 금속 바탕을 그대로 노출시켜 임상적·과학적 제조 인상을 강조하며, 구체적 로고 서체명과 색상 값은 공개 자료로 확인되지 않는다.",
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
