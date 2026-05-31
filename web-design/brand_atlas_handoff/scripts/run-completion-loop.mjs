import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const reportDir = resolve(root, "reports");
const maxLoops = Number(process.env.MAX_COMPLETION_LOOPS || 6);

function run(script, env = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(root, "scripts", script)], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => {
      if (code) reject(new Error(`${script} failed\n${stderr || stdout}`));
      else resolvePromise({ script, stdout: stdout.trim() });
    });
  });
}

function metrics(data) {
  const all = data.allBrands || [];
  const isPlaceholder = src => !src || String(src).includes("brand_atlas_logo_mark");
  const bodyLen = b => ["overview", "origin", "identity", "products", "people", "current"]
    .reduce((sum, key) => sum + String(b.sections?.[key]?.body || "").trim().length, 0);
  return {
    totalBrands: all.length,
    placeholderImages: all.filter(b => isPlaceholder(b.image)).length,
    missingLogo: all.filter(b => isPlaceholder(b.logo)).length,
    missingLogoHistory: all.filter(b => !(b.logoHistory || []).length).length,
    weakBody: all.filter(b => bodyLen(b) < 700).length,
    withTimeline: all.filter(b => (b.timeline || []).length).length,
  };
}

async function readMetrics() {
  return metrics(JSON.parse(await readFile(dataPath, "utf8")));
}

await mkdir(reportDir, { recursive: true });
const log = [];
let previous = await readMetrics();

for (let loop = 1; loop <= maxLoops; loop += 1) {
  const steps = [];
  for (const [script, env] of [
    ["import-brand-wiki-sections.mjs", {}],
    ["apply-verified-priority-assets.mjs", {}],
    ["enrich-commons-logo-assets.mjs", { COMMONS_LOGO_LIMIT: "90" }],
    ["remove-source-fields.mjs", {}],
    ["strip-synthetic-content.mjs", {}],
    ["apply-verified-priority-assets.mjs", {}],
    ["remove-source-fields.mjs", {}],
    ["build-data-backlog.mjs", {}],
    ["qa-check.mjs", {}],
  ]) {
    steps.push(await run(script, env));
  }
  const current = await readMetrics();
  const delta =
    (previous.placeholderImages - current.placeholderImages) +
    (previous.missingLogo - current.missingLogo) +
    (previous.missingLogoHistory - current.missingLogoHistory) +
    (previous.weakBody - current.weakBody) +
    (current.withTimeline - previous.withTimeline);
  log.push({ loop, previous, current, delta, steps });
  previous = current;
  if (delta <= 0) break;
}

const report = {
  updatedAt: new Date().toISOString(),
  loops: log.length,
  finalMetrics: previous,
  loopSummary: log.map(item => ({
    loop: item.loop,
    delta: item.delta,
    previous: item.previous,
    current: item.current,
  })),
};

await writeFile(resolve(reportDir, "completion-loop-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
