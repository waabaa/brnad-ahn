// 브랜드 탄생일(설립 연월일) — 근거 수집·판정 공용 로직.
// 일괄 보강(enrich-founding-dates.mjs)과 신규 수록(import-wikidata-brands.mjs)이 같이 쓴다.
//
// 근거는 세 가지뿐이다. 날짜를 추정하거나 생성하지 않는다(CLAUDE.md §2).
//   wikidata  P571 값 중 정밀도 10(월)·11(일)
//   ko/enwiki 문서 첫 구역 정보상자의 설립·창립·founded·introduced 필드
//   text      브랜드 본문 문장 "YYYY년 M월 (D일) … 설립/창립/창업/세워/출범/탄생/개업"
//
// 판정 decideFounded():
//   ① 사이트에 이미 표시되는 설립 연도(foundedYear)가 있으면 그 연도의 후보만 쓴다 — 연도와 날짜가 어긋나게 보이지 않게
//   ② 남은 후보의 월이 둘 이상으로 갈리면 채택하지 않는다(충돌)
//   ③ 일은 일 단위 후보끼리 일치할 때만 싣고, 갈리면 월까지만 싣는다

export const UA = "brandatlas-bot/1.0 (https://brandatlas.co.kr)";

const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, "0");
const okYMD = (y, m, d) => y >= 1000 && y <= 2100 && m >= 1 && m <= 12 && (!d || (d >= 1 && d <= 31));

/** Wikidata time 스냅 값 → 후보. 연도 정밀도(9 이하)는 버린다. */
export function wikidataCandidates(claims) {
  const out = [];
  for (const c of (claims && claims.P571) || []) {
    if (c.rank === "deprecated") continue;
    const v = c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
    if (!v || !v.time || v.precision < 10) continue;
    const m = /^\+?(\d{4})-(\d{2})-(\d{2})/.exec(v.time);
    if (!m) continue;
    const y = +m[1], mo = +m[2], d = v.precision >= 11 ? +m[3] : 0;
    if (!okYMD(y, mo, d) || mo === 0) continue;
    out.push({ y, m: mo, d: d || null, source: "wikidata", ref: "P571", preferred: c.rank === "preferred" });
  }
  // preferred 순위가 있으면 그것만 본다(옛 값·법인 재설립 값이 normal로 남아 있는 경우).
  return out.some(c => c.preferred) ? out.filter(c => c.preferred) : out;
}

const INFOBOX_FIELDS = {
  ko: /^(설립|설립일|설립 ?연도|창립|창립일|창업|창업일|출범|출범일|개업|founded|foundation|established)$/i,
  en: /^(founded|foundation|established|formation|introduced)$/i,
};

