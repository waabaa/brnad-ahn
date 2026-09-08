// 육안 검수로 고른 로고 후보를 데이터에 채택한다.
//
// collect-logo-candidates.mjs 가 만든 scratchpad/logo-cands/manifest.json 의 후보 중
// "slug:n" 으로 지정한 것만 images/logos/ 로 옮기고 brand.logo 를 채운다. 자동 채택은 없다.
//
// Usage: node scripts/apply-logo-candidates.mjs gucci:2 nike:1 ...
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const mfArg = process.argv.indexOf("--manifest");
const MF = mfArg > -1 ? process.argv[mfArg + 1] : "scratchpad/logo-cands/manifest.json";
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MF), "utf8"));
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const picks = process.argv.slice(2).filter(a => /^[^-].*:\d+$/.test(a)).map(s => s.split(":")).filter(x => x.length === 2);
if (!picks.length) { console.error("채택 목록이 없습니다: slug:n ..."); process.exit(1); }

const bySlug = new Map(data.allBrands.map(b => [b.urlSlug || b.slug, b]));
const report = [];
for (const [slug, n] of picks) {
  const m = manifest.find(x => x.slug === slug);
  const c = m && m.candidates.find(x => String(x.n) === String(n));
  const b = bySlug.get(slug);
  if (!m || !c || !b) { console.warn(`건너뜀 ${slug}:${n} — 후보 또는 브랜드 없음`); continue; }
  const ext = path.extname(c.file).slice(1);
  const rel = `images/logos/${slug}-cand-${n}.${ext}`;
  fs.copyFileSync(path.join(ROOT, c.file), path.join(ROOT, rel));
  b.logo = rel;
  b.logoSourceTier = "visual-review-2026-09";
  b.logoSource = c.url;
  delete b.logoRejected;
  if (Array.isArray(b.logoHistory) && !b.logoHistory.some(h => h.src === rel)) b.logoHistory.unshift({ src: rel, label: "대표 로고", note: "현재 사용 중인 마크" });
  report.push({ slug, name: b.name, file: rel, from: c.kind, url: c.url });
}
const byId = new Map(data.allBrands.map(b => [String(b.id), b]));
for (const mag of data.brands || []) { const s = byId.get(String(mag.id)); if (s) { mag.logo = s.logo; mag.logoHistory = s.logoHistory; } }
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
const prev = fs.existsSync(path.join(ROOT, "reports/visual-logo-picks.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "reports/visual-logo-picks.json"), "utf8")) : [];
fs.writeFileSync(path.join(ROOT, "reports/visual-logo-picks.json"), JSON.stringify([...prev, ...report.map(r => ({ ...r, at: new Date().toISOString().slice(0, 10) }))], null, 1));
console.log(`채택 ${report.length}건: ${report.map(r => r.name).join(", ")}`);
