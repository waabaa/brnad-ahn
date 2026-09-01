#!/usr/bin/env bash
# brand-atlas 운영 어드민 최초 설치 — systemd 유닛 + nginx 경로 + 비밀번호.
# 한 번만 실행하면 되고, 다시 실행해도 안전하다(멱등).
#
# Usage:
#   SSH_KEY=~/.ssh/resort_developer_temp ADMIN_PASSWORD='원하는비밀번호' ./deploy/setup-admin.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)
REMOTE="/home/developer/brandatlas-admin"

: "${ADMIN_PASSWORD:?ADMIN_PASSWORD 를 지정하세요}"
# 네이버 API 키는 로컬 키 파일에서 가져온다. 저장소에는 두지 않는다.
LOCAL_ENV="${BRANDATLAS_ENV:-$HOME/.config/brandatlas/env}"
[ -r "$LOCAL_ENV" ] && . "$LOCAL_ENV"
SESSION_SECRET="$(head -c 32 /dev/urandom | base64 | tr -d '\n=/+' | head -c 40)"

# 홈 디렉토리는 700으로 둔다(env·스냅샷 보호). nginx가 읽어야 하는 UI는 배포 때
# /var/www/brandatlas-admin 으로 따로 옮긴다 — deploy-admin.sh 참조.
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p $REMOTE/public $REMOTE/data && chmod 700 $REMOTE"

# ── 1) 환경 파일 (권한 600) ────────────────────────────────────────────────
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "umask 077 && cat > $REMOTE/env" <<EOF
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_SESSION_SECRET=$SESSION_SECRET
ADMIN_PORT=8810
ADMIN_HOST=127.0.0.1
ADMIN_DATA_DIR=$REMOTE/data
ADMIN_NGINX_LOG=/var/log/nginx/brandatlas.co.kr.access.log
NCP_APIGW_KEY_ID=${NCP_APIGW_KEY_ID:-}
NCP_APIGW_KEY=${NCP_APIGW_KEY:-}
GA4_MEASUREMENT_ID=${GA4_MEASUREMENT_ID:-}
GA4_PROPERTY_ID=${GA4_PROPERTY_ID:-}
EOF

# ── 2) systemd 시스템 유닛 ─────────────────────────────────────────────────
#
# 사용자 유닛이 아니라 시스템 유닛인 이유: 크롤러 분석이 nginx 로그
# (640 www-data:adm)를 읽어야 하는데, developer의 user manager는 오래전 로그인 시점의
# 그룹으로 떠 있어 adm이 빠져 있다. 세션을 재시작하면 같은 매니저에 물린 LLM 게이트웨이도
# 죽으므로(재시작 금지 대상), 시스템 유닛에서 SupplementaryGroups=adm 을 명시한다.
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sudo -n tee /etc/systemd/system/brandatlas-admin.service > /dev/null" <<EOF
[Unit]
Description=brand-atlas 운영 어드민 (127.0.0.1:8810)
After=network.target

[Service]
Type=simple
User=developer
Group=developer
SupplementaryGroups=adm
WorkingDirectory=$REMOTE
EnvironmentFile=$REMOTE/env
ExecStart=/usr/bin/python3 $REMOTE/admin_server.py
Restart=on-failure
RestartSec=3
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$REMOTE

[Install]
WantedBy=multi-user.target
EOF

# 과거 사용자 유닛이 남아 있으면 걷어낸다(중복 기동 방지).
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'systemctl --user disable --now brandatlas-admin 2>/dev/null || true; rm -f ~/.config/systemd/user/brandatlas-admin.service; systemctl --user daemon-reload 2>/dev/null || true'

# ── 3) nginx 경로 ──────────────────────────────────────────────────────────
scp -q "${SSH_OPTS[@]}" "$REPO/deploy/patch-nginx-admin.py" "$SSH_TARGET:/home/developer/patch-nginx-admin.py"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n python3 /home/developer/patch-nginx-admin.py && sudo -n systemctl reload nginx && echo "nginx reload 완료"'

# ── 4) 기동 ───────────────────────────────────────────────────────────────
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n systemctl daemon-reload && sudo -n systemctl enable --now brandatlas-admin && sleep 2 && echo "서비스: $(systemctl is-active brandatlas-admin)"'

echo "설치 완료. 이어서 ./deploy/deploy-admin.sh 로 UI·스냅샷을 올리세요."