/** 날짜 문자열(템플릿·영문·한글) 하나에서 연월일. 연도가 둘 이상 나오면 모호하므로 null. */
export function parseDateValue(raw) {
  let s = String(raw || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<ref[^>]*\/>/gi, " ")
    .replace(/<ref[\s\S]*?<\/ref>/gi, " ")
    .replace(/\{\{(?:efn|refn|sfn|r|cite)[^{}]*\}\}/gi, " ");
  const years = new Set((s.match(/(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)/g) || []));
  if (years.size !== 1) return null;
  let m = /\{\{\s*(?:start[ _]date(?:[ _]and[ _](?:age|years ago))?|시작[ _]날짜(?:와[ _]나이)?|founded)\s*\|(?:[a-z]+=[^|}]*\|)*\s*(\d{4})\s*\|\s*(\d{1,2})\s*(?:\|\s*(\d{1,2}))?/i.exec(s);
  if (m) return { y: +m[1], m: +m[2], d: m[3] ? +m[3] : null };
  s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1");
  m = /(\d{4})\s*년\s*(\d{1,2})\s*월(?:\s*(\d{1,2})\s*일)?/.exec(s);
  if (m) return { y: +m[1], m: +m[2], d: m[3] ? +m[3] : null };
  m = /(\d{4})-(\d{2})(?:-(\d{2}))?(?!\d)/.exec(s);
  if (m) return { y: +m[1], m: +m[2], d: m[3] ? +m[3] : null };
  m = /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.?,?\s+(\d{4})/i.exec(s);
  if (m) return { y: +m[3], m: EN_MONTHS[m[2].toLowerCase()], d: +m[1] };
  m = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.?\s+(?:(\d{1,2})(?:st|nd|rd|th)?,?\s+)?(\d{4})/i.exec(s);
  if (m) return { y: +m[3], m: EN_MONTHS[m[1].toLowerCase()], d: m[2] ? +m[2] : null };
  return null;
}

/** 정보상자 wikitext(문서 첫 구역)에서 설립 필드 후보. */
export function infoboxCandidates(wikitext, lang) {
  const out = [];
  const re = /^\s*\|\s*([^=|\n]+?)\s*=\s*(.*)$/gm;
  let m;
  while ((m = re.exec(String(wikitext || "")))) {
    if (!INFOBOX_FIELDS[lang].test(m[1].trim())) continue;
    const v = parseDateValue(m[2]);
    if (v && okYMD(v.y, v.m, v.d)) out.push({ ...v, source: `${lang}wiki`, ref: m[1].trim() });
  }
  return out;
}

// 술어로 끝나는 경우만("창업자"·"설립자" 같은 명사는 제외).
const TEXT_RE = /(\d{4})년\s*(\d{1,2})월(?:\s*(\d{1,2})일)?[^.!?\n]{0,30}?(?:(?:설립|창립|창업|출범|탄생|개업)(?:했|하였|되었|됐|된|한|되어|하여|해)|세웠|세워졌|문을 열)/g;

/** 브랜드 본문(definition·summary·sections) 문장 후보. */
export function textCandidates(brand) {
  const parts = [brand.definition, brand.summary];
  const secs = brand.sections || {};
  for (const s of Array.isArray(secs) ? secs : Object.values(secs)) parts.push(typeof s === "string" ? s : (s && (s.body || s.text || s.content)) || "");
  const out = [];
  for (const t of parts) {
    for (const m of String(t || "").matchAll(TEXT_RE)) {
      const y = +m[1], mo = +m[2], d = m[3] ? +m[3] : null;
      if (okYMD(y, mo, d)) out.push({ y, m: mo, d, source: "text", ref: m[0].slice(0, 60), weak: true });
    }
  }
  return out;
}

/**
 * 후보 → brand.founded 또는 null(+사유).
 * year: 사이트가 이미 표시하는 설립 연도(foundedYear). 없으면 후보끼리의 일치만 본다.
 * textYears: 브랜드 본문에 나오는 연도 집합(brandTextYears) — 표시 연도가 없을 때 약한 근거의 교차 확인용.
 */
export function decideFounded(cands, year, textYears = null) {
  cands = [...cands];
  // 약한 근거(본문 문장, 제목 일치로 찾은 위키백과 문서)는 표시 연도와 맞아야만 쓴다 — 연도 확인 없이는 다른 회사·모기업 날짜일 수 있다.
  // 표시 연도가 없으면 브랜드 본문에 그 연도가 나올 때만 약한 근거를 쓴다(본문이 같은 해를 말하고 있다는 교차 확인).
  if (!year) cands = cands.filter(c => !c.weak || (c.source !== "text" && textYears && textYears.has(c.y)));
  if (!cands.length) return { founded: null, why: "후보 없음" };
  let pool = cands;
  if (year) {
    pool = cands.filter(c => c.y === year);
    if (!pool.length) return { founded: null, why: `표시 연도 ${year}와 다른 후보만 있음` };
  } else if (new Set(cands.map(c => c.y)).size > 1) {
    return { founded: null, why: "후보 연도 충돌" };
  }
  const months = new Set(pool.map(c => c.m));
  if (months.size > 1) return { founded: null, why: `월 충돌(${[...months].join("·")})` };
  const y = pool[0].y, mo = pool[0].m;
  const days = new Set(pool.filter(c => c.d).map(c => c.d));
  const d = days.size === 1 ? [...days][0] : null;
  const sources = [...new Set(pool.map(c => c.source))];
  return {
    founded: { date: d ? `${y}-${pad(mo)}-${pad(d)}` : `${y}-${pad(mo)}`, precision: d ? "day" : "month", sources },
    why: days.size > 1 ? "일 충돌 — 월까지만" : null,
  };
}

/** 위키백과 문서 첫 구역(정보상자 포함) wikitext. 없으면 "". */
export async function leadWikitext(lang, title, fetchImpl = fetch) {
  if (!title) return "";
  const url = `https://${lang}.wikipedia.org/w/api.php?action=parse&prop=wikitext&section=0&redirects=1&format=json&formatversion=2&page=${encodeURIComponent(title)}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetchImpl(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 4000 * attempt)); continue; }
      if (!res.ok) return "";
      const j = await res.json();
      return String(j?.parse?.wikitext || "");
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return "";
}

/** "YYYY-MM(-DD)" → 한국어 표기. */
export function foundedLabel(f) {
  if (!f || !f.date) return "";
  const [y, m, d] = f.date.split("-").map(Number);
  return d ? `${y}년 ${m}월 ${d}일` : `${y}년 ${m}월`;
}

/** 정보상자 웹사이트 도메인(www. 제거). 없으면 "". */
export function infoboxDomain(wikitext) {
  const m = /^\s*\|\s*(?:website|homepage|url|웹사이트|홈페이지)\s*=\s*(.*)$/im.exec(String(wikitext || ""));
  if (!m) return "";
  const d = /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i.exec(m[1].replace(/\{\{\s*(?:URL|url|공식 웹사이트|Official URL)\s*\|/, ""));
  return d ? d[1].toLowerCase() : "";
}
export const domainOf = (u) => { const d = /^(?:https?:\/\/)?(?:www\.)?([^/?#:]+)/i.exec(String(u || "").trim()); return d ? d[1].toLowerCase() : ""; };
export const isDisambiguation = (wt) => /\{\{\s*(?:동음이의|disambiguation|disambig|dab|hndis|geodis)\b/i.test(String(wt || ""));

/** 브랜드 본문(정의·요약·섹션)에 나오는 네 자리 연도. */
export function brandTextYears(brand) {
  const secs = brand.sections || {};
  const t = [brand.definition, brand.summary, ...(Array.isArray(secs) ? secs : Object.values(secs)).map(s => typeof s === "string" ? s : (s && s.body) || "")].join(" ");
  return new Set((t.match(/(?<!\d)(1[5-9]\d{2}|20[0-2]\d)(?=년)/g) || []).map(Number));
}
