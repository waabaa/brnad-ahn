#!/usr/bin/env bash
# 매거진 자동 준비 — cron이 매시간 부른다(2026-09-13). 설정만 읽고 끝나는 게 대부분이라 가볍다.
#
# 어드민 '매거진' 탭의 '자동 준비'가 켜져 있고, (예약 원고가 14일치 이하로 남았거나 '지금 시작'을 눌렀으면)
# 다음 달 호 초안을 AI가 쓰고 검증해 대기열에 올린다. 공개는 하지 않는다 — 승인(또는 '검증 통과 시 자동 예약')된
# 초안만 magazine-sync가 월요일에 배정하고, 주간 리프레시(월 05:10)가 공개일에 연다.
# 조건이 안 맞으면 SSH로 설정만 한 번 읽고 끝난다. 예약 부족으로 인한 자동 실행은 하루 한 번(20시간 간격)까지만 —
# 실패가 반복돼도 게이트웨이를 매시간 두드리지 않는다. '지금 시작'은 간격과 무관하게 다음 정각 30분에 실행된다.
#
# cron: 30 * * * * cd /home/waabaa/projects/brand-atlas && ./deploy/magazine-daily.sh >> .omc/logs/magazine-daily.log 2>&1
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$REPO/web-design/brand_atlas_handoff"
ENV_FILE="${BRANDATLAS_ENV:-$HOME/.config/brandatlas/env}"
# shellcheck source=/dev/null
[ -r "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
export SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
cd "$SITE"
echo "=== $(date '+%F %T') 매거진 자동 준비 점검 ==="

SETTINGS="$(node scripts/magazine-sync.mjs --settings)"
read -r AUTO RUNREQ <<<"$(node -e 'const s=JSON.parse(process.argv[1]);console.log(`${!!s.autoDraft} ${!!s.runRequested}`)' "$SETTINGS")"
LOW="$(node -e 'import("./scripts/lib/magazine.mjs").then(m=>console.log(m.queueStatus(".").low))')"
echo "자동 준비=$AUTO · 지금 시작 요청=$RUNREQ · 예약 부족=$LOW"

STAMP="$REPO/.omc/state/magazine-auto-last-run"
RECENT=false
[ -f "$STAMP" ] && [ $(( $(date +%s) - $(stat -c %Y "$STAMP") )) -lt 72000 ] && RECENT=true

if [ "$AUTO" = "true" ] && { [ "$RUNREQ" = "true" ] || { [ "$LOW" = "true" ] && [ "$RECENT" = "false" ]; }; }; then
  mkdir -p "$(dirname "$STAMP")" && touch "$STAMP"
  # 게이트웨이는 서버 내부 전용 — 이 작업 동안만 SSH 터널을 연다(수록 스크립트의 15055와 겹치지 않게 15066).
  PORT=15066
  ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ExitOnForwardFailure=yes -f -N -L 127.0.0.1:$PORT:127.0.0.1:5055 "$SSH_TARGET"
  TUNNEL_PID="$(pgrep -f "127.0.0.1:$PORT:127.0.0.1:5055" | head -1 || true)"
  trap '[ -n "${TUNNEL_PID:-}" ] && kill "$TUNNEL_PID" 2>/dev/null || true' EXIT
  RC=0; LLM_GATEWAY_URL="http://127.0.0.1:$PORT/v1/generate" node scripts/magazine-auto.mjs || RC=$?
  if [ "$RC" = "75" ]; then
    rm -f "$STAMP"; RUNREQ=keep   # 게이트웨이 한도 — 하루 1회 제한에 세지 않고, '지금 시작' 요청도 유지해 다음 시각에 다시
    echo "  게이트웨이 한도로 중단 — 다음 정각 30분에 다시 시도"
  elif [ "$RC" != "0" ]; then echo "  ! 초안 생성 실패(rc=$RC) — 다음 날 다시 시도"; fi
  # '지금 시작' 요청은 한 번 처리하면 끈다.
  if [ "$RUNREQ" = "true" ]; then
    NEW="$(node -e 'const s=JSON.parse(process.argv[1]);s.runRequested=false;s.lastRunAt=new Date().toISOString();console.log(JSON.stringify(s))' "$SETTINGS")"
    ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes "$SSH_TARGET" "cat > /home/developer/brandatlas-admin/data/magazine/settings.json" <<<"$NEW"
  fi
fi

# 승인·반려·자동 예약 반영 + 대기열 업로드(조건과 무관하게 매일)
node scripts/magazine-sync.mjs
echo "완료: $(date '+%F %T')"
