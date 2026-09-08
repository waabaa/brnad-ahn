# 브랜드 아틀라스 — 변경 이력

## 2026-09-08 — GEO 점검 반영 · 네이버 리다이렉션 진단 대응

검증 4종(crawl-graph·qa-seo·수용기준 20/20·redirects 757) 통과 후 배포.

### GEO(AI 검색) 최적화 — 준비도 65 → 76

- **FAQ 결손 162건 → 0** (`lib/brand-seo.mjs` `buildFaq`). 근거가 없어서가 아니라 있는 근거를 안 쓰고 있었다.
  산업 분류(자체 검수값)는 기원 국가가 있을 때만 답변에 실렸고, 아카이브 계열의 `designer:` 필드는 쓰이지 않았다.
  둘 다 기존 필드 인용이라 무할루시네이션 원칙은 그대로다. **FAQPage 커버리지 85% → 100%**.
- **인물 섹션 중복 렌더 방어**(`lib/brand-render.mjs` `dedupeSegments`). 한 레코드에 `창업자: X; CEO: Y; 창업자: X`처럼
  같은 값이 여러 벌 들어와 본문과 JSON-LD에 반복됐다(adidas 등). `키: 값` 항목 단위로 걷어낸다. 데이터 정정이 아니라
  렌더 방어라 같은 형태가 다시 들어와도 재발하지 않는다.
- **위키데이터 팩트 재수집** — P856 완전 일치 690개 개체에서 국가 632·설립 645·본사 592·창업자 246·모기업 218.
  질의 대응 비율: `OO 로고` 71%→86%, `OO 어느 나라` 36%→61%, `OO 설립연도` 36%→62%.
- 점검 보고서 `GEO-ANALYSIS.md` 갱신(09-01판 대비 변화 기록).

### 네이버 웹마스터 '리다이렉션된 페이지' 진단 108건 대응

전수 검증 결과 301 자체는 건강했다 — 107/107이 한 홉 301→200이고 매핑도 정확하며, sitemap·rss·llms·검색 인덱스·
내부 링크 어디에도 구 URL이 남아 있지 않았다. 실제 결함은 **41건의 301 목적지가 `noindex`**라 색인 교체가 진행되지
못한 것이었다.

- **색인 제외 기준을 등급이 아니라 본문 분량으로 변경**(`lib/archive.mjs` `isNoindex`). 디렉토리 등급 226건 중
  **202건이 본문 800자 이상**이라 읽을 내용이 있었다. 등급은 목록·홈 노출을 정하는 기준으로 남기고, 색인·sitemap에는
  본문이 충실한 항목을 남긴다. sitemap 브랜드 URL 1,541 → 1,743.
- **안내 문구를 실제 `robots` 값과 일치**시켰다. 색인되는 페이지에 "검색 색인에서는 제외됩니다"가 그대로 렌더되고 있었다.
- **신선도 원장이 색인 상태 변경을 갱신 사유로 인식**(`build-brand-pages.mjs` `pageDates`). 본문 해시만 비교하던 탓에
  `noindex`→`index` 변경이 `lastmod`에 반영되지 않아, 사이트맵을 재제출해도 크롤러가 재수집할 이유가 없었다.
  매 빌드 오늘 날짜를 찍는 방식으로 되돌린 것이 아니라 사유를 하나 추가한 것이다. 색인 복귀 202건만 `lastmod` 09-08.
- **UTC/KST 날짜 불일치 수정** — `build-brand-pages.mjs`만 UTC 기준이라 새벽 빌드에서 `build-seo-extras.mjs`와 하루
  어긋났다. 주간 cron이 월 05:10 KST라 매주 재현되던 문제다. KST로 통일.
- **RSS는 목록 노출 대상만** — 색인 복귀분이 갱신일 상위로 올라와 RSS 100건을 뒤덮을 상황이었다. 디렉토리 등급을
  목록·홈에서 빼는 정책과 같은 기준을 적용했다.

## 2026-09-07 — 아카이브 완성도 재건 (데이터·구조·디자인 전면 개편)

계획서: `.omc/plans/brand-atlas-archive-quality-2026-09.md`. 검증 4종(crawl-graph·qa-seo·audit 21/21·redirects 757) 통과 후 배포.

### 데이터
- **외부 핫링크 제거** — 로고 190·대표 이미지 279·BI/CI 559건이 namu.wiki·pstatic 등 외부 호스트를 직접 가리켰고
  referer 차단(403)으로 라이브에서 깨져 있었다. `scripts/localize-external-assets.mjs`로 로고 132·이미지 90·BI/CI 275건을
  자사 도메인(`images/logos|photos|bici/`)으로 가져왔다. namu.wiki 53건은 봇 차단으로 불가 → 로고 없음 처리.
