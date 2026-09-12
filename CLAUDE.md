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

## 2-b. 아카이브 등급 (2026-09-07)

등급은 저장하지 않고 `scripts/lib/archive.mjs`의 `archiveTier()`가 매번 계산한다.

| 등급 | 조건 | 취급 |
|---|---|---|
| `core` | 한글 표기 + 로고 + 본문 800자 이상 | 홈 "주요 브랜드"·허브 상단 타일 |
| `standard` | 한글 표기 또는 로고 중 하나 이상 | 목록 노출 |
| `directory` | 한글 표기 없음 **그리고** 로고 없음 | 목록·홈·llms 제외, `pages/directory.html`과 카테고리 하단 접힘 목록에서만 링크 |

한글 표기 없는 레코드 749건의 절반이 해외 음반사·지역 소매점 스크랩이었다. 삭제하지 않는 이유는
URL이 이미 색인·301 그래프에 들어 있어서다. 로고나 한글 표기가 확인되면 자동으로 올라간다.

**색인 제외는 등급이 아니라 본문 분량으로 가른다**(`isNoindex()` = `directory` 그리고 본문 800자 미만,
2026-09-08). 등급은 목록·홈 노출을 정하는 기준이고, 그 안에서도 읽을 내용이 있는 페이지는 색인·sitemap에
남긴다. 종전에는 등급만으로 `noindex`를 걸어, 이미 색인·301 그래프에 들어간 URL이 새 URL로 교체되지
못했다 — 네이버 웹마스터 '리다이렉션된 페이지' 진단 108건 중 41건이 301 목적지가 `noindex`인 경우였다.
226건 중 202건이 이 기준으로 색인에 복귀했다. **페이지 안내 문구는 실제 `robots` 값과 일치시킬 것**
(`brand-render.mjs`가 `isNoindex`로 두 문구를 가른다).

**외부 이미지는 핫링크하지 않는다.** `scripts/localize-external-assets.mjs`가 로고·대표 이미지·BI/CI를
`images/logos|photos|bici/`로 내려받는다(namu.wiki는 봇 차단이라 불가 → 로고 없음 처리 후 공식 사이트에서
재수집). 위키미디어는 호스트별 직렬화·식별 UA가 없으면 429를 돌려준다.

**Wikidata 팩트(`brand.wikidata`)**는 `scripts/enrich-wikidata-facts.mjs`가 entityLinks(QID 확정분)에서만
P17·P571·P159·P112·P749·P154를 가져온다. `countryOf()`/`foundedYear()`는 definition 근거가 없을 때만 이
값을 폴백으로 쓴다. 팩트 표(`factRows()`)는 값마다 출처를 남긴다.

## 2-c. 신규 브랜드 수록 (2026-09-07)

수록 후보는 `scripts/discover-wikidata-brands.mjs`가 Wikidata에서 찾고,
`scripts/import-wikidata-brands.mjs`가 레코드로 만든다.

**채택 조건**: ① 한국어 위키백과 문서가 있다(= 한글 표기가 실재한다) ② `P31/P279*`가 기업·브랜드·
소매체인·상표 ③ 사람·대학·리그·행정구역·작품은 P31 차단 목록으로 배제 ④ 한국어 본문 500자 이상.

**본문은 근거 밖으로 나가지 않는다.** 근거는 한국어 위키백과 문서 본문(앞 4,500자)과 Wikidata 팩트뿐이고,
LLM은 그 근거를 사전 문체로 다시 쓰는 일만 한다. 생성문에 **근거에 없는 숫자가 하나라도 있으면 그 브랜드는
수록하지 않는다**(`verifyText`). 격식체·추측 표현도 같은 기준으로 기각한다. 기각 사유는
`reports/wikidata-brand-import.json`에 남는다.

`entityLinks.source`는 `wikidata ko sitelink (import ...)`로 적는다 — 이 레코드는 그 개체에서 만들어졌으므로
§2의 P856 일치 규칙(기존 레코드에 sameAs를 붙일 때의 규칙)과는 근거가 다르다는 뜻이다.

LLM 호출은 배포 서버의 게이트웨이를 SSH 터널로 쓴다(`ssh -L 15055:127.0.0.1:5055`). 터널이 끊기면 전부
"파싱 실패"로 기각되므로 워치독으로 유지한다. 대량 수록은 `--no-fallback --concurrency 2 --batch 1~2`로 돌린다 —
Gemini 폴백은 research 키의 작은 Gemini 몫을 태우고, 소진되면 1시간짜리 429가 돌아온다.
수록 스크립트는 5배치마다 데이터를, 끝에서만 원장(`reports/wikidata-brand-import.json`)을 쓰므로 도중에 멈추면
원장을 데이터에서 복원한 뒤 재실행한다(안 그러면 저장분이 "이미 수록"으로 기각 기록된다).

**새 레코드의 로고는 수록 직후 육안 검수한다.** Wikidata P154도 다른 개체 로고·옛 로고·간판 사진이 섞여 있다.

## 2-d. 테마 컬렉션 (2026-09-12)

업종(`domainSlug`)과 별개의 가로축. 정의는 `scripts/lib/collections.mjs`(P452·P31 QID 목록 + include/exclude),
편입은 `scripts/assign-collections.mjs`가 `brand.collections`에 쓰고 근거를 `reports/collections.json`에 남긴다.
편입 기준은 Wikidata 클레임뿐이다 — 이름·설명 키워드로 넣지 않는다. 5건 미만 컬렉션은 허브를 만들지 않는다.

