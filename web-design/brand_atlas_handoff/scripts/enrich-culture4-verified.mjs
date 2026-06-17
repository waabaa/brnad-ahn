// Batch 22: WEB-VERIFIED content (Japanese/Turkish corporate identity).
// Cross-checked across 2+ independent sources (PAOS portfolio, Logo Histories,
// Fujitsu/Benesse/Abdi İbrahim official, Nippon Design Center refs, AGI, RIT
// Vignelli Center). Unverified details not asserted. No source fields.
// Hallucination guards applied (verified by research agents):
//  - Fujitsu: agency = "Praxcis" (not "Praxis"); 1988 design / 1989 adoption;
//    designer personal names omitted (weak source).
//  - Benesse: legal rename Fukutake -> Benesse was 1995 (philosophy adopted 1990);
//    multi-stage PAOS + Shin Matsunaga project, not a single 1990 event.
//  - Asahi: data's "PAOS" designer is WRONG -> actually Kazumasa Nagai /
//    Nippon Design Center, 1986. Corrected here.
//  - Kawasaki Steel: PAOS 1987 (not 1989).
//  - Zexel: PAOS 1991, renamed from Diesel Kiki (1990.7).
//  - Abdi İbrahim: Massimo Vignelli, 2008 (not 2006); correct name "Abdi İbrahim".
//  - SKIPPED (verification failed, no fabrication): Osaka 2008 emblem (Hakuhodo
//    unconfirmed), Maebashi Shinkin Bank (0 sources; bank dissolved 1994 merger).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-fujitsu": {
    definition: "후지쯔(Fujitsu)는 일본의 종합 IT·전자 기업으로, 1989년 글로벌화에 맞춰 적색 워드마크와 '인피니티 마크' 로고를 공식 채택했다. 로고는 디자인 에이전시 Praxcis가 1988년 제작했다.",
    overview: "후지쯔(Fujitsu)는 일본을 대표하는 종합 IT·전자 기업이다. 사업의 글로벌화에 발맞춰 1989년 라틴 알파벳 워드마크 기반의 현행 코퍼레이트 아이덴티티를 공식 채택했으며, 로고는 도쿄의 디자인 에이전시 Praxcis가 1988년 제작했다. 1972~1988년에 쓰던 이전 로고는 평화·열정·순수를 청·적·백으로 표현한 별도 디자인이었다.",
    identity: "현행 로고는 적색 대문자 워드마크 'FUJITSU'와, 소문자 'j'·'i' 위에 얹힌 '인피니티 마크(Infinity Mark)'로 구성된다. 회사 공식 설명에 따르면 이 무한대형 마크는 지구와 태양을 상징해 우주로의 확장과 무한한 가능성을 표현하며, 기업색 '후지쯔 레드(Fujitsu Red)'는 미래에 대한 열정과 밝음, 친근함을 담는다. 인피니티 마크는 워드마크와 분리된 독립 심볼로도 기능하며, 2021년 Interbrand가 주도한 비주얼 시스템 갱신에서도 적색 인피니티 코어는 핵심 자산으로 계승됐다.",
  },
  "brandarchive-benesse": {
    definition: "베네세(Benesse)는 일본의 교육·출판 기업으로, 라틴어 'bene(잘)'와 'esse(존재하다)'를 합친 '잘 사는 것'을 뜻하는 사명이다. 1955년 후쿠타케 출판으로 출발해 1995년 베네세로 사명을 바꿨고, 코퍼레이트 아이덴티티는 PAOS와 디자이너 신 마쓰나가가 맡았다.",
    overview: "베네세(Benesse)는 일본의 교육·출판 기업이다. 1955년 테쓰히코 후쿠타케가 중·고교생 교재 출판사 '후쿠타케 출판'으로 창업했으나, 1980년대 후반 출생률 급감으로 청소년 중심 시장이 위협받자 전 연령대의 라이프스타일 향상으로 사업을 확장하며 정체성을 재정의했다. 'Benesse'는 라틴어 bene(잘)와 esse(존재하다)를 합쳐 '잘 사는 것(well-being)'을 뜻하며, 1990년 그룹 이념으로 채택된 뒤 창립 40주년인 1995년 법적 사명이 후쿠타케 출판에서 베네세 코퍼레이션으로 바뀌었다.",
    identity: "아이덴티티는 모토오 나카니시의 PAOS와 디자이너 신 마쓰나가(松永真)의 협업으로, 1979년 1차 검토에서 1994년 프레젠테이션 완료에 이르는 다단계 프로젝트로 진행됐다. PAOS는 정보화·국제화·문화화라는 세 가지 전략 개념을 제시했고 그중 '문화화'를 핵심에 두었으며, 신 마쓰나가가 디자인한 인간 형상 모티프를 통해 사람과 삶의 질을 중심에 둔 기업 철학을 시각화했다. 사명 전환은 창립 40주년과 주식 상장 시점에 맞물려 단행됐다.",
  },
  "brandarchive-kawatetsu": {
    definition: "가와사키 제철(川崎製鉄, 가와테쓰)은 일본의 대형 철강 기업으로, 1987년 PAOS가 'TACK'이라는 프로젝트명으로 코퍼레이트 아이덴티티를 제작했다.",
    overview: "가와사키 제철(川崎製鉄, 약칭 가와테쓰)은 일본의 대형 철강 기업이다. 1987년 모토오 나카니시의 PAOS가 코퍼레이트 아이덴티티를 제작했으며, 사업 구조조정과 다각화를 지원하고 1990년대 업계 리더로서의 정체성을 확립하는 것이 목표였다.",
    identity: "프로젝트는 'TACK(Think and Act Creatively)'를 지도 원리로 삼아 사내 커뮤니케이션과 모든 CI 활동을 관통했다. 심볼은 아이콘화된 'K' 자로, 글자에 적용된 결 그라데이션(grain gradation)은 분출하는 용융 강철의 이미지에서 착안해 기업의 정열과 활력을 표현했으며, 기업색으로는 선명한 빨강을 사용했다.",
  },
  "brandarchive-zexel": {
    definition: "젝셀(Zexel)은 일본의 자동차 부품 기업으로, 1990년 디젤 기기(Diesel Kiki)에서 사명을 바꿨고 1991년 PAOS가 코퍼레이트 아이덴티티를 전개했다.",
    overview: "젝셀(Zexel)은 디젤 분사 장치 등을 만든 일본의 자동차 부품 기업이다. 1990년 7월 기존 '디젤 기기(ヂーゼル機器)'에서 'Zexel'로 사명을 변경했고, 1991년 모토오 나카니시의 PAOS가 코퍼레이트 아이덴티티를 전개했다.",
    identity: "PAOS는 정밀성과 기술적 완벽성을 표현하는 강한 선형 로고타입을 설계했는데, 글자에 정밀한 직각 컷과 중심선 정렬을 적용해 다양한 구성이 가능한 적응형 마크로 만들었다. 기업색은 'Precision Blue'와 'Advanced Red'로 명명됐으며, 신뢰·인간성·역동성을 색상 운용의 키워드로 삼았다. 사명 'Zexel'은 'Z'와 탁월함을 뜻하는 라틴어 어근(excel)을 결합한 조어다.",
  },
  "brandarchive-abdipharma": {
    definition: "압디 이브라힘(Abdi İbrahim)은 1912년 이스탄불에서 설립된 튀르키예 최대 제약 기업으로, 현행 로고는 모더니즘 거장 마시모 비넬리가 2008년 디자인했다.",
    overview: "압디 이브라힘(Abdi İbrahim)은 1912년 이스탄불에서 설립된 튀르키예 최대 제약 기업이다. 2002년 이후 튀르키예 제약 시장 1위에 오르며 글로벌 확장기에 진입했고, 세계적 모더니즘 디자이너 마시모 비넬리(Massimo Vignelli)에게 코퍼레이트 아이덴티티를 의뢰해 2008년 현행 로고를 도입했다.",
    identity: "회사 공식 설명에 따르면 로고의 동심원 세 개는 압디 이브라힘을 이끈 3대(代)의 경영진을 상징하고, 원을 가르는 수직선은 아시아와 유럽의 경계를 이루는 보스포루스 해협이자 본사의 위치를 나타낸다. 수직선 양쪽의 대칭된 색상은 '대립의 조화'에 기반한 기업 문화를 표현한다. 이 작업의 원자료는 비넬리의 디자인 아카이브로 RIT 비넬리 센터에 소장되어, 업존·시바가이기 제약 작업과 함께 전시된 바 있다.",
  },
  "brandarchive-asahi": {
    definition: "아사히(Asahi)는 일본의 대표적 맥주·음료 기업으로, 1986년 그래픽 디자이너 나가이 카즈마사와 닛폰디자인센터가 100년 된 욱일기 엠블럼을 대체하는 새 코퍼레이트 아이덴티티를 도입했다.",
    overview: "아사히(Asahi)는 일본의 대표적 맥주·음료 기업이다. 1980년대 초 시장 점유율이 10% 안팎으로 떨어진 상황에서 점유율 회복을 위한 승부수로 코퍼레이트 아이덴티티를 전면 개편했다. 1985년 그래픽 디자이너 나가이 카즈마사(永井一正)가 작업을 맡아 1986년 새 로고를 공식 도입했고, 이는 100년간 써 온 '욱일기(rising sun)' 엠블럼을 대체했다.",
    identity: "나가이 카즈마사와 닛폰디자인센터가 디자인한 새 워드마크는 각 글자가 뾰족한 정점을 갖는 샤프하고 각진 타이포그래피로, 우향 기울기를 통해 성장과 역동성을 표현했다. 기업색으로 채택한 딥 블루는 맥주의 핵심 원료인 물을 상징하도록 의도적으로 선택돼 신뢰감과 청량감을 전달했다. 이 각진 레터폼은 1987년 출시된 아사히 슈퍼드라이의 드라이하고 샤프한 제품 정체성과 시각적으로 맞물려, 출시 1년 만에 점유율을 약 17%까지 끌어올리고 1994년 일본 맥주 시장 1위에 오르는 반등을 뒷받침했다.",
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
