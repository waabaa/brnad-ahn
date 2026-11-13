// 성과 — 발행 후 30일 동안 6시간마다 지표를 모으고, 시리즈별 참여율로 기획 가중치(weights.json)를 갱신하고,
// 주 1회 AI가 분석문을 쓴다(analysis.json). 분석문의 숫자는 표에 있는 것만 허용한다.
import path from "node:path";
import { SOCIAL_DIR, SERIES, listPosts, savePost, tokens, readJson, writeJson, generate, verifyCopy, log, kstNow } from "./lib.mjs";

const BASE = { instagram: "https://graph.instagram.com/v21.0", threads: "https://graph.threads.net/v1.0", facebook: "https://graph.facebook.com/v21.0" };
async function get(base, token, p, params) {
  const url = new URL(`${base}/${p}`);
  for (const [k, v] of Object.entries({ ...params, access_token: token })) url.searchParams.set(k, v);
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
const val = (d) => d?.values?.[0]?.value ?? d?.total_value?.value ?? 0;
async function insightsTry(base, token, id, sets) {
  for (const metrics of sets) {
    try { const j = await get(base, token, `${id}/insights`, { metric: metrics.join(",") }); return Object.fromEntries((j.data || []).map(d => [d.name, val(d)])); }
    catch (e) { if (metrics === sets[sets.length - 1]) throw e; }
  }
  return {};
}

const FETCH = {
  async instagram(id, t) {
    const m = await insightsTry(BASE.instagram, t.token, id, [["reach", "views", "likes", "comments", "shares", "saved", "total_interactions"], ["reach", "likes", "comments", "shares", "saved"]]);
    return { reach: m.reach || 0, views: m.views || 0, engagement: (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saved || 0), ...m };
  },
  async threads(id, t) {
    const m = await insightsTry(BASE.threads, t.token, id, [["views", "likes", "replies", "reposts", "quotes", "shares"], ["views", "likes", "replies", "reposts", "quotes"]]);
    return { reach: m.views || 0, views: m.views || 0, engagement: (m.likes || 0) + (m.replies || 0) + (m.reposts || 0) + (m.quotes || 0) + (m.shares || 0), ...m };
  },
  async facebook(id, t) {
    const out = {};
    try {
      const j = await get(BASE.facebook, t.token, id, { fields: "reactions.summary(total_count),comments.summary(total_count),shares" });
      Object.assign(out, { reactions: j.reactions?.summary?.total_count || 0, comments: j.comments?.summary?.total_count || 0, shares: j.shares?.count || 0 });
    } catch {}
    try { Object.assign(out, await insightsTry(BASE.facebook, t.token, id, [["post_impressions_unique", "post_clicks"], ["post_impressions_unique"]])); } catch {}
    return { reach: out.post_impressions_unique || 0, views: out.post_impressions_unique || 0, engagement: (out.reactions || 0) + (out.comments || 0) + (out.shares || 0), ...out };
  },
};

export async function collectInsights() {
  const tk = tokens(), now = Date.now();
  for (const p of listPosts()) {
    if (p.status !== "published") continue;
    for (const [pf, r] of Object.entries(p.result || {})) {
      if (!r?.id || !tk[pf]?.token || !FETCH[pf]) continue;
      const age = now - Date.parse(r.at || p.publishAt);
      const last = p.metrics?.[pf]?.at ? now - Date.parse(p.metrics[pf].at) : Infinity;
      if (age > 30 * 86400e3 || last < 6 * 3600e3) continue;
      try { p.metrics[pf] = { ...(await FETCH[pf](r.id, tk[pf])), at: kstNow() }; }
      catch (e) { p.metrics[pf] = { ...(p.metrics[pf] || {}), error: e.message.slice(0, 200), at: kstNow() }; }
      savePost(p);
    }
  }
  updateWeights();
}

const sum = (p, k) => Object.values(p.metrics || {}).reduce((a, m) => a + (Number(m?.[k]) || 0), 0);

/** 시리즈별 참여율(참여/도달)을 전체 평균 쪽으로 당겨(도달 500 상당) 가중치로 쓴다. 0.5~2.5. */
export function updateWeights() {
  const since = new Date(Date.now() - 60 * 86400e3).toISOString().slice(0, 10);
  const rows = listPosts().filter(p => p.status === "published" && p.date >= since && sum(p, "reach") > 0);
  const R = rows.reduce((a, p) => a + sum(p, "reach"), 0), E = rows.reduce((a, p) => a + sum(p, "engagement"), 0);
  const g = R ? E / R : 0;
  const series = {};
  for (const s of Object.keys(SERIES)) {
    const own = rows.filter(p => p.series === s);
    const r = own.reduce((a, p) => a + sum(p, "reach"), 0), e = own.reduce((a, p) => a + sum(p, "engagement"), 0);
    series[s] = g && own.length ? Math.min(2.5, Math.max(0.5, ((e + 500 * g) / (r + 500)) / g)) : 1;
    series[s] = Math.round(series[s] * 100) / 100;
  }
  writeJson(path.join(SOCIAL_DIR, "weights.json"), { updatedAt: kstNow(), posts: rows.length, globalRate: g, series });
}

/** 주간 분석문. 지표가 있는 게시물이 3편 이상이고 지난 분석이 7일 넘었을 때. */
export async function weeklyAnalysis({ force = false } = {}) {
  const file = path.join(SOCIAL_DIR, "analysis.json");
  const prev = readJson(file, null);
  if (!force && prev?.at && Date.now() - Date.parse(prev.at) < 7 * 86400e3) return prev;
  const since = new Date(Date.now() - 28 * 86400e3).toISOString().slice(0, 10);
  const rows = listPosts().filter(p => p.status === "published" && p.date >= since && sum(p, "reach") > 0)
    .map(p => ({ 날짜: p.date, 시리즈: p.seriesName, 형식: p.format === "reel" ? "릴스" : "카드", 주제: p.title, 도달: sum(p, "reach"), 참여: sum(p, "engagement"),
      참여율: `${(sum(p, "engagement") / Math.max(1, sum(p, "reach")) * 100).toFixed(1)}%`, ...Object.fromEntries(Object.entries(p.metrics || {}).map(([pf, m]) => [`${pf}_도달`, m.reach || 0])) }));
  if (rows.length < 3) return prev;
  const weights = readJson(path.join(SOCIAL_DIR, "weights.json"), {});
  const table = JSON.stringify(rows, null, 0);
  const prompt = `너는 브랜드 사전 '브랜드 아틀라스' SNS 운영 분석가다. 최근 4주 게시물 성과 표를 읽고 운영자에게 보고한다.
규칙: 숫자는 표와 가중치에 있는 값만 쓴다(새로 계산한 평균·비율 금지). 과장어·이모지 금지. 평서형 '~다'.
JSON만 출력: {"summary":"4~6문장 요약","good":["잘 된 점 2개"],"next":["다음 주에 바꿀 것 3개(시리즈·형식·주제 선택에 관한 구체적 제안)"]}
표: ${table}
시리즈 가중치(다음 기획 선택 확률에 곱해지는 값): ${JSON.stringify(weights.series || {})}`;
  const r = await generate(prompt, { maxTokens: 1500 });
  let out = null;
  const m = String(r.text || "").match(/\{[\s\S]*\}/);
  if (m) try { out = JSON.parse(m[0]); } catch {}
  const text = out ? [out.summary, ...(out.good || []), ...(out.next || [])].join("\n") : "";
  const issues = out ? verifyCopy(text, table + JSON.stringify(weights.series || {})) : [r.why || "분석 생성 실패"];
  const top = [...rows].sort((a, b) => b.참여 - a.참여)[0];
  const result = issues.length
    ? { at: kstNow(), source: "rule", summary: `최근 4주 ${rows.length}편을 발행했다. 참여가 가장 많았던 게시물은 ${top.날짜} ${top.시리즈} '${top.주제}'(도달 ${top.도달}, 참여 ${top.참여})다.`, good: [], next: [], issues }
    : { at: kstNow(), source: "ai", ...out };
  writeJson(file, result);
  log(`주간 분석 ${result.source}`);
  return result;
}
