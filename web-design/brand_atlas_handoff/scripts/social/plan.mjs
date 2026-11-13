// 기획·생성 — 하루 한 편. 시리즈를 고르고(성과 가중치) → 데이터에서 슬라이드를 만들고 → AI가 문구를 다듬고(검증 실패 시 규칙 문구)
// → 렌더(피드 JPEG, 릴스 요일은 9:16 MP4) → posts/<id>/post.json.
//
// 사실은 브랜드 데이터 밖으로 나가지 않는다(CLAUDE.md §2). AI 문구는 verifyCopy()로 근거에 없는 숫자·과장·이모지를 막고,
// 두 번 실패하면 정의문 문장을 그대로 쓰는 규칙 문구로 내려간다.
import fs from "node:fs";
import path from "node:path";
import { ROOT, SOCIAL_DIR, SERIES, SITE, listPosts, savePost, postDir, readJson, settings, seeded, generate, parseJsonBlock, verifyCopy, sentences, log, kstNow } from "./lib.mjs";
import { renderSlides, buildReel } from "./render.mjs";
import { koreanName, latinName, displayName, urlSlugOf, factRows } from "../lib/brand-seo.mjs";
import { hasLogo } from "../lib/archive.mjs";
import { loadHistory, yearLabel } from "../lib/brand-history.mjs";
import { loadArticles } from "../lib/magazine.mjs";

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/brand-atlas.json"), "utf8"));
const ALL = data.allBrands || [];
const bySlug = new Map(); for (const b of ALL) { bySlug.set(urlSlugOf(b), b); if (b.slug && !bySlug.has(b.slug)) bySlug.set(b.slug, b); }
const fameRaw = readJson(path.join(ROOT, "data/brand-fame.json"), {});
const fame = (b) => { const f = fameRaw[urlSlugOf(b)] ?? fameRaw[b.slug]; return typeof f === "object" ? f?.n || 0 : f || 0; };
const fileOk = (rel) => rel && !/brand_atlas_logo_mark/.test(rel) && fs.existsSync(path.join(ROOT, rel));
const ko = (b) => koreanName(b) || latinName(b) || b.name;
const overview = (b) => String(b.sections?.overview?.body || b.definition || b.summary || "");
const brandUrl = (b) => `${SITE}/brand/${encodeURIComponent(urlSlugOf(b))}.html`;
const formatUsd = (usd) => (usd >= 1e8 ? `${Math.round(usd / 1e8).toLocaleString("ko-KR")}억 달러` : `${Math.round(usd / 1e4).toLocaleString("ko-KR")}만 달러`);
const tagOf = (s) => String(s || "").replace(/[^0-9A-Za-z가-힣]/g, "");

