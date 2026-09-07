// 외부 핫링크 자산(로고·대표 이미지·BI/CI)을 자사 도메인으로 가져온다.
//
// 2026-09-07 실측: 로고 190건·대표 이미지 279건·BI/CI 559건이 외부 호스트를 직접
// 가리켰고, namu.wiki·pstatic 등은 referer가 다르면 403을 돌려준다 — 라이브에서 로고가
// placeholder로 보이던 주원인이다. 외부 이미지는 이미지 sitemap에도 못 싣는다.
//
// 정책:
//  - 브라우저 UA, referer 없이 요청. image/* 만 채택. 200바이트 미만·HTML 응답은 실패.
//  - 성공: images/logos|photos|bici/<slug>-<hash>.<ext> 로 저장하고 데이터 경로를 교체.
//  - 실패: 로고·이미지는 필드를 비운다(깨진 이미지보다 wordmark placeholder가 낫다).
//          BI/CI 항목은 제거한다.
//  - 결과는 reports/asset-localization.json 에 남긴다.
//
// Usage: node scripts/localize-external-assets.mjs [--dry] [--limit N]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/asset-localization.json");
const dry = process.argv.includes("--dry");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
// 위키미디어는 정책상 식별 가능한 UA를 요구하며, 브라우저 UA로 스크립트 요청하면 429가 잦다.
const BOT_UA = "brandatlas-assets/1.1 (https://brandatlas.co.kr; david.lee@o2o.kr)";
const uaFor = (url) => /wikimedia\.org|wikipedia\.org/.test(url) ? BOT_UA : UA;
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "image/avif": "avif" };

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const isExt = (s) => /^https?:\/\//i.test(String(s || ""));
const slugOf = (b) => b.urlSlug || b.slug;
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);

/** 위키미디어 커먼즈 File: 페이지 URL → 실제 파일 URL. */
function normalizeUrl(u) {
  let m = /commons\.wikimedia\.org\/wiki\/File:(.+)$/i.exec(u);
  if (m) return `https://commons.wikimedia.org/wiki/Special:FilePath/${m[1]}`;
  return u;
}

// 호스트별 직렬화 — 위키미디어는 동시 요청에 429를 돌려준다(2026-09-07 실측).
const hostLocks = new Map();
async function withHostLock(url, fn) {
  let host = "";
  try { host = new URL(url).hostname.replace(/^(upload|commons)\./, "wikimedia:"); } catch { host = url; }
  const prev = hostLocks.get(host) || Promise.resolve();
  let release;
  const gate = new Promise(r => { release = r; });
  hostLocks.set(host, prev.then(() => gate));
  await prev;
  try { return await fn(); }
  finally { setTimeout(release, /wikimedia|wikipedia/.test(host) ? 1200 : 150); }
}

async function download(url) {
  return withHostLock(url, () => downloadOnce(url));
}

