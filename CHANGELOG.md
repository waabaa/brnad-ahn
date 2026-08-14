# 브랜드 아틀라스 — 변경 이력

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