// ── 시리즈별 슬라이드 ─────────────────────────────────────────────────────
// 각 빌더: (date, rnd, used:Set<subject>) → { subject, title, slides, evidence, link, copySlots, tags, bgm } | null
// copySlots: AI가 채울 본문 슬라이드 수(슬라이드 중 kind:"text", fill:true 인 자리).
const BUILD = {
  brand(date, rnd, used) {
    const pool = ALL.filter(b => hasLogo(b) && fileOk(b.logo) && koreanName(b) && overview(b).length >= 300 && !used.has(`brand:${urlSlugOf(b)}`))
      .sort((a, b) => fame(b) - fame(a)).slice(0, 400);
    if (!pool.length) return null;
    const b = pool[Math.floor(rnd() ** 2 * pool.length)];   // 유명 브랜드 쪽으로 기운 선택
    const rows = factRows(b).filter(r => !["원어 표기", "공식 사이트"].includes(r.label)).slice(0, 5).map(r => [r.label, r.value]);
    const colors = (b.brandArchive?.colors || []).filter(c => /^#[0-9a-f]{6}$/i.test(c.hex || "")).slice(0, 4);
    const slides = [
      { kind: "cover", logo: b.logo, title: ko(b), en: latinName(b) !== ko(b) ? latinName(b) : "", lead: sentences(b.definition)[0]?.slice(0, 80) || "" },
      { kind: "text", fill: true }, { kind: "text", fill: true }, { kind: "text", fill: true },
      ...(rows.length >= 2 ? [{ kind: "facts", title: `${ko(b)} 한눈에`, rows, note: "브랜드 아틀라스 수록 자료 · 검증된 값만 표기" }] : []),
      ...(colors.length >= 2 ? [{ kind: "palette", title: `${ko(b)}의 색`, colors }] : []),
      { kind: "cta", title: `${ko(b)}의 로고와 역사 전체 보기`, body: "브랜드 아틀라스에 정의·연혁·로고 변천을 정리해 두었습니다.", url: `brandatlas.co.kr/brand/${urlSlugOf(b)}` },
    ];
    const evidence = [displayName(b), b.definition, overview(b), b.sections?.insights?.body || "", rows.map(r => r.join(": ")).join("\n")].join("\n");
    return { subject: `brand:${urlSlugOf(b)}`, title: displayName(b), slides, evidence, link: brandUrl(b), copySlots: 3,
      tags: [ko(b), latinName(b), String(b.industry || "").split("·")[0]], bgm: "warm_pad", brand: urlSlugOf(b) };
  },

  logo(date, rnd, used) {
    const pool = ALL.map(b => ({ b, logos: (b.logoHistory || []).filter(x => fileOk(x.src)).filter((x, i, a) => a.findIndex(y => y.src === x.src) === i) }))
      .filter(x => x.logos.length >= 3 && koreanName(x.b) && !used.has(`logo:${urlSlugOf(x.b)}`)).sort((a, b) => fame(b.b) - fame(a.b));
    if (!pool.length) return null;
    const { b, logos } = pool[Math.floor(rnd() * Math.min(pool.length, 40))];
    const pick = logos.slice(0, 5);
    const slides = [
      { kind: "cover", logo: fileOk(b.logo) ? b.logo : pick[0].src, label: "로고 변천", title: `${ko(b)}의 로고들`, en: latinName(b) !== ko(b) ? latinName(b) : "", lead: `브랜드 아틀라스에 보관한 ${ko(b)}의 BI·CI를 차례로 봅니다.` },
      ...pick.map(x => ({ kind: "logo", label: x.label || "로고", title: ko(b), src: x.src, caption: x.note || x.alt || "" })),
      { kind: "cta", title: `${ko(b)} 로고 아카이브 전체 보기`, url: `brandatlas.co.kr/brand/${urlSlugOf(b)}` },
    ];
    const evidence = [displayName(b), b.definition, overview(b), pick.map(x => `${x.label || ""} ${x.note || ""}`).join("\n")].join("\n");
    return { subject: `logo:${urlSlugOf(b)}`, title: `${displayName(b)} 로고 변천`, slides, evidence, link: `${brandUrl(b)}#bici`, copySlots: 0,
      tags: [ko(b), latinName(b), "로고", "로고디자인", "BI", "CI"], bgm: "bright_pad", brand: urlSlugOf(b) };
  },

  history(date, rnd, used) {
    const h = loadHistory(ROOT);
    const lanes = h.lanes.filter(l => h.entries.filter(e => e.l === l.key).length >= 6);
    if (!lanes.length) return null;
    for (let tries = 0; tries < 12; tries++) {
      const lane = lanes[Math.floor(rnd() * lanes.length)];
      const list = h.entries.filter(e => e.l === lane.key).sort((a, b) => a.y - b.y);
      const start = Math.floor(rnd() * (list.length - 4));
      const win = list.slice(start, start + 5);
      const subject = `history:${lane.key}:${win[0].y}`;
      if (used.has(subject)) continue;
      const slides = [
        { kind: "cover", label: "브랜드 연대기", word: `${yearLabel(win[0])} — ${yearLabel(win[win.length - 1])}`, title: `${lane.name}의 연대기`, lead: "인장에서 AI까지, 브랜드를 만든 순간들을 연도순으로 봅니다." },
        ...win.map(e => ({ kind: "event", label: lane.name, year: yearLabel(e), title: e.t, body: e.d || "", color: e.c })),
        { kind: "cta", title: "473개 기록을 한 화면에서", body: "10개 분야 × 8개 시대 격자로 정리한 브랜드 연대기", url: "brandatlas.co.kr/brand-history" },
      ];
      return { subject, title: `${lane.name}의 연대기`, slides, evidence: win.map(e => `${yearLabel(e)} ${e.t} ${e.d || ""}`).join("\n") + "\n473 10 8",
        link: `${SITE}/brand-history/`, copySlots: 0, tags: ["브랜드역사", lane.name, "디자인역사"], bgm: "corporate_upbeat" };
    }
    return null;
  },

  magazine(date, rnd, used) {
    const a = loadArticles(ROOT, {}).filter(x => x.date <= date && !used.has(`magazine:${x.slug}`)).sort((x, y) => y.date.localeCompare(x.date))[0];
    if (!a) return null;
    const lead = bySlug.get((a.cover || a.brands || [])[0]);
    const body = a.body.replace(/^::.*$/gm, "").replace(/\[([^\]]+)\]\(brand:[^)]+\)/g, "$1").replace(/^## /gm, "");
    const slides = [
      { kind: "cover", logo: lead && fileOk(lead.logo) ? lead.logo : "", label: `아틀라스 매거진 · ${a.kicker || ""}`, title: a.title, lead: a.dek.slice(0, 90) },
      { kind: "text", fill: true }, { kind: "text", fill: true }, { kind: "text", fill: true },
      { kind: "cta", title: "기사 전문 읽기", body: a.dek.slice(0, 80), url: `brandatlas.co.kr/magazine/${a.slug}` },
    ];
    return { subject: `magazine:${a.slug}`, title: a.title, slides, evidence: [a.title, a.dek, body].join("\n"), link: `${SITE}/magazine/${a.slug}.html`, copySlots: 3,
      tags: ["아틀라스매거진", "브랜드매거진", a.kicker], bgm: "warm_pad" };
  },

  numbers(date, rnd, used) {
    const groups = new Map();
    for (const b of ALL) {
      const r = b.secFacts?.revenue; if (!r || !b.secFacts.tickers?.length || !b.industry) continue;
      if (!groups.has(b.industry)) groups.set(b.industry, []); groups.get(b.industry).push(b);
    }
    const month = date.slice(0, 7);
    const ok = [...groups].filter(([ind, l]) => l.length >= 5 && !used.has(`numbers:${ind}:${month}`));
    if (!ok.length) return null;
    const [ind, list] = ok[Math.floor(rnd() * ok.length)];
    const top = list.sort((a, b) => b.secFacts.revenue.usd - a.secFacts.revenue.usd).slice(0, 5);
    const rows = top.map(b => ({ logo: fileOk(b.logo) ? b.logo : "", name: displayName(b), value: formatUsd(b.secFacts.revenue.usd),
      sub: `${b.secFacts.tickers[0]} · ${b.secFacts.revenue.end.slice(0, 4)}.${b.secFacts.revenue.end.slice(5, 7)} 결산` }));
    const slides = [
      { kind: "cover", word: "SEC 10-K", title: `${ind}, 매출로 줄 세우면`, lead: "미국 증권거래위원회에 낸 연차 보고서의 연 매출을 그대로 옮겼습니다." },
      { kind: "ranking", label: ind, title: "연 매출 상위 5곳", rows, note: "출처: SEC EDGAR 10-K(XBRL). 달러 금액은 반올림, 환율 환산 없음." },
      ...top.map(b => ({ kind: "text", label: displayName(b), title: formatUsd(b.secFacts.revenue.usd), body: sentences(b.definition)[0]?.slice(0, 120) || "" })).slice(0, 3),
      { kind: "cta", title: `${ind} 브랜드 전체 보기`, url: `brandatlas.co.kr/category/${top[0].domainSlug || ""}` },
    ];
    const evidence = top.map(b => `${displayName(b)} ${formatUsd(b.secFacts.revenue.usd)} ${b.secFacts.revenue.end} ${b.definition}`).join("\n") + "\n10-K 5";
    return { subject: `numbers:${ind}:${month}`, title: `${ind} 연 매출 상위 5곳`, slides, evidence, link: `${SITE}/category/${top[0].domainSlug || ""}.html`, copySlots: 0,
      tags: ["숫자로보는브랜드", ind, "미국주식", ...top.map(ko)], bgm: "corporate_upbeat" };
  },

  new(date, rnd, used) {
    const dir = path.join(ROOT, "content/brands");
    if (!fs.existsSync(dir)) return null;
    const since = new Date(Date.parse(date) - 7 * 86400e3).toISOString().slice(0, 10);
    const recs = fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => readJson(path.join(dir, f), null))
      .filter(r => r && String(r.importedAt || "") >= since && String(r.importedAt || "") < date);
    const brands = recs.map(r => bySlug.get(r.record?.urlSlug || r.record?.slug)).filter(b => b && hasLogo(b) && fileOk(b.logo)).sort((a, b) => fame(b) - fame(a)).slice(0, 6);
    if (brands.length < 4 || used.has(`new:${date}`)) return null;
    const slides = [
      { kind: "cover", label: "새로 수록한 브랜드", word: `+${brands.length}`, title: `이번 주 브랜드 아틀라스에 들어온 ${brands.length}곳`, lead: brands.map(ko).join(" · ") },
      ...brands.map(b => ({ kind: "logo", label: "새로 수록", title: displayName(b), src: b.logo, caption: sentences(b.definition)[0]?.slice(0, 110) || "" })),
      { kind: "cta", title: "사전에서 더 찾아보기", url: "brandatlas.co.kr" },
    ];
    return { subject: `new:${date}`, title: `새로 수록한 브랜드 ${brands.length}곳`, slides, evidence: brands.map(b => `${displayName(b)} ${b.definition}`).join("\n"),
      link: SITE + "/", copySlots: 0, tags: ["새브랜드", ...brands.map(ko)], bgm: "bright_pad" };
  },
};

