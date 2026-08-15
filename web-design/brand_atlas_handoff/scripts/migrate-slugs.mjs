// Phase E: 의미 없는 URL slug를 브랜드명 기반 slug로 이전한다.
//
// 대상은 `brand-<번호>`(79건), `brandarchive-<...>`(444건), 그리고 ASCII가 아닌
// 문자가 섞인 slug다. URL에 브랜드명이 들어가면 검색엔진과 사람 모두에게 주제가
// 드러나고, `brandarchive-sarah-&-sebastian.html` 같은 파일명의 인코딩 문제도 사라진다.
//
// 안전장치
//  - 기존 slug 또는 다른 신규 slug와 충돌하면 이전하지 않는다(구 slug 유지).
//  - 영문/원어 표기가 없으면 이전하지 않는다(한글 slug는 URL 인코딩되어 더 나쁘다).
//  - 구 URL 전건에 대해 nginx 301 map을 생성한다. 리다이렉트 없이 URL만 바꾸면
//    이미 색인된 페이지의 검색 자산이 사라진다.
//
// Usage:
//   node scripts/migrate-slugs.mjs --dry-run   # 계획만 출력
//   node scripts/migrate-slugs.mjs --apply     # data JSON의 urlSlug 갱신 + map 생성
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { latinName, koreanName, romanizeKorean, urlSlugOf, ORIGIN } from "./lib/brand-seo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "../..");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const apply = process.argv.includes("--apply");

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const BRANDS = DATA.allBrands || [];

// --sync-only: 이전은 하지 않고, allBrands의 urlSlug를 데이터 안의 다른 사본에만
// 전파한다. 이미 이전을 마친 뒤 전파 누락을 보정할 때 쓴다. 이 경로에서는 301 map을
// 다시 쓰지 않는다 — plan이 비어 있어 덮어쓰면 리다이렉트가 통째로 사라진다.
if (process.argv.includes("--sync-only")) {
  const bySlug = new Map();
  for (const b of BRANDS) if (b.urlSlug) bySlug.set(b.slug, b.urlSlug);
  let n = 0;
  for (const key of Object.keys(DATA)) {
    if (key === "allBrands") continue;
    const v = DATA[key];
    const items = Array.isArray(v) ? v : (v && typeof v === "object" ? [v] : []);
    for (const o of items) {
      if (!o || typeof o !== "object" || !o.slug) continue;
      const want = bySlug.get(o.slug);
      if (want && o.urlSlug !== want) { o.urlSlug = want; n++; }
    }
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(DATA));
  console.log(`urlSlug 사본 전파: ${n}건 (map/HTML 변경 없음)`);
  process.exit(0);
}

