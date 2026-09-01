#!/usr/bin/env python3
"""brandatlas.co.kr — www를 apex로 301 고정하고, 데이터 백업 파일 노출을 막는다.

배경(2026-09 감사): 443 server 블록의 server_name에 apex와 www가 함께 있어 두 호스트가
같은 바이트를 200으로 돌려주고 있었다. canonical이 apex를 가리키긴 하나 네이버는
canonical 순응도가 낮아, 호스트 중복은 색인 분산으로 이어진다. 또 data/*.bak-* 백업
파일(11MB×2)이 그대로 공개돼 있어 데이터 파일의 중복본이 크롤 대상이 되고 있었다.

멱등하다. 이미 적용돼 있으면 아무것도 하지 않는다. `nginx -t`가 실패하면 스스로 원복한다.

Usage: sudo python3 patch-nginx-canonical-host.py
"""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

CONF = Path("/etc/nginx/sites-enabled/brandatlas.co.kr.conf")
MARKER = "# canonical-host-301 (brand-atlas)"

WWW_BLOCK = f"""
server {{
    {MARKER}
    # www는 apex로 영구 이전한다. canonical과 실제 응답을 한 호스트로 일치시켜
    # 색인이 두 호스트로 갈리지 않게 한다.
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.brandatlas.co.kr;
    access_log /var/log/nginx/brandatlas.co.kr.access.log;

    ssl_certificate /etc/letsencrypt/live/brandatlas.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brandatlas.co.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://brandatlas.co.kr$request_uri;
}}
"""

DENY_BLOCK = """    # 데이터 백업본은 공개 대상이 아니다(원본과 중복되는 11MB 파일).
    location ~* \\.(bak|bak-[a-z0-9-]+)$ { return 404; }
"""


def main() -> int:
    if not CONF.exists():
        print(f"설정 파일 없음: {CONF}", file=sys.stderr)
        return 1
    text = CONF.read_text()
    if MARKER in text:
        print("이미 적용됨 — 변경 없음")
        return 0

    backup = Path(f"/root/brandatlas.co.kr.conf.bak-{time.strftime('%Y%m%d-%H%M%S')}")
    # 백업은 sites-enabled 밖에 둔다 — 그 안에 두면 백업까지 설정으로 로드된다.
    shutil.copy2(CONF, backup)

    updated = text
    # 1) 80번 블록: $host를 그대로 쓰면 www가 https-www로 이어진다 → 바로 apex로.
    updated = updated.replace(
        "location / { return 301 https://$host$request_uri; }",
        "location / { return 301 https://brandatlas.co.kr$request_uri; }",
        1,
    )
    # 2) 443 블록의 server_name에서 www 제거 (80번 블록은 ACME 갱신을 위해 www를 남긴다)
    updated = re.sub(
        r"(listen 443 ssl;\n\s*listen \[::\]:443 ssl;\n\s*)server_name brandatlas\.co\.kr www\.brandatlas\.co\.kr;",
        r"\1server_name brandatlas.co.kr;",
        updated,
        count=1,
    )
    # 3) 백업 파일 차단 — 443 블록의 데이터 파일 규칙 바로 앞에 넣는다.
    anchor = '    location = /data/brand-atlas.json {'
    if DENY_BLOCK.strip() not in updated and anchor in updated:
        updated = updated.replace(anchor, DENY_BLOCK + anchor, 1)
    # 4) www 전용 443 블록 추가
    updated = updated.rstrip() + "\n" + WWW_BLOCK

    if updated == text:
        print("패치할 지점을 찾지 못했습니다 — 설정을 확인하세요", file=sys.stderr)
        return 1

    CONF.write_text(updated)
    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode != 0:
        shutil.copy2(backup, CONF)
        print("nginx -t 실패 → 원복함\n" + check.stderr, file=sys.stderr)
        return 1
    print(f"적용 완료 (백업 {backup})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
