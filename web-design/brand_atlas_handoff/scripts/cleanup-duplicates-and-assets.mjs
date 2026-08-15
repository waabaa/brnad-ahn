// Phase E 마무리 — 남은 두 가지 지저분함을 정리한다.
//
// 1) 중복 브랜드 레코드 제거
//    같은 브랜드가 두 레코드로 들어와 slug 이전 때 신 slug가 충돌해 구 slug로 남은
//    건들이다(brand-679/mardi-mercredi, brandarchive-lotteria/lotteria,
//    brandarchive-wallmart-2025/walmart). 이미 noindex + canonical 통합 상태라
//    검색 자산이 없고, 정본이 본문·로고를 모두 갖고 있어 손실 없이 지울 수 있다.
//    데이터에서 빼면 링크·sitemap·카테고리·관련브랜드가 한꺼번에 정리되고,
//    구 URL은 301로 정본에 넘긴다.
//
// 2) 로고 파일명 정리
//    `images/logos/brand-440.png`처럼 파일명이 옛 번호 slug로 남아 있다. 로고·BI/CI가
//    이 사이트의 핵심 콘텐츠이고 이미지 검색 유입("캐딜락 bi", "nhn산스")이 실제로
//    잡히므로 파일명도 브랜드와 연관되게 바꾼다. 구 경로는 301 map에 함께 넣는다.
//
// Usage:
//   node scripts/cleanup-duplicates-and-assets.mjs --dry-run
//   node scripts/cleanup-duplicates-and-assets.mjs --apply
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { urlSlugOf } from "./lib/brand-seo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "../..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const MAP_PATH = path.join(REPO, "deploy", "brandatlas-redirects.map");
const apply = process.argv.includes("--apply");

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const BRANDS = DATA.allBrands || [];
const bySlug = new Map(BRANDS.map(b => [urlSlugOf(b), b]));

const bodyLen = (b) => Object.values(b.sections || {})
  .reduce((n, v) => n + String(v?.body || "").length, 0);
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
// 같은 브랜드라도 한 레코드는 한글명("롯데리아"), 다른 레코드는 원어명("Lotteria")을
// name에 담고 있다. 두 표기를 모두 키로 잡아야 짝이 맞는다.
const nameKeys = (b) => [...new Set([norm(b.name), norm(b.nameEn)].filter(k => k.length >= 2))];

// ── 1) 중복 레코드 식별 ────────────────────────────────────────────────────
// 정규화한 브랜드명이 같고, 한쪽 slug가 아직 번호/아카이브 형태인 쌍만 다룬다.
// 이름이 같아도 서로 다른 브랜드일 수 있으므로 자동 판단을 넓히지 않는다.
const legacy = (s) => /^brand-\d+$/.test(s) || /^brandarchive-/.test(s);
const groups = new Map();
for (const b of BRANDS) {
  for (const k of nameKeys(b)) {
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }
}
const dupes = [];
const claimed = new Set();
for (const [, g] of groups) {
  const uniq = [...new Set(g)];
  if (uniq.length < 2) continue;
  const primary = uniq.reduce((a, b) => (bodyLen(b) >= bodyLen(a) ? b : a));
  for (const b of uniq) {
    if (b === primary) continue;
    if (!legacy(urlSlugOf(b))) continue;   // 정상 slug를 가진 쪽은 건드리지 않는다
    if (claimed.has(b.id)) continue;       // 두 키로 두 번 잡히는 것을 막는다
    claimed.add(b.id);
    dupes.push({ from: urlSlugOf(b), to: urlSlugOf(primary), name: b.name, id: b.id });
  }
}