// ── 문구 ──────────────────────────────────────────────────────────────────
function promptFor(spec, feedback) {
  return `너는 브랜드 사전 '브랜드 아틀라스'(brandatlas.co.kr)의 SNS 편집자다. 아래 "근거"만으로 오늘 게시물의 문구를 쓴다.
게시물 주제: ${spec.seriesName} — ${spec.title}

절대 규칙:
- 사실(연도·숫자·인명·지명·제품명·국가)은 근거에 있는 것만 쓴다. 근거에 없는 숫자는 한 개도 쓰지 않는다. 단위 환산 금지.
- 이모지·해시태그·불릿 금지. 과장어(혁신적, 획기적, 압도적, 폭발적, 전례 없는, 최고의, 역대급) 금지. 낚시성 문구 금지.
- 카드 문장은 평서형 '~다'. 게시글은 '~요/~습니다'를 섞은 담백한 존댓말.
${spec.copySlots ? `- slides: 카드뉴스 본문 ${spec.copySlots}장. 앞 장에서 뒤 장으로 이야기가 이어지게(기원 → 특징 → 지금 순 권장). label 6자 이내, title 22자 이내, body 70~110자.` : "- slides는 빈 배열로 둔다."}
- caption: 인스타그램 본문 350~650자. 첫 줄은 궁금증을 만드는 한 문장. 마지막 줄은 "전체 이야기는 프로필 링크의 브랜드 아틀라스에서 볼 수 있어요."
- threads: 스레드 글 120~260자. 사실 하나를 짧게 전하고 독자에게 묻는 질문 한 문장으로 끝낸다.
- facebook: 페이스북 글 250~450자.
${feedback ? `\n지난 시도의 문제(반드시 고칠 것): ${feedback}\n` : ""}
JSON만 출력: {"slides":[{"label":"","title":"","body":""}],"caption":"","threads":"","facebook":""}

근거:
${spec.evidence.slice(0, 6000)}`;
}