**한글 표기 보강**은 `scripts/add-korean-labels.mjs` — QID가 확정된 레코드에 한해 Wikidata ko 레이블이나
한국어 위키백과 문서 제목을 넣는다. 음차 생성은 금지(§1)이므로 근거가 없으면 비워 둔다.

## 3. 빌드·배포

```bash
# 데이터 보강(필요 시, 순서 고정)
node scripts/localize-external-assets.mjs   # 외부 이미지 로컬화
node scripts/enrich-wikidata-facts.mjs      # Wikidata 팩트 + Commons 로고
node scripts/fetch-official-logos.mjs       # 공식 사이트에서 로고(로고 없는 브랜드만)
node scripts/prune-logo-history.mjs         # 파일 없는 BI/CI 항목 제거

# 사이트 빌드(순서 고정)
node scripts/build-brand-pages.mjs     # 브랜드 페이지 + thin/directory 판정 + 신선도 원장
node scripts/build-seo-extras.mjs      # 허브·홈·가나다·국가·로고월·sitemap·RSS·robots·llms.txt·검색 인덱스
```

페이지 골격은 `scripts/lib/page-shell.mjs`(헤더·푸터·`<head>`), 브랜드 본문은 `scripts/lib/brand-render.mjs`,
타일·이름 목록은 `scripts/lib/markup.mjs`. 허브는 전부 app.js 없이 완결된다. 검색은 `data/search-index.json`
(슬림, 초성 포함)만 받는다 — 8MB 원본 JSON을 허브에서 fetch하지 않는다.

**순서 고정.** 앞이 `reports/thin-pages.json`(noindex = thin + directory 판정)을 쓰고 뒤가 그걸 읽어
sitemap에서 제외한다. 순서를 바꾸면 noindex 페이지가 sitemap에 남는다.

두 빌더는 내용이 같으면 파일을 **다시 쓰지 않는다**(`writeIfChanged`). sitemap의
lastmod가 파일 mtime에서 나오므로, 매번 전량을 덮어쓰면 바뀐 게 없는데도 "전부 갱신됨"
신호를 보내게 되고 크롤러는 그 lastmod를 신뢰하지 않게 된다. 이 동작을 없애지 말 것.

### 신선도 원장 (`reports/page-dates.json`)

`dateModified`는 이 원장에서 나온다. 빌더가 렌더 본문 **텍스트**(태그 제거)의 해시를 원장과 비교해
**실제로 바뀐 페이지만** 오늘 날짜로 갱신한다(마크업·디자인만 바뀐 재빌드는 갱신으로 치지 않는다). 매 빌드 오늘 날짜를 찍으면 sitemap `lastmod`와 마찬가지로
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

## 5. 운영 어드민

`https://brandatlas.co.kr/admin/` — 색인 추이, 크롤러 방문, 콘텐츠 품질, 엔티티 연결,
수용기준, 검색어트렌드를 본다. 비밀번호 단일 인증(`~/.config/brandatlas/env`).

```
admin/admin_server.py     백엔드 (표준 라이브러리만, 127.0.0.1:8810)
admin/public/             UI (빌드 스텝 없음)
deploy/setup-admin.sh     최초 설치 — systemd 시스템 유닛 + nginx + 비밀번호 (멱등)
deploy/deploy-admin.sh    UI·스냅샷 갱신
```

**어드민 UI는 사이트 웹루트에 두지 않는다.** 사이트 배포가 `rsync --delete`로 웹루트를
통째 덮어써서 매번 지워진다. `/var/www/brandatlas-admin/`에 따로 둔다. 홈 디렉토리에
두는 것도 안 된다 — nginx(www-data)가 `developer`의 700 디렉토리에 들어갈 수 없다.

**nginx location은 `^~ /admin/`이어야 한다.** 이 설정에는 `~* \.html$`·`~* \.(css|js|…)$`
정규식 location이 앞에 있고 nginx는 정규식을 prefix보다 먼저 고른다. `^~`가 없으면
`/admin/app.js`가 사이트 웹루트에서 찾아져 404가 된다.

**systemd는 사용자 유닛이 아니라 시스템 유닛이다.** 크롤러 분석이 nginx 로그
(640 www-data:adm)를 읽어야 하는데 `developer`의 user manager는 오래전 그룹으로 떠 있어
`adm`이 빠져 있다. 세션을 재시작하면 같은 매니저에 물린 LLM 게이트웨이도 죽는다.

데이터는 `reports/admin-snapshot.json`(빌드 산출)과 실시간 조회(네이버 API·nginx 로그)를
합쳐 쓴다. 스냅샷은 `scripts/build-admin-snapshot.mjs`가 만들고 주간 리프레시에 물려 있다.

---

## 6. 현황·계획

- 계획서: `.omc/plans/brand-atlas-geo-visibility-2026-09.md`(GEO·잔여 결함),
  `.omc/plans/brand-atlas-search-visibility-2026-08.md`(크롤 그래프·키워드 정렬)
- 색인 추적: `.omc/state/seo-index-log.json` (`scripts/track-index.mjs`)
- 변경 이력: `CHANGELOG.md`
