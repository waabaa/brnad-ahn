// 아카이브 등급·한글 색인 공용 유틸 (빌더·QA 공용).
//
// 등급(archiveTier)은 데이터에서 매번 계산한다 — 저장하지 않는다. 로고가 채워지거나
// 한글 표기가 검증되면 등급이 자동으로 올라가야 하기 때문이다.
//
//   core      : 한글 표기 + 로고 + 본문 800자 이상 — 홈·허브 상단 노출
//   standard  : 한글 표기 또는 로고 중 하나 이상 — 목록 노출
//   directory : 한글 표기 없음 + 로고 없음 — noindex, 목록·홈·sitemap·llms 제외
//
// 한글 표기 없는 브랜드(2026-09 실측 749건)의 절반은 해외 음반사·지역 소매점 스크랩이다.
// 한글 사이트에서 한글 표기도 로고도 없는 항목은 검색 유입이 없고 아카이브 품질만
// 깎는다. 삭제하지 않는 이유는 URL이 이미 색인·리다이렉트 그래프에 들어 있어서다.

import { koreanName, latinName, bodyTextLength, urlSlugOf } from "./brand-seo.mjs";

export const isRealAsset = (src) => !!src && !String(src).includes("brand_atlas_logo_mark") && !String(src).startsWith("data:");

export function hasLogo(b) {
  return isRealAsset(b.logo);
}

export function hasKoreanName(b) {
  return !!koreanName(b);
}

export function archiveTier(b) {
  const ko = hasKoreanName(b);
  const logo = hasLogo(b);
  // publicReady=false(구 파이프라인의 thin 표시)는 쓰지 않는다 — 도이치 그라모폰·컬럼비아 레코드·
  // 워너 뮤직 그룹처럼 한글 표기와 로고가 다 있는 브랜드 156건을 디렉토리로 떨어뜨렸다(2026-09-07).
  if (!ko && !logo) return "directory";
  if (ko && logo && bodyTextLength(b) >= 800) return "core";
  return "standard";
}

export const isDirectory = (b) => archiveTier(b) === "directory";

// 색인 제외는 등급이 아니라 본문 분량으로 가른다. 디렉토리 등급은 목록·홈·llms에서 빼는
// 기준이고, 그 안에서도 읽을 내용이 있는 페이지는 색인·sitemap에 남긴다(2026-09-08).
// 등급만으로 noindex를 걸면 이미 색인·301 그래프에 들어간 URL이 교체되지 못한 채 남는다.
export const isNoindex = (b) => isDirectory(b) && bodyTextLength(b) < 800;
export const isListed = (b) => !isDirectory(b);

/** 목록 정렬 점수 — 로고·한글·본문·등급. 높은 순. */
export function listingScore(b) {
  let s = 0;
  if (hasLogo(b)) s += 40;
  if (hasKoreanName(b)) s += 30;
  s += Math.min(30, Math.floor(bodyTextLength(b) / 100));
  if (Array.isArray(b.timeline) && b.timeline.length) s += 6;
  if (Array.isArray(b.logoHistory) && b.logoHistory.length > 1) s += 6;
  if (b.entityLinks) s += 6;
  if (b.wikidata) s += 4;
  const tier = String(b.tier || "");
  if (tier.startsWith("A_")) s += 20; else if (tier.startsWith("B_")) s += 10;
  s += Number(b.rating || 0) * 2;
  return s;
}

export const byScore = (a, b) => listingScore(b) - listingScore(a) || sortKey(a).localeCompare(sortKey(b), "ko");

// ─── 가나다 색인 ─────────────────────────────────────────────────────────────
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
// 색인 헤더는 된소리를 예사소리에 합친다(ㄲ→ㄱ). 사전 관행과 같다.
const CHO_GROUP = { "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ" };
export const GANADA_KEYS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export const ALPHA_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function chosungOf(ch) {
  const code = ch.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return CHO[Math.floor(code / 588)];
}

/** 초성 문자열 — 검색 인덱스용("구찌"→"ㄱㅉ"). 한글이 아닌 글자는 그대로. */
export function chosungString(text) {
  let out = "";
  for (const ch of String(text || "")) out += chosungOf(ch) || ch;
  return out;
}

/** 색인 표제어 — 한글 표기 우선, 없으면 원어. */
export function sortKey(b) {
  return String(koreanName(b) || latinName(b) || b.name || "").trim();
}

/** 색인 그룹 키: ㄱ~ㅎ / A~Z / 0-9 / 기타. */
export function indexKey(b) {
  const name = sortKey(b);
  const first = name[0] || "";
  const cho = chosungOf(first);
  if (cho) return CHO_GROUP[cho] || cho;
  if (/[A-Za-z]/.test(first)) return first.toUpperCase();
  if (/[0-9]/.test(first)) return "0-9";
  return "기타";
}

/**
 * 색인 그룹. 한글 표기와 원어 표기가 모두 있는 브랜드는 두 색인에 다 싣는다 — 초성(ㅇ: 오픈AI)과
 * 원어 첫 글자(O: OpenAI). 한쪽에만 두면 다른 표기로 찾는 사람에게는 없는 브랜드가 된다(표기 병기 규칙과 같은 이유).
 * 알파벳 그룹 안에서는 원어 기준으로 정렬한다.
 */
export function groupByIndex(brands) {
  const groups = new Map();
  const put = (k, b) => { if (!groups.has(k)) groups.set(k, []); if (!groups.get(k).includes(b)) groups.get(k).push(b); };
  for (const b of brands) {
    put(indexKey(b), b);
    const latin = String(latinName(b) || "").trim();
    if (koreanName(b) && /^[A-Za-z]/.test(latin)) put(latin[0].toUpperCase(), b);
  }
  const alphaKey = (b) => String(latinName(b) || sortKey(b)).trim();
  for (const [k, arr] of groups) {
    if (ALPHA_KEYS.includes(k)) arr.sort((a, b) => alphaKey(a).localeCompare(alphaKey(b), "en", { sensitivity: "base" }));
    else arr.sort((a, b) => sortKey(a).localeCompare(sortKey(b), "ko"));
  }
  const order = [...GANADA_KEYS, ...ALPHA_KEYS, "0-9", "기타"];
  return order.filter(k => groups.has(k)).map(k => [k, groups.get(k)]);
}

export { urlSlugOf };
