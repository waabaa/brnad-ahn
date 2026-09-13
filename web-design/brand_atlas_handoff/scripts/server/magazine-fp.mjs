// 매거진 원고 지문 — 원고 파일 내용 + 오늘까지 공개일이 된 원고 수. 날짜가 바뀌어 예약 기사가 공개일을 맞으면 지문이 달라진다.
// 서버 작업(magazine-job.sh·weekly-refresh.sh)과 설치 스크립트가 같이 쓴다. 출력: 16자리 hex.
import fs from "node:fs";
import crypto from "node:crypto";
const d = "content/magazine";
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const files = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith(".md")).sort() : [];
const due = files.filter(f => { const m = /"date":\s*"([0-9-]+)"/.exec(fs.readFileSync(`${d}/${f}`, "utf8")); return m && m[1] <= today; }).length;
const h = crypto.createHash("sha256");
for (const f of files) h.update(f + fs.readFileSync(`${d}/${f}`));
h.update(`due:${due}`);
process.stdout.write(h.digest("hex").slice(0, 16));
