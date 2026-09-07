// 공식 웹사이트에서 로고를 가져온다 — 로고가 없는 브랜드만, officialWebsite 가 있는 경우만.
//
// 공식 도메인에서 가져오므로 "다른 브랜드 로고를 붙이는" 오매칭 위험은 없다. 대신
// 로고가 아닌 이미지(히어로 사진·배너)를 로고로 오인할 위험이 있어 후보를 좁게 잡는다:
//   1. <link rel="apple-touch-icon"> (180px 내외 정사각 마크)
//   2. <img> 중 src/alt/class/id 에 "logo" 가 들어간 것 (svg 우선)
//   3. <link rel="icon"> 중 svg/png 이고 sizes >= 96
// og:image 는 쓰지 않는다 — 대부분 캠페인 사진이다.
//
// Usage: node scripts/fetch-official-logos.mjs [--dry] [--all]   (--all: 로고 있는 브랜드도 후보만 기록)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const REPORT = path.join(ROOT, "reports/official-logos.json");
const dry = process.argv.includes("--dry");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
// 손으로 확인한 공식 도메인(2026-09-07). 추측한 도메인은 넣지 않는다 — 다른 회사 로고가 붙는다.
// officialWebsite 가 비어 있을 때만 채운다.
const CURATED = {
  "caffe-bene": "https://www.caffebene.co.kr", "changbi-publishers": "https://www.changbi.com", "sisa-in": "https://www.sisain.co.kr",
  "tada": "https://tadatada.com", "hansalim": "https://www.hansalim.or.kr", "hollys-coffee": "https://www.hollys.co.kr",
  "noonnoppi": "https://www.noonnoppi.com", "milk-t": "https://www.milkt.co.kr", "wise-camp": "https://www.wisecamp.com",
  "tom-n-toms": "https://www.tomntoms.com", "theventi": "https://www.theventi.co.kr", "muhak-2": "https://www.muhak.co.kr",
  "chorokmaeul": "https://www.choroc.com", "alpha": "https://www.alpha.co.kr", "morning-glory": "https://www.morningglory.co.kr",
  "bullsone": "https://www.bullsone.com", "dong-kook-pharmaceutical": "https://www.dkpharm.co.kr", "apr": "https://www.apr-in.com",
  "hyungji": "https://www.hyungji.co.kr", "ably": "https://a-bly.com", "gangnam-unni": "https://www.gangnamunni.com",
  "wemakeprice": "https://front.wemakeprice.com", "iconix-entertainment": "https://www.iconix.co.kr", "kickgoing": "https://kickgoing.io",
  "hyundai-livart": "https://www.hyundailivart.co.kr", "casamia": "https://www.guud.com", "winia-dimchae": "https://www.winia.com",
  "oimu": "https://oimu-seoul.com", "fitpet": "https://fitpet.co.kr", "aboutpet": "https://www.aboutpet.co.kr",
  "kakao-friends": "https://www.kakaofriends.com", "pororo-park": "https://www.pororopark.com", "agabang-and-company": "https://www.agabang.co.kr",
  "boryung-medience": "https://www.medience.co.kr", "mega-md": "https://www.megamd.co.kr", "gs-xi": "https://www.xi.co.kr",
  "raemian": "https://www.raemian.co.kr", "oasis-market": "https://www.oasis.co.kr", "welcome-savings-bank": "https://www.welcomebank.co.kr",
  "korea-post-insurance": "https://www.epostbank.go.kr", "hyundai-card-dive": "https://dive.hyundaicard.com", "jeju-museum-of-art": "https://www.jeju.go.kr/jejumuseum/",
  "book-11st": "https://www.11st.co.kr", "inktec": "https://www.inktec.com", "coreana-cosmetics": "https://www.coreana.com",
  "charmzone": "https://www.charmzone.co.kr", "enprani": "https://www.enprani.com", "cj-wellcare": "https://www.cjwellcare.com",
  "daehan-flour-mills-gompyo": "https://www.dhflour.co.kr", "st-unitas": "https://www.stunitas.com", "gongsin-study-god": "https://www.gongsin.com",
  "gs-the-fresh": "https://www.gsthefresh.com", "social-solidarity-bank": "https://www.bss.or.kr",
};
for (const b of data.allBrands || []) {
  const slug = b.urlSlug || b.slug;
  if (CURATED[slug] && !b.officialWebsite && !(b.facts && b.facts.officialWebsite)) { b.officialWebsite = CURATED[slug]; b.officialWebsiteSource = "curated-2026-09"; }
}
const isRealLogo = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");
const siteOf = (b) => String(b.facts?.officialWebsite || b.officialWebsite || "").trim();
const targets = (data.allBrands || []).filter(b => !isRealLogo(b.logo) && /^https?:\/\//.test(siteOf(b)));
console.log(`대상 ${targets.length}건 (로고 없음 + 공식 사이트 있음)`);

const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const attr = (tag, name) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : "";
};

