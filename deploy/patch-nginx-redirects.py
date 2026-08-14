#!/usr/bin/env python3
"""brandatlas.co.kr nginx 설정에 Phase E 301 map을 주입한다 (서버에서 sudo로 실행).

멱등하다 — 이미 주입돼 있으면 아무것도 바꾸지 않는다.
설정을 쓰기 전에 타임스탬프 백업을 남기고, `nginx -t`가 실패하면 백업을 되돌린다.
잘못된 설정으로 reload되면 도메인 전체가 내려가므로 검증 실패 시 원복이 필수다.

Usage (서버):  sudo python3 /home/developer/patch-nginx-redirects.py
"""
import os
import re
import shutil
import subprocess
import sys
import time

CONF = "/etc/nginx/sites-enabled/brandatlas.co.kr.conf"
MAP_DST = "/etc/nginx/brandatlas-redirects.map"
# nginx.conf가 `include /etc/nginx/sites-enabled/*` 이므로 백업을 그 디렉토리에 두면
# 백업까지 설정으로 로드되어 server 블록과 지시어가 중복된다. 반드시 밖에 둔다.
BACKUP_DIR = "/etc/nginx/backups"
MARK_MAP = "# brandatlas slug redirect map"
MARK_IF = "# brandatlas slug redirect rule"

MAP_BLOCK = (
    MARK_MAP + "\n"
    "map $uri $brandatlas_redirect {\n"
    '    default "";\n'
    f"    include {MAP_DST};\n"
    "}\n\n"
)

# 최장 키가 55자라 기본 버킷 크기(64)로는 해시를 만들지 못한다
# ("could not build map_hash, you should increase map_hash_bucket_size: 64").
#
# 그런데 이 지시어는 첫 `map` 블록보다 먼저 파싱되어야 한다 — nginx는 map 블록을
# 만나는 순간 hash_bucket_size가 미설정이면 기본값으로 확정해버리고, 그 뒤에 나오는
# 선언은 "directive is duplicate"로 거부한다. 이 서버는 conf.d/babyface-hardening.conf가
# map 블록을 갖고 있고 conf.d가 sites-enabled보다 먼저 include되므로, sites-enabled
# 안에서는 아무리 위에 둬도 늦다. conf.d에서 사전순으로 앞서는 파일에 넣어야 한다.
HASH_CONF = "/etc/nginx/conf.d/00-map-hash-bucket.conf"
HASH_BODY = (
    "# brandatlas Phase E 301 map — 최장 키 55자를 담으려면 기본 64로는 부족하다.\n"
    "# 첫 map 블록보다 먼저 파싱되어야 하므로 conf.d에서 사전순 첫 파일로 둔다.\n"
    "map_hash_bucket_size 128;\n"
)
IF_LINE = (
    "\n    " + MARK_IF + "\n"
    '    if ($brandatlas_redirect != "") { return 301 https://brandatlas.co.kr$brandatlas_redirect; }\n'
)


def main() -> int:
    # sites-enabled 안에 남은 과거 백업은 그 자체가 설정으로 로드되어 검증을 깨뜨린다.
    enabled_dir = os.path.dirname(CONF)
    for name in os.listdir(enabled_dir):
        if ".bak-" in name and name.startswith(os.path.basename(CONF)):
            stale = os.path.join(enabled_dir, name)
            os.remove(stale)
            print("sites-enabled의 과거 백업 제거:", stale)

    # map 해시 버킷 설정을 먼저 배치한다(멱등).
    if not os.path.exists(HASH_CONF):
        open(HASH_CONF, "w", encoding="utf-8").write(HASH_BODY)
        print("생성:", HASH_CONF)

    src = open(CONF, encoding="utf-8").read()

    if MARK_MAP in src and MARK_IF in src:
        print("이미 적용됨 — 설정 변경 없음")
        return 0

    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup = os.path.join(BACKUP_DIR, f"{os.path.basename(CONF)}.bak-{time.strftime('%Y%m%d%H%M%S')}")
    shutil.copy2(CONF, backup)
    print("백업:", backup)

    out = src
    if MARK_MAP not in out:
        out = MAP_BLOCK + out

    if MARK_IF not in out:
        # 443 server 블록의 여는 중괄호 바로 뒤에 넣는다.
        #
        # 블록 경계를 중괄호 균형으로 정확히 잡아야 한다. 고정 길이로 앞을 훑으면
        # 80 포트 블록 안에서 다음 블록의 `listen 443`을 읽어 엉뚱한 곳(HTTP→HTTPS
        # 리다이렉트 전용 블록)에 규칙이 들어간다. 그러면 https 요청은 규칙을 만나지
        # 못해 그대로 404가 된다.
        target = None
        for m in re.finditer(r"server\s*\{", out):
            depth, i = 1, m.end()
            while i < len(out) and depth:
                if out[i] == "{":
                    depth += 1
                elif out[i] == "}":
                    depth -= 1
                i += 1
            if "listen 443" in out[m.end():i - 1]:
                target = m
                break
        if target is None:
            print("443 server 블록을 찾지 못했습니다 — 원복", file=sys.stderr)
            shutil.copy2(backup, CONF)
            return 1
        out = out[:target.end()] + IF_LINE + out[target.end():]

    open(CONF, "w", encoding="utf-8").write(out)

    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode != 0:
        print("nginx -t 실패 — 백업 복원", file=sys.stderr)
        print(check.stderr, file=sys.stderr)
        shutil.copy2(backup, CONF)
        return 1

    print("nginx -t 통과, 설정 주입 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())
