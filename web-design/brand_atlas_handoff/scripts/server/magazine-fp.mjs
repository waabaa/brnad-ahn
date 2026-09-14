// 매거진 원고 지문 — 원고 파일 내용 + 오늘까지 공개일이 된 원고 수. 날짜가 바뀌어 예약 기사가 공개일을 맞으면 지문이 달라진다.
// 서버 작업(magazine-job.sh·weekly-refresh.sh)과 설치 스크립트가 같이 쓴다. 출력: 16자리 hex.
// 2026-09-14: 주간 수록 레코드 목록(content/brands)과 어드민 로고 검수 결과도 넣는다 — 로고를 승인·반려하면 어드민 신호로 즉시 다시 공개된다.
// 레코드 내용은 넣지 않는다(빌드가 검수 결과를 레코드에 적으므로, 내용을 넣으면 공개 직후 지문이 또 바뀐다).
import fs from "node:fs";
import crypto from "node:crypto";
const d = "content/magazine";
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const files = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith(".md")).sort() : [];
const due = files.filter(f => { const m = /"date":\s*"([0-9-]+)"/.exec(fs.readFileSync(`${d}/${f}`, "utf8")); return m && m[1] <= today; }).length;
const h = crypto.createHash("sha256");
for (const f of files) h.update(f + fs.readFileSync(`${d}/${f}`));
h.update(`due:${due}`);
const b = "content/brands";
if (fs.existsSync(b)) h.update(`brands:${fs.readdirSync(b).filter(f => f.endsWith(".json")).sort().join(",")}`);
const dec = `${process.env.CAT_ADMIN || "/home/developer/brandatlas-admin/data/catalog"}/decisions.json`;
if (fs.existsSync(dec)) h.update(`logo:${fs.readFileSync(dec)}`);
process.stdout.write(h.digest("hex").slice(0, 16));
