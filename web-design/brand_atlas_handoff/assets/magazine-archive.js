/* 매거진 지난 호 — 점진 펼침.
   모든 지난 호는 정적 HTML에 이미 들어 있다(JS 없이도 전부 읽힌다). 여기서는 오래된 호를 접어 두었다가
   스크롤이 끝에 닿거나 버튼을 누르면 한 호씩 펼친다. hidden="until-found" 라서 브라우저 찾기(Ctrl+F)와
   #issue-N 앵커 이동이 접힌 호를 자동으로 연다. */
(() => {
  const list = document.querySelector("[data-archive]");
  if (!list) return;
  const issues = [...list.querySelectorAll(".past-issue")];
  const FIRST = 1; // 처음부터 펼쳐 두는 호 수
  if (issues.length <= FIRST) return;
  const more = list.querySelector(".archive-more");
  const sentinel = list.querySelector(".archive-sentinel");
  const left = () => issues.filter(el => el.hidden);
  const sync = () => {
    const n = left().length;
    if (!n) { more?.remove(); sentinel?.remove(); io?.disconnect(); return; }
    if (more) more.querySelector("b").textContent = `${n}`;
  };
  const reveal = (el) => { el.hidden = false; el.removeAttribute("hidden"); };
  const next = () => { const el = left()[0]; if (el) { reveal(el); sync(); } };
  issues.slice(FIRST).forEach(el => el.setAttribute("hidden", "until-found"));
  // 찾기·앵커로 열린 경우 상태를 맞춘다.
  issues.forEach(el => el.addEventListener("beforematch", sync));
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t && issues.includes(t)) reveal(t); }
  if (more) { more.hidden = false; more.addEventListener("click", next); }
  let io = null;
  if (sentinel && "IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) next(); }, { rootMargin: "0px 0px 320px 0px" });
    io.observe(sentinel);
  }
  sync();
})();
