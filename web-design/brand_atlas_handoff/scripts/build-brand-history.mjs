// 브랜드 연대기 빌더 — content/brand-history/brand-history.html → brand-history/index.html
//
// 원본은 스크립트가 격자를 그리는 단일 HTML이라 검색엔진이 본문을 읽기 어렵다. 여기서 원본의 RAW 배열을 읽어
// ① 시대별 시맨틱 목록(<section><h3><ol><li><time>)을 정적 HTML로 싣고 ② 같은 목록을 assets/brand-history.js가
// 읽어 인터랙티브 격자를 그린다(본문과 화면이 한 원천). 사전 연결은 links.json에 적힌 항목만(lib/brand-history.mjs).
// 로고는 images/history/의 WebP 썸네일(scripts/make-history-logos.py)을 쓰고, 원본 로고가 바뀐 브랜드는 원본으로 폴백한다.
//
// 순서: build-brand-pages → build-magazine → build-brand-history → build-seo-extras (홈 티저·sitemap이 이 결과를 읽는다).
// Usage: node scripts/build-brand-history.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ORIGIN, displayName, latinName, koreanName, urlSlugOf, foundedYear } from "./lib/brand-seo.mjs";
import { esc, page, breadcrumbs } from "./lib/page-shell.mjs";
import { hasLogo } from "./lib/archive.mjs";
import { brandHref, assetHref } from "./lib/markup.mjs";
import { loadHistory, yearLabel, HISTORY_PATH } from "./lib/brand-history.mjs";
import { todayKst } from "./lib/magazine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = "../";
const URL = `${ORIGIN}/${HISTORY_PATH}`;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const bySlug = new Map();
for (const b of DATA.allBrands) { if (b.slug) bySlug.set(b.slug, b); const u = urlSlugOf(b); if (!bySlug.has(u)) bySlug.set(u, b); }
const THUMBS = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "images/history/manifest.json"), "utf8")); } catch { return {}; } })();
const REPORT = path.join(ROOT, "reports/brand-history.json");

const writeIfChanged = (file, body) => {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === body) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
  return true;
};
const fileVer = (rel) => crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, rel))).digest("hex").slice(0, 8);

// 원본과 같은 색 규칙: 항목 색이 없으면 분야 팔레트를 돌려 쓴다. 밝은 배경엔 어두운 글자.
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** 로고 경로 — 썸네일이 현재 로고에서 만들어졌을 때만 썸네일. */
function logoOf(b) {
  if (!hasLogo(b)) return null;
  const t = THUMBS[b.slug];
  if (t && t.src === b.logo && fs.existsSync(path.join(ROOT, t.file))) return { src: t.file, w: t.w, h: t.h };
  return { src: b.logo };
}
const img = (lg, alt, h) => lg ? `<img src="${esc(assetHref(lg.src, P))}" alt="${esc(alt)}"${lg.w ? ` width="${Math.round(lg.w * h / lg.h)}" height="${h}"` : ""} loading="lazy" decoding="async">` : "";

