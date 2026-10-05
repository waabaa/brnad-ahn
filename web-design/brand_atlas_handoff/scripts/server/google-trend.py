#!/usr/bin/env python3
"""구글 색인·유입 주간 측정(2026-10-05) — 개선 조치의 효과를 같은 잣대로 비교한다.

배포 서버에서 어드민 venv로 돈다(weekly-refresh.sh [5]). 실행 위치는 어드민 폴더(admin_server를 import한다).
  · 고정 표본(data/google-cohort.json)을 URL 검사 API로 확인 → 색인 비율·상태 분포
  · 구글봇 방문 — 어드민이 6시간마다 쌓는 data/googlebot-daily.json(로그는 adm 그룹만 읽는다)
  · 서치 콘솔 노출·클릭·평균 순위(28일), GA4 구글 organic 세션(28일)
결과는 data/google-trend.json에 주마다 한 줄씩 쌓는다. 한 지표가 실패해도 나머지는 기록한다(error 필드).

사용: google-trend.py [--note "조치 내용"] [--rebuild-cohort]
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import admin_server as a

ORIGIN = "https://brandatlas.co.kr"
COHORT_FILE = a.DATA_DIR / "google-cohort.json"
TREND_FILE = a.DATA_DIR / "google-trend.json"
INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
BRAND_SAMPLE = 60
HUB_SAMPLE = 15


def locs(path: str) -> list[str]:
    with urllib.request.urlopen(f"{ORIGIN}/{path}", timeout=60) as r:
        return re.findall(r"<loc>([^<]+)</loc>", r.read().decode("utf-8"))


def build_cohort() -> dict:
    """처음 한 번 무작위(seed 고정)로 뽑아 파일에 못 박는다 — 주마다 표본이 달라지면 비교가 안 된다."""
    rnd = random.Random(20261005)
    brands: list[str] = []
    for n in (1, 2, 3):
        brands += [u for u in locs(f"sitemap-brands-{n}.xml") if "/brand/" in u]
    hubs = locs("sitemap-hubs.xml")
    magazine = [u for u in hubs if "/magazine/" in u]
    other = [u for u in hubs if "/magazine/" not in u and u.rstrip("/") != ORIGIN]
    urls = {
        "home": [ORIGIN + "/"],
        "magazine": magazine,
        "hub": rnd.sample(other, min(HUB_SAMPLE, len(other))),
        "brand": rnd.sample(brands, min(BRAND_SAMPLE, len(brands))),
    }
    return {"createdAt": datetime.now(a.KST).isoformat(timespec="minutes"), "urls": urls}


def inspect(item: tuple[str, str]) -> tuple[str, str, str | None, str | None]:
    kind, url = item
    try:
        r = a.gsc_call(INSPECT_URL, {"inspectionUrl": url, "siteUrl": a.GSC_SITE_URL, "languageCode": "ko"})
        s = r["inspectionResult"]["indexStatusResult"]
        return kind, url, s.get("verdict"), s.get("coverageState")
    except Exception as e:  # noqa: BLE001 — 개별 URL 실패는 집계에서 error로 센다
        return kind, url, "ERROR", str(e)[:80]


def index_sample(cohort: dict) -> dict:
    items = [(k, u) for k, us in cohort["urls"].items() for u in us]
    a.gsc_access_token()  # 토큰을 스레드 시작 전에 확보한다
    with ThreadPoolExecutor(max_workers=4) as ex:
        res = list(ex.map(inspect, items))
    states: Counter = Counter()
    by_kind: dict = {}
    for kind, _u, verdict, cov in res:
        indexed = verdict == "PASS"
        label = "색인됨" if indexed else ("오류" if verdict == "ERROR" else (cov or "알 수 없음"))
        states[label] += 1
        k = by_kind.setdefault(kind, {"total": 0, "indexed": 0})
        k["total"] += 1
        k["indexed"] += int(indexed)
    total = len(res)
    indexed = sum(v["indexed"] for v in by_kind.values())
    return {"total": total, "indexed": indexed, "ratio": round(indexed / total, 4) if total else None,
            "states": dict(states.most_common()), "byKind": by_kind}


def gsc_summary(days: int = 28) -> dict:
    site = urllib.parse.quote(a.GSC_SITE_URL, safe="")
    end = datetime.now(a.KST).date() - timedelta(days=2)
    start = end - timedelta(days=days - 1)
    rows = a.gsc_call(f"https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query",
                      {"startDate": str(start), "endDate": str(end), "rowLimit": 1}).get("rows", [])
    r = rows[0] if rows else {}
    return {"range": [str(start), str(end)], "clicks": r.get("clicks", 0), "impressions": r.get("impressions", 0),
            "position": r.get("position")}


def ga4_google(days: int = 28) -> dict:
    rows = a.ga4_rows(a.ga4_call("runReport", {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "today"}],
        "dimensions": [{"name": "sessionSource"}, {"name": "sessionMedium"}],
        "metrics": [{"name": "sessions"}],
        "limit": 100,
    }))
    google = sum(r["sessions"] for r in rows if r["sessionSource"] == "google" and r["sessionMedium"] == "organic")
    total = sum(r["sessions"] for r in rows)
    return {"organicSessions": google, "totalSessions": total}


def googlebot_week() -> dict:
    daily = json.loads((a.DATA_DIR / "googlebot-daily.json").read_text("utf-8"))
    since = (datetime.now(a.KST) - timedelta(days=7)).strftime("%Y-%m-%d")
    week: Counter = Counter()
    for day, c in daily.items():
        if day >= since:
            week.update(c)
    return {"since": since, **dict(week)}


def guarded(name: str, fn, rec: dict, errors: dict):
    try:
        rec[name] = fn()
    except Exception as e:  # noqa: BLE001
        rec[name] = None
        errors[name] = str(e)[:160]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--note", default="")
    ap.add_argument("--rebuild-cohort", action="store_true")
    args = ap.parse_args()

    if args.rebuild_cohort or not COHORT_FILE.exists():
        cohort = build_cohort()
        COHORT_FILE.write_text(json.dumps(cohort, ensure_ascii=False, indent=1), "utf-8")
    else:
        cohort = json.loads(COHORT_FILE.read_text("utf-8"))

    rec: dict = {"at": datetime.now(a.KST).isoformat(timespec="minutes"), "event": args.note,
                 "cohort": sum(len(v) for v in cohort["urls"].values())}
    errors: dict = {}
    guarded("index", lambda: index_sample(cohort), rec, errors)
    guarded("googlebot7d", googlebot_week, rec, errors)
    guarded("gsc28d", gsc_summary, rec, errors)
    guarded("ga4Google28d", ga4_google, rec, errors)
    if errors:
        rec["errors"] = errors

    try:
        hist = json.loads(TREND_FILE.read_text("utf-8"))
    except (OSError, ValueError):
        hist = []
    hist.append(rec)
    tmp = TREND_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(hist[-200:], ensure_ascii=False, indent=1), "utf-8")
    tmp.replace(TREND_FILE)

    idx = rec.get("index") or {}
    print(f"구글 추이: 색인 {idx.get('indexed')}/{idx.get('total')} · 구글봇7일 {rec.get('googlebot7d')} · "
          f"GSC {rec.get('gsc28d')} · GA4 {rec.get('ga4Google28d')}" + (f" · 오류 {list(errors)}" if errors else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
