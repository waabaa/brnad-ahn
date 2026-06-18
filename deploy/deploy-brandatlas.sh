#!/usr/bin/env bash
# Deploy the brand atlas to brandatlas.co.kr (Nginx on the deploy server).
#
# Architecture (2026-06-15): brandatlas.co.kr DNS → 116.125.140.86 (test.resort.co.kr
# deploy server), served by Nginx from /var/www/brandatlas. `developer` has NOPASSWD
# sudo for cp/ln/tee/nginx/systemctl reload/certbot. (brand.resort.co.kr is the legacy
# domain served by a separate Cloudflare Worker from GitHub raw.)
#
# Flow: rsync publishable files → /home/developer/brandatlas (staging, writable) →
# `sudo cp` into the Nginx webroot → reload. Run per release.
#
# Usage:
#   SSH_KEY=~/.ssh/resort_developer_temp ./deploy/deploy-brandatlas.sh            # full deploy
#   SSH_KEY=~/.ssh/resort_developer_temp ./deploy/deploy-brandatlas.sh --dry-run
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/web-design/brand_atlas_handoff/"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
STAGING="/home/developer/brandatlas"
WEBROOT="/var/www/brandatlas"
SSH="ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes"
DRY=""; [ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

echo "Source : $SRC"
echo "Target : $SSH_TARGET:$WEBROOT (via $STAGING)"

rsync -az --delete $DRY -e "$SSH" \
  --exclude='.playwright-mcp/' --exclude='.playwright-cli/' --exclude='scripts/' \
  --exclude='source-imports/' --exclude='reports/' --exclude='archive/brandarchive/' \
  --exclude='*.bak' --exclude='*.bak.*' \
  --exclude='DATA_COMPLETION_WORK_ORDERS.md' --exclude='README.md' \
  "$SRC" "$SSH_TARGET:$STAGING/"

if [ -z "$DRY" ]; then
  # Mirror staging → Nginx webroot with --delete so renamed/removed pages do not
  # linger as orphans (old `cp -aT` was additive and left stale duplicate-content
  # pages live). rsync/nginx/systemctl are NOPASSWD-allowed for `developer`.
  $SSH "$SSH_TARGET" '
    sudo -n rsync -a --delete --no-owner --no-group /home/developer/brandatlas/ /var/www/brandatlas/ &&
    sudo -n nginx -t && sudo -n systemctl reload nginx &&
    echo "deployed: $(find /var/www/brandatlas -type f | wc -l) files; brand pages $(ls /var/www/brandatlas/brand/*.html | wc -l)"'
  echo "Live: https://brandatlas.co.kr/"
fi
