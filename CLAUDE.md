# brand-atlas — 프로젝트 규칙

브랜드 아틀라스(https://brandatlas.co.kr) — 브랜드 사전·매거진 정적 사이트.
빌드 소스는 `web-design/brand_atlas_handoff/`, 배포는 `deploy/deploy-brandatlas.sh`.

---

## 1. 브랜드 표기 규칙 (기본 규칙)

**사람이 읽는 모든 브랜드 표기는 한글과 원어를 함께 쓴다.**

같은 브랜드를 한글로 찾는 사람과 영문으로 찾는 사람이 모두 있다. 표기가 하나만
노출되면 다른 쪽 검색어에는 걸리지 않는다.

| 위치 | 형식 | 예 |
|---|---|---|
| `<title>` | `한글(원어) — 수식어 \| 브랜드 아틀라스` | `코치넬레(Coccinelle) — 이탈리아 1978년 설립 …` |
| `<h1>` | 한글 + 작은 원어 (`.h1-en`) | `코치넬레` / `Coccinelle` |
| `<meta description>` | 첫머리에 `한글(원어)` | `코치넬레(Coccinelle)는 1978년 …` |
| `og:image:alt` | `한글(원어) 브랜드 이미지` | |
| 이미지 `alt` | `한글(원어) 로고` / `… 대표 로고` | 이미지 검색이 실제 유입원이다 |
| 카드·목록의 브랜드명 | `한글(원어)` | |
| JSON-LD | `name`은 한글 우선, `alternateName`에 나머지 표기 전부 | 검색엔진이 두 표기를 한 개체로 묶는다 |

구현: `app.js`의 `bilingualName()` (SPA·SSG 공용), `scripts/lib/brand-seo.mjs`의
`displayName()`/`headingMarkup()` (메타·title용).

### 하지 않는 것

- **없는 표기를 만들지 않는다.** 한글 표기가 데이터에 없으면 원어만 쓴다.
  음차를 생성하면 그것은 할루시네이션이다. BMW·KFC·DKNY·H&M처럼 한국에서도 원어로
  검색하는 브랜드가 많아 억지 음차는 오히려 해롭다.
- **URL slug에는 한글을 넣지 않는다.** 한글 URL은 `%EC%BD%94…`로 인코딩되어 공유·로그·
  분석에서 읽을 수 없게 되고, 랭킹 기여는 title·h1·본문에 비해 미미하다. 무엇보다
  2026-08에 slug 523건을 이미 이전해 301로 재색인 중이라, 다시 바꾸면 리다이렉트
  체인이 생기고 재색인이 처음부터 시작된다. **slug는 원어 기반 ASCII로 고정한다.**
  원어 표기가 없는 브랜드만 한글명을 로마자로 옮긴다(`romanizeKorean`).

---

## 2. 데이터 신뢰성

**`country`·`foundedYear`·`foundedLocation` 필드를 쓰지 말 것.** 2026-08-15 감사에서
신뢰 불가로 확인됐다 — `country`에는 설립국이 아니라 현 소유주 국적이 섞여 있고
(구찌="프랑스", 아크테릭스="중국", 코치넬레="한국") 소유와 무관한 오류도 다수다
(롤렉스="영국", 지멘스="러시아"). `foundedYear`도 모기업 창업연도가 섞여 281건 불일치.

국가·설립연도가 필요하면 `scripts/lib/brand-seo.mjs`의 `countryOf()`/`foundedYear()`를
쓴다. 사람이 검수한 `definition`에서 기원 문맥이 확정된 경우만 추출하고, 근거가 없으면
해당 수식어를 생성하지 않는다. **커버리지보다 정확도가 우선이다.**

무할루시네이션 원칙은 FAQ에도 적용된다 — 답변은 전부 기존 필드에서 인용하고,
근거가 없는 질문은 만들지 않는다.

---

## 3. 빌드·배포

```bash
node scripts/build-brand-pages.mjs     # 브랜드 페이지 + thin 판정 + 신선도 원장
node scripts/build-seo-extras.mjs      # 허브·카테고리·국가·sitemap·RSS·robots·llms.txt
```

**순서 고정.** 앞이 `reports/thin-pages.json`(noindex 판정)을 쓰고 뒤가 그걸 읽어
sitemap에서 제외한다. 순서를 바꾸면 noindex 페이지가 sitemap에 남는다.

두 빌더는 내용이 같으면 파일을 **다시 쓰지 않는다**(`writeIfChanged`). sitemap의
lastmod가 파일 mtime에서 나오므로, 매번 전량을 덮어쓰면 바뀐 게 없는데도 "전부 갱신됨"
신호를 보내게 되고 크롤러는 그 lastmod를 신뢰하지 않게 된다. 이 동작을 없애지 말 것.

### 신선도 원장 (`reports/page-dates.json`)

`dateModified`는 이 원장에서 나온다. 빌더가 렌더 본문의 해시를 원장과 비교해 **실제로 바뀐
페이지만** 오늘 날짜로 갱신한다. 매 빌드 오늘 날짜를 찍으면 sitemap `lastmod`와 마찬가지로
거짓 신선도 신호가 되고, 크롤러는 그 값을 신뢰하지 않게 된다.

원장이 없으면 배포본(`brand/<slug>.html`)에서 본문만 떼어내 해시해 스스로 복구하므로 유실돼도
전량이 "오늘 갱신"으로 튀지 않는다. **이 자기복구 경로를 없애지 말 것.** `published`는 파일
mtime으로 시딩된다.

### 엔티티 연결 (`sameAs`)

`scripts/enrich-wikidata-entity-links.mjs`가 Wikidata **P856(공식 웹사이트) URL 완전 일치**로만
개체를 확정해 `brand.entityLinks`에 기록한다. **이름 유사도 매칭을 도입하지 말 것** — 초기 구현이
`intel.com`에서 "Flea"를, `ralphlauren.com`에서 창업자(사람)를 골랐다. 채택 조건은 ① 한 QID가 한
브랜드에만 대응 ② `P31/P279*`로 조직·브랜드 개체 확인 ③ 레이블이 브랜드명과 일치. 셋을 통과해
하나로 좁혀지지 않으면 아무것도 쓰지 않는다. 채택·기각 근거는 `reports/wikidata-entity-links.json`.

잘못된 `sameAs`는 검색엔진에 "이 페이지는 다른 회사를 설명한다"고 선언하는 것과 같다.
커버리지보다 정확도가 우선이다(§2와 같은 원칙).

배포 전 **검증 4종을 모두 통과**해야 한다:

```bash
node scripts/verify-crawl-graph.mjs      # 정적 링크 도달성·깊이·끊긴 링크
node scripts/qa-seo.mjs                  # sitemap↔파일, JSON-LD, canonical, noindex
node scripts/audit-seo.mjs               # 수용기준 20항목 (A~D + GEO G2~G8)
node scripts/verify-redirects.mjs --all  # 301 전건
```

주간 자동화는 `deploy/weekly-refresh.sh`(cron 월 05:10)가 위를 순서대로 돌리고,
수용기준 미달이면 배포하지 않는다.

---

## 4. URL·자산 이전

`scripts/migrate-slugs.mjs`(slug), `scripts/cleanup-duplicates-and-assets.mjs`(중복
레코드·로고 파일명). 이전 후에는 반드시:

1. `migrate-slugs.mjs --sync-only` — 데이터에 브랜드 사본이 여러 벌 있고
   (`brands` 492건 등) `relatedBrands()`가 그 사본을 참조한다. `allBrands`만 고치면
   "함께 읽을 브랜드"가 구 URL을 가리켜 링크가 끊긴다.
2. `deploy/apply-redirects.sh` — nginx 301 map 적용(멱등, `nginx -t` 실패 시 자체 원복).
3. `verify-redirects.mjs --all`

**301 map은 항상 기존 항목에 더한다.** 회차별 plan으로 덮어쓰면 지난 이전분의
리다이렉트가 통째로 사라진다(실제로 519건이 1건으로 줄어 git에서 복구했다).

**정규 호스트는 apex다.** `www`는 301로 apex에 보낸다(`deploy/apply-canonical-host.sh`, 멱등).
443 `server_name`에 apex와 www를 같이 두면 두 호스트가 같은 바이트를 200으로 돌려주고, canonical
순응도가 낮은 네이버에서 색인이 갈린다. 80번 블록에는 ACME 갱신을 위해 www를 남겨 둔다.

nginx 주의사항:
- 설정 백업은 `sites-enabled` **밖**에 둔다. 그 안에 두면 백업까지 설정으로 로드된다.
- `map_hash_bucket_size`는 `conf.d/00-map-hash-bucket.conf`에 있다. nginx는 첫 `map`
  블록에서 값을 확정하므로 사전순으로 앞서야 한다.

---

## 5. 현황·계획

- 계획서: `.omc/plans/brand-atlas-geo-visibility-2026-09.md`(GEO·잔여 결함),
  `.omc/plans/brand-atlas-search-visibility-2026-08.md`(크롤 그래프·키워드 정렬)
- 색인 추적: `.omc/state/seo-index-log.json` (`scripts/track-index.mjs`)
- 변경 이력: `CHANGELOG.md`
