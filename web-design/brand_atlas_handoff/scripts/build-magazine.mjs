// 아틀라스 매거진 빌더 — content/magazine/*.md → magazine/index.html, magazine/<slug>.html
//
// 브랜드 여러 곳을 한 주제로 엮는 기획 기사다. 브랜드 페이지가 사전 항목이라면 매거진은 그 항목들을 가로질러 읽는다.
// 사실은 브랜드 데이터에서만 가져오고(verifyArticle — 근거 없는 숫자가 있으면 빌드 중단), 로고·색상도 데이터의 값만 쓴다.
//
// 순서: build-brand-pages → build-magazine → build-seo-extras (sitemap·RSS·홈이 기사 목록을 읽는다).
// Usage: node scripts/build-magazine.mjs [--preview]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, displayName, koreanName, latinName, urlSlugOf } from "./lib/brand-seo.mjs";
import { esc, page, breadcrumbs } from "./lib/page-shell.mjs";
import { hasLogo } from "./lib/archive.mjs";
import { assetHref, brandHref } from "./lib/markup.mjs";
import { loadArticles, verifyArticle, referencedSlugs, readingMinutes } from "./lib/magazine.mjs";

const PREVIEW = process.argv.includes("--preview"); // 공개일 전 원고까지 로컬에서 미리 본다(배포 금지)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const bySlug = new Map();
for (const b of DATA.allBrands) { bySlug.set(urlSlugOf(b), b); if (b.slug && !bySlug.has(b.slug)) bySlug.set(b.slug, b); }
const OUT = path.join(ROOT, "magazine");
const P = "../";
export const MAG_CSS_V = "20260913e";
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,600..900&family=Hahmlet:wght@300..700&display=swap">`;
const extraHead = `${FONTS}<link rel="stylesheet" href="${P}magazine.css?v=${MAG_CSS_V}">`;

const writeIfChanged = (file, html) => {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === html) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return true;
};
const dotDate = (d) => d.replace(/-/g, ".");
const issueLabel = (n) => `No.${String(n).padStart(2, "0")}`;
// 호 표기는 월간(2026년 9월호). 호의 달은 그 호 첫 기사의 공개일에서 읽는다.
const monthOf = (date) => `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`;

// ─── 본문 렌더 ─────────────────────────────────────────────────────────────
function inline(s) {
  return esc(s).replace(/\[([^\]]+)\]\(brand:([a-z0-9-]+)\)/g, (_, t, slug) => {
    const b = bySlug.get(slug);
    return `<a class="bl" href="${brandHref(b, P)}">${t}</a>`;
  });
}

function logoTile(b) {
  const name = displayName(b);
  const img = hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="${esc(name)} 로고" loading="lazy" decoding="async">` : `<span class="wm">${esc(latinName(b) || name)}</span>`;
  return `<a class="mount" href="${brandHref(b, P)}"><span class="art">${img}</span><span class="cap">${esc(koreanName(b) || latinName(b) || b.name)}</span></a>`;
}

function renderBody(a, counter) {
  const blocks = a.body.split(/\n{2,}/);
  const out = [];
  for (const blk of blocks) {
    const t = blk.trim();
    if (!t) continue;
    if (t.startsWith("## ")) { const h = t.slice(3).trim(); out.push(`<h2 id="s${out.length}">${inline(h)}</h2>`); continue; }
    const cmd = /^::(plate|palette|quote)\s+([^|]+?)(?:\s*\|\s*([\s\S]+))?$/.exec(t);
    if (cmd) {
      const [, kind, arg, cap = ""] = cmd;
      if (kind === "plate") {
        const bs = arg.split(",").map(s => bySlug.get(s.trim())).filter(Boolean);
        const n = ++counter.plate;
        out.push(`<figure class="plate n${Math.min(bs.length, 6)}"><div class="board">${bs.map(logoTile).join("")}</div><figcaption><span class="pl">Plate ${n}</span>${inline(cap)}</figcaption></figure>`);
      } else if (kind === "palette") {
        const b = bySlug.get(arg.trim());
        const cols = (b.brandArchive?.colors || []).map(c => c.hex).filter(Boolean);
        const n = ++counter.plate;
        out.push(`<figure class="swatch"><div class="strip">${cols.map(h => `<span style="--c:${esc(h)}"><i>${esc(h)}</i></span>`).join("")}</div><figcaption><span class="pl">Plate ${n}</span>${inline(cap)}</figcaption></figure>`);
      } else {
        out.push(`<blockquote class="pull"><p>${inline(arg.trim())}</p>${cap ? `<cite>${inline(cap.trim())}</cite>` : ""}</blockquote>`);
      }
      continue;
    }
    out.push(`<p>${inline(t.replace(/\n/g, " "))}</p>`);
  }
  return out.join("\n");
}

const castOf = (a) => referencedSlugs(a).map(s => bySlug.get(s)).filter(Boolean);
const paletteOf = (bs, max = 28) => [...new Set(bs.flatMap(b => (b.brandArchive?.colors || []).map(c => String(c.hex || "").toUpperCase())).filter(h => /^#[0-9A-F]{6}$/.test(h)))].slice(0, max);

function articleJsonLd(a, url, cast) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: a.title, description: a.dek, url, datePublished: a.date, dateModified: a.modified || a.date, inLanguage: "ko-KR",
      author: { "@type": "Organization", name: "브랜드 아틀라스 편집부", url: `${ORIGIN}/pages/about.html` },
      publisher: { "@type": "Organization", name: "브랜드 아틀라스", url: `${ORIGIN}/`, logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/objects/brand_atlas_logo_mark.png` } },
      isPartOf: { "@type": "PublicationIssue", issueNumber: String(a.issue), isPartOf: { "@type": "Periodical", name: "아틀라스 매거진" } },
      mentions: cast.map(b => ({ "@type": "Brand", name: koreanName(b) || b.name, url: `${ORIGIN}/brand/${encodeURIComponent(urlSlugOf(b))}.html` })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "브랜드 아틀라스", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "매거진", item: `${ORIGIN}/magazine/` },
      { "@type": "ListItem", position: 3, name: a.title, item: url }] },
  ] });
}

