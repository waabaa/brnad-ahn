// 카드뉴스 템플릿 — 사이트 디자인 시스템(styles.css :root)을 그대로 쓴다: 흰 바탕, 잉크 #111214, 단일 액센트 #e5252b,
// Pretendard, keep-all. 그라데이션·이모지·장식 애니메이션 없음. 피드 1080x1350(4:5), 릴스 1080x1920(9:16).
// 구조는 officetel-social/src/templates.mjs(카드 타입별 함수 + 공용 프레임)를 따랐다.
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./lib.mjs";

export const FORMATS = { feed: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } };
const FONT_DIR = pathToFileURL(path.join(ROOT, "scripts/social/assets/fonts")).href;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const img = (rel) => (rel ? pathToFileURL(path.join(ROOT, rel)).href : "");

const CSS = (f) => `
@font-face{font-family:P;src:url(${FONT_DIR}/Pretendard-Regular.woff2) format("woff2");font-weight:400}
@font-face{font-family:P;src:url(${FONT_DIR}/Pretendard-SemiBold.woff2) format("woff2");font-weight:600}
@font-face{font-family:P;src:url(${FONT_DIR}/Pretendard-Bold.woff2) format("woff2");font-weight:700}
@font-face{font-family:P;src:url(${FONT_DIR}/Pretendard-ExtraBold.woff2) format("woff2");font-weight:800}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${f.w}px;height:${f.h}px;overflow:hidden;background:#fff}
body{font-family:P,sans-serif;color:#111214;word-break:keep-all;overflow-wrap:break-word;-webkit-font-smoothing:antialiased}
.page{position:relative;width:${f.w}px;height:${f.h}px;padding:${f.h > 1500 ? "200px 88px 220px" : "88px 88px 132px"};display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:600;color:#6b7280}
.top .k{color:#e5252b}
.foot{position:absolute;left:88px;right:88px;bottom:${f.h > 1500 ? 120 : 64}px;display:flex;justify-content:space-between;font-size:24px;color:#9ca3af;border-top:2px solid #e6e6e2;padding-top:22px}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;padding-top:28px}
h1{font-size:76px;line-height:1.22;font-weight:800;letter-spacing:-.02em}
h2{font-size:58px;line-height:1.28;font-weight:800;letter-spacing:-.015em}
.en{font-size:34px;color:#6b7280;font-weight:600;margin-top:14px}
.lead{font-size:36px;line-height:1.6;color:#3a3d42;margin-top:36px}
.body{font-size:40px;line-height:1.62;color:#3a3d42;margin-top:40px}
.label{font-size:28px;font-weight:700;color:#e5252b;margin-bottom:22px}
.tile{width:100%;height:${f.h > 1500 ? 640 : 520}px;background:#fbfbfa;border:2px solid #e6e6e2;border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:56px}
.tile img{max-width:70%;max-height:62%;object-fit:contain}
.word{font-size:110px;font-weight:800;color:#111214;text-align:center;padding:0 40px}
table{width:100%;border-collapse:collapse;margin-top:40px}
th,td{font-size:36px;text-align:left;padding:24px 0;border-bottom:2px solid #e6e6e2;vertical-align:top;line-height:1.45}
th{width:32%;color:#6b7280;font-weight:600}
td{font-weight:600}
.sw{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;margin-top:44px}
.sw div{height:${f.h > 1500 ? 300 : 230}px;border-radius:20px;border:2px solid #e6e6e2;display:flex;align-items:flex-end;padding:22px;font-size:30px;font-weight:700}
.logo1{flex:1;display:flex;align-items:center;justify-content:center;background:#fbfbfa;border:2px solid #e6e6e2;border-radius:24px;margin:40px 0}
.logo1 img{max-width:72%;max-height:70%;object-fit:contain}
.cap{font-size:34px;color:#3a3d42;line-height:1.5}
.year{font-size:150px;font-weight:800;letter-spacing:-.03em;line-height:1}
.bar{width:120px;height:12px;border-radius:6px;margin:36px 0}
.rank{margin-top:36px}
.rank .r{display:flex;align-items:center;gap:28px;padding:22px 0;border-bottom:2px solid #e6e6e2}
.rank .n{width:48px;font-size:36px;font-weight:800;color:#e5252b}
.rank .lg{width:112px;height:112px;border:2px solid #e6e6e2;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#fbfbfa}
.rank .lg img{max-width:80%;max-height:70%;object-fit:contain}
.rank .nm{flex:1;font-size:36px;font-weight:700;line-height:1.3}
.rank .nm small{display:block;font-size:26px;color:#6b7280;font-weight:600;margin-top:6px}
.rank .v{font-size:38px;font-weight:800;text-align:right}
.note{font-size:26px;color:#6b7280;margin-top:28px;line-height:1.5}
.url{font-size:44px;font-weight:800;color:#e5252b;margin-top:44px}
.credit{position:absolute;right:88px;top:${f.h > 1500 ? 140 : 40}px;font-size:20px;color:#9ca3af}
`;

