// 매거진 초안 대기열 ↔ 서버 어드민 동기화(2026-09-13).
//
// 어드민(서버)이 쓰는 것:  data/magazine/settings.json  {autoDraft, autoSchedule, runRequested}
//                          data/magazine/decisions.json {slug: {action: approve|reject, at}}
// 이 스크립트가 쓰는 것:   data/magazine/drafts.json(대기열 상태), data/magazine/drafts/*.md(미리보기용 원고)
//
// 승인된 초안은 그 달의 비어 있는 월요일(오늘 이후)에 배정해 content/magazine/<slug>.md 로 옮긴다 — 이후 주간 리프레시가 공개일에 연다.
// '검증 통과 시 자동 예약'(autoSchedule)이 켜져 있으면 검증을 통과한 대기 초안은 승인한 것으로 본다.
// 주간 리프레시(빌드 전)와 deploy/magazine-daily.sh 가 부른다. 서버에 닿지 못하면 로컬 상태만 유지하고 끝낸다.
//
// Usage: node scripts/magazine-sync.mjs [--settings]   (--settings: 설정 JSON만 출력하고 끝)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { MAG_DIR, loadArticles, todayKst } from "./lib/magazine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE = path.join(ROOT, "reports/magazine-drafts.json");
const DRAFT_DIR = path.join(ROOT, MAG_DIR, "drafts");
const REMOTE = "/home/developer/brandatlas-admin/data/magazine";
const SSH = ["-i", process.env.SSH_KEY || path.join(process.env.HOME || "", ".ssh/resort_developer_temp"), "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15"];
const TARGET = process.env.SSH_TARGET || "developer@test.resort.co.kr";
const ssh = (cmd, input) => execFileSync("ssh", [...SSH, TARGET, cmd], { encoding: "utf8", input, timeout: 60000 });
const readRemote = (f, fallback) => { try { const t = ssh(`cat ${REMOTE}/${f} 2>/dev/null || true`).trim(); return t ? JSON.parse(t) : fallback; } catch { return null; } };

const DEFAULT_SETTINGS = { autoDraft: false, autoSchedule: false, runRequested: false };
const settings = readRemote("settings.json", DEFAULT_SETTINGS);
if (process.argv.includes("--settings")) { console.log(JSON.stringify(settings || DEFAULT_SETTINGS)); process.exit(0); }
if (!settings) { console.warn("magazine-sync: 서버에 닿지 못함 — 동기화 생략"); process.exit(0); }
const decisions = readRemote("decisions.json", {}) || {};
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { drafts: [] };

// 결정 반영
const today = todayKst();
const taken = new Set(loadArticles(ROOT, { includeFuture: true }).map(a => a.date));
const mondaysOf = (month) => { const [y, m] = month.split("-").map(Number); const out = []; for (let d = 1; d <= 31; d++) { const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) break; if (dt.getUTCDay() === 1) out.push(dt.toISOString().slice(0, 10)); } return out; };
const nextFreeMonday = (month) => {
  for (const d of mondaysOf(month)) if (d > today && !taken.has(d)) return d;
  // 그 달에 빈 월요일이 없으면 다음 달로 넘긴다.
  const [y, m] = month.split("-").map(Number); const nm = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  for (const d of mondaysOf(nm)) if (d > today && !taken.has(d)) return d;
  return null;
};
let applied = 0;
for (const d of state.drafts.filter(x => x.status === "pending")) {
  const dec = decisions[d.slug]?.action || (settings.autoSchedule && d.checks?.ok ? "approve" : null);
  if (!dec) continue;
  const file = path.join(DRAFT_DIR, `${d.slug}.md`);
  if (dec === "reject") { d.status = "rejected"; d.decidedAt = new Date().toISOString(); if (fs.existsSync(file)) fs.rmSync(file); applied++; continue; }
  if (dec !== "approve" || !fs.existsSync(file)) continue;
  const date = nextFreeMonday(d.month);
  if (!date) { console.warn(`  ${d.slug}: 배정할 월요일 없음`); continue; }
  const raw = fs.readFileSync(file, "utf8");
  const m = /^---json\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  const meta = JSON.parse(m[1]);
  const sameIssue = loadArticles(ROOT, { includeFuture: true }).filter(a => a.issue === meta.issue);
  delete meta.draft;
  Object.assign(meta, { date, order: sameIssue.length + 1, auto: true });
  fs.writeFileSync(path.join(ROOT, MAG_DIR, `${d.slug}.md`), `---json\n${JSON.stringify(meta, null, 2)}\n---\n${m[2]}`);
  fs.rmSync(file);
  taken.add(date);
  Object.assign(d, { status: "scheduled", date, decidedAt: new Date().toISOString(), decidedBy: decisions[d.slug] ? "admin" : "autoSchedule" });
  applied++;
  console.log(`  예약: ${d.slug} → ${date}`);
}
fs.writeFileSync(STATE, JSON.stringify(state, null, 1));

// 서버로 올리기 — 대기열 상태와 미리보기용 원고(대기 중인 것만), 반영한 결정은 비운다.
const pendingFiles = fs.existsSync(DRAFT_DIR) ? fs.readdirSync(DRAFT_DIR).filter(f => f.endsWith(".md")) : [];
try {
  ssh(`mkdir -p ${REMOTE}/drafts && rm -f ${REMOTE}/drafts/*.md && cat > ${REMOTE}/drafts.json`, JSON.stringify({ syncedAt: new Date().toISOString(), drafts: state.drafts.slice(-60) }));
  for (const f of pendingFiles) ssh(`cat > ${REMOTE}/drafts/${f}`, fs.readFileSync(path.join(DRAFT_DIR, f), "utf8"));
  if (applied) {
    const left = Object.fromEntries(Object.entries(decisions).filter(([s]) => state.drafts.some(d => d.slug === s && d.status === "pending")));
    ssh(`cat > ${REMOTE}/decisions.json`, JSON.stringify(left));
  }
} catch (e) { console.warn(`magazine-sync: 업로드 실패 — ${String(e.message).slice(0, 120)}`); }
console.log(`magazine-sync: 반영 ${applied}건 · 대기 ${state.drafts.filter(d => d.status === "pending").length}건 · 자동 준비 ${settings.autoDraft ? "ON" : "OFF"} · 자동 예약 ${settings.autoSchedule ? "ON" : "OFF"}`);