function checkCopy(c, spec) {
  const issues = [];
  if (!c || typeof c !== "object") return ["JSON 아님"];
  const slides = Array.isArray(c.slides) ? c.slides : [];
  if (slides.length < spec.copySlots) issues.push(`본문 카드 ${spec.copySlots}장 필요`);
  for (const s of slides.slice(0, spec.copySlots)) {
    if (!s.title || String(s.title).length > 26) issues.push("카드 제목 길이");
    if (!s.body || String(s.body).length > 130) issues.push("카드 본문 길이");
  }
  for (const k of ["caption", "threads", "facebook"]) if (!c[k] || String(c[k]).length < 60) issues.push(`${k} 없음`);
  if (String(c.threads || "").length > 420) issues.push("threads 길이");
  const all = [...slides.slice(0, spec.copySlots).flatMap(s => [s.label, s.title, s.body]), c.caption, c.threads, c.facebook].join("\n");
  issues.push(...verifyCopy(all, spec.evidence + "\n" + spec.slides.map(s => JSON.stringify(s)).join("\n")));
  return issues;
}

function ruleCopy(spec) {
  const pool = sentences(spec.evidence).filter(s => s.length >= 25 && s.length <= 120 && !verifyCopy(s, spec.evidence).length);
  const slides = pool.slice(0, spec.copySlots).map((s, i) => ({ label: `노트 ${i + 1}`, title: spec.title.slice(0, 22), body: s }));
  const lead = pool.slice(0, 3).join(" ");
  return {
    slides,
    caption: `${spec.title}\n\n${lead}\n\n전체 이야기는 프로필 링크의 브랜드 아틀라스에서 볼 수 있어요.`,
    threads: `${pool[0] || spec.title}`.slice(0, 250),
    facebook: `${spec.title}\n\n${lead}`,
  };
}

