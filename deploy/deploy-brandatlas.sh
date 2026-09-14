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

SRCMIRROR="/home/developer/brandatlas-src"
LOCK="/home/developer/.brandatlas-publish.lock"
SITE="${SRC%/}"

# ① 매거진 원고와 주간 수록 브랜드는 배포 서버가 원본이다(2026-09-13 매거진, 2026-09-14 브랜드 수록 — 둘 다 서버 작업).
#    서버에서 승인·예약된 원고와 수록 레코드를 먼저 받아 온다. 받아 온 것이 있으면 로컬 산출물에 반영되도록 다시 빌드한다 —
#    안 그러면 아래 --delete가 서버에서 공개된 매거진 페이지·브랜드 페이지를 지운다.
if [ -z "$DRY" ]; then
  mkdir -p "$SITE/content/magazine" "$SITE/content/brands"
  CHANGED=0
  # 안전장치: 서버 원고 폴더가 비어 있거나 없는데 로컬에 원고가 있으면 받아 오지 않는다(--delete가 로컬 원고를 지우는 사고 방지).
  REMOTE_N="$($SSH "$SSH_TARGET" "ls $SRCMIRROR/content/magazine/*.md 2>/dev/null | wc -l" || echo 0)"
  LOCAL_N="$(ls "$SITE"/content/magazine/*.md 2>/dev/null | wc -l)"
  if [ "${REMOTE_N:-0}" -eq 0 ] && [ "$LOCAL_N" -gt 0 ]; then
    echo "! 서버 매거진 원고가 비어 있음 — 받아 오기 생략(deploy/setup-server-jobs.sh로 서버를 먼저 준비할 것)"
  else
    CHANGED="$(rsync -a --delete --itemize-changes --exclude='drafts/' -e "$SSH" "$SSH_TARGET:$SRCMIRROR/content/magazine/" "$SITE/content/magazine/" 2>/dev/null | grep -c '^[<>ch*]' || true)"
  fi
  # 수록 레코드는 서버가 지우지 않으므로 --delete 없이 받는다(로고 검수 결과가 레코드 파일에 적혀 온다).
  BRANDS="$(rsync -a --itemize-changes -e "$SSH" "$SSH_TARGET:$SRCMIRROR/content/brands/" "$SITE/content/brands/" 2>/dev/null | grep -c '^[<>ch*]' || true)"
  if [ "${CHANGED:-0}" -gt 0 ] || [ "${BRANDS:-0}" -gt 0 ]; then
    echo "서버 매거진 원고 ${CHANGED:-0}건 · 수록 레코드 ${BRANDS:-0}건 변경 → 반영 후 다시 빌드"
    ( cd "$SITE" && node scripts/apply-auto-brands.mjs && node scripts/build-brand-pages.mjs | tail -1 && node scripts/build-magazine.mjs && node scripts/build-seo-extras.mjs | tail -1 )
  fi
fi

# ② 서버 소스 미러 — 서버 작업(매거진·수록·주간 리프레시)이 빌드하는 사이트 소스. 원고·수록 레코드 폴더는 서버 소유라 올리지 않는다.
#    서버 빌드와 겹치지 않게 원격 rsync를 서버의 빌드 잠금 안에서 돌린다.
rsync -az --delete $DRY -e "$SSH" --rsync-path="flock -w 1800 /home/developer/.brandatlas-build.lock rsync" \
  --exclude='.playwright-mcp/' --exclude='.playwright-cli/' --exclude='scratchpad/' --exclude='source-imports/' \
  --exclude='archive/' --exclude='300-brands/' --exclude='content/magazine/' --exclude='content/brands/' \
  --exclude='*.bak' --exclude='*.bak.*' --exclude='*.bak-*' \
  "$SRC" "$SSH_TARGET:$SRCMIRROR/"

# ③ 공개 스테이징 — 제외 목록은 서버 매거진 공개와 같은 파일(scripts/server/publish-excludes.txt)을 쓴다.
# --delete-excluded: 제외 목록에 새로 넣은 경로가 이전 배포분으로 서버에 남지 않게 한다(2026-09-13, archive/·300-brands/가 남아 있었다).
rsync -az --delete --delete-excluded $DRY -e "$SSH" --rsync-path="flock -w 600 $LOCK rsync" \
  --exclude-from="$SITE/scripts/server/publish-excludes.txt" \
  "$SRC" "$SSH_TARGET:$STAGING/"

if [ -z "$DRY" ]; then
  # Mirror staging → Nginx webroot with --delete so renamed/removed pages do not
  # linger as orphans (old `cp -aT` was additive and left stale duplicate-content
  # pages live). rsync/nginx/systemctl are NOPASSWD-allowed for `developer`.
  # 과거 배포분에 남아 있던 데이터 백업본(11MB×2)을 지운다. rsync --delete는 제외
  # 대상 파일을 지우지 않으므로, 한 번 올라간 백업은 계속 공개된 채로 남아 있었다.
  $SSH "$SSH_TARGET" '
    rm -f /home/developer/brandatlas/data/*.bak /home/developer/brandatlas/data/*.bak-* 2>/dev/null;
    sudo -n rm -f /var/www/brandatlas/data/*.bak /var/www/brandatlas/data/*.bak-* 2>/dev/null;
    ( flock -w 600 8 && sudo -n rsync -a --delete --no-owner --no-group /home/developer/brandatlas/ /var/www/brandatlas/ ) 8>/home/developer/.brandatlas-publish.lock &&
    sudo -n nginx -t && sudo -n systemctl reload nginx &&
    echo "deployed: $(find /var/www/brandatlas -type f | wc -l) files; brand pages $(ls /var/www/brandatlas/brand/*.html | wc -l)"'
  echo "Live: https://brandatlas.co.kr/"
fi
