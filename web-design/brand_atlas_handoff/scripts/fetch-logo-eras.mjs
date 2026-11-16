// 로고 변천(brand.logoEras) — 시기가 확인되는 옛 로고만 모아 연대순으로 싣는다.
// 종전 logoHistory는 같은 현행 마크의 사본(색 반전·해상도 차이)이 '보관 이미지 N'으로 여러 장 붙어 있어
// 변천을 보여 주지 못했다. 여기서는 시기 근거가 있는 로고만 쓴다.
//
// 근거(QID가 확정된 브랜드만 — 이름 매칭 없음, §2)
//   ① Wikidata P154(로고) 값의 P580(시작)·P582(종료) 한정자
//   ② 커먼즈 분류(P373)의 로고 하위 분류("X logos", "Historical logos of X" 등)에서
//      파일명에 연도 범위가 있는 파일("Pepsi logo (1950-1962).svg", "Nike 1971.png")
// 같은 그림은 지각 해시(dHash)로 하나로 합친다(연도만 다른 사본 제거). 시기가 서로 다른 로고가 2장 이상일 때만 싣는다.
// 파일은 커먼즈 PNG 렌더(가로 600px)로 내려받는다 — SVG도 고해상도 래스터가 된다.
//
// 원장 reports/logo-eras.json. 수집 후 육안 검수해 뺀 파일은 data/logo-eras-exclude.json(검수 시트로 고른 뒤 webp로 변환해 싣는다). Usage: node scripts/fetch-logo-eras.mjs [--limit N] [--no-apply] [--apply-only]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data/brand-atlas.json");
const LEDGER = path.join(ROOT, "reports/logo-eras.json");
const OUT = path.join(ROOT, "images/logo-eras");
const UA = "brandatlas-bot/1.0 (https://brandatlas.co.kr)";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg("--limit", Infinity));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);
const NOW_Y = new Date().getFullYear();

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : { brands: {} };
const save = () => fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
// 육안 검수에서 뺀 파일(제품·자회사 로고, 차량·간판 사진 등) — 다시 돌려도 받지 않는다.
const EXCLUDE = new Set((() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data/logo-eras-exclude.json"), "utf8")); } catch { return []; } })());
const qidOf = (b) => (b.entityLinks && /^Q\d+$/.test(b.entityLinks.wikidata || "") ? b.entityLinks.wikidata : null);

async function getJson(url) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) });
      if (r.status === 429) { await sleep(8000 * a); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (a === 4) throw e; await sleep(2500 * a); }
  }
  return null;
}
const commons = (p) => getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...p })}`);
const yOf = (t) => { const m = /^[+-]?(\d{4})/.exec(String(t || "")); return m ? +m[1] : null; };

/** 파일명에서 연도 범위. "(1950-1962)", "1971–1978", "since 2011", "2011-present", 단일 연도. */
function yearsFromName(name) {
  const s = name.replace(/\.[a-z]+$/i, "");
  let m = /(?<!\d)(1[89]\d{2}|20[0-2]\d)\s*[-–—~]\s*(1[89]\d{2}|20[0-2]\d|present|today|now)(?!\d)/i.exec(s);
  if (m) return { from: +m[1], to: /^\d/.test(m[2]) ? +m[2] : null };
  m = /(?<!\d)(1[89]\d{2}|20[0-2]\d)(?!\d)/g;
  const ys = [...s.matchAll(m)].map(x => +x[1]);
  if (ys.length === 1) return { from: ys[0], to: null };
  return null;
}

async function fileInfo(files) {
  const out = {};
  for (let i = 0; i < files.length; i += 40) {
    const j = await commons({ action: "query", titles: files.slice(i, i + 40).map(f => `File:${f}`).join("|"), prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "600", iiextmetadatafilter: "LicenseShortName" });
    for (const p of j?.query?.pages || []) { const ii = p.imageinfo?.[0]; if (ii) out[p.title.replace(/^File:/, "")] = ii; }
    await sleep(500);
  }
  return out;
}

// dHash(9x8 회색) — ffmpeg로 줄여 픽셀을 읽는다(외부 의존성 없음).
function dhash(file) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "format=rgba,geq=r='255-(255-r(X,Y))*alpha(X,Y)/255':g='255-(255-g(X,Y))*alpha(X,Y)/255':b='255-(255-b(X,Y))*alpha(X,Y)/255',format=gray,scale=9:8:flags=area", "-f", "rawvideo", "-"]);
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += buf[y * 9 + x] > buf[y * 9 + x + 1] ? "1" : "0";
  return bits;
}
const normName = (x) => String(x || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const ham = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };

async function download(slug, file, ii) {
  const h = crypto.createHash("sha1").update(file).digest("hex").slice(0, 8);
  const rel = `images/logo-eras/${slug}-${h}.png`;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    const r = await fetch(ii.thumburl || ii.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const tmp = abs + ".src";
    fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    try { execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-vf", "scale='min(600,iw)':-2", abs]); } finally { fs.rmSync(tmp, { force: true }); }
  }
  return rel;
}

// QID가 없는 브랜드 — 탄생일 판정에서 그 브랜드의 연도와 맞아 채택된 위키백과 문서(enrich-founding-dates.mjs ②-b)가 있으면
// 그 문서의 위키데이터 개체를 로고 변천 조회에만 쓴다(sameAs에는 쓰지 않는다). 결과는 싣기 전에 육안 검수한다.
const titleQid = new Map();
{
  const fc = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "reports/founding-cache.json"), "utf8")); } catch { return {}; } })();
  const want = { ko: new Map(), en: new Map() };
  for (const b of data.allBrands) {
    if (qidOf(b) || !b.founded) continue;
    const c = fc[b.slug]; if (!c || !c.byTitle) continue;
    const hit = (c.ib || []).find(x => b.founded.sources.includes(x.source) && x.title);
    if (hit) want[hit.source.slice(0, 2)].set(hit.title, b.slug);
  }
  for (const lang of ["ko", "en"]) {
    const titles = [...want[lang].keys()];
    for (let i = 0; i < titles.length; i += 50) {
      const j = await getJson(`https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ action: "query", prop: "pageprops", ppprop: "wikibase_item", redirects: "1", format: "json", formatversion: "2", titles: titles.slice(i, i + 50).join("|") })}`).catch(() => null);
      const back = new Map(titles.map(t => [t, t]));
      for (const r of [...(j?.query?.normalized || []), ...(j?.query?.redirects || [])]) back.set(r.to, back.get(r.from) || r.from);
      for (const p of j?.query?.pages || []) { const q = p.pageprops?.wikibase_item; const orig = back.get(p.title) || p.title; if (q && want[lang].has(orig)) titleQid.set(want[lang].get(orig), q); }
      await sleep(400);
    }
  }
  console.log(`제목 문서로 찾은 개체 ${titleQid.size}곳`);
}
const qidAny = (b) => qidOf(b) || titleQid.get(b.slug) || null;

if (!process.argv.includes("--apply-only")) {
  fs.mkdirSync(OUT, { recursive: true });
  const targets = data.allBrands.filter(b => qidAny(b) && !ledger.brands[b.slug]).slice(0, LIMIT);
  console.log(`대상 ${targets.length}곳`);
  const ents = {};
  for (let i = 0; i < targets.length; i += 50) {
    const j = await getJson(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: targets.slice(i, i + 50).map(qidAny).join("|"), props: "claims", format: "json" })}`).catch(() => null);
    Object.assign(ents, j?.entities || {});
    await sleep(400);
  }
  let n = 0, got = 0;
  for (const b of targets) {
    const e = ents[qidAny(b)];
    const cands = [];
    try {
      for (const c of e?.claims?.P154 || []) {
        const f = c.mainsnak?.datavalue?.value; if (!f || c.rank === "deprecated") continue;
        const from = yOf(c.qualifiers?.P580?.[0]?.datavalue?.value?.time), to = yOf(c.qualifiers?.P582?.[0]?.datavalue?.value?.time);
        if (from || to) cands.push({ file: f, from, to, via: "wikidata" });
        else cands.push({ file: f, from: null, to: null, via: "wikidata", current: c.rank === "preferred" });
      }
      const cat = e?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
      const keys = [...new Set([b.nameEn, b.name, String(cat || "").replace(/\s*\(.*\)\s*$/, "")].map(normName).filter(k => k.length >= 3))];
      if (cat) {
        const s = await commons({ action: "query", list: "categorymembers", cmtitle: `Category:${cat}`, cmtype: "subcat", cmlimit: "80" });
        const logoCats = (s?.query?.categorymembers || []).map(x => x.title.replace(/^Category:/, "")).filter(t => /logo/i.test(t) && !/sport|team|club|racing|f1|football|fc\b/i.test(t)).slice(0, 3);
        for (const lc of logoCats) {
          await sleep(500);
          const f = await commons({ action: "query", list: "categorymembers", cmtitle: `Category:${lc}`, cmtype: "file", cmlimit: "100" });
          for (const x of f?.query?.categorymembers || []) {
            const name = x.title.replace(/^File:/, "");
            const yr = yearsFromName(name);
            // 로고 파일만(파일명에 logo·wordmark·emblem), 그 브랜드 이름이 들어 있는 것만 — 자회사·제품 로고와 행사 사진을 거른다.
            if (yr && /\.(svg|png|jpe?g)$/i.test(name) && /logo|wordmark|logotype|emblem|로고/i.test(name) && keys.some(k => normName(name).includes(k))
              && !/sign|store|building|truck|uniform|shirt|kit|sponsor|bottle|photo|\bcrop\b/i.test(name)) cands.push({ file: name, ...yr, via: "commons" });
          }
        }
      }
      const dated = cands.filter(c => c.from || c.to);
      if (new Set(dated.map(c => c.from ?? c.to)).size < 2) { ledger.brands[b.slug] = { at: today, eras: [], why: `시기 있는 로고 ${dated.length}장` }; if (++n % 50 === 0) save(); continue; }
      const info = await fileInfo([...new Set(dated.map(c => c.file))]);
      const eras = [];
      for (const c of dated.sort((x, y) => (x.from ?? x.to) - (y.from ?? y.to))) {
        const ii = info[c.file]; if (!ii || (ii.width || 0) < 120 || EXCLUDE.has(c.file)) continue;
        // 이미 실은 시기 안에 들어가는 파일은 같은 시기의 변형(색·그림자·제품 로고)이다.
        if (c.from && c.to && eras.some(x => x.from && x.to && x.from <= c.from && c.to <= x.to && !(x.from === c.from && x.to === c.to))) continue;
        if (c.from && c.to && eras.some(x => x.from === c.from && x.to === c.to)) continue;
        try {
          const src = await download(b.slug, c.file, ii);
          const hash = dhash(path.join(ROOT, src));
          const dup = eras.find(x => ham(x.hash, hash) <= 6);
          if (dup) { // 같은 그림 — 시기만 넓힌다
            if (c.to && (!dup.to || c.to > dup.to)) dup.to = c.to;
            continue;
          }
          eras.push({ src, from: c.from, to: c.to, file: c.file, via: c.via, license: String(ii.extmetadata?.LicenseShortName?.value || "").replace(/<[^>]+>/g, "").trim(), url: ii.descriptionurl || "", hash });
          await sleep(900);
        } catch { /* 개별 파일 실패는 건너뛴다 */ }
      }
      // 끝 연도가 없으면 다음 로고의 시작 연도 앞까지로 본다(마지막은 '현재').
      for (let i = 0; i < eras.length - 1; i++) if (!eras[i].to && eras[i + 1].from) eras[i].to = eras[i + 1].from;
      ledger.brands[b.slug] = { at: today, eras: eras.length >= 2 ? eras : [], why: eras.length >= 2 ? undefined : "중복 제거 후 1장 이하" };
      if (eras.length >= 2) got++;
    } catch (err) { ledger.brands[b.slug] = { at: today, eras: [], why: String(err.message || err).slice(0, 80), retry: true }; }
    if (++n % 50 === 0) { save(); console.log(`  ${n}/${targets.length} · 변천 확보 ${got}곳`); }
  }
  for (const [k, v] of Object.entries(ledger.brands)) if (v.retry) delete ledger.brands[k];
  save();
}

if (process.argv.includes("--no-apply")) process.exit(0);
let cnt = 0;
for (const b of data.allBrands) {
  const e = ledger.brands[b.slug];
  const eras = (e?.eras || []).filter(x => fs.existsSync(path.join(ROOT, x.src)));
  if (eras.length >= 2) { b.logoEras = eras.map(({ hash, ...x }) => x); cnt++; } else delete b.logoEras;
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
console.log(`반영: 로고 변천 ${cnt}곳`);