const frame = (f, s, i, n, inner) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS(f)}</style></head><body><div class="page">
<div class="top"><span><span class="k">${esc(s.kicker || "브랜드 아틀라스")}</span></span><span>${i + 1} / ${n}</span></div>
<div class="main">${inner}</div>
<div class="foot"><span>브랜드 아틀라스</span><span>brandatlas.co.kr</span></div></div></body></html>`;

const KIND = {
  cover: (s) => `${s.logo ? `<div class="tile"><img src="${img(s.logo)}"></div>` : s.word ? `<div class="tile"><div class="word">${esc(s.word)}</div></div>` : ""}
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ""}<h1>${esc(s.title)}</h1>${s.en ? `<div class="en">${esc(s.en)}</div>` : ""}${s.lead ? `<div class="lead">${esc(s.lead)}</div>` : ""}`,
  text: (s) => `${s.label ? `<div class="label">${esc(s.label)}</div>` : ""}<h2>${esc(s.title)}</h2><div class="body">${esc(s.body)}</div>`,
  facts: (s) => `<div class="label">${esc(s.label || "브랜드 정보")}</div><h2>${esc(s.title)}</h2><table>${s.rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}`,
  palette: (s) => `<div class="label">${esc(s.label || "브랜드 컬러")}</div><h2>${esc(s.title)}</h2><div class="sw">${s.colors.slice(0, 4).map(c => `<div style="background:${esc(c.hex)};color:${lum(c.hex) > 0.55 ? "#111214" : "#fff"}">${esc(c.hex.toUpperCase())}${c.name ? ` · ${esc(c.name)}` : ""}</div>`).join("")}</div>`,
  logo: (s) => `<div class="label">${esc(s.label || "로고")}</div><h2>${esc(s.title)}</h2><div class="logo1"><img src="${img(s.src)}"></div>${s.caption ? `<div class="cap">${esc(s.caption)}</div>` : ""}`,
  event: (s) => `<div class="label">${esc(s.label || "")}</div><div class="year">${esc(s.year)}</div><div class="bar" style="background:${esc(s.color || "#e5252b")}"></div><h2>${esc(s.title)}</h2>${s.body ? `<div class="body">${esc(s.body)}</div>` : ""}`,
  ranking: (s) => `<div class="label">${esc(s.label || "")}</div><h2>${esc(s.title)}</h2><div class="rank">${s.rows.map((r, k) => `<div class="r"><span class="n">${k + 1}</span><span class="lg">${r.logo ? `<img src="${img(r.logo)}">` : ""}</span><span class="nm">${esc(r.name)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><span class="v">${esc(r.value)}</span></div>`).join("")}</div>${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}`,
  cta: (s) => `<div class="label">${esc(s.label || "더 읽기")}</div><h2>${esc(s.title)}</h2>${s.body ? `<div class="body">${esc(s.body)}</div>` : ""}<div class="url">${esc(s.url)}</div>`,
};

function lum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return 1;
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** 슬라이드 하나의 HTML. */
export function slideHtml(slide, i, n, format = "feed") {
  const f = FORMATS[format];
  const inner = KIND[slide.kind](slide) + (slide.credit ? `<div class="credit">${esc(slide.credit)}</div>` : "");
  return frame(f, slide, i, n, inner);
}
