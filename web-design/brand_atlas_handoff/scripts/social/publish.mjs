// 발행 — 인스타그램(캐러셀·릴스), 스레드(캐러셀·영상), 페이스북 페이지(사진 묶음·영상).
// 인스타그램·스레드 흐름은 officetel-social/bin/publish.mjs(컨테이너 생성 → 상태 대기 → publish)를 그대로 옮겼고,
// 릴스·영상과 페이스북 페이지를 더했다. 토큰은 어드민이 social-tokens.json(600)에 쓴다 — 코드·로그에 남기지 않는다.
import { MEDIA_BASE, listPosts, savePost, settings, tokens, saveTokens, log, kstNow } from "./lib.mjs";

const IG = "https://graph.instagram.com/v21.0";
const TH = "https://graph.threads.net/v1.0";
const FB = "https://graph.facebook.com/v21.0";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function call(base, token, method, p, params = {}) {
  const url = new URL(p.startsWith("http") ? p : `${base}/${p.replace(/^\//, "")}`);
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, access_token: token })) if (v !== undefined && v !== null) (method === "GET" ? url.searchParams : body).set(k, String(v));
  const r = await fetch(url, method === "GET" ? { signal: AbortSignal.timeout(60000) } : { method, body, signal: AbortSignal.timeout(120000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${method} ${url.pathname} ${r.status}: ${j.error?.message || JSON.stringify(j).slice(0, 200)}`);
  return j;
}
async function waitStatus(base, token, id, field, okVals, label, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const v = (await call(base, token, "GET", id, { fields: field }))[field];
    if (okVals.includes(v)) return;
    if (/ERROR|EXPIRED/.test(String(v))) throw new Error(`${label} ${v}`);
    await sleep(5000);
  }
  throw new Error(`${label} 처리 대기 시간 초과`);
}

const mediaUrl = (post, file) => `${MEDIA_BASE}/${post.id}/${file.replace(/\.(jpg|mp4)$/, "")}`;

async function instagram(post, t) {
  const tok = t.token, uid = t.userId || "me", cap = post.captions.instagram;
  let creation;
  if (post.format === "reel" && post.video) {
    creation = (await call(IG, tok, "POST", `${uid}/media`, { media_type: "REELS", video_url: mediaUrl(post, post.video.file), caption: cap, share_to_feed: true })).id;
    await waitStatus(IG, tok, creation, "status_code", ["FINISHED"], "IG 릴스", 120);
  } else {
    const kids = [];
    for (const f of post.media.slice(0, 10)) kids.push((await call(IG, tok, "POST", `${uid}/media`, { image_url: mediaUrl(post, f), is_carousel_item: true })).id);
    for (const k of kids) await waitStatus(IG, tok, k, "status_code", ["FINISHED"], `IG 이미지 ${k}`);
    creation = (await call(IG, tok, "POST", `${uid}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: cap })).id;
    await waitStatus(IG, tok, creation, "status_code", ["FINISHED"], "IG 캐러셀");
  }
  const id = (await call(IG, tok, "POST", `${uid}/media_publish`, { creation_id: creation })).id;
  let permalink = null; try { permalink = (await call(IG, tok, "GET", id, { fields: "permalink" })).permalink; } catch {}
  return { id, permalink };
}

async function threads(post, t) {
  const tok = t.token, uid = t.userId || "me", text = post.captions.threads;
  let creation;
  if (post.format === "reel" && post.video) {
    creation = (await call(TH, tok, "POST", `${uid}/threads`, { media_type: "VIDEO", video_url: mediaUrl(post, post.video.file), text })).id;
    await waitStatus(TH, tok, creation, "status", ["FINISHED", "PUBLISHED"], "스레드 영상", 120);
  } else {
    const kids = [];
    for (const f of post.media.slice(0, 20)) kids.push((await call(TH, tok, "POST", `${uid}/threads`, { media_type: "IMAGE", image_url: mediaUrl(post, f), is_carousel_item: true })).id);
    for (const k of kids) await waitStatus(TH, tok, k, "status", ["FINISHED", "PUBLISHED"], `스레드 이미지 ${k}`);
    creation = (await call(TH, tok, "POST", `${uid}/threads`, { media_type: "CAROUSEL", children: kids.join(","), text })).id;
    await waitStatus(TH, tok, creation, "status", ["FINISHED", "PUBLISHED"], "스레드 게시물");
  }
  const id = (await call(TH, tok, "POST", `${uid}/threads_publish`, { creation_id: creation })).id;
  let permalink = null; try { permalink = (await call(TH, tok, "GET", id, { fields: "permalink" })).permalink; } catch {}
  return { id, permalink };
}