- **파일 없는 BI/CI 항목 509건 제거**(`prune-logo-history.mjs`) — "로고 변천사"가 빈 박스로 발행되던 원인.
- **Wikidata 팩트** — QID 확정 408건에서 국가 363·설립일 380·본사 350·창업자 130·모기업 126을 가져와 `brand.wikidata`에
  기록(`enrich-wikidata-facts.mjs`). 훼손 레이블(소문자 라틴)은 버린다. 설립연도 확인 브랜드 36% → 538건, 기원 국가 486건.
- **로고 보강** — Commons(P154) 2건 + 공식 사이트(apple-touch-icon·logo img) 44건 중 육안 검수로 7건 기각 → 37건 채택.
  손으로 확인한 공식 도메인 55건을 `officialWebsite`에 채웠다. 로고 보유 1,004건.
- **아카이브 등급** — 한글 표기·로고가 모두 없는 388건을 `directory`로 분리(noindex, 목록·홈·sitemap·llms 제외,
  `pages/directory.html`에서만 링크). 본 목록 1,061건, 그중 core 539건.

### 구조·디자인
- 디자인 시스템 재작성(`styles.css`): Pretendard, 본문 400, 로고 타일 중심, 체크박스 모바일 메뉴(JS 불필요).
- 페이지 셸 통일(`lib/page-shell.mjs`): 헤더 검색창, 한글 내비(브랜드 사전·산업별·국가별·로고 아카이브·타임라인·인사이트), 푸터 안내 링크.
- 브랜드 페이지(`lib/brand-render.mjs`): 검증값만 담은 **브랜드 정보 표**(출처 표기), **질문형 H2**(데이터 있는 절만),
  목차, 로고 변천사, FAQ(창업자·본사·모기업 추가), 출처와 검증 절, 관련 브랜드 로고 타일. `dateModified`는 본문 텍스트 해시 기준.
- 허브 전면 정적화·재설계: 카테고리 12·국가 15(설명 포함 목록으로 700자 기준 충족), 신규 `pages/ganada.html`(가나다·ABC 색인),
  `pages/countries.html`, `pages/directory.html`, `pages/about.html`(편집 원칙), `pages/privacy.html`, `pages/contact.html`.
  `industry`·`bici`(로고 월 885)·`timeline`·`insights` 는 app.js 없이 완결.
- 홈 재작성: 검색 → 산업 카드 → 주요 브랜드 48 타일 → 오늘의 브랜드(빌드 날짜 결정) → 최근 갱신 → 가나다·국가 → 편집 원칙.
- 검색: 8.4MB JSON 대신 `data/search-index.json`(393KB) + **초성 검색**(ㄱㅉ→구찌) + 로고 결과.
- 문의 채널: 자체 폼 → `/contact-api/submit`(nginx rate limit) → 어드민 "문의" 탭(`admin_server.py`, 이메일 발송 없음).
- 검증 스크립트 갱신: AC-A6 "sitemap == 색인 대상", AC-B4 비율 기준, 허브 목록에 ganada 추가.

### 잔여 과제 처리 (같은 날 2차)
- **등급 규칙 교정** — 구 파이프라인의 `publicReady=false` 플래그로 도이치 그라모폰·컬럼비아 레코드·워너 뮤직 그룹 등
  156건이 디렉토리로 떨어져 있었다. 한글 표기·로고 기준만 남김 → 본 목록 1,218 / 디렉토리 231.
- **로고 육안 검수 채택 54건** — 헤드리스 크로미움으로 렌더한 공식 사이트 DOM + 네이버 이미지 API 후보를
  컨택트시트로 검수(`collect-logo-candidates.mjs` → `apply-logo-candidates.mjs`, 근거 `reports/visual-logo-picks.json`).
  한화생명·롯데제과·카카오프렌즈·래미안·위메프·KCC 등. 로고 미보유(한글명) 85 → 31건.
- **사용자 정의 404**(검색창·색인 링크, 상태 코드 404 유지) — `deploy/patch-nginx-404.py`.
- **실동작 확인(라이브)** — 초성 검색(ㅅㅌㅂㅅ→스타벅스)·산업 칩·실시간 입력, 모바일 메뉴 열림·링크 노출, 문의 폼 브라우저
  제출→어드민 "문의" 탭 조회, 가나다 앵커 스크롤(고정 헤더 오프셋), 브랜드 페이지 이미지 전량 로드, 301 757건,
  주간 리프레시 파이프라인(`--no-deploy`) 전 단계 통과.
