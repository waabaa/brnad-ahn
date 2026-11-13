#!/usr/bin/env bash
# brand-atlas SNS 자동 운영 — brandatlas-social.timer(15분마다)와 .path(어드민 신호)가 부른다.
# 생성·발행·성과 수집은 scripts/social/run.mjs 한 바퀴. 겹치지 않게 flock, 게이트웨이 키는 매거진과 같은 파일.
set -u
ADMIN_HOME=/home/developer/brandatlas-admin
SRC=/home/developer/brandatlas-src
exec 9>/home/developer/.brandatlas-social.lock
flock -n 9 || { echo "$(date '+%F %T') 실행 중 — 건너뜀"; exit 0; }
export SOCIAL_DIR="$ADMIN_HOME/data/social" SOCIAL_TOKENS_FILE="$ADMIN_HOME/social-tokens.json"
export LLM_GATEWAY_URL=http://127.0.0.1:5055/v1/generate
LLM_GATEWAY_KEY="$(cat "$ADMIN_HOME/llm-gateway-key" 2>/dev/null || true)"; export LLM_GATEWAY_KEY
mkdir -p "$SOCIAL_DIR"
cd "$SRC" && node scripts/social/run.mjs "$@"
