# Naver / Daum Brand Data

두 URL의 브랜드 백과 데이터를 SQLite DB로 정리하고, 관련 이미지는 로컬 파일로 저장합니다.

## 결과물

- DB: `data/brand_data.sqlite`
- 이미지: `images/naver/`, `images/daum/`
- 수집 스크립트: `scrape_brand_data.py`

## DB 구조

- `entries`: 출처, 원문 ID, 제목, 부제, 요약, 본문 텍스트, 상세 URL, 태그, 제공처, 원본 HTML
- `images`: 항목별 이미지 순서, 종류(`og`, `thumbnail`, `content`), 원본 URL, 정규화 URL, 로컬 파일 경로, 파일 크기
- `brand_entities`: 원문 항목을 브랜드 단위로 묶은 표준 엔티티와 최신 프로필
- `brand_entry_map`: 브랜드 엔티티와 원문 항목의 매핑
- `source_documents`: 최신 정보의 근거 출처 URL, 발행처, 수집 시점, 신뢰도
- `brand_facts`: 공식 사이트, 국가, 소유/상위 조직, 본사, 설립일, 랭킹 등 구조화된 최신 사실
- `brand_updates`: 원문 뒤에 붙일 수 있는 최신 업데이트 요약
- `update_images`: 최신 보강용 이미지와 로컬 파일 경로

## 재수집

```powershell
python -m pip install -r requirements.txt
python scrape_brand_data.py
```

테스트용 일부 수집:

```powershell
python scrape_brand_data.py --limit 2
```

## 최신 정보 보강

원문은 덮어쓰지 않고 별도 테이블에 최신 정보를 추가합니다.

```powershell
python enrich_brand_updates.py
```

업데이트 테이블을 초기화하고 다시 보강:

```powershell
python enrich_brand_updates.py --reset
```

이미 성공한 브랜드는 건너뛰고 누락분만 재시도:

```powershell
python enrich_brand_updates.py --only-missing --delay 5
```

## 매거진용 데이터셋

브랜드 사전/매거진 사이트에서 바로 쓰기 좋은 큐레이션 레이어를 생성합니다.

```powershell
python build_magazine_dataset.py
```

주요 테이블/뷰:

- `magazine_domains`: 탐색용 산업 도메인. 국제 표준 축은 `ISIC Rev.4` 섹션 코드로 보관
- `brand_magazine_profiles`: 브랜드별 대표 카드/상세 페이지용 프로필
- `magazine_sections`: 브랜드별 미니 매거진 섹션(`overview`, `origin`, `identity`, `insights`, `external`, `products`, `people`, `current`)
- `brand_timeline`: 원문에서 추출한 연도별 브랜드 타임라인 후보
- `brand_media_assets`: 히어로 이미지, 원문 이미지, 최신 로고, 로고 히스토리 후보
- `brand_search_fts`: SQLite FTS5 검색 인덱스
- `v_brand_directory`: 목록/검색 화면용 뷰
- `v_brand_magazine`: 상세 매거진 화면용 섹션 뷰

## 추가 오픈 데이터 확장

무료/공개 소스 중심으로 브랜드 후보, 산업 분류, BI/CI 로고 후보를 확장합니다.

```powershell
python expand_brand_intelligence.py --steps expand,classify,logos --wikidata-limit 500 --brand-limit 137 --logo-limit 5
```

사용 소스:

- Wikidata Query Service: 브랜드/기업 엔티티와 구조화 속성
- Wikimedia Commons API: 로고/BI/CI 이미지 후보
- Open Food Facts API: 식음료 브랜드 제품 후보
- GDELT DOC API: 최근 뉴스 후보

주의: `logo_history`의 연도는 파일명/메타데이터 기반 추론이므로 공개 사이트 노출 전 편집 검수가 필요합니다.

## 외부 지식 보강

네이버/다음 원문에만 의존하지 않고, A/B/C 등급 브랜드에 공개 구조화 데이터를 추가합니다. 원천 후보는 별도 테이블에 보관하고, 매거진 공개 섹션에는 브랜드명 문맥 필터를 통과한 프로필만 반영합니다.

