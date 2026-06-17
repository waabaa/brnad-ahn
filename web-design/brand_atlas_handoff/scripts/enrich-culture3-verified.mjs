// Batch 21: WEB-VERIFIED content. Studio portfolios + design press, cross-checked
// across 2+ independent sources (Experimental Jetset, Pentagram, Landor, FHA Image
// Design, Otl Aicher/IDZ, Marx Design, B&B Studio; Dezeen/designboom/It's Nice That/
// olympics.com/BP&O/The Dieline/Design Week). Unverified colors/type not asserted.
// No source fields. Hallucination guards applied (see per-brand notes):
//  - Sydney 2000: emblem = FHA only; Hatton = mascots, not emblem.
//  - Philbrook: villa/gardens are background context, NOT the logo motif.
//  - Munich Airport: Aicher died 1991; "1974 commission -> 1992 applied", not a fixed logo year.
//  - Japan Post: 〒 mark (1887) is distinct from Landor's 2003/2007 work.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-whitney-museum-of-american-art": {
    definition: "휘트니 미술관(Whitney Museum of American Art)은 1930년 설립된 미국 미술 전문 기관으로, 2013년 네덜란드 스튜디오 Experimental Jetset이 'Responsive W'로 불리는 가변형 시각 정체성을 선보였다.",
    overview: "휘트니 미술관(Whitney Museum of American Art)은 1930년 설립된 미국 미술 전문 기관이다. 2013년 네덜란드 암스테르담의 디자인 스튜디오 Experimental Jetset이 새 시각 정체성을 발표했는데, 이는 미술관이 매디슨 애비뉴의 마르셀 브로이어 건물에서 미트패킹 디스트릭트의 렌조 피아노 설계 신관(2015년 개관)으로 이전하는 과정에서 연속성을 부여하기 위한 작업이었다.",
    identity: "핵심은 지그재그 선이 알파벳 W로 변형되는 가변 식별자 'Responsive W'다. 이 선은 미술관의 심볼인 동시에 텍스트와 이미지를 담는 프레임워크로 기능하며, 함께 놓이는 작품의 비례와 성격에 반응해 형태가 달라진다. 스튜디오는 직선으로 단순화할 수 없는 비선형적 미술사를 표현하려 했다고 설명했으며, 큐레이터 도나 디 살보의 '미술사를 단순한 선으로 제시하는 편이 쉽겠지만 그건 휘트니가 아니다'라는 말에서 영감을 얻었다. 로고 옆 텍스트에는 크리스티안 슈바르츠가 재해석한 노이에 하스 그로테스크 서체를 대문자로 사용한다.",
  },
  "brandarchive-philbrook-museum-of-art": {
    definition: "필브룩 미술관(Philbrook Museum of Art)은 1939년 미국 오클라호마주 털사에 개관한 미술관으로, 2012~2013년 다운타운 분관 확장에 맞춰 Pentagram이 시각 정체성을 디자인했다.",
    overview: "필브룩 미술관(Philbrook Museum of Art)은 1939년 미국 오클라호마주 털사에 개관한 미술관으로, 석유 사업가 웨이트 필립스가 지은 이탈리아 르네상스 양식 빌라와 정형 정원을 갖춘 본관으로 알려져 있다. 2012~2013년 다운타운 브래디 아트 디스트릭트에 약 3만 제곱피트 규모의 분관을 열며 두 거점 체제로 확장했고, 이에 맞춰 Pentagram이 새 정체성을 디자인했다. 브랜드 아이덴티티는 파트너 마이클 비럿이, 웹사이트는 파트너 에디 오파라가 맡았다.",
    identity: "Pentagram은 털사 시가지를 그리드로 분할한 뒤 미술관의 두 거점이 위치한 영역을 떼어내면 알파벳 'P' 형태가 만들어지는 데서 로고를 도출했다. 이 형태는 동시에 인간의 얼굴을 닮아, 예술이 오랫동안 다뤄 온 주제를 환기한다. 마크는 단색 솔리드로 쓰거나 반전시켜 소장품 이미지를 들여다보는 '창'으로 활용할 수 있고, 알파벳 전체로 확장 가능한 시스템으로 설계됐다. 서체는 산세리프 Benton Sans Condensed와 세리프 Miller를 조합했다. 본관의 빌라와 정원은 미술관 정체성의 배경 맥락이며 로고 형태의 직접 모티프는 아니다.",
  },
  "brandarchive-japan-post": {
    definition: "일본우정(Japan Post)은 일본의 우편·금융 사업체로, 민영화 과정에서 Landor가 2003년 일본우정공사 심볼과 2007년 그룹 'JP' 마스터브랜드 마크를 디자인했다.",
    overview: "일본우정(Japan Post)은 우편과 금융 서비스를 아우르는 일본의 사업체다. 2003년 국가 직영 우정사업을 개편해 일본우정공사가 출범했고, 2007년 민영화로 지주회사와 우편·은행·보험 등 사업회사 체제로 재편됐다. 브랜드 컨설팅사 Landor가 두 시점 모두 아이덴티티 작업을 맡았다.",
    identity: "2003년 공사 출범 시 도입된 빨간 정사각형 심볼은 동서남북 네 방향을 의미하며 전국 어디서나 서비스를 제공한다는 자세를 표현했고, 빨강을 기조로 삼아 기존 우편 기호와의 통일감을 꾀했다. 2007년 그룹 발족 때는 신뢰와 친근함이라는 기존 강점에 혁신성을 더한 'JP' 마스터브랜드 마크를 도입해, 지주회사와 각 사업회사가 이를 공유하도록 했다. 한편 1887년 도입된 우편 기호 〒는 통신을 뜻하는 가타카나 '테(テ)'를 양식화한 것으로, Landor의 작업과는 별개의 역사적 상징이며 새 체계에서도 존치됐다.",
  },
  "brandarchive-sydney-2000": {
    definition: "시드니 2000(Sydney 2000)은 2000년 하계 올림픽의 브랜드로, 'Millennium Athlete'로 불리는 엠블럼을 호주 스튜디오 FHA Image Design이 디자인해 1996년 공개했다.",
    overview: "시드니 2000(Sydney 2000)은 '새 천년의 올림픽'으로 불린 2000년 하계 올림픽의 브랜드다. 시드니는 1993년 모나코 IOC 총회에서 개최권을 따냈고, 엠블럼은 호주 스튜디오 FHA Image Design이 디자인해 1996년 9월 달링 하버에서 공개됐다.",
    identity: "엠블럼은 새 세기를 향해 달려가는 운동선수 형상을 호주적 요소로 구성한다. 부메랑이 선수의 팔다리를 이루고, 위쪽의 호는 시드니 오페라하우스의 실루엣을 올림픽 성화에서 피어오르는 연기 자취로 변형해 성화를 든 선수의 이미지를 완성한다. 선수 형상과 결합한 이 곡선은 시드니가 앞서 제출한 올림픽 유치 엠블럼의 계보를 잇는다. 참고로 마스코트(올리·시드·밀리)는 매슈 해튼이, 스포츠 픽토그램은 별도 디자이너가 맡았으며 엠블럼 자체는 FHA Image Design에 귀속된다.",
  },
  "brandarchive-munich-airport": {
    definition: "뮌헨 공항(Flughafen München, MUC)은 1992년 개항한 독일의 공항으로, 1972년 뮌헨 올림픽 픽토그램으로 유명한 오틀 아이허가 코퍼레이트 아이덴티티와 사이니지 체계를 설계했다.",
    overview: "뮌헨 공항(Flughafen München, MUC)은 1992년 5월 17일 기존 뮌헨-림 공항을 대체하며 개항한 독일의 공항이다. 1972년 뮌헨 올림픽 픽토그램과 루프트한자 아이덴티티로 알려진 디자이너 오틀 아이허가 1974년 공항 디자인 작업을 위촉받아 비주얼 아이덴티티와 웨이파인딩 체계를 수립했다. 아이허는 1991년 세상을 떠났고, 그의 디자인은 1992년 개항과 함께 적용됐다.",
    identity: "체계의 중심에는 알파벳 'M'을 담은 단순한 산세리프 마크가 있으며, 이 마크는 2013년 리뉴얼에서도 핵심 자산으로 존속했다. 컬러는 지역 특성에서 도출해 상부 바이에른의 하늘을 연상시키는 라이트 블루를 중심에 두고 전통 건축의 화이트, 습지의 그린, 항공기 동체의 실버를 더했으며, 컬러 콘셉트는 에버하르트 슈타우스와의 협업으로 발전했다. 정사각형·그리드·45도 대각선 같은 소수의 조합 가능한 상수를 건축·사이니지·조경 전반에 일관 적용한 '다양성 속의 통일' 원칙이 바탕이 됐다. 사이니지에는 위니버스 계열 산세리프가 쓰였다.",
  },
  "brandarchive-popchips": {
    definition: "팝칩스(Popchips)는 튀기지 않고 팝콘처럼 부풀린 감자칩 스낵으로, 뉴질랜드 스튜디오 Marx Design이 2013년 패키징 정체성을 디자인했다.",
    overview: "팝칩스(Popchips)는 굽거나 튀기지 않고 팝콘처럼 부풀려 만든다는 점을 내세운 감자칩 스낵이다. 뉴질랜드 오클랜드의 브랜딩·패키징 스튜디오 Marx Design이 2013년 패키징 정체성을 디자인했으며, 정직하고 자연스러우며 더 건강한 스낵이라는 가치를 전달하고자 했다.",
    identity: "Marx Design은 브랜드명 'Popchips'에서 출발해 요소들이 빛과 그림자와 함께 지면에서 튀어나오는 종이 디오라마 표현을 핵심으로 삼았다. 손으로 만든 레이어드 종이 아트워크를 촬영해 인쇄에 적용했는데, 디오라마 제작에만 500시간 이상이 들었고 컴퓨터만으로는 재현하기 어려운 방식이었다. 디오라마 장면마다 맛의 아이디어를 담아, 예컨대 솔트 앤 페퍼 맛은 폭풍 장면으로 구성했다. 모던한 톤의 대문자 산세리프에 작은 밑줄 디테일을 더했으며, 이 작업은 뉴질랜드 베스트 디자인 어워드 2013 패키징 부문에서 수상했다.",
  },
  "brandarchive-tingz": {
    definition: "팅즈(Tingz)는 천연 자일리톨 기반 브랜드 페퍼스미스(Peppersmith)가 선보인 캔디 라인으로, 런던 스튜디오 B&B Studio가 2013년 브랜드 디자인을 맡았다.",
    overview: "팅즈(Tingz)는 천연 자일리톨 기반 츄잉껌 브랜드 페퍼스미스(Peppersmith)가 출시한 캔디 라인이다. 런던 쇼디치의 식음료 브랜딩 전문 스튜디오 B&B Studio가 2013년 디자인을 맡아, 건강하면서도 맛있고 치아에도 이로운 스위트라는 점을 재치 있게 풀어냈다.",
    identity: "B&B Studio는 페퍼스미스 특유의 별난 개성을 확장해 입이 큰 두 몬스터 캐릭터를 핵심으로 삼았다. 보위(Bowie)와 플로이드(Floyd)로 이름 붙은 두 캐릭터는 노랑과 빨강의 털, 왕방울 눈, 하트 모양 혀, 날카로운 이빨을 지녔다. 콘셉트가 캐릭터의 '입'에 집중되도록 카톤이 생명체의 턱처럼 벌어지게 열리는 구조를 적용했으며, 흰 바탕에 밝은 강조색을 대비시켜 자일리톨의 치아 건강 효능을 시각적으로 연결했다.",
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
