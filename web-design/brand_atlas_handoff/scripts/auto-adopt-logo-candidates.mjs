// collect-logo-candidates.mjs 결과 중, 이미 P856(공식 웹사이트) 완전 일치로 개체가 확정된
// (`brand.entityLinks.wikidata` — enrich-wikidata-entity-links.mjs) 브랜드에 한해 그 QID에서
// 나온 wikidata-P154/P8972(공식 로고) 후보만 육안 검수 없이 자동 채택한다. 2026-09-14 사용자 승인.
//
// 처음에는 "wiki/wikidata 출처 전체"를 고신뢰로 두려 했으나 --dry-run 미리보기에서 다수가
// 동음이의 오매칭이었다(brain→인체 뇌 문서, conglomerate→일반 그림 아이콘, ouch→Wrigley 로고 등) —
// 문서 제목 정규화 일치만으로는 사전 단어·짧은 이름 브랜드(특히 레코드 레이블)를 걸러내지 못한다.
// entityLinks.wikidata는 공식 사이트 URL이 P856과 완전히 일치해야만 채워지므로(같은 개체 확정),
// 이 조건을 통과한 QID의 로고만 안전하다고 판단해 기준을 좁혔다.
//
// 그 외 wiki-en/ko(제목 일치만으로 확정된 것), 사이트 DOM 휴리스틱, 네이버 이미지 검색 결과는
// 여전히 사람 검수 필요 — apply-logo-candidates.mjs 로 slug:n 지정해 채택.
//
// Usage: node scripts/auto-adopt-logo-candidates.mjs [--manifest scratchpad/logo-cands-0914/manifest.json] [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const MF = opt("--manifest", "scratchpad/logo-cands-0914/manifest.json");
const DRY = args.includes("--dry-run");

const QID_KIND = /^wikidata-(P154|P8972):(Q\d+)/;

const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MF), "utf8"));
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const bySlug = new Map(data.allBrands.map(b => [b.urlSlug || b.slug, b]));
const isRealLogo = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");

const report = [];
for (const m of manifest) {
  const b = bySlug.get(m.slug);
  if (!b || isRealLogo(b.logo)) continue;
  const best = m.candidates.find(c => { const qm = QID_KIND.exec(c.kind); return qm && b.entityLinks?.wikidata === qm[2]; });
  if (!best) continue;
  const srcFile = path.join(ROOT, best.file);
  if (!fs.existsSync(srcFile)) continue;
  const ext = path.extname(best.file).slice(1);
  const rel = `images/logos/${m.slug}-auto-${best.n}.${ext}`;
  if (!DRY) fs.copyFileSync(srcFile, path.join(ROOT, rel));
  if (!DRY) {
    b.logo = rel;
    b.logoSourceTier = "auto-wiki-2026-09";
    b.logoSource = best.url;
    delete b.logoRejected;
    if (Array.isArray(b.logoHistory) && !b.logoHistory.some(h => h.src === rel)) b.logoHistory.unshift({ src: rel, label: "대표 로고", note: "현재 사용 중인 마크" });
  }
  report.push({ slug: m.slug, name: m.name, file: rel, from: best.kind, url: best.url });
}

if (!DRY) {
  const byId = new Map(data.allBrands.map(b => [String(b.id), b]));
  for (const mag of data.brands || []) { const s = byId.get(String(mag.id)); if (s) { mag.logo = s.logo; mag.logoHistory = s.logoHistory; } }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  const prevPath = path.join(ROOT, "reports/visual-logo-picks.json");
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, "utf8")) : [];
  fs.writeFileSync(prevPath, JSON.stringify([...prev, ...report.map(r => ({ ...r, at: new Date().toISOString().slice(0, 10), auto: true }))], null, 1));
}
console.log(`${DRY ? "[dry-run] " : ""}자동 채택 ${report.length}건`);
for (const r of report.slice(0, 20)) console.log(`  ${r.slug}: ${r.from}`);
if (report.length > 20) console.log(`  ... 외 ${report.length - 20}건`);