- 국가 허브 노르웨이·뉴질랜드는 브랜드 수 미달로 제거(→ `/pages/countries.html` 301).
- 남은 것: 한글명 로고 미보유 31건(닥터자르트·롬앤·아이더·탐앤탐스·더벤티·불스원 등 — 공식 사이트가 JS/차단이라 수동 수집 필요),
  지역 음식명 항목(전주비빔밥 등)은 브랜드가 아니라 로고를 붙이지 않음.

## 2026-09-01 — GEO(AI 검색) 대응 + 잔여 기술 결함 교정

2026-08-15 Phase A~E로 수용기준 13항목이 전부 통과한 뒤 재감사해 남은 손실 10건을 교정했다.
계획서: `.omc/plans/brand-atlas-geo-visibility-2026-09.md`

### 호스트·색인
- **`www` → apex 301** — 두 호스트가 같은 바이트를 200으로 돌려주고 있었다(canonical만 apex 지정).
  443 server_name에서 www를 분리하고 전용 301 블록을 뒀다(`deploy/patch-nginx-canonical-host.py`, 멱등·자체 원복).
- **JS 껍데기 3종 `noindex,follow`** — `brand-artemio.html`(3.3KB)은 **전 1,449 브랜드 페이지의 nav에서
  링크**되어 사이트 내부링크 최다 대상이 빈 페이지였다. nav에서 제거하고, BI/CI·검색 페이지의 JS 목록
  링크도 `?brand=` SPA 대신 정적 `/brand/<slug>.html`로 돌렸다. 껍데기로 가는 내부링크 1,449 → 0.
- **데이터 백업본 공개 차단** — `data/*.bak-*`(11MB×2)이 200으로 서빙되고 있었다. nginx 404 +
  배포 스크립트 제외·서버 정리 + `.gitignore`. 저장소에서도 추적 해제.

### 신선도 (AI 인용의 전제)
- `dateModified`/`datePublished`가 **0건**이었다. 최신성은 AI 인용의 1차 조건인데 판단 근거 자체가 없었다.
- **본문 해시 원장**(`reports/page-dates.json`) 도입 — 렌더 본문이 실제로 바뀐 페이지만 `dateModified`를
  갱신한다. 매 빌드 오늘 날짜를 찍으면 거짓 신선도 신호가 되므로(`writeIfChanged`와 같은 이유),
  원장이 없거나 유실돼도 배포본 본문 해시로 스스로 복구한다.
- `Article` JSON-LD(발행/수정일·발행 주체) 1,449건, 가시 "최종 업데이트" 표기 1,449건.
- sitemap `lastmod`를 원장의 `modified`와 같은 값으로 일치시켰다.

### 엔티티 연결 (sameAs)
- Wikidata **P856(공식 웹사이트) URL 완전 일치**로만 개체를 확정해 **408건**에 `sameAs`
  (Wikidata + 한국어/영어 위키백과) 부착. ko위키 272, en위키 330.
- 이름 유사도 매칭은 쓰지 않는다. 채택 조건은 ① 한 QID가 한 브랜드에만 대응 ② `P31/P279*`로
  조직·브랜드 개체 확인 ③ 레이블이 브랜드명과 일치. 하나로 좁혀지지 않으면 **아무것도 쓰지 않는다**.
  실제로 초기 구현은 `intel.com`에서 "Flea"를, `ralphlauren.com`에서 창업자(사람)를 골랐다.
  기각 42건의 사유는 `reports/wikidata-entity-links.json`에 남는다.

### 크롤 그래프·콘텐츠 품질
- **가시 breadcrumb을 링크로** — 종전 `<p>홈 > 브랜드 매거진 > X</p>`는 링크가 아니었고 JSON-LD의
  BreadcrumbList와 표기도 달랐다. 3단 링크 `<nav>`로 바꾸고 2단을 실제 산업 카테고리 허브
  (`/category/<slug>.html`)로 보냈다 — 브랜드 페이지 1,449개에서 12개 허브로 가는 상향 링크가 새로 생겼다.
- **타임라인 스크랩 잔재 정리** — 같은 문단이 여러 연도에 복제된 레코드(897개 연표 중 426개) 중복 제거,
  문장 중간에서 끊기던 하드 절단을 문장·어절 경계 절단으로 교체.
- **BI/CI 캡션·alt 변별** — 한 페이지의 이미지 5개가 모두 같은 alt였다(82페이지). 중복 캡션에만 순번 부여.
- `bilingualName` 이중 병기 버그(`토스(TOUS)(TOUS)`) 수정 — SPA·SSG 양쪽.