async function writeCopy(spec) {
  let feedback = "", last = [];
  for (let i = 0; i < 2; i++) {
    const r = await generate(promptFor(spec, feedback));
    if (!r.text) { last = [r.why]; break; }
    const c = parseJsonBlock(r.text);
    last = checkCopy(c, spec);
    if (!last.length) return { copy: c, source: "ai", issues: [] };
    feedback = last.slice(0, 6).join(", ");
    log(`  문구 검증 실패(${i + 1}): ${feedback}`);
  }
  return { copy: ruleCopy(spec), source: "rule", issues: last };
}

const utm = (link, pf, id) => `${link}${link.includes("?") ? "&" : "?"}utm_source=${pf}&utm_medium=social&utm_campaign=${id}`;

// ── 하루치 생성 ────────────────────────────────────────────────────────────
export async function planDay(date, { force = false, exclude = [] } = {}) {
  const s = settings();
  const id = `${date}`;
  const posts = listPosts();
  const today = posts.filter(p => p.date === date && p.status !== "discarded");
  if (today.length && !force) return today[0];
  const cutoff = new Date(Date.parse(date) - 180 * 86400e3).toISOString().slice(0, 10);
  const used = new Set([...posts.filter(p => p.date >= cutoff).map(p => p.subject), ...exclude]);
  const weights = readJson(path.join(SOCIAL_DIR, "weights.json"), {}).series || {};
  const yesterday = posts.filter(p => p.date < date).slice(-1)[0]?.series;
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const rnd = seeded(`${date}:${posts.filter(p => p.date === date).length}`);

  let names = Object.keys(BUILD).filter(n => !s.seriesOff.includes(n) && n !== yesterday && (n !== "new" || dow === 1));
  let spec = null;
  while (names.length && !spec) {
    const ws = names.map(n => Math.max(0.2, Number(weights[n] ?? 1)));
    let x = rnd() * ws.reduce((a, b) => a + b, 0), k = 0;
    while (x > ws[k] && k < ws.length - 1) x -= ws[k++];
    const name = names[k];
    const b = BUILD[name](date, rnd, used);
    if (b) spec = { ...b, series: name, seriesName: SERIES[name] };
    names = names.filter(n => n !== name);
  }
  if (!spec) { log(`  ${date}: 만들 수 있는 시리즈 없음`); return null; }

  const postId = `${id}-${spec.series}${posts.some(p => p.id === `${id}-${spec.series}`) ? `-${Date.now() % 100000}` : ""}`;
  log(`생성 ${postId} — ${spec.seriesName}: ${spec.title}`);
  const { copy, source, issues } = await writeCopy(spec);
  let k = 0;
  const slides = spec.slides.map(sl => {
    const base = { ...sl, kicker: spec.seriesName };
    if (!sl.fill) return base;
    const c = copy.slides?.[k++];
    return c ? { ...base, label: c.label, title: c.title, body: c.body } : null;
  }).filter(Boolean);

  const tags = [...new Set(["브랜드아틀라스", "브랜드스토리", ...spec.tags.map(tagOf)].filter(t => t && t.length >= 2))].slice(0, 10).map(t => `#${t}`);
  const dir = postDir(postId);
  const media = renderSlides(slides, dir, "feed");
  const format = s.reelDays.includes(dow) ? "reel" : "carousel";
  let video = null;
  if (format === "reel") video = buildReel(dir, renderSlides(slides, dir, "story"), spec.bgm);

  const post = {
    id: postId, date, publishAt: `${date}T${s.publishTime}:00+09:00`, series: spec.series, seriesName: spec.seriesName, subject: spec.subject,
    title: spec.title, brand: spec.brand || null, format, media, video, link: spec.link,
    captions: {
      instagram: `${copy.caption}\n\n${tags.join(" ")}`,
      threads: `${copy.threads}\n\n${utm(spec.link, "threads", postId)}`,
      facebook: `${copy.facebook}\n\n${utm(spec.link, "facebook", postId)}\n\n${tags.slice(0, 4).join(" ")}`,
    },
    platforms: Object.entries(s.platforms).filter(([, on]) => on).map(([k2]) => k2),
    copySource: source, checks: { issues }, status: "pending", createdAt: kstNow(), result: {}, metrics: {},
  };
  savePost(post);
  return post;
}

// CLI: node scripts/social/plan.mjs [--date YYYY-MM-DD] [--force]
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const i = process.argv.indexOf("--date");
  const { kstDate } = await import("./lib.mjs");
  const date = i > 0 ? process.argv[i + 1] : kstDate(1);
  const p = await planDay(date, { force: process.argv.includes("--force") });
  if (p) log(`→ ${p.id} ${p.format} 카드 ${p.media.length}장${p.video ? ` · 릴스 ${p.video.seconds}초` : ""} · 문구 ${p.copySource}`);
}
