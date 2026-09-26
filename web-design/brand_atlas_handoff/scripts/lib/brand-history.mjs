// 브랜드 연대기 — 원본 로더 (build-brand-history / build-brand-pages / build-seo-extras 공용).
//
// 원본은 content/brand-history/brand-history.html(편집자가 만든 단일 HTML 연대기) 그대로다. 그 안의
// LANES·ERAS·RAW 배열을 빌드 시점에 읽는다 — 원본을 새 판으로 바꿔 넣으면 다음 빌드에 그대로 반영된다.
// 사전 연결은 content/brand-history/links.json("연도|제목" → 브랜드 slug)에서만 온다. 이름이 비슷하다고
// 자동으로 잇지 않는다(1887 야마하 ≠ 야마하 발동기 — CLAUDE.md §2의 정확도 우선 원칙).
import fs from "node:fs";
import path from "node:path";

export const HISTORY_DIR = "content/brand-history";
export const HISTORY_PATH = "brand-history/";

// 원본의 배열 리터럴을 꺼낸다. 원본은 저장소에 커밋된 편집 자료라 평가해도 된다(외부 입력 아님).
function arrayLiteral(src, name) {
  const m = new RegExp(`const ${name}=(\\[[\\s\\S]*?\\n\\]);`).exec(src);
  if (!m) throw new Error(`brand-history: ${name} 배열을 찾지 못했습니다`);
  return Function(`"use strict";return ${m[1]}`)();
}

export const entryKey = (e) => `${e.y}|${e.t}`;

/** 연도 표기 — 원본 규칙과 같다(라벨이 있으면 라벨, 기원전은 "BC n"). */
export const yearLabel = (e) => e.lab || (e.y < 0 ? `BC ${-e.y}` : String(e.y));

export function loadHistory(root) {
  const dir = path.join(root, HISTORY_DIR);
  const src = fs.readFileSync(path.join(dir, "brand-history.html"), "utf8");
  const lanes = arrayLiteral(src, "LANES").map((l) => ({ key: l.k, name: l.n, colors: l.p }));
  const eras = arrayLiteral(src, "ERAS").map(([from, to, name, sub, color]) => ({ from, to, name, sub, color }));
  const raw = arrayLiteral(src, "RAW");
  const links = JSON.parse(fs.readFileSync(path.join(dir, "links.json"), "utf8"));
  const laneKeys = new Set(lanes.map((l) => l.key));
  const entries = raw.map((r, i) => {
    const e = { i, y: r[0], l: r[1], t: r[2], d: r[3] || "", c: r[4] || "", lab: r[5] || "" };
    if (!laneKeys.has(e.l)) throw new Error(`brand-history: 알 수 없는 분야 ${e.l} (${e.t})`);
    e.slug = links[entryKey(e)] || null;
    return e;
  });
  const keys = new Set(entries.map(entryKey));
  const stale = Object.keys(links).filter((k) => !k.startsWith("_") && !keys.has(k));
  return { lanes, eras, entries, stale };
}

/** 브랜드 slug → 그 브랜드가 나오는 연대기 항목(연도순). 브랜드 페이지의 '연대기에서 보기'용. */
export function historyBySlug(root) {
  const { entries, lanes } = loadHistory(root);
  const laneName = new Map(lanes.map((l) => [l.key, l.name]));
  const map = new Map();
  for (const e of entries) {
    if (!e.slug) continue;
    if (!map.has(e.slug)) map.set(e.slug, []);
    map.get(e.slug).push({ ...e, lane: laneName.get(e.l) });
  }
  for (const list of map.values()) list.sort((a, b) => a.y - b.y || a.i - b.i);
  return map;
}

// 홈 티저 스타일 — 홈은 assets/brand-history.css를 받지 않으므로 티저에 필요한 규칙만 함께 싣는다.
const TEASER_CSS = ".bh-teaser{display:grid;grid-template-columns:1.1fr 1fr;gap:26px;align-items:center;padding:26px;border-radius:16px;background:#15171B;color:#ECEEF2;text-decoration:none}.bh-teaser:hover{background:#1c1f25}.bh-teaser .kicker{color:#ff5d8f}.bh-teaser h2{margin:0 0 10px;font-size:clamp(24px,3vw,34px);line-height:1.18;letter-spacing:-.03em;color:#fff}.bh-teaser p{margin:0 0 14px;color:#b8bec8;font-size:15px;line-height:1.7}.bh-teaser .cta{display:inline-block;padding:9px 16px;border-radius:999px;background:#fff;color:#15171B;font-weight:700;font-size:14px}.bh-teaser .strip{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:0 0 14px}.bh-teaser .strip i{flex:1}.bh-teaser .rows{display:flex;flex-direction:column;gap:6px}.bh-teaser .rw{display:grid;grid-template-columns:54px 1fr;gap:10px;align-items:center;font-size:13px}.bh-teaser .rw time{font-weight:700;color:#9AA2AF;font-variant-numeric:tabular-nums;text-align:right}.bh-teaser .rw span{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;background:var(--c);color:var(--f,#fff);font-weight:600;min-width:0}.bh-teaser .rw img{height:16px;width:auto;max-width:44px;object-fit:contain;background:#fff;border-radius:3px;padding:1px 2px}@media (max-width:820px){.bh-teaser{grid-template-columns:1fr;padding:20px}}";
// 홈 티저에 싣는 대표 항목 — 시대마다 하나씩, 로고가 있는 사전 연결 항목.
const TEASER_KEYS = ["1886|코카콜라", "1896|LV 모노그램 캔버스", "1971|나이키 스우시", "1993|삼성 CI", "2022|챗GPT"];

/** 홈 티저 마크업. prefix는 루트 기준 상대 경로 접두(홈은 ""). */
export function historyTeaser(root, { bySlug, esc, logoSrc, prefix = "" }) {
  const { entries, eras, lanes } = loadHistory(root);
  const brands = new Set(entries.filter((e) => e.slug).map((e) => e.slug)).size;
  const rows = TEASER_KEYS.map((k) => entries.find((e) => entryKey(e) === k)).filter(Boolean).map((e) => {
    const b = bySlug.get(e.slug);
    const src = b && logoSrc(b);
    const dark = e.c && parseInt(e.c.slice(1, 3), 16) * 0.3 + parseInt(e.c.slice(3, 5), 16) * 0.59 + parseInt(e.c.slice(5, 7), 16) * 0.11 > 170;
    return `<div class="rw"><time>${esc(yearLabel(e))}</time><span style="--c:${e.c || "#444"}${dark ? ";--f:#15171B" : ""}">${src ? `<img src="${esc(prefix + src)}" alt="" loading="lazy" decoding="async">` : ""}${esc(e.t)}</span></div>`;
  }).join("");
  const strip = eras.map((er) => `<i style="background:${er.color}"></i>`).join("");
  return `<section class="section"><style>${TEASER_CSS}</style><div class="wrap"><a class="bh-teaser" href="${prefix}${HISTORY_PATH}"><div><span class="kicker">브랜드 연대기</span><h2>브랜드의 역사,<br>인장에서 AI까지</h2><p>원통인장에서 챗GPT까지, 브랜드를 만든 사건 ${entries.length}개를 ${lanes.length}개 분야로 나란히 놓은 연대기입니다. ${brands}개 브랜드가 사전 항목과 로고로 이어집니다.</p><span class="cta">연대기 펼쳐 보기 →</span></div><div><div class="strip">${strip}</div><div class="rows">${rows}</div></div></a></div></section>`;
}
