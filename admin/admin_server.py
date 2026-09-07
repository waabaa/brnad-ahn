"""brand-atlas 운영 어드민 백엔드.

nginx 뒤 127.0.0.1에서만 돈다. 외부 노출은 nginx `/admin-api/` 프록시 경유뿐이다.
의존성 없이 표준 라이브러리만 쓴다(resort.co.kr admin_auth_server.py와 같은 방식).

데이터 출처
  · admin-snapshot.json  빌드가 만든 집계(색인대상·thin·엔티티·수용기준)
  · 네이버 검색 API      실시간 색인 수·검색어트렌드 (NAVER API HUB)
  · nginx access log     크롤러 방문 분석
  · GA4 Data API         측정 ID·서비스 계정 확보 후

Usage:
  ADMIN_PASSWORD=... ADMIN_SESSION_SECRET=... python3 admin_server.py
"""
from __future__ import annotations

import gzip
import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

KST = timezone(timedelta(hours=9))

HOST = os.environ.get("ADMIN_HOST", "127.0.0.1")
PORT = int(os.environ.get("ADMIN_PORT", "8810"))
PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
SECRET = os.environ.get("ADMIN_SESSION_SECRET", "")
SESSION_SECONDS = int(os.environ.get("ADMIN_SESSION_SECONDS", "86400"))
COOKIE_NAME = "brandatlas_admin"
DATA_DIR = Path(os.environ.get("ADMIN_DATA_DIR", "/home/developer/brandatlas-admin/data"))
NGINX_LOG = Path(os.environ.get("ADMIN_NGINX_LOG", "/var/log/nginx/brandatlas.co.kr.access.log"))
ORIGIN = "https://brandatlas.co.kr"

# 단일 비밀번호는 무차별 대입 표적이라 실패를 세어 잠근다(nginx rate limit의 백스톱).
LOGIN_FAIL_LIMIT = int(os.environ.get("ADMIN_LOGIN_FAIL_LIMIT", "5"))
LOGIN_LOCK_SECONDS = int(os.environ.get("ADMIN_LOGIN_LOCK_SECONDS", "900"))
_login_failures: dict[str, list[float]] = defaultdict(list)

NCP_KEY_ID = os.environ.get("NCP_APIGW_KEY_ID", "")
NCP_KEY = os.environ.get("NCP_APIGW_KEY", "")
GA4_MEASUREMENT_ID = os.environ.get("GA4_MEASUREMENT_ID", "")
GA4_PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "")
GA4_SA_KEY_FILE = Path(os.environ.get("GA4_SA_KEY_FILE", str(DATA_DIR.parent / "ga4-service-account.json")))
GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"


# ─── 인증 ──────────────────────────────────────────────────────────────────
def sign(expires: int) -> str:
    msg = str(expires).encode()
    mac = hmac.new(SECRET.encode(), msg, hashlib.sha256).hexdigest()
    return f"{expires}.{mac}"


def valid_token(token: str) -> bool:
    if not SECRET or not token or "." not in token:
        return False
    raw, mac = token.rsplit(".", 1)
    if not raw.isdigit() or int(raw) < int(time.time()):
        return False
    expected = hmac.new(SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, expected)


def login_locked_for(ip: str) -> int:
    now = time.time()
    hits = [t for t in _login_failures[ip] if now - t < LOGIN_LOCK_SECONDS]
    _login_failures[ip] = hits
    if len(hits) < LOGIN_FAIL_LIMIT:
        return 0
    return int(LOGIN_LOCK_SECONDS - (now - hits[0]))


# ─── 스냅샷 ────────────────────────────────────────────────────────────────
_snapshot_cache: dict = {"mtime": 0.0, "data": None}


def snapshot() -> dict:
    p = DATA_DIR / "admin-snapshot.json"
    try:
        m = p.stat().st_mtime
    except OSError:
        return {"error": f"스냅샷 없음: {p}"}
    if _snapshot_cache["mtime"] != m:
        with p.open(encoding="utf-8") as f:
            _snapshot_cache["data"] = json.load(f)
        _snapshot_cache["mtime"] = m
    return _snapshot_cache["data"]


# ─── 네이버 API ────────────────────────────────────────────────────────────
def naver_headers() -> dict[str, str]:
    return {"X-NCP-APIGW-API-KEY-ID": NCP_KEY_ID, "X-NCP-APIGW-API-KEY": NCP_KEY}


