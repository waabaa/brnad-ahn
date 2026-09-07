#!/usr/bin/env python3
r"""brandatlas.co.kr nginx에 사용자 정의 404 페이지를 건다.

  error_page 404 /404.html;   (443 apex 서버 블록)

404.html 은 build-seo-extras.mjs 가 만들며(검색창·가나다 색인 링크), 상태 코드는 404 그대로다
(soft 404 아님). 멱등하며 `nginx -t` 실패 시 원복한다.

Usage: sudo python3 patch-nginx-404.py
"""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

CONF = Path("/etc/nginx/sites-enabled/brandatlas.co.kr.conf")
MARKER = "# brandatlas-404"
BLOCK = f"""
    {MARKER}
    error_page 404 /404.html;
    location = /404.html {{ internal; add_header Cache-Control "no-cache"; }}
"""


def main() -> int:
    text = CONF.read_text()
    if MARKER in text:
        text = re.sub(r"\n[ \t]*" + re.escape(MARKER) + r"[\s\S]*?\n[ \t]*location = /404\.html[^\n]*\n", "\n", text, count=1)
    backup = Path(f"/root/brandatlas.co.kr.conf.bak-404-{time.strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(CONF, backup)
    anchor = "    location / { try_files $uri $uri/ =404; }"
    if anchor not in text:
        print("주입 지점을 찾지 못했습니다", file=sys.stderr)
        return 1
    CONF.write_text(text.replace(anchor, BLOCK + anchor, 1))
    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode != 0:
        shutil.copy2(backup, CONF)
        print("nginx -t 실패 → 원복함\n" + check.stderr, file=sys.stderr)
        return 1
    print(f"적용 완료 (백업 {backup})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
