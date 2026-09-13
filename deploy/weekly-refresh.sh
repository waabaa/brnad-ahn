#!/usr/bin/env bash
# brand-atlas 주간 리프레시 — 2026-09-14부터 배포 서버에서 돈다(systemd 사용자 유닛 brandatlas-weekly.timer, 월 05:10).
# 본체: web-design/brand_atlas_handoff/scripts/server/weekly-refresh.sh (서버 소스 미러에서 실행)
# 이 파일은 수동 실행용 래퍼다 — 서버 유닛을 깨우고 로그 위치를 알려 준다. 로컬 PC cron에서는 뺐다.
#
# Usage: ./deploy/weekly-refresh.sh          # 서버에서 지금 한 번 실행(백그라운드)
#        ./deploy/weekly-refresh.sh --wait   # 끝날 때까지 기다리며 로그 출력
set -euo pipefail
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH=(ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes "$SSH_TARGET")
"${SSH[@]}" 'systemctl --user start --no-block brandatlas-weekly.service && echo "서버 주간 리프레시 시작 — 로그: ~/brandatlas-logs/weekly.log"'
if [ "${1:-}" = "--wait" ]; then
  "${SSH[@]}" 'sleep 5; while systemctl --user show -p ActiveState --value brandatlas-weekly.service | grep -qE "^(activating|active|reloading)$"; do sleep 20; done; tail -30 ~/brandatlas-logs/weekly.log'
fi