def naver_get(path: str, params: dict) -> dict:
    if not (NCP_KEY_ID and NCP_KEY):
        raise RuntimeError("NCP_APIGW_KEY_ID/KEY 미설정")
    url = f"https://naverapihub.apigw.ntruss.com{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=naver_headers())
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def naver_post(path: str, body: dict) -> dict:
    if not (NCP_KEY_ID and NCP_KEY):
        raise RuntimeError("NCP_APIGW_KEY_ID/KEY 미설정")
    url = f"https://naverapihub.apigw.ntruss.com{path}"
    data = json.dumps(body).encode("utf-8")
    headers = {**naver_headers(), "Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def index_composition(limit_pages: int = 10) -> dict:
    """site: 질의 결과를 전수로 받아 신규/구 slug/허브로 나눈다.

    총계만 보면 이전이 진행 중인지 색인이 실제로 늘었는지 구분되지 않는다.
    """
    links: list[str] = []
    total = None
    for start in range(1, limit_pages * 100, 100):
        j = naver_get("/search/v1/webkr", {"query": "site:brandatlas.co.kr", "display": 100, "start": start})
        if total is None:
            total = j.get("total")
        items = j.get("items") or []
        links.extend(i.get("link", "") for i in items)
        if len(items) < 100:
            break
    old = [u for u in links if re.search(r"/brand/(brand-\d+|brandarchive-)", u)]
    hub = [u for u in links if re.search(r"/(category|country)/", u)]
    brand_new = [u for u in links if "/brand/" in u and u not in old]
    return {
        "total": total,
        "collected": len(links),
        "brandNew": len(brand_new),
        "brandLegacySlug": len(old),
        "hubs": len(hub),
        "other": len(links) - len(brand_new) - len(old) - len(hub),
        "legacySample": [u.split("/brand/")[-1] for u in old[:20]],
        "hubSample": [u.replace(ORIGIN, "") for u in hub[:30]],
    }


# ─── nginx 로그: 크롤러 방문 ───────────────────────────────────────────────
LOG_RE = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<ts>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) [^"]*" '
    r'(?P<status>\d{3}) (?P<bytes>\d+) "(?P<ref>[^"]*)" "(?P<ua>[^"]*)"'
)
BOTS = [
    ("네이버 Yeti", re.compile(r"Yeti", re.I)),
    ("구글봇", re.compile(r"Googlebot", re.I)),
    ("빙봇", re.compile(r"bingbot", re.I)),
    ("다음", re.compile(r"Daum", re.I)),
    ("GPTBot", re.compile(r"GPTBot", re.I)),
    ("OAI-SearchBot", re.compile(r"OAI-SearchBot", re.I)),
    ("ClaudeBot", re.compile(r"ClaudeBot|anthropic-ai", re.I)),
    ("PerplexityBot", re.compile(r"Perplexity", re.I)),
    ("Bytespider", re.compile(r"Bytespider", re.I)),
    ("AhrefsBot", re.compile(r"AhrefsBot", re.I)),
    ("SemrushBot", re.compile(r"SemrushBot", re.I)),
]


def classify_ua(ua: str) -> str:
    for name, rx in BOTS:
        if rx.search(ua):
            return name
    if re.search(r"bot|crawler|spider", ua, re.I):
        return "기타 봇"
    return "사람(추정)"


def read_log_lines(days: int):
    """당일 로그 + 회전본을 필요한 만큼 읽는다."""
    files = [NGINX_LOG]
    for i in range(1, days + 2):
        for cand in (NGINX_LOG.with_suffix(NGINX_LOG.suffix + f".{i}"),
                     NGINX_LOG.with_suffix(NGINX_LOG.suffix + f".{i}.gz")):
            if cand.exists():
                files.append(cand)
                break
    for f in files:
        try:
            opener = gzip.open if f.suffix == ".gz" else open
            with opener(f, "rt", encoding="utf-8", errors="replace") as fh:
                for line in fh:
                    yield line
        except OSError:
            continue


def crawler_report(days: int = 7) -> dict:
    since = datetime.now(KST) - timedelta(days=days)
    by_bot = Counter()
    by_bot_status = defaultdict(Counter)
    by_bot_day = defaultdict(Counter)
    paths = defaultdict(Counter)
    lines = 0
    for line in read_log_lines(days):
        m = LOG_RE.match(line)
        if not m:
            continue
        lines += 1
        try:
            ts = datetime.strptime(m.group("ts"), "%d/%b/%Y:%H:%M:%S %z")
        except ValueError:
            continue
        if ts < since:
            continue
        bot = classify_ua(m.group("ua"))
        if bot == "사람(추정)":
            continue
        day = ts.astimezone(KST).strftime("%Y-%m-%d")
        by_bot[bot] += 1
        by_bot_status[bot][m.group("status")] += 1
        by_bot_day[bot][day] += 1
        paths[bot][m.group("path")] += 1
    return {
        "days": days,
        "parsedLines": lines,
        "bots": [
            {
                "name": b,
                "hits": n,
                "status": dict(by_bot_status[b].most_common()),
                "byDay": dict(sorted(by_bot_day[b].items())),
                "topPaths": [{"path": p, "hits": c} for p, c in paths[b].most_common(10)],
            }
            for b, n in by_bot.most_common()
        ],
    }


