// 로고 후보 수집(자동 채택 없음) — 육안 검수용 컨택트시트를 만든다.
//
// 출처 두 가지:
//  1) 공식 사이트를 헤드리스 크로미움으로 렌더한 DOM(JS로 그리는 사이트도 잡힌다)에서
//     헤더 로고 <img>/<svg>/background-image/apple-touch-icon 후보
//  2) 네이버 이미지 검색 API("<한글명> 로고") 상위 결과 — 상품 사진이 섞이므로 반드시 검수
//
// 결과: scratchpad/logo-cands/<slug>/<n>.<ext> + manifest.json + index.html(컨택트시트)
// 채택은 scripts/apply-logo-candidates.mjs 에 "slug:n" 목록을 넘겨서 한다.
//
// Usage: node scripts/collect-logo-candidates.mjs [--only slug,slug] [--naver]
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "scratchpad", "logo-cands");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const args = process.argv.slice(2);
const onlyArg = args.indexOf("--only");
const ONLY = onlyArg > -1 ? new Set(args[onlyArg + 1].split(",")) : null;
const USE_NAVER = args.includes("--naver");
const CHROME = [
  `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`,
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`,
].find(p => fs.existsSync(p));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const isRealLogo = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");
const siteOf = (b) => String(b.facts?.officialWebsite || b.officialWebsite || "").trim();
const koName = (b) => /[가-힣]/.test(b.name) ? b.name : (b.nameKo || "");
let targets = data.allBrands.filter(b => !isRealLogo(b.logo) && koName(b));
if (ONLY) targets = targets.filter(b => ONLY.has(b.urlSlug || b.slug));
console.log(`대상 ${targets.length}건, chrome=${CHROME ? "ok" : "없음"}`);

const attr = (tag, name) => { const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag); return m ? (m[2] ?? m[3] ?? m[4] ?? "") : ""; };

function renderedDom(url) {
  if (!CHROME) return Promise.resolve("");
  return new Promise(resolve => {
    execFile(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--user-agent=${UA}`, "--virtual-time-budget=6000", "--timeout=20000", "--dump-dom", url], { encoding: "utf8", timeout: 45000, maxBuffer: 32 * 1024 * 1024 }, (err, stdout) => resolve(String(stdout || "")));
  });
}

function domCandidates(html, base) {
  const out = [];
  const abs = (u) => { try { return new URL(u, base).href; } catch { return null; } };
  const push = (url, kind, prio) => { if (url && !/^data:/.test(url) && !out.some(o => o.url === url)) out.push({ url, kind, prio }); };
  // 헤더 영역 우선
  const header = (html.match(/<header[\s\S]*?<\/header>/i) || html.match(/<nav[\s\S]*?<\/nav>/i) || [""])[0];
  for (const scope of [header, html]) {
    for (const tag of scope.match(/<img\b[^>]*>/gi) || []) {
      const src = attr(tag, "src") || attr(tag, "data-src") || attr(tag, "data-original") || (attr(tag, "srcset") || "").split(",")[0].trim().split(/\s+/)[0];
      const meta = `${src} ${attr(tag, "alt")} ${attr(tag, "class")} ${attr(tag, "id")}`.toLowerCase();
      if (!src) continue;
      if (/logo|로고|symbol|\bci\b|\bbi\b/.test(meta) && !/sprite|partner|payment|app-?store|google-?play|isms|kcp|award|badge|banner/.test(meta)) push(abs(src), scope === header ? "header-img-logo" : "img-logo", scope === header ? 6 : 4);
      else if (scope === header && out.length < 2) push(abs(src), "header-img", 2);
    }
  }
  // 인라인 SVG(헤더 안, 크기 있는 것)
  for (const svg of header.match(/<svg\b[\s\S]*?<\/svg>/gi) || []) {
    if (svg.length < 300 || svg.length > 60000) continue;
    if (!/<path|<polygon|<rect|<circle/.test(svg)) continue;
    out.push({ inline: svg, kind: "header-svg", prio: 5 });
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi)) {
    if (/logo/i.test(m[2])) push(abs(m[2]), "css-logo", 3);
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attr(tag, "rel").toLowerCase();
    const href = abs(attr(tag, "href"));
    if (!href) continue;
    if (rel.includes("apple-touch-icon")) push(href, "apple-touch-icon", 2);
    else if (rel.includes("icon") && /\.(svg|png)(\?|$)/i.test(href)) push(href, "icon", 1);
  }
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const prop = (attr(tag, "property") || attr(tag, "name")).toLowerCase();
    if (prop === "og:image") push(abs(attr(tag, "content")), "og:image", 1);
  }
  return out.sort((a, b) => b.prio - a.prio).slice(0, 7);
}

