#!/usr/bin/env bash
# brandatlas.co.kr — www→apex 301 + 데이터 백업 파일 차단을 서버에 적용한다.
# 멱등하며, nginx -t 실패 시 patch 스크립트가 스스로 원복한다.
#
# Usage: SSH_KEY=~/.ssh/resort_developer_temp ./deploy/apply-canonical-host.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)

scp -q "${SSH_OPTS[@]}" "$REPO/deploy/patch-nginx-canonical-host.py" "$SSH_TARGET:/home/developer/patch-nginx-canonical-host.py"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n python3 /home/developer/patch-nginx-canonical-host.py'
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n nginx -t >/dev/null 2>&1 && sudo -n systemctl reload nginx && echo "nginx reload 완료"'

echo "검증:"
echo "  curl -sI https://www.brandatlas.co.kr/ | head -3"