async function downloadOnce(url) {
  const target = normalizeUrl(url);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(target, {
        headers: { "User-Agent": uaFor(target), Accept: "image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status === 503) {
        const wait = Math.max(5000, Number(res.headers.get("retry-after") || 0) * 1000) * attempt;
        if (attempt < 4) { await new Promise(r => setTimeout(r, wait)); continue; }
        return { ok: false, reason: `HTTP ${res.status}` };
      }
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const ct = String(res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) return { ok: false, reason: `too small (${buf.length}B)` };
      let ext = EXT[ct];
      if (!ext) {
        // content-type이 엉성한 서버가 있다 — 매직 넘버로 판별한다.
        if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = "png";
        else if (buf[0] === 0xff && buf[1] === 0xd8) ext = "jpg";
        else if (buf.subarray(0, 4).toString() === "GIF8") ext = "gif";
        else if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") ext = "webp";
        else if (/^\s*(<\?xml|<svg)/i.test(buf.subarray(0, 300).toString("utf8"))) ext = "svg";
        else return { ok: false, reason: `not image (${ct || "no content-type"})` };
      }
      if (ext === "svg" && !/<svg[\s>]/i.test(buf.toString("utf8", 0, Math.min(buf.length, 4000)))) {
        return { ok: false, reason: "svg without <svg>" };
      }
      return { ok: true, buf, ext };
    } catch (e) {
      if (attempt === 4) return { ok: false, reason: e.name === "TimeoutError" ? "timeout" : e.message };
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

const results = { generatedAt: new Date().toISOString(), logo: { ok: 0, fail: 0 }, image: { ok: 0, fail: 0 }, bici: { ok: 0, fail: 0 }, failures: [] };
const cache = new Map(); // url → local path (같은 URL을 여러 브랜드가 공유할 수 있다)

const SKIP_HOST = /(^|\.)namu\.wiki$/;   // 봇 차단(403) — scripts/fetch-namu-logos-browser.mjs 가 브라우저로 받는다
async function localize(url, dir, slug, kind) {
  if (cache.has(url)) return cache.get(url);
  try { if (SKIP_HOST.test(new URL(url).hostname)) { results[kind].skipped = (results[kind].skipped || 0) + 1; return "__skip__"; } } catch {}
  // 이전 실행에서 이미 내려받은 파일이 있으면 재사용한다(파일명이 URL 해시라 결정적이다).
  const dirAbs = path.join(ROOT, `images/${dir}`);
  const filePrefix = `${slug}-${hash(url)}.`;
  const existing = fs.existsSync(dirAbs) ? fs.readdirSync(dirAbs).find(f => f.startsWith(filePrefix)) : null;
  if (existing) { const rel = `images/${dir}/${existing}`; results[kind].ok++; cache.set(url, rel); return rel; }
  const r = await download(url);
  if (!r.ok) {
    results[kind].fail++;
    results.failures.push({ slug, kind, url, reason: r.reason });
    cache.set(url, null);
    return null;
  }
  const rel = `images/${dir}/${slug}-${hash(url)}.${r.ext}`;
  if (!dry) {
    fs.mkdirSync(path.join(ROOT, `images/${dir}`), { recursive: true });
    fs.writeFileSync(path.join(ROOT, rel), r.buf);
  }
  results[kind].ok++;
  cache.set(url, rel);
  return rel;
}

// 동시성 6 — 한 호스트에 몰리지 않게 브랜드 단위로 섞는다.
const brands = (data.allBrands || []).filter(b => isExt(b.logo) || isExt(b.image) || (b.logoHistory || []).some(h => isExt(h?.src)));
console.log(`외부 자산 보유 브랜드 ${brands.length}건${dry ? " (dry)" : ""}`);
let done = 0;
const queue = brands.slice(0, LIMIT);
async function worker() {
  while (queue.length) {
    const b = queue.shift();
    const slug = slugOf(b);
    if (isExt(b.logo)) {
      const rel = await localize(b.logo, "logos", slug, "logo");
      if (rel === "__skip__") { /* 브라우저 경로로 후속 처리 */ }
      else if (rel) b.logo = rel; else b.logo = null;
    }
    if (isExt(b.image)) {
      const rel = await localize(b.image, "photos", slug, "image");
      if (rel === "__skip__") { /* 브라우저 경로 */ }
      else if (rel) b.image = rel; else b.image = isExt(b.logo) ? null : (b.logo || null);
    }
    if (Array.isArray(b.logoHistory)) {
      const kept = [];
      for (const h of b.logoHistory) {
        if (!h || !h.src) continue;
        if (!isExt(h.src)) { kept.push(h); continue; }
        const rel = await localize(h.src, "bici", slug, "bici");
        if (rel === "__skip__") kept.push(h);
        else if (rel) kept.push({ ...h, src: rel });
      }
      b.logoHistory = kept;
    }
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${brands.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

// magazine 풀(d.brands)은 allBrands와 별개 객체 사본이라 같은 id로 동기화한다.
const byId = new Map((data.allBrands || []).map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (!src) continue;
  if (isExt(m.logo)) m.logo = src.logo;
  if (isExt(m.image)) m.image = src.image;
  if (Array.isArray(m.logoHistory) && m.logoHistory.some(h => isExt(h?.src))) m.logoHistory = src.logoHistory;
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(results, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`로고 ${results.logo.ok}/${results.logo.ok + results.logo.fail}, 이미지 ${results.image.ok}/${results.image.ok + results.image.fail}, BI/CI ${results.bici.ok}/${results.bici.ok + results.bici.fail} 로컬화 → ${path.relative(ROOT, REPORT)}`);