### AI 크롤러·이미지
- `robots.txt` — Yeti·Googlebot + AI 크롤러 10종(GPTBot·OAI-SearchBot·ClaudeBot·PerplexityBot 등) 명시
  허용, sitemap 4건 등재. 구글은 AI 전용 파일이 순위에 영향이 없다고 명시했으므로 순위 목적이 아니라
  보수적으로 판단하는 크롤러의 접근을 확실히 열어두기 위한 것이다.
- `llms.txt` 신규 — 허브 28건 + 주요 브랜드 60건. 수치는 전부 실제 집계값이다.
- **이미지 sitemap** — 이미지 검색이 실유입원인데 sitemap에 이미지가 0건이었다. 자사 도메인 이미지만
  1,413건 등재(외부 호스트 이미지는 소유 확인이 안 되므로 제외).

### 수용기준
`scripts/audit-seo.mjs`에 AC-G2~G8을 추가해 **20/20 PASS**. 검증 4종(crawl-graph·qa-seo·audit-seo·
redirects 755건) 전부 통과 후 배포.

## 2026-08-15 — 검색 노출 재건 (Phase A/B/C/E + 신선도 엔진)

네이버 색인이 473/1,452(32.6%), 30일 노출 1,400·클릭 26에 머문 원인을 실측 진단하고 교정.

### 진단
- **크롤 경로 붕괴**: 네이버 크롤러는 JS를 실행하지 않는데, 1,452개 브랜드로 가는 정적 링크가 `pages/brands.html` 한 곳뿐이었다. `industry`/`bici`/`insights`/`timeline` 허브는 전부 JS 렌더라 크롤러에겐 빈 페이지였고, 홈의 정적 브랜드 링크는 1개였다. `insights.html`이 노출 197로 사이트 1위인데 CTR 0.5%인 것도 3.3KB 껍데기가 색인된 결과.
- **키워드 미스매치**: title의 40%가 무수요 문자열("브랜드 매거진"), 751건은 한글 표기 없음, FAQPage JSON-LD 0건. 네이버에서 브랜드명 헤드 키워드는 커머스(SSG·W컨셉·무신사)가 점유해 경쟁 대상이 아니며, 실제 클릭은 정보 의도 롱테일에서 CTR 33~100%로 발생.
- **thin 시그널**: 빈 섹션 안내문이 977건(67%)에 노출.

### 데이터 오염 발견
`country`·`foundedYear` 필드가 신뢰 불가로 확인. `country`는 설립국이 아니라 현 소유주 국적이 섞여 있고(구찌="프랑스", 아크테릭스="중국", 코치넬레="한국") 소유와 무관한 오류도 다수(롤렉스="영국", 지멘스="러시아", 하인즈="한국"). definition 대조 시 명시적 불일치 161건. `foundedYear`도 모기업 창업연도가 섞여 281건 불일치(말보로=1847 ← 실제 도입 1924).
→ 두 필드를 폐기하고 사람이 검수한 `definition`에서 **기원 문맥이 확정된 경우만** 추출(`scripts/lib/brand-seo.mjs`). 소유·유통 문맥에서 등장한 국가는 버리고, 근거가 없으면 수식어를 생성하지 않는다. 커버리지보다 정확도 우선.

### Phase A — 크롤 그래프 재건
- `/category/<산업>.html` 12개 신설 — 1,452개 브랜드 전량 커버
- `/country/<국가>.html` 16개 신설 — 508건(기원 국가가 검증된 브랜드만)
- JS 렌더 허브 4종에 정적 목록 주입: 산업 620 / 인사이트 300 / BI·CI 1,027 / 타임라인 528
- 홈 정적 브랜드 링크 1 → 120
- sitemap: 단일 파일·고정 lastmod → **index + 3분할, 실제 mtime 기반**
- 결과: 정적 링크만으로 **1,452/1,452 도달**(depth≤2), 끊긴 링크 0

### Phase B — 검색 의도 정렬
- title 재설계: "브랜드 매거진" 필러 제거, 한/영 병기 53 → 1,116, 정보 의도 수식어(기원 국가·설립연도·산업) 부착
- h1 한/영 병기 53 → 1,101
- FAQ 섹션 + FAQPage JSON-LD **0 → 1,237** (답변은 전부 기존 데이터에서 인용, 생성 금지)
- description 80~155자 1,451/1,452

### Phase C — thin 정리
- 빈 섹션(타임라인·BI/CI·제품) 렌더 차단 — `empty-note` 977 → 0 (SPA·SSG 동시 적용)
- 렌더 본문 700자 미만 46건 `noindex,follow` + sitemap 제외 (링크 그래프는 보존)
- 중복 레코드 2건 canonical 통합

