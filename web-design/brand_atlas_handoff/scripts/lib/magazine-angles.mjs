// 매거진 자동 준비 — 기사 각도(여러 브랜드를 가로지르는 주제)와 근거 묶음을 데이터에서 만든다(2026-09-13).
//
// 각도는 전부 데이터 집계로 정한다. LLM은 여기서 만든 근거 묶음(evidence pack)만 보고 쓰므로,
// 근거가 빈약한 각도는 애초에 후보로 내지 않는다(브랜드 5곳 이상, 본문이 충실한 곳만).
//   studio   — 같은 디자인 스튜디오가 작업한 아이덴티티(brandArchive.designers)
//   origin   — 같은 기원 국가 × 같은 산업(countryOf × domainSlug)
//   decade   — 같은 산업에서 같은 연대에 설립된 브랜드(foundedYear)
//   rename   — 사명을 바꾼 기록이 있는 같은 산업의 브랜드
//   collect  — 테마 컬렉션(brand.collections)
// 이미 기사에 나온 브랜드(발행·예약·초안 모두)는 다시 쓰지 않는다(각도당 겹침 2곳까지 허용).
import { koreanName, latinName, countryOf, foundedYear, urlSlugOf, displayName } from "./brand-seo.mjs";
import { isListed, hasLogo } from "./archive.mjs";
import { COLLECTIONS } from "./collections.mjs";

const SECTION_KEYS = [["overview", "개요"], ["origin", "기원"], ["identity", "아이덴티티"], ["insights", "관점"], ["products", "제품"], ["current", "현재"]];
// 잡지다운 각도를 앞세운다(스튜디오·컬렉션 > 사명 > 기원 > 연대). '브랜드·비즈니스'는 여러 업종이 섞인 분류라 기원·연대 각도에서 뺀다.
const TYPE_WEIGHT = { studio: 1.35, collect: 1.2, rename: 1.1, origin: 1.0, decade: 0.9 };
const MIXED = new Set(["brand-business"]);
const COUNTRY_EN = { 한국: "korea", 미국: "usa", 일본: "japan", 영국: "uk", 프랑스: "france", 독일: "germany", 이탈리아: "italy", 스위스: "switzerland", 스웨덴: "sweden", 네덜란드: "netherlands", 캐나다: "canada", 스페인: "spain", 중국: "china", 덴마크: "denmark", 핀란드: "finland", 노르웨이: "norway", 벨기에: "belgium", 호주: "australia" };
const clip = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };
const richness = (b) => SECTION_KEYS.reduce((n, [k]) => n + Math.min(900, String(b.sections?.[k]?.body || "").length), 0);

/** 브랜드 한 곳의 근거 텍스트 — LLM 입력이자 숫자 검증의 대조 대상. */
export function evidenceOf(b) {
  const a = b.brandArchive;
  const head = `### slug: ${urlSlugOf(b)} | 이름: ${displayName(b)} | 산업: ${b.industry || ""} | 기원 국가: ${countryOf(b) || "미상"} | 설립: ${foundedYear(b) || "미상"}${hasLogo(b) ? " | 로고 있음" : ""}${(a?.colors || []).length ? " | 팔레트 있음" : ""}`;
  const lines = [head, `정의: ${clip(b.definition, 300)}`];
  for (const [k, label] of SECTION_KEYS) { const t = clip(b.sections?.[k]?.body, 650); if (t) lines.push(`${label}: ${t}`); }
  if (a) lines.push(`아카이브: 디자이너 ${(a.designers || []).join(", ") || "미상"} · 연도 ${a.year || "미상"}${(a.colors || []).length ? ` · 색상 ${(a.colors || []).map(c => c.hex).join(", ")}` : ""}`);
  return lines.join("\n");
}

export function pickAngles(data, { exclude = new Set(), want = 6 } = {}) {
  const B = data.allBrands.filter(b => isListed(b) && richness(b) >= 900);
  const fresh = (list) => list.filter(b => !exclude.has(urlSlugOf(b)));
  const cands = [];
  const push = (type, key, hint, members) => {
    const pool = fresh(members).sort((x, y) => (hasLogo(y) - hasLogo(x)) || richness(y) - richness(x)).slice(0, 8);
    if (pool.length < 5 || pool.filter(hasLogo).length < 3) return;
    cands.push({ type, key, hint, slugs: pool.map(urlSlugOf), score: Math.round(pool.reduce((n, b) => n + richness(b), 0) * (TYPE_WEIGHT[type] || 1)) });
  };
  const group = (keyFn) => { const m = new Map(); for (const b of B) { const k = keyFn(b); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(b); } return m; };

  for (const [d, list] of group(b => (b.brandArchive?.designers || [])[0])) {
    if (/,|Head of|Director/.test(d)) continue;
    push("studio", `studio-${d.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `디자인 스튜디오 ${d}가 작업한 브랜드 아이덴티티들 — 무엇을 공통으로 하고 무엇이 다른가`, list);
  }
  for (const [k, list] of group(b => countryOf(b) && COUNTRY_EN[countryOf(b)] && b.domainSlug && !MIXED.has(b.domainSlug) ? `${countryOf(b)}|${b.domainSlug}` : null)) {
    const [c, ind] = k.split("|");
    push("origin", `origin-${COUNTRY_EN[c]}-${ind}`, `${c}에서 시작한 ${list[0].industry || ind} 브랜드들 — 같은 뿌리, 다른 선택`, list);
  }
  for (const [k, list] of group(b => { const y = Number(foundedYear(b)); return y && b.domainSlug && !MIXED.has(b.domainSlug) ? `${Math.floor(y / 10) * 10}|${b.domainSlug}` : null; })) {
    const [dec, ind] = k.split("|");
    push("decade", `decade-${dec}-${ind}`, `${dec}년대에 문을 연 ${list[0].industry || ind} 브랜드들 — 같은 시대에 출발한 회사들은 지금 어디에 있나`, list);
  }
  const renamed = B.filter(b => /사명을 [^.]{0,40}(바꿨|변경)|개명|옛 사명|새 사명/.test(Object.values(b.sections || {}).map(s => s?.body || "").join(" ")));
  for (const [ind, list] of group(b => renamed.includes(b) ? b.domainSlug : null)) push("rename", `rename-${ind}`, `이름을 바꾼 ${list[0].industry || ind} 기업들 — 왜, 언제 간판을 바꿨나`, list);
  for (const c of COLLECTIONS) push("collect", `collect-${c.slug}`, `${c.name} — 이 주제로 묶인 브랜드들을 나란히 읽는다`, B.filter(b => (b.collections || []).includes(c.slug)));

  // 점수 순으로 고르되 각도끼리 브랜드가 겹치지 않게, 같은 유형은 두 개까지.
  cands.sort((a, b) => b.score - a.score);
  const picked = [], used = new Set(), perType = {};
  for (const c of cands) {
    if (picked.length >= want) break;
    if ((perType[c.type] || 0) >= 2) continue;
    const slugs = c.slugs.filter(s => !used.has(s));
    if (slugs.length < 5) continue;
    picked.push({ ...c, slugs: slugs.slice(0, 8) });
    slugs.forEach(s => used.add(s));
    perType[c.type] = (perType[c.type] || 0) + 1;
  }
  return picked;
}

export const nameForPrompt = (b) => koreanName(b) ? `${koreanName(b)}(${latinName(b) || b.name})` : (latinName(b) || b.name);
