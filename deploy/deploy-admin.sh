#!/usr/bin/env bash
# brand-atlas 운영 어드민 배포.
#
# nginx가 /admin/ 정적 UI를 서빙하고 /admin-api/ 를 127.0.0.1:8810 으로 프록시한다.
# 백엔드는 developer 사용자 systemd 유닛으로 돈다(david-seo와 같은 방식).
#
# 어드민 UI는 웹루트 밖(/home/developer/brandatlas-admin/public)에 두고 nginx alias로
# 서빙한다. 웹루트에 두면 사이트 배포의 rsync --delete 때마다 지워진다.
#
# Usage: SSH_KEY=~/.ssh/resort_developer_temp ./deploy/deploy-admin.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)
REMOTE="/home/developer/brandatlas-admin"

SNAP="$REPO/web-design/brand_atlas_handoff/reports/admin-snapshot.json"
[ -f "$SNAP" ] || { echo "스냅샷 없음 — node scripts/build-admin-snapshot.mjs 를 먼저 실행하세요"; exit 1; }

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p $REMOTE/public $REMOTE/data"
rsync -az -e "ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes" "$REPO/admin/public/" "$SSH_TARGET:$REMOTE/public/"
rsync -az -e "ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes" "$REPO/admin/admin_server.py" "$SSH_TARGET:$REMOTE/"
rsync -az -e "ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes" "$SNAP" "$SSH_TARGET:$REMOTE/data/"

# UI는 staging → /var/www/brandatlas-admin 으로 옮긴다. nginx(www-data)가 developer의
# 홈(700 디렉토리) 안을 읽을 수 없기 때문이다.
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" '
  sudo -n mkdir -p /var/www/brandatlas-admin &&
  sudo -n rsync -a --delete --no-owner --no-group /home/developer/brandatlas-admin/public/ /var/www/brandatlas-admin/ &&
  sudo -n chmod -R a+rX /var/www/brandatlas-admin'

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" '
  set -e
  if ! sudo -n systemctl restart brandatlas-admin 2>/dev/null; then
    echo "유닛이 없습니다 — deploy/setup-admin.sh 를 먼저 실행하세요"; exit 1
  fi
  sleep 2
  echo "서비스: $(systemctl is-active brandatlas-admin)"
  curl -s -m 5 http://127.0.0.1:8810/health || echo "헬스체크 실패"
'
echo
echo "완료 → https://brandatlas.co.kr/admin/"
