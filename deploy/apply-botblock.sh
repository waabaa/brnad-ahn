#!/usr/bin/env bash
# brandatlas.co.kr — 수집봇·스크레이퍼 차단(403)을 서버에 적용한다. 목록은 patch-nginx-botblock.py 의 BAD_UA/BAD_IP.
# 멱등하며, nginx -t 실패 시 patch 스크립트가 스스로 원복한다.
#
# Usage: SSH_KEY=~/.ssh/resort_developer_temp ./deploy/apply-botblock.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)

scp -q "${SSH_OPTS[@]}" "$REPO/deploy/patch-nginx-botblock.py" "$SSH_TARGET:/home/developer/patch-nginx-botblock.py"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n python3 /home/developer/patch-nginx-botblock.py'
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n nginx -t >/dev/null 2>&1 && sudo -n systemctl reload nginx && echo "nginx reload 완료"'

echo "검증:"
echo "  curl -s -o /dev/null -w '%{http_code}' -A Bytespider https://brandatlas.co.kr/   # 403"
echo "  curl -s -o /dev/null -w '%{http_code}' -A Googlebot  https://brandatlas.co.kr/   # 200"
