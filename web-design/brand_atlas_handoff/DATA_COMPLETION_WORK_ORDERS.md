# Brand Atlas Data Completion Work Orders

## 원칙

이 프로젝트의 브랜드 DB는 추정 문장으로 채우지 않는다. 모든 보강은 확인된 브랜드명, 공식/공개 데이터, 로컬 매거진 원문에서 확인 가능한 사실, 허용된 export 파일, 또는 직접 확보한 이미지 자산을 기준으로 한다.

공개 화면과 공개 JSON에는 출처 문구를 노출하지 않는다. 출처 URL, 수집 경로, 검수 메모는 작업용 파일에만 둔다.

## 300-brands 파이프라인 → DB 편입 (완료)

`300-brands/output/{approved,review}/*.json`(300건, ARCHETYPOS 스키마)을 `data/brand-atlas.json`의 `allBrands`에 병합했다.

- 기존 브랜드와 이름이 겹치는 86건은 **신규 항목을 만들지 않고** 기존 레코드에 `brandType`·`timeline`(비어있던 경우만)·`country`·`foundedYear`·`operatingStatus`를 채워 넣는 방식으로 병합했다(`enrichedFrom300: true`로 표시).
- 나머지 214건은 신규 브랜드로 추가했다(`sourceBatch: "300-brands-pipeline-2026"`로 표시, id 1239부터 순번 부여, slug는 `brand_name_en` 기반 자동 생성).
- `country` 필드를 정식으로 채워 넣고, `industries`와 같은 구조로 top-level `countries`(name/count) 인덱스를 신설했다. 국가별 브라우징 페이지(`pages/countries.html` 등)는 아직 없다 — 데이터 축만 마련된 상태다.
- `node scripts/qa-check.mjs` 통과 확인, `node scripts/build-brand-pages.mjs`로 브랜드 상세 정적 페이지 1,452개 재생성, `node scripts/build-seo-extras.mjs`로 `pages/brands.html`·`rss.xml` 재생성, `app.js`의 데이터 fetch 캐시버스터를 `20260629s`로 갱신했다.
- 22개 카테고리를 사이트의 기존 12개 `domainSlug`로 매핑해 넣었다(전용 카테고리가 없는 교육·금융핀테크·사회적기업 등은 `brand-business`로 편입). 세분류가 필요해지면 `industries` 배열에 새 항목을 추가하고 이 매핑 테이블을 갱신해야 한다.
- 전체 브랜드(1,452개) 대상 `country` 재정리 완료: 300건 자체 데이터 + 텍스트 근거 981건(휴리스틱 추출) + 확신 가능한 일반 지식 99건 = 1,380건(95%) 반영, `countries` 인덱스 신설(한국 509·미국 335·영국 143 등). 나머지 72건은 근거 부족으로 미확인 유지.

## 300-brands 로고 이미지 수집 — 자동화 한계까지 진행, 나머지는 리서처 오더

300개 파이프라인 산출물은 원칙상 이미지 URL을 넣지 않고 `logoSearchQuery`만 기입했다(허위 URL 방지). 이후 두 단계 자동 수집을 거쳤다.

**1단계 — Wikimedia Commons API 검색** (`scripts/enrich-300-logo-assets.mjs`): 매치를 브랜드명만으로 판단하지 않고 Commons `categories`/`globalusage` 메타데이터로 실제 소유 회사가 맞는지 재검증했다. 이 과정에서 **동명이인 오탐 2건을 발견해 제거**했다 — 넥슨(매칭된 파일이 실제로는 프랑스 코뮌 Pays de Nexon 로고), 오리온(일본 Orion Electric 로고). 브랜드명 문자열 매칭만으로는 이런 오탐이 반드시 나오므로, 향후 유사 작업에서도 categories/globalusage 재검증을 생략하면 안 된다. 검증 후 반영: `logo` 신규 3건(여기어때·에어서울·한샘) + logoHistory 보강 10건.

**2단계 — 공식 홈페이지 og:image/파비콘 수집** (`scripts/enrich-300-official-logo*.mjs`, 3라운드): 알려진 공식 도메인 목록으로 홈페이지를 직접 fetch해 `og:image` 또는 `apple-touch-icon`을 추출하고, 이미지 URL 자체를 별도로 GET 요청해 `Content-Type: image/*` 응답인지 재검증한 것만 반영했다(1차 검증에서 실패한 항목 6건은 되돌림 — 404/SSL 불일치 확인). 총 178건 신규 반영.

