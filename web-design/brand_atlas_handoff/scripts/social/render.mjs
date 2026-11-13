// 렌더 — 카드 HTML → PNG(헤드리스 Chrome CLI, 의존성 없음) → JPEG(인스타그램은 이미지로 JPEG만 받는다),
// 릴스는 9:16 카드 PNG를 ffmpeg로 이어 붙인 MP4.
// 릴스 움직임은 short-gengen/engine/shorts_engine/build_beat.py의 Ken Burns(zoompan, 2배 슈퍼샘플, 최대 8% 확대)를 옮겼다.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";
import { FORMATS, slideHtml } from "./templates.mjs";

const CHROME = process.env.CHROME_BIN || ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(p => fs.existsSync(p));

function shot(html, out, { w, h }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ba-card-"));
  try {
    const file = path.join(tmp, "card.html");
    fs.writeFileSync(file, html);
    execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
      "--allow-file-access-from-files", "--force-device-scale-factor=1", "--default-background-color=ffffffff",
      "--virtual-time-budget=4000", `--user-data-dir=${path.join(tmp, "prof")}`, `--window-size=${w},${h + 240}`, `--screenshot=${path.join(tmp, "raw.png")}`, `file://${file}`],
    { stdio: "ignore", timeout: 90000 });
    // Chrome 버전에 따라 창 크기에서 브라우저 영역을 빼고 뷰포트를 잡는다 — 넉넉히 띄워 찍고 정확한 크기로 자른다.
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(tmp, "raw.png"), "-vf", `crop=${w}:${h}:0:0`, out]);
    if (!fs.existsSync(out)) throw new Error("스크린샷 실패");
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

/** 슬라이드 → 피드용 JPEG(01.jpg …) 또는 스토리용 PNG(s01.png …). 파일명 목록을 돌려준다. */
export function renderSlides(slides, dir, format = "feed") {
  fs.mkdirSync(dir, { recursive: true });
  const f = FORMATS[format], names = [];
  slides.forEach((s, i) => {
    const n = String(i + 1).padStart(2, "0");
    const png = path.join(dir, format === "feed" ? `.${n}.png` : `s${n}.png`);
    shot(slideHtml(s, i, slides.length, format), png, f);
    if (format === "feed") {
      execFileSync("ffmpeg", ["-y", "-v", "error", "-i", png, "-q:v", "2", path.join(dir, `${n}.jpg`)]);
      fs.rmSync(png);
      names.push(`${n}.jpg`);
    } else names.push(path.basename(png));
  });
  return names;
}

const ZOOM_MAX = 1.08, SUPERSAMPLE = 2, FPS = 30, XFADE = 0.4;
function zoompan(motion, frames, w, h) {
  const last = Math.max(1, frames - 1);
  const z = motion === "in" ? `min(1.0+${(ZOOM_MAX - 1).toFixed(4)}*on/${last},${ZOOM_MAX})` : `max(${ZOOM_MAX}-${(ZOOM_MAX - 1).toFixed(4)}*on/${last},1.0)`;
  return `zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${FPS}`;
}

/** 스토리 PNG들 → reel.mp4 (H.264/AAC, 9:16, 30fps). 첫 장 2.6초, 나머지 3.4초, 0.4초 교차 전환, BGM 페이드. */
export function buildReel(dir, pngs, bgm = "warm_pad") {
  const { w, h } = FORMATS.story;
  const durs = pngs.map((_, i) => (i === 0 ? 2.6 : 3.4));
  const args = ["-y", "-v", "error"];
  for (const p of pngs) args.push("-i", path.join(dir, p));
  const bgmFile = path.join(ROOT, "scripts/social/assets/bgm", `${bgm}_loop.mp3`);
  args.push("-stream_loop", "-1", "-i", bgmFile);
  const parts = pngs.map((_, i) => `[${i}:v]scale=${w * SUPERSAMPLE}:${h * SUPERSAMPLE},${zoompan(i % 2 ? "out" : "in", Math.round(durs[i] * FPS), w, h)},setsar=1,format=yuv420p[v${i}]`);
  let prev = "v0", t = durs[0];
  for (let i = 1; i < pngs.length; i++) {
    const off = (t - XFADE).toFixed(3);
    parts.push(`[${prev}][v${i}]xfade=transition=fade:duration=${XFADE}:offset=${off}[x${i}]`);
    prev = `x${i}`; t = t + durs[i] - XFADE;
  }
  const total = t.toFixed(3);
  parts.push(`[${pngs.length}:a]atrim=0:${total},afade=t=in:d=0.6,afade=t=out:st=${(t - 1.2).toFixed(3)}:d=1.2,volume=0.55[a]`);
  args.push("-filter_complex", parts.join(";"), "-map", `[${prev}]`, "-map", "[a]", "-t", total,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", path.join(dir, "reel.mp4"));
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], timeout: 600000 });
  for (const p of pngs) fs.rmSync(path.join(dir, p), { force: true });
  return { file: "reel.mp4", seconds: Number(total) };
}
