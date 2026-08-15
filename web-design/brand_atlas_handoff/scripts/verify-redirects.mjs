// Phase E 301 검증 — 구 URL이 신 URL로 301을 반환하고, 신 URL이 200인지 확인한다.
// 리다이렉트가 빠지면 이미 색인된 519개 URL이 그대로 404가 된다.
//
// Usage:
//   node scripts/verify-redirects.mjs           # 표본 60건
//   node scripts/verify-redirects.mjs --all     # 전건
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://brandatlas.co.kr";
const all = process.argv.includes("--all");
const CONCURRENCY = 8;

// 검증 기준은 실제로 서버에 올라가는 301 map이다. 회차별 리포트를 쓰면 직전 실행분만
// 검사하게 되어(한 번 겪었다 — 519건 중 1건만 검증) 나머지가 깨져도 알 수 없다.
const MAP = path.resolve(ROOT, "../../deploy/brandatlas-redirects.map");
let allRows = 0;
let rows = fs.readFileSync(MAP, "utf8")
  .split("\n")
  .filter(l => l.startsWith("/"))
  .map(l => {
    const [from, to] = l.replace(/;$/, "").split(/\s+/);
    return { from, to };
  })
  .filter(r => r.from && r.to);
allRows = rows.length;
if (!all) {
  // 앞·중간·뒤에서 고르게 뽑아 특정 구간만 검증하는 편향을 피한다.
  const step = Math.max(1, Math.floor(rows.length / 60));
  rows = rows.filter((_, i) => i % step === 0).slice(0, 60);
}
console.log(`검증 대상 ${rows.length}건 / map 전체 ${allRows}건`);

async function head(url) {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  return { status: res.status, location: res.headers.get("location") };
}

const fails = [];
let ok = 0;
let cursor = 0;

async function worker() {
  while (cursor < rows.length) {
    const r = rows[cursor++];
    const oldUrl = ORIGIN + r.from;
    const newUrl = ORIGIN + r.to;
    try {
      const red = await head(oldUrl);
      if (red.status !== 301) {
        fails.push(`${r.from}: 301이 아님 (${red.status})`);
        continue;
      }
      // Location은 절대/상대 모두 허용하되 목표 경로가 맞아야 한다.
      const loc = String(red.location || "");
      if (!loc.endsWith(r.to) && loc !== newUrl) {
        fails.push(`${r.from}: Location 불일치 → ${loc}`);
        continue;
      }
      const dest = await head(newUrl);
      if (dest.status !== 200) {
        fails.push(`${r.to}: 신 URL이 200이 아님 (${dest.status})`);
        continue;
      }
      ok++;
    } catch (e) {
      fails.push(`${r.from}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nPASS ${ok} / FAIL ${fails.length}`);
for (const f of fails.slice(0, 20)) console.log(`  ${f}`);
if (fails.length > 20) console.log(`  ... 외 ${fails.length - 20}건`);
process.exit(fails.length ? 1 : 0);