export function buildHistory() {
  const { lanes, eras, entries, stale } = loadHistory(ROOT);
  if (stale.length) console.warn(`brand-history: links.json에 원본에 없는 항목 ${stale.length}건 — ${stale.slice(0, 5).join(", ")}`);
  const laneBy = new Map(lanes.map((l) => [l.key, l]));
  const cnt = {};
  for (const e of entries) {
    const ln = laneBy.get(e.l);
    cnt[e.l] = (cnt[e.l] || 0) + 1;
    e.bg = e.c || ln.colors[cnt[e.l] % 3];
    e.dark = lum(e.bg) > 0.42;
    e.brand = e.slug ? bySlug.get(e.slug) || null : null;
    if (e.slug && !e.brand) console.warn(`brand-history: 사전에 없는 slug ${e.slug} (${e.y} ${e.t})`);
  }
  const lastYear = Math.max(...entries.map((e) => e.y));
  const endYear = Math.max(lastYear + 1, eras[eras.length - 1].to);
  const eraOf = (y) => eras.findIndex((er) => y >= er.from && y < er.to);
  const linked = entries.filter((e) => e.brand);

  // 연대기에 나오는 브랜드 — 첫 등장 연도순
  const brandMap = new Map();
  for (const e of linked) {
    const k = urlSlugOf(e.brand);
    if (!brandMap.has(k)) brandMap.set(k, { b: e.brand, first: e, list: [] });
    brandMap.get(k).list.push(e);
  }
  const brands = [...brandMap.values()].sort((a, b) => a.first.y - b.first.y || a.first.i - b.first.i);

  // ── 정적 목록 ──
  const liOf = (e) => {
    const yl = yearLabel(e);
    const yearEl = e.y > 0 && !e.lab ? `<time datetime="${String(e.y).padStart(4, "0")}">${esc(yl)}</time>` : `<span class="yl">${esc(yl)}</span>`;
    const ln = laneBy.get(e.l).name;
    let link = "";
    if (e.brand) {
      const name = displayName(e.brand);
      link = `<a class="bl" href="${brandHref(e.brand, P)}">${img(logoOf(e.brand), `${name} 로고`, 16)}${esc(name)}</a>`;
    }
    return `<li id="h-${e.i}" data-i="${e.i}" data-y="${e.y}" data-l="${e.l}"${e.c ? ` data-hex="${esc(e.c)}"` : ""}${e.dark ? " data-dk=\"1\"" : ""} style="--c:${e.bg}">${yearEl}<span><span class="t">${esc(e.t)}</span><span class="ln">${esc(ln)}</span></span>${e.d ? `<span class="ds">${esc(e.d)}</span>` : ""}${link}</li>`;
  };
  const sections = eras.map((er, ei) => {
    const list = entries.filter((e) => eraOf(e.y) === ei || (ei === eras.length - 1 && e.y >= er.to)).sort((a, b) => a.y - b.y || a.i - b.i);
    if (!list.length) return "";
    const range = `${er.from < 0 ? `BC ${-er.from}` : er.from} ~ ${ei === eras.length - 1 ? "현재" : er.to < 0 ? `BC ${-er.to}` : er.to}`;
    return `<section class="bh-sec" id="bh-e${ei}" style="--era:${er.color}"><h3>${esc(er.name)} <small>${range} · ${esc(er.sub)} · ${list.length}개</small></h3><ol>${list.map(liOf).join("")}</ol></section>`;
  }).join("");

  const brandWall = brands.map(({ b, first, list }) => {
    const name = displayName(b);
    const lg = logoOf(b);
    const art = lg ? img(lg, `${name} 로고`, 44) : `<span class="wm">${esc(latinName(b) || koreanName(b) || b.name)}</span>`;
    return `<li><a href="${brandHref(b, P)}"><span class="art">${art}</span><b>${esc(name)}</b><small>${esc(yearLabel(first))} · 연대기 ${list.length}건</small></a></li>`;
  }).join("");

  // ── 페이지 ──
  const first = entries.reduce((a, b) => (b.y < a.y ? b : a));
  const now = todayKst();
  const nowLine = `지금, ${now.slice(0, 4)}년 ${Number(now.slice(5, 7))}월. 다음 칸은 아직 비어 있습니다.`;
  const title = `브랜드의 역사 연대기 — 인장에서 AI까지 ${entries.length}개 기록 | 브랜드 아틀라스`;
  const h1 = "브랜드의 역사, 인장에서 AI까지";
  const desc = `기원전 ${-first.y}년 ${first.t}부터 ${lastYear}년까지, 브랜드를 만든 사건 ${entries.length}개를 표식·상표법·브랜드 탄생·로고·컬러·광고·이론·디지털 등 ${lanes.length}개 분야로 나란히 놓은 연대기. 코카콜라·루이비통·삼성전자 등 ${brands.length}개 브랜드의 사전 항목과 로고로 이어집니다.`;
  const eraStrip = eras.map((er, i) => `<a href="#bh-e${i}" data-era="${i}" style="background:${er.color}" title="${esc(`${er.name} — ${er.sub}`)}">${esc(er.name)}</a>`).join("");
  const lanesJson = JSON.stringify(lanes.map((l) => ({ k: l.key, n: l.name, p: l.colors })));
  const erasJson = JSON.stringify(eras.map((er) => [er.from, er.to, er.name, er.sub, er.color]));

  const body = `<div class="bh">
<section class="bh-hero"><div class="wrap">${breadcrumbs([{ name: "브랜드 아틀라스", href: `${P}index.html` }, { name: "브랜드 연대기" }])}<span class="kicker">브랜드 연대기</span><h1>${h1}</h1><p class="lead">원통인장과 가축 낙인에서 길드 마크와 상표법을 지나, 로고·브랜드 컬러·광고·이론·디지털과 AI까지. 브랜드를 만든 사건 ${entries.length}개를 ${lanes.length}개 분야로 나란히 놓았습니다. 같은 해 다른 분야에서 무슨 일이 있었는지 가로로 읽고, 브랜드 이름을 누르면 브랜드 사전의 항목으로 이어집니다.</p>
<ul class="bh-stats"><li><b>${entries.length}</b>기록</li><li><b>${lanes.length}</b>분야</li><li><b>${eras.length}</b>시대</li><li><b>${brands.length}</b>사전 연결 브랜드</li></ul>
<nav class="bh-eras" aria-label="시대로 이동">${eraStrip}</nav></div></section>
<section class="bh-app" id="bh-app" aria-label="인터랙티브 연대기" data-end="${endYear}" data-now="${esc(nowLine)}">
<div class="bh-tools"><p class="sub">카드를 누르면 설명과 같은 시기의 기록이 열립니다. 격자 안에서 스크롤하세요.</p><label class="bh-q"><input id="bh-q" type="search" placeholder="브랜드, 인물, 사건 찾기" aria-label="연대기 검색"><small id="bh-qc"></small></label><button type="button" id="bh-play" aria-pressed="false">처음부터 재생</button><button type="button" id="bh-motion" aria-pressed="true">3D 모션</button><button type="button" id="bh-top">맨 위로</button></div>
<div class="bh-chips" id="bh-era-chips" aria-label="시대로 이동"></div>
<div class="bh-chips" id="bh-lane-chips" aria-label="분야 보이기·숨기기"></div>
<div id="bh-wrap"><div id="bh-sc"><div id="bh-grid"><noscript><p>인터랙티브 격자는 자바스크립트가 필요합니다. 아래 전체 목록에서 같은 내용을 볼 수 있습니다.</p></noscript></div></div><div id="bh-rail" aria-hidden="true"></div>
<aside id="bh-detail" hidden aria-live="polite"><div class="sw"><div class="py"></div><div class="hx"></div></div><button type="button" class="x" aria-label="닫기">×</button><div class="bd"><h2></h2><div class="pl"></div><p class="pd"></p><a class="br" hidden></a><h3>같은 시기의 기록</h3><ul></ul></div></aside></div>
<script type="application/json" id="bh-lanes">${lanesJson}</script><script type="application/json" id="bh-eras">${erasJson}</script>
</section>
<section class="section"><div class="wrap"><div class="section-head"><h2>연대기에 나오는 브랜드</h2><p>첫 등장 연도순 · ${brands.length}곳 · 로고를 누르면 브랜드 사전 항목으로 갑니다</p></div><ul class="bh-brands">${brandWall}</ul></div></section>
<section class="section bh-list" id="bh-list"><div class="wrap"><div class="section-head"><h2>연대기 전체 목록</h2><p>시대별 · 연도순 · ${entries.length}개 기록</p></div>${sections}</div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>읽는 법</h2></div><ul class="bh-note">
<li>연도는 해당 브랜드·사건이 시작되거나 발표된 해입니다. 기원전 항목의 "c."는 추정 연대입니다.</li>
<li>설립 연도는 무엇을 시작점으로 보느냐(첫 가게, 법인 등록, 현재 이름으로 바뀐 해)에 따라 자료마다 다릅니다. 연대기의 연도와 브랜드 사전 항목의 연도가 다르면 사전 항목의 설명에서 그 기준을 확인할 수 있습니다.</li>
<li>색 견본의 HEX 값은 각 브랜드·색 이름을 나타내는 대표값이며, 공식 지정 색과 다를 수 있습니다.</li>
<li>로고와 상표의 권리는 각 브랜드 소유자에게 있습니다. 로고는 해당 브랜드 항목을 식별하기 위해 싣습니다.</li>
</ul><p style="margin-top:14px"><a class="more" href="${P}pages/timeline.html">설립연도순 브랜드 타임라인 →</a> · <a class="more" href="${P}pages/bici.html">로고 아카이브 →</a> · <a class="more" href="${P}magazine/">아틀라스 매거진 →</a></p></div></section>
</div>
<script src="${P}assets/brand-history.js?v=${fileVer("assets/brand-history.js")}" defer></script>`;

  // 신선도: 본문 텍스트가 바뀐 날만 dateModified를 올린다(CLAUDE.md §3 신선도 원장과 같은 원칙).
  const text = body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/지금, \d{4}년 \d+월\./, "");
  const hash = crypto.createHash("sha1").update(text).digest("hex");
  let rep = {};
  try { rep = JSON.parse(fs.readFileSync(REPORT, "utf8")); } catch {}
  const published = rep.published || now;
  const modified = rep.hash === hash ? rep.modified || now : now;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${URL}#page`, name: h1, headline: h1, description: desc, url: URL, inLanguage: "ko-KR", datePublished: published, dateModified: modified,
        isPartOf: { "@type": "WebSite", name: "브랜드 아틀라스", url: `${ORIGIN}/` }, about: [{ "@type": "Thing", name: "브랜드의 역사" }, { "@type": "Thing", name: "상표" }, { "@type": "Thing", name: "로고" }],
        mainEntity: { "@id": `${URL}#brands` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "브랜드 아틀라스", item: `${ORIGIN}/` }, { "@type": "ListItem", position: 2, name: "브랜드 연대기", item: URL }] },
      { "@type": "ItemList", "@id": `${URL}#brands`, name: "브랜드 연대기에 나오는 브랜드", itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: brands.length,
        itemListElement: brands.map(({ b, first }, i) => ({ "@type": "ListItem", position: i + 1, name: `${yearLabel(first)} ${displayName(b)}`, url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) },
    ],
  });
  const ogImage = fs.existsSync(path.join(ROOT, "images/history/og.png")) ? `${ORIGIN}/images/history/og.png?v=${fileVer("images/history/og.png")}` : undefined;
  const extraHead = `<link rel="stylesheet" href="${P}assets/brand-history.css?v=${fileVer("assets/brand-history.css")}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">${ogImage ? `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(`${h1} — 분야별 연대기 격자`)}"><meta name="twitter:image" content="${ogImage}">` : ""}<meta property="article:modified_time" content="${modified}">`;
  const html = page({ title, desc, canonical: URL, bodyHtml: body, jsonLd, active: "history", prefix: P, ogImage, extraHead });
  const changed = writeIfChanged(path.join(ROOT, "brand-history", "index.html"), html);

  // 사전과 연도 대조 — 창업 분야(G·K)에서 연대기 연도와 사전의 설립연도(검수된 근거만)가 다르면 적어 둔다. 고치지 않는다.
  const yearDiffs = linked.filter((e) => "GK".includes(e.l)).map((e) => ({ e, fy: foundedYear(e.brand) })).filter(({ e, fy }) => fy && fy !== e.y)
    .map(({ e, fy }) => ({ year: e.y, title: e.t, slug: urlSlugOf(e.brand), atlasFounded: fy }));
  fs.writeFileSync(REPORT, JSON.stringify({ published, modified, hash, entries: entries.length, linkedEntries: linked.length, brands: brands.length, yearDiffs }, null, 1) + "\n");
  console.log(`brand-history/index.html: ${entries.length} entries, ${linked.length} linked → ${brands.length} brands, year diffs ${yearDiffs.length}${changed ? "" : " (unchanged)"}`);
  return { entries, brands, eras, lanes };
}

if (import.meta.url === `file://${process.argv[1]}`) buildHistory();