```powershell
python enrich_external_sources.py --news-brands 0
python build_magazine_dataset.py
python score_magazine_readiness.py
python export_llm_wiki.py
```

추가 테이블:

- `external_profiles`: Wikipedia 요약 등 외부 프로필 후보
- `brand_external_links`: Wikidata sitelink 기반 외부 링크
- `brand_products`: Wikidata P1056, Open Food Facts 기반 제품 후보
- `brand_people`: Wikidata P112/P169 기반 창업자·CEO 후보
- `brand_financials`: Wikidata P2139/P1128 기반 매출·직원 수 후보
- `brand_news`: GDELT 뉴스 후보. 속도와 노이즈가 있어 별도 운영 권장

현재 공개 빌드에서는 성씨, 동명이인, 대학 등 명백히 브랜드 문맥이 아닌 Wikipedia 매칭은 `external` 섹션과 검색 인덱스에서 제외합니다.

## PDF 매거진 인제스트

브랜드 전문 매거진 PDF는 원문을 공개하지 않고 내부 근거로만 저장합니다. 공개 화면에는 `public_claim`, `public_explanation` 같은 재작성된 지식 문장만 사용합니다.

PDF 위치:

```text
brand_wiki/raw/pdf/
```

전체 PDF 처리:

```powershell
python ingest_magazine_pdfs.py
```

`base-db` 폴더처럼 별도 위치의 PDF를 처리:

```powershell
python ingest_magazine_pdfs.py --pdf-dir base-db
```

기존 PDF 인제스트 결과를 초기화하고 다시 처리:

```powershell
python ingest_magazine_pdfs.py --pdf-dir base-db --reset
```

특정 PDF 하나만 처리:

```powershell
python ingest_magazine_pdfs.py --pdf "C:\path\to\magazine.pdf"
```

추가 테이블:

- `pdf_documents`: PDF 파일 메타데이터와 해시
- `pdf_pages`: 페이지별 추출 텍스트와 매칭 브랜드
- `pdf_chunks`: LLM Wiki/RAG용 청크
- `brand_insights`: 공개용 관점 문장과 내부 근거 페이지/문장
- `v_brand_insight_review_queue`: 공개 전 검수할 인사이트 후보
- `v_brand_pdf_coverage`: PDF별 브랜드 매칭 커버리지 확인용 뷰

운영 원칙:

- PDF 원문 캡처와 긴 본문 인용은 공개하지 않음
- “PDF에 따르면”, “AI에 따르면” 같은 출처 문구는 공개 문장에서 제거
- 내부 검수용으로만 PDF명, 페이지, 근거 문장을 저장
- 공개 전 `brand_insights.editorial_status`를 `approved`로 바꿔 사용하는 것을 권장
- `build_magazine_dataset.py`는 `approved` 인사이트만 공개 섹션에 반영

## PDF 인사이트 검수/승인

자동 추출 후보를 바로 공개하지 않고, 매거진 문체로 재작성한 승인 문장을 넣습니다.

```powershell
python curate_magazine_insights.py
python build_magazine_dataset.py
```

현재 승인 문장은 `brand_insights.editorial_status = 'approved'`로 저장되며, `magazine_sections.section_key = 'insights'`에 반영됩니다. 내부 근거는 계속 `internal_evidence_text`, `internal_source_document_id`, `internal_page_number`에만 보관됩니다.

## LLM Wiki Export/Search

DB의 A/B/C 등급 브랜드를 마크다운 위키로 내보냅니다. D 등급은 디렉터리 검색 대상으로만 관리합니다.

```powershell
python export_llm_wiki.py
```

생성 위치:

- `brand_wiki/AGENTS.md`
- `brand_wiki/index.md`
- `brand_wiki/brands/*.md`
- `brand_wiki/domains/*.md`
- `brand_wiki/log.md`

검색:

```powershell
python search_llm_wiki.py "공간"
python search_llm_wiki.py "자기극복"
```

검색은 `wiki_search_fts`를 먼저 사용하고, 한국어 복합어 검색을 위해 `LIKE` fallback을 함께 사용합니다.
