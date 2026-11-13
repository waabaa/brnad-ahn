#!/usr/bin/env bash
# brand-atlas SNS 자동 운영 — 배포 서버 systemd 사용자 유닛 설치(멱등).
#   brandatlas-social.timer  15분마다 scripts/server/social-tick.sh (생성·발행·성과)
#   brandatlas-social.path   어드민 신호(data/social/trigger 변경) → 즉시 한 바퀴
# 소스는 deploy-brandatlas.sh 가 올린 미러(~/brandatlas-src)를 쓴다. 로그 ~/brandatlas-logs/social.log
set -euo pipefail
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes "$SSH_TARGET" 'bash -s' <<'REMOTE'
set -euo pipefail
U=~/.config/systemd/user; mkdir -p "$U" ~/brandatlas-logs ~/brandatlas-admin/data/social
[ -f ~/brandatlas-admin/social-tokens.json ] || { echo '{}' > ~/brandatlas-admin/social-tokens.json; }
chmod 600 ~/brandatlas-admin/social-tokens.json
touch ~/brandatlas-admin/data/social/trigger
cat > "$U/brandatlas-social.service" <<'UNIT'
[Unit]
Description=brand-atlas SNS 자동 운영(생성·발행·성과)
[Service]
Type=oneshot
ExecStart=/bin/bash -c '/home/developer/brandatlas-src/scripts/server/social-tick.sh >> /home/developer/brandatlas-logs/social.log 2>&1'
TimeoutStartSec=3600
Nice=10
UNIT
cat > "$U/brandatlas-social.timer" <<'UNIT'
[Unit]
Description=brand-atlas SNS 자동 운영 15분마다
[Timer]
OnCalendar=*:0/15
Persistent=false
[Install]
WantedBy=timers.target
UNIT
cat > "$U/brandatlas-social.path" <<'UNIT'
[Unit]
Description=brand-atlas SNS — 어드민 신호 즉시 실행
[Path]
PathModified=/home/developer/brandatlas-admin/data/social/trigger
Unit=brandatlas-social.service
[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user enable --now brandatlas-social.timer brandatlas-social.path
systemctl --user list-timers | grep brandatlas-social
REMOTE
