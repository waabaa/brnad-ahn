// 브랜드 요청 수록 — 배포 서버 작업(2026-09-22). 어드민 '브랜드 수록' 탭에서 검색해 고른 개체(requests.json)를
// 주간 수록과 같은 근거 검증(import-wikidata-brands.mjs)으로 수록한다. 한도·목표 없이 요청분만 처리한다.
//
//   한국어 위키백과 문서가 있으면 한국어 근거로 먼저 시도하고, 문서가 짧거나 없어 기각되면 영문 근거로 다시 시도한다.
//   결과: added(slug) | rejected(사유 — 근거 밖 숫자 등) | 게이트웨이·위키 장애는 대기열에 남겨 다음 실행에서 다시(3회까지).
//
// magazine-job.sh 가 부른다(어드민 요청 → trigger → path 유닛). 수록 레코드가 content/brands/ 에 생기면 공개 지문이 바뀌어
// 같은 실행의 ③에서 빌드·공개된다. 잠금(빌드·수록)은 호출하는 쪽이 잡는다.
// Usage: node scripts/server/catalog-requests.mjs [--has-pending]   (--has-pending: 대기 요청이 있으면 exit 0, 없으면 1)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CAT = process.env.CAT_ADMIN || "/home/developer/brandatlas-admin/data/catalog";
const KEY_FILE = process.env.CATALOG_KEY_FILE || "/home/developer/brandatlas-admin/llm-catalog-key";
const REQ = path.join(CAT, "requests.json");
const LEDGER = path.join(CAT, "ledger.json");
const MAX_ATTEMPTS = 3;
// import-wikidata-brands.mjs 의 KO_ONLY_REJECT 와 같다 — 이 사유면 영문 근거로 다시 시도할 수 있다.
const KO_ONLY_REJECT = /ko 문서 없음|요약 짧음|동음이의/;

const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
// 'running'이 2시간 넘게 남아 있으면 이전 실행이 중간에 죽은 것이다 — 다시 처리한다.
const stale = (r) => r.status === "running" && Date.now() - Date.parse(r.startedAt || 0) > 2 * 3600e3;
const pending = read(REQ, []).filter(r => (r.status === "queued" || stale(r)) && (r.attempts || 0) < MAX_ATTEMPTS);
if (process.argv.includes("--has-pending")) process.exit(pending.length ? 0 : 1);
if (!pending.length) process.exit(0);

// 어드민이 도중에 새 요청을 넣을 수 있으므로 쓰기 직전에 다시 읽어 qid별로 고친다.
function update(patches) {
  const cur = read(REQ, []);
  for (const r of cur) if (patches.has(r.qid)) Object.assign(r, patches.get(r.qid));
  const tmp = `${REQ}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cur, null, 1));
  fs.renameSync(tmp, REQ);
}

const key = (() => { try { return fs.readFileSync(KEY_FILE, "utf8").trim(); } catch { return ""; } })();
if (!key) { console.log("  ! 수록 키 없음 — deploy/setup-server-jobs.sh 확인"); process.exit(1); }
const now = () => new Date().toISOString();
update(new Map(pending.map(r => [r.qid, { status: "running", startedAt: now() }])));
console.log(`  요청 수록: ${pending.map(r => r.ko || r.en || r.qid).join(", ")}`);

function runImport(items, source) {
  if (!items.length) return;
  const cands = path.join(CAT, `request-candidates-${source}.json`);
  fs.writeFileSync(cands, JSON.stringify(items.map(r => ({ qid: r.qid, ko: r.ko || "", sitelinks: r.sitelinks || 0, demand: { why: "브랜드 요청", requestedAt: r.at } })), null, 1));
  const res = spawnSync("node", ["scripts/import-wikidata-brands.mjs", "--candidates", cands, "--only", items.map(r => r.qid).join(","),
    "--records-dir", "content/brands", "--ledger", LEDGER, "--no-fallback", "--concurrency", "1", "--batch", "1", ...(source === "en" ? ["--source", "en"] : [])],
  { env: { ...process.env, LLM_GATEWAY_URL: process.env.LLM_GATEWAY_URL || "http://127.0.0.1:5055/v1/generate", LLM_GATEWAY_KEY: key }, encoding: "utf8", timeout: 1800e3 });
  for (const line of `${res.stdout || ""}${res.stderr || ""}`.split("\n")) if (/^(준비|수록)|보류|한도/.test(line.trim())) console.log(`    [${source}] ${line.trim()}`);
  if (res.status !== 0) console.log(`    [${source}] ! import 종료 코드 ${res.status}${res.error ? ` (${res.error.message})` : ""}`);
}

// 원장에서 이번 실행이 남긴 결과만 본다(요청 전 기각 기록은 --only 가 무시하고 다시 시도한다).
const base = read(LEDGER, { added: [], rejected: [] });
const seenAdded = new Map(base.added.map(a => [a.qid, a]));
const mark = { added: base.added.length, rejected: base.rejected.length };
const outcome = () => {
  const l = read(LEDGER, { added: [], rejected: [] });
  return { added: new Map(l.added.slice(mark.added).map(a => [a.qid, a])), rejected: new Map(l.rejected.slice(mark.rejected).map(r => [r.qid, r])) };
};

const todo = pending.filter(r => !seenAdded.has(r.qid));
runImport(todo.filter(r => r.hasKo), "ko");
let o = outcome();
runImport(todo.filter(r => r.hasEn && !o.added.has(r.qid) && (!r.hasKo || KO_ONLY_REJECT.test(o.rejected.get(r.qid)?.why || ""))), "en");
o = outcome();

const patches = new Map();
for (const r of pending) {
  const a = o.added.get(r.qid) || seenAdded.get(r.qid);
  const rej = o.rejected.get(r.qid);
  if (a) patches.set(r.qid, { status: "added", slug: a.slug, name: a.name, source: a.source, doneAt: now() });
  else if (rej) patches.set(r.qid, { status: "rejected", why: rej.why, doneAt: now() });
  else {
    // 원장에 남지 않은 실패 = 게이트웨이·위키 장애(import 가 일시 오류는 기록하지 않는다). 다음 실행에서 다시.
    const attempts = (r.attempts || 0) + 1;
    patches.set(r.qid, attempts >= MAX_ATTEMPTS ? { status: "rejected", why: `일시 오류 ${attempts}회(게이트웨이·위키 응답 없음) — 다시 요청 가능`, attempts, doneAt: now() } : { status: "queued", attempts, lastError: now() });
  }
}
update(patches);
const n = [...patches.values()].reduce((m, p) => (m[p.status] = (m[p.status] || 0) + 1, m), {});
console.log(`  요청 결과: 수록 ${n.added || 0} · 기각 ${n.rejected || 0} · 재시도 대기 ${n.queued || 0}`);