function candidates(html, base) {
  const out = [];
  const abs = (u) => { try { return new URL(u, base).href; } catch { return null; } };
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attr(tag, "rel").toLowerCase();
    const href = abs(attr(tag, "href"));
    if (!href) continue;
    if (rel.includes("apple-touch-icon")) out.push({ url: href, kind: "apple-touch-icon", prio: 2 });
    else if (rel.includes("icon")) {
      const sizes = Number((attr(tag, "sizes").match(/(\d+)/) || [])[1] || 0);
      if (/\.svg(\?|$)/i.test(href)) out.push({ url: href, kind: "icon-svg", prio: 3 });
      else if (sizes >= 96) out.push({ url: href, kind: `icon-${sizes}`, prio: 1 });
      else if (/\.png(\?|$)/i.test(href)) out.push({ url: href, kind: "icon-png", prio: 0 });   // 크기는 내려받아 확인한다
    }
  }
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const prop = (attr(tag, "property") || attr(tag, "name")).toLowerCase();
    if (prop !== "og:image" && prop !== "twitter:image") continue;
    const u = abs(attr(tag, "content"));
    if (u && /logo|symbol|\bci\b|\bbi\b/i.test(new URL(u).pathname)) out.push({ url: u, kind: `${prop}-logo`, prio: 3 });
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = attr(tag, "src") || attr(tag, "data-src") || attr(tag, "data-original") || (attr(tag, "srcset") || "").split(",")[0].trim().split(/\s+/)[0];
    const meta = `${src} ${attr(tag, "alt")} ${attr(tag, "class")} ${attr(tag, "id")}`.toLowerCase();
    if (!src || !/logo/.test(meta) || /sprite|partner|payment|app-?store|google-?play|footer-?logo-?(fb|ig)/.test(meta)) continue;
    const u = abs(src);
    if (!u || /^data:/.test(u)) continue;
    out.push({ url: u, kind: "img-logo", prio: /\.svg(\?|$)/i.test(u) ? 5 : 4 });
  }
  return out.sort((a, b) => b.prio - a.prio);
}

async function get(url, asText) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: asText ? "text/html" : "image/*" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return asText ? { text: await res.text(), url: res.url } : { buf: Buffer.from(await res.arrayBuffer()), ct: String(res.headers.get("content-type") || "").split(";")[0].toLowerCase() };
}

function pngSize(buf) { return buf.length > 24 && buf.readUInt32BE(16) ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : null; }
function jpgSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

const report = { generatedAt: new Date().toISOString(), targets: targets.length, added: [], failed: [] };
for (const b of targets) {
  const slug = b.urlSlug || b.slug;
  const site = siteOf(b);
  try {
    const page = await get(site, true);
    const cands = candidates(page.text, page.url);
    let chosen = null;
    for (const c of cands.slice(0, 6)) {
      try {
        const img = await get(c.url, false);
        let ext = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" }[img.ct];
        if (!ext) continue;
        if (ext === "ico") continue;
        if (ext === "svg" && !/<svg[\s>]/i.test(img.buf.toString("utf8", 0, 4000))) continue;
        if (ext === "png") { const s = pngSize(img.buf); if (!s || s[0] < (c.kind === "icon-png" ? 96 : 64) || s[1] < 32) continue; }
        if (ext === "jpg") { const s = jpgSize(img.buf); if (!s || s[0] < 64 || s[1] < 32) continue; }
        if (img.buf.length < 300) continue;
        chosen = { ...c, ext, buf: img.buf };
        break;
      } catch { /* 다음 후보 */ }
    }
    if (!chosen) { report.failed.push({ slug, site, reason: cands.length ? "후보 이미지 검증 실패" : "후보 없음" }); continue; }
    const rel = `images/logos/${slug}-site-${hash(chosen.url)}.${chosen.ext}`;
    if (!dry) fs.writeFileSync(path.join(ROOT, rel), chosen.buf);
    b.logo = rel;
    b.logoSourceTier = "official-site";
    b.logoSource = chosen.url;
    report.added.push({ slug, name: b.name, kind: chosen.kind, url: chosen.url, file: rel });
    console.log(`  + ${b.name} ← ${chosen.kind}`);
  } catch (e) {
    report.failed.push({ slug, site, reason: e.message });
  }
}

const byId = new Map((data.allBrands || []).map(b => [String(b.id), b]));
for (const m of data.brands || []) {
  const src = byId.get(String(m.id));
  if (src && src.logo && !isRealLogo(m.logo)) m.logo = src.logo;
}
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
if (!dry) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
console.log(`로고 추가 ${report.added.length} / 실패 ${report.failed.length} → reports/official-logos.json`);