**3단계 — WebSearch 보조 Commons/한국어 위키백과 탐색**: Commons API `generator=search`가 랭킹 문제로 놓치는 파일(정확한 파일이 있어도 상위 노출 안 됨)과 한국어 위키백과 로컬 업로드 파일(Commons에는 없음)을 찾기 위해 `site:commons.wikimedia.org`/`site:ko.wikipedia.org` 웹검색을 병행했다. 이 단계에서 **1·2단계가 놓친 넥슨(File:Nexon.svg, 1단계에서는 프랑스 코뮌 오탐만 찾았던 것과 다른 올바른 파일)과 CGV(File:CGV logo.svg, 애초에 존재했으나 1단계 토큰매칭 로직이 놓침)를 정확히 찾아 수정**했다. 추가로 유한킴벌리·G마켓·에잇세컨즈·빈폴·아이코닉스·현대카드·동화약품활명수·코오롱FnC·힐스테이트 9건을 categories/globalusage/업로드 코멘트로 재검증 후 반영했다. 이 단계에서도 오탐 후보(동국제약 검색이 실제로는 별개 회사인 동화약품 파일을 반환, 위니아딤채 검색이 현재 브랜드가 아닌 구 대우전자 로고를 반환)를 발견해 반영하지 않고 걸러냈다 — 동명·유사명 오탐은 검색 방법을 바꿔도 계속 발생하므로 매 건 개별 재검증이 필수다.

**추가 라운드**: 남은 항목 중 프랜차이즈·중견기업 위주로 site: 제한 없는 WebSearch까지 동원해 재탐색했다. 설빙(Category:Sulbing, 2017년 로고)과 제주삼다수(Samdasoo logo.png, ko.wikipedia 로컬 표기이나 실제로는 Commons 공유 파일)를 추가로 확정 반영했다. 죠스떡볶이·두끼떡볶이·처갓집양념치킨·원할머니보쌈·탐앤탐스·신원·세정·형지·우체국보험·위메프·에이블리·롯데칠성·대한제분곰표 등은 pngegg/pngwing 같은 제3자 스톡 사이트에만 노출될 뿐 Wikimedia Commons·위키백과·공식 홈페이지 og:image 어디에도 근거가 없어 반영하지 않았다 — 출처 신뢰도가 낮은 스톡 사이트 이미지는 이 프로젝트의 출처 기준에 맞지 않는다.

**6단계 — Wikidata P154(logo image) 속성 조회**: 위키백과 인포박스 썸네일과는 별도로, Wikidata 항목의 "로고 이미지" 전용 속성(P154)을 남은 104건 전체에 대해 자동 조회했다. 자동 조회 자체는 0건이었으나(브랜드명 축약형으로 검색해 Wikidata 항목 매칭에 실패), 수동으로 정식 명칭("롯데칠성음료")으로 재조회하니 File:Lotte chilsung beverage.png가 확인되어 **롯데칠성(1609) 1건을 추가 반영**했다. 이는 자동 검색 스크립트가 DB에 저장된 축약 브랜드명("롯데칠성")과 Wikidata 항목의 정식 명칭("롯데칠성음료") 간 표기 차이로 매칭에 실패한 사례이며, 나머지 103건은 정식 명칭으로도 Wikidata 항목 자체가 없거나 P154 속성이 비어 있었다.

**6가지 공식/검증 방법 최종 결과: 300건 중 197건(65.7%)에 검증된 로고 확보, 103건 미확보.** 회차를 거듭할수록 적중률이 급감했다(76% → 29% → 7% → 13% → 0%/10 → 1%/103) — 이 시점에서 안전하고 정확하게(공식·자유 라이선스 출처만) 확보 가능한 한계에 도달했다고 판단했다.

**7단계 — 비공식/연구용 티어 추가 (사이트가 연구 목적이라는 전제하에 승인됨)**: 이 사이트는 연구·비교 목적이므로, 공식 출처가 없는 나머지 103건에 대해 나무위키 문서의 대표 이미지(`og:image`)를 비공식 출처로 수집했다. 단, 무분별하게 반영하지 않고 다음 검증을 거쳤다:
  - 동일 이미지 URL이 서로 다른 여러 브랜드에 반복 매칭되는 경우 나무위키의 "로고 없음" 기본 플레이스홀더로 판단해 **전량 제외**했다(4개 플레이스홀더 URL, 20개 브랜드 영향).
  - 남은 후보는 이미지 자체를 HTTP로 재요청해 `Content-Type: image/*` 및 정상적인 파일 크기(1KB~30KB대, 사진이 아닌 벡터/아이콘 수준)인지 확인한 것만 반영했다.
  - 브랜드명으로 문서를 못 찾은 경우 "(기업)"/"(단체)" 등 나무위키 동음이의어 접미사로 재시도했다(대한제분·현대카드·바나나맛우유 3건 추가 확보. 단 현대카드DIVE는 서브브랜드 전용 로고가 아니라 모브랜드 현대카드 로고임을 주석에 명시).
  - 이렇게 확보한 **53건**은 `logoSourceTier: "unofficial-research-only"`로 명시적으로 태깅했고, `logoHistory[].note`에 "공식 출처 미검증 — 연구/비교 목적으로만 사용"이라는 문구를 넣어 197건의 검증된 로고와 구분되도록 했다.

