// 아카이브 수집분(brand.brandArchive)의 운영용 문구를 독자용 문장으로 바꾼다(2026-09-13).
//
// 수집 파이프라인이 본문 자리에 "…에 기록된 … 계열의 브랜드 아이덴티티 사례입니다", "공개 메타데이터와 에셋 요약을
// 기준으로 …", "공개 로고 자산은 추후 권리 확인 후 보강할 수 있도록 …" 같은 내부 관리 문구를 채워 넣었다.
// 독자에게는 정보가 아니고, 광고 심사에서는 미완성 사이트 신호로 읽힌다.
//
// 새 문장은 brandArchive의 구조화 값(디자이너·연도·구성 섹션·색상)만으로 만든다 — 값에 없는 내용은 쓰지 않는다.
// 서체 문장은 수집 원문이 깨져 있어(동영상 플레이어 UI 텍스트 혼입, 서체명 누락) 복원하지 않고 뺀다.
// 사람이 쓴 본문(origin·products·current 등)은 건드리지 않는다. 멱등하다.
//
// Usage: node scripts/clean-archive-boilerplate.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { topicParticle } from "./lib/brand-seo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const DATA_PATH = process.env.BA_DATA || path.join(ROOT, "data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const SECTION_KO = { "로고": "로고", "타입": "서체", "컬러": "색상", "아트 디렉션": "아트 디렉션", "애플리케이션": "응용 디자인", "모션": "모션", "사운드": "사운드", "사진": "사진", "일러스트레이션": "일러스트레이션", "패키지": "패키지" };
// 어디에 있든 지우는 운영 문장.
const DROP = [
  /공개 로고 자산은 추후 권리 확인 후 보강할 수 있도록 텍스트 메타데이터 중심으로 관리합니다\.?/g,
  /공개 메타데이터와 에셋 요약을 기준으로 아이덴티티 구조를 확인할 수 있습니다\.?/g,
  /공개 섹션 정보는 제한적이지만, 에셋 구조를 통해 시각 아이덴티티 사례로 분류됩니다\.?/g,
  /공개 메타데이터에서 별도 컬러 팔레트는 확인되지 않았습니다\.?/g,
  /공개 서체 정보는 별도로 확인되지 않았습니다\.?/g,
  /서체 정보로는 [\s\S]*?가 기록되어 있습니다\./g,
  /[^.。]*의 아이덴티티 메타데이터는 [^.]*중심으로 정리됩니다\./g,
  /[^.。]*는\s?\d{4}년에 기록된 [^.]*계열의 브랜드 아이덴티티 사례입니다\./g,
  /[^.。]*[이가] 아이덴티티 작업의 디자이너로 기록되어 있습니다\./g,
  /(로고|타입|컬러|아트 디렉션|애플리케이션)[^.]*섹션으로 구성된 시각 시스템입니다\./g,
  /확인된 컬러 팔레트는 [^.]*?구성됩니다\./g,
];
const tidy = (s) => String(s || "").replace(/[ \t]{2,}/g, " ").trim();
const hit = (s) => DROP.some(re => { re.lastIndex = 0; return re.test(String(s || "")); });
const scrub = (s) => hit(s) ? tidy(DROP.reduce((t, re) => t.replace(re, " "), String(s || ""))) : String(s || "");
const list = (a) => a.length <= 1 ? (a[0] || "") : `${a.slice(0, -1).join(", ")}와 ${a[a.length - 1]}`;
const hasBatchim = (s) => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
const ro = (s) => { const c = s.charCodeAt(s.length - 1); return hasBatchim(s) && (c - 0xac00) % 28 !== 8 ? "으로" : "로"; };
const subj = (s) => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? "이" : "가"; };

function sentences(b) {
  const a = b.brandArchive;
  const name = b.nameKo || b.name;
  const designers = (a.designers || []).map(tidy).filter(Boolean);
  const who = designers.length ? list(designers) : "";
  const parts = [...new Set((a.sections || []).map(s => SECTION_KO[s] || s))];
  const hex = (a.colors || []).map(c => c && c.hex).filter(Boolean).slice(0, 6);
  const lead = who && a.year ? `${name}${topicParticle(name)} ${who}${subj(who)} ${a.year}년에 작업한 브랜드 아이덴티티다.`
    : who ? `${name}${topicParticle(name)} ${who}${subj(who)} 작업한 브랜드 아이덴티티다.` : "";
  const structure = parts.length >= 2 ? `아이덴티티는 ${parts.join(", ")}${ro(parts[parts.length - 1])} 구성된다.` : "";
  const palette = hex.length ? `색상 팔레트는 ${hex.join(", ")}${hex.length > 1 ? `의 ${hex.length}색이다` : "이다"}.` : "";
  return { lead, structure, palette, who, name };
}

