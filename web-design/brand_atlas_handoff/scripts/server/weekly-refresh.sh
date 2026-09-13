#!/usr/bin/env bash
# brand-atlas 주간 리프레시 — 배포 서버에서 돈다(2026-09-14, 로컬 PC cron에서 옮김). PC가 꺼져 있어도 사이트가 갱신된다.
#
# 6/29~8/14 46일간 갱신이 멈춰 sitemap lastmod가 굳었던 일을 되풀이하지 않으려고, 재빌드 → 검증 → 공개 → 색인 측정을 매주 한다.
# 검증에 실패하면 공개하지 않는다 — 깨진 산출물을 올리는 것보다 한 주 거르는 편이 낫다.
#
# systemd 사용자 유닛 brandatlas-weekly.timer(월 05:10) → 이 스크립트, 로그 ~/brandatlas-logs/weekly.log.
# 매거진도 여기서 함께 돈다(주 1회 — 초안·배정 후 전체 빌드에서 그날 공개일 기사를 연다).
# 수동 실행: 로컬에서 ./deploy/weekly-refresh.sh (서버 유닛을 깨운다)
set -uo pipefail
. /home/developer/brandatlas-src/scripts/server/common.sh
cd "$SRC" || exit 1
# 네이버 색인 조회(NCP)·GA4/서치 콘솔 서비스 계정 — 어드민 환경 파일에서 필요한 값만 가져온다(비밀번호 등은 가져오지 않는다).
set -a; eval "$(grep -E '^(NCP_APIGW_KEY_ID|NCP_APIGW_KEY|GA4_SA_KEY_FILE|GA4_PROPERTY_ID|GA4_MEASUREMENT_ID)=' "$ADMIN_HOME/env")"; set +a
export INDEX_LOG="$ADMIN_HOME/data/seo-index-log.json" GSC_DIRECT="$ADMIN_HOME"
echo "=== $(date '+%F %T') 주간 리프레시(서버) ==="
exec 7>"$BUILD_LOCK"; flock -w 3600 7 || { echo "빌드 잠금 대기 초과 — 중단"; exit 1; }

echo "[0-a] 매거진: 예약 부족이면 초안 작성, 어드민 승인분을 월요일에 배정(공개는 아래 전체 빌드가 한다)"
"$SRC/scripts/server/magazine-job.sh" --no-publish || echo "  ! 매거진 작업 실패 — 예약된 원고만으로 빌드"

echo "[0] 지수 기업 섹터 분류·컬렉션 편입(멱등, 실패해도 기존 값으로 빌드)"
node scripts/apply-index-sectors.mjs | head -1 || echo "  ! 섹터 분류 실패"
node scripts/assign-collections.mjs | tail -1 || echo "  ! 컬렉션 편입 실패"

echo "[1] 사이트 빌드(브랜드 페이지·매거진·허브·sitemap·RSS)"
build_site || { echo "빌드 실패 — 공개하지 않음"; exit 1; }

echo "[2] 어드민 스냅샷"
node scripts/build-admin-snapshot.mjs | tail -1 && cp reports/admin-snapshot.json "$ADMIN_HOME/data/admin-snapshot.json"

echo "[3] 검증"
node scripts/verify-crawl-graph.mjs | tail -1
node scripts/qa-seo.mjs | tail -1
if node scripts/audit-seo.mjs | grep -q '^FAIL'; then
  node scripts/audit-seo.mjs | grep '^FAIL'
  echo "수용기준 미달 — 공개하지 않음"; exit 1
fi

echo "[4] 공개"
publish_site || exit 1
magazine_fp > "$MAG_ADMIN/.published-fp"   # 매거진 작업이 같은 원고로 다시 빌드하지 않게

echo "[5] 색인 측정(네이버·구글)"
node scripts/track-index.mjs --note "주간 리프레시(서버)" | head -2
echo "완료: $(date '+%F %T')"
