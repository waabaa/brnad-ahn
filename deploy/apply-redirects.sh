#!/usr/bin/env bash
# brandatlas.co.kr — Phase E slug 이전 301 map을 서버 nginx에 적용한다.
#
# 멱등하다: 이미 적용돼 있으면 map 파일만 갱신하고 설정은 손대지 않는다.
# 설정 주입은 patch-nginx-redirects.py가 맡으며, `nginx -t` 실패 시 스스로 원복한다.
#
# Usage: SSH_KEY=~/.ssh/resort_developer_temp ./deploy/apply-redirects.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAP_SRC="$REPO/deploy/brandatlas-redirects.map"
PATCH_SRC="$REPO/deploy/patch-nginx-redirects.py"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)

[ -f "$MAP_SRC" ] || { echo "map 파일 없음: $MAP_SRC — scripts/migrate-slugs.mjs --apply 먼저 실행"; exit 1; }
COUNT=$(grep -c '^/brand/' "$MAP_SRC")
[ "$COUNT" -gt 0 ] || { echo "map이 비어 있습니다 — 적용 중단"; exit 1; }
echo "리다이렉트 항목: ${COUNT}건"

# 1) map + 패치 스크립트 업로드
scp -q "${SSH_OPTS[@]}" "$MAP_SRC" "$SSH_TARGET:/home/developer/brandatlas-redirects.map"
scp -q "${SSH_OPTS[@]}" "$PATCH_SRC" "$SSH_TARGET:/home/developer/patch-nginx-redirects.py"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n cp /home/developer/brandatlas-redirects.map /etc/nginx/brandatlas-redirects.map'
echo "map 업로드 완료"

# 2) 설정 주입 (멱등, 실패 시 자체 원복)
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n python3 /home/developer/patch-nginx-redirects.py'

# 3) reload
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo -n nginx -t >/dev/null 2>&1 && sudo -n systemctl reload nginx && echo "nginx reload 완료"'

echo "검증: node web-design/brand_atlas_handoff/scripts/verify-redirects.mjs"
