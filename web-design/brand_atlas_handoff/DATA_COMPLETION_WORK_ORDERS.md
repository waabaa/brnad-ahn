# Brand Atlas Data Completion Work Orders

## 원칙

이 프로젝트의 브랜드 DB는 추정 문장으로 채우지 않는다. 모든 보강은 확인된 브랜드명, 공식/공개 데이터, 로컬 매거진 원문에서 확인 가능한 사실, 허용된 export 파일, 또는 직접 확보한 이미지 자산을 기준으로 한다.

공개 화면과 공개 JSON에는 출처 문구를 노출하지 않는다. 출처 URL, 수집 경로, 검수 메모는 작업용 파일에만 둔다.

## 역할별 오더

### 1. 기획 리드

- 산업 도메인별 최소 공개 기준을 정의한다.
- 각 산업의 브랜드 수 편중을 주간 단위로 확인한다.
- 홈 노출 브랜드는 `image`, `logoHistory`, `sections.overview`, `sections.identity`, `sections.products`가 있는 브랜드로 제한한다.
- 신규 국내 브랜드는 검증 가능 자료가 있는 경우에만 `source-imports` CSV로 투입한다.

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

### 4. 개발

- `source-imports/*.csv`를 통해서만 대량 반영한다.
- 반영 순서:
  1. `node scripts/import-source-data.mjs`
  2. `node scripts/remove-source-fields.mjs`
  3. `node scripts/strip-synthetic-content.mjs`
  4. `node scripts/build-data-backlog.mjs`
  5. `node scripts/qa-check.mjs`
- 공개 화면은 품질 미달 브랜드를 홈 주요 영역에 노출하지 않는다.

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

## 완료 기준

1차 완료:

- `placeholderImages` 391개에서 250개 이하로 감소
- `noLogoHistory` 406개에서 250개 이하로 감소
- A/B/C 티어 브랜드 120개 이상에 대표 로고와 상세 본문 확보

2차 완료:

- `placeholderImages` 100개 이하
- `noLogoHistory` 120개 이하
- 국내 브랜드 100개 이상 추가 또는 보강

최종 공개 기준:

- 홈/산업/상세 주요 경로에서 placeholder가 기본 노출되지 않음
- 전체 브랜드의 80% 이상이 이미지와 BI/CI 항목을 보유
- 매거진급 브랜드 150개 이상