**최종 결과: 300건 중 250건(83.3%)에 로고 확보 — 검증됨 197건 + 비공식/연구용 53건. 50건은 여전히 미확보.**

- 로고를 판정할 때 UI/공개 배포 단계에서는 `logoSourceTier`를 반드시 확인해 비공식 로고를 공식 브랜드 자산처럼 노출하지 않아야 한다(워터마크·출처 표기 또는 별도 섹션 분리 권장).
- 남은 50건은 나무위키 문서 자체가 없거나(404), 문서는 있지만 인포박스에 로고 이미지가 없는(플레이스홀더로 대체된) 경우다. 목록은 `300-brands/logo-final-status.json`의 `stillMissingLogoIds` 참고. `reports/data-completion-backlog.csv` 우선순위에 반영해 리서처가 공식 홈페이지·보도자료·SNS 프로필 등에서 수동 수집해야 한다. **추측 매칭으로 채우지 말 것** — 이번 작업에서 여러 차례 확인했듯 동명이인·유사명·구 브랜드·플레이스홀더 오탐 위험이 실재하며, 방법을 바꿔도 매번 재발한다.

## 브랜드 유형(brandType) — 산업 분류와 병렬로 추가하는 축

기존 `industry`(산업군) 분류는 그대로 유지한다. 여기에 브랜드의 탄생 동기·운영 규모 기준 6개 유형(`brandType`)을 **별도 축**으로 추가한다. 하나를 다른 것으로 대체하지 않고, 브랜드 1개가 두 태그를 동시에 갖는다.

예: LG전자 = `industry: 제조·전자` × `brandType: 레거시대기업`

**6개 유형(enum)**

| 유형 | 판단 기준 | 예시 |
|---|---|---|
| 생계형로컬 | 창업자 생계·지역 밀착, 성장보다 지속이 목표 | 30년 냉면집, 동네 빵집 |
| 시장혁신형 | 시장 공백·기술 기회로 시작, 스케일과 투자 유치가 지표 | 카카오뱅크, 쿠팡, 당근마켓 |
| 미션드리븐 | 사회·환경 문제가 탄생 동기, 이익보다 임팩트 우선 | 토니스 초코론리 |
| 레거시대기업 | 산업화 시대 창업, 사업 다각화, 브랜드보다 그룹이 먼저 | 삼성, LG, 현대 |
| 글로벌스케일업 | 소규모로 시작해 VC 투자 기반으로 빠르게 확장 | 젠틀몬스터, 토스, 무신사 |
| 가치주도대형 | 철학이 사업보다 먼저, 성장 거부가 전략이 되기도 함 | 파타고니아, REI, 아이코닉스 |

**필드 구조**

판단 순서(1번: 규모·시기 → 2번: 탄생 동기 → 3·4번: 세부 분기)와 경계 사례 처리 원칙은 [`BRAND_TYPE_CLASSIFICATION_RULES.md`](./BRAND_TYPE_CLASSIFICATION_RULES.md)를 따른다. `brandType` 태깅 작업은 사람이든 에이전트든 이 문서 없이 임의 판단하지 않는다.

```json
"brandType": {
  "primary": "생계형로컬 | 시장혁신형 | 미션드리븐 | 레거시대기업 | 글로벌스케일업 | 가치주도대형",
  "reason": "판단 근거 2~3문장, 판단 순서의 어느 분기를 거쳤는지 포함",
  "key_signals": ["판단에 사용한 핵심 신호 2~4개"],
  "confidence": "high | medium | low",
  "alternative_type": "애매한 경우 두 번째 후보 유형, 명확하면 null",
  "review_needed": true
}
```

