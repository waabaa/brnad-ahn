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

# 네이버 검색 API 키(NAVER API HUB / NCP)는 저장소 밖에 둔다 — 커밋되면 안 되고,
# cron은 ~/.bashrc를 읽지 않으므로 여기서 직접 읽어 준다. 없으면 색인 측정만
# 건너뛰고 나머지는 그대로 진행한다.
ENV_FILE="${BRANDATLAS_ENV:-$HOME/.config/brandatlas/env}"
# shellcheck source=/dev/null
[ -r "$ENV_FILE" ] && . "$ENV_FILE"
DEPLOY=1
[ "${1:-}" = "--no-deploy" ] && DEPLOY=0

cd "$SITE"
echo "=== [0/5] 지수 기업 섹터 분류(금융·에너지/산업재, 멱등) ==="
node scripts/apply-index-sectors.mjs | head -1 || echo "  ! 섹터 분류 실패 — 기존 domainSlug 로 빌드"

echo "=== [0/5] 컬렉션 편입(새 QID만 Wikidata 조회, 실패해도 기존 편입 유지) ==="
node scripts/assign-collections.mjs | tail -1 || echo "  ! 컬렉션 편입 실패 — 기존 brand.collections 로 빌드"

echo "=== [1/5] 브랜드 페이지 빌드 ==="
node scripts/build-brand-pages.mjs | tail -4

echo "=== [2/5] 허브·사이트맵·RSS 빌드 ==="
node scripts/build-seo-extras.mjs | tail -10

echo "=== [2-b/5] 어드민 스냅샷 ==="
node scripts/build-admin-snapshot.mjs | tail -1

echo "=== [3/5] 검증 ==="
node scripts/verify-crawl-graph.mjs | tail -2
node scripts/qa-seo.mjs | tail -2
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
