// 브랜드 연대기 — 인터랙티브 격자. 데이터는 페이지 아래의 정적 목록(#bh-list li)에서 읽는다
// (검색엔진이 읽는 본문과 화면의 격자가 같은 원천을 쓰도록). 원본: content/brand-history/brand-history.html
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#bh-app");
  if (!app) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const LANES = JSON.parse($("#bh-lanes").textContent).map((l, i) => ({ ...l, i, on: true }));
  const ERAS = JSON.parse($("#bh-eras").textContent);
  const LBY = Object.fromEntries(LANES.map((l) => [l.k, l]));
  const DATA = [...document.querySelectorAll("#bh-list li[data-i]")].map((li) => {
    const a = li.querySelector(".bl"), img = a && a.querySelector("img");
    return {
      i: +li.dataset.i, y: +li.dataset.y, l: li.dataset.l, id: li.id,
      yl: li.querySelector("time,.yl").textContent, t: li.querySelector(".t").textContent,
      d: (li.querySelector(".ds") || { textContent: "" }).textContent,
      bg: li.style.getPropertyValue("--c").trim(), fg: li.dataset.dk ? "#15171B" : "#FFFFFF",
      hex: li.dataset.hex || "", href: a ? a.getAttribute("href") : "", bn: a ? a.textContent.trim() : "",
      logo: img ? img.getAttribute("src") : "",
    };
  }).sort((a, b) => a.i - b.i);

  // 시간 구간: 고대는 성기게, AI 시대는 해마다
  const B = [-4000, -3000, -2000, -1000, -500, 0, 500, 1000, 1200, 1400, 1450, 1500, 1600, 1700, 1760, 1800, 1825, 1850];
  for (let y = 1860; y <= 1940; y += 10) B.push(y);
  B.push(1945); for (let y = 1950; y <= 1995; y += 5) B.push(y);
  for (let y = 2000; y <= 2018; y += 2) B.push(y);
  const endYear = +app.dataset.end;
  for (let y = 2020; y <= endYear; y++) B.push(y);
  const fy = (y) => (y < 0 ? "BC " + -y : String(y));
  const blabel = (a, b) => {
    if (b - a === 1) return [String(a), ""];
    if (a >= 1850 && b - a === 10 && a % 10 === 0) return [a + "년대", ""];
    if (a < 500) return [fy(a), "~ " + fy(b)];
    return [String(a), "~ " + (b - 1)];
  };

  const grid = $("#bh-grid");
  let h = '<div class="bh-lh"><div>연도</div>' + LANES.map((l) => `<div data-k="${l.k}" style="--lc:${l.p[0]}">${esc(l.n)}</div>`).join("") + "</div>";
  let ei = 0, alt = 0;
  for (let bi = 0; bi < B.length - 1; bi++) {
    const a = B[bi], b = B[bi + 1];
    while (ei < ERAS.length && ERAS[ei][0] <= a) {
      const e = ERAS[ei];
      h += `<div class="bh-era" id="bh-era${ei}" style="background:${e[4]}"><b>${esc(e[2])}</b><span>${esc(e[3])}</span><em>${fy(e[0])} ~ ${e[1] >= endYear ? "지금" : fy(e[1])}</em></div>`;
      ei++;
    }
    const inb = DATA.filter((d) => d.y >= a && d.y < b);
    if (!inb.length) continue;
    const [l1, l2] = blabel(a, b);
    h += `<div class="bh-row${alt++ % 2 ? " alt" : ""}"><div class="bh-yr">${l1}${l2 ? `<small>${l2}</small>` : ""}</div>`;
    LANES.forEach((l) => {
      h += `<div class="bh-cell" data-k="${l.k}">`;
      inb.filter((d) => d.l === l.k).sort((x, y) => x.y - y.y || x.i - y.i).forEach((d) => {
        const lg = d.logo ? `<span class="lg"><img src="${esc(d.logo)}" alt="" loading="lazy" decoding="async"></span>` : "";
        h += `<div class="bh-card" tabindex="0" data-i="${d.i}" style="background:${d.bg};color:${d.fg}">${lg}<b>${esc(d.yl)}</b><span class="t">${esc(d.t)}</span>${d.d ? `<span class="d">${esc(d.d)}</span>` : ""}</div>`;
      });
      h += "</div>";
    });
    h += "</div>";
  }
  h += `<div class="bh-now">${esc(app.dataset.now)}</div><div class="bh-tail"></div>`;
  grid.innerHTML = h;
  const cards = [];
  grid.querySelectorAll(".bh-card").forEach((el) => (cards[+el.dataset.i] = el));
  const rows = [...grid.querySelectorAll(".bh-row")];
  const sc = $("#bh-sc");
  const lhEl = grid.querySelector(".bh-lh");
  const setLhh = () => grid.style.setProperty("--lhh", lhEl.offsetHeight + "px");
  // 시대 띠는 sticky라 offsetTop이 '붙어 있는 위치'를 돌려준다. 바로 다음 행(비 sticky)에서 거꾸로 잰다.
  const eraTop = (e) => { const nx = e.nextElementSibling; return nx && !nx.classList.contains("bh-era") ? nx.offsetTop - e.offsetHeight : e.offsetTop; };

  // 3D 스크롤: 행이 아래에서 접혀 올라와 머리글 밑으로 젖혀진다
  let motion = !reduce;
  const mb = $("#bh-motion");
  mb.setAttribute("aria-pressed", motion);
  let ticking = false;
  function paint() {
    ticking = false;
    const vh = sc.clientHeight, top = sc.getBoundingClientRect().top, lim = lhEl.offsetHeight + 50, atEnd = sc.scrollTop + vh >= sc.scrollHeight - 4;
    for (const r of rows) {
      const bb = r.getBoundingClientRect(), t0 = bb.top - top, t1 = bb.bottom - top;
      if (!motion || t1 < -300 || t0 > vh + 300) { if (r._s) { r.style.transform = ""; r.style.opacity = ""; r._s = 0; } continue; }
      const inP = atEnd && t1 <= vh ? 1 : Math.min(1, Math.max(0, (vh - t0) / (vh * 0.42)));
      const outP = Math.min(1, Math.max(0, (t1 - lim) / (vh * 0.18)));
      const ang = (1 - inP) * 55 - (1 - outP) * 14, z = -(1 - inP) * 90;
      r.style.transform = `perspective(1100px) translateZ(${z.toFixed(1)}px) rotateX(${ang.toFixed(2)}deg)`;
      r.style.opacity = (0.2 + 0.8 * Math.min(inP, 0.4 + 0.6 * outP)).toFixed(3);
      r._s = 1;
    }
    drawRail();
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
  sc.addEventListener("scroll", req, { passive: true });
  mb.onclick = () => { motion = !motion; mb.setAttribute("aria-pressed", motion); req(); };

  // 오른쪽 레일: 전체 역사를 한눈에
  const rail = $("#bh-rail");
  let vw;
  function buildRail() {
    rail.innerHTML = "";
    const H = grid.scrollHeight;
    grid.querySelectorAll(".bh-era").forEach((e, i) => {
      const nx = grid.querySelector("#bh-era" + (i + 1)), s = document.createElement("div");
      s.className = "seg";
      const a = eraTop(e), b = nx ? eraTop(nx) : H;
      s.style.top = (a / H) * 100 + "%"; s.style.height = ((b - a) / H) * 100 + "%"; s.style.background = ERAS[i][4];
      rail.appendChild(s);
    });
    vw = document.createElement("div"); vw.className = "vw"; rail.appendChild(vw); drawRail();
  }
  function drawRail() {
    if (!vw) return;
    const H = grid.scrollHeight;
    vw.style.top = (sc.scrollTop / H) * 100 + "%";
    vw.style.height = Math.max(2, (sc.clientHeight / H) * 100) + "%";
  }
  let rdown = false;
  const railGo = (e) => { const r = rail.getBoundingClientRect(); sc.scrollTop = ((e.clientY - r.top) / r.height) * grid.scrollHeight - sc.clientHeight / 2; stop(); };
  rail.addEventListener("pointerdown", (e) => { rdown = true; rail.setPointerCapture(e.pointerId); railGo(e); });
  rail.addEventListener("pointermove", (e) => { if (rdown) railGo(e); });
  rail.addEventListener("pointerup", () => (rdown = false));

  // 자동 재생
  let playing = false, last = 0;
  const pb = $("#bh-play");
  function stop() { if (playing) { playing = false; pb.setAttribute("aria-pressed", "false"); pb.textContent = "처음부터 재생"; } }
  function tick(t) {
    if (!playing) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    sc.scrollTop += dt * Math.max(60, sc.clientHeight * 0.14);
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) { stop(); return; }
    requestAnimationFrame(tick);
  }
  pb.onclick = () => {
    if (playing) { stop(); return; }
    closeDetail(); sc.scrollTop = 0; playing = true; last = 0;
    pb.setAttribute("aria-pressed", "true"); pb.textContent = "멈춤"; requestAnimationFrame(tick);
  };
  ["wheel", "touchstart", "keydown"].forEach((ev) => sc.addEventListener(ev, stop, { passive: true }));
  $("#bh-top").onclick = () => { stop(); sc.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); };

  // 시대 칩
  const ec = $("#bh-era-chips");
  const goEra = (i) => { stop(); const el = grid.querySelector("#bh-era" + i); if (el) sc.scrollTo({ top: eraTop(el) - lhEl.offsetHeight + 1, behavior: reduce ? "auto" : "smooth" }); };
  ERAS.forEach((e, i) => {
    const b = document.createElement("button"); b.type = "button";
    b.innerHTML = `<i style="background:${e[4]}"></i>${esc(e[2])}`; b.onclick = () => goEra(i); ec.appendChild(b);
  });
  // 상단 시대 띠(#bh-e0 …)는 목록으로 가는 링크다. JS가 있으면 격자 안에서 그 시대로 옮긴다.
  document.querySelectorAll(".bh-eras a[data-era]").forEach((a) => a.addEventListener("click", (ev) => {
    ev.preventDefault(); app.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); goEra(+a.dataset.era);
  }));

  // 분야 칩: 열 보이기·숨기기
  const lc = $("#bh-lane-chips");
  function applyLanes() {
    const on = LANES.filter((l) => l.on);
    grid.style.setProperty("--cols", on.length);
    LANES.forEach((l) => grid.querySelectorAll(`[data-k="${l.k}"]`).forEach((el) => el.classList.toggle("off", !l.on)));
    setLhh(); buildRail(); req();
  }
  LANES.forEach((ln) => {
    const b = document.createElement("button"); b.type = "button";
    b.setAttribute("aria-pressed", "true"); b.innerHTML = `<i style="background:${ln.p[0]}"></i>${esc(ln.n)}`;
    b.onclick = () => { if (ln.on && LANES.filter((l) => l.on).length === 1) return; ln.on = !ln.on; b.setAttribute("aria-pressed", ln.on); applyLanes(); };
    lc.appendChild(b);
  });

  // 상세 패널
  const det = $("#bh-detail");
  const brandLink = det.querySelector(".br");
  let sel = -1;
  function select(i, go) {
    if (sel >= 0) cards[sel].classList.remove("on");
    sel = i;
    const d = DATA[i], el = cards[i];
    el.classList.add("on");
    if (!LBY[d.l].on) { LBY[d.l].on = true; lc.children[LBY[d.l].i].setAttribute("aria-pressed", "true"); applyLanes(); }
    det.hidden = false;
    const s = det.querySelector(".sw"); s.style.background = d.bg; s.style.color = d.fg;
    det.querySelector(".py").textContent = d.yl;
    det.querySelector(".hx").textContent = d.hex ? d.hex.toUpperCase() : "";
    det.querySelector("h2").textContent = d.t;
    det.querySelector(".pl").textContent = LBY[d.l].n;
    det.querySelector(".pd").textContent = d.d;
    brandLink.hidden = !d.href;
    if (d.href) {
      brandLink.href = d.href;
      brandLink.innerHTML = (d.logo ? `<img src="${esc(d.logo)}" alt="">` : "") + `<span>${esc(d.bn)} — 브랜드 사전에서 보기 →</span>`;
    }
    const w = d.y < 1500 ? 120 : d.y < 1850 ? 15 : d.y < 1990 ? 2 : 0;
    const near = DATA.filter((o) => o.i !== i && Math.abs(o.y - d.y) <= w).sort((a, b) => Math.abs(a.y - d.y) - Math.abs(b.y - d.y) || a.i - b.i).slice(0, 12);
    const ul = det.querySelector("ul");
    ul.innerHTML = "";
    det.querySelector("h3").hidden = !near.length;
    near.forEach((o) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.innerHTML = `<i style="background:${o.bg}"></i><span>${esc(o.yl)} ${esc(o.t)}</span>`;
      b.onclick = () => select(o.i, true); li.appendChild(b); ul.appendChild(li);
    });
    if (go) el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }
  function closeDetail() { det.hidden = true; if (sel >= 0) cards[sel].classList.remove("on"); sel = -1; }
  det.querySelector(".x").onclick = closeDetail;
  grid.addEventListener("click", (e) => { const c = e.target.closest(".bh-card"); if (c) { stop(); select(+c.dataset.i, false); } });
  grid.addEventListener("keydown", (e) => { const c = e.target.closest(".bh-card"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(+c.dataset.i, false); } });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

  // 검색
  const q = $("#bh-q"), qc = $("#bh-qc");
  let hits = [], hp = -1;
  q.addEventListener("input", () => {
    const s = q.value.trim().toLowerCase();
    hits = []; hp = -1;
    DATA.forEach((d) => {
      const m = !s || (d.t + " " + d.d + " " + d.yl + " " + d.bn + " " + LBY[d.l].n).toLowerCase().includes(s);
      cards[d.i].classList.toggle("dim", !m);
      if (s && m) hits.push(d.i);
    });
    hits.sort((a, b) => DATA[a].y - DATA[b].y || a - b);
    qc.textContent = s ? hits.length + "건" : "";
  });
  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && hits.length) { e.preventDefault(); hp = (hp + 1) % hits.length; stop(); select(hits[hp], true); qc.textContent = `${hp + 1}/${hits.length}`; }
  });

  // 목록의 항목 링크(#h-123)로 들어오면 격자에서 그 카드를 연다
  const fromHash = () => { const d = DATA.find((x) => "#" + x.id === location.hash); if (d) { app.scrollIntoView(); select(d.i, true); } };

  addEventListener("resize", () => { setLhh(); buildRail(); req(); });
  setLhh(); buildRail(); paint(); fromHash();
  if (document.fonts) document.fonts.ready.then(() => { setLhh(); buildRail(); req(); });
})();
