// 서버가 주간 수록한 브랜드(content/brands/*.json)를 데이터에 반영한다 — 서버 빌드와 로컬 배포가 같이 쓴다(멱등).
//
// 서버의 content/brands/ 가 이 레코드들의 원본이다(매거진 원고와 같은 구조 — 로컬 배포가 먼저 받아 간다).
// 로고는 검수 전에는 싣지 않는다(CLAUDE.md §2-c "새 레코드의 로고는 수록 직후 육안 검수"). 어드민에서 승인한 로고만
// images/logos/ 로 복사해 대표 로고로 올리고, 반려하면 내린다.
//
// --decisions <file>: 어드민 로고 검수 결과({slug: {action: approve|reject, at}})를 레코드 파일에 먼저 적는다(서버에서만).
//                     로컬은 받아 온 레코드 파일의 logoReview 만 보고 반영하므로 서버와 결과가 같다.
// Usage: node scripts/apply-auto-brands.mjs [--decisions <file>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUTO_BRANDS_DIR } from "./lib/wikidata-brand.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const DIR = path.join(ROOT, AUTO_BRANDS_DIR);
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith(".json")).sort() : [];
if (!files.length) { console.log("apply-auto-brands: 서버 수록분 없음"); process.exit(0); }

const decisions = opt("--decisions") && fs.existsSync(opt("--decisions")) ? JSON.parse(fs.readFileSync(opt("--decisions"), "utf8")) : {};
const raw = fs.readFileSync(DATA_PATH, "utf8");
const data = JSON.parse(raw);
const bySlug = new Map(data.allBrands.map(b => [b.urlSlug || b.slug, b]));
let nextId = Math.max(...data.allBrands.map(b => Number(b.id) || 0)) + 1;
const n = { added: 0, logoOn: 0, logoOff: 0 };

for (const f of files) {
  const p = path.join(DIR, f);
  const doc = JSON.parse(fs.readFileSync(p, "utf8"));
  const rec = doc.record, slug = rec.urlSlug;
  // 어드민 결정 → 레코드 파일(서버). 'undo'로 지워진 결정은 검수 대기로 돌린다.
  if (doc.logoCandidate && opt("--decisions")) {
    const want = decisions[slug]?.action === "approve" ? "approved" : decisions[slug]?.action === "reject" ? "rejected" : "pending";
    if (doc.logoReview !== want) { doc.logoReview = want; doc.reviewedAt = decisions[slug]?.at || null; fs.writeFileSync(p, JSON.stringify(doc, null, 1)); }
  }
  let b = bySlug.get(slug);
  if (!b) {
    // 로컬에서 같은 개체를 이미 다른 slug로 넣었으면 건너뛴다(두 벌 생기지 않게).
    if (data.allBrands.some(x => x.entityLinks?.wikidata && x.entityLinks.wikidata === doc.qid)) continue;
    b = { ...rec, id: nextId++ };
    data.allBrands.push(b); bySlug.set(slug, b); n.added++;
  }
  if (!doc.logoCandidate) continue;
  const rel = `images/logos/${path.basename(doc.logoCandidate)}`;
  if (doc.logoReview === "approved") {
    const src = path.join(DIR, doc.logoCandidate);
    if (fs.existsSync(src) && (!fs.existsSync(path.join(ROOT, rel)) || !fs.readFileSync(src).equals(fs.readFileSync(path.join(ROOT, rel))))) fs.copyFileSync(src, path.join(ROOT, rel));
    if (!b.logo && fs.existsSync(path.join(ROOT, rel))) { b.logo = rel; b.logoHistory = [{ src: rel, label: "대표 로고", note: "현재 사용 중인 마크" }]; n.logoOn++; }
  } else if (b.logo === rel) {
    // 승인했다가 취소·반려한 경우 — 이 로고만 내린다(사람이 따로 넣은 로고는 건드리지 않는다).
    b.logo = ""; b.logoHistory = (b.logoHistory || []).filter(h => h.src !== rel); n.logoOff++;
  }
}

for (const ind of data.industries) ind.count = data.allBrands.filter(b => b.domainSlug === ind.id).length;
if (data.stats) data.stats.brands = data.allBrands.length;
const out = JSON.stringify(data, null, 1);
if (out !== raw) fs.writeFileSync(DATA_PATH, out);
console.log(`apply-auto-brands: 레코드 ${files.length} · 새로 반영 ${n.added} · 로고 게재 ${n.logoOn} · 로고 내림 ${n.logoOff}${out === raw ? " (변경 없음)" : ""}`);
