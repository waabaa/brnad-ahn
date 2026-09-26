// 어드민에서 사람이 직접 올린 로고(2026-09-22)를 데이터에 반영한다 — 서버 빌드와 로컬 배포가 같이 쓴다(멱등).
//
// 원본은 어드민 데이터 폴더(~/brandatlas-admin/data/logo-uploads/)다. 어드민은 샌드박스라 소스 미러에 쓸 수 없어서
// 서버 build_site가 먼저 그 폴더를 content/logo-uploads/ 로 복사하고(--from), 로컬 배포는 content/logo-uploads/ 를 받아 온다
// (매거진 원고·수록 레코드와 같은 구조 — 미러 올릴 때 제외).
//
//   content/logo-uploads/manifest.json  {slug: {file: "<slug>-up-<hash>.png", at}}
//   → images/logos/<file> 로 복사, 그 브랜드의 대표 로고로 올린다(사람이 고른 로고라 자동 수집 로고보다 우선).
//   manifest에서 빠진 slug(어드민에서 삭제)는 올렸던 로고만 내린다.
//
// Usage: node scripts/apply-logo-uploads.mjs [--from <admin logo-uploads dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const DIR = path.join(ROOT, "content/logo-uploads");
const LOGOS = path.join(ROOT, "images/logos");
const DATA_PATH = path.join(ROOT, "data/brand-atlas.json");
const FILE_RE = /^[a-z0-9][a-z0-9-]{0,119}-up-[0-9a-f]{8}\.(png|jpg|webp)$/;
const UP_RE = /^images\/logos\/[a-z0-9-]+-up-[0-9a-f]{8}\.(png|jpg|webp)$/;

// 서버: 어드민 폴더 → content/logo-uploads (삭제도 따라간다)
if (opt("--from")) {
  const from = path.resolve(opt("--from"));
  fs.mkdirSync(DIR, { recursive: true });
  const src = fs.existsSync(from) ? fs.readdirSync(from).filter(f => f === "manifest.json" || FILE_RE.test(f)) : [];
  for (const f of src) {
    const a = path.join(from, f), b = path.join(DIR, f);
    if (!fs.existsSync(b) || !fs.readFileSync(a).equals(fs.readFileSync(b))) fs.copyFileSync(a, b);
  }
  for (const f of fs.readdirSync(DIR)) if (!src.includes(f)) fs.rmSync(path.join(DIR, f));
}

let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8")); } catch { /* 없음 = 올린 로고 없음 */ }

const raw = fs.readFileSync(DATA_PATH, "utf8");
const data = JSON.parse(raw);
const n = { on: 0, off: 0, missing: 0 };
const history = (rel) => ({ src: rel, label: "대표 로고", note: "현재 사용 중인 마크" });

for (const b of data.allBrands) {
  const slug = b.urlSlug || b.slug;
  const m = manifest[slug];
  if (m && FILE_RE.test(m.file) && fs.existsSync(path.join(DIR, m.file))) {
    const rel = `images/logos/${m.file}`;
    const dst = path.join(ROOT, rel);
    if (!fs.existsSync(dst) || !fs.readFileSync(dst).equals(fs.readFileSync(path.join(DIR, m.file)))) fs.copyFileSync(path.join(DIR, m.file), dst);
    if (b.logo !== rel) {
      if (!UP_RE.test(b.logo || "")) b.logoBeforeUpload = b.logo || "";   // 지우면 이 로고로 돌아간다
      b.logo = rel;
      b.logoHistory = [history(rel), ...(b.logoHistory || []).filter(h => h.src !== rel && !UP_RE.test(h.src || ""))];
      n.on++;
    }
  } else if (m) {
    n.missing++;
  } else if (UP_RE.test(b.logo || "")) {
    // 어드민에서 지운 로고 — 올렸던 것만 내리고 올리기 전 대표 로고로 돌아간다.
    b.logoHistory = (b.logoHistory || []).filter(h => !UP_RE.test(h.src || ""));
    b.logo = b.logoBeforeUpload ?? b.logoHistory[0]?.src ?? "";
    delete b.logoBeforeUpload;
    n.off++;
  }
}

// 교체·삭제로 쓰이지 않게 된 업로드 파일은 images/logos 에서 치운다.
const used = new Set(Object.values(manifest).map(m => m.file));
if (fs.existsSync(LOGOS)) for (const f of fs.readdirSync(LOGOS)) if (FILE_RE.test(f) && !used.has(f)) fs.rmSync(path.join(LOGOS, f));

const out = JSON.stringify(data, null, 1);
if (out !== raw) fs.writeFileSync(DATA_PATH, out);
console.log(`apply-logo-uploads: 올린 로고 ${Object.keys(manifest).length} · 새로 게재 ${n.on} · 내림 ${n.off}${n.missing ? ` · 파일 없음 ${n.missing}` : ""}${out === raw ? " (변경 없음)" : ""}`);
