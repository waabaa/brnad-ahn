// brand-atlas 운영 어드민 — 프런트.
// 백엔드는 /admin-api/ 아래에 있고 쿠키 인증을 쓴다. 빌드 스텝 없이 그대로 서빙한다.
const API = "/admin-api";
const $ = (s, r = document) => r.querySelector(s);
const el = (t, a = {}, ...kids) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) n.append(c?.nodeType ? c : document.createTextNode(String(c ?? "")));
  return n;
};
const num = (n) => (n == null ? "—" : Number(n).toLocaleString("ko-KR"));
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");
/** 사이트 내부 경로만 링크로 허용한다.
 *
 * GA4의 pagePath 같은 값은 우리 데이터가 아니다. 측정 ID는 페이지 소스에 공개돼 있어
 * 누구나 임의 page_location 을 보낼 수 있고, 그 값이 href 로 들어가면 `javascript:` 로
 * 어드민 세션에서 스크립트가 돈다. `//evil.com` 같은 프로토콜 상대 경로도 외부로 나간다.
 * 검증에 실패하면 링크를 만들지 않는다.
 */
function internalPath(v) {
  const s = String(v ?? "");
  return /^\/(?!\/)[^\s"'<>\\]*$/.test(s) ? s : null;
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function api(path, opts = {}) {
  const r = await fetch(API + path, { credentials: "same-origin", ...opts });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

// ─── 탭 정의 ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", name: "대시보드", render: renderDashboard },
  { id: "search", name: "검색 노출", render: renderSearch },
  { id: "crawlers", name: "크롤러", render: renderCrawlers },
  { id: "content", name: "콘텐츠", render: renderContent },
  { id: "entities", name: "엔티티", render: renderEntities },
  { id: "audit", name: "SEO 검증", render: renderAudit },
  { id: "keywords", name: "키워드", render: renderKeywords },
  { id: "ga4", name: "GA4", render: renderGa4 },
  { id: "gsc", name: "구글 서치콘솔", render: renderGsc },
  { id: "magazine", name: "매거진", render: renderMagazine },
  { id: "catalog", name: "브랜드 수록", render: renderCatalog },
  { id: "contact", name: "문의", render: renderContact },
  { id: "settings", name: "설정", render: renderSettings },
];

let SNAP = null, CONF = null, CURRENT = null;
const charts = {};
function chart(canvas, cfg) {
  if (charts[canvas.id]) charts[canvas.id].destroy();
  charts[canvas.id] = new Chart(canvas, cfg);
}

// ─── 부팅 ───────────────────────────────────────────────────────────────────
(async function boot() {
  const s = await api("/api/session").catch(() => ({ authed: false }));
  if (s.authed) start(); else showLogin();
})();

function showLogin() {
  $("#login").style.display = "grid";
  $("#app").classList.remove("on");
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#loginErr"); err.textContent = "";
  try {
    await api("/login", { method: "POST", body: JSON.stringify({ password: $("#pw").value }) });
    $("#pw").value = "";
    start();
  } catch (ex) { err.textContent = ex.message; }
});

$("#logout").addEventListener("click", async () => {
  await api("/logout", { method: "POST" }).catch(() => {});
  location.reload();
});

async function start() {
  $("#login").style.display = "none";
  $("#app").classList.add("on");
  try {
    [SNAP, CONF] = await Promise.all([api("/api/overview"), api("/api/config")]);
  } catch (e) {
    $("#panels").append(el("div", { class: "box" }, `데이터를 불러오지 못했습니다: ${e.message}`));
    return;
  }
  buildNav();
  const want = location.hash.slice(1);
  go(TABS.some((t) => t.id === want) ? want : "dashboard");
  const gen = SNAP.generatedAt ? new Date(SNAP.generatedAt) : null;
  $("#footInfo").textContent = gen ? `스냅샷 ${gen.toLocaleDateString("ko-KR")}` : "스냅샷 없음";
}

function buildNav() {
  const nav = $("#nav"); nav.innerHTML = "";
  for (const t of TABS) {
    nav.append(el("a", { id: `nav-${t.id}`, onclick: () => go(t.id) }, t.name));
  }
}

function go(id) {
  CURRENT = id;
  location.hash = id;
  const tab = TABS.find((t) => t.id === id);
  for (const t of TABS) $(`#nav-${t.id}`).classList.toggle("active", t.id === id);
  $("#title").textContent = tab.name;
  const host = $("#panels"); host.innerHTML = "";
  const gen = SNAP?.generatedAt ? new Date(SNAP.generatedAt) : null;
  $("#topMeta").innerHTML = gen
    ? `스냅샷 ${gen.toLocaleString("ko-KR")}<br>brandatlas.co.kr`
    : "brandatlas.co.kr";
  tab.render(host);
}

// ─── 공통 조각 ──────────────────────────────────────────────────────────────
function cards(host, items) {
  const w = el("div", { class: "cards" });
  for (const c of items) {
    w.append(el("div", { class: `card${c.accent ? " accent" : ""}` },
      el("div", { class: "k" }, c.k),
      el("div", { class: "v", html: `${c.v}${c.unit ? `<small>${c.unit}</small>` : ""}` }),
      c.s ? el("div", { class: "s" }, c.s) : ""));
  }
  host.append(w);
}
function box(host, title, sub) {
  const b = el("div", { class: "box" }, el("h2", {}, title), sub ? el("div", { class: "sub" }, sub) : "");
  host.append(b);
  return b;
}
function table(headers, rows) {
  const t = el("table", {},
    el("thead", {}, el("tr", {}, headers.map((h) => el("th", { class: h.num ? "num" : null }, h.label ?? h)))),
    el("tbody", {}, rows.map((r) => el("tr", {}, r.map((c) =>
      typeof c === "object" && c?.nodeType ? el("td", {}, c)
        : el("td", { class: typeof c === "number" ? "num" : null }, typeof c === "number" ? num(c) : c))))));
  return t;
}
/** 브랜드 상세 링크. slug 는 우리 데이터지만 같은 규칙으로 검증해 둔다. */
function brandLink(slug) {
  const href = internalPath(`/brand/${encodeURIComponent(String(slug ?? ""))}.html`);
  return href
    ? el("a", { href, target: "_blank", rel: "noopener noreferrer", style: "color:#e2231a" }, "열기")
    : el("span", { class: "muted" }, "—");
}

async function withLoading(btn, fn) {
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = "불러오는 중…";
  try { await fn(); } catch (e) { alert(e.message); }
  btn.disabled = false; btn.textContent = old;
}

// ─── 1. 대시보드 ────────────────────────────────────────────────────────────
function renderDashboard(host) {
  const t = SNAP.totals, log = SNAP.indexLog?.entries || [];
  const last = [...log].reverse().find((e) => e.naverIndexed != null);
  const ac = SNAP.audit ? acceptance(SNAP.audit) : null;
  cards(host, [
    { k: "수록 브랜드", v: num(t.brands) },
    { k: "색인 대상", v: num(t.indexable), s: `thin ${t.thin}건 제외` },
    { k: "네이버 색인", v: num(last?.naverIndexed), s: last ? `${last.date} 측정` : "미측정", accent: true },
    { k: "색인률", v: last ? pct(last.naverIndexed, t.indexable) : "—", s: "색인 ÷ 색인 대상" },
    { k: "로고 보유", v: num(t.withLogo), s: `미보유 ${num(t.brands - t.withLogo)}건` },
    { k: "위키데이터 연결", v: num(t.withEntity), s: `${pct(t.withEntity, t.brands)}` },
    { k: "허브 페이지", v: num((t.categoryHubs || 0) + (t.countryHubs || 0)), s: `산업 ${t.categoryHubs} · 국가 ${t.countryHubs}` },
    { k: "수용기준", v: ac ? `${ac.pass}/${ac.total}` : "—", s: ac && ac.fail ? `미달 ${ac.fail}건` : "전부 통과" },
    ...(SNAP.magazine ? [{ k: "매거진 예약 원고", v: `${SNAP.magazine.scheduled.length}편`,
      s: SNAP.magazine.low ? `⚠ ${SNAP.magazine.daysLeft}일 남음 — 다음 달 원고 필요` : `마지막 공개 ${SNAP.magazine.lastScheduled} · ${SNAP.magazine.daysLeft}일 남음`,
      accent: SNAP.magazine.low }] : []),
  ]);

  const b = box(host, "네이버 색인 추이", "주간 자동 측정 기록입니다. 값이 없는 날은 API 키가 없던 기간입니다.");
  const pts = log.filter((e) => e.naverIndexed != null);
  if (pts.length < 2) {
    b.append(el("div", { class: "empty" }, "측정 기록이 2건 미만이라 그래프를 그릴 수 없습니다. 주간 측정이 쌓이면 표시됩니다."));
  } else {
    const c = el("canvas", { id: "chIdx" });
    b.append(el("div", { class: "chartwrap" }, c));
    chart(c, {
      type: "line",
      data: { labels: pts.map((p) => p.date), datasets: [{ label: "색인 페이지", data: pts.map((p) => p.naverIndexed),
        borderColor: "#e2231a", backgroundColor: "rgba(226,35,26,.08)", fill: true, tension: .3, pointRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: false } } },
    });
  }

  const b2 = box(host, "최근 기록", "이벤트가 남은 측정입니다.");
  b2.append(el("div", { class: "scroll" }, table(
    ["날짜", "색인", "출처", "이벤트"],
    [...log].reverse().slice(0, 15).map((e) => [
      e.date, e.naverIndexed ?? "—", e.naverIndexedSource || (e.naverIndexedError ? "실패" : "—"),
      e.event || e.naverIndexedError || "",
    ]))));
}

function acceptance(audit) {
  // audit-seo --json 은 지표만 준다. 통과 여부는 서버 텍스트 출력이 진실이지만,
  // 여기서는 핵심 지표로 요약만 보여 준다(상세는 SEO 검증 탭).
  const checks = [
    ["카테고리 허브 12", audit.hubs?.categoryPages === 12],
    ["국가 허브 12+", (audit.hubs?.countryPages ?? 0) >= 12],
    ["'브랜드 매거진' 잔존 0", audit.title?.containsMagazineFiller === 0],
    ["desc 중복 0", audit.description?.duplicateGroups === 0],
    ["FAQPage 1200+", (audit.faqPageJsonLd ?? 0) >= 1200],
    ["empty-note 0", audit.emptyNotePages === 0],
    ["dateModified 전량", audit.geo?.dateModified === audit.brandPages],
    ["가시 업데이트 표기 전량", audit.geo?.visibleUpdatedLine === audit.brandPages],
    ["sameAs 300+", (audit.geo?.sameAs ?? 0) >= 300],
    ["껍데기 noindex 3", audit.geo?.shellsNoindex === 3],
    ["껍데기 내부링크 0", audit.geo?.pagesLinkingSpaShell === 0],
    ["breadcrumb 일치", audit.geo?.breadcrumbMismatch === 0],
    ["타임라인 하드절단 0", audit.geo?.timelineHardTruncation === 0],
    ["중복 alt 0", audit.geo?.duplicateAltPages === 0],
    ["llms.txt", !!audit.geo?.llmsTxt],
    ["AI 크롤러 명시 10+", (audit.geo?.robotsAiAgents ?? 0) >= 10],
    ["이미지 sitemap 1000+", (audit.sitemap?.imageEntries ?? 0) > 1000],
    ["허브 본문 700자 미만 0", audit.hubProse?.under700 === 0],
    ["RSS 100+", (audit.rssItems ?? 0) >= 100],
    ["sitemap 분할", (audit.sitemap?.childFiles ?? 0) >= 2],
  ];
  return { checks, total: checks.length, pass: checks.filter((c) => c[1]).length, fail: checks.filter((c) => !c[1]).length };
}

// ─── 2. 검색 노출 ───────────────────────────────────────────────────────────
function renderSearch(host) {
  const b = box(host, "색인 구성 실시간 조회",
    "네이버 site: 질의 결과를 전수로 받아 신규 URL·구 slug·허브로 나눕니다. 총계만 보면 이전이 진행 중인지 실제로 늘었는지 구분되지 않습니다.");
  const btn = el("button", { class: "act" }, "지금 조회");
  const out = el("div", {});
  b.append(el("div", { class: "row" }, btn, el("span", { class: "muted" }, "네이버 API를 10회까지 호출합니다(약 5초).")), out);
  btn.addEventListener("click", () => withLoading(btn, async () => {
    const d = await api("/api/index-composition");
    out.innerHTML = "";
    const t = SNAP.totals;
    const inner = el("div", {});
    cards(inner, [
      { k: "네이버 총 색인", v: num(d.total), accent: true },
      { k: "신규 slug 브랜드", v: num(d.brandNew), s: `색인 대상 ${num(t.indexable)} 중 ${pct(d.brandNew, t.indexable)}` },
      { k: "구 slug 잔존", v: num(d.brandLegacySlug), s: "301로 이전됨 · 0이 목표" },
      { k: "허브 색인", v: `${num(d.hubs)} / ${num((t.categoryHubs || 0) + (t.countryHubs || 0))}`, s: "산업·국가 허브" },
    ]);
    out.append(inner);
    if (d.hubSample?.length) {
      const hb = el("div", { class: "box" }, el("h2", {}, "색인된 허브"), el("div", { class: "sub" }, `${d.hubs}건`));
      hb.append(el("div", { class: "scroll" }, table(["경로"], d.hubSample.map((u) => [u]))));
      out.append(hb);
    }
    if (d.legacySample?.length) {
      const lb = el("div", { class: "box" }, el("h2", {}, "아직 남은 구 slug"),
        el("div", { class: "sub" }, "301은 정상 동작합니다. 네이버가 새 URL로 교체하는 데 시간이 걸립니다."));
      lb.append(el("div", { class: "scroll" }, table(["구 slug"], d.legacySample.map((u) => [u]))));
      out.append(lb);
    }
  }));

  const b2 = box(host, "콘텐츠 갱신 이력", "본문이 실제로 바뀐 페이지 수입니다. 값이 없는 날은 변경이 없던 날입니다.");
  const rows = SNAP.freshness?.modifiedByDate || [];
  if (!rows.length) b2.append(el("div", { class: "empty" }, "기록 없음"));
  else {
    const c = el("canvas", { id: "chFresh" });
    b2.append(el("div", { class: "chartwrap" }, c));
    chart(c, {
      type: "bar",
      data: { labels: rows.map((r) => r[0]), datasets: [{ label: "갱신 페이지", data: rows.map((r) => r[1]), backgroundColor: "#141414" }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
  }
}

// ─── 3. 크롤러 ──────────────────────────────────────────────────────────────
function renderCrawlers(host) {
  const b = box(host, "크롤러 방문", "nginx 접근 로그에서 검색·AI 크롤러만 골라 셉니다. 네이버가 실제로 얼마나 자주 오는지가 SEO 작업의 직접적인 피드백입니다.");
  const sel = el("select", { class: "txt" }, ...[3, 7, 14, 30].map((d) => el("option", { value: d, selected: d === 7 ? "" : null }, `최근 ${d}일`)));
  const btn = el("button", { class: "act" }, "조회");
  const out = el("div", {});
  b.append(el("div", { class: "row" }, sel, btn), out);
  const load = () => withLoading(btn, async () => {
    const d = await api(`/api/crawlers?days=${sel.value}`);
    out.innerHTML = "";
    if (!d.bots?.length) {
      out.append(el("div", { class: "empty" }, `최근 ${d.days}일 로그에서 크롤러 방문이 없습니다. (파싱한 줄 ${num(d.parsedLines)})`));
      return;
    }
    const c = el("canvas", { id: "chBot" });
    out.append(el("div", { class: "chartwrap" }, c));
    chart(c, {
      type: "bar",
      data: { labels: d.bots.map((x) => x.name), datasets: [{ label: "요청 수", data: d.bots.map((x) => x.hits), backgroundColor: "#e2231a" }] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } } },
    });
    out.append(el("div", { style: "height:18px" }));
    out.append(table(["크롤러", { label: "요청", num: 1 }, "상태코드", "많이 간 경로"],
      d.bots.map((x) => [
        x.name, x.hits,
        el("span", {}, Object.entries(x.status).map(([s, n]) =>
          el("span", { class: `pill ${s.startsWith("2") ? "ok" : s.startsWith("3") ? "mute" : "bad"}`, style: "margin-right:4px" }, `${s} ${n}`))),
        el("span", { class: "muted", style: "font-size:12px" }, x.topPaths.slice(0, 3).map((p) => p.path).join("  ")),
      ])));
  });
  btn.addEventListener("click", load);
  load();
}

// ─── 4. 콘텐츠 ──────────────────────────────────────────────────────────────
function renderContent(host) {
  const t = SNAP.totals;
  cards(host, [
    { k: "본문 700자 미만", v: num(t.thin), s: "noindex 처리됨", accent: t.thin > 0 },
    { k: "로고 미보유", v: num(t.brands - t.withLogo), s: `보유 ${pct(t.withLogo, t.brands)}` },
    { k: "타임라인 보유", v: num(t.withTimeline), s: pct(t.withTimeline, t.brands) },
    { k: "BI/CI 보유", v: num(t.withBici), s: pct(t.withBici, t.brands) },
    { k: "기원 국가 확인", v: num(t.withCountry), s: pct(t.withCountry, t.brands) },
    { k: "설립연도 확인", v: num(t.withFoundedYear), s: pct(t.withFoundedYear, t.brands) },
  ]);

  const g = el("div", { class: "grid2" });
  host.append(g);

  const b1 = el("div", { class: "box" }, el("h2", {}, "본문 길이 분포"), el("div", { class: "sub" }, "발행된 페이지의 순수 본문 기준"));
  const c1 = el("canvas", { id: "chBody" });
  b1.append(el("div", { class: "chartwrap" }, c1));
  g.append(b1);

  const b2 = el("div", { class: "box" }, el("h2", {}, "산업별 완성도"), el("div", { class: "sub" }, "로고 보유율 기준"));
  b2.append(el("div", { class: "scroll" }, table(
    ["산업", { label: "브랜드", num: 1 }, { label: "로고", num: 1 }, "보유율", { label: "thin", num: 1 }],
    (SNAP.industries || []).map((i) => [
      i.industry, i.total, i.logo,
      el("div", { style: "min-width:90px" },
        el("div", { class: "bar" }, el("i", { style: `width:${(i.logo / i.total * 100).toFixed(0)}%` })),
        el("div", { class: "muted", style: "font-size:11px;margin-top:3px" }, pct(i.logo, i.total))),
      i.thin,
    ]))));
  g.append(b2);

  chart(c1, {
    type: "bar",
    data: { labels: Object.keys(SNAP.bodyBuckets || {}), datasets: [{ label: "페이지", data: Object.values(SNAP.bodyBuckets || {}), backgroundColor: "#141414" }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  const b3 = box(host, `로고 미보유 브랜드 ${num(SNAP.noLogo?.count)}건`,
    "이미지 검색이 실제 유입원입니다. 네이버 이미지 API로 보강할 대상입니다. (상위 200건 표시)");
  b3.append(el("div", { class: "scroll" }, table(["브랜드", "산업", "페이지"],
    (SNAP.noLogo?.sample || []).map((b) => [
      b.name, b.industry || "—", brandLink(b.slug),
    ]))));

  const b4 = box(host, `본문이 얇아 색인에서 뺀 페이지 ${num(t.thin)}건`, "noindex,follow — 링크는 살아 있고 색인만 제외됩니다.");
  b4.append(el("div", { class: "scroll" }, table(["브랜드", "산업", { label: "본문", num: 1 }, "페이지"],
    (SNAP.thinPages || []).map((p) => [
      p.name, p.industry || "—", p.renderedChars, brandLink(p.slug),
    ]))));
}

// ─── 5. 엔티티 ──────────────────────────────────────────────────────────────
function renderEntities(host) {
  const e = SNAP.entities || {};
  cards(host, [
    { k: "위키데이터 연결", v: num(e.matched), accent: true, s: "공식 웹사이트 URL 완전 일치분만" },
    { k: "한국어 위키백과", v: num(e.withKoWikipedia) },
    { k: "영어 위키백과", v: num(e.withEnWikipedia) },
    { k: "기각", v: num(e.rejected), s: "개체가 하나로 좁혀지지 않음" },
  ]);
  const b = box(host, "기각 사유", "잘못 연결하면 검색엔진에 다른 회사를 이 브랜드라고 선언하게 됩니다. 하나로 좁혀지지 않으면 아무것도 쓰지 않습니다.");
  b.append(table(["사유", { label: "건수", num: 1 }], Object.entries(e.rejectReasons || {}).map(([k, v]) => [k, v])));

  const b2 = box(host, "기각 상세", "후보가 여럿이거나 레이블이 브랜드명과 맞지 않은 경우입니다.");
  b2.append(el("div", { class: "scroll" }, table(["브랜드", "사유", "후보"],
    (e.rejectedSample || []).map((r) => [
      r.name, r.reason,
      el("span", { class: "muted", style: "font-size:12px" },
        (r.cands || []).map((c) => (typeof c === "string" ? c : `${c.qid} ${c.labelEn || c.labelKo || ""}`)).join(" · ")),
    ]))));
}

// ─── 6. SEO 검증 ────────────────────────────────────────────────────────────
function renderAudit(host) {
  if (!SNAP.audit) { box(host, "수용기준", "audit 결과가 스냅샷에 없습니다."); return; }
  const a = SNAP.audit, ac = acceptance(a);
  cards(host, [
    { k: "통과", v: `${ac.pass} / ${ac.total}`, accent: ac.fail > 0 },
    { k: "브랜드 페이지", v: num(a.brandPages) },
    { k: "sitemap URL", v: num(a.sitemap?.totalLocs), s: `이미지 ${num(a.sitemap?.imageEntries)}` },
    { k: "허브 본문 중앙값", v: num(a.hubProse?.p50), unit: "자", s: `최소 ${num(a.hubProse?.min)}` },
  ]);
  const b = box(host, "수용기준 항목", "빌드마다 audit-seo.mjs가 재계산합니다. 하나라도 미달이면 주간 자동 배포가 중단됩니다.");
  b.append(table(["항목", "결과"], ac.checks.map(([n, ok]) => [n, el("span", { class: `pill ${ok ? "ok" : "bad"}` }, ok ? "PASS" : "FAIL")])));

  const b2 = box(host, "지표 원본", "audit-seo.mjs --json 출력");
  b2.append(el("pre", { class: "scroll", style: "font-size:12px;background:#fafafa;padding:14px;border-radius:8px;overflow:auto" },
    JSON.stringify(a, null, 1)));
}

// ─── 7. 키워드 ──────────────────────────────────────────────────────────────
function renderKeywords(host) {
  const b = box(host, "네이버 검색어트렌드",
    "브랜드별 검색 수요를 봅니다. 기간 내 최댓값을 100으로 한 상대지수라 절대 검색량은 아닙니다. 최대 5개까지 비교할 수 있습니다.");
  const inp = el("input", { class: "txt", style: "flex:1;min-width:240px", placeholder: "브랜드명을 쉼표로 구분 (예: 구찌, 프라다, 코치넬레)" });
  const btn = el("button", { class: "act" }, "조회");
  const out = el("div", {});
  b.append(el("div", { class: "row" }, inp, btn), out);
  const run = () => withLoading(btn, async () => {
    const keywords = inp.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    if (!keywords.length) { alert("브랜드명을 입력하세요."); return; }
    const d = await api("/api/trend", { method: "POST", body: JSON.stringify({ keywords }) });
    out.innerHTML = "";
    const c = el("canvas", { id: "chTrend" });
    out.append(el("div", { class: "chartwrap", style: "height:340px" }, c));
    const colors = ["#e2231a", "#141414", "#0369a1", "#15803d", "#b45309"];
    chart(c, {
      type: "line",
      data: {
        labels: (d.results?.[0]?.data || []).map((p) => p.period),
        datasets: (d.results || []).map((r, i) => ({
          label: r.title, data: r.data.map((p) => p.ratio),
          borderColor: colors[i % colors.length], backgroundColor: "transparent", tension: .3, pointRadius: 2,
        })),
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    });
    out.append(table(["브랜드", { label: "최근 지수", num: 1 }, { label: "최고", num: 1 }],
      (d.results || []).map((r) => {
        const vals = r.data.map((p) => p.ratio);
        return [r.title, Number(vals.at(-1)?.toFixed(1) ?? 0), Number(Math.max(...vals).toFixed(1))];
      })));
  });
  btn.addEventListener("click", run);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  inp.value = "구찌, 프라다, 코치넬레";
}

// ─── 8. GA4 ─────────────────────────────────────────────────────────────────
function renderGa4(host) {
  const b = box(host, "Google Analytics 4", "방문·유입·인기 페이지. 측정 ID는 데이터를 보내는 쪽이고, 이 화면이 수치를 읽으려면 속성 ID와 서비스 계정 권한이 따로 필요합니다.");
  const sel = el("select", { class: "txt" }, ...[7, 28, 90, 365].map((d) => el("option", { value: d, selected: d === 28 ? "" : null }, `최근 ${d}일`)));
  const btn = el("button", { class: "act" }, "조회");
  const out = el("div", {});
  b.append(el("div", { class: "row" }, sel, btn), out);

  const load = () => withLoading(btn, async () => {
    const d = await api(`/api/ga4?days=${sel.value}`);
    out.innerHTML = "";
    if (!d.enabled) { out.append(setupGuide(d)); return; }

    const inner = el("div", {});
    const s = d.summary || {};
    const dur = s.averageSessionDuration ? `${Math.round(s.averageSessionDuration)}초` : "—";
    cards(inner, [
      { k: "실시간 사용자", v: d.realtimeUsers == null ? "—" : num(d.realtimeUsers), s: "지난 30분", accent: true },
      { k: "사용자", v: num(s.activeUsers), s: `최근 ${d.days}일` },
      { k: "세션", v: num(s.sessions) },
      { k: "페이지뷰", v: num(s.screenPageViews) },
      { k: "평균 체류", v: dur },
      { k: "이탈률", v: s.bounceRate != null ? `${(s.bounceRate * 100).toFixed(1)}%` : "—" },
    ]);
    out.append(inner);

    if (d.daily?.length) {
      const db = el("div", { class: "box" }, el("h2", {}, "일별 추이"));
      const c = el("canvas", { id: "chGa4" });
      db.append(el("div", { class: "chartwrap" }, c));
      out.append(db);
      const label = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
      chart(c, {
        type: "line",
        data: {
          labels: d.daily.map((r) => label(r.date)),
          datasets: [
            { label: "사용자", data: d.daily.map((r) => r.activeUsers), borderColor: "#e2231a", backgroundColor: "rgba(226,35,26,.08)", fill: true, tension: .3, pointRadius: 2 },
            { label: "페이지뷰", data: d.daily.map((r) => r.screenPageViews), borderColor: "#141414", backgroundColor: "transparent", tension: .3, pointRadius: 2 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
      });
    }

    const g = el("div", { class: "grid2" });
    out.append(g);
    const cb = el("div", { class: "box" }, el("h2", {}, "유입 경로"), el("div", { class: "sub" }, "채널 그룹 기준"));
    cb.append(d.channels?.length
      ? table(["채널", { label: "세션", num: 1 }, { label: "사용자", num: 1 }],
          d.channels.map((r) => [r.sessionDefaultChannelGroup || "(없음)", r.sessions, r.activeUsers]))
      : el("div", { class: "empty" }, "데이터 없음"));
    g.append(cb);
    const sb = el("div", { class: "box" }, el("h2", {}, "유입 출처"), el("div", { class: "sub" }, "sessionSource 기준"));
    sb.append(d.sources?.length
      ? table(["출처", { label: "세션", num: 1 }], d.sources.map((r) => [r.sessionSource || "(직접)", r.sessions]))
      : el("div", { class: "empty" }, "데이터 없음"));
    g.append(sb);

    const pb = el("div", { class: "box" }, el("h2", {}, "인기 페이지"), el("div", { class: "sub" }, "페이지뷰 상위 30"));
    pb.append(d.pages?.length
      ? el("div", { class: "scroll" }, table(["경로", { label: "페이지뷰", num: 1 }, { label: "사용자", num: 1 }, ""],
          d.pages.map((r) => {
            const href = internalPath(r.pagePath);
            return [
              r.pagePath, r.screenPageViews, r.activeUsers,
              href
                ? el("a", { href, target: "_blank", rel: "noopener noreferrer", style: "color:#e2231a" }, "열기")
                : el("span", { class: "muted" }, "경로 아님"),
            ];
          })))
      : el("div", { class: "empty" }, "아직 데이터가 없습니다. 태그를 심은 지 24~48시간이 지나야 채워집니다."));
    out.append(pb);
  });
  btn.addEventListener("click", load);
  load();
}

// ─── 9. 구글 서치 콘솔 ──────────────────────────────────────────────────────
function renderGsc(host) {
  const b = box(host, "구글 서치 콘솔", "구글 검색 노출·클릭·순위와 색인 상태. 성과 데이터는 2~3일 늦게 들어오고, 결과는 6시간 캐시합니다.");
  const sel = el("select", { class: "txt" }, ...[28, 90, 480].map((d) => el("option", { value: d, selected: d === 28 ? "" : null }, d === 480 ? "최대(16개월)" : `최근 ${d}일`)));
  const btn = el("button", { class: "act" }, "조회");
  const out = el("div", {});
  b.append(el("div", { class: "row" }, sel, btn), out);
  const pct = (v) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
  const pos = (v) => (v == null ? "—" : v.toFixed(1));
  const load = () => withLoading(btn, async () => {
    const d = await api(`/api/gsc?days=${sel.value}`);
    out.innerHTML = "";
    if (!d.enabled) { out.append(el("div", { class: "empty" }, d.reason || "비활성")); return; }
    const s = d.summary || {};
    const inner = el("div", {});
    cards(inner, [
      { k: "클릭", v: num(s.clicks || 0), s: `${d.range[0]} ~ ${d.range[1]}`, accent: true },
      { k: "노출", v: num(s.impressions || 0) },
      { k: "CTR", v: pct(s.ctr) },
      { k: "평균 순위", v: pos(s.position) },
    ]);
    out.append(inner);
    const ib = el("div", { class: "box" }, el("h2", {}, "색인 상태 — URL 검사"), el("div", { class: "sub" }, `대표 페이지 ${d.inspected.length}곳 · ${d.cachedAt} 기준`));
    ib.append(table(["경로", "판정", "상태", "마지막 크롤링"], d.inspected.map((r) => [r.path, r.verdict === "PASS" ? "색인됨" : r.verdict, r.coverage || "—", r.lastCrawl ? r.lastCrawl.slice(0, 10) : "—"])));
    out.append(ib);
    const smb = el("div", { class: "box" }, el("h2", {}, "사이트맵"));
    smb.append(table(["사이트맵", "제출", "구글이 가져감", "대기", { label: "오류", num: 1 }, { label: "URL 수", num: 1 }],
      d.sitemaps.map((r) => [r.path.replace(d.site, "/"), (r.lastSubmitted || "").slice(0, 10), r.lastDownloaded ? r.lastDownloaded.slice(0, 10) : "아직", r.isPending ? "대기 중" : "—", r.errors, r.submitted || "—"])));
    out.append(smb);
    if (d.daily?.length) {
      const db = el("div", { class: "box" }, el("h2", {}, "일별 추이"));
      const c = el("canvas", { id: "chGsc" });
      db.append(el("div", { class: "chartwrap" }, c));
      out.append(db);
      chart(c, { type: "line", data: { labels: d.daily.map((r) => r.date), datasets: [
        { label: "노출", data: d.daily.map((r) => r.impressions), borderColor: "#141414", backgroundColor: "transparent", tension: .3, pointRadius: 2 },
        { label: "클릭", data: d.daily.map((r) => r.clicks), borderColor: "#e2231a", backgroundColor: "rgba(226,35,26,.08)", fill: true, tension: .3, pointRadius: 2 },
      ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
    }
    const g = el("div", { class: "grid2" });
    out.append(g);
    const cols = [{ label: "클릭", num: 1 }, { label: "노출", num: 1 }, { label: "순위", num: 1 }];
    const qb = el("div", { class: "box" }, el("h2", {}, "검색어"));
    qb.append(d.queries?.length ? el("div", { class: "scroll" }, table(["검색어", ...cols], d.queries.map((r) => [r.query, r.clicks, r.impressions, pos(r.position)]))) : el("div", { class: "empty" }, "아직 구글 검색 노출이 없습니다."));
    g.append(qb);
    const pb = el("div", { class: "box" }, el("h2", {}, "페이지"));
    pb.append(d.pages?.length ? el("div", { class: "scroll" }, table(["페이지", ...cols], d.pages.map((r) => [r.page.replace(d.site, "/"), r.clicks, r.impressions, pos(r.position)]))) : el("div", { class: "empty" }, "아직 구글 검색 노출이 없습니다."));
    g.append(pb);
  });
  btn.addEventListener("click", load);
  load();
}

// ─── 10. 매거진 자동 준비 ───────────────────────────────────────────────────
// 초안 작성·승인 반영·공개는 배포 서버 작업이 한다(매주 월 05:10 주간 리프레시 + 여기서 버튼을 누르면 즉시).
function renderMagazine(host) {
  const b = box(host, "매거진 자동 준비", "예약 원고가 14일치 이하로 남으면 AI가 다음 달 호 초안을 쓰고 자동 검증해 여기에 올립니다. 승인한 초안만 그 달의 월요일에 예약되고, 주간 배포가 공개일에 엽니다.");
  const out = el("div", {});
  b.append(out);
  const post = (path, body) => api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const statusKo = { pending: "대기", scheduled: "예약됨", rejected: "반려" };

  const load = async () => {
    const d = await api("/api/magazine");
    out.innerHTML = "";
    const s = d.settings, q = d.queue;
    const toggle = (key, label, help) => {
      const cb = el("input", { type: "checkbox", checked: s[key] ? "" : null });
      cb.addEventListener("change", async () => { cb.disabled = true; try { await post("/api/magazine/settings", { [key]: cb.checked }); } finally { load(); } });
      return el("label", { class: "row", style: "gap:10px;align-items:center;margin:6px 0" }, cb, el("b", {}, label), el("span", { class: "muted" }, help));
    };
    const runBtn = el("button", { class: "act" }, s.runRequested ? "실행 중 — 초안 작성은 몇 분 걸립니다" : "지금 시작");
    runBtn.disabled = !!s.runRequested || !s.autoDraft;
    runBtn.addEventListener("click", async () => { runBtn.disabled = true; await post("/api/magazine/settings", { runRequested: true }); load(); });
    out.append(
      toggle("autoDraft", "자동 준비", "켜면 예약 원고가 부족할 때 다음 달 호 초안을 AI가 씁니다(매주 월요일 점검)."),
      toggle("autoSchedule", "검증 통과 시 자동 예약", "켜면 자동 검증을 통과한 초안은 승인 없이 예약됩니다. 기본은 꺼 두고 사람이 승인하는 것을 권합니다."),
      el("div", { class: "row", style: "margin:10px 0 18px" }, runBtn, el("span", { class: "muted" }, s.lastRunAt ? `마지막 실행 ${s.lastRunAt.slice(0, 16).replace("T", " ")}` : "")),
    );
    const inner = el("div", {});
    cards(inner, [
      { k: "예약 원고", v: q ? `${q.scheduled.length}편` : "—", s: q ? `마지막 공개 ${q.lastScheduled || "없음"}` : "스냅샷 없음", accent: !!q?.low },
      { k: "남은 기간", v: q ? `${q.daysLeft}일` : "—", s: q?.low ? "⚠ 다음 달 원고 필요" : "여유 있음" },
      { k: "대기 초안", v: `${(d.drafts.drafts || []).filter((x) => x.status === "pending").length}편`, s: d.drafts.syncedAt ? `동기화 ${d.drafts.syncedAt.slice(0, 16).replace("T", " ")}` : "아직 없음" },
    ]);
    out.append(inner);

    const list = [...(d.drafts.drafts || [])].reverse();
    const tb = el("div", { class: "box" }, el("h2", {}, "초안 대기열"), el("div", { class: "sub" }, "승인·반려는 누르는 즉시 서버 작업이 반영하고, 공개일이 되면 서버가 직접 빌드해 공개합니다."));
    const pv = el("div", { class: "box", style: "display:none" });
    if (!list.length) tb.append(el("div", { class: "empty" }, "아직 초안이 없습니다."));
    else tb.append(el("div", { class: "scroll" }, table(["호", "제목", "각도", "자동 검증", "상태", ""], list.map((x) => {
      const dec = d.decisions[x.slug]?.action;
      const act = el("span", { class: "row", style: "gap:6px" });
      if (x.status === "pending") {
        const view = el("button", { class: "act" }, "미리보기");
        view.addEventListener("click", async () => {
          const r = await api(`/api/magazine/draft?slug=${encodeURIComponent(x.slug)}`);
          const body = r.text.replace(/^---json[\s\S]*?\n---\n/, "");
          pv.style.display = ""; pv.innerHTML = "";
          pv.append(el("h2", {}, x.title), el("div", { class: "sub" }, x.dek));
          for (const blk of body.split(/\n{2,}/)) {
            const t = blk.trim(); if (!t) continue;
            if (t.startsWith("## ")) pv.append(el("h3", { style: "margin:18px 0 6px" }, t.slice(3)));
            else if (t.startsWith("::")) pv.append(el("div", { class: "muted", style: "border-left:3px solid #e2231a;padding:4px 10px;margin:8px 0" }, t));
            else pv.append(el("p", { style: "line-height:1.8;margin:0 0 10px" }, t.replace(/\[([^\]]+)\]\(brand:[^)]+\)/g, "$1")));
          }
          pv.scrollIntoView({ behavior: "smooth" });
        });
        const mk = (label, action) => { const bt = el("button", { class: "act" }, label); bt.addEventListener("click", async () => { await post("/api/magazine/decision", { slug: x.slug, action }); load(); }); return bt; };
        act.append(view, dec ? mk(`${dec === "approve" ? "승인" : "반려"} 취소`, "undo") : mk("승인", "approve"), dec ? "" : mk("반려", "reject"));
      }
      const chk = x.checks?.ok ? "통과" : `실패 ${(x.checks?.issues || []).length}건`;
      return [`No.${String(x.issue).padStart(2, "0")}`, x.title, x.type || "", el("span", { title: (x.checks?.issues || []).join("\n") }, `${chk} · 문체 ${x.checks?.risk || "?"}`),
        dec ? `${dec === "approve" ? "승인" : "반려"} 대기` : `${statusKo[x.status] || x.status}${x.date ? ` (${x.date})` : ""}`, act];
    }))));
    out.append(tb, pv);
  };
  load().catch((e) => { out.innerHTML = ""; out.append(el("div", { class: "empty" }, `불러오기 실패: ${e.message}`)); });
}

// ─── 11. 주간 브랜드 수록 ───────────────────────────────────────────────────
// 수요 선정·수록·공개는 배포 서버 작업이 한다(매주 월 05:10 주간 리프레시). 여기서는 ON/OFF·주간 목표·로고 검수만 한다.
function renderCatalog(host) {
  const b = box(host, "주간 브랜드 수록", "매주 월요일, 사람들이 실제로 찾는 브랜드부터 수록합니다. 국내는 네이버 데이터랩 검색량, 국외는 영문 위키백과 조회수, 우리 사이트에 노출됐는데 페이지가 없던 구글 검색어를 봅니다. 본문은 위키백과·위키데이터 근거 밖의 숫자가 있으면 기각됩니다. 로고는 여기서 승인한 것만 실립니다.");
  const out = el("div", {});
  b.append(out);
  const post = (path, body) => api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const reviewKo = { pending: "검수 대기", approved: "게재", rejected: "반려" };

  const load = async () => {
    const d = await api("/api/catalog");
    out.innerHTML = "";
    const s = d.settings;
    const cb = el("input", { type: "checkbox", checked: s.autoImport ? "" : null });
    cb.addEventListener("change", async () => { cb.disabled = true; try { await post("/api/catalog/settings", { autoImport: cb.checked }); } finally { load(); } });
    const la = el("input", { type: "checkbox", checked: s.logoAutoApprove ? "" : null });
    la.addEventListener("change", async () => { la.disabled = true; try { await post("/api/catalog/settings", { logoAutoApprove: la.checked }); } finally { load(); } });
    const tg = el("input", { type: "number", min: "1", max: "40", value: String(s.weeklyTarget), style: "width:70px" });
    tg.addEventListener("change", async () => { await post("/api/catalog/settings", { weeklyTarget: Number(tg.value) }); load(); });
    out.append(
      el("label", { class: "row", style: "gap:10px;align-items:center;margin:6px 0" }, cb, el("b", {}, "자동 수록"), el("span", { class: "muted" }, "켜면 매주 월요일 주간 리프레시가 수록합니다.")),
      el("label", { class: "row", style: "gap:10px;align-items:center;margin:6px 0" }, la, el("b", {}, "로고 자동 게재"), el("span", { class: "muted" }, "켜면 검수를 기다리지 않고 로고를 싣습니다. 잘못된 로고는 아래에서 '내리기'.")),
      el("label", { class: "row", style: "gap:10px;align-items:center;margin:6px 0 16px" }, el("b", {}, "주간 목표"), tg, el("span", { class: "muted" }, "곳 — 근거 검증을 통과한 것만 셉니다(최대 40).")),
    );
    const recs = d.records || [];
    const pending = recs.filter((r) => r.hasLogo && r.logoReview === "pending" && !r.decision);
    const inner = el("div", {});
    cards(inner, [
      { k: "지난 실행", v: d.lastRun ? `${d.lastRun.added}곳` : "—", s: d.lastRun ? `${d.lastRun.at.slice(0, 16).replace("T", " ")} · 목표 ${d.lastRun.target}` : "아직 없음" },
      { k: "서버 수록 누적", v: `${recs.length}곳`, s: "주간 수록으로 들어온 브랜드" },
      { k: "로고 검수 대기", v: `${pending.length}건`, s: pending.length ? "아래에서 승인하면 즉시 다시 공개됩니다" : "없음", accent: pending.length > 0 },
    ]);
    out.append(inner);

    // 로고 검수 — 위키데이터 로고에는 다른 개체·옛 로고·간판 사진이 섞여 있다.
    const lg = el("div", { class: "box" }, el("h2", {}, "로고 검수"), el("div", { class: "sub" }, "위키데이터 로고에는 다른 회사·옛 로고·간판 사진이 섞여 있습니다. 자동 게재가 켜져 있으면 바로 실리고, 틀린 로고만 '내리기'로 빼면 됩니다. 누르는 즉시 서버가 다시 공개합니다."));
    const withLogo = recs.filter((r) => r.hasLogo);
    if (!withLogo.length) lg.append(el("div", { class: "empty" }, "검수할 로고가 없습니다."));
    const grid = el("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px" });
    for (const r of withLogo) {
      const state = r.decision ? `${r.decision === "approve" ? "승인" : "반려"} 반영 중` : reviewKo[r.logoReview] || "";
      const act = el("div", { class: "row", style: "gap:6px;margin-top:8px" });
      const mk = (label, action) => { const bt = el("button", { class: "act" }, label); bt.addEventListener("click", async () => { bt.disabled = true; await post("/api/catalog/decision", { slug: r.slug, action }); load(); }); return bt; };
      if (r.decision) act.append(mk("취소", "undo"));
      else if (r.logoReview === "pending") act.append(mk("승인", "approve"), mk("반려", "reject"));
      else act.append(mk(r.logoReview === "approved" ? "내리기" : "다시 승인", r.logoReview === "approved" ? "reject" : "approve"));
      grid.append(el("div", { style: "border:1px solid #e5e5e5;border-radius:8px;padding:10px;background:#fff" },
        el("div", { style: "height:96px;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:6px" },
          el("img", { src: `${API}/api/catalog/logo?slug=${encodeURIComponent(r.slug)}`, alt: `${r.name} 로고 후보`, loading: "lazy", style: "max-width:100%;max-height:88px;object-fit:contain" })),
        el("div", { style: "margin-top:8px;font-weight:600" }, r.name || r.slug),
        el("div", { class: "muted", style: "font-size:12px" }, `${r.nameEn || ""} · ${state}`),
        act));
    }
    lg.append(grid);

    // 이번 주 선정 근거
    const dm = d.demand;
    const sel = el("div", { class: "box" }, el("h2", {}, "이번 주 수요 순위"),
      el("div", { class: "sub" }, dm ? `기간 ${dm.period.from}~${dm.period.to} · 후보 ${num(dm.entities)}곳 중 선정 · 데이터랩 기준어 '${dm.anchor}'=1 · 데이터랩 ${dm.datalabCalls}회${dm.errors?.length ? ` · 경고: ${dm.errors.join(" / ")}` : ""}` : "아직 실행 기록이 없습니다."));
    if (dm?.selected?.length) {
      const added = new Set(recs.map((r) => r.name));
      sel.append(el("div", { class: "scroll" }, table(["순서", "브랜드", "근거", "네이버(기준어=1)", "위키백과 ko", "위키백과 en", "결과"], dm.selected.map((x, i) => [
        String(i + 1), `${x.ko}${x.en ? ` (${x.en})` : ""}`, x.why, x.naver == null ? "—" : x.naver.toFixed(2), num(x.koViews), num(x.enViews), added.has(x.ko) ? "수록" : "—",
      ]))));
    }

    // 수록 목록
    const ls = el("div", { class: "box" }, el("h2", {}, "수록된 브랜드"), el("div", { class: "sub" }, "서버 주간 수록분입니다. 브랜드 페이지는 다음 공개부터 보입니다."));
    if (!recs.length) ls.append(el("div", { class: "empty" }, "아직 없습니다."));
    else ls.append(el("div", { class: "scroll" }, table(["수록일", "브랜드", "산업", "근거", "로고"], recs.map((r) => [
      r.importedAt || "", el("a", { href: `/brand/${encodeURIComponent(r.slug)}.html`, target: "_blank", rel: "noopener" }, `${r.name}${r.nameEn && r.nameEn !== r.name ? ` (${r.nameEn})` : ""}`),
      r.industry || "", r.demand?.why || "", r.hasLogo ? reviewKo[r.logoReview] || "" : "없음",
    ]))));
    out.append(lg, sel, ls);
  };
  load().catch((e) => { out.innerHTML = ""; out.append(el("div", { class: "empty" }, `불러오기 실패: ${e.message}`)); });
}

/** 아직 못 읽는 상태일 때의 안내 — 무엇이 빠졌는지 서버가 알려준 사유를 그대로 보여 준다. */
function setupGuide(d) {
  const wrap = el("div", {});
  wrap.append(el("div", { class: "box", style: "border-color:#f0dcb8;background:#fff8ec" },
    el("h2", {}, "아직 수치를 읽을 수 없습니다"),
    el("div", { class: "sub" }, d.reason || "설정이 필요합니다."),
    d.measurementId
      ? el("div", {}, `측정 ID ${d.measurementId} 는 사이트에 심어져 있습니다. 데이터는 GA4에 정상적으로 쌓이고 있으며, 이 화면에서 읽으려면 아래 설정이 더 필요합니다.`)
      : el("div", {}, "측정 ID도 아직 없습니다.")));
  wrap.append(el("div", { class: "box", html: `
    <h2>설정 방법</h2>
    <div class="sub">두 가지가 필요합니다 — 속성 ID(어느 속성을 읽을지)와 서비스 계정(읽을 권한).</div>
    <h3 style="font-size:14px;margin:16px 0 8px">1. 속성 ID 확인 <span class="muted" style="font-weight:400">· 1분</span></h3>
    <ol style="margin:0 0 8px 20px;line-height:2">
      <li><code>analytics.google.com</code> → 왼쪽 아래 <b>관리</b></li>
      <li><b>속성 세부정보</b> 클릭</li>
      <li>오른쪽 위 <b>속성 ID</b> 9자리 숫자를 복사</li>
    </ol>
    <h3 style="font-size:14px;margin:20px 0 8px">2. 서비스 계정 만들기 <span class="muted" style="font-weight:400">· 4분</span></h3>
    <ol style="margin:0 0 8px 20px;line-height:2">
      <li><code>console.cloud.google.com</code> 접속 (구글 계정으로 로그인)</li>
      <li>위쪽 프로젝트 선택 → <b>새 프로젝트</b> → 이름 <code>brandatlas</code> → 만들기</li>
      <li>검색창에 <b>Google Analytics Data API</b> → <b>사용</b> 클릭</li>
      <li>검색창에 <b>서비스 계정</b> → <b>서비스 계정 만들기</b></li>
      <li>이름 <code>brandatlas-admin</code> → 만들고 계속 → 역할 없이 <b>완료</b></li>
      <li>만들어진 계정 클릭 → <b>키</b> 탭 → <b>키 추가 → 새 키 만들기 → JSON</b> → 만들기</li>
      <li>JSON 파일이 자동으로 내려받아집니다. <b>이 파일과 속성 ID를 담당자에게 전달</b></li>
    </ol>
    <h3 style="font-size:14px;margin:20px 0 8px">3. GA4에 읽기 권한 주기 <span class="muted" style="font-weight:400">· 1분</span></h3>
    <ol style="margin:0 0 8px 20px;line-height:2">
      <li>JSON 파일을 메모장으로 열어 <code>client_email</code> 값을 복사
        (<code>…@….iam.gserviceaccount.com</code>)</li>
      <li><code>analytics.google.com</code> → <b>관리</b> → <b>속성 액세스 관리</b></li>
      <li>오른쪽 위 <b>+</b> → <b>사용자 추가</b> → 그 이메일 붙여넣기</li>
      <li>역할은 <b>뷰어</b> 선택 → <b>추가</b></li>
    </ol>
    <p class="muted" style="margin-top:14px">JSON 키 파일은 비밀번호와 같습니다. 채팅으로 보내지 마시고, 파일 위치만 알려주시면 담당자가 서버에 안전하게 넣습니다.</p>` }));
  return wrap;
}

// ─── 9. 설정 ────────────────────────────────────────────────────────────────
function renderSettings(host) {
  const c = CONF || {};
  const b = box(host, "연동 상태", "값은 서버 환경변수에서 옵니다. 저장소에는 두지 않습니다.");
  const yn = (v) => el("span", { class: `pill ${v ? "ok" : "warn"}` }, v ? "설정됨" : "미설정");
  b.append(table(["항목", "상태", "비고"], [
    ["네이버 검색 API (NAVER API HUB)", yn(c.naverApi), "색인 수·검색어트렌드 조회"],
    ["GA4 측정 ID", yn(c.ga4MeasurementId), c.ga4MeasurementId || "사이트에 심을 G- 코드"],
    ["GA4 속성 ID", yn(c.ga4PropertyId), c.ga4PropertyId || "어드민에서 수치를 읽을 때 필요"],
    ["nginx 접근 로그", yn(c.nginxLogReadable), "크롤러 방문 분석"],
  ]));
  const b2 = box(host, "스냅샷", "빌드가 만들고 배포가 서버로 올립니다.");
  b2.append(table(["항목", "값"], [
    ["생성 시각", SNAP.generatedAt ? new Date(SNAP.generatedAt).toLocaleString("ko-KR") : "—"],
    ["경로", el("code", {}, c.snapshotPath || "—")],
    ["수록 브랜드", num(SNAP.totals?.brands)],
  ]));
}


// ─── 10. 문의 ───────────────────────────────────────────────────────────────
// 사이트 /pages/contact.html 폼이 /contact-api/submit 으로 보낸 내용. 서버 파일에 쌓이고
// 여기서 읽는다(이메일 발송 없음).
async function renderContact(host) {
  const b = box(host, "접수된 문의", "최근 200건. 회신 연락처는 이용자가 자발적으로 적은 값이며 처리 후 1년 이내 삭제합니다.");
  const out = el("div", {}, "불러오는 중…");
  b.append(out);
  try {
    const d = await api("/api/contact/list");
    out.innerHTML = "";
    if (!d.items.length) { out.append(el("p", { class: "muted" }, "아직 접수된 문의가 없습니다.")); return; }
    out.append(el("div", { class: "scroll" }, table(["접수", "구분", "브랜드/페이지", "내용", "회신처", "IP"],
      d.items.map((r) => [
        new Date(r.at).toLocaleString("ko-KR"),
        d.kinds[r.kind] || r.kind,
        r.subject || "—",
        el("div", { style: "white-space:pre-wrap;max-width:520px" }, r.message),
        r.reply || "—",
        el("code", {}, r.ip || ""),
      ]))));
  } catch (e) {
    out.textContent = `조회 실패: ${e.message}`;
  }
}
