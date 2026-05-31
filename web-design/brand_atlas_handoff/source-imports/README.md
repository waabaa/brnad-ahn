# Source Imports

이 폴더는 브랜드 데이터를 창작 없이 보강하기 위한 원천 파일 입력 위치입니다.

지원 형식은 `.csv`, `.tsv`, `.json`입니다. `.xlsx`는 CSV로 내보낸 뒤 넣어주세요.

## Brandirectory / Brand Finance

파일명 예시:

- `brandirectory-2026.csv`
- `brandfinance-global-500.csv`

권장 컬럼:

- `brand` 또는 `brand_name`
- `year`
- `rank`
- `brand_value`
- `brand_strength` 또는 `bsi`
- `sector`
- `country`

## WIPO Global Brand Database

주의: WIPO Global Brand Database의 공개 웹 검색 화면은 자동 질의, scraping, bulk download/storage가 금지되어 있습니다. 이 폴더에는 직접 scraping한 파일을 넣지 말고, WIPO가 허용한 별도 데이터 제공/사용자 export/라이선스 데이터만 넣어주세요.

파일명 예시:

- `wipo-trademarks.csv`
- `global-brand-database-export.csv`

권장 컬럼:

- `mark` 또는 `trademark`
- `owner` 또는 `holder`
- `status`
- `jurisdiction` 또는 `office`
- `registration_number`
- `application_number`
- `nice_classes`
- `registration_date`

## Editorial References

Careet, Open Ads, Fashionnet, Brunch처럼 기사/트렌드 레퍼런스는 본문을 복사하지 않고 링크와 메타데이터만 보관합니다.

파일명 예시:

- `reference-notes.csv`
- `brunch-references.csv`

권장 컬럼:

- `brand`
- `title`
- `url`
- `note`

국내 브랜드 보강 소스 운영 기준:

- Careet: `이주의 일 잘한 브랜드`, `뉴스클리핑`, `마이크로 트렌드 전광판`에서 확인된 브랜드 후보를 수집하되, 공개 페이지에는 기사 본문을 복사하지 않습니다.
- Open Ads: 마케팅/광고 사례 콘텐츠의 브랜드명, 제목, URL, 발행일을 레퍼런스로 저장합니다.
- Fashionnet: `패션키워드검색[DATA]`, `Trend Now[DATA]`, `소비트렌드분석[DATA]`, `섬유패션통계[DATA]`에서 export/download가 허용된 데이터만 사용합니다.
- PDF 매거진: 본문 캡처나 장문 발췌 없이 브랜드명, 섹션명, 짧은 내부 메모, 페이지 식별자만 private provenance로 저장합니다.

## brandB

brandB는 국내 신규/리뉴얼 브랜드, BI/CI, 네이밍, 패키지, 케이스스터디를 보강하는 핵심 후보 소스입니다.

다만 brandB 이용약관에는 서비스 정보를 무단 수집하거나 영리 목적으로 복제/전송/배포하는 행위 제한이 있으므로, 자동 크롤링 대신 아래 중 하나로 수집합니다.

- brandB와 제휴/승인을 받은 export
- 운영자가 수동 검수해 만든 CSV
- 브랜드사가 직접 제출한 정보와 brandB 원문 URL 매칭

파일명 예시:

- `brandb-archive-2026.csv`
- `brandb-approved-export.csv`

권장 컬럼:

- `brand`
- `title`
- `url`
- `year`
- `status` (`New`, `Renewal`, `Change` 등)
- `scope` (`Naming`, `BI`, `CI`, `Package` 등)
- `category` (`Food&Drink`, `Beauty&Fashion`, `Technology`, `Retail&Commerce` 등)
- `tags`
- `description`
- `official_website`
- `case_study`
- `image`
- `logo`

## 실행

```bash
node web-design/brand_atlas_handoff/scripts/import-source-data.mjs
node web-design/brand_atlas_handoff/scripts/qa-check.mjs
```