// ─── 빌드 ─────────────────────────────────────────────────────────────────
const articles = loadArticles(ROOT, { includeFuture: PREVIEW });
const upcoming = PREVIEW ? [] : loadArticles(ROOT, { includeFuture: true }).filter(a => !articles.includes(a) && !articles.some(x => x.slug === a.slug));
let failed = 0;
for (const a of articles) {
  const errs = verifyArticle(a, bySlug);
  if (errs.length) { failed++; console.error(`✗ ${a.slug}\n  ${errs.join("\n  ")}`); }
}
if (failed) { console.error(`원고 ${failed}건이 검증을 통과하지 못했습니다 — 매거진을 빌드하지 않습니다.`); process.exit(1); }

const written = [];
articles.forEach((a, i) => {
  const cast = castOf(a);
  const url = `${ORIGIN}/magazine/${a.slug}.html`;
  const prev = articles[i - 1], next = articles[i + 1];
  const counter = { plate: 0 };
  const hero = (a.cover || []).map(s => bySlug.get(s)).filter(Boolean);
  const band = paletteOf(cast);
  const body = `<article class="mag-article">
<header class="opener"><div class="mw">${breadcrumbs([{ name: "브랜드 아틀라스", href: `${P}index.html` }, { name: "매거진", href: "./" }, { name: a.title }])}
<p class="eyebrow"><a href="./">Atlas Magazine</a><span>${issueLabel(a.issue)}</span><span>${esc(a.kicker)}</span></p>
<h1>${esc(a.title)}</h1><p class="dek">${esc(a.dek)}</p>
<p class="byline"><span>브랜드 아틀라스 편집부</span><time datetime="${a.date}">${dotDate(a.date)}</time><span>${readingMinutes(a)}분 읽기</span><span>브랜드 ${cast.length}곳</span></p></div>
${hero.length ? `<div class="hero-board mw-wide" style="--n:${hero.length}">${hero.map(logoTile).join("")}</div>` : ""}
${band.length >= 6 ? `<div class="band" aria-hidden="true">${band.map(h => `<span style="--c:${h}"></span>`).join("")}</div>` : ""}
</header>
<div class="mw article-grid"><div class="prose">${renderBody(a, counter)}
<aside class="source"><h2>이 글의 근거</h2><p>이 글의 사실은 브랜드 아틀라스에 수록된 각 브랜드 항목에서 가져왔습니다. 연도·인명·색상값은 항목 본문과 아카이브 자료에 기록된 값만 썼습니다. 자세한 내용은 아래 브랜드 페이지에서 확인할 수 있습니다.</p></aside></div>
<aside class="cast" aria-label="이 글에 나온 브랜드"><h2>이 글의 브랜드</h2><ul>${cast.map(b => `<li><a href="${brandHref(b, P)}">${hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="" loading="lazy" decoding="async">` : `<span class="dot"></span>`}<span>${esc(displayName(b))}</span></a></li>`).join("")}</ul></aside></div>
<nav class="next mw" aria-label="다른 기사">${prev ? `<a class="prev" href="${prev.slug}.html"><small>이전 기사</small><b>${esc(prev.title)}</b></a>` : "<span></span>"}${next ? `<a class="nxt" href="${next.slug}.html"><small>다음 기사</small><b>${esc(next.title)}</b></a>` : `<a class="nxt" href="./"><small>이번 호</small><b>${issueLabel(a.issue)} 목차로</b></a>`}</nav>
</article>`;
  const ogImage = hero[0] && hasLogo(hero[0]) ? `${ORIGIN}/${String(hero[0].logo).replace(/^\.?\//, "")}` : undefined;
  const html = page({ title: `${a.title} | 아틀라스 매거진`, desc: a.dek, canonical: url, bodyHtml: body, jsonLd: articleJsonLd(a, url, cast), active: "magazine", ogType: "article", ogImage, extraHead, bodyClass: "mag" });
  if (writeIfChanged(path.join(OUT, `${a.slug}.html`), html)) written.push(a.slug);
});

// 이번 호(목차) 페이지
if (articles.length) {
  const issue = Math.max(...articles.map(a => a.issue));
  const inIssue = articles.filter(a => a.issue === issue);
  const cover = inIssue[0];
  const coverCast = (cover.cover || []).map(s => bySlug.get(s)).filter(Boolean);
  const band = paletteOf(inIssue.flatMap(castOf), 40);
  const url = `${ORIGIN}/magazine/`;
  const card = (a, i) => { const c = castOf(a).filter(hasLogo).slice(0, 4); return `<a class="story s${i}" href="${a.slug}.html"><span class="no">${String(a.order).padStart(2, "0")}</span><span class="k">${esc(a.kicker)}</span><b>${esc(a.title)}</b><p>${esc(a.dek)}</p><span class="logos">${c.map(b => `<img src="${assetHref(b.logo, P)}" alt="" loading="lazy" decoding="async">`).join("")}</span></a>`; };
  const body = `<section class="cover"><div class="mw-wide">
<p class="masthead" aria-label="아틀라스 매거진"><span>Atlas</span><span>Magazine</span></p>
<p class="issue-line"><span class="red">${issueLabel(issue)}</span><span>${monthOf(cover.date)}호</span><span>브랜드 아틀라스가 만드는 브랜드 읽기</span><time datetime="${cover.date}">${dotDate(cover.date)} 발행</time></p>
<a class="cover-story" href="${cover.slug}.html"><div class="cs-text"><span class="k">커버 스토리</span><h1>${esc(cover.title)}</h1><p>${esc(cover.dek)}</p><span class="go">기사 읽기</span></div><div class="cs-board">${coverCast.slice(0, 9).map(b => `<span class="mount"><span class="art">${hasLogo(b) ? `<img src="${assetHref(b.logo, P)}" alt="${esc(displayName(b))} 로고">` : `<span class="wm">${esc(latinName(b) || b.name)}</span>`}</span></span>`).join("")}</div></a>
${band.length >= 6 ? `<div class="band tall" role="img" aria-label="이번 호에 나온 브랜드의 실제 색상 ${band.length}가지"><span class="band-label">이번 호의 색 — 기사에 나온 브랜드 팔레트 ${band.length}색</span>${band.map(h => `<span style="--c:${h}" title="${h}"></span>`).join("")}</div>` : ""}
</div></section>
<section class="toc-sec"><div class="mw-wide"><h2 class="sec-h"><span>In this issue</span>이번 호</h2><div class="stories">${inIssue.map((a, i) => card(a, i)).join("")}</div>${upcoming.filter(a => a.issue === issue).length ? `<ol class="upcoming">${upcoming.filter(a => a.issue === issue).map(a => `<li><time datetime="${a.date}">${dotDate(a.date).slice(5)} 공개</time><b>${esc(a.title)}</b></li>`).join("")}</ol>` : ""}</div></section>
<section class="about-mag"><div class="mw-wide"><h2>아틀라스 매거진은</h2><p>브랜드 아틀라스의 브랜드 항목을 가로질러 읽는 기획 지면입니다. 한 브랜드의 사전 항목으로는 보이지 않는 흐름을 여러 브랜드를 나란히 놓고 봅니다. 누가 그렸는지, 왜 이름을 바꿨는지, 어떤 색을 골랐는지 같은 것들입니다. 사실은 수록된 브랜드 항목에 기록된 것만 씁니다.</p></div></section>`;
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "아틀라스 매거진", url, inLanguage: "ko-KR", hasPart: inIssue.map(a => ({ "@type": "Article", headline: a.title, url: `${ORIGIN}/magazine/${a.slug}.html` })) });
  const html = page({ title: `아틀라스 매거진 ${issueLabel(issue)} — ${cover.title} | 브랜드 아틀라스`, desc: `${monthOf(cover.date)}호. ${inIssue.map(a => a.title).join(" · ")}`, canonical: url, bodyHtml: body, jsonLd, active: "magazine", extraHead, bodyClass: "mag mag-index" });
  if (writeIfChanged(path.join(OUT, "index.html"), html)) written.push("index");
}
// 원고가 사라진 기사 파일 정리
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f.endsWith(".html") && f !== "index.html" && !articles.some(a => `${a.slug}.html` === f)) fs.rmSync(path.join(OUT, f));
console.log(`magazine: 기사 ${articles.length}건, 갱신 ${written.length}건${written.length ? ` (${written.join(", ")})` : ""}`);
