#!/usr/bin/env bash
# brand-atlas 야간 수록(2026-11-07) — brandatlas-intake.timer 가 밤 22:00~04:30 30분마다 부른다.
# 게이트웨이 한도는 24시간 이동 창이라 한도가 남았을 때만 서버 작업을 깨운다. 한도에 걸린 실행은 시도 횟수만 깎으므로
# 깨우기 전에 '일시 오류' 기각분·멈춘 running 을 대기로 되돌린다(근거 검증 기각은 건드리지 않는다).
set -u
ADMIN=/home/developer/brandatlas-admin
R=$ADMIN/data/catalog/requests.json
T=$ADMIN/data/magazine/trigger
K=$ADMIN/llm-catalog-key
MIN_LEFT=20

s=$(systemctl --user is-active brandatlas-magazine.service)
[ "$s" = active ] || [ "$s" = activating ] && { echo "$(date '+%F %T') 작업 실행 중 — 건너뜀"; exit 0; }
rem=$(curl -s -m 10 -H "Authorization: Bearer $(cat "$K")" http://127.0.0.1:5055/v1/quota \
  | python3 -c "import json,sys;print(min(w['remaining'] for w in json.load(sys.stdin)['providers']['gpt']['windows'] if w['window']=='perDay'))" 2>/dev/null || echo 0)
[ "${rem:-0}" -ge "$MIN_LEFT" ] || { echo "$(date '+%F %T') 남은 한도 ${rem:-0} — 대기"; exit 0; }
q=$(python3 - "$R" <<'PY'
import json,sys,shutil,time,os
p=sys.argv[1]; d=json.load(open(p)); n=0
for r in d:
    temp = r["status"] == "rejected" and str(r.get("why", "")).startswith("일시 오류")
    if temp or r["status"] == "running" or (r["status"] == "queued" and r.get("attempts")):
        r["status"] = "queued"; r["attempts"] = 0; n += 1
        for k in ("why", "doneAt", "lastError", "startedAt"): r.pop(k, None)
if n:
    shutil.copy2(p, p + ".bak-tick-" + time.strftime("%Y%m%d%H%M"))
    json.dump(d, open(p + ".tmp", "w"), ensure_ascii=False, indent=1); os.rename(p + ".tmp", p)
print(sum(1 for r in d if r["status"] == "queued"))
PY
)
[ "${q:-0}" -gt 0 ] || { echo "$(date '+%F %T') 대기 0건"; exit 0; }
date +%s > "$T"
echo "$(date '+%F %T') 남은 한도 $rem — 대기 ${q}건 깨움"
