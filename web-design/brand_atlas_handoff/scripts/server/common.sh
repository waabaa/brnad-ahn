# brand-atlas 서버 작업 공용(2026-09-14) — magazine-job.sh·weekly-refresh.sh 가 source 한다.
# 빌드는 소스 미러 한 곳에서만 돌므로 BUILD_LOCK으로 직렬화하고, 웹루트 반영은 로컬 배포와 같은 PUBLISH_LOCK을 쓴다.
SRC=/home/developer/brandatlas-src
STAGING=/home/developer/brandatlas
WEBROOT=/var/www/brandatlas
ADMIN_HOME=/home/developer/brandatlas-admin
MAG_ADMIN="$ADMIN_HOME/data/magazine"
BUILD_LOCK=/home/developer/.brandatlas-build.lock
PUBLISH_LOCK=/home/developer/.brandatlas-publish.lock

CAT_ADMIN="$ADMIN_HOME/data/catalog"

# 공개 지문 — 매거진 원고 + 수록 레코드 목록 + 로고 검수 결과(어드민 승인·반려가 바뀌면 즉시 다시 공개한다).
magazine_fp() { CAT_ADMIN="$CAT_ADMIN" node "$SRC/scripts/server/magazine-fp.mjs"; }

# 사이트 빌드(순서 고정 — CLAUDE.md §3). 브랜드 페이지는 서버에서 약 11분 걸린다.
# 서버 수록 브랜드(content/brands)를 먼저 데이터에 반영한다 — 로고 검수 결과도 여기서 적용된다.
build_site() {
  node scripts/apply-auto-brands.mjs --decisions "$CAT_ADMIN/decisions.json" &&
  node scripts/build-brand-pages.mjs | tail -1 &&
  node scripts/build-magazine.mjs &&
  node scripts/build-seo-extras.mjs | tail -1
}

# 소스 미러 → 스테이징(공개 제외 목록 공용) → 웹루트. 로컬 배포와 같은 잠금 안에서.
publish_site() {
  (
    flock -w 600 8 || { echo "  ! 공개 잠금 대기 초과"; exit 1; }
    rsync -a --delete --delete-excluded --exclude-from="$SRC/scripts/server/publish-excludes.txt" "$SRC/" "$STAGING/" &&
    sudo -n rsync -a --delete --no-owner --no-group "$STAGING/" "$WEBROOT/" &&
    echo "  웹루트 반영: $(find "$WEBROOT" -type f | wc -l) files · 매거진 $(ls "$WEBROOT/magazine/"*.html 2>/dev/null | wc -l)쪽"
  ) 8>"$PUBLISH_LOCK"
}
