#!/usr/bin/env python3
r"""brandatlas.co.kr nginx에 공개 문의 제출 경로를 추가한다.

  POST /contact-api/submit  →  http://127.0.0.1:8810/contact/submit   (인증 없음)

/admin-api/ 아래에 두지 않는 이유: 그 경로는 어드민 세션 전제이고 X-Robots 등 어드민용
헤더가 붙는다. 공개 폼은 별도 location 으로 두고 rate limit 을 건다(스팸·남용 방지의 1차 방어,
백엔드가 IP당 시간당 횟수로 2차 방어).

멱등하다. `nginx -t` 실패 시 스스로 원복한다.

Usage: sudo python3 patch-nginx-contact.py
"""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

CONF = Path("/etc/nginx/sites-enabled/brandatlas.co.kr.conf")
LIMIT_CONF = Path("/etc/nginx/conf.d/11-brandatlas-contact-limit.conf")
MARKER = "# brandatlas-contact"

LIMIT = """# brandatlas 공개 문의 폼 rate limit
limit_req_zone $binary_remote_addr zone=brandatlas_contact:1m rate=6r/m;
"""

BLOCK = f"""
    {MARKER}
    location = /contact-api/submit {{
        limit_req zone=brandatlas_contact burst=3 nodelay;
        limit_except POST {{ deny all; }}
        client_max_body_size 64k;
        proxy_pass http://127.0.0.1:8810/contact/submit;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store" always;
    }}
"""


def main() -> int:
    if not CONF.exists():
        print(f"설정 파일 없음: {CONF}", file=sys.stderr)
        return 1
    text = CONF.read_text()
    if MARKER in text:
        stripped = re.sub(r"\n[ \t]*" + re.escape(MARKER) + r"[\s\S]*?\n    \}\n", "\n", text, count=1)
        if stripped == text:
            print("기존 블록을 걷어내지 못했습니다 — 수동 확인 필요", file=sys.stderr)
            return 1
        text = stripped
    if not LIMIT_CONF.exists():
        LIMIT_CONF.write_text(LIMIT)

    backup = Path(f"/root/brandatlas.co.kr.conf.bak-contact-{time.strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(CONF, backup)

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