const slugify = (s) => String(s || "")
  .toLowerCase()
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")   // 발음 구별 부호 제거 (Nestlé → nestle)
  .replace(/&/g, " and ")
  // 단어 안에 낀 구두점은 없애고 붙인다("아베;뉴" → abenyu, "Care.com" → carecom).
  // 하이픈으로 바꾸면 발음에 없는 경계가 생겨 브랜드명과 멀어진다.
  .replace(/[;:'’".]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

/** 이전 대상 여부 — 번호 slug, brandarchive 접두, ASCII 밖 문자. */
const needsMigration = (slug) =>
  /^brand-\d+$/.test(slug) || /^brandarchive-/.test(slug) || /[^a-z0-9-]/.test(slug);

const taken = new Set(BRANDS.map(urlSlugOf));
const plan = [];
const skipped = [];

for (const b of BRANDS) {
  const from = urlSlugOf(b);
  if (!needsMigration(from)) continue;
  const en = latinName(b);
  // 영문/원어 표기가 없으면 한글명을 로마자로 옮긴다. 번호 slug를 남기거나 URL
  // 인코딩된 한글 경로를 쓰는 것보다 브랜드와의 연관성이 분명하다.
  const ko = en ? null : koreanName(b);
  const to = slugify(en || (ko ? romanizeKorean(ko) : ""));
  if (!to || to.length < 2) { skipped.push({ from, name: b.name, reason: "영문·한글 표기 모두 없음" }); continue; }
  if (to === from) continue;
  if (taken.has(to)) { skipped.push({ from, name: b.name, reason: `충돌: ${to}` }); continue; }
  taken.delete(from);
  taken.add(to);
  plan.push({ from, to, name: b.name, id: b.id });
}

console.log(`이전 대상 ${BRANDS.filter(b => needsMigration(urlSlugOf(b))).length}건 중 ${plan.length}건 이전, ${skipped.length}건 유지`);
for (const s of skipped) console.log(`  유지: ${s.from} (${s.name}) — ${s.reason}`);

if (!apply) {
  console.log("\n--dry-run: 변경 없음. 적용하려면 --apply");
  for (const p of plan.slice(0, 20)) console.log(`  ${p.from} → ${p.to}`);
  process.exit(0);
}

// 1) 데이터의 urlSlug 갱신 — 빌더와 SPA가 모두 이 값을 URL 근거로 쓴다.
const byId = new Map(plan.map(p => [p.id, p.to]));
let changed = 0;
for (const b of BRANDS) {
  if (byId.has(b.id)) { b.urlSlug = byId.get(b.id); changed++; }
}

// 1-b) 같은 브랜드가 allBrands 밖에도 사본으로 들어 있다(`brands` 492건, `brandCards`,
// `featuredBrand`, `pinnedFeatured` 등). relatedBrands()는 그 사본을 거쳐 링크를 만들기
// 때문에 여기까지 전파하지 않으면 "함께 읽을 브랜드"가 구 URL을 가리켜 링크가 끊긴다.
// 매칭은 불변인 `slug`로 한다 — id는 다른 종류의 배열과 우연히 겹칠 수 있다.
const urlSlugBySlug = new Map();
for (const b of BRANDS) if (b.urlSlug) urlSlugBySlug.set(b.slug, b.urlSlug);
let propagated = 0;
for (const key of Object.keys(DATA)) {
  const v = DATA[key];
  if (key === "allBrands") continue;
  const items = Array.isArray(v) ? v : (v && typeof v === "object" ? [v] : []);
  for (const o of items) {
    if (!o || typeof o !== "object" || !o.slug) continue;
    const want = urlSlugBySlug.get(o.slug);
    if (want && o.urlSlug !== want) { o.urlSlug = want; propagated++; }
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(DATA));
console.log(`data/brand-atlas.json: urlSlug ${changed}건 갱신, 사본 ${propagated}건 전파`);

// 2) 구 HTML 파일 삭제 — 남겨두면 같은 내용이 두 URL로 존재해 중복 콘텐츠가 된다.
//    (배포는 rsync --delete라 서버에서도 함께 사라지고, 301이 대신 응답한다.)
let removed = 0;
for (const p of plan) {
  const f = path.join(ROOT, "brand", `${p.from}.html`);
  if (fs.existsSync(f)) { fs.unlinkSync(f); removed++; }
}
console.log(`구 HTML ${removed}건 삭제`);

// 3) nginx 301 map — /brand/<old>.html → /brand/<new>.html
//
// 반드시 기존 항목에 **더한다**. 이 스크립트를 다시 돌리면 이번 회차의 plan만 남는데,
// 그것으로 파일을 덮어쓰면 지난 회차에 이전한 URL들의 리다이렉트가 통째로 사라진다
// (실제로 한 번 겪었다 — 519건이 1건으로 줄었다).
const mapPath = path.join(REPO, "deploy", "brandatlas-redirects.map");
fs.mkdirSync(path.dirname(mapPath), { recursive: true });
const prior = fs.existsSync(mapPath) ? fs.readFileSync(mapPath, "utf8") : "";
const mapLines = new Set(prior.split("\n").filter(l => l.startsWith("/")));
const added = plan.filter(p => !mapLines.has(`/brand/${p.from}.html /brand/${p.to}.html;`)).length;
for (const p of plan) mapLines.add(`/brand/${p.from}.html /brand/${p.to}.html;`);
const sortedMap = [...mapLines].sort();
fs.writeFileSync(mapPath,
  `# brand-atlas Phase E 301 map (생성: scripts/migrate-slugs.mjs 외)\n` +
  `# nginx map 블록 안에서 include 한다. 총 ${sortedMap.length}건.\n` +
  `${sortedMap.join("\n")}\n`);
console.log(`deploy/brandatlas-redirects.map: ${sortedMap.length}건 (이번에 +${added})`);

// 4) 이전 기록 — 되돌리거나 사후 검증할 때 쓴다.
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports", "slug-migration.json"),
  JSON.stringify({ migratedAt: null, origin: ORIGIN, migrated: plan, kept: skipped }, null, 1));
console.log(`reports/slug-migration.json 기록`);
console.log("\n다음: build-brand-pages.mjs → build-seo-extras.mjs → 배포 → nginx map 적용");
