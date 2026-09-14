#!/usr/bin/env bash
# 주간 브랜드 수록 — 배포 서버 작업(2026-09-14). 사람들이 실제로 찾는 브랜드부터 매주 채운다.
#
#   ① 후보 풀 갱신(28일마다): 한국어 위키백과 문서가 있는 기업·브랜드 중 미수록 → data/catalog/pool.json
#   ② 수요 선정: 네이버 데이터랩(국내)·영문 위키백과 조회수(국외)·서치 콘솔 검색어 → demand.json(근거), weekly-candidates.json
#   ③ 수록: import-wikidata-brands.mjs 가 근거 검증을 통과한 것만 목표 수(기본 20)까지 content/brands/ 에 쓴다
#   ④ 반영: apply-auto-brands.mjs 가 데이터에 넣는다(로고는 어드민 검수 후 — 빌드마다 다시 반영한다)
#
# weekly-refresh.sh [0-b]가 부르고, 빌드·검증·공개는 주간 리프레시가 한다. 어드민 '브랜드 수록' 탭에서 ON/OFF·주간 목표.
# 게이트웨이 키: 수록 전용 클라이언트 brandatlas-catalog(하루 40) — $ADMIN_HOME/llm-catalog-key
# 단독 실행은 빌드 잠금 안에서 한다(④가 소스 미러의 데이터 파일을 고친다 — 도는 빌드와 겹치면 안 된다):
#   flock -w 3600 ~/.brandatlas-build.lock ~/brandatlas-src/scripts/server/catalog-job.sh
set -uo pipefail
. /home/developer/brandatlas-src/scripts/server/common.sh
CAT="$ADMIN_HOME/data/catalog"
mkdir -p "$CAT" "$SRC/content/brands"
cd "$SRC" || exit 1
exec 6>"$CAT/.lock"; flock -n 6 || { echo "  이전 수록 작업이 아직 도는 중 — 건너뜀"; exit 0; }

read -r ON TARGET <<<"$(node -e 'let s={};try{s=JSON.parse(require("fs").readFileSync(process.argv[1]+"/settings.json","utf8"))}catch{};const t=Math.max(1,Math.min(40,Number(s.weeklyTarget)||20));console.log(`${s.autoImport!==false} ${t}`)' "$CAT")"
echo "  자동 수록=$ON · 주간 목표=$TARGET"
[ "$ON" = "true" ] || exit 0

export LLM_GATEWAY_URL=http://127.0.0.1:5055/v1/generate
LLM_GATEWAY_KEY="$(cat "$ADMIN_HOME/llm-catalog-key" 2>/dev/null || true)"; export LLM_GATEWAY_KEY
[ -n "$LLM_GATEWAY_KEY" ] || { echo "  ! 수록 키 없음 — deploy/setup-server-jobs.sh 확인"; exit 1; }

# ① 후보 풀(SPARQL 몇 분) — 28일이 지났거나 없을 때만
if [ ! -s "$CAT/pool.json" ] || [ $(( $(date +%s) - $(stat -c %Y "$CAT/pool.json") )) -gt 2419200 ]; then
  echo "  ① 후보 풀 갱신"
  timeout 1800 node scripts/discover-wikidata-brands.mjs --min-global 10 --min-kr 2 --out "$CAT/pool.json.new" | tail -1 &&
    [ -s "$CAT/pool.json.new" ] && mv "$CAT/pool.json.new" "$CAT/pool.json" || echo "  ! 풀 갱신 실패 — 기존 풀로 진행"
fi
[ -s "$CAT/pool.json" ] || { echo "  ! 후보 풀 없음"; exit 1; }

# ② 수요 선정(목표의 1.6배 — 근거 검증에서 기각되는 몫)
PICK=$(( TARGET * 8 / 5 ))
echo "  ② 수요 선정(후보 $PICK)"
timeout 2400 node scripts/brand-demand.mjs --pool "$CAT/pool.json" --out-dir "$CAT" --pick "$PICK" --ledger "$CAT/ledger.json" | tail -2 || { echo "  ! 수요 선정 실패"; exit 1; }

# ③ 수록
BEFORE="$(ls content/brands/*.json 2>/dev/null | wc -l)"
echo "  ③ 수록(목표 $TARGET)"
timeout 5400 node scripts/import-wikidata-brands.mjs --candidates "$CAT/weekly-candidates.json" --limit "$PICK" --target "$TARGET" \
  --records-dir content/brands --ledger "$CAT/ledger.json" --no-fallback --concurrency 2 --batch 2 | grep -E "^(준비|수록|재시도)|보류" | tail -15
AFTER="$(ls content/brands/*.json 2>/dev/null | wc -l)"

# ④ 반영 + 어드민용 실행 기록
node scripts/apply-auto-brands.mjs --decisions "$CAT/decisions.json"
node -e 'const fs=require("fs"),d=process.argv[1];fs.writeFileSync(d+"/last-run.json",JSON.stringify({at:new Date().toISOString(),target:+process.argv[2],added:+process.argv[4]-+process.argv[3]},null,1))' "$CAT" "$TARGET" "$BEFORE" "$AFTER"
echo "  수록 $(( AFTER - BEFORE ))곳(누적 서버 수록 $AFTER곳)"
