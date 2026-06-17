// Batch 23: WEB-VERIFIED content (1980s corporate identity classics).
// Cross-checked across 2+ independent sources (HSBC archive + Henry Steiner quote,
// Otl Aicher/IDZ + Norman Foster Foundation, Landor + JAL history, Nippon Design
// Center + arun.is, PAOS + Kirin official, Ikko Tanaka archives, Logo Histories).
// Hallucination guards applied (verified by research agents):
//  - HSBC: designed ~1983, phased in 1984; hexagon from St Andrew's saltire house flag.
//  - Metro Bilbao: Aicher died 1991, metro opened 1995; do NOT claim "last project" (disputed).
//  - JAL: 1989 Landor CI KEPT the tsurumaru crane (retired 2002, revived 2011); the
//    "World's Friendliest Airline" slogan is NOT JAL's (Panagra) -> not used.
//  - JR: Nippon Design Center 1987; Nagai was SUPERVISOR (not lead); designer Yoji Yamamoto.
//  - Kirin: PAOS CI in the 1980s (year 1984 vs 1990 disputed -> phrased approximately);
//    the hidden キリン katakana PREDATES 1933 and is NOT PAOS's work -> kept separate.
//  - SEIYU: Ikko Tanaka art-directed; logotype drawn by Shin Matsunaga; 1983 (not 1984).
//  - Expo '90: Mitsuo Katsui; mark announced 1986, VI guidelines 1987.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-hongkongbank": {
    definition: "홍콩상하이은행(HongkongBank, 훗날 HSBC)은 1865년 토머스 서덜랜드가 설립한 은행으로, 1983년경 디자이너 헨리 스타이너가 은행의 깃발을 변형한 적·백 육각형 심볼을 디자인했다.",
    overview: "홍콩상하이은행(HongkongBank, Hongkong and Shanghai Banking Corporation)은 1865년 토머스 서덜랜드가 중국·유럽·미국 간 무역 금융을 위해 설립한 은행으로, 훗날 글로벌 HSBC의 모태가 됐다. 홍콩에 거점을 둔 디자이너 헨리 스타이너(Henry Steiner)가 1983년경 코퍼레이트 아이덴티티를 만들었고, 마크는 1984년부터 단계적으로 적용됐다.",
    identity: "스타이너는 은행이 건물에 게양하던 하우스 플래그에서 출발했다. 이 깃발은 흰 바탕을 대각선으로 가른 적·백 네 개의 삼각형으로, 스코틀랜드 출신 창립자의 유산인 세인트 앤드루 십자가(saltire)를 나타냈다. 스타이너는 깃발 양옆에 빨간 삼각형 두 개를 더해 동일한 이등변삼각형 네 개가 모인 육각형을 만들었고, 이는 사방으로 향하는 화살표이자 중앙의 'X'로 읽힌다. 스코틀랜드의 파랑 대신, 중국 문화에서 의미가 깊고 은행이 이미 통장에 쓰던 빨강을 채택했다. 이 마크는 이후 전 세계 사업체를 묶는 글로벌 HSBC 심볼로 확장됐다.",
  },
  "brandarchive-metro-bilbao": {
    definition: "메트로 빌바오(Metro Bilbao)는 스페인 빌바오의 지하철로, 독일 디자이너 오틀 아이허가 1988년부터 시각 정체성과 사이니지 체계를 디자인했다. 역 건축은 노먼 포스터가 맡았다.",
    overview: "메트로 빌바오(Metro Bilbao)는 스페인 빌바오의 지하철로, 도시 재생 전략의 일환으로 건설돼 1995년 11월 개통했다. 역 건축은 노먼 포스터가 설계했고, 시각 정체성과 웨이파인딩 체계는 독일 디자이너 오틀 아이허가 1988년부터 동료 미하엘 바이스, 한스 브루클라허와 함께 디자인했다. 아이허는 1991년 세상을 떠나 개통을 보지 못했다.",
    identity: "심볼은 두께가 서로 다른 세 개의 고리가 겹쳐 안쪽으로 움직이는 추상 도형으로, 고리가 읽는 방향으로 굵어지며 운동감을 만들어 터널과 속도를 연상시킨다. 로고타입에는 아이허가 1988년 발표한 서체 Rotis의 세미산스를 소문자로 사용했다. 컬러는 빌바오의 문장에서 유래한 '빌바오 레드'를 바탕에 두고 흰 글자와 검정 픽토그램을 얹은 미니멀한 체계로, 포스터가 설계한 반원형 터널과 유리·강철 진입부와 조화를 이룬다. 이 유리 캐노피 진입부는 포스터의 이름을 따 '포스테리토(Fosterito)'로 불린다.",
  },
  "brandarchive-jal": {
    definition: "일본항공(Japan Airlines, JAL)은 일본의 대표 항공사로, 1987년 완전 민영화 이후 1989년 미국 디자인사 Landor가 새 코퍼레이트 아이덴티티를 개발했다.",
    overview: "일본항공(Japan Airlines, JAL)은 일본의 대표 항공사다. 1987년 정부 지분 매각으로 완전 민영화된 뒤 국제선 확장 국면에서, 1989년 미국 디자인사 Landor가 로고·컬러·서체·유니폼을 아우르는 새 코퍼레이트 아이덴티티를 개발했다.",
    identity: "1989년 작업은 1958년부터 꼬리날개에 있던 학 심볼 '쓰루마루(鶴丸)'를 유지하면서, 동체의 기존 'Japan Air Lines' 레터링을 새 'JAL' 그래픽으로 교체했다. 워드마크는 가로 바가 제거된 'A'가 특징인 엑스트라볼드 서체로 날카로운 삼각형 세리프를 지녔고, 빨간 정사각형과 회색 직사각형이 가로로 이어진 기하 엠블럼 위에 얹혔다. 주조색은 JAL 레드다. 쓰루마루 학은 2002년 일본에어시스템 합병 때 'Arc of the Sun' 디자인으로 교체되며 사라졌다가 2011년 다시 부활했다.",
  },
  "brandarchive-japan-railway": {
    definition: "JR(Japan Railways)은 1987년 일본국유철도(국철) 민영화로 출범한 철도 그룹으로, 일본디자인센터가 'JR' 통합 로고를 디자인했다.",
    overview: "JR(Japan Railways)은 1987년 4월 1일 막대한 부채를 안고 있던 일본국유철도(국철)가 분할·민영화되며 출범한 철도 그룹으로, 6개 지역 여객사와 1개 화물사로 나뉘었다. 회사는 분리됐지만 승객에게 보이는 변화는 사실상 로고뿐이었기에 통일된 시각 정체성이 채택됐고, 이를 일본디자인센터(Nippon Design Center)가 덴쓰와 함께 디자인했다.",
    identity: "디자인은 크리에이티브 디렉터 가지 유스케, 아트 디렉터 겸 디자이너 야마모토 요지, 감수 나가이 카즈마사로 이뤄진 팀이 맡았다. 민영화 법안이 통과된 1986년 11월 말 위촉돼 1987년 4월 출범까지 약 124일 만에 완성한 작업이었다. 'J'와 'R'을 용접하듯 이어 붙인 일체형 레터마크는 전국의 철길이 하나로 연결된다는 의미를 담고, 차량 양쪽 어디에 붙어도 읽히도록 좌우 대칭적이며 속도감을 위해 가로로 넓게 늘였다. 형태는 그대로 두고 색으로 회사를 구분해, JR 동일본은 녹색, 도카이는 오렌지, 서일본은 파랑, 홋카이도는 연두, 시코쿠는 하늘색, 규슈는 빨강을 썼다.",
  },
  "brandarchive-kirin": {
    definition: "기린(麒麟, Kirin)은 일본의 대표 맥주·음료 기업으로, 동아시아 신화의 신수 기린을 심볼로 쓴다. 일본 CI의 선구자 PAOS가 1980년대에 기린의 코퍼레이트 아이덴티티 작업에 참여했다.",
    overview: "기린(麒麟, Kirin)은 일본의 대표 맥주·음료 기업으로, 창업기부터 동아시아 신화 속 상서로운 신수 '기린(麒麟)'을 브랜드 심볼로 삼아 왔다. 모토오 나카니시가 1968년 세운 일본 CI의 선구 기업 PAOS가 1980년대에 기린의 코퍼레이트 아이덴티티 작업에 참여했으며, 정확한 시점은 자료에 따라 1984년 또는 1990년으로 엇갈린다.",
    identity: "PAOS는 같은 시기 브리지스톤·INAX·NTT 등 다수의 대형 CI를 수행하며 기업 이념을 구현하는 토털 디자인으로서의 CI를 일본에 정착시킨 회사로, 기린도 그 클라이언트 명단에 올라 있다. 한편 기린 심볼에서 유명한 일화는 신수 기린 일러스트의 갈기와 꼬리에 가타카나 'キ·リ·ン' 세 글자가 숨어 있다는 점인데, 기린 측에 따르면 이는 늦어도 1933년 이전부터 들어가 있던 오래된 요소로 PAOS의 작업과는 구별되며, 넣은 이유와 원작자는 간토대지진으로 자료가 소실돼 확정되지 않았다.",
  },
  "brandarchive-seiyu": {
    definition: "세이유(西友, SEIYU)는 세이부·세종 계열의 일본 대형 유통 체인으로, 1983년 그래픽 디자이너 다나카 잇코가 아트 디렉션을 맡아 코퍼레이트 아이덴티티를 정비했다.",
    overview: "세이유(西友, SEIYU)는 세이부·세종 계열의 일본 대형 유통 체인이다. 1983년 발행된 그래픽 매뉴얼을 통해 코퍼레이트 아이덴티티가 정비됐으며, 무인양품(MUJI)의 초대 아트 디렉터로도 알려진 그래픽 디자이너 다나카 잇코(田中一光)가 아트 디렉션을 맡았다.",
    identity: "로고타입은 빨간 사각형 프레임 안에 알파벳 'SEIYU'를 배치한 형태이며, 한자 '西友'를 병기할 때는 파랑으로 하단에 두었다. 기업색은 빨강을 기조로 파랑을 보조로 삼는다. 1983년 세이유 그래픽 매뉴얼의 크레딧에 따르면 아트 디렉션과 응용 디자인은 다나카 잇코가, 로고타입 도안은 디자이너 마쓰나가 신이 맡았다. 다나카는 1973년부터 세이부 유통그룹의 크리에이티브 디렉터로 활동한 흐름의 연장선에서 이 작업을 진행했다.",
  },
  "brandarchive-expo-'90": {
    definition: "엑스포 '90(Expo '90)은 1990년 오사카에서 열린 국제 꽃과 녹음의 박람회로, 그래픽 디자이너 가쓰이 미쓰오가 심볼마크를 디자인했다.",
    overview: "엑스포 '90(Expo '90)은 1990년 오사카에서 열린 '국제 꽃과 녹음의 박람회'로, '자연과 인간의 공생'을 주제로 삼았다. 심볼마크는 그래픽 디자이너 가쓰이 미쓰오(勝井三雄)가 디자인해 1986년 말 발표했고, 비주얼 아이덴티티 가이드라인 정비는 1987년에 이뤄졌다.",
    identity: "심볼은 회전하는 꽃잎처럼 배열된 원반들이 교차하는 여섯 잎 꽃 형태로, 생명의 신비를 한 송이 반짝이는 꽃에 비유했다. 각 꽃잎은 물·공기·흙과 계절의 순환 같은 생명의 핵심 요소를 표상하고, 교차점은 인간을 포함한 요소들의 공존과 연결을 나타낸다. 컬러는 하늘과 물의 블루, 풀의 그린, 꽃의 핑크·레드를 사용했으며 영문 로고타입에는 위니버스 서체를 적용했다. 가쓰이는 오사카 만국박람회와 쓰쿠바 과학기술박람회의 아트 디렉션도 맡은 박람회 그래픽의 베테랑이다.",
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
