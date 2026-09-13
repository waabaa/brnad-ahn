#!/usr/bin/env bash
# 아틀라스 매거진 — 배포 서버 작업(2026-09-13, "매거진 관련 모든 작업은 배포 서버 작업").
#
#   ① 자동 준비: 어드민 설정이 ON이고 (예약 원고 ≤14일치 → 하루 1회 | '지금 시작' → 즉시)면 다음 달 호 초안 작성·검증
#   ② 승인 반영: 어드민 승인·반려를 반영, 승인분을 그 달 빈 월요일에 배정해 content/magazine/으로(원고의 원본은 서버)
#   ③ 공개: 원고가 바뀌었거나 공개일이 된 기사가 있으면 서버에서 빌드해 웹루트에 올린다 — PC가 꺼져 있어도 매거진이 나간다.
#
# 언제 도나(systemd 사용자 유닛, 2026-09-14 — 매시 cron에서 바꿈):
#   brandatlas-magazine.timer  매일 00:30 — 공개일(월요일) 기사를 그날 0시대에 열고, 예약 부족이면 초안을 쓴다
#   brandatlas-magazine.path   어드민에서 '지금 시작'·승인·반려를 누르면 data/magazine/trigger 가 바뀌어 즉시 실행
# 대부분의 실행은 설정 확인과 지문 비교만 하고 몇 초 안에 끝난다. 설치: deploy/setup-magazine-server.sh
set -uo pipefail
SRC=/home/developer/brandatlas-src
ADMIN=/home/developer/brandatlas-admin/data/magazine
STAGING=/home/developer/brandatlas
WEBROOT=/var/www/brandatlas
LOCK=/home/developer/.brandatlas-publish.lock
export MAG_ADMIN_DIR="$ADMIN" HUMANIZE_DIR=/home/developer/brandatlas-tools/humanize
export LLM_GATEWAY_URL=http://127.0.0.1:5055/v1/generate
LLM_GATEWAY_KEY="$(cat /home/developer/brandatlas-admin/llm-gateway-key 2>/dev/null || true)"; export LLM_GATEWAY_KEY
cd "$SRC" || exit 1
mkdir -p "$ADMIN"
# 겹쳐 돌지 않게(초안 작성은 수 분 걸릴 수 있다).
exec 9>"$ADMIN/.hourly.lock"; flock -n 9 || { echo "$(date '+%F %T') 이전 실행이 아직 도는 중 — 건너뜀"; exit 0; }
echo "=== $(date '+%F %T') 매거진 서버 작업 ==="

SETTINGS="$(node scripts/magazine-sync.mjs --settings)"
read -r AUTO RUNREQ <<<"$(node -e 'const s=JSON.parse(process.argv[1]);console.log(`${!!s.autoDraft} ${!!s.runRequested}`)' "$SETTINGS")"
LOW="$(node -e 'import("./scripts/lib/magazine.mjs").then(m=>console.log(m.queueStatus(".").low))')"
STAMP="$ADMIN/.auto-last-run"; RECENT=false
[ -f "$STAMP" ] && [ $(( $(date +%s) - $(stat -c %Y "$STAMP") )) -lt 72000 ] && RECENT=true
echo "자동 준비=$AUTO · 지금 시작=$RUNREQ · 예약 부족=$LOW · 최근 실행=$RECENT"

# ① 자동 준비
if [ "$AUTO" = "true" ] && { [ "$RUNREQ" = "true" ] || { [ "$LOW" = "true" ] && [ "$RECENT" = "false" ]; }; }; then
  touch "$STAMP"
  RC=0; node scripts/magazine-auto.mjs || RC=$?
  if [ "$RC" = "75" ]; then rm -f "$STAMP"; echo "  게이트웨이 한도 — 다음 시각에 다시 시도('지금 시작' 요청 유지)"
  else
    [ "$RC" != "0" ] && echo "  ! 초안 작성 실패(rc=$RC)"
    if [ "$RUNREQ" = "true" ]; then
      node -e 'const fs=require("fs"),p=process.argv[1]+"/settings.json";const s=JSON.parse(fs.readFileSync(p,"utf8"));s.runRequested=false;s.lastRunAt=new Date().toISOString();fs.writeFileSync(p,JSON.stringify(s,null,1))' "$ADMIN"
    fi
  fi
fi

# ② 승인 반영
node scripts/magazine-sync.mjs

# ③ 공개 — 원고 폴더(발행·예약 전부)와 오늘 날짜의 지문이 지난 공개와 다르면 빌드·배포.
#    공개일이 된 기사는 날짜가 바뀌면 지문이 달라져 자동으로 열린다.
FP="$(node -e '
const fs=require("fs"),c=require("crypto"),d="content/magazine";
const t=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
const files=fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith(".md")).sort():[];
const due=files.filter(f=>{const m=/"date":\s*"([0-9-]+)"/.exec(fs.readFileSync(d+"/"+f,"utf8"));return m&&m[1]<=t}).length;
const h=c.createHash("sha256");for(const f of files)h.update(f+fs.readFileSync(d+"/"+f));h.update("due:"+due);console.log(h.digest("hex").slice(0,16))')"
LAST="$(cat "$ADMIN/.published-fp" 2>/dev/null || true)"
if [ "$FP" != "$LAST" ]; then
  echo "공개: 원고 변화 감지($LAST → $FP) — 서버 빌드"
  if node scripts/build-brand-pages.mjs | tail -1 && node scripts/build-magazine.mjs && node scripts/build-seo-extras.mjs | tail -1; then
    (
      flock -w 600 8 || { echo "  ! 공개 잠금 대기 초과"; exit 1; }
      rsync -a --delete --delete-excluded --exclude-from=scripts/server/publish-excludes.txt "$SRC/" "$STAGING/" &&
      sudo -n rsync -a --delete --no-owner --no-group "$STAGING/" "$WEBROOT/" &&
      echo "  웹루트 반영: 매거진 $(ls "$WEBROOT/magazine/"*.html 2>/dev/null | wc -l)쪽"
    ) 8>"$LOCK" && echo "$FP" > "$ADMIN/.published-fp"
  else
    echo "  ! 빌드 실패 — 공개하지 않음(원고 검증 실패일 수 있다)"
  fi
fi
echo "완료: $(date '+%F %T')"
