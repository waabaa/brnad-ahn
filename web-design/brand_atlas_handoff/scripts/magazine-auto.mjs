// 매거진 자동 준비 — 다음 달 호의 초안을 AI가 쓰고 검증해 대기열에 둔다(2026-09-13, 운영 방식 A 자동화).
//
// 공개는 하지 않는다. 초안은 content/magazine/drafts/ 와 서버 어드민(매거진 탭)에 올라가고,
// 어드민에서 승인한 것만 magazine-sync.mjs(서버)가 그 달의 월요일에 배정해 예약한다.
// '검증 통과 시 자동 예약'이 켜져 있으면 검증을 통과한 초안은 승인을 건너뛴다(기본 꺼짐).
//
// 사실 규칙은 사람이 쓴 원고와 같다 — LLM은 magazine-angles.mjs가 만든 근거 묶음만 본다. 자동 검증:
//   ① 숫자: 근거에 없는 숫자 → 기각(verifyArticle)  ② 링크·도판: 근거 묶음의 slug만
//   ③ 국가 혼동: 브랜드 링크가 있는 문장의 국가명이 그 브랜드 근거에 있는지(동명 회사 혼동 — 2026-09-13 Bolt 사례)
//   ④ 금지 표현·경어체  ⑤ 분량  ⑥ humanize-korean 위험도(high면 기각)
// 실패하면 문제 목록을 붙여 한 번 다시 쓰게 하고, 그래도 실패하면 초안으로 두되 '검증 실패'로 표시한다.
//
// Usage(서버): node scripts/magazine-auto.mjs [--month 2026-10] [--count 4] [--dry]
//   scripts/server/magazine-hourly.sh 가 LLM_GATEWAY_URL(127.0.0.1:5055)·LLM_GATEWAY_KEY·MAG_ADMIN_DIR·HUMANIZE_DIR 을 준비한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { urlSlugOf, countryOf } from "./lib/brand-seo.mjs";
import { hasLogo } from "./lib/archive.mjs";
import { loadArticles, referencedSlugs, verifyArticle, MAG_DIR } from "./lib/magazine.mjs";
import { pickAngles, evidenceOf, nameForPrompt } from "./lib/magazine-angles.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const GW = process.env.LLM_GATEWAY_URL || "http://127.0.0.1:5055/v1/generate";
const GW_KEY = process.env.LLM_GATEWAY_KEY || "";
// 기본 실행 위치는 배포 서버다(2026-09-13 — "매거진 관련 모든 작업은 배포 서버 작업"). 초안과 대기열 상태는 어드민 데이터 폴더에 바로 쓴다.
const ADMIN_DIR = process.env.MAG_ADMIN_DIR || "/home/developer/brandatlas-admin/data/magazine";
const DRAFT_DIR = path.join(ADMIN_DIR, "drafts");
const STATE = path.join(ADMIN_DIR, "drafts.json");

// 대상 월: 기본은 다음 달. 호수는 2026-09 = No.01 기준.
const now = new Date(Date.now() + 9 * 3600e3);
const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
const MONTH = arg("--month", nextMonth.toISOString().slice(0, 7));
const [Y, M] = MONTH.split("-").map(Number);
const ISSUE = (Y - 2026) * 12 + (M - 9) + 1;
const mondays = []; for (let d = 1; d <= 31; d++) { const dt = new Date(Date.UTC(Y, M - 1, d)); if (dt.getUTCMonth() !== M - 1) break; if (dt.getUTCDay() === 1) mondays.push(dt.toISOString().slice(0, 10)); }
const COUNT = Number(arg("--count", mondays.length));

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const bySlug = new Map(); for (const b of data.allBrands) { bySlug.set(urlSlugOf(b), b); if (b.slug && !bySlug.has(b.slug)) bySlug.set(b.slug, b); }
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { drafts: [] };
const articles = loadArticles(ROOT, { includeFuture: true });
const pending = state.drafts.filter(d => d.status === "pending" && d.month === MONTH);
const scheduledInMonth = articles.filter(a => a.date.startsWith(MONTH)).length;
const need = COUNT - scheduledInMonth - pending.length;
console.log(`${MONTH}호(No.${String(ISSUE).padStart(2, "0")}) 월요일 ${mondays.length}회 — 예약 ${scheduledInMonth} · 대기 초안 ${pending.length} → 새로 쓸 초안 ${Math.max(0, need)}편`);
if (need <= 0) process.exit(0);
if (!GW_KEY && !DRY) { console.error("LLM_GATEWAY_KEY 없음 — ~/.config/brandatlas/env 를 불러올 것"); process.exit(1); }

