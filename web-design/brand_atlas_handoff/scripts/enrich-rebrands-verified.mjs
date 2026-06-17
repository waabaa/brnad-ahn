// One-off batch 4: WEB-VERIFIED content for recent design-archive rebrands whose
// brandarchive.xyz source is Pro-locked. Sourced from the design agency's own
// project page + design press (Brand New, The Dieline, Creative Review, BP&O,
// Fonts In Use, Creative Boom, Monocle, etc.), cross-checked. Unverified colors/
// typeface names not asserted. Avoids SSG safety-filter words. No source fields.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-aneo": {
    definition: "Aneo는 노르웨이 트론헤임에 본사를 둔 북유럽 재생에너지 기업으로, TrønderEnergi와 투자펀드 HitecVision이 50:50으로 손잡아 2022년 출범했다. 아이덴티티는 Scandinavian Design Group이 맡았다.",
    overview: "Aneo는 노르웨이 트론헤임에 본사를 둔 북유럽 재생에너지 기업으로, 지방 에너지 회사 TrønderEnergi와 에너지 투자펀드 HitecVision이 50:50으로 손잡아 2022년 가을 출범했다. 태양광·풍력·스마트 에너지 관리를 사업의 축으로 삼으며, 노르웨이·스웨덴·핀란드에 걸쳐 200기 이상의 풍력 터빈을 운영하는 노르웨이 2위 규모의 육상 풍력 사업자다.",
    identity: "Scandinavian Design Group(SDG)이 브랜드 전략과 비주얼 아이덴티티, 로고와 심볼, 전용 일러스트레이션, 디지털 적용물을 설계했다. 핵심 콘셉트는 보수적인 에너지 업계에서 관습을 깨고 '선구자(pioneer)' 전략을 시각화하는 것으로, 브랜드 성격을 대담하고 혁신적이며 추진력 있는 것으로 규정했다. 일러스트레이션은 Joanna Ławniczak가 맡았으며, 이 작업은 Visuelt 2023에서 디플로마를 수상했다. 구체적 컬러와 전용 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-open-ai": {
    definition: "OpenAI는 미국의 인공지능 연구·개발 기업으로 대화형 AI 서비스 ChatGPT로 널리 알려져 있다. 2025년 2월 창립 이래 첫 브랜드 아이덴티티 리프레시를 선보였다.",
    overview: "OpenAI는 미국의 인공지능 연구·개발 기업으로, 대화형 AI 서비스 ChatGPT를 비롯한 생성형 AI 제품으로 널리 알려져 있다. 2015년 설립 이후 빠른 성장을 거듭하며 AI 분야를 대표하는 기업 중 하나로 자리 잡았다.",
    identity: "OpenAI는 2025년 2월, 창립 이래 처음으로 전면적인 브랜드 아이덴티티 리프레시를 선보였다. 작업은 헤드 오브 디자인 Veit Moeller와 디자인 디렉터 Shannon Jager가 이끄는 사내 디자인팀이 주도했으며, 로테르담의 Studio Dumbar와 베를린의 타입 파운드리 ABC Dinamo가 협업했다. 세 개의 맞물린 삼각형으로 이루어진 '블로섬(blossom)' 마크는 2016년 처음 디자인된 '생명의 씨앗(seed of life)' 그리드를 기반으로 하며, 이번에 기하학적 형태가 정제되고 다양한 두께 변형이 추가되었다. 전용 서체 OpenAI Sans는 ABC Dinamo가 제작했으며, 깔끔한 기하학적 선에 의도된 미세한 불완전성을 더해 더 인간적인 인상을 주도록 설계되었고, 워드마크 비중 강화와 회색·파란색 기조의 팔레트가 함께 적용되었다.",
  },
  "brandarchive-uniqode": {
    definition: "Uniqode는 기업이 QR 코드를 대규모로 생성·관리·추적하는 디지털 연결 플랫폼으로, 기존 사명 Beaconstac에서 2024년 1월 개명했다. 리브랜드는 에이전시 Koto가 맡았다.",
    overview: "Uniqode는 기업이 QR 코드를 대규모로 생성·관리·추적할 수 있게 해주는 디지털 연결 플랫폼으로, Amazon·Hilton·Nestlé 등을 고객으로 둔다. 비콘 하드웨어를 가리키던 기존 사명 Beaconstac은 제품 방향이 QR 중심으로 이동하면서 2024년 1월 Uniqode로 개명했고, 리브랜드는 물리 세계와 디지털 세계를 잇는 인프라가 되겠다는 비전을 담았다.",
    identity: "Koto의 리브랜드는 물리와 디지털을 잇는 '스티칭(바느질·크로스스티치)'을 핵심 콘셉트로 삼아, 흩어진 점들을 하나의 연결된 면으로 꿰매는 발상을 시스템 전반에 적용했다. 전용 서체 Uniqode Sans는 QR 코드를 연상시키는 지오메트릭 산세리프로 변형된 'Q'가 특징이며, 픽셀화된 꽃 형태의 심볼을 함께 쓴다. 컬러는 채도 높은 블루를 주조색으로 딥 네이비·라벤더·뮤트 그레이·오프화이트를 보조색으로 구성하고, 크로스스티치 패턴에서 그리드를 끌어왔다.",
  },
  "brandarchive-freesoul": {
    definition: "Free Soul은 2017년 설립된 영국의 여성 웰빙·영양 보충제 브랜드로, 디지털 네이티브로 출발했다. 리브랜드는 런던 에이전시 Ragged Edge가 맡았다.",
    overview: "Free Soul은 2017년 설립된 영국의 여성 웰빙·영양 보충제 브랜드로, TikTok Shop 등 디지털 채널에서 출발했다. Ragged Edge는 이 브랜드를 '여성으로 살아가는 일을 위한 웰빙'이라는 관점으로 재정의하며, 바이럴 제품 모음에서 카테고리를 이끄는 브랜드로, 나아가 오프라인 리테일까지 확장 가능한 브랜드로 전환하는 작업을 맡았다.",
    identity: "핵심 비주얼 코드는 모든 패키지에 일관되게 적용되며 크기 조절이 용이한 세로형 로고로, 온·오프라인 전반의 기준점 역할을 한다. 컬러는 Garnet과 Soul White를 기본으로 절제된 팔레트를 쓰고, 브랜드 기원을 환기하는 핑크 계열을 액센트로 사용해 카테고리를 구분한다. 타이포그래피는 따뜻함과 정밀함의 균형을 지향하며 굵은 헤드라인부터 상세 영양 정보 표기까지 폭넓게 대응한다. 정확한 서체명은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-equip": {
    definition: "Equip(Equip Foods)은 2015년 설립된 미국의 단백질 보충제 브랜드로, 유청이 아닌 소(bovine) 유래 단백질을 핵심으로 한다. 리브랜드는 몬트리올 기반 스튜디오 Wedge가 맡았다.",
    overview: "Equip(Equip Foods)은 2015년 설립된 미국의 단백질 보충제 브랜드로, 유청이 아닌 소(bovine) 유래 단백질을 핵심으로 콜라겐·젤라틴·크레아틴 함량이 높은 제품을 내세운다. 합성 첨가물 없이 '진짜 음식'으로 보충한다는 창업 철학을 가지며, 리브랜드는 몬트리올 기반 스튜디오 Wedge가 맡았다.",
    identity: "Wedge는 '자연이 의도한 영양(Nutrition As Nature Intended)'을 중심 개념으로 삼아, 임상적·운동선수 지향의 기존 인상을 빈티지 식료품(밀가루 포대, 버터, 요거트 포장)에서 길어 올린 따뜻한 노스탤지어 무드로 전환했다. 워드마크는 Aachen 계열 활자를 활용한 전부 소문자 형태로 'q'와 'p'가 거울처럼 대칭되는 처리가 특징이며, 본문에 Acumin, 헤드라인에 P22 Mackinac을 조합한다. 컬러는 기존의 빨강·파랑을 더 깊고 차분하게 보정하고 흰색을 크림 톤으로 누그러뜨려 신뢰감 있는 인상으로 바꿨다.",
  },
  "brandarchive-zudo": {
    definition: "Zudo는 암스테르담 금융업무지구 자위다스(Zuidas)에 들어서는 동네 단위 장소 브랜드로, 옛 ABN AMRO 본사 부지를 복합 생활권으로 바꾸는 도시재생 프로젝트다. 브랜딩은 스튜디오 DNCO가 맡았다.",
    overview: "Zudo는 암스테르담 금융업무지구 자위다스(Zuidas)에 들어서는 동네 단위 장소 브랜드로, 옛 ABN AMRO 본사 부지를 주거·업무·거리·정원이 어우러진 복합 생활권으로 바꾸는 도시재생 프로젝트다. 일반 소비재 브랜드가 아니라 플레이스 브랜딩 사례로, 이름 'Zudo'는 'Zuidas'와 네덜란드어로 마을을 뜻하는 'dorp'를 합친 합성어다.",
    identity: "DNCO는 업무지구의 기업적 유산과 마을 같은 공동체성이라는 상반된 성격의 대비를 핵심 콘셉트로 삼았다. 암스테르담 파운드리 Bold Decisions와 협업해 산세리프와 세리프를 결합한 전용 스텐실 서체를 제작했고, 도쿄 기반 일러스트레이터 Luis Mendo가 튤립·동네 빵집·브라윈 카페 같은 일상 풍경 일러스트를 그려 커뮤니티 게시판 형식의 레이아웃에 담았다. 네덜란드어와 영어를 오가는 이중언어 보이스로 비표준화된 톤을 만든 점도 특징이다. 구체적 컬러 팔레트는 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-best-of-the-bone": {
    definition: "Best of the Bone은 호주의 본 브로스(사골 육수) 식품 브랜드로, 100% 그래스페드 소뼈를 오래 끓여 만든 농축 육수와 콜라겐 제품을 만든다. 리브랜드는 호주 스튜디오 Universal Favourite이 맡았다.",
    overview: "Best of the Bone은 호주의 본 브로스(사골 육수) 식품 브랜드로, 100% 그래스페드(목초 사육) 소뼈를 오래 끓여 만든 농축 육수와 콜라겐 제품을 만든다. 호주 디자인 스튜디오 Universal Favourite이 컬트적 인지도를 유지하면서 대중 리테일로 확장하기 위한 리브랜딩을 수행했다.",
    identity: "리브랜드는 제품 자체에서 단서를 얻어 꾸밈없고 솔직한 성격을 군더더기 없이 압축한 타이포그래피 중심의 정체성을 제시했다. 핵심은 파운드리 205TF와 협업해 제작한 전용 서체 Exposure Bone으로, 기존 Exposure를 다듬어 폭을 좁히고 미묘한 곡선·변형을 더해 병 안의 내용물을 은유했으며, 웹에서는 Aeonik을 보조 서체로 쓴다. 컬러는 흙빛에 장난기를 더한 팔레트로 묘사되며 패키지는 재료를 전면에 내세운다. 정확한 색상 값은 공개 자료로 확인되지 않는다.",
  },
  "brandarchive-flat": {
    definition: "Flat은 핀란드 스노보드 협회(Finland Snowboard Association)의 새 브랜드명으로, 핀란드의 스노보드 커뮤니티와 종목을 대표하는 스포츠 단체다. 리브랜드는 핀란드 에이전시 Werklig이 맡았다.",
    overview: "Flat은 핀란드 스노보드 협회(Finland Snowboard Association)의 새 브랜드명으로, 핀란드의 스노보드 커뮤니티와 종목을 대표하는 스포츠 단체다. 핀란드 브랜드 에이전시 Werklig이 리브랜딩을 맡았으며, 언더그라운드 문화에서 출발해 올림픽 종목으로 성장한 스노보드의 정체성을 현대적으로 정리하는 것을 목표로 했다.",
    identity: "'Flat'이라는 이름은 점프 후 착지하는 평지와 산이 거의 없는 핀란드의 평탄한 지형을 함께 가리키는 중의적 표현으로, 산악 지형 없이도 세계적 라이더를 배출하는 자조적 위트를 담았다. 콘셉트는 진솔함(sincere)·자유로움(free)·강인함(tough) 세 가치를 축으로 하며, 권위적 기관이 아닌 커뮤니티의 집을 지향한다. 컬러는 핀란드 국기의 강렬한 블루와 갓 내린 눈을 연상시키는 파우더 핑크를 결합했고, 헬멧부터 윈드브레이커까지 적용 가능한 유연한 그리드 시스템을 사용한다.",
  },
  "brandarchive-korshags-2024": {
    definition: "Korshags(코르샤그스)는 스웨덴 서해안 팔켄베리를 기반으로 한 프리미엄 수산물 식품 브랜드로, 책임 양식 해산물 분야에서 약 80년의 경험을 내세운다. 리브랜드는 스웨덴 스튜디오 Pond Design이 맡았다.",
    overview: "Korshags(코르샤그스)는 스웨덴 서해안 팔켄베리(Falkenberg)를 기반으로 한 프리미엄 소규모 수산물 식품 브랜드로, 책임 양식 해산물 분야에서 약 80년의 경험을 내세운다. 스웨덴 디자인 스튜디오 Pond Design이 브랜드와 패키지를 새롭게 작업했다.",
    identity: "Pond Design의 리브랜드는 짙은 남색·닻·어선 같은 해산물 업계의 상투적 표현을 걷어내고, 스웨덴 해안선을 연상시키는 밝은 햇살 같은 옐로를 핵심 색으로 삼아 진열대에서 신선하고 프리미엄한 인상을 주는 것을 콘셉트로 한다. 시선을 사로잡는 과장된 타이포그래피와 크게 키운 로고에 장난기 있는 물고기 캐릭터를 더하고, 제품인 생선 자체를 최소한의 요소 속 중심에 배치했으며 맛 구분을 위한 컬러 블록을 활용했다. 이 작업은 2025 다이라인 어워즈 숏리스트에 선정되었다.",
  },
  "brandarchive-flaum": {
    definition: "Flaum(플라움)은 1918년 창립된 미국 뉴욕 브루클린 기반의 코셔 델리 식품 브랜드로, 5대째 이어온 가족 기업이다. 리브랜드는 에이전시 M/OTG가 맡았다.",
    overview: "Flaum(플라움)은 1918년 창립된 미국 뉴욕 브루클린 기반의 코셔 델리 식품 브랜드로, 5대째 이어온 가족 기업이다. 후무스·샐러드 등 여러 제품 카테고리에 45종 이상의 패키지 변형을 보유한 식품 제조사이며, 진열대에서의 인지도 강화가 리브랜딩의 핵심 과제였다.",
    identity: "리브랜딩은 브루클린·이스라엘 기반의 브랜딩 에이전시 M/OTG가 수행했고, 디자인은 최고브랜드책임자 야니브 바크닌(Yaniv Vaknin)이 이끌었다. 콘셉트는 차별화·식별성·기억성의 세 원칙으로, 빠르게 보이고 쉽게 기억되며 전 제품군에 확장 가능한 통합 비주얼 시스템을 목표로 하면서 1918년 창립 유산을 존중했다. 이 작업은 The Dieline의 '2025 베스트 리디자인 10선'에서 3위에 선정되었다. 정확한 컬러와 서체명은 공개 자료로 확인되지 않는다.",
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
