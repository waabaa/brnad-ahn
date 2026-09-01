#!/usr/bin/env python3
r"""brandatlas.co.kr nginx에 어드민 경로를 추가한다.

  /admin/      → /var/www/brandatlas-admin/                  (정적 UI, 사이트 웹루트 밖)
  /admin-api/  → http://127.0.0.1:8810/                     (백엔드 프록시)

어드민 UI를 사이트 웹루트(/var/www/brandatlas)에 두지 않는 이유: 사이트 배포가
`rsync --delete`로 웹루트를 통째 동기화하므로 매 배포마다 지워진다. 그렇다고 홈
디렉토리에 두면 nginx(www-data)가 developer의 700 디렉토리에 들어갈 수 없다.
그래서 /var/www 아래 별도 디렉토리를 쓴다.

`^~`가 필수다. 이 서버 설정에는 `location ~* \.html$` / `~* \.(css|js|...)$` 정규식
location이 앞에 있고, nginx는 정규식 location을 일반 prefix보다 먼저 고른다. `^~`가
없으면 /admin/index.html 과 /admin/app.js 가 사이트 웹루트에서 찾아져 404가 된다.

로그인은 단일 비밀번호라 무차별 대입 표적이다. nginx에서 1차로 rate limit을 걸고
백엔드가 실패 횟수로 2차 방어한다.

멱등하다. `nginx -t` 실패 시 스스로 원복한다.

Usage: sudo python3 patch-nginx-admin.py
"""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

CONF = Path("/etc/nginx/sites-enabled/brandatlas.co.kr.conf")
LIMIT_CONF = Path("/etc/nginx/conf.d/10-brandatlas-admin-limit.conf")
MARKER = "# brandatlas-admin"

# limit_req_zone은 http 컨텍스트에만 놓을 수 있어 conf.d로 뺀다.
LIMIT = """# brandatlas 어드민 로그인 rate limit — 단일 비밀번호라 무차별 대입 표적이다.
limit_req_zone $binary_remote_addr zone=brandatlas_admin_login:1m rate=10r/m;
"""

BLOCK = f"""
    {MARKER}
    # UI는 웹루트 밖에 둔다 — 사이트 배포(rsync --delete)가 웹루트를 통째로 덮어쓴다.
    location ^~ /admin/ {{
        alias /var/www/brandatlas-admin/;
        try_files $uri $uri/ /admin/index.html;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-store" always;
    }}
    location = /admin {{ return 301 /admin/; }}

    location = /admin-api/login {{
        limit_req zone=brandatlas_admin_login burst=5 nodelay;
        proxy_pass http://127.0.0.1:8810/login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    location /admin-api/ {{
        proxy_pass http://127.0.0.1:8810/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }}
"""


def main() -> int:
    if not CONF.exists():
        print(f"설정 파일 없음: {CONF}", file=sys.stderr)
        return 1
    text = CONF.read_text()
    if MARKER in text:
        # 이미 있는 블록은 걷어내고 다시 넣는다. 마커만 보고 건너뛰면 이 스크립트로
        # 수정본을 내보낼 수 없다(실제로 alias 경로와 ^~ 를 고쳐야 했다).
        stripped = re.sub(
            r"\n[ \t]*" + re.escape(MARKER) + r"[\s\S]*?(?=\n[ \t]*location / \{ try_files)",
            "", text, count=1)
        if stripped == text:
            print("기존 블록을 걷어내지 못했습니다 — 수동 확인 필요", file=sys.stderr)
            return 1
        text = stripped
        CONF.write_text(text)

    if not LIMIT_CONF.exists():
        LIMIT_CONF.write_text(LIMIT)

    backup = Path(f"/root/brandatlas.co.kr.conf.bak-admin-{time.strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(CONF, backup)   # 백업은 sites-enabled 밖에 — 안에 두면 설정으로 로드된다

    # 443 서버 블록의 `location / {` 바로 앞에 넣는다. www 301 블록에는 넣지 않는다.
    anchor = "    location / { try_files $uri $uri/ =404; }"
    if anchor not in text:
        print("주입 지점을 찾지 못했습니다 — 설정을 확인하세요", file=sys.stderr)
        return 1
    updated = text.replace(anchor, BLOCK + anchor, 1)

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
