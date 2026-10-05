# 운영 어드민 디자인 시스템 (Slate)

스타일: Minimalism & Swiss (ui-ux-pro-max) · density 8 / motion 2 / variance 2. 구현: `public/theme.css`(토큰·컴포넌트), `public/app.js`(`C` 팔레트, `cards`·`pill`·`seg`·`table`·`box`).

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` / `--card` / `--line` | slate-50 / white / slate-200 | 바탕 / 패널 / 경계선(그림자 대신) |
| `--ink` / `--text` / `--muted` | slate-900 / 800 / 500 | 제목·값 / 본문 / 보조(흰 바탕 대비 4.7:1) |
| `--side` | slate-900 | 사이드바 |
| `--accent` | #2563eb | 단일 강조색: 포커스 링, 활성 메뉴, 핵심 수치, 차트 주선 |
| `--ok` `--warn` `--bad` | green / amber / red | 상태 전용(배지·증감). 장식에 쓰지 않는다 |

규칙: 간격 4px 격자(`--s1..s8`), 라운드 8px, 그라디언트·장식 애니메이션 없음, 전환 150ms(reduced-motion이면 끔), 포커스 항상 표시, 터치 기기 44px, 상태는 색+텍스트 병기, 숫자는 `tabular-nums`.

## 컴포넌트 인터페이스

| 이름 | 시그니처 | 비고 |
|---|---|---|
| KPI 카드 | `cards(host, [{k, v, unit?, s?, accent?, delta?}])` | `delta` 양수 ▲ 초록 / 음수 ▼ 빨강 / 0 – 회색 |
| 배지 | `pill(kind, text)` | kind: ok · warn · bad · info · mute |
| 세그먼트 | `seg([[값,라벨],…], 초기값, onChange?)` | 반환 요소의 `.value`, `aria-pressed` |
| 표 | `table(headers, rows)` | 헤더 `{label, num:1}` 이면 숫자 열 우측 정렬, `.scroll` 안에서 머리글 고정 |
| 패널 | `box(host, title, sub?)` / `.box.warn` | 경고 패널은 `warn` 클래스 |