# ─── GA4 Data API ──────────────────────────────────────────────────────────
# 측정 ID(G-…)는 데이터를 "보내는" 쪽이고, 여기서 데이터를 "읽으려면" 속성 ID와
# 서비스 계정 권한이 따로 필요하다. 자격증명이 없으면 조용히 비활성으로 두고
# 나머지 기능은 그대로 돌아간다 — 어드민 전체가 GA4에 묶이면 안 된다.
_ga4_token: dict = {"value": None, "expires": 0.0}


def ga4_ready() -> tuple[bool, str]:
    if not GA4_PROPERTY_ID:
        return False, "GA4_PROPERTY_ID 미설정 (GA4 관리 → 속성 세부정보의 9자리 숫자)"
    if not GA4_SA_KEY_FILE.exists():
        return False, f"서비스 계정 키 파일 없음: {GA4_SA_KEY_FILE}"
    try:
        import google.oauth2.service_account  # noqa: F401
        import google.auth.transport.requests  # noqa: F401
    except ImportError:
        return False, "google-auth·requests 미설치 (admin/requirements.txt)"
    return True, ""


def ga4_access_token() -> str:
    """서비스 계정으로 액세스 토큰을 받는다. 만료 1분 전까지 재사용한다."""
    if _ga4_token["value"] and time.time() < _ga4_token["expires"] - 60:
        return _ga4_token["value"]
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleRequest
    creds = service_account.Credentials.from_service_account_file(
        str(GA4_SA_KEY_FILE), scopes=[GA4_SCOPE])
    creds.refresh(GoogleRequest())
    _ga4_token["value"] = creds.token
    _ga4_token["expires"] = creds.expiry.replace(tzinfo=timezone.utc).timestamp() if creds.expiry else time.time() + 3000
    return creds.token


def ga4_call(method: str, body: dict) -> dict:
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY_ID}:{method}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {ga4_access_token()}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def ga4_rows(payload: dict) -> list[dict]:
    """runReport 응답을 [{차원…, 지표…}] 로 편다."""
    dims = [h["name"] for h in payload.get("dimensionHeaders", [])]
    mets = [h["name"] for h in payload.get("metricHeaders", [])]
    out = []
    for row in payload.get("rows", []) or []:
        rec = {}
        for i, d in enumerate(dims):
            rec[d] = row["dimensionValues"][i]["value"]
        for i, m in enumerate(mets):
            v = row["metricValues"][i]["value"]
            try:
                rec[m] = float(v) if "." in v else int(v)
            except ValueError:
                rec[m] = v
        out.append(rec)
    return out


