// Phase D: 네이버 색인 페이지 수를 실측해 .omc/state/seo-index-log.json에 기록한다.
//
// 색인 수는 이 작업의 1차 성과 지표다. 서치어드바이저 리포트는 수동으로 봐야 하지만
// `site:` 질의의 total은 API로 자동 수집할 수 있어 추세를 놓치지 않는다.
//
// 네이버 검색 API 키가 있으면 그것을 쓰고, 없으면 노출 수치만 수동 입력할 수 있게
// 항목 틀을 만들어 둔다(측정 실패를 성공으로 위장하지 않는다).
//
// 인증 경로가 둘이다(2026-07-31 네이버 개발자센터 → NAVER API HUB 이관):
//   1) NAVER API HUB (NCP)  — 신규 발급은 이 경로만 가능
//   2) 개발자센터 레거시 키 — 2026-07-31 이전 발급분만, 2027-06-30까지 유효
// 둘 다 있으면 API HUB를 먼저 쓴다. 어느 경로로 잰 값인지 로그에 남긴다.
//
// Usage:
//   NCP_APIGW_KEY_ID=... NCP_APIGW_KEY=... node scripts/track-index.mjs
//   NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... node scripts/track-index.mjs   # 레거시
//   node scripts/track-index.mjs --naver-indexed 425 --note "서치어드바이저 수동 확인"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../..");
// 서버 주간 리프레시는 INDEX_LOG(어드민 데이터 폴더)에 쓴다. 로컬 기본은 저장소의 .omc/state.
const LOG = process.env.INDEX_LOG || path.join(REPO, ".omc/state/seo-index-log.json");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const note = arg("--note") || "";
// API 키 없이 다른 경로(MCP·웹 UI)로 확인한 값을 넣을 때 쓴다.
const manualIndexed = arg("--naver-indexed");
const manualImpr = arg("--impressions");
const manualClicks = arg("--clicks");

// KST 기준 날짜 — UTC로 찍으면 오전 9시 이전 실행이 전날로 기록된다.
const kstDate = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

const SITE_QUERY = "site:brandatlas.co.kr";

/** 응답에서 total을 꺼낸다. 두 경로 모두 같은 검색 API라 응답 스키마가 같다. */
async function fetchTotal(url, headers, label) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { value: null, reason: `${label} HTTP ${res.status}`, source: label };
    const j = await res.json();
    return typeof j.total === "number"
      ? { value: j.total, reason: "", source: label }
      : { value: null, reason: `${label} 응답에 total 없음`, source: label };
  } catch (e) {
    return { value: null, reason: `${label} ${e.message}`, source: label };
  }
}

async function naverIndexed() {
  // 1) NAVER API HUB (NCP) — 2026-07-31 이후 신규 발급은 이 경로만 가능하다.
  const ncpId = process.env.NCP_APIGW_KEY_ID;
  const ncpKey = process.env.NCP_APIGW_KEY;
  if (ncpId && ncpKey) {
    const r = await fetchTotal(
      `https://naverapihub.apigw.ntruss.com/search/v1/webkr?query=${encodeURIComponent(SITE_QUERY)}&display=1`,
      { "X-NCP-APIGW-API-KEY-ID": ncpId, "X-NCP-APIGW-API-KEY": ncpKey },
      "apihub"
    );
    if (r.value != null) return r;
    // 실패 사유를 그대로 남긴다 — 엔드포인트/헤더가 바뀌었는지 바로 드러나야 한다.
    console.warn(`API HUB 조회 실패: ${r.reason}`);
    if (!process.env.NAVER_CLIENT_ID) return r;
  }

  // 2) 개발자센터 레거시 키 — 2026-07-31 이전 발급분만, 2027-06-30까지.
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    return { value: null, reason: "NCP_APIGW_KEY_ID/KEY 또는 NAVER_CLIENT_ID/SECRET 미설정", source: null };
  }
  return fetchTotal(
    `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(SITE_QUERY)}&display=1`,
    { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    "developers"
  );
}