async function facebook(post, t) {
  const tok = t.token, page = t.pageId, msg = post.captions.facebook;
  let id;
  if (post.format === "reel" && post.video) {
    id = (await call(FB, tok, "POST", `${page}/videos`, { file_url: mediaUrl(post, post.video.file), description: msg })).id;
  } else {
    const params = { message: msg };
    let i = 0;
    for (const f of post.media.slice(0, 10)) {
      const ph = (await call(FB, tok, "POST", `${page}/photos`, { url: mediaUrl(post, f), published: false })).id;
      params[`attached_media[${i++}]`] = JSON.stringify({ media_fbid: ph });
    }
    id = (await call(FB, tok, "POST", `${page}/feed`, params)).id;
  }
  let permalink = null; try { permalink = (await call(FB, tok, "GET", id, { fields: "permalink_url" })).permalink_url; } catch {}
  return { id, permalink };
}

const PUBLISHERS = { instagram, threads, facebook };
const ready = (pf, t) => !!(t && t.token && (pf !== "facebook" || t.pageId));

/** 지금 올릴 게시물을 발행한다. now 기준 publishAt이 지났고 12시간 안이거나, 어드민이 '지금 발행'을 누른 것. */
export async function publishDue({ dry = false } = {}) {
  const s = settings(), tk = tokens(), now = Date.now();
  for (const p of listPosts()) {
    if (["rejected", "discarded", "published"].includes(p.status)) continue;
    const due = p.publishNow || (Date.parse(p.publishAt) <= now && now - Date.parse(p.publishAt) < 12 * 3600e3);
    if (!due) continue;
    if (p.status !== "approved" && !(p.status === "pending" && s.autoPublish)) { if (!p.publishNow) continue; }
    for (const pf of p.platforms) {
      if (p.result[pf]?.id || (p.result[pf]?.attempts || 0) >= 3) continue;
      if (!ready(pf, tk[pf])) { p.result[pf] = { skipped: "토큰 없음" }; continue; }
      if (dry) { log(`[드라이런] ${p.id} → ${pf}`); continue; }
      try {
        p.result[pf] = { ...(await PUBLISHERS[pf](p, tk[pf])), at: kstNow() };
        log(`[발행] ${p.id} ${pf} ${p.result[pf].permalink || p.result[pf].id}`);
      } catch (e) {
        p.result[pf] = { error: e.message.slice(0, 300), attempts: (p.result[pf]?.attempts || 0) + 1, at: kstNow() };
        log(`[실패] ${p.id} ${pf}: ${e.message}`);
      }
      savePost(p);
    }
    const done = p.platforms.every(pf => p.result[pf]?.id || p.result[pf]?.skipped || (p.result[pf]?.attempts || 0) >= 3);
    if (done && !dry) { p.status = p.platforms.some(pf => p.result[pf]?.id) ? "published" : p.status; p.publishNow = false; savePost(p); }
  }
}

/** 장기 토큰 연장(인스타그램 60일·스레드 60일). 7일마다. 페이스북 페이지 토큰은 만료가 없다. */
export async function refreshTokens() {
  const tk = tokens(); let changed = false;
  const day = 86400e3;
  for (const [pf, url, grant] of [["instagram", "https://graph.instagram.com/refresh_access_token", "ig_refresh_token"], ["threads", "https://graph.threads.net/refresh_access_token", "th_refresh_token"]]) {
    const t = tk[pf];
    if (!t?.token || (t.refreshedAt && Date.now() - Date.parse(t.refreshedAt) < 7 * day)) continue;
    try {
      const r = await fetch(`${url}?grant_type=${grant}&access_token=${encodeURIComponent(t.token)}`, { signal: AbortSignal.timeout(30000) });
      const j = await r.json();
      if (j.access_token) { t.token = j.access_token; t.expiresAt = new Date(Date.now() + (j.expires_in || 0) * 1000).toISOString(); t.refreshedAt = new Date().toISOString(); delete t.error; changed = true; log(`토큰 연장 ${pf}`); }
      else { t.error = j.error?.message || "연장 실패"; changed = true; }
    } catch (e) { t.error = e.message; changed = true; }
  }
  if (changed) saveTokens(tk);
}

/** 연결 확인 — 계정 이름을 돌려준다(어드민 표시용). */
export async function checkAccounts() {
  const tk = tokens(), out = {};
  const run = async (pf, fn) => { if (!tk[pf]?.token) return (out[pf] = { ok: false, reason: "토큰 없음" }); try { out[pf] = { ok: true, ...(await fn(tk[pf])) }; } catch (e) { out[pf] = { ok: false, reason: e.message.slice(0, 200) }; } };
  await run("instagram", async (t) => ({ name: (await call(IG, t.token, "GET", "me", { fields: "user_id,username" })).username }));
  await run("threads", async (t) => ({ name: (await call(TH, t.token, "GET", "me", { fields: "id,username" })).username }));
  await run("facebook", async (t) => ({ name: (await call(FB, t.token, "GET", t.pageId || "me", { fields: "name" })).name }));
  return out;
}