const exclude = new Set([...articles.flatMap(referencedSlugs), ...state.drafts.filter(d => d.status !== "rejected").flatMap(d => d.brands || [])]);
const usedKeys = new Set(state.drafts.map(d => d.angle));
const angles = pickAngles(data, { exclude, want: need + 3 }).filter(a => !usedKeys.has(a.key));

let RATE_LIMITED = false, WAITED = 0;
// ── LLM ──────────────────────────────────────────────────────────────────
async function generate(prompt) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(GW, { method: "POST", headers: { Authorization: `Bearer ${GW_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ provider: "gpt", prompt, fallback: false, timeout_ms: 170000 }), signal: AbortSignal.timeout(180000) });
      const j = await res.json().catch(() => null);
      if (j?.ok && j.content) return String(j.content);
      const err = j?.error;
      if (err?.code === "rate_limit") {
        // cron 작업이 몇 시간씩 붙잡히지 않게 15분 넘게 기다려야 하면 이번 실행을 접는다(다음 실행에서 이어 쓴다).
        const w = (Number(err.retry_after_s) || 300) + 5;
        WAITED += w;
        // 한 번에 15분 넘게, 또는 짧은 대기가 이어져 합계 15분을 넘으면 접는다(하루 한도가 찬 동안 게이트웨이는 짧은 재시도 시각을 반복해 준다).
        if (w > 900 || WAITED > 900) { console.warn(`  게이트웨이 한도(${err.limit_scope}) — ${Math.round(w / 60)}분 뒤에야 가능, 이번 실행 중단`); RATE_LIMITED = true; return ""; }
        console.warn(`  한도 — ${w}초 대기`); await new Promise(r => setTimeout(r, w * 1000)); i--; continue;
      }
      if (err) console.warn(`  게이트웨이 오류: ${JSON.stringify(err).slice(0, 160)}`);
    } catch (e) { console.warn(`  게이트웨이 연결 실패(${e.message})`); }
    await new Promise(r => setTimeout(r, 8000 * (i + 1)));
  }
  return "";
}

function promptFor(angle, pack, feedback) {
  const logos = angle.slugs.filter(s => hasLogo(bySlug.get(s)));
  const palettes = angle.slugs.filter(s => (bySlug.get(s).brandArchive?.colors || []).length);
  return `너는 한국어 브랜드 매거진 '아틀라스 매거진'의 기자다. 아래 "근거"에 있는 브랜드들을 한 주제로 엮은 기획 기사 한 편을 쓴다.
주제 방향: ${angle.hint}

절대 규칙:
- 사실(연도·숫자·인명·지명·제품명·국가·업종)은 근거에 적힌 것만 쓴다. 근거에 없으면 쓰지 않는다. 브랜드끼리 사실을 섞지 마라.
- 근거에 없는 숫자는 한 개도 쓰지 마라. 금액 단위 환산(억·조 등)도 하지 마라. 개수는 가능하면 한글 수사(세 곳, 다섯 가지)로 쓴다.
- 브랜드를 소개할 때 국가·업종 수식어는 그 브랜드 근거의 '기원 국가'·'산업'과 같아야 한다. 확실하지 않으면 수식어를 빼라.
- 문장은 평서형 '~다'로 쓴다. '~입니다/~습니다' 금지. 과장어(혁신적, 획기적, 압도적, 폭발적, 전례 없는), 결말 공식(~할 때다, ~시점이다),
  "결론적으로/요약하면/주목할 만하다/시사하는 바가 크다" 금지. 연결어미(-고, -며, -지만, -면서) 바로 뒤에 쉼표를 찍지 마라.
- 불릿·번호 목록 금지. 문단은 3~6문장. 짧은 문장과 긴 문장을 섞는다.
- 해석은 해석으로 읽히게 쓴다("~로 읽힌다" 남발 금지, 단정할 수 있는 사실만 단정).

형식(본문 body 안에서):
- 소제목은 줄 맨 앞에 "## 소제목" (4~5개, 콜론 없는 짧은 명사구)
- 브랜드를 처음 언급할 때 [표시 이름](brand:slug) 링크. slug는 근거의 slug만 쓴다.
- 도판 두 개를 본문 중간에 각각 한 줄로: "::plate slug, slug, slug | 캡션" — 로고 있는 slug만: ${logos.join(", ")}
${palettes.length ? `- 선택: 색 띠 한 줄 "::palette slug | 캡션" — 팔레트 있는 slug만: ${palettes.join(", ")}\n` : ""}- 분량: body 3,000~4,000자. 도입 문단은 주제를 던지고, 끝 문단은 여러 브랜드를 나란히 놓았을 때 보이는 것을 말한다.

출력은 JSON 한 개만(코드블록·설명 없이):
{"title":"20자 이내 제목","dek":"기사를 요약하는 2문장, 120자 이내","kicker":"한두 단어 분류","body":"본문"}
${feedback ? `\n지난 초안에서 고칠 문제(반드시 해결):\n- ${feedback.join("\n- ")}\n` : ""}
근거:
${pack}`;
}

// ── 자동 검증 ────────────────────────────────────────────────────────────
const COUNTRIES = ["한국", "미국", "일본", "영국", "프랑스", "독일", "이탈리아", "스위스", "스웨덴", "네덜란드", "캐나다", "스페인", "중국", "덴마크", "핀란드", "노르웨이", "벨기에", "호주", "에스토니아", "러시아", "인도", "브라질", "멕시코", "대만", "홍콩", "싱가포르", "이스라엘", "오스트리아", "포르투갈", "아일랜드", "뉴질랜드"];
const BANNED = /입니다\.|습니다\.|혁신적|획기적|압도적|폭발적|전례 없는|결론적으로|요약하면|주목할 만하|시사하는 바|할 때다\.|시점이다\./;
function humanizeRisk(text) {
  try {
    // 서버: HUMANIZE_DIR(=setup-magazine-server.sh가 올린 im-not-ai 도구). 로컬: 플러그인 캐시의 최신 버전.
    const plugin = path.join(process.env.HOME || "", ".claude/plugins/cache/im-not-ai/humanize-korean");
    const toolDir = process.env.HUMANIZE_DIR || path.join(plugin, fs.readdirSync(plugin).sort().pop());
    const dir = fs.mkdtempSync(path.join(fs.realpathSync("/tmp"), "mag-hk-"));
    fs.writeFileSync(path.join(dir, "01_input.txt"), text);
    execFileSync("python3", ["scripts/prepare_monolith_input.py", "--run-dir", dir, "--genre", "column"], { cwd: toolDir, stdio: "ignore", timeout: 60000 });
    const m = JSON.parse(fs.readFileSync(path.join(dir, "00_metrics.json"), "utf8"));
    fs.rmSync(dir, { recursive: true, force: true });
    return m.risk_band || "unknown";
  } catch { return "unknown"; }
}
function check(article, angle) {
  const issues = [];
  const allowed = new Set(angle.slugs);
  for (const s of referencedSlugs(article)) if (!allowed.has(s)) issues.push(`근거 밖 브랜드 slug: ${s}`);
  issues.push(...verifyArticle(article, bySlug));
  for (const sent of article.body.split(/(?<=[.다])\s+/)) {
    const links = [...sent.matchAll(/\]\(brand:([a-z0-9-]+)\)/g)].map(m => bySlug.get(m[1])).filter(Boolean);
    if (!links.length) continue;
    const ev = links.map(evidenceOf).join(" ");
    for (const c of COUNTRIES) if (sent.includes(c) && !ev.includes(c)) issues.push(`국가 '${c}'가 해당 브랜드 근거에 없음: …${sent.slice(0, 60)}…`);
  }
  const bad = BANNED.exec(article.body + article.title + article.dek); if (bad) issues.push(`금지 표현: ${bad[0]}`);
  const len = article.body.replace(/\s+/g, "").length;
  if (len < 2200) issues.push(`분량 부족(${len}자)`);
  if ((article.body.match(/^::plate /gm) || []).length < 1) issues.push("도판(::plate) 없음");
  const plain = article.body.replace(/^::.*$/gm, "").replace(/\]\(brand:[^)]+\)/g, "]").replace(/[[\]#]/g, "");
  const risk = humanizeRisk(plain);
  if (risk === "high") issues.push("문체 위험도 high(humanize-korean)");
  return { issues: [...new Set(issues)], risk };
}

// ── 실행 ────────────────────────────────────────────────────────────────
fs.mkdirSync(DRAFT_DIR, { recursive: true });
let made = 0;
for (const angle of angles) {
  if (made >= need) break;
  const pack = angle.slugs.map(s => evidenceOf(bySlug.get(s))).join("\n\n");
  console.log(`• ${angle.key} — ${angle.slugs.length}곳`);
  if (DRY) { made++; continue; }
  let result = null, feedback = null;
  for (let attempt = 0; attempt < 2 && !RATE_LIMITED; attempt++) {
    const raw = await generate(promptFor(angle, pack, feedback));
    let j; try { j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()); } catch { j = null; }
    if (!j?.body || !j?.title) { feedback = ["출력이 올바른 JSON이 아니었다. JSON 한 개만 출력하라."]; continue; }
    const slug = `${MONTH}-${angle.key}`.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const article = { slug, title: String(j.title).trim(), dek: String(j.dek || "").trim(), kicker: String(j.kicker || "기획").trim(), body: String(j.body).trim(), allowNumbers: [] };
    const res = check(article, angle);
    result = { article, ...res };
    if (!res.issues.length) break;
    feedback = res.issues.slice(0, 12);
    console.log(`  검증 문제 ${res.issues.length}건 — 다시 쓰기`);
  }
  if (RATE_LIMITED) break;
  if (!result) { console.log("  생성 실패 — 건너뜀"); continue; }
  const { article, issues, risk } = result;
  const cover = angle.slugs.filter(s => hasLogo(bySlug.get(s))).slice(0, 6);
  const meta = { slug: article.slug, issue: ISSUE, order: 0, date: "", draft: true, kicker: article.kicker, title: article.title, dek: article.dek, cover, brands: angle.slugs };
  fs.writeFileSync(path.join(DRAFT_DIR, `${article.slug}.md`), `---json\n${JSON.stringify(meta, null, 2)}\n---\n${article.body}\n`);
  state.drafts = state.drafts.filter(d => d.slug !== article.slug);
  state.drafts.push({ slug: article.slug, month: MONTH, issue: ISSUE, angle: angle.key, type: angle.type, title: article.title, dek: article.dek, brands: angle.slugs,
    status: "pending", checks: { ok: !issues.length, issues, risk }, createdAt: new Date().toISOString() });
  made++;
  console.log(`  → 초안 ${article.slug} (${issues.length ? `검증 실패 ${issues.length}건` : "검증 통과"}, 문체 ${risk})`);
}
if (!DRY) { fs.mkdirSync(path.dirname(STATE), { recursive: true }); state.syncedAt = new Date().toISOString(); fs.writeFileSync(STATE, JSON.stringify(state, null, 1)); }
console.log(`초안 ${made}편 생성${DRY ? "(dry)" : ""}. 승인은 어드민 '매거진' 탭에서.`);
// 게이트웨이 한도로 중단했으면 75(EX_TEMPFAIL) — magazine-daily.sh가 하루 1회 제한에 세지 않고 다음 정각 30분에 다시 시도한다.
if (RATE_LIMITED) process.exit(75);
