# 브랜드 아틀라스 UI 개발 적용 패키지

이 패키지는 목업 디자인을 실제 브랜드 DB 기반 화면으로 연결한 정적 프로토타입입니다.

## 포함 파일
- `index.html` : 랜딩페이지
- `pages/industry.html` : 산업별 탐색 서브 페이지
- `pages/brand-artemio.html` : 개별 브랜드 매거진 페이지. 기본값은 스타벅스이며 `?brand=apple`처럼 slug로 전환 가능
- `pages/mobile.html` : 모바일 반응형 페이지 쇼케이스
- `pages/other-pages.html` : 통합 검색 / BI·CI 타임라인 / 관리자 페이지
- `styles.css` : 공통 디자인 시스템 CSS
- `app.js` : JSON 기반 렌더링 JS
- `data/brand-atlas.json` : 실제 DB에서 추출한 메뉴, 브랜드, 산업, 인사이트, 관리자 모듈 데이터
- `assets/mockups/` : 최종 5개 전체 목업 PNG
- `assets/objects/` : 목업에서 분해한 이미지 오브젝트 JPG/PNG 및 아이콘 PNG
- Google Fonts Noto Sans KR : 한글/영문 공통 웹폰트
- `robots.txt`, `sitemap.xml` : 기본 SEO 크롤링 파일

## 폰트/타이포그래피

- Google Fonts의 Noto Sans KR 300/400/500/700 굵기를 사용합니다.
- 한글과 영문 모두 동일한 산세리프 계열로 맞춰 브랜드 사전 본문의 결을 통일했습니다.
- 본문은 넉넉한 행간(`line-height: 1.72`)과 자간 `0`을 기본값으로 두고, 제목은 굵기와 크기 대비로 위계를 만듭니다.
- Google Fonts preconnect를 적용해 초기 렌더링 지연을 줄입니다.

## SEO

- 페이지별 `title`, `description`, canonical, Open Graph, Twitter Card를 추가했습니다.
- 랜딩에는 `WebSite` JSON-LD와 `SearchAction`을 적용했습니다.
- 브랜드 상세 페이지는 선택된 브랜드에 맞춰 `Article` + `Brand` JSON-LD, title, description, OG 정보를 갱신합니다.
- 실제 배포 도메인이 정해지면 `canonical`, `sitemap.xml`, `robots.txt`의 `localhost` URL을 운영 도메인으로 교체해야 합니다.

## 사용 방법
1. 압축을 풉니다.
2. `index.html`을 브라우저에서 엽니다.
3. 개발 프로젝트에 붙일 때는 `styles.css`, `app.js`, `data/brand-atlas.json`, `assets/` 폴더를 함께 복사합니다.
4. 실제 서비스에서는 `data/brand-atlas.json`을 API 응답으로 대체하면 됩니다.
5. 이미지 일부는 프로젝트 루트의 `images/` 폴더를 참조하므로 로컬 확인 시 프로젝트 루트에서 정적 서버를 띄우는 방식을 권장합니다.

## QA

- `node web-design/brand_atlas_handoff/scripts/qa-check.mjs`로 데이터 품질 게이트를 확인합니다.
- 현재 게이트는 식음료 산업의 음반/레코드 오분류, 대표 검색어 1위 결과, A등급 공개 금지 문구를 검사합니다.
- 창작형 보강 문구가 공개 데이터에 섞이면 QA가 실패합니다.
- `scripts/fill-content-gaps.mjs`는 더 이상 사용하지 않습니다. 창작 보강을 막기 위해 실행 즉시 실패하도록 차단했습니다.

## 원천 데이터 Import

- 결제/다운로드한 Brandirectory 또는 Brand Finance 데이터는 `source-imports/brandirectory-*.csv`처럼 넣고 `node web-design/brand_atlas_handoff/scripts/import-source-data.mjs`를 실행합니다.
- WIPO Global Brand Database는 공개 웹 화면의 자동 질의, scraping, bulk download/storage가 금지되어 있으므로 WIPO가 허용한 별도 제공 데이터나 사용자가 합법적으로 export한 파일만 `source-imports/wipo-*.csv`로 넣습니다.
- Careet, Open Ads, Fashionnet, Brunch 같은 기사/트렌드 사이트는 본문을 복사하지 않고 `source-imports/reference-notes.csv`에 브랜드명, 제목, URL, 메모만 저장합니다.
- import 결과는 브랜드별 `sources`, `brandFinance`, `trademarks`, `references` 필드에 저장되며, 공개 페이지에는 확인된 필드만 노출됩니다.

## 페이지 연결
- 랜딩: `index.html`
- 산업별 탐색: `pages/industry.html`
- 브랜드 상세: `pages/brand-artemio.html`
- 브랜드 상세 예시: `pages/brand-artemio.html?brand=apple`, `pages/brand-artemio.html?brand=nike`
- 모바일 반응형: `pages/mobile.html`
- 기타 페이지: `pages/other-pages.html`
