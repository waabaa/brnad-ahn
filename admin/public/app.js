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
      b.name, b.industry || "—",
      el("a", { href: `/brand/${b.slug}.html`, target: "_blank", style: "color:#e2231a" }, "열기"),
    ]))));

  const b4 = box(host, `본문이 얇아 색인에서 뺀 페이지 ${num(t.thin)}건`, "noindex,follow — 링크는 살아 있고 색인만 제외됩니다.");
  b4.append(el("div", { class: "scroll" }, table(["브랜드", "산업", { label: "본문", num: 1 }, "페이지"],
    (SNAP.thinPages || []).map((p) => [
      p.name, p.industry || "—", p.renderedChars,
      el("a", { href: `/brand/${p.slug}.html`, target: "_blank", style: "color:#e2231a" }, "열기"),
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
  const b = box(host, "Google Analytics 4", "방문·유입·인기 페이지를 봅니다.");
  if (!CONF?.ga4MeasurementId) {
    b.append(el("div", { html: `
      <p style="margin-bottom:14px">아직 <b>GA4가 사이트에 붙어 있지 않습니다.</b> 측정 ID를 만들어 넣으면 그때부터 데이터가 쌓입니다.</p>
      <ol style="margin:0 0 16px 20px;line-height:2">
        <li><code>analytics.google.com</code> 접속 → 왼쪽 아래 <b>관리(톱니바퀴)</b></li>
        <li><b>속성 만들기</b> → 이름 <code>브랜드 아틀라스</code>, 시간대 <b>대한민국</b>, 통화 <b>KRW</b></li>
        <li>업종·규모는 아무거나 골라도 됩니다 → <b>만들기</b></li>
        <li>데이터 스트림에서 <b>웹</b> 선택 → URL <code>https://brandatlas.co.kr</code>, 이름 <code>brandatlas</code></li>
        <li><b>스트림 만들기</b>를 누르면 <b>측정 ID</b>가 나옵니다 (<code>G-</code>로 시작)</li>
        <li>그 측정 ID를 담당자에게 알려주면 전 페이지에 심습니다</li>
      </ol>
      <p class="muted">측정 ID를 넣어도 이 화면에 수치가 뜨려면 GA4 <b>속성 ID</b>와 조회 권한이 추가로 필요합니다. 그건 측정 ID를 받은 뒤에 이어서 설정합니다.</p>` }));
    return;
  }
  b.append(el("div", {}, `측정 ID ${CONF.ga4MeasurementId} 적용됨.`));
  const b2 = box(host, "수치", "");
  b2.append(el("div", { class: "empty" }, "GA4 Data API 연동 준비 중입니다."));
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
