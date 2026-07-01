import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

const DOMAINS = {
  1417: "https://www.gong-cha.co.kr", 1418: "https://www.caffebene.com", 1421: "https://www.binggrae.com",
  1427: "https://www.sajodaelim.co.kr", 1428: "https://www.yuhankimberly.co.kr", 1436: "https://page.kakao.com",
  1439: "https://www.kakaomobility.com", 1450: "https://www.hollys.co.kr", 1453: "https://shopping.naver.com",
  1454: "https://kream.co.kr", 1455: "https://www.hyundaicard.com", 1458: "https://www.cgv.co.kr",
  1459: "https://www.lotteconfectionery.com", 1468: "https://www.ckdhc.com", 1472: "https://www.noonnoppi.com",
  1478: "https://www.visang.com", 1487: "https://www.tuntun.co.kr", 1495: "https://www.tomntoms.com",
  1499: "https://www.sulbing.com", 1505: "https://www.nolboo.co.kr", 1506: "https://www.dongapencil.co.kr",
  1507: "https://www.alpha.co.kr", 1508: "https://www.morningglory.co.kr", 1509: "https://www.kleannara.co.kr",
  1510: "https://www.ssangbangwool.co.kr", 1512: "https://www.bullsone.com", 1513: "https://www.dongkookpharm.com",
  1515: "https://www.gccorp.com", 1518: "https://www.apieu.com", 1524: "https://www.8seconds.co.kr",
  1525: "https://www.beanpole.co.kr", 1531: "https://www.a-bly.com", 1535: "https://www.wemakeprice.com",
  1537: "https://www.gmarket.co.kr", 1547: "https://www.ypbooks.co.kr", 1548: "https://www.iconix.co.kr",
  1555: "https://www.kickgoing.com", 1557: "https://www.hyundailivart.co.kr", 1558: "https://www.enex.co.kr",
  1561: "https://www.casamia.co.kr", 1563: "https://www.treepla.net", 1578: "https://www.fitpet.co.kr",
  1582: "https://www.kakaofriends.com", 1584: "https://www.agabang.co.kr", 1592: "https://www.chamc.co.kr",
  1597: "https://www.raemian.co.kr", 1598: "https://www.hillstate.co.kr", 1600: "https://www.r114.com",
  1602: "https://www.megabox.co.kr", 1609: "https://www.lottechilsung.co.kr", 1620: "https://www.welaaa.com",
  1622: "https://www.inktec.com", 1623: "https://www.coreana.co.kr", 1625: "https://www.somang.co.kr",
  1626: "https://www.enprani.com", 1627: "https://www.naturalplus.co.kr",
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
    if (!res.ok) { failed += 1; results.push({ id, name: brand.name, domain, status: res.status, ok: false }); await sleep(150); continue; }
    const html = await res.text();
    const logoUrl = extractLogoUrl(html, res.url || domain);
    if (!logoUrl) { failed += 1; results.push({ id, name: brand.name, domain, ok: false, reason: "no og:image/icon found" }); await sleep(150); continue; }
    const valid = await verifyImage(logoUrl);
    if (!valid) { failed += 1; results.push({ id, name: brand.name, domain, logoUrl, ok: false, reason: "image url not verifiable" }); await sleep(150); continue; }
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
  await sleep(150);
}

for (const brand of data.brands || []) {
  const canonical = (data.allBrands || []).find(item => item.slug === brand.slug);
  if (!canonical) continue;
  if (canonical.logo) brand.logo = canonical.logo;
  if (canonical.image) brand.image = canonical.image;
  if (canonical.logoHistory?.length) brand.logoHistory = canonical.logoHistory;
}

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
await writeFile(resolve(root, "300-brands/official-logo-report-round2.json"), JSON.stringify({ attempted, matched, failed, results }, null, 2), "utf8");
console.log(JSON.stringify({ attempted, matched, failed }, null, 2));
