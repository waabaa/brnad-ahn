#!/usr/bin/env bash
# 서버 작업 설치 — 로컬에서 실행(멱등, 2026-09-13 매거진 · 2026-09-14 주간 리프레시 추가).
#
# 배포 서버에 매거진 작업과 주간 리프레시 환경을 만든다(두 작업 모두 서버에서 돈다 — PC가 꺼져 있어도 된다):
#   /home/developer/brandatlas-src/            사이트 소스 미러(첫 설치 때만 content/magazine/ 포함 — 이후 원고의 원본은 서버)
#   /home/developer/brandatlas-tools/humanize/ im-not-ai(humanize-korean, MIT) 문체 지표 도구 — 로컬 플러그인 캐시에서 복사
#   /home/developer/brandatlas-admin/llm-gateway-key  게이트웨이 키(600) — 매거진 전용 클라이언트 키(없으면 로컬 env의 research 키)
#   /home/developer/brandatlas-logs/magazine.log
#   systemd 사용자 유닛 brandatlas-weekly.{service,timer}   — 월 05:10 주간 리프레시(매거진 초안·배정 포함)
#                        brandatlas-magazine.{service,path}  — 어드민 신호(지금 시작·승인·반려) 즉시 실행
#   /home/developer/brandatlas-admin/data/seo-index-log.json  색인 추이 기록(처음엔 로컬 .omc/state 기록으로 시딩)
# 키 값은 화면·로그에 찍지 않는다(표준입력으로만 넘긴다).
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$REPO/web-design/brand_atlas_handoff"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH="ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes"
ENV_FILE="${BRANDATLAS_ENV:-$HOME/.config/brandatlas/env}"
HK_BASE="$HOME/.claude/plugins/cache/im-not-ai/humanize-korean"
HK="$HK_BASE/$(ls "$HK_BASE" | sort | tail -1)"

$SSH "$SSH_TARGET" 'mkdir -p ~/brandatlas-src ~/brandatlas-tools/humanize/scripts ~/brandatlas-tools/humanize/.claude/skills/humanize-korean ~/brandatlas-logs ~/brandatlas-admin/data/magazine/drafts'

echo "[1/5] 문체 지표 도구(im-not-ai, MIT)"
rsync -az -e "$SSH" "$HK/scripts/" "$SSH_TARGET:brandatlas-tools/humanize/scripts/"
rsync -az -e "$SSH" "$HK/.claude/skills/humanize-korean/references" "$SSH_TARGET:brandatlas-tools/humanize/.claude/skills/humanize-korean/"
rsync -az -e "$SSH" "$HK/LICENSE" "$SSH_TARGET:brandatlas-tools/humanize/LICENSE"

echo "[2/5] 게이트웨이 키 — 매거진 전용 클라이언트(brandatlas-magazine, 2026-09-14) 우선, 없으면 research 키"
if $SSH "$SSH_TARGET" 'test -s ~/llm-oauth-gateway/secrets/brandatlas_magazine_api_key'; then
  $SSH "$SSH_TARGET" 'install -m 600 ~/llm-oauth-gateway/secrets/brandatlas_magazine_api_key ~/brandatlas-admin/llm-gateway-key && echo "  매거진 전용 키(600)"'
else
  ( set -a; . "$ENV_FILE"; set +a; [ -n "${LLM_GATEWAY_KEY:-}" ] || { echo "LLM_GATEWAY_KEY 없음" >&2; exit 1; }; printf %s "$LLM_GATEWAY_KEY" ) \
    | $SSH "$SSH_TARGET" 'umask 077; cat > ~/brandatlas-admin/llm-gateway-key && chmod 600 ~/brandatlas-admin/llm-gateway-key && echo "  research 키(600) — 매거진 전용 키가 아직 없음"'
fi

