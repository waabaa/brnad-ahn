#!/usr/bin/env bash
# GA4 Data API 자격증명을 서버에 등록한다 — 속성 ID + 서비스 계정 JSON 키.
#
# 키 파일은 비밀번호와 같다. 저장소에 넣지 않고, 채팅으로 주고받지 않는다.
# 이 스크립트는 로컬 파일을 서버로 직접 올리고 권한 600으로 잠근다.
#
# Usage:
#   ./deploy/set-ga4-credentials.sh <속성ID> <서비스계정JSON경로>
#   예) ./deploy/set-ga4-credentials.sh 512345678 ~/Downloads/brandatlas-abc123.json
set -euo pipefail

PROPERTY_ID="${1:?속성 ID(9자리 숫자)를 지정하세요}"
KEY_FILE="${2:?서비스 계정 JSON 파일 경로를 지정하세요}"
[ -r "$KEY_FILE" ] || { echo "키 파일을 읽을 수 없습니다: $KEY_FILE"; exit 1; }
[[ "$PROPERTY_ID" =~ ^[0-9]+$ ]] || { echo "속성 ID는 숫자여야 합니다(측정 ID G-… 가 아닙니다): $PROPERTY_ID"; exit 1; }

# 키 파일이 진짜 서비스 계정 키인지 최소 확인 — OAuth 클라이언트 JSON을 잘못 받는 일이 흔하다.
python3 - "$KEY_FILE" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
if d.get("type") != "service_account" or not d.get("client_email") or not d.get("private_key"):
    sys.exit("서비스 계정 키가 아닙니다. Google Cloud > 서비스 계정 > 키 > JSON 으로 받은 파일이어야 합니다.")
print(f"  서비스 계정: {d['client_email']}")
print(f"  → 이 이메일을 GA4 '속성 액세스 관리'에 뷰어로 추가해야 합니다.")
PY

SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)
REMOTE="/home/developer/brandatlas-admin"

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "umask 077 && cat > $REMOTE/ga4-service-account.json" < "$KEY_FILE"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  chmod 600 $REMOTE/ga4-service-account.json
  cd $REMOTE
  if grep -q '^GA4_PROPERTY_ID=' env; then
    sed -i 's|^GA4_PROPERTY_ID=.*|GA4_PROPERTY_ID=$PROPERTY_ID|' env
  else
    printf 'GA4_PROPERTY_ID=%s\n' '$PROPERTY_ID' >> env
  fi
  chmod 600 env
  sudo -n systemctl restart brandatlas-admin
"
sleep 3
echo "적용됨. 확인:"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "curl -s -m 10 http://127.0.0.1:8810/health"
echo
echo "어드민 GA4 탭에서 수치가 보이면 완료입니다: https://brandatlas.co.kr/admin/#ga4"
