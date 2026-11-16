#!/usr/bin/env python3
"""brandatlas.co.kr — 이득 없는 수집봇·확인된 스크레이퍼를 403으로 막는다(2026-11-06).

근거(서버 nginx 로그 8일): Bytespider 하루 ~790건, Python-urllib(AWS 54.191.1.131) 브랜드 페이지만 535건,
TernCrawler 290건, 195.178.110.102(rDNS 없음, Googlebot 사칭 포함), 112.217.82.66(LG유플러스 기업회선,
사용자 회선 아님 — `node`로 1분에 1,522건 일괄 수집). 검색엔진·AI 검색봇은 막지 않는다. (2026-11-17 사용자 승인: 유입 이득 없는 CCBot(AI 학습 수집)·SemrushBot·AhrefsBot(SEO 데이터 수집) 추가)

변수 이름에 brandatlas_ 접두어를 붙여 conf.d(http 공용)에 두고, 판정은 brandatlas apex 443 블록에서만 한다 —
같은 nginx를 쓰는 다른 사이트에는 영향이 없다. 목록을 바꾸면 이 파일의 BAD_UA/BAD_IP만 고쳐 다시 실행한다(멱등).
`nginx -t`가 실패하면 스스로 원복한다.

Usage: sudo python3 patch-nginx-botblock.py
"""
import shutil
import subprocess
import sys
import time
from pathlib import Path

SITE = Path("/etc/nginx/sites-enabled/brandatlas.co.kr.conf")
MAPS = Path("/etc/nginx/conf.d/13-brandatlas-botblock.conf")
MARKER = "# bot-block (brand-atlas)"

BAD_UA = ["Bytespider", "Python-urllib", "TernCrawler", "CCBot", "SemrushBot", "AhrefsBot"]
BAD_IP = ["195.178.110.102", "112.217.82.66"]

MAPS_TEXT = (
    "# brand-atlas 수집봇 차단 목록 — deploy/patch-nginx-botblock.py 가 쓴다. 판정은 brandatlas 서버 블록에서만.\n"
    "map $http_user_agent $brandatlas_bad_ua {\n    default 0;\n"
    + "".join(f'    "~*{ua}" 1;\n' for ua in BAD_UA)
    + "}\n"
    "geo $brandatlas_bad_ip {\n    default 0;\n"
    + "".join(f"    {ip} 1;\n" for ip in BAD_IP)
    + "}\n"
)

SITE_SNIPPET = f"""
    {MARKER}
    if ($brandatlas_bad_ua) {{ return 403; }}
    if ($brandatlas_bad_ip) {{ return 403; }}"""

ANCHOR = "    server_name brandatlas.co.kr;"


def main() -> int:
    if not SITE.exists():
        print(f"설정 파일 없음: {SITE}", file=sys.stderr)
        return 1
    site = SITE.read_text()
    old_maps = MAPS.read_text() if MAPS.exists() else None
    new_site = site
    if MARKER not in site:
        if site.count(ANCHOR) != 1:
            print(f"apex 443 블록의 server_name 줄이 정확히 하나가 아님({site.count(ANCHOR)}) — 설정을 확인하세요", file=sys.stderr)
            return 1
        new_site = site.replace(ANCHOR, ANCHOR + SITE_SNIPPET, 1)
    if new_site == site and old_maps == MAPS_TEXT:
        print("이미 적용됨 — 변경 없음")
        return 0

    stamp = time.strftime("%Y%m%d-%H%M%S")
    # 백업은 sites-enabled·conf.d 밖에 둔다 — 그 안에 두면 백업까지 설정으로 로드된다.
    site_bak = Path(f"/root/brandatlas.co.kr.conf.bak-{stamp}")
    shutil.copy2(SITE, site_bak)
    maps_bak = None
    if old_maps is not None:
        maps_bak = Path(f"/root/13-brandatlas-botblock.conf.bak-{stamp}")
        shutil.copy2(MAPS, maps_bak)

    MAPS.write_text(MAPS_TEXT)
    SITE.write_text(new_site)
    check = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
    if check.returncode != 0:
        shutil.copy2(site_bak, SITE)
        if maps_bak:
            shutil.copy2(maps_bak, MAPS)
        else:
            MAPS.unlink()
        print("nginx -t 실패 → 원복함\n" + check.stderr, file=sys.stderr)
        return 1
    print(f"적용 완료 (백업 {site_bak}{', ' + str(maps_bak) if maps_bak else ''})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
