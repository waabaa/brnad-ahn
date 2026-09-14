#!/usr/bin/env bash
# 아틀라스 매거진 — 배포 서버 작업(2026-09-13, "매거진 관련 모든 작업은 배포 서버 작업").
#
#   ① 자동 준비: 어드민 설정이 ON이고 (예약 원고 ≤14일치 → 하루 1회 | '지금 시작' → 즉시)면 다음 달 호 초안 작성·검증
#   ② 승인 반영: 어드민 승인·반려를 반영, 승인분을 그 달 빈 월요일에 배정해 content/magazine/으로(원고의 원본은 서버)
#   ③ 공개: 원고가 바뀌었거나 공개일이 된 기사가 있으면 서버에서 빌드해 웹루트에 올린다 — PC가 꺼져 있어도 매거진이 나간다.
#
# 언제 도나(2026-09-14 — 주 1회로 정리):
#   매주 월 05:10  weekly-refresh.sh 가 먼저 이 스크립트를 --no-publish 로 부른다(①② 만). 공개는 주간 리프레시의 전체 빌드가 한다.
#   즉시           어드민에서 '지금 시작'·승인·반려를 누르면 data/magazine/trigger 가 바뀌어 brandatlas-magazine.path 가 이 스크립트를 실행
#                  (이때는 ③까지 — 승인한 기사의 공개일이 이미 지났거나 오늘이면 바로 공개된다)
# 대부분의 실행은 설정 확인과 지문 비교만 하고 몇 초 안에 끝난다. 설치: deploy/setup-server-jobs.sh
set -uo pipefail
NO_PUBLISH=false; [ "${1:-}" = "--no-publish" ] && NO_PUBLISH=true
. /home/developer/brandatlas-src/scripts/server/common.sh
ADMIN="$MAG_ADMIN"
export MAG_ADMIN_DIR="$ADMIN" HUMANIZE_DIR=/home/developer/brandatlas-tools/humanize
export LLM_GATEWAY_URL=http://127.0.0.1:5055/v1/generate
LLM_GATEWAY_KEY="$(cat "$ADMIN_HOME/llm-gateway-key" 2>/dev/null || true)"; export LLM_GATEWAY_KEY
cd "$SRC" || exit 1
mkdir -p "$ADMIN"
# 겹쳐 돌지 않게(초안 작성은 수 분 걸릴 수 있다).
exec 9>"$ADMIN/.hourly.lock"; flock -n 9 || { echo "$(date '+%F %T') 이전 실행이 아직 도는 중 — 건너뜀"; exit 0; }
START="$(date +%s)"
echo "=== $(date '+%F %T') 매거진 서버 작업 ==="

SETTINGS="$(node scripts/magazine-sync.mjs --settings)"
read -r AUTO RUNREQ <<<"$(node -e 'const s=JSON.parse(process.argv[1]);console.log(`${!!s.autoDraft} ${!!s.runRequested}`)' "$SETTINGS")"
LOW="$(node -e 'import("./scripts/lib/magazine.mjs").then(m=>console.log(m.queueStatus(".").low))')"
STAMP="$ADMIN/.auto-last-run"; RECENT=false
[ -f "$STAMP" ] && [ $(( $(date +%s) - $(stat -c %Y "$STAMP") )) -lt 72000 ] && RECENT=true
echo "자동 준비=$AUTO · 지금 시작=$RUNREQ · 예약 부족=$LOW · 최근 실행=$RECENT"

# ① 자동 준비
if [ "$AUTO" = "true" ] && { [ "$RUNREQ" = "true" ] || { [ "$LOW" = "true" ] && [ "$RECENT" = "false" ]; }; }; then
  touch "$STAMP"
  RC=0; node scripts/magazine-auto.mjs || RC=$?
  if [ "$RC" = "75" ]; then rm -f "$STAMP"; echo "  게이트웨이 한도 — 다음 시각에 다시 시도('지금 시작' 요청 유지)"
  else
    [ "$RC" != "0" ] && echo "  ! 초안 작성 실패(rc=$RC)"
    if [ "$RUNREQ" = "true" ]; then
      node -e 'const fs=require("fs"),p=process.argv[1]+"/settings.json";const s=JSON.parse(fs.readFileSync(p,"utf8"));s.runRequested=false;s.lastRunAt=new Date().toISOString();fs.writeFileSync(p,JSON.stringify(s,null,1))' "$ADMIN"
    fi
  fi
fi

# ② 승인 반영
node scripts/magazine-sync.mjs

# ③ 공개 — 원고 지문(scripts/server/magazine-fp.mjs)이 지난 공개와 다르면 빌드·배포. 공개일이 된 기사는 날짜가 바뀌면 지문이 달라져 자동으로 열린다.
FP="$(magazine_fp)"
LAST="$(cat "$ADMIN/.published-fp" 2>/dev/null || true)"
if [ "$NO_PUBLISH" = "false" ] && [ "$FP" != "$LAST" ]; then
  echo "공개: 원고 변화 감지($LAST → $FP) — 서버 빌드"
  exec 7>"$BUILD_LOCK"; flock -w 3600 7 || { echo "  ! 빌드 잠금 대기 초과"; exit 1; }
  if build_site && publish_site; then echo "$FP" > "$ADMIN/.published-fp"
  else echo "  ! 빌드·공개 실패 — 다음 실행에서 다시(원고 검증 실패일 수 있다)"; fi
fi
echo "완료: $(date '+%F %T')"
# 도는 동안(빌드 11분) 어드민에서 누른 승인·반려는 path 유닛이 다시 깨우지 못한다(서비스가 이미 active라 신호가 버려진다 —
# 2026-09-14 로고 16건 중 15건이 이렇게 빠졌다). 끝난 뒤 신호 파일이 시작 이후에 바뀌었으면 한 번 더 돈다(최대 5회).
ROUND="${MAG_ROUND:-1}"
if [ "$NO_PUBLISH" = "false" ] && [ "$ROUND" -lt 5 ] && [ "$(stat -c %Y "$ADMIN/trigger" 2>/dev/null || echo 0)" -ge "$START" ]; then
  echo "실행 중 들어온 신호 — 다시 처리(${ROUND}회차)"
  MAG_ROUND=$((ROUND + 1)) exec "$0" "$@"
fi
