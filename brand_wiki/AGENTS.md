# Brand Wiki Operating Rules

이 위키는 브랜드 전문 매거진 사이트를 만들기 위한 내부 지식 위키다.

## 원칙

- 원본 PDF, 수집 HTML, 원본 이미지는 내부 근거로만 보존한다.
- 공개 문장에는 "PDF에 따르면", "AI에 따르면", "매거진에 따르면" 같은 표현을 쓰지 않는다.
- PDF 본문 캡처, 긴 직접 인용, 페이지 이미지 공개를 금지한다.
- 공개 가능한 해석은 `brand_insights.editorial_status = approved`인 문장만 사용한다.
- 자동 추출 후보는 검수 전까지 내부 참고 자료로만 사용한다.
- 브랜드 상세 페이지는 객관 정보와 해석적 관점을 분리하되, 사용자는 하나의 자연스러운 매거진 글처럼 읽을 수 있어야 한다.

## 페이지 등급

- `A_magazine_ready`: 정식 매거진 상세 공개 가능
- `B_editorial_review`: 편집 검수 후 공개 가능
- `C_source_backed`: 기본 브랜드 사전 가능
- `D_directory_only`: 디렉터리/검색 카드만 권장

## 검색

검색은 SQLite `wiki_search_fts`와 `brand_search_fts`를 함께 사용한다.