- 삼성·LG처럼 판단 순서 1번에서 바로 확정되는 브랜드는 `confidence: high` + `review_needed: false`로 자동 확정하고 사람 검토를 거치지 않는다.
- `confidence: low`이거나 `alternative_type`이 채워진 경우 `review_needed: true`로 표기하고 검토 큐로 넘긴다. **검토는 `review_needed: true` 항목에만 집중한다.**
- 서구 헤리티지 럭셔리 하우스처럼 6개 유형 중 어느 것도 깔끔히 들어맞지 않는 경계 사례는 억지로 확신도를 올리지 않는다. `alternative_type`을 채우고 `review_needed: true`로 남긴다.
- 이 태깅의 우선 목적은 정밀 분류가 아니라 **유입 콘텐츠(브랜드 유형 테스트, 결과 공유 카드)의 데이터 소스 확보**다. 정확도를 높이려고 유형 수를 늘리지 않는다. 6개를 유지한다.

## 역할별 오더

### 1. 기획 리드

- 산업 도메인별 최소 공개 기준을 정의한다.
- 각 산업의 브랜드 수 편중을 주간 단위로 확인한다.
- 홈 노출 브랜드는 `image`, `logoHistory`, `sections.overview`, `sections.identity`, `sections.products`가 있는 브랜드로 제한한다.
- 신규 국내 브랜드는 검증 가능 자료가 있는 경우에만 `source-imports` CSV로 투입한다.
- `brandType` 태깅은 `A_magazine_ready`, `B_editorial_review` 티어부터 우선 적용하고(파일럿 25개 완료), 이후 `B_identity_archive`로 확장한다. `review_needed: true` 큐 적체를 주간 단위로 확인한다.

### 2. 자료 리서처

- `reports/data-completion-backlog.csv`의 `priority` 순서대로 보강한다.
- 1개 브랜드당 최소 수집 항목:
  - 대표 이미지 1개
  - 현재 로고 1개
  - BI/CI 변천 항목 1개 이상
  - 설립/국가/본사/산업/제품 또는 서비스
  - 창업자 또는 핵심 경영진
- 로고 변천사는 연도 확인이 가능한 경우 `year`를 넣고, 확인 불가 시 `대표 로고`로만 등록한다.
- 자동 크롤링 금지 사이트는 수동 검수 CSV 또는 승인된 export만 사용한다.
- `brandType.primary` 판단에 필요한 근거(창업 동기, 투자 유치 여부, 사업 규모·구조)를 수집 항목에 포함한다. 근거가 부족하면 추정하지 말고 `confidence: low`로 남긴다.
- **우선순위 오버라이드(한국 브랜드 브랜드유형 태깅용) — 완료**: 아래 13개는 `definition`이 비어 있거나 산업군 공통 템플릿 문장뿐이라 사이트 본문만으로는 `brandType` 태깅이 불가능했다. `source-imports/reference-korea-growth-brands.csv`의 출처 메모와 각 브랜드에 대해 공개적으로 검증 가능한 일반 지식(창업자, 유통 채널, 상장 여부 등)을 근거로 잠정 태깅했으며, 그만큼 대부분 `confidence: medium/low` + `review_needed: true`로 남겨뒀다. 본문(특히 창업 배경·투자 이력) 보강이 완료되면 `confidence`를 재검토해야 한다.
  - 마뗑킴, 마르디 메크르디, 마리떼 프랑소와 저버, 디스이즈네버댓, 아크메드라비, 렉토, 떠그클럽, 스탠드오일, 에이이에이이, 젝시믹스, 메디힐, 토리든, 클리오

### 3. 에디터

- 리서처가 넣은 사실만 문장화한다.
- “브랜드입니다”, “정체성을 만든”, “고객 접점”, “반복 구매” 같은 범용 문장으로 빈칸을 채우지 않는다.
- 매거진 본문은 다음 섹션을 우선으로 채운다:
  - `overview`: 한눈에 보는 브랜드
  - `origin`: 시작과 성장
  - `identity`: 브랜드 아이덴티티
  - `products`: 제품과 서비스
  - `people`: 사람들
  - `current`: 현재 상태
  - `timeline`: 연도형 사건
  - `logoHistory`: BI/CI 변천사
- `brandType.reason`도 다른 본문과 같은 원칙을 따른다. 판단이나 평가가 아니라 확인된 사실(창업 배경, 투자 이력, 사업 구조)만 1~2문장으로 쓴다.

### 4. 개발

- `source-imports/*.csv`를 통해서만 대량 반영한다.
- 반영 순서:
  1. `node scripts/import-source-data.mjs`
  2. `node scripts/remove-source-fields.mjs`
  3. `node scripts/strip-synthetic-content.mjs`
  4. `node scripts/build-data-backlog.mjs`
  5. `node scripts/qa-check.mjs`
