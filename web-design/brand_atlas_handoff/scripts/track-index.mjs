// Phase D: 네이버 색인 페이지 수를 실측해 .omc/state/seo-index-log.json에 기록한다.
//
// 색인 수는 이 작업의 1차 성과 지표다. 서치어드바이저 리포트는 수동으로 봐야 하지만
// `site:` 질의의 total은 API로 자동 수집할 수 있어 추세를 놓치지 않는다.
//
// 네이버 검색 API 키가 있으면 그것을 쓰고, 없으면 노출 수치만 수동 입력할 수 있게
// 항목 틀을 만들어 둔다(측정 실패를 성공으로 위장하지 않는다).
//
// Usage:
//   NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... node scripts/track-index.mjs
//   node scripts/track-index.mjs --note "Phase E 배포"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../..");
const LOG = path.join(REPO, ".omc/state/seo-index-log.json");

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

async function naverIndexed() {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return { value: null, reason: "NAVER_CLIENT_ID/SECRET 미설정" };
  try {
    const res = await fetch(
      "https://openapi.naver.com/v1/search/webkr.json?query=" + encodeURIComponent("site:brandatlas.co.kr") + "&display=1",
      { headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }, signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) return { value: null, reason: `HTTP ${res.status}` };
    const j = await res.json();
    return { value: typeof j.total === "number" ? j.total : null, reason: "" };
  } catch (e) {
    return { value: null, reason: e.message };
  }
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
  : { ...auto, source: "api" };
const live = await liveCheck();

const entry = {
  date: kstDate,
  naverIndexed: idx.value,
  naverIndexedSource: idx.value != null ? idx.source : undefined,
  naverIndexedError: idx.value === null ? idx.reason : undefined,
  impressions30d: manualImpr != null ? Number(manualImpr) : null,  // 서치어드바이저 수동 입력
  clicks30d: manualClicks != null ? Number(manualClicks) : null,
  live,
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
