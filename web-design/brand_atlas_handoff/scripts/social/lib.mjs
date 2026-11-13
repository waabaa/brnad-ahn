// SNS 자동 운영 공용 모듈 — 경로·설정·토큰·게이트웨이·검증.
//
// 데이터는 배포 서버의 어드민 데이터 폴더에 둔다(매거진과 같은 방식). 게시물 하나 = posts/<id>/ 폴더 하나:
//   post.json(문구·상태·결과·성과) + 01.jpg … (피드 4:5) + reel.mp4(릴스 날만)
// 미디어 공개 주소는 어드민 백엔드의 무인증 라우트 /admin-api/sns/<id>/<파일명(확장자 없음)> 이다 —
// nginx의 확장자 정규식 location을 피하려고 확장자를 뺀다(그 location은 사이트 웹루트에서 찾는다).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SOCIAL_DIR = process.env.SOCIAL_DIR || "/home/developer/brandatlas-admin/data/social";
export const POSTS_DIR = path.join(SOCIAL_DIR, "posts");
export const TOKENS_FILE = process.env.SOCIAL_TOKENS_FILE || path.join(path.dirname(path.dirname(SOCIAL_DIR)), "social-tokens.json");
export const MEDIA_BASE = (process.env.SOCIAL_MEDIA_BASE || "https://brandatlas.co.kr/admin-api/sns").replace(/\/$/, "");
export const SITE = "https://brandatlas.co.kr";

export const DEFAULT_SETTINGS = {
  enabled: false,          // 매일 자동 생성
  autoPublish: false,      // 승인 없이 예약 시각에 발행
  platforms: { instagram: true, threads: true, facebook: true },
  publishTime: "12:30",    // KST
  reelDays: [1, 3, 5],     // 0=일 … 6=토. 이 요일은 같은 카드를 릴스(9:16 영상)로 발행
  aheadDays: 2,            // 며칠 치를 미리 만들어 검수할 시간을 둔다
  seriesOff: [],           // 끈 시리즈
};

export const SERIES = {
  brand: "오늘의 브랜드",
  logo: "로고 변천",
  history: "브랜드 연대기",
  magazine: "아틀라스 매거진",
  numbers: "숫자로 보는 브랜드",
  new: "새로 수록한 브랜드",
};

export function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
export function writeJson(p, v, mode) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = path.join(path.dirname(p), `.${path.basename(p)}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(v, null, 1), mode ? { mode } : undefined);
  fs.renameSync(tmp, p);
}

export const settings = () => ({ ...DEFAULT_SETTINGS, ...readJson(path.join(SOCIAL_DIR, "settings.json"), {}) });
export const saveSettings = (s) => writeJson(path.join(SOCIAL_DIR, "settings.json"), s);
export const tokens = () => readJson(TOKENS_FILE, {});
export const saveTokens = (t) => writeJson(TOKENS_FILE, t, 0o600);

export function listPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter(d => /^\d{4}-\d{2}-\d{2}-/.test(d))
    .map(d => readJson(path.join(POSTS_DIR, d, "post.json"), null)).filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}
export const postDir = (id) => path.join(POSTS_DIR, id);
export const savePost = (p) => writeJson(path.join(postDir(p.id), "post.json"), p);

/** KST 날짜 문자열(YYYY-MM-DD), offset일 뒤. */
export function kstDate(offset = 0, base = Date.now()) {
  return new Date(base + 9 * 3600e3 + offset * 86400e3).toISOString().slice(0, 10);
}
export const kstNow = () => new Date(Date.now() + 9 * 3600e3).toISOString().replace("Z", "+09:00");
export const log = (...a) => console.log(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace("T", " "), ...a);

/** 날짜·키로 정해지는 의사난수(같은 날 다시 돌려도 같은 선택). */
export function seeded(key) {
  let h = 2166136261;
  for (const c of String(key)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e9) / 1e9; };
}

// ── 게이트웨이(매거진과 같은 키·방식) ─────────────────────────────────────
const GW = process.env.LLM_GATEWAY_URL || "http://127.0.0.1:5055/v1/generate";
export async function generate(prompt, { maxTokens = 3000 } = {}) {
  const key = process.env.LLM_GATEWAY_KEY || "";
  if (!key) return { text: "", why: "LLM_GATEWAY_KEY 없음" };
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(GW, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "claude", prompt, fallback: false, timeout_ms: 300000, max_tokens: maxTokens }), signal: AbortSignal.timeout(310000) });
      const j = await res.json().catch(() => null);
      if (j?.ok && j.content) return { text: String(j.content) };
      if (j?.error?.code === "rate_limit") return { text: "", why: `게이트웨이 한도(${j.error.limit_scope || ""})` };
      if (j?.error) log(`  게이트웨이 오류: ${JSON.stringify(j.error).slice(0, 160)}`);
    } catch (e) { log(`  게이트웨이 연결 실패(${e.message})`); }
    await new Promise(r => setTimeout(r, 5000 * (i + 1)));
  }
  return { text: "", why: "게이트웨이 응답 없음" };
}

export function parseJsonBlock(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── 검증: 근거에 없는 숫자·과장·이모지를 막는다 ────────────────────────────
const BANNED = /(혁신적|획기적|압도적|폭발적|전례 없는|역대급|최고의|최초로|대박|무조건|꼭 알아야|충격|레전드|결론적으로|요약하면|주목할 만하다|시사하는 바가 크다)/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
export function numbersIn(s) { return (String(s).match(/\d[\d,.]*/g) || []).map(n => n.replace(/[,.]+$/, "").replace(/,/g, "")).filter(n => n.length); }
/** 문구 검증 — 문제 목록을 돌려준다(빈 배열이면 통과). */
export function verifyCopy(text, evidence) {
  const issues = [];
  const ev = String(evidence).replace(/,/g, "");
  for (const n of new Set(numbersIn(text))) if (!ev.includes(n)) issues.push(`근거에 없는 숫자 ${n}`);
  const b = String(text).match(BANNED); if (b) issues.push(`금지 표현 '${b[0]}'`);
  if (EMOJI.test(text)) issues.push("이모지");
  return issues;
}

/** 문장 단위로 자른다(한국어 평서문 '다.' 기준). */
export function sentences(text) {
  return String(text || "").replace(/\s+/g, " ").split(/(?<=다\.)\s+/).map(s => s.trim()).filter(Boolean);
}
