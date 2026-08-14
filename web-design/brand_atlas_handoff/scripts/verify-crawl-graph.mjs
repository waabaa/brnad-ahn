// Crawl-graph verification: walk the STATIC link graph from the home page the way a
// non-JS crawler (Naver Yeti) would, and report how many brand pages are reachable and
// at what click depth. The 2026-08 audit found only /pages/brands.html carried static
// brand links, so 1,452 pages sat behind a single flat hop.
//
// Usage: node scripts/verify-crawl-graph.mjs [--max-depth 3]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MAX_DEPTH = Number(process.argv[process.argv.indexOf("--max-depth") + 1]) || 3;

const HREF = /href="([^"#?]+)(?:[#?][^"]*)?"/g;

/** 파일 경로를 루트 기준 정규화 키로. */
function keyOf(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function readIfExists(p) {
  try {
    if (!fs.statSync(p).isFile()) return null;
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/** <script> 안의 JS 템플릿 리터럴은 링크가 아니다 — 크롤러도 마크업만 본다. */
function markupOnly(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
}

/** 링크는 URL 인코딩되어 있고 실제 파일명은 디코딩된 형태다(예: %26 ↔ &). */
function decodePath(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const start = "index.html";
const depth = new Map([[start, 0]]);
const queue = [start];
const broken = new Map(); // href → 참조한 파일

while (queue.length) {
  const cur = queue.shift();
  const d = depth.get(cur);
  if (d >= MAX_DEPTH) continue;
  const raw0 = readIfExists(path.join(ROOT, cur));
  if (raw0 == null) continue;
  const html = markupOnly(raw0);
  const dir = path.dirname(path.join(ROOT, cur));
  HREF.lastIndex = 0;
  let m;
  while ((m = HREF.exec(html))) {
    const raw = decodePath(m[1]);
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
    const abs = path.resolve(dir, raw);
    if (!abs.startsWith(ROOT)) continue;
    let target = keyOf(abs);
    // 디렉토리 링크는 index.html로 해석
    if (!/\.\w+$/.test(target)) target = `${target.replace(/\/$/, "")}/index.html`;
    if (!/\.html$/.test(target)) continue;
    if (readIfExists(path.join(ROOT, target)) == null) {
      if (!broken.has(target)) broken.set(target, cur);
      continue;
    }
    const nd = d + 1;
    if (!depth.has(target) || depth.get(target) > nd) {
      depth.set(target, nd);
      queue.push(target);
    }
  }
}

const allBrandFiles = fs.readdirSync(path.join(ROOT, "brand"))
  .filter(f => f.endsWith(".html"))
  .map(f => `brand/${f}`);

const reached = allBrandFiles.filter(f => depth.has(f));
const unreached = allBrandFiles.filter(f => !depth.has(f));
const byDepth = {};
for (const f of reached) {
  const d = depth.get(f);
  byDepth[d] = (byDepth[d] || 0) + 1;
}

// 허브별 정적 브랜드 링크 수 — 크롤 경로가 한 페이지에 몰려 있지 않은지 본다.
const hubs = ["index.html", "pages/brands.html", "pages/industry.html", "pages/insights.html",
  "pages/bici.html", "pages/timeline.html"];
const hubLinks = {};
for (const h of hubs) {
  const rawHtml = readIfExists(path.join(ROOT, h));
  if (rawHtml == null) { hubLinks[h] = null; continue; }
  const html = markupOnly(rawHtml);
  const set = new Set();
  HREF.lastIndex = 0;
  let m;
  while ((m = HREF.exec(html))) if (/(^|\/)brand\/[^/]+\.html$/.test(m[1])) set.add(decodePath(m[1]));
  hubLinks[h] = set.size;
}
for (const dir of ["category", "country"]) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) continue;
  let sum = 0, files = 0;
  for (const f of fs.readdirSync(p).filter(x => x.endsWith(".html"))) {
    const html = markupOnly(readIfExists(path.join(p, f)) || "");
    const set = new Set();
    HREF.lastIndex = 0;
    let m;
    while ((m = HREF.exec(html))) if (/(^|\/)brand\/[^/]+\.html$/.test(m[1])) set.add(decodePath(m[1]));
    sum += set.size;
    files++;
  }
  hubLinks[`${dir}/* (${files} files)`] = sum;
}

const report = {
  maxDepth: MAX_DEPTH,
  brandPages: allBrandFiles.length,
  reachable: reached.length,
  unreachable: unreached.length,
  reachableByDepth: byDepth,
  staticBrandLinksPerHub: hubLinks,
  brokenLinks: broken.size,
  brokenSamples: [...broken.entries()].slice(0, 10).map(([t, from]) => `${t} ← ${from}`),
  unreachableSamples: unreached.slice(0, 10),
};
console.log(JSON.stringify(report, null, 1));

const ok = unreached.length === 0 && broken.size === 0;
console.log(ok ? "\nPASS: 모든 브랜드 페이지가 정적 링크로 도달 가능하고 끊긴 링크가 없습니다."
  : `\nFAIL: 미도달 ${unreached.length}건, 끊긴 링크 ${broken.size}건`);
process.exit(ok ? 0 : 1);
