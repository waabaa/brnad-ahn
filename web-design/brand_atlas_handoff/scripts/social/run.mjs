// SNS 자동 운영 한 바퀴 — 서버 타이머(15분마다)와 어드민 신호(trigger 파일)가 부른다(scripts/server/social-tick.sh).
//   ① 토큰 연장(7일마다) ② 자동 생성 ON이면 오늘~aheadDays일 뒤까지 비어 있는 날을 채운다(어드민 '지금 만들기'는 OFF여도 다음 빈 날 하나)
//   ③ 시각이 된 게시물 발행 ④ 성과 수집(게시물마다 6시간 간격) ⑤ 주간 분석(7일마다)
// Usage: node scripts/social/run.mjs [--dry] [--only generate|publish|insights]
import path from "node:path";
import { SOCIAL_DIR, settings, saveSettings, listPosts, kstDate, log, writeJson, kstNow } from "./lib.mjs";
import { planDay } from "./plan.mjs";
import { publishDue, refreshTokens } from "./publish.mjs";
import { collectInsights, weeklyAnalysis } from "./insights.mjs";

const dry = process.argv.includes("--dry");
const only = (() => { const i = process.argv.indexOf("--only"); return i > 0 ? process.argv[i + 1] : ""; })();
const step = (n) => !only || only === n;
const status = { startedAt: kstNow(), steps: {} };
const guard = async (name, fn) => {
  try { await fn(); status.steps[name] = "ok"; }
  catch (e) { status.steps[name] = `오류: ${e.message}`.slice(0, 300); log(`[${name}] ${e.stack || e.message}`); }
};

const s = settings();
await guard("tokens", () => (dry ? null : refreshTokens()));

if (step("generate")) await guard("generate", async () => {
  const have = new Set(listPosts().filter(p => p.status !== "discarded").map(p => p.date));
  const nowHm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16);
  const days = [];
  for (let d = 0; d <= s.aheadDays; d++) {
    const date = kstDate(d);
    if (d === 0 && nowHm >= s.publishTime) continue;   // 오늘 발행 시각이 지났으면 오늘 치는 만들지 않는다
    if (!have.has(date)) days.push(date);
  }
  const want = s.enabled ? days : s.runRequested ? days.slice(0, 1) : [];
  for (const date of want) await planDay(date);
  if (s.runRequested) saveSettings({ ...settings(), runRequested: false, lastRunAt: kstNow() });
});

if (step("publish")) await guard("publish", () => publishDue({ dry }));
if (step("insights") && !dry) await guard("insights", async () => { await collectInsights(); await weeklyAnalysis(); });

status.finishedAt = kstNow();
writeJson(path.join(SOCIAL_DIR, "status.json"), status);
log(`완료 ${JSON.stringify(status.steps)}`);