- 공개 화면은 품질 미달 브랜드를 홈 주요 영역에 노출하지 않는다.
- `brandType`은 기존 `industry` 필드를 대체하지 않고 병렬 필드로 추가한다. 기존 스크립트 파이프라인과 카드/상세 페이지 렌더링에 영향 없이 추가되어야 한다.
- `entityType`(`상업브랜드` | `비상업기관`)을 세 번째 병렬 축으로 추가했다. `비상업기관`인 경우 `institutionCategory`(이벤트·행사 | 비영리·문화기관 | 재단·자선·캠페인 | 장소브랜딩 | 협회·단체 | 연구·교육기관)를 함께 갖는다. "브랜드 유형 테스트" 등 유입 콘텐츠는 반드시 `entityType: "상업브랜드"`만 대상으로 한다 — 올림픽 아이덴티티나 미술관을 "당신의 브랜드 유형은?" 테스트 결과로 보여주면 안 된다.
- 다음 우선순위 기능(별도 착수)은 태깅 커버리지가 쌓인 뒤 진행한다: `brandType` 기반 "브랜드 유형 테스트" 페이지와 결과 공유 이미지. 유입 채널 목적이므로 정밀도보다 공유 가능한 결과 문구를 우선한다.

### 5. QA

- QA 실패 시 배포하지 않는다.
- 필수 확인:
  - 공개 JSON에 출처 필드 없음
  - placeholder 이미지 감소
  - `logoHistory` 없는 브랜드 감소
  - 금지 문구 없음
  - 산업 분류 오류 없음
  - 모바일 카드 레이아웃 깨짐 없음
  - 브랜드 상세 페이지의 BI/CI 이미지가 잘리지 않음
  - `brandType.primary`가 6개 enum 외 값으로 저장되지 않음
  - `review_needed: true`인데 검토 없이 공개 노출되지 않음

## brandType 태깅 현황과 후속 오더

매거진 492개 전체 태깅 완료 (`A_magazine_ready`, `B_editorial_review`, `B_identity_archive`, `D_directory_only` — 정의문이 비어 있던 한국 브랜드 13개도 CSV 출처 메모 + 공개 검증 가능한 일반 지식 기반으로 잠정 태깅).

- primary 분포: 글로벌스케일업 146 · 레거시대기업 125 · 생계형로컬 74 · 시장혁신형 69 · 미션드리븐 47 · 가치주도대형 31
- confidence 분포: high 93 · medium 191 · low 208
- `review_needed: true` 321건 — 사람 검토 큐 (본문이 얇았던 한국 브랜드 13개 포함)

**비상업 엔티티 처리 — 결정 완료**: `B_identity_archive` 태깅 중 올림픽 대회 아이덴티티, 미술관·오케스트라 등 비영리 문화기관, 재단·자선·캠페인, 장소 브랜딩, 연구기관 48건이 상업 브랜드가 아닌 것으로 확인되어 `entityType`(`상업브랜드` | `비상업기관`) 축을 신설했다. `비상업기관`에는 `institutionCategory`(이벤트·행사 11 · 비영리·문화기관 24 · 재단·자선·캠페인 6 · 장소브랜딩 5 · 협회·단체 1 · 연구·교육기관 1)를 함께 부여했다. `brandType`은 참고용으로 남겨두되(대부분 low confidence), 유입 콘텐츠는 `entityType: "상업브랜드"`만 사용한다.

## 완료 기준

1차 완료:

- `placeholderImages` 391개에서 250개 이하로 감소
- `noLogoHistory` 406개에서 250개 이하로 감소
- A/B/C 티어 브랜드 120개 이상에 대표 로고와 상세 본문 확보

2차 완료:

- `placeholderImages` 100개 이하
- `noLogoHistory` 120개 이하
- 국내 브랜드 100개 이상 추가 또는 보강
- `A_magazine_ready`/`B_editorial_review`/`B_identity_archive`/`D_directory_only` 브랜드의 `brandType` 태깅 80% 이상 완료 — **달성** (492/492, 100%). 다음 단계는 `review_needed: true` 321건 검토와, 특히 confidence가 낮게 잡힌 한국 브랜드 13개의 본문 보강 후 재태깅(위 리서처 오더 참고)

최종 공개 기준:

- 홈/산업/상세 주요 경로에서 placeholder가 기본 노출되지 않음
- 전체 브랜드의 80% 이상이 이미지와 BI/CI 항목을 보유
- 매거진급 브랜드 150개 이상
- `brandType` 태깅 커버리지가 "브랜드 유형 테스트" 유입 기능 착수 기준(기획 리드 승인 수치)에 도달 — `entityType: "상업브랜드"` 기준 431개 확보
