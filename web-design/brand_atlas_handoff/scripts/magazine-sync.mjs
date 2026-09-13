// 매거진 승인 반영 — 배포 서버에서 돈다(2026-09-13, "매거진 관련 모든 작업은 배포 서버 작업").
//
// 어드민이 쓰는 것:  <MAG_ADMIN_DIR>/settings.json  {autoDraft, autoSchedule, runRequested}
//                    <MAG_ADMIN_DIR>/decisions.json {slug: {action: approve|reject, at}}
// magazine-auto가 쓰는 것: <MAG_ADMIN_DIR>/drafts.json(대기열), <MAG_ADMIN_DIR>/drafts/*.md
//
// 승인된 초안은 그 달의 비어 있는 월요일(오늘 포함 이후)에 배정해 content/magazine/<slug>.md 로 옮긴다.
// 서버의 content/magazine/ 이 매거진 원고의 원본이다 — 로컬 배포는 이 폴더를 먼저 받아 간다(deploy-brandatlas.sh).
// '검증 통과 시 자동 예약'(autoSchedule)이 켜져 있으면 검증을 통과한 대기 초안은 승인한 것으로 본다.
// 끝에 어드민 대시보드용 queue.json(예약 현황)을 쓴다.
//
// Usage(서버): node scripts/magazine-sync.mjs [--settings]   (--settings: 설정 JSON만 출력)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAG_DIR, loadArticles, todayKst, queueStatus } from "./lib/magazine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_DIR = process.env.MAG_ADMIN_DIR || "/home/developer/brandatlas-admin/data/magazine";
const DRAFT_DIR = path.join(ADMIN_DIR, "drafts");
const read = (f, fb) => { try { return JSON.parse(fs.readFileSync(path.join(ADMIN_DIR, f), "utf8")); } catch { return fb; } };
const write = (f, v) => { fs.mkdirSync(ADMIN_DIR, { recursive: true }); const t = path.join(ADMIN_DIR, `.${f}.tmp`); fs.writeFileSync(t, JSON.stringify(v, null, 1)); fs.renameSync(t, path.join(ADMIN_DIR, f)); };

const settings = { autoDraft: false, autoSchedule: false, runRequested: false, ...read("settings.json", {}) };
if (process.argv.includes("--settings")) { console.log(JSON.stringify(settings)); process.exit(0); }
const decisions = read("decisions.json", {});
const state = read("drafts.json", { drafts: [] });

const today = todayKst();
const taken = new Set(loadArticles(ROOT, { includeFuture: true }).map(a => a.date));
const mondaysOf = (month) => { const [y, m] = month.split("-").map(Number); const out = []; for (let d = 1; d <= 31; d++) { const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) break; if (dt.getUTCDay() === 1) out.push(dt.toISOString().slice(0, 10)); } return out; };
const nextFreeMonday = (month) => {
  for (const d of mondaysOf(month)) if (d >= today && !taken.has(d)) return d;
  const [y, m] = month.split("-").map(Number);
  for (const d of mondaysOf(new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7))) if (d >= today && !taken.has(d)) return d;   // 그 달이 차면 다음 달로
  return null;
};

let applied = 0;
for (const d of state.drafts.filter(x => x.status === "pending")) {
  const dec = decisions[d.slug]?.action || (settings.autoSchedule && d.checks?.ok ? "approve" : null);
  if (!dec) continue;
  const file = path.join(DRAFT_DIR, `${d.slug}.md`);
  if (dec === "reject") { Object.assign(d, { status: "rejected", decidedAt: new Date().toISOString() }); fs.rmSync(file, { force: true }); applied++; continue; }
  if (dec !== "approve" || !fs.existsSync(file)) continue;
  const date = nextFreeMonday(d.month);
  if (!date) { console.warn(`  ${d.slug}: 배정할 월요일 없음`); continue; }
  const m = /^---json\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(fs.readFileSync(file, "utf8"));
  const meta = JSON.parse(m[1]);
  const sameIssue = loadArticles(ROOT, { includeFuture: true }).filter(a => a.issue === meta.issue);
  delete meta.draft;
  Object.assign(meta, { date, order: sameIssue.length + 1, auto: true });
  fs.mkdirSync(path.join(ROOT, MAG_DIR), { recursive: true });
  fs.writeFileSync(path.join(ROOT, MAG_DIR, `${d.slug}.md`), `---json\n${JSON.stringify(meta, null, 2)}\n---\n${m[2]}`);
  fs.rmSync(file, { force: true });
  taken.add(date);
  Object.assign(d, { status: "scheduled", date, decidedAt: new Date().toISOString(), decidedBy: decisions[d.slug] ? "admin" : "autoSchedule" });
  applied++;
  console.log(`  예약: ${d.slug} → ${date}`);
}
if (applied) {
  write("drafts.json", { ...state, syncedAt: new Date().toISOString() });
  write("decisions.json", Object.fromEntries(Object.entries(decisions).filter(([s]) => state.drafts.some(d => d.slug === s && d.status === "pending"))));
}
const q = queueStatus(ROOT);
write("queue.json", { ...q, pending: state.drafts.filter(d => d.status === "pending").length, updatedAt: new Date().toISOString() });
console.log(`magazine-sync: 반영 ${applied}건 · 대기 ${state.drafts.filter(d => d.status === "pending").length}건 · 예약 ${q.scheduled.length}편(${q.daysLeft}일) · 자동 준비 ${settings.autoDraft ? "ON" : "OFF"} · 자동 예약 ${settings.autoSchedule ? "ON" : "OFF"}`);
