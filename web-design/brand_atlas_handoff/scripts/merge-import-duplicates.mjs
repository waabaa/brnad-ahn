// 신규 수록분이 기존 레코드와 같은 브랜드일 때 하나로 합친다.
//
// URL은 기존 slug를 유지한다(이미 색인·301 그래프에 들어 있다). 본문·팩트는 더 긴 쪽을 쓴다.
// 신규 레코드는 삭제하고, 그 slug로 만들어진 페이지 파일도 지운다.
//
// Usage: node scripts/merge-import-duplicates.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const DATA = path.join(ROOT, "data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const norm = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/&/g, " and ").replace(/\s*\(.*?\)\s*/g, "").replace(/[^\p{Script=Hangul}\p{Letter}\p{Number}]+/gu, "").trim();
const textLen = (b) => String(b.definition || "").length + Object.values(b.sections || {}).reduce((n, s) => n + String(typeof s === "string" ? s : s?.body || "").length, 0);
const isReal = (s) => !!s && !String(s).includes("brand_atlas_logo_mark") && !String(s).startsWith("data:");

const isNew = (b) => !!b.sourceNote;
const olds = data.allBrands.filter(b => !isNew(b));
const news = data.allBrands.filter(isNew);
const keys = new Map();
for (const b of olds) for (const k of [b.name, b.nameKo, b.nameEn, b.slug, b.urlSlug]) if (k && norm(k)) keys.set(norm(k), b);

const merged = [];
const dropSlugs = new Set();
for (const nb of news) {
  const base = String(nb.urlSlug || "").replace(/-q\d+$/, "");
  const target = [nb.nameEn, nb.name, nb.nameKo, base].map(norm).map(k => keys.get(k)).find(Boolean);
  if (!target) continue;
  // 본문은 긴 쪽을 취한다(신규 항목이 대개 훨씬 길다).
  if (textLen(nb) > textLen(target)) {
    target.definition = nb.definition;
    target.summary = nb.summary || nb.definition;
    target.sections = { ...target.sections, ...nb.sections };
    if (nb.insight) target.insight = nb.insight;
  }
  if (nb.nameKo && /[가-힣]/.test(nb.nameKo)) { target.nameKo = nb.nameKo; target.name = nb.nameKo; }
  if (nb.nameEn && !target.nameEn) target.nameEn = nb.nameEn;
  if (!isReal(target.logo) && isReal(nb.logo)) { target.logo = nb.logo; target.logoHistory = nb.logoHistory; }
  if (!target.wikidata && nb.wikidata) target.wikidata = nb.wikidata;
  if (!target.entityLinks && nb.entityLinks) target.entityLinks = nb.entityLinks;
  if (!target.officialWebsite && nb.officialWebsite) target.officialWebsite = nb.officialWebsite;
  target.sourceNote = nb.sourceNote;
  merged.push({ from: nb.urlSlug, into: target.urlSlug || target.slug, name: target.name });
  dropSlugs.add(nb.urlSlug || nb.slug);
}

if (!DRY) {
  data.allBrands = data.allBrands.filter(b => !dropSlugs.has(b.urlSlug || b.slug));
  const byId = new Map(data.allBrands.map(b => [String(b.id), b]));
  data.brands = (data.brands || []).filter(m => byId.has(String(m.id)));
  for (const m of data.brands) { const s = byId.get(String(m.id)); if (s) { m.name = s.name; m.nameKo = s.nameKo; m.nameEn = s.nameEn; m.logo = s.logo; } }
  if (data.stats) data.stats.brands = data.allBrands.length;
  fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
  for (const s of dropSlugs) { const f = path.join(ROOT, "brand", `${s}.html`); if (fs.existsSync(f)) fs.unlinkSync(f); }
}
fs.writeFileSync(path.join(ROOT, "reports/import-duplicate-merge.json"), JSON.stringify({ at: new Date().toISOString().slice(0, 10), merged }, null, 1));
console.log(`병합 ${merged.length}건${DRY ? " (dry)" : ""} — ${merged.map(m => `${m.from}→${m.into}`).join(", ")}`);
console.log(`allBrands ${data.allBrands.length}`);
