// 아틀라스 매거진 — 원고 로더·검증기 (build-magazine / build-seo-extras / build-brand-pages 공용).
//
// 원고는 content/magazine/*.md 이다. 첫머리에 ---json … --- 블록(메타), 그 아래 본문.
// 본문 문법은 필요한 것만 둔다:
//   ## 소제목
//   ::plate slug, slug, … | 캡션          로고 도판(현재 로고)
//   ::palette slug | 캡션                 brandArchive 색상 팔레트 띠
//   ::quote 문장 | 출처                    인용(출처 필수 — 인용은 데이터 본문에 있는 문장만)
//   [보이는 글](brand:slug)                브랜드 페이지 링크
//
// 원고의 사실은 브랜드 데이터 밖으로 나가지 않는다(CLAUDE.md §2). verifyArticle()이 본문에 나온 숫자(연도·수량)가
// 원고가 인용한 브랜드들의 데이터 본문·팩트에 있는지 확인하고, 없으면 빌드를 멈춘다.
import fs from "node:fs";
import path from "node:path";

export const MAG_DIR = "content/magazine";

export function parseArticle(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = /^---json\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: ---json 메타 블록이 없습니다`);
  const meta = JSON.parse(m[1]);
  for (const k of ["slug", "title", "dek", "kicker", "date", "issue", "order"]) if (meta[k] == null) throw new Error(`${file}: 메타 ${k} 누락`);
  return { ...meta, body: m[2].trim(), file };
}

// 발행 주기(2026-09-13 결정): 호는 월 단위(issue = YYYYMM의 순번), 기사는 매주 한 편. 원고의 date가 공개일이고,
// 공개일이 오늘(KST) 이후인 원고는 빌드에서 빠진다 — 주간 리프레시(월 05:10)가 그날 기사를 자동으로 공개한다.
export const todayKst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

export function loadArticles(root, { includeFuture = false } = {}) {
  const dir = path.join(root, MAG_DIR);
  if (!fs.existsSync(dir)) return [];
  const today = todayKst();
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => parseArticle(path.join(dir, f)))
    .filter(a => !a.draft && (includeFuture || a.date <= today))
    .sort((a, b) => a.issue - b.issue || a.order - b.order);
}

/** 본문이 참조하는 브랜드 slug 전부(링크·도판·팔레트). */
export function referencedSlugs(a) {
  const out = new Set(a.brands || []);
  for (const m of a.body.matchAll(/\]\(brand:([a-z0-9-]+)\)/g)) out.add(m[1]);
  for (const m of a.body.matchAll(/^::(?:plate|palette)\s+([^|\n]+)/gm)) for (const s of m[1].split(",")) out.add(s.trim());
  return [...out].filter(Boolean);
}

const plain = (s) => s.replace(/^::(plate|palette)\s.*$/gm, " ").replace(/\]\(brand:[^)]+\)/g, "]").replace(/[#>*[\]]/g, " ");

/** 브랜드 한 건의 근거 텍스트(본문·팩트·아카이브 값). */
function evidence(b) {
  const parts = [b.name, b.nameKo, b.nameEn, b.definition, b.summary, b.insight,
    ...Object.values(b.sections || {}).map(s => s && s.body), ...(b.timeline || []).map(t => t && `${t.year} ${t.description || ""}`),
    JSON.stringify(b.wikidata || {}), JSON.stringify(b.brandArchive || {})];
  return parts.filter(Boolean).join(" ");
}

/**
 * 숫자 검증. 본문의 숫자(쉼표 제거)가 참조 브랜드 근거 어디에도 없으면 오류 목록에 담는다.
 * 한 자리 수("세 개" 대신 쓴 3 등)와 도판 번호는 검사하지 않는다.
 */
export function verifyArticle(a, bySlug) {
  const errors = [];
  const refs = referencedSlugs(a);
  for (const s of refs) if (!bySlug.has(s)) errors.push(`없는 브랜드 slug: ${s}`);
  const ev = refs.map(s => bySlug.get(s)).filter(Boolean).map(evidence).join(" ").replace(/(\d),(\d{3})/g, "$1$2");
  const text = plain(a.body + " " + a.title + " " + a.dek).replace(/(\d),(\d{3})/g, "$1$2");
  const allowed = new Set((a.allowNumbers || []).map(String));
  for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) {
    const n = m[0];
    if (n.length < 2 || allowed.has(n)) continue;
    if (!ev.includes(n)) errors.push(`근거에 없는 숫자 ${n}: …${text.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\s+/g, " ")}…`);
  }
  return errors;
}

/** 읽는 시간(분) — 한국어 분당 500자 기준. */
export const readingMinutes = (a) => Math.max(3, Math.round(plain(a.body).replace(/\s+/g, "").length / 500));

/**
 * 예약 원고 현황 — 운영 방식 A(월 1회 몰아 쓰기, 2026-09-13 결정)의 경고용.
 * 마지막 예약 공개일까지 14일 이하로 남으면 low=true — 주간 리프레시 로그와 어드민 대시보드가 알린다.
 */
export function queueStatus(root) {
  const today = todayKst();
  const all = loadArticles(root, { includeFuture: true });
  const scheduled = all.filter(a => a.date > today).map(a => ({ date: a.date, title: a.title, issue: a.issue }));
  const last = all.length ? all.map(a => a.date).sort().pop() : null;
  const daysLeft = last ? Math.round((Date.parse(last) - Date.parse(today)) / 864e5) : 0;
  return { today, published: all.length - scheduled.length, scheduled, lastScheduled: last, daysLeft, low: daysLeft <= 14 };
}