// ── 2) 로고/이미지 파일명 정리 대상 ─────────────────────────────────────────
const assetMoves = [];
const assetSeen = new Set();
for (const b of BRANDS) {
  const slug = urlSlugOf(b);
  if (legacy(slug)) continue;                     // 아직 정리 안 된 브랜드는 건너뛴다
  for (const field of ["logo", "image"]) {
    const p = b[field];
    if (typeof p !== "string" || !/^images\//.test(p)) continue;
    const base = path.basename(p);
    if (!/^(brand-\d+|brandarchive-)/.test(base)) continue;
    const ext = path.extname(base);
    const dir = path.dirname(p);
    let want = `${dir}/${slug}${ext}`;
    if (want === p) continue;
    // 같은 목적지가 이미 잡혀 있으면(로고와 대표이미지가 같은 파일 등) 재사용한다.
    if (assetSeen.has(want) && !assetMoves.some(m => m.from === p && m.to === want)) {
      // 다른 브랜드가 이미 그 이름을 쓰면 접미사를 붙여 충돌을 피한다.
      if (fs.existsSync(path.join(ROOT, want))) want = `${dir}/${slug}-${field}${ext}`;
    }
    assetSeen.add(want);
    assetMoves.push({ from: p, to: want, field, slug });
  }
}
// 동일 (from→to) 중복 제거
const uniqMoves = [];
const moveKey = new Set();
for (const m of assetMoves) {
  const k = `${m.from}→${m.to}`;
  if (moveKey.has(k)) continue;
  moveKey.add(k);
  uniqMoves.push(m);
}

console.log(`중복 레코드 ${dupes.length}건, 자산 파일명 ${uniqMoves.length}건`);
for (const d of dupes) console.log(`  중복: ${d.from} → ${d.to} (${d.name})`);
for (const m of uniqMoves.slice(0, 8)) console.log(`  자산: ${m.from} → ${m.to}`);
if (uniqMoves.length > 8) console.log(`  ... 외 ${uniqMoves.length - 8}건`);

if (!apply) {
  console.log("\n--dry-run: 변경 없음. 적용하려면 --apply");
  process.exit(0);
}

// ── 적용 1: 자산 파일 이동 + 데이터 경로 갱신 ───────────────────────────────
let moved = 0, missing = 0;
const pathRewrite = new Map(uniqMoves.map(m => [m.from, m.to]));
for (const m of uniqMoves) {
  const src = path.join(ROOT, m.from);
  const dst = path.join(ROOT, m.to);
  if (!fs.existsSync(src)) { missing++; continue; }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.renameSync(src, dst);
  moved++;
}
// 데이터 안의 모든 경로 문자열을 새 경로로 바꾼다(logo/image/logoHistory.src).
let rewritten = 0;
const rewrite = (o) => {
  if (Array.isArray(o)) return o.forEach(rewrite);
  if (!o || typeof o !== "object") return;
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && pathRewrite.has(v)) { o[k] = pathRewrite.get(v); rewritten++; }
    else if (v && typeof v === "object") rewrite(v);
  }
};
rewrite(DATA);
console.log(`자산 이동 ${moved}건(원본 없음 ${missing}건), 데이터 경로 ${rewritten}건 갱신`);

// ── 적용 2: 중복 레코드 제거 ────────────────────────────────────────────────
const dupIds = new Set(dupes.map(d => String(d.id)));
const dupSlugs = new Set(dupes.map(d => d.from));
let removedRecords = 0;
for (const key of Object.keys(DATA)) {
  const v = DATA[key];
  if (!Array.isArray(v)) continue;
  const before = v.length;
  DATA[key] = v.filter(o => !(o && typeof o === "object" && (dupIds.has(String(o.id)) || dupSlugs.has(o.urlSlug) || dupSlugs.has(o.slug))));
  removedRecords += before - DATA[key].length;
}
// 관련 브랜드 id 참조에서도 뺀다(끊긴 참조 방지).
for (const b of DATA.allBrands || []) {
  if (Array.isArray(b.relatedBrandIds300)) {
    b.relatedBrandIds300 = b.relatedBrandIds300.filter(id => !dupIds.has(String(id)));
  }
}
console.log(`중복 레코드 제거: ${removedRecords}건 (allBrands ${DATA.allBrands.length}건 남음)`);

// 구 HTML 파일 삭제
let removedHtml = 0;
for (const d of dupes) {
  const f = path.join(ROOT, "brand", `${d.from}.html`);
  if (fs.existsSync(f)) { fs.unlinkSync(f); removedHtml++; }
}
console.log(`중복 HTML 삭제: ${removedHtml}건`);

fs.writeFileSync(DATA_PATH, JSON.stringify(DATA));

// ── 적용 3: 301 map에 추가 ──────────────────────────────────────────────────
const existing = fs.existsSync(MAP_PATH) ? fs.readFileSync(MAP_PATH, "utf8") : "";
const lines = new Set(existing.split("\n").filter(l => l.startsWith("/")));
for (const d of dupes) lines.add(`/brand/${d.from}.html /brand/${d.to}.html;`);
for (const m of uniqMoves) lines.add(`/${m.from} /${m.to};`);
const sorted = [...lines].sort();
fs.writeFileSync(MAP_PATH,
  `# brand-atlas Phase E 301 map (migrate-slugs.mjs + cleanup-duplicates-and-assets.mjs)\n` +
  `# 총 ${sorted.length}건.\n${sorted.join("\n")}\n`);
console.log(`301 map: ${sorted.length}건`);

// ── 기록 ────────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(ROOT, "reports", "cleanup-duplicates-assets.json"),
  JSON.stringify({ duplicates: dupes, assets: uniqMoves }, null, 1));
console.log("reports/cleanup-duplicates-assets.json 기록");
console.log("\n다음: build-brand-pages.mjs → build-seo-extras.mjs → 배포 → apply-redirects.sh");
