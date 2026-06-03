#!/usr/bin/env bash
# Deploy Brand Atlas static site to the Ubuntu + Nginx server.
#
# Usage:
#   SSH_TARGET=user@brand.resort.co.kr ./deploy/deploy.sh           # full deploy
#   SSH_TARGET=user@host REMOTE_ROOT=/var/www/brand-atlas ./deploy/deploy.sh --dry-run
#
# It rsyncs only the publishable files (no dev scripts, source imports, or
# Playwright/git artifacts) to REMOTE_ROOT and reloads nginx.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/web-design/brand_atlas_handoff/"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/brand-atlas}"
SSH_TARGET="${SSH_TARGET:?set SSH_TARGET=user@host}"
DRY=""
[ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

echo "Source : $SRC"
echo "Target : $SSH_TARGET:$REMOTE_ROOT"
[ -n "$DRY" ] && echo "(dry run)"

rsync -az --delete $DRY \
  --exclude='.playwright-mcp/' \
  --exclude='.playwright-cli/' \
  --exclude='scripts/' \
  --exclude='source-imports/' \
  --exclude='reports/' \
  --exclude='archive/' \
  --exclude='*.bak' \
  --exclude='DATA_COMPLETION_WORK_ORDERS.md' \
  --exclude='README.md' \
  "$SRC" "$SSH_TARGET:$REMOTE_ROOT/"

if [ -z "$DRY" ]; then
  echo "Reloading nginx..."
  ssh "$SSH_TARGET" 'sudo nginx -t && sudo systemctl reload nginx'
  echo "Deployed. Verify: https://brand.resort.co.kr/"
fi
