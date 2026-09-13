#!/usr/bin/env bash
# 매거진 서버 작업 설치 — 로컬에서 한 번 실행(멱등, 2026-09-13).
#
# 배포 서버에 매거진 작업 환경을 만든다:
#   /home/developer/brandatlas-src/            사이트 소스 미러(첫 설치 때만 content/magazine/ 포함 — 이후 원고의 원본은 서버)
#   /home/developer/brandatlas-tools/humanize/ im-not-ai(humanize-korean, MIT) 문체 지표 도구 — 로컬 플러그인 캐시에서 복사
#   /home/developer/brandatlas-admin/llm-gateway-key  게이트웨이 키(600) — 로컬 ~/.config/brandatlas/env 의 LLM_GATEWAY_KEY
#   /home/developer/brandatlas-logs/magazine.log
#   developer crontab: 30 * * * * …/scripts/server/magazine-hourly.sh
# 키 값은 화면·로그에 찍지 않는다(표준입력으로만 넘긴다).
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$REPO/web-design/brand_atlas_handoff"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/resort_developer_temp}"
SSH_TARGET="${SSH_TARGET:-developer@test.resort.co.kr}"
SSH="ssh -i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes"
ENV_FILE="${BRANDATLAS_ENV:-$HOME/.config/brandatlas/env}"
HK_BASE="$HOME/.claude/plugins/cache/im-not-ai/humanize-korean"
HK="$HK_BASE/$(ls "$HK_BASE" | sort | tail -1)"

$SSH "$SSH_TARGET" 'mkdir -p ~/brandatlas-src ~/brandatlas-tools/humanize/scripts ~/brandatlas-tools/humanize/.claude/skills/humanize-korean ~/brandatlas-logs ~/brandatlas-admin/data/magazine/drafts'

echo "[1/5] 문체 지표 도구(im-not-ai, MIT)"
rsync -az -e "$SSH" "$HK/scripts/" "$SSH_TARGET:brandatlas-tools/humanize/scripts/"
rsync -az -e "$SSH" "$HK/.claude/skills/humanize-korean/references" "$SSH_TARGET:brandatlas-tools/humanize/.claude/skills/humanize-korean/"
rsync -az -e "$SSH" "$HK/LICENSE" "$SSH_TARGET:brandatlas-tools/humanize/LICENSE"

echo "[2/5] 게이트웨이 키"
( set -a; . "$ENV_FILE"; set +a; [ -n "${LLM_GATEWAY_KEY:-}" ] || { echo "LLM_GATEWAY_KEY 없음" >&2; exit 1; }; printf %s "$LLM_GATEWAY_KEY" ) \
  | $SSH "$SSH_TARGET" 'umask 077; cat > ~/brandatlas-admin/llm-gateway-key && chmod 600 ~/brandatlas-admin/llm-gateway-key && echo "  저장(600)"'

echo "[3/5] 소스 미러"
REMOTE_N="$($SSH "$SSH_TARGET" 'ls ~/brandatlas-src/content/magazine/*.md 2>/dev/null | wc -l')"
EXTRA=(--exclude='content/magazine/')
if [ "$REMOTE_N" -eq 0 ]; then EXTRA=(); echo "  서버 원고 없음 — 로컬 원고로 첫 시딩"; fi
rsync -az --delete -e "$SSH" \
  --exclude='.playwright-mcp/' --exclude='.playwright-cli/' --exclude='scratchpad/' --exclude='source-imports/' \
  --exclude='archive/' --exclude='300-brands/' --exclude='*.bak' --exclude='*.bak.*' --exclude='*.bak-*' --exclude='content/magazine/drafts/' \
  "${EXTRA[@]}" "$SITE/" "$SSH_TARGET:brandatlas-src/"

echo "[4/5] 공개 지문 초기화(설치 직후 불필요한 서버 재빌드 방지 — 현재 원고 = 현재 공개본)"
$SSH "$SSH_TARGET" 'cd ~/brandatlas-src && node -e "
const fs=require(\"fs\"),c=require(\"crypto\"),d=\"content/magazine\";
const t=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
const files=fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith(\".md\")).sort():[];
const due=files.filter(f=>{const m=/\"date\":\s*\"([0-9-]+)\"/.exec(fs.readFileSync(d+\"/\"+f,\"utf8\"));return m&&m[1]<=t}).length;
const h=c.createHash(\"sha256\");for(const f of files)h.update(f+fs.readFileSync(d+\"/\"+f));h.update(\"due:\"+due);process.stdout.write(h.digest(\"hex\").slice(0,16))" > ~/brandatlas-admin/data/magazine/.published-fp; echo "  $(cat ~/brandatlas-admin/data/magazine/.published-fp)"'

echo "[5/5] crontab"
$SSH "$SSH_TARGET" 'LINE="30 * * * * /home/developer/brandatlas-src/scripts/server/magazine-hourly.sh >> /home/developer/brandatlas-logs/magazine.log 2>&1";
  crontab -l 2>/dev/null | grep -qF "magazine-hourly.sh" || { (crontab -l 2>/dev/null; echo "# brand-atlas 매거진(자동 준비·승인 반영·공개) — 어드민 매거진 탭에서 ON/OFF"; echo "$LINE") | crontab -; };
  crontab -l | grep -n "magazine-hourly"'
echo "완료"