let touched = 0;
const cleaned = new Map();
for (const b of data.allBrands) {
  const before = JSON.stringify([b.definition, b.summary, b.sections, b.timeline]);
  if (b.brandArchive) {
    const { lead, structure, palette, who, name } = sentences(b);
    const sec = b.sections || (b.sections = {});
    for (const [k, v] of Object.entries(sec)) if (!["overview", "identity", "insights"].includes(k) && v && typeof v.body === "string") v.body = scrub(v.body);
    // 재실행 시 앞서 넣은 문장이 겹치지 않도록 뺀 뒤 다시 붙인다(멱등).
    const keep = (k) => tidy([lead, structure, palette].filter(Boolean).reduce((t, x) => t.split(x).join(" "), scrub(sec[k]?.body)));
    // 본문이 따로 있는 브랜드(애플·코카콜라처럼 기업 레코드에 아카이브가 합쳐진 경우)는 개요를 "…작업한 아이덴티티다"로
    // 시작하면 회사를 작업물로 부르게 된다. 그때는 아이덴티티 섹션에 작업 사실만 한 문장으로 붙인다.
    const rich = keep("overview").length >= 80;
    const credit = who ? (a => a.year ? `${name}의 ${a.year}년 아이덴티티는 ${who}${subj(who)} 작업했다.` : `${name}의 아이덴티티는 ${who}${subj(who)} 작업했다.`)(b.brandArchive) : "";
    const idKeep = tidy([credit].filter(Boolean).reduce((t, x) => t.split(x).join(" "), keep("identity")));
    if (sec.overview) sec.overview.body = rich ? keep("overview") : tidy([lead, structure, keep("overview")].filter(Boolean).join(" "));
    if (sec.identity) sec.identity.body = tidy([rich && idKeep.length < 200 ? credit : "", idKeep, palette].filter(Boolean).join(" "));
    if (sec.insights) sec.insights.body = keep("insights");
    if (sec.people && /designer\s*:/i.test(sec.people.body || "")) sec.people.body = who ? `${name}의 아이덴티티 디자인은 ${who}${subj(who)} 맡았다.` : "";
    const def = scrub(b.definition);
    b.definition = def && def.length >= 40 ? def : tidy([lead, structure].filter(Boolean).join(" ")) || def;
    const sum = scrub(b.summary);
    b.summary = sum && sum.length >= 40 ? sum : b.definition;
    for (const t of b.timeline || []) if (t && /컬렉션에 기록되었습니다/.test(t.description || "")) t.description = who ? `${who}${subj(who)} ${name} 아이덴티티를 작업했다.` : `${name} 아이덴티티 작업.`;
  } else {
    b.definition = scrub(b.definition) || b.definition;
    if (b.summary) b.summary = scrub(b.summary) || b.summary;
    for (const s of Object.values(b.sections || {})) if (s && typeof s.body === "string") s.body = scrub(s.body);
  }
  if (JSON.stringify([b.definition, b.summary, b.sections, b.timeline]) !== before) { touched++; cleaned.set(b.urlSlug || b.slug, b); }
}
// 데이터 안의 브랜드 사본도 같은 값으로 맞춘다(relatedBrands()가 사본을 참조).
for (const [k, v] of Object.entries(data)) {
  if (k === "allBrands" || !Array.isArray(v)) continue;
  for (const x of v) {
    const src = x && typeof x === "object" && cleaned.get(x.urlSlug || x.slug);
    if (!src || src === x) continue;
    for (const f of ["definition", "summary", "sections", "timeline"]) if (f in x) x[f] = structuredClone(src[f]);
  }
}
console.log(`정리 ${touched}건`);
const sample = data.allBrands.find(b => (b.urlSlug || b.slug) === "tribank");
if (sample) console.log(JSON.stringify({ definition: sample.definition, identity: sample.sections?.identity?.body, people: sample.sections?.people?.body, timeline: sample.timeline }, null, 1));
if (!DRY) fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 1));