def ga4_report(days: int = 28) -> dict:
    rng = [{"startDate": f"{days}daysAgo", "endDate": "today"}]
    summary = ga4_rows(ga4_call("runReport", {
        "dateRanges": rng,
        "metrics": [{"name": n} for n in
                    ("activeUsers", "sessions", "screenPageViews", "averageSessionDuration", "bounceRate")],
    }))
    daily = ga4_rows(ga4_call("runReport", {
        "dateRanges": rng,
        "dimensions": [{"name": "date"}],
        "metrics": [{"name": "activeUsers"}, {"name": "sessions"}, {"name": "screenPageViews"}],
        "orderBys": [{"dimension": {"dimensionName": "date"}}],
        "limit": 400,
    }))
    pages = ga4_rows(ga4_call("runReport", {
        "dateRanges": rng,
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
        "limit": 30,
    }))
    channels = ga4_rows(ga4_call("runReport", {
        "dateRanges": rng,
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 15,
    }))
    sources = ga4_rows(ga4_call("runReport", {
        "dateRanges": rng,
        "dimensions": [{"name": "sessionSource"}],
        "metrics": [{"name": "sessions"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 15,
    }))
    try:
        realtime = ga4_rows(ga4_call("runRealtimeReport", {"metrics": [{"name": "activeUsers"}]}))
    except (urllib.error.URLError, ValueError, KeyError):
        realtime = []
    return {
        "enabled": True,
        "days": days,
        "propertyId": GA4_PROPERTY_ID,
        "measurementId": GA4_MEASUREMENT_ID or None,
        "summary": summary[0] if summary else {},
        "realtimeUsers": realtime[0].get("activeUsers") if realtime else None,
        "daily": daily,
        "pages": pages,
        "channels": channels,
        "sources": sources,
    }


# ─── HTTP ──────────────────────────────────────────────────────────────────

# ─── 문의(Contact) ───────────────────────────────────────────────────────────
# 공개 폼 → 서버 저장 → 어드민 조회. 이메일 발송이나 외부 서비스에 의존하지 않는다
# (글로벌 정책: resort.co.kr admin_auth_server.py 와 같은 패턴). 저장 위치는 DATA_DIR/contacts.jsonl.
CONTACT_FILE = DATA_DIR / "contacts.jsonl"
CONTACT_RATE_LIMIT = int(os.environ.get("CONTACT_RATE_LIMIT", "5"))     # IP당 시간당
CONTACT_KINDS = {"correction": "자료 오류·수정", "rights": "로고·상표 권리", "partnership": "협업·제휴", "other": "기타"}
_contact_hits: dict[str, list[float]] = defaultdict(list)


def contact_rate_ok(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _contact_hits[ip] if now - t < 3600]
    _contact_hits[ip] = hits
    if len(hits) >= CONTACT_RATE_LIMIT:
        return False
    hits.append(now)
    return True


def save_contact(entry: dict) -> None:
    CONTACT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with CONTACT_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def list_contacts(limit: int = 200) -> list[dict]:
    if not CONTACT_FILE.exists():
        return []
    rows = []
    with CONTACT_FILE.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except ValueError:
                continue
    rows.reverse()
    return rows[:limit]


class Handler(BaseHTTPRequestHandler):
    server_version = "brandatlas-admin"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # 접근 로그는 nginx가 남긴다
        pass

    # -- helpers --
    def _json(self, status: int, payload: dict, headers: dict | None = None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self) -> str:
        return (self.headers.get("X-Real-IP") or self.headers.get("X-Forwarded-For", "").split(",")[0]
                or self.client_address[0]).strip()

    def _authed(self) -> bool:
        raw = self.headers.get("Cookie", "")
        if not raw:
            return False
        jar = cookies.SimpleCookie()
        try:
            jar.load(raw)
        except cookies.CookieError:
            return False
        morsel = jar.get(COOKIE_NAME)
        return bool(morsel and valid_token(morsel.value))

    def _body(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        if not n or n > 1_000_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return {}

    # -- routes --
    def do_POST(self):
        route = urllib.parse.urlsplit(self.path).path.rstrip("/")
        if route == "/login":
            return self._login()
        if route == "/logout":
            expired = f"{COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
            return self._json(200, {"ok": True}, {"Set-Cookie": expired})
        if route == "/contact/submit":
            return self._contact_submit()
        if not self._authed():
            return self._json(401, {"error": "인증 필요"})
        if route == "/api/trend":
            return self._trend()
        return self._json(404, {"error": "not found"})

    def _login(self):
        ip = self._client_ip()
        locked = login_locked_for(ip)
        if locked:
            return self._json(429, {"error": f"로그인 시도가 많습니다. {locked}초 후 다시 시도하세요."})
        if not PASSWORD or not SECRET:
            return self._json(500, {"error": "ADMIN_PASSWORD/ADMIN_SESSION_SECRET 미설정"})
        pw = str(self._body().get("password", ""))
        if not hmac.compare_digest(pw, PASSWORD):
            _login_failures[ip].append(time.time())
            return self._json(401, {"error": "비밀번호가 맞지 않습니다."})
        _login_failures.pop(ip, None)
        token = sign(int(time.time()) + SESSION_SECONDS)
        cookie = (f"{COOKIE_NAME}={token}; Path=/; Max-Age={SESSION_SECONDS}; "
                  "HttpOnly; Secure; SameSite=Lax")
        return self._json(200, {"ok": True}, {"Set-Cookie": cookie})

    def _contact_submit(self):
        """공개 문의 접수. nginx가 /contact-api/submit → /contact/submit 으로 프록시한다."""
        ip = self._client_ip()
        body = self._body()
        # 허니팟(website)이 채워졌으면 봇 — 성공한 척 응답하고 버린다.
        if str(body.get("website", "")).strip():
            return self._json(200, {"ok": True})
        message = str(body.get("message", "")).strip()
        if not message:
            return self._json(400, {"error": "내용을 입력해 주세요."})
        if len(message) > 2000:
            return self._json(400, {"error": "내용은 2,000자 이내로 적어 주세요."})
        if not contact_rate_ok(ip):
            return self._json(429, {"error": "문의가 너무 잦습니다. 잠시 후 다시 시도해 주세요."})
        kind = str(body.get("kind", "other"))
        entry = {
            "id": hashlib.sha1(f"{ip}{time.time()}{message[:40]}".encode()).hexdigest()[:12],
            "at": datetime.now(KST).isoformat(timespec="seconds"),
            "kind": kind if kind in CONTACT_KINDS else "other",
            "subject": str(body.get("subject", "")).strip()[:200],
            "message": message,
            "reply": str(body.get("reply", "")).strip()[:200],
            "ip": ip,
            "ua": str(self.headers.get("User-Agent", ""))[:200],
        }
        try:
            save_contact(entry)
        except OSError as e:
            return self._json(500, {"error": f"저장 실패: {e}"})
        return self._json(200, {"ok": True, "id": entry["id"]})

    def _trend(self):
        body = self._body()
        keywords = [k.strip() for k in (body.get("keywords") or []) if str(k).strip()][:5]
        if not keywords:
            return self._json(400, {"error": "keywords가 비었습니다."})
        today = datetime.now(KST).date()
        start = (today - timedelta(days=365)).replace(day=1)
        try:
            j = naver_post("/search-trend/v1/search", {
                "startDate": start.isoformat(),
                "endDate": today.isoformat(),
                "timeUnit": "month",
                "keywordGroups": [{"groupName": k, "keywords": [k]} for k in keywords],
            })
            return self._json(200, j)
        except (urllib.error.URLError, RuntimeError, ValueError) as e:
            return self._json(502, {"error": f"검색어트렌드 조회 실패: {e}"})

    def do_GET(self):
        parts = urllib.parse.urlsplit(self.path)
        route = parts.path.rstrip("/") or "/"
        qs = urllib.parse.parse_qs(parts.query)

        if route == "/health":
            return self._json(200, {"ok": True, "time": datetime.now(KST).isoformat()})
        if route == "/api/session":
            return self._json(200, {"authed": self._authed()})
        if not self._authed():
            return self._json(401, {"error": "인증 필요"})

        if route in ("/api/overview", "/api/snapshot"):
            return self._json(200, snapshot())
        if route == "/api/contact/list":
            rows = list_contacts()
            return self._json(200, {"count": len(rows), "kinds": CONTACT_KINDS, "items": rows})
        if route == "/api/config":
            return self._json(200, {
                "naverApi": bool(NCP_KEY_ID and NCP_KEY),
                "ga4MeasurementId": GA4_MEASUREMENT_ID or None,
                "ga4PropertyId": GA4_PROPERTY_ID or None,
                "ga4Ready": ga4_ready()[0],
                "ga4Reason": ga4_ready()[1] or None,
                "nginxLogReadable": NGINX_LOG.exists() and os.access(NGINX_LOG, os.R_OK),
                "snapshotPath": str(DATA_DIR / "admin-snapshot.json"),
            })
        if route == "/api/index-composition":
            try:
                return self._json(200, index_composition())
            except (urllib.error.URLError, RuntimeError, ValueError) as e:
                return self._json(502, {"error": f"네이버 색인 조회 실패: {e}"})
        if route == "/api/crawlers":
            days = max(1, min(int((qs.get("days") or ["7"])[0] or 7), 30))
            try:
                return self._json(200, crawler_report(days))
            except OSError as e:
                return self._json(500, {"error": f"로그 읽기 실패: {e}"})
        if route == "/api/ga4":
            ok, why = ga4_ready()
            if not ok:
                return self._json(200, {"enabled": False, "reason": why,
                                        "measurementId": GA4_MEASUREMENT_ID or None})
            days = max(1, min(int((qs.get("days") or ["28"])[0] or 28), 365))
            try:
                return self._json(200, ga4_report(days))
            except urllib.error.HTTPError as e:
                detail = e.read().decode("utf-8", "replace")[:400]
                return self._json(502, {"error": f"GA4 조회 실패 HTTP {e.code}: {detail}"})
            except (urllib.error.URLError, OSError, ValueError, KeyError) as e:
                return self._json(502, {"error": f"GA4 조회 실패: {e}"})
        return self._json(404, {"error": "not found"})


def main() -> None:
    if not PASSWORD or not SECRET:
        print("경고: ADMIN_PASSWORD / ADMIN_SESSION_SECRET 이 없으면 로그인이 되지 않습니다.")
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"brand-atlas admin → http://{HOST}:{PORT}  (snapshot: {DATA_DIR})")
    srv.serve_forever()


if __name__ == "__main__":
    main()