echo "[3/5] 소스 미러"
REMOTE_N="$($SSH "$SSH_TARGET" 'ls ~/brandatlas-src/content/magazine/*.md 2>/dev/null | wc -l')"
EXTRA=(--exclude='content/magazine/')
if [ "$REMOTE_N" -eq 0 ]; then EXTRA=(); echo "  서버 원고 없음 — 로컬 원고로 첫 시딩"; fi
rsync -az --delete -e "$SSH" \
  --exclude='.playwright-mcp/' --exclude='.playwright-cli/' --exclude='scratchpad/' --exclude='source-imports/' \
  --exclude='archive/' --exclude='300-brands/' --exclude='*.bak' --exclude='*.bak.*' --exclude='*.bak-*' --exclude='content/magazine/drafts/' \
  "${EXTRA[@]}" "$SITE/" "$SSH_TARGET:brandatlas-src/"

echo "[4/5] 공개 지문 초기화 — 처음 설치할 때만(다시 실행해도 공개 대기 원고를 묻지 않게)"
$SSH "$SSH_TARGET" 'test -f ~/brandatlas-admin/data/magazine/.published-fp && { echo "  기존 지문 유지"; exit 0; }; cd ~/brandatlas-src && node scripts/server/magazine-fp.mjs > ~/brandatlas-admin/data/magazine/.published-fp && echo "  $(cat ~/brandatlas-admin/data/magazine/.published-fp)"'
if [ -f "$REPO/.omc/state/seo-index-log.json" ]; then
  $SSH "$SSH_TARGET" 'test -s ~/brandatlas-admin/data/seo-index-log.json' || { rsync -az -e "$SSH" "$REPO/.omc/state/seo-index-log.json" "$SSH_TARGET:brandatlas-admin/data/seo-index-log.json" && echo "  색인 기록 시딩"; }
fi

echo "[5/5] systemd 사용자 유닛(주간 리프레시 월 05:10 · 매거진 어드민 신호 즉시) — 예전 crontab·매일 타이머는 지운다"
$SSH "$SSH_TARGET" 'set -e; D=~/.config/systemd/user; mkdir -p $D; touch ~/brandatlas-admin/data/magazine/trigger
cat > $D/brandatlas-magazine.service <<U
[Unit]
Description=brand-atlas 매거진 서버 작업(자동 초안·승인 반영·공개)
[Service]
Type=oneshot
ExecStart=/home/developer/brandatlas-src/scripts/server/magazine-job.sh
StandardOutput=append:/home/developer/brandatlas-logs/magazine.log
StandardError=append:/home/developer/brandatlas-logs/magazine.log
TimeoutStartSec=3600
U
cat > $D/brandatlas-magazine.path <<U
[Unit]
Description=brand-atlas 매거진 — 어드민 신호(지금 시작·승인·반려) 즉시 실행
[Path]
PathModified=/home/developer/brandatlas-admin/data/magazine/trigger
Unit=brandatlas-magazine.service
[Install]
WantedBy=default.target
U
cat > $D/brandatlas-weekly.service <<U
[Unit]
Description=brand-atlas 주간 리프레시(재빌드·검증·공개·색인 측정)
[Service]
Type=oneshot
ExecStart=/home/developer/brandatlas-src/scripts/server/weekly-refresh.sh
StandardOutput=append:/home/developer/brandatlas-logs/weekly.log
StandardError=append:/home/developer/brandatlas-logs/weekly.log
TimeoutStartSec=5400
U
cat > $D/brandatlas-weekly.timer <<U
[Unit]
Description=brand-atlas 주간 리프레시 월 05:10
[Timer]
OnCalendar=Mon *-*-* 05:10:00
Persistent=true
[Install]
WantedBy=timers.target
U
systemctl --user daemon-reload
# 매거진은 주 1회(주간 리프레시 안에서) + 어드민 버튼 즉시 — 예전 매일 타이머는 끈다(2026-09-14).
systemctl --user disable --now brandatlas-magazine.timer >/dev/null 2>&1 || true; rm -f $D/brandatlas-magazine.timer
systemctl --user daemon-reload
systemctl --user enable --now brandatlas-magazine.path brandatlas-weekly.timer >/dev/null 2>&1
crontab -l 2>/dev/null | grep -v "magazine-hourly.sh" | grep -v "brand-atlas 매거진(자동 준비" | crontab -
systemctl --user list-timers --all --no-pager | grep brandatlas
echo "path: $(systemctl --user is-active brandatlas-magazine.path) · crontab 잔여: $(crontab -l 2>/dev/null | grep -c magazine || true)"'
echo "완료"
