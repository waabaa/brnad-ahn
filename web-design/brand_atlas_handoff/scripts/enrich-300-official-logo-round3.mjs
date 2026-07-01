import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

const DOMAINS = {
  1168: "https://www.nexon.com", 1177: "https://www.orionworld.com",
  1434: "https://changbi.com", 1440: "https://hansalim.or.kr",
  1442: "https://www.doosohn.com", 1444: "https://www.happynarae.com",
  1568: "https://www.ganghwaisland.com", 1592: "https://www.chamc.co.kr",
  1613: "https://www.startupall.kr", 1614: "https://dcamp.kr",
  1615: "https://www.kocca.kr", 1617: "https://art.chosun.com",
};

function isPlaceholder(src) { return !src || String(src).includes("brand_atlas_logo_mark"); }

function extractLogoUrl(html, baseUrl) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  const iconLink = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
  const raw = og?.[1] || iconLink?.[1];
  if (!raw) return null;
  try { return new URL(raw, baseUrl).toString(); } catch { return null; }
}

async function verifyImage(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*,*/*" } });
    if (!res.ok) return false;
    const ctype = res.headers.get("content-type") || "";
    return ctype.startsWith("image");
  } catch { return false; }
}

let attempted = 0, matched = 0, failed = 0;
const results = [];

for (const [idStr, domain] of Object.entries(DOMAINS)) {
  const id = Number(idStr);
  const brand = (data.allBrands || []).find(b => b.id === id);
  if (!brand || brand.logo) continue;
  attempted += 1;
  try {
    const res = await fetch(domain, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) { failed += 1; results.push({ id, name: brand.name, domain, status: res.status, ok: false }); await sleep(200); continue; }
    const html = await res.text();
    const logoUrl = extractLogoUrl(html, res.url || domain);
    if (!logoUrl) { failed += 1; results.push({ id, name: brand.name, domain, ok: false, reason: "no og:image/icon found" }); await sleep(200); continue; }
    const valid = await verifyImage(logoUrl);
    if (!valid) { failed += 1; results.push({ id, name: brand.name, domain, logoUrl, ok: false, reason: "image url not verifiable" }); await sleep(200); continue; }
    brand.logo = logoUrl;
    if (isPlaceholder(brand.image)) brand.image = logoUrl;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    if (!brand.logoHistory.some(h => h.src === logoUrl)) {
      brand.logoHistory.unshift({ src: logoUrl, label: "대표 로고", note: "공식 홈페이지 og:image/아이콘", alt: `${brand.name} logo` });
    }
    matched += 1;
    results.push({ id, name: brand.name, domain, logoUrl, ok: true });
  } catch (e) {
    failed += 1;
    results.push({ id, name: brand.name, domain, ok: false, error: String(e.message || e) });
  }
  await sleep(200);
}

for (const brand of data.brands || []) {
  const canonical = (data.allBrands || []).find(item => item.slug === brand.slug);
  if (!canonical) continue;
  if (canonical.logo) brand.logo = canonical.logo;
  if (canonical.image) brand.image = canonical.image;
  if (canonical.logoHistory?.length) brand.logoHistory = canonical.logoHistory;
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
await writeFile(resolve(root, "300-brands/official-logo-report-round3.json"), JSON.stringify({ attempted, matched, failed, results }, null, 2), "utf8");
console.log(JSON.stringify({ attempted, matched, failed, results }, null, 2));
