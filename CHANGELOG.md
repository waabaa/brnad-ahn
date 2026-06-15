# 브랜드 아틀라스 — 변경 이력

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
