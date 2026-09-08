// 로고 후보 수집(자동 채택 없음) — 육안 검수용 컨택트시트를 만든다.
//
// 출처(우선순위 순):
//  1) Wikipedia(en·ko) 검색 → 제목이 브랜드명과 맞는 문서의 대표 이미지 + 문서 내 logo/label 파일
//  2) Wikidata(P154 로고, P18 이미지) — 문서의 wikibase_item 또는 wbsearchentities
//  3) 공식 사이트를 헤드리스 크로미움으로 렌더한 DOM의 헤더 로고 <img>/<svg>/apple-touch-icon
//  4) 네이버 이미지 검색 API — "<이름> 로고", 포트폴리오형 레코드는 "<이름> <디자이너> brand identity"
//
// 결과: <out>/<slug>/<n>.<ext> + manifest.json. 채택은 apply-logo-candidates.mjs 에 "slug:n" 을 넘긴다.
// 자동 채택은 절대 하지 않는다 — 이름이 같은 다른 개체(인물·앨범·지명)가 흔하다.
//
// Usage: node scripts/collect-logo-candidates.mjs [--only slug,slug] [--naver] [--all] [--out scratchpad/logo-cands]
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const OUT = path.join(ROOT, opt("--out", "scratchpad/logo-cands"));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
const USE_NAVER = args.includes("--naver");
const ALL = args.includes("--all");   // 한글 표기 없는 브랜드도 포함
const CHROME = [
  `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`,
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`,
].find(p => fs.existsSync(p));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const BOT_UA = "BrandAtlasBot/1.0 (https://brandatlas.co.kr; logo archive; contact via site form)";

const isRealLogo = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");
const siteOf = (b) => String(b.facts?.officialWebsite || b.officialWebsite || "").trim();
const koName = (b) => /[가-힣]/.test(b.name) ? b.name : (b.nameKo || "");
const enName = (b) => String(b.nameEn || (!/[가-힣]/.test(b.name) ? b.name : "")).trim();
const designerOf = (b) => { const m = /사례입니다\.\s*(.+?)가 아이덴티티 작업의 디자이너/.exec(String(b.definition || "")); return m ? m[1].trim() : ""; };
let targets = data.allBrands.filter(b => !isRealLogo(b.logo) && (ALL || koName(b)));
if (ONLY) targets = targets.filter(b => ONLY.has(b.urlSlug || b.slug));
console.log(`대상 ${targets.length}건, chrome=${CHROME ? "ok" : "없음"}, naver=${USE_NAVER}`);

const attr = (tag, name) => { const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag); return m ? (m[2] ?? m[3] ?? m[4] ?? "") : ""; };
const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, "").replace(/\b(records?|recordings|label|inc|ltd|co|corp|corporation|company|the|gmbh|ag|sa|srl|llc|group)\b/g, "").replace(/[^a-z0-9가-힣]+/g, " ").trim();
// 제목 일치는 엄격하게: 정규화 후 완전 일치, 또는 "이름 (설명)" 꼴만. 부분 일치는 인물·장기·지명을 끌어온다.
const titleMatches = (title, names) => { const raw = String(title || "").replace(/^File:/, ""); const t = norm(raw); const base = norm(raw.replace(/\s*\(.*?\)\s*$/, "")); if (!t) return false; return names.some(n => { const x = norm(n); return x && (t === x || base === x); }); };
const JUNK_TITLE = /wiktionary|wikimedia|wikipedia|flag of|coat of arms of|^map of|^location/i;

// ── 위키미디어: 호스트 직렬화 + 봇 UA (아니면 429) ──────────────────────
const wikiQueue = { last: 0 };
async function wikiFetch(url) {
  const wait = wikiQueue.last + 350 - Date.now();
  wikiQueue.last = Date.now() + Math.max(0, wait);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": BOT_UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 3000 * (i + 1))); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { /* retry */ }
  }
  return null;
}
const LOGO_FILE = /logo|wordmark|emblem|symbol|\blabel\b|seal|crest|marque|mark|brand|\bci\b|\bbi\b|signet|record/i;
const JUNK_FILE = /flag_of|commons-logo|question_book|ambox|edit-ltr|symbol_category|wiki|icon_|star_|padlock|crystal|nuvola|disambig|ooui|red_pog|map|location|stub|magnify|speaker|sound|pd-icon|cc-|gnome|arrow|checkmark/i;

async function wikipediaCandidates(b) {
  const out = [];
  const names = [enName(b), koName(b), b.name].filter(Boolean);
  const langs = [["en", enName(b) || b.name], ...(koName(b) ? [["ko", koName(b)]] : [])];
  const seenTitles = new Set();
  for (const [lang, q] of langs) {
    const j = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=pageimages|pageprops|images&piprop=original&ppprop=wikibase_item&imlimit=40&format=json`);
    const pages = Object.values(j?.query?.pages || {}).sort((a, c) => (a.index || 9) - (c.index || 9));
    for (const p of pages) {
      if (!titleMatches(p.title, names) || seenTitles.has(p.title) || JUNK_TITLE.test(p.title)) continue;
      seenTitles.add(p.title);
      const qid = p.pageprops?.wikibase_item;
      if (p.original?.source) out.push({ url: p.original.source.split("?")[0], kind: `wiki-${lang}:${p.title}`, prio: 7 });
      const files = (p.images || []).map(i => i.title).filter(t => /\.(png|svg|jpe?g|gif|webp)$/i.test(t) && !JUNK_FILE.test(t) && !JUNK_TITLE.test(t));
      const logoFiles = files.filter(t => LOGO_FILE.test(t) || titleMatches(t.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""), names));
      for (const t of logoFiles.slice(0, 4)) {
        const ii = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800&format=json`);
        const info = Object.values(ii?.query?.pages || {})[0]?.imageinfo?.[0];
        if (info?.url) out.push({ url: info.thumburl || info.url, orig: info.url, kind: `wiki-${lang}-file:${t.replace(/^File:/, "")}`, prio: /logo|wordmark|emblem/i.test(t) ? 8 : 6 });
      }
      if (qid) out.push(...await wikidataCandidates(qid, p.title));
    }
  }
  // 문서가 없으면 Wikidata 검색으로 직접
  if (!seenTitles.size) {
    const ws = await wikiFetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(enName(b) || b.name)}&language=en&limit=4&format=json`);
    for (const e of (ws?.search || [])) {
      if (!titleMatches(e.label, names)) continue;
      if (/human|person|album|song|film|village|river|genus|species|surname|given name/i.test(e.description || "")) continue;
      out.push(...await wikidataCandidates(e.id, `${e.label} (${e.description || ""})`));
    }
  }
  return out;
}
async function wikidataCandidates(qid, label) {
  const out = [];
  const j = await wikiFetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&props=&format=json`);
  const claims = j?.claims || {};
  for (const [prop, prio] of [["P154", 9], ["P18", 5], ["P8972", 8]]) {   // P8972 small logo/icon
    for (const c of (claims[prop] || []).slice(0, 2)) {
      const file = c.mainsnak?.datavalue?.value;
      if (!file) continue;
      out.push({ url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`, orig: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`, kind: `wikidata-${prop}:${qid} ${label}`.slice(0, 80), prio });
    }
  }
  return out;
}

// ── 공식 사이트 렌더 ──────────────────────────────────────────────────
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
  for (const svg of header.match(/<svg\b[\s\S]*?<\/svg>/gi) || []) {
    if (svg.length < 300 || svg.length > 60000) continue;
    if (!/<path|<polygon|<rect|<circle/.test(svg)) continue;
    out.push({ inline: svg, kind: "header-svg", prio: 5 });
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi)) if (/logo/i.test(m[2])) push(abs(m[2]), "css-logo", 3);
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attr(tag, "rel").toLowerCase(); const href = abs(attr(tag, "href")); if (!href) continue;
    if (rel.includes("apple-touch-icon")) push(href, "apple-touch-icon", 2);
    else if (rel.includes("icon") && /\.(svg|png)(\?|$)/i.test(href)) push(href, "icon", 1);
  }
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const prop = (attr(tag, "property") || attr(tag, "name")).toLowerCase();
    if (prop === "og:image") push(abs(attr(tag, "content")), "og:image", 1);
  }
  return out.sort((a, b) => b.prio - a.prio).slice(0, 6);
}

async function fetchImage(url, referer) {
  try {
    const wiki = /wikimedia\.org|wikipedia\.org/.test(url);
    if (wiki) { const wait = wikiQueue.last + 350 - Date.now(); wikiQueue.last = Date.now() + Math.max(0, wait); if (wait > 0) await new Promise(r => setTimeout(r, wait)); }
    const res = await fetch(url, { headers: { "User-Agent": wiki ? BOT_UA : UA, Accept: "image/*,*/*;q=0.8", ...(referer ? { Referer: referer } : {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 300) return null;
    let ext = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[String(res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()];
    if (!ext) {
      if (buf[0] === 0x89 && buf[1] === 0x50) ext = "png"; else if (buf[0] === 0xff && buf[1] === 0xd8) ext = "jpg";
      else if (buf.subarray(0, 4).toString() === "RIFF") ext = "webp"; else if (buf.subarray(0, 3).toString() === "GIF") ext = "gif"; else if (/<svg[\s>]/i.test(buf.toString("utf8", 0, 3000))) ext = "svg";
      else return null;
    }
    if (ext === "svg" && !/<svg[\s>]/i.test(buf.toString("utf8", 0, 3000))) return null;
    return { buf, ext };
  } catch { return null; }
}

async function naverCandidates(queries) {
  const id = process.env.NCP_APIGW_KEY_ID, key = process.env.NCP_APIGW_KEY;
  if (!id || !key) return [];
  const out = [];
  for (const q of queries) {
    try {
      const res = await fetch(`https://naverapihub.apigw.ntruss.com/search/v1/image?${new URLSearchParams({ query: q, display: "8", sort: "sim" })}`, { headers: { "x-ncp-apigw-api-key-id": id, "x-ncp-apigw-api-key": key }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const j = await res.json();
      for (const it of j.items || []) {
        const w = Number(it.sizewidth || 0), h = Number(it.sizeheight || 0);
        if (w && h && (w < 120 || w / h > 5 || h / w > 3)) continue;
        if (/123rf|shutterstock|istock|gettyimages|dreamstime|alamy|vectorstock|freepik/.test(it.link)) continue;   // 스톡 이미지
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
  if (fs.existsSync(path.join(dir, ".done"))) { const prev = prevManifest.find(m => m.slug === slug); if (prev) { manifest.push(prev); return; } }
  let cands = [];
  try { cands.push(...await wikipediaCandidates(b)); } catch (e) { console.warn(`${slug}: wiki 실패 ${e.message}`); }
  if (/^https?:\/\//.test(site)) { const html = await renderedDom(site); cands.push(...domCandidates(html, site)); }
  if (USE_NAVER) {
    const designer = designerOf(b);
    const qs = [];
    if (designer) qs.push(`${enName(b) || b.name} ${designer} brand identity`);
    if (koName(b)) qs.push(`${koName(b)} 로고`);
    if (enName(b) && cands.length < 3) qs.push(`${enName(b)} logo`);
    if (qs.length) cands.push(...await naverCandidates(qs));
  }
  cands.sort((a, b) => b.prio - a.prio);
  const saved = [];
  let n = 0;
  for (const c of cands.slice(0, 12)) {
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
    saved.push({ n, file: path.relative(ROOT, file), kind: c.kind, url: c.orig || c.url });
  }
  manifest.push({ slug, name: b.name, site, candidates: saved });
  fs.writeFileSync(path.join(dir, ".done"), "");
  console.log(`${slug}: ${saved.length} 후보 (${saved.map(s => s.kind.split(":")[0]).join(",")})`);
}
const queue = [...targets];
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) { const b = queue.shift(); try { await one(b); } catch (e) { console.warn(`${b.urlSlug || b.slug}: 실패 ${e.message}`); } } }));
manifest.sort((a, b) => targets.findIndex(t => (t.urlSlug || t.slug) === a.slug) - targets.findIndex(t => (t.urlSlug || t.slug) === b.slug));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
const sheet = manifest.map(m => `<section style="margin:14px 0;padding:10px;border-top:2px solid #333"><h3 style="margin:0 0 6px;font:bold 15px sans-serif">${m.name} <small style="font-weight:400;color:#888">${m.slug} · ${m.site || "사이트 없음"}</small></h3>${m.candidates.map(c => `<figure style="display:inline-block;vertical-align:top;width:170px;margin:4px;text-align:center;font:11px sans-serif"><div style="height:110px;display:grid;place-items:center;border:1px solid #ddd;background:#f6f6f6"><img src="../../${c.file}" style="max-width:92%;max-height:92%"></div><figcaption><b>${m.slug}:${c.n}</b><br>${c.kind}</figcaption></figure>`).join("") || "<i>후보 없음</i>"}</section>`).join("");
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><body style="margin:12px">${sheet}</body>`);
console.log(`→ ${path.relative(ROOT, OUT)}/index.html (${manifest.length}건, 후보 있음 ${manifest.filter(m => m.candidates.length).length})`);