async function fetchImage(url, referer) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.8", ...(referer ? { Referer: referer } : {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 300) return null;
    let ext = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[String(res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()];
    if (!ext) {
      if (buf[0] === 0x89 && buf[1] === 0x50) ext = "png"; else if (buf[0] === 0xff && buf[1] === 0xd8) ext = "jpg";
      else if (buf.subarray(0, 4).toString() === "RIFF") ext = "webp"; else if (/<svg[\s>]/i.test(buf.toString("utf8", 0, 3000))) ext = "svg";
      else return null;
    }
    if (ext === "svg" && !/<svg[\s>]/i.test(buf.toString("utf8", 0, 3000))) return null;
    return { buf, ext };
  } catch { return null; }
}

async function naverCandidates(name) {
  const id = process.env.NCP_APIGW_KEY_ID, key = process.env.NCP_APIGW_KEY;
  if (!id || !key) return [];
  const out = [];
  for (const q of [`${name} 로고`, `${name} 브랜드 로고`]) {
    try {
      const res = await fetch(`https://naverapihub.apigw.ntruss.com/search/v1/image?${new URLSearchParams({ query: q, display: "8", sort: "sim" })}`, { headers: { "x-ncp-apigw-api-key-id": id, "x-ncp-apigw-api-key": key }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const j = await res.json();
      for (const it of j.items || []) {
        const w = Number(it.sizewidth || 0), h = Number(it.sizeheight || 0);
        if (w && h && (w < 120 || w / h > 5 || h / w > 3)) continue;   // 배너·세로 사진 제외
        if (!out.some(o => o.url === it.link)) out.push({ url: it.link, kind: `naver:${it.title.replace(/<[^>]+>/g, "").slice(0, 40)}`, prio: 0 });
      }
    } catch { /* skip */ }
    if (out.length >= 8) break;
  }
  return out.slice(0, 8);
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const MANIFEST = path.join(OUT, "manifest.json");
const prevManifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : [];
async function one(b) {
  const slug = b.urlSlug || b.slug;
  const site = siteOf(b);
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  // 재실행 시 이미 처리한 브랜드는 건너뛴다(.done 마커).
  if (fs.existsSync(path.join(dir, ".done"))) {
    const prev = prevManifest.find(m => m.slug === slug);
    if (prev) { manifest.push(prev); return; }
  }
  let cands = [];
  if (/^https?:\/\//.test(site)) {
    const html = await renderedDom(site);
    cands = domCandidates(html, site);
  }
  if (USE_NAVER && (cands.length < 2 || !site)) cands.push(...await naverCandidates(koName(b)));
  const saved = [];
  let n = 0;
  for (const c of cands) {
    n++;
    if (c.inline) {
      const file = path.join(dir, `${n}.svg`);
      fs.writeFileSync(file, c.inline.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"'));
      saved.push({ n, file: path.relative(ROOT, file), kind: c.kind, url: "(inline svg)" });
      continue;
    }
    const img = await fetchImage(c.url, site || undefined);
    if (!img) continue;
    const file = path.join(dir, `${n}.${img.ext}`);
    fs.writeFileSync(file, img.buf);
    saved.push({ n, file: path.relative(ROOT, file), kind: c.kind, url: c.url });
  }
  manifest.push({ slug, name: b.name, site, candidates: saved });
  fs.writeFileSync(path.join(dir, ".done"), "");
  console.log(`${slug}: ${saved.length} 후보 (${site ? "site" : "no-site"})`);
}
// 동시성 4 — 크로미움 렌더가 병목이다.
const queue = [...targets];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await one(queue.shift()); }));
manifest.sort((a, b) => targets.findIndex(t => (t.urlSlug || t.slug) === a.slug) - targets.findIndex(t => (t.urlSlug || t.slug) === b.slug));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
const sheet = manifest.map(m => `<section style="margin:14px 0;padding:10px;border-top:2px solid #333"><h3 style="margin:0 0 6px;font:bold 15px sans-serif">${m.name} <small style="font-weight:400;color:#888">${m.slug} · ${m.site || "사이트 없음"}</small></h3>${m.candidates.map(c => `<figure style="display:inline-block;vertical-align:top;width:170px;margin:4px;text-align:center;font:11px sans-serif"><div style="height:110px;display:grid;place-items:center;border:1px solid #ddd;background:#f6f6f6"><img src="../../${c.file}" style="max-width:92%;max-height:92%"></div><figcaption><b>${m.slug}:${c.n}</b><br>${c.kind}</figcaption></figure>`).join("") || "<i>후보 없음</i>"}</section>`).join("");
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><body style="margin:12px">${sheet}</body>`);
console.log(`→ ${path.relative(ROOT, OUT)}/index.html (${manifest.length}건)`);
