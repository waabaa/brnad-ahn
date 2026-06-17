// Batch 24: WEB-VERIFIED content (1970s-80s design classics).
// Cross-checked across 2+ independent sources (Sussman/Prejza + Olympics + PBS,
// Karl Gerstner refs + swissinfo, Lubalin archives + ASICS official, Pentagram +
// Lucas history, Storm Type Foundry + Fonts In Use, Nippon Design Center + JP Wikipedia).
// Hallucination guards applied (verified by research agents):
//  - LA1984: "Festive Federalism" environmental look = Sussman/Prejza + Jerde;
//    "Stars in Motion" EMBLEM = Robert Miles Runyan & Associates (NOT Sussman).
//  - Swissair: Karl Gerstner, Futura(display)+Times(text), cross-in-rhomboid, cinnabar red.
//  - ASICS: wordmark by Herb Lubalin + Alan Peckolick (1977), PAOS commissioned; the
//    spiral mark is 1992 (separate) -> not conflated. Name = Anima Sana In Corpore Sano.
//  - Lucas: Pentagram 1975, Colin Forbes & Alan Fletcher (NOT Kurlansky); British
//    auto-electrical Lucas Industries (NOT Lucasfilm).
//  - Prague Metro: Jiří Rathouský designed the "Metron" typeface + wayfinding (1970~);
//    sole "M" logo attribution unverified -> not asserted.
//  - Expo '75: symbol/emblem by Kazumasa Nagai (NOT Kamekura; Kamekura did the mascot).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-la-'84": {
    definition: "LA 1984(LA '84)는 1984년 로스앤젤레스 하계올림픽의 브랜드로, 데버라 서스먼의 스튜디오가 'Festive Federalism'이라는 환경 그래픽 체계를 만든 것으로 유명하다.",
    overview: "LA 1984(LA '84)는 1984년 로스앤젤레스 하계올림픽의 브랜드다. 이 대회는 근대 올림픽 이래 사실상 국가 자금 없이 민간 자본으로 치러진 첫 대회로, 대부분 기존 시설을 임시로 활용해야 했다. 흩어진 베뉴를 값싸고 대담하게 하나로 묶기 위해 데버라 서스먼과 폴 프레자의 스튜디오(Sussman/Prejza)가 건축가 존 저드와 함께 환경 그래픽 'Look of the Games'를 총괄했다.",
    identity: "'축제적 연방주의(Festive Federalism)'로 불린 이 체계는 성조기의 별과 줄무늬를 비전통적 색채와 결합해 남부 캘리포니아의 다문화성을 표현했다. 마젠타·버밀리언·아쿠아·크롬 옐로를 중심으로 한 열한 가지 색 팔레트와, 소노튜브(골판지 원통 기둥)·컬러 비계·기둥·배너 같은 임시 '부품 키트(kit-of-parts)'로 28개 베뉴 전역을 변환했다. 한편 별 셋과 수평 속도선으로 이뤄진 'Stars in Motion' 엠블럼은 환경 디자인과 별개로 디자인 회사 로버트 마일스 러년 어소시에이츠가 맡았다.",
  },
  "brandarchive-swissair-1978": {
    definition: "스위스에어(Swissair)는 스위스의 옛 국적 항공사로, 1978년 디자이너 카를 게르스트너가 체계적인 코퍼레이트 아이덴티티를 디자인했다.",
    overview: "스위스에어(Swissair)는 스위스의 옛 국적 항공사다. 함대 현대화와 1981년 창립 50주년을 앞두고, 프로그램적·체계적 디자인의 선구자로 평가받는 스위스 디자이너 카를 게르스트너(Karl Gerstner)가 1978년 새 로고와 비주얼 아이덴티티를 디자인했다.",
    identity: "게르스트너는 로고를 손으로 그리는 대신 활자로 조판해, 그 서체를 그대로 기업 전용서체로 쓸 수 있게 했다. 디스플레이에는 '젊고 역동적'이라는 평가를 받은 푸투라(Futura) 볼드를, 작은 본문에는 타임스(Times)를 사용했다. 별도 심볼을 만드는 대신 항공기 꼬리날개에 늘 있던 스위스 십자를 마름모(평행사변형) 안에 배치해 꼬리날개를 연상시키고 국적 항공사로서의 정체성을 강조했으며, 기존의 차가운 빨강을 따뜻한 진사색(cinnabar)으로 옮겼다. 새 로고는 1979년부터 인쇄물과 기체에 단계적으로 적용됐다.",
  },
  "brandarchive-asics": {
    definition: "아식스(ASICS)는 1977년 일본에서 설립된 스포츠용품 기업으로, 사명은 라틴어 'Anima Sana In Corpore Sano(건강한 신체에 건강한 정신)'의 머리글자다. 워드마크는 허브 루발린과 앨런 페콜릭이 디자인했다.",
    overview: "아식스(ASICS)는 오니츠카 타이거 등 세 회사의 대등한 합병으로 1977년 설립된 일본의 종합 스포츠용품 기업이다. 사명은 로마 시인 유베날리스의 구절에서 따온 라틴어 'Anima Sana In Corpore Sano', 즉 '건강한 신체에 건강한 정신'의 머리글자다. 국제 시장 진출을 위해 일본 디자인 스튜디오 PAOS가 코퍼레이트 아이덴티티를 수주하고, 워드마크는 미국 디자이너 허브 루발린과 앨런 페콜릭에게 위촉했다.",
    identity: "루발린과 페콜릭이 1977년 디자인한 워드마크는 다섯 글자를 모두 소문자로 두고 오른쪽으로 기울여 글자들이 긴밀히 붙은 하나의 연속된 동적 형태를 이룬다. 스크린 프린팅이나 자수 같은 실용적 적용을 위해 둥근 종단을 사각 종단으로 바꾼 변형도 만들어졌다. 흔히 함께 떠올리는 나선형(스파이럴) 심볼은 1992년에 등장한 별개의 후대 요소로, 1977년 워드마크와는 구별된다.",
  },
  "brandarchive-lucas": {
    definition: "루카스(Lucas Industries)는 영국 버밍엄의 자동차 전장·부품 기업으로, 1975년 디자인 스튜디오 펜타그램이 'Lucas Diagonal'을 핵심으로 한 코퍼레이트 아이덴티티를 디자인했다.",
    overview: "루카스(Lucas Industries)는 1875년 조지프 루카스의 특허에서 출발한 영국 버밍엄의 자동차 전장·부품 기업으로, 한때 영국 자동차 전기 분야에서 사실상 독점적 지위를 누렸다. 1975년 사명을 조지프 루카스에서 루카스 인더스트리스로 바꾸면서, 난립한 자회사·상표를 단일 이미지로 통합하기 위해 디자인 스튜디오 펜타그램에 새 아이덴티티를 의뢰했다. 작업은 창립 파트너 콜린 포브스와 앨런 플레처가 맡았다.",
    identity: "핵심은 좌하단에서 우상단으로 향하는 45도 띠 'Lucas Diagonal'로, 가운데에 L자 직각 절개가 들어간다. 이 띠는 동일한 정사각형 스무 개로 구성돼 세 가지 로고 변형을 파생시키고, 수직·수평으로 확장돼 패키징과 사이니지에 대응하는 시스템형 아이덴티티를 이룬다. 전용 서체 'Lucas Alphabet'은 매슈 카터가 디자인했으며, 기업색으로 'Lucas Green'을 사용해 전사 자료 전반에 적용했다.",
  },
  "brandarchive-prague-metro": {
    definition: "프라하 지하철(Pražské metro)은 1974년 개통한 체코의 지하철로, 디자이너 이르지 라토우스키가 전용 서체 'Metron'과 통합 안내 체계를 디자인했다.",
    overview: "프라하 지하철(Pražské metro)은 사회주의 체코슬로바키아 시기인 1974년 5월 C선 개통으로 운행을 시작한 체코의 지하철이다. 프라하 교통공사의 의뢰로 체코 타이포그래퍼 이르지 라토우스키(Jiří Rathouský)가 1970년 위촉돼 1970~1974년에 걸쳐 전용 서체와 역별 시각 디자인, 통합 정보·안내 체계를 설계했다.",
    identity: "체계의 핵심은 라토우스키가 지하철 정보 시스템 전용으로 직접 설계한 산세리프 서체 'Metron'이다. 혼잡한 승강장에서도 잘 띄어 읽히는 가독성('noticeability')이 핵심 설계 의도였다. Metron은 1973년 매뉴얼에 처음 공개된 뒤 작가의 감수 아래 A선과 C선에 전면 적용됐으나, 1985년 이후 점차 교체돼 현재는 일부 역의 금속 글자 형태로만 남아 있다. 이 서체는 2004년 디지털로 복원됐고, 2014년 라토우스키 탄생 90주년에 맞춰 굵기와 문자 지원이 확장됐다.",
  },
  "brandarchive-expo-75": {
    definition: "엑스포 '75(Expo '75)는 1975년 오키나와에서 열린 국제해양박람회로, 심볼마크는 그래픽 디자이너 나가이 카즈마사가 디자인했다.",
    overview: "엑스포 '75(Expo '75)는 1972년 오키나와의 일본 본토 복귀를 기념해 1975년 오키나와에서 열린 국제해양박람회로, '바다 — 그 바람직한 미래'를 주제로 삼았다. 11명의 정상급 디자이너가 참여한 지명 컴페티션을 거쳐, 심볼마크는 그래픽 디자이너 나가이 카즈마사(永井一正)의 안이 1972년 선정·발표됐다. 마스코트 마크 '오키짱'은 도쿄 1964 올림픽 엠블럼으로 유명한 가메쿠라 유사쿠가 맡아, 두 거장이 역할을 나눠 참여했다.",
    identity: "심볼마크는 호쿠사이풍의 일본적 파도를 세 개 연속으로 표현한 형태다. 흰 파도선을 경계로 위는 하늘의 청색, 아래는 바다의 짙은 남색을 두어 넓은 바다와 하늘을 표현했다. 나가이는 '둘로는 넓은 바다를 표현하기에 부족하고 넷으로는 약해진다, 연속을 상상하게 하는 셋이 꼭 알맞다'고 설명했다. 박람회 포스터는 린파 양식의 전통 파도와 해양 사진을 결합해 일본 특유의 바다를 세계에 알리고 오키나와 부흥의 기반이 되도록 제작됐다.",
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
