#!/usr/bin/env bash
# brand-atlas 주간 리프레시 — Phase D(신선도 유지).
#
# 6/29~8/14 46일간 갱신이 멈춰 sitemap lastmod가 고정값으로 굳었고 크롤러에게
# 줄 갱신 신호가 없었다. 이 스크립트는 재빌드 → 검증 → 배포 → 색인 측정을 한 번에
# 돌려 그 상태로 돌아가지 않게 한다.
#
# 검증에 실패하면 배포하지 않는다 — 깨진 산출물을 라이브에 올리는 것보다 갱신을
# 한 주 거르는 편이 낫다.
#
# Usage:
#   ./deploy/weekly-refresh.sh              # 빌드 + 검증 + 배포 + 색인 기록
#   ./deploy/weekly-refresh.sh --no-deploy  # 빌드 + 검증까지만
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$REPO/web-design/brand_atlas_handoff"
DEPLOY=1
[ "${1:-}" = "--no-deploy" ] && DEPLOY=0

cd "$SITE"
echo "=== [1/5] 브랜드 페이지 빌드 ==="
node scripts/build-brand-pages.mjs | tail -4

echo "=== [2/5] 허브·사이트맵·RSS 빌드 ==="
node scripts/build-seo-extras.mjs | tail -10

echo "=== [3/5] 검증 ==="
node scripts/verify-crawl-graph.mjs | tail -2
node scripts/audit-seo.mjs | sed -n '/=== 수용기준 ===/,$p'
if node scripts/audit-seo.mjs | grep -q '^FAIL'; then
  echo "수용기준 미달 — 배포를 중단합니다."
  exit 1
fi

if [ "$DEPLOY" = "1" ]; then
  echo "=== [4/5] 배포 ==="
  SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}" "$REPO/deploy/deploy-brandatlas.sh" | tail -3

  echo "=== [5/5] 색인 측정 ==="
  node scripts/track-index.mjs --note "주간 리프레시"
else
  echo "=== [4/5] --no-deploy: 배포 생략 ==="
  echo "=== [5/5] 색인 측정 생략 ==="
fi

echo "완료: $(date '+%Y-%m-%d %H:%M:%S %Z')"