/** 사이트가 실제로 응답하는지 — 색인 수가 떨어졌을 때 원인 구분에 필요하다. */
async function liveCheck() {
  const urls = ["/", "/sitemap.xml", "/rss.xml", "/pages/brands.html"];
  const out = {};
  for (const u of urls) {
    try {
      const r = await fetch(`https://brandatlas.co.kr${u}`, { method: "HEAD", signal: AbortSignal.timeout(15000) });
      out[u] = r.status;
    } catch (e) {
      out[u] = `ERR ${e.message}`;
    }
  }
  return out;
}

const log = fs.existsSync(LOG)
  ? JSON.parse(fs.readFileSync(LOG, "utf8"))
  : { note: "주 1회 기록", baseline: null, targets: {}, entries: [] };

const auto = await naverIndexed();
const idx = manualIndexed != null
  ? { value: Number(manualIndexed), reason: "", source: "manual" }
  : auto;   // source는 naverIndexed()가 어느 경로로 쟀는지 그대로 담는다(apihub|developers)
const live = await liveCheck();

// 구글 서치 콘솔(2026-09-13 연동). 서비스 계정 키는 서버에만 있으므로 SSH로 어드민의 gsc_report()를 불러 요약만 받는다.
// 실패해도 기록은 계속한다(google.error에 사유).
function googleSnapshot() {
  const key = process.env.SSH_KEY || path.join(process.env.HOME || "", ".ssh/resort_developer_temp");
  const py = "import json,admin_server as a;r=a.gsc_report(28);print(json.dumps({'range':r['range'],'clicks':r['summary'].get('clicks',0),'impressions':r['summary'].get('impressions',0),'position':r['summary'].get('position'),'sitemapUrls':sum(s['submitted'] for s in r['sitemaps']),'sitemapsDownloaded':[s['lastDownloaded'] for s in r['sitemaps']],'inspected':{i['path']:i['coverage'] for i in r['inspected']}},ensure_ascii=False))";
  try {
    // 서버에서 돌면(GSC_DIRECT=어드민 폴더) 바로 부르고, 로컬이면 SSH로 서버의 어드민을 부른다.
    const out = process.env.GSC_DIRECT
      ? execFileSync(path.join(process.env.GSC_DIRECT, ".venv/bin/python"), ["-c", py], { cwd: process.env.GSC_DIRECT, encoding: "utf8", timeout: 180000 })
      : execFileSync("ssh", ["-i", key, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", process.env.SSH_TARGET || "developer@test.resort.co.kr",
          `cd /home/developer/brandatlas-admin && set -a && . ./env && set +a && .venv/bin/python -c "${py}"`], { encoding: "utf8", timeout: 180000 });
    const g = JSON.parse(out.trim().split("\n").pop());
    g.indexedSample = Object.values(g.inspected).filter(v => /색인이 생성되었습니다/.test(v)).length;
    return g;
  } catch (e) {
    return { error: String(e.message || e).slice(0, 200) };
  }
}
const google = googleSnapshot();

const entry = {
  date: kstDate,
  naverIndexed: idx.value,
  naverIndexedSource: idx.value != null ? idx.source : undefined,
  naverIndexedError: idx.value === null ? idx.reason : undefined,
  impressions30d: manualImpr != null ? Number(manualImpr) : null,  // 서치어드바이저 수동 입력
  clicks30d: manualClicks != null ? Number(manualClicks) : null,
  live,
  google,
  event: note || undefined,
};

// 같은 날 재실행하면 덮어쓴다(중복 항목 방지).
log.entries = log.entries.filter(e => e.date !== kstDate);
log.entries.push(entry);
log.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));

fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.writeFileSync(LOG, JSON.stringify(log, null, 1));

console.log(`[${kstDate}] 네이버 색인: ${idx.value ?? `측정 실패(${idx.reason})`}`);
console.log(`라이브: ${JSON.stringify(live)}`);
if (log.baseline) {
  const b = log.baseline.naverIndexed;
  if (idx.value != null && b) {
    const d = idx.value - b;
    console.log(`기준선 ${b} 대비 ${d >= 0 ? "+" : ""}${d} (${((idx.value / b - 1) * 100).toFixed(1)}%)`);
  }
}
console.log(`기록: ${LOG}`);