### Phase E — URL 정상화
- 무의미 slug **519건 이전**: `brand-440` → `walmart`, `brand-171` → `triumph-international` 등
- nginx map 기반 **301 리다이렉트 519/519 전건 검증 PASS**
- `&`가 든 파일명 소멸 → URL 인코딩 문제 해소
- 유지 4건(영문 표기 없음 1, 신 slug 충돌 3)

### Phase D — 신선도 엔진
- `deploy/weekly-refresh.sh` + cron(월 05:10): 재빌드 → 검증 → 배포 → 색인 측정. **수용기준 미달 시 배포 중단**
- 두 빌더에 `writeIfChanged` — 내용이 같으면 파일을 쓰지 않아 lastmod가 실제 변경분만 반영(거짓 신선도 신호 차단)
- `scripts/track-index.mjs` — 네이버 색인 수를 `.omc/state/seo-index-log.json`에 누적
- RSS 80건 고정 → 100건 롤링

### 검증 도구 (신규)
- `scripts/verify-crawl-graph.mjs` — 정적 링크 그래프 도달성·깊이·끊긴 링크
- `scripts/audit-seo.mjs` — 수용기준 13항목
- `scripts/qa-seo.mjs` — 산출물 정합성(sitemap↔파일, JSON-LD, canonical, noindex)
- `scripts/verify-redirects.mjs` — 301 전건

계획서: `.omc/plans/brand-atlas-search-visibility-2026-08.md`

## 2026-06 — 도메인 이전 · SEO · 콘텐츠/UI 개선

### 도메인 이전 (brand.resort.co.kr → brandatlas.co.kr)
- 정식 도메인 `brandatlas.co.kr` 전환. DNS가 배포 서버(116.125.140.86)를 직접 가리켜 **Nginx로 서빙**(`/var/www/brandatlas`).
- Let's Encrypt 인증서(apex + www, 자동 갱신), HTTP→HTTPS 301.
- 전 소스 origin/canonical/OG/JSON-LD/sitemap/robots를 신 도메인으로 교체.
- 배포: `deploy/deploy-brandatlas.sh`(handoff → 서버 rsync → `sudo cp` → nginx reload).
- 레거시 brand.resort.co.kr은 Cloudflare Worker(GitHub raw)로 유지, canonical은 신 도메인 지정.
- 네이버 서치어드바이저 인증 메타태그, sitemap 네임스페이스(sitemaps.org) 정상화.

### 검색 인덱서빌리티 (Phase 1)
- 브랜드 상세를 단일 SPA(`brand-artemio.html?brand=`)에서 **per-brand 정적 페이지(SSG) 983개**(`/brand/<slug>.html`)로 전환 — 색인 가능 면적 1 → 983.
- 각 페이지 정적 메타/자기참조 canonical/OG + JSON-LD(Organization·BreadcrumbList). 완전한 sitemap(989 URL, 쿼리스트링 0).
- Cloudflare Worker가 non-ASCII 경로를 못 서빙하는 문제로 한글 슬러그 124개·로고 61개를 **ASCII로 전환**(urlSlug, brand-<id>).
- 생성기: `scripts/build-brand-pages.mjs`(app.js 렌더 로직 Node VM 재사용).

### 콘텐츠
- Phase 0: 내부 메타데이터 누출 정리(`current.body`), 중복 텍스트 577→11종.
- 로고: Wikidata P154 + 정확 이름매칭으로 인지도 브랜드 로고 발굴(총 329→351, SVG 벡터·고해상도, 오매칭 감사·제거).
- 젠틀몬스터: 게이트웨이 search-grounded 심층 조사로 6섹션+타임라인+facts 입력, **홈 첫페이지 고정(추천 브랜드)**.

### UI/UX
- 매거진 본문: column-count 마조너리 → **CSS Grid 바둑판(2열 균등 높이)**. 긴 산문이 좁은 셀에 갇혀 늘어지던 문제 해소.
- 히어로: 실사진 없는 브랜드(로고=이미지)는 photo 슬롯 생략 → 워드마크 크롭 깨짐 해소.
- 브랜드 인사이트 목록: 강제 1열 → **반응형 카드 그리드**(auto-fill), 4줄 클램프로 균일 높이.

### 도구
- `scripts_py/fetch_logos_wikidata.py` — Wikidata P154 로고 발굴(정확 이름매칭, ASCII 파일명).
- `scripts_py/phase2_enrich_draft.py` / `phase2_publish.py` — 게이트웨이 search-grounded 콘텐츠 드래프트 생성·게시(사람 검수 게이트, 미사용/PoC).
