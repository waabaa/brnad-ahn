// Fetch official-domain logo images (og:image, falling back to icon link) for the
// 300-brands pipeline batch, for brands where Wikimedia Commons had no match.
// Domain list is hand-curated (known official domains only — no guessing).
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const UA = "Mozilla/5.0 (compatible; BrandAtlasDataBuilder/0.3)";

const DOMAINS = {
  695: "https://www.drjart.com", 1212: "https://www.kakaopay.com", 1235: "https://www.dunamu.com",
  1325: "https://www.cuckoo.co.kr", 1377: "https://www.theborn.co.kr", 1416: "https://www.wjthinkbig.com",
  1417: "https://www.gongcha.co.kr", 1418: "https://www.caffebene.co.kr", 1419: "https://www.dong-wha.co.kr",
  1420: "https://www.hy.co.kr", 1421: "https://www.binggrae.co.kr", 1423: "https://www.chungjungone.com",
  1424: "https://www.jongga.co.kr", 1425: "https://www.dongwon.com", 1426: "https://www.harim.com",
  1428: "https://www.yuhan-kimberly.co.kr", 1429: "https://www.beautifulstore.org", 1430: "https://www.hansae.com",
  1432: "https://www.bunjang.co.kr", 1433: "https://www.coupangeats.com", 1434: "https://www.changbi.com",
  1435: "https://www.sisain.co.kr", 1437: "https://www.melon.com", 1440: "https://www.hansalim.or.kr",
  1441: "https://www.icoop.or.kr", 1445: "https://www.linefriends.com", 1446: "https://www.kbanknow.com",
  1447: "https://www.dabangapp.com", 1448: "https://www.stayfolio.com", 1450: "https://www.hollys.co.kr",
  1451: "https://cu.bgfretail.com", 1452: "https://www.costco.co.kr", 1454: "https://kream.co.kr",
  1455: "https://www.hyundaicard.com", 1456: "https://www.everland.com", 1457: "https://www.lotteworld.com",
  1458: "https://www.cgv.co.kr", 1460: "https://www.ibk.co.kr", 1461: "https://www.shinhancard.com",
  1462: "https://www.seoulauction.com", 1463: "https://www.k-auction.com", 1464: "https://www.sac.or.kr",
  1465: "https://www.mmca.go.kr", 1466: "https://www.millie.co.kr", 1467: "https://www.hancom.com",
  1469: "https://www.megastudy.net", 1473: "https://www.eduwill.net", 1474: "https://www.etoos.com",
  1475: "https://www.chunjae.co.kr", 1476: "https://www.didimdol.co.kr", 1478: "https://www.visang.com",
  1479: "https://www.i-screamedu.co.kr", 1482: "https://www.yoons.com", 1492: "https://www.nenechicken.com",
  1493: "https://www.goobne.co.kr", 1495: "https://www.tomntoms.com", 1499: "https://www.sulbing.com",
  1505: "https://www.nolboo.co.kr", 1511: "https://www.byc.co.kr", 1512: "https://www.bullsone.com",
  1514: "https://www.boryung.co.kr", 1516: "https://www.ildong.com", 1517: "https://cosrx.com",
  1522: "https://www.trekstar.com", 1524: "https://www.8seconds.co.kr", 1525: "https://www.beanpole.co.kr",
  1526: "https://www.jobkorea.co.kr", 1527: "https://www.saramin.co.kr", 1528: "https://www.myrealtrip.com",
  1529: "https://ridi.com", 1530: "https://www.banksalad.com", 1531: "https://www.a-bly.com",
  1532: "https://www.wanted.co.kr", 1533: "https://www.gangnamunni.com", 1534: "https://www.doctornow.co.kr",
  1535: "https://www.wemakeprice.com", 1536: "https://www.tmon.co.kr", 1537: "https://www.gmarket.co.kr",
  1538: "https://www.11st.co.kr", 1539: "https://www.ssg.com", 1540: "https://www.yogiyo.co.kr",
  1541: "https://www.bithumb.com", 1542: "https://www.minumsa.com", 1543: "https://www.munhak.com",
  1544: "https://www.gimmyoung.com", 1545: "https://www.aladin.co.kr", 1546: "https://www.yes24.com",
  1548: "https://www.iconix.co.kr", 1549: "https://watcha.com", 1550: "https://www.hanatour.com",
  1551: "https://www.modetour.com", 1552: "https://www.ybtour.co.kr", 1559: "https://www.fursys.com",
  1560: "https://www.iloom.com", 1562: "https://www.winia.com", 1570: "https://www.jejusamdasoo.com",
  1578: "https://www.fitpet.co.kr", 1582: "https://www.kakaofriends.com", 1584: "https://www.agabang.co.kr",
  1586: "https://www.finda.co.kr", 1587: "https://www.8percent.kr", 1588: "https://www.miraeasset.com",
  1589: "https://www.crowdworks.kr", 1597: "https://www.raemian.co.kr", 1599: "https://www.prugio.com",
  1603: "https://www.golfzon.com", 1606: "https://www.bodyfriend.co.kr", 1607: "https://www.ceragem.com",
  1608: "https://www.hurom.com", 1609: "https://www.lottechilsung.co.kr", 1612: "https://www.samsungcard.com",
  1621: "https://www.polarisoffice.com", 1622: "https://www.inktec.com", 1624: "https://www.charmzone.co.kr",
};

function isPlaceholder(src) {
  return !src || String(src).includes("brand_atlas_logo_mark");
}

function extractLogoUrl(html, baseUrl) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  const iconLink = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
  const raw = og?.[1] || iconLink?.[1];
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

let attempted = 0, matched = 0, failed = 0;
const results = [];

for (const [idStr, domain] of Object.entries(DOMAINS)) {
  const id = Number(idStr);
  const brand = (data.allBrands || []).find(b => b.id === id);
  if (!brand || brand.logo) continue; // skip if already has a logo (shouldn't happen given curated list)
  attempted += 1;
  try {
    const res = await fetch(domain, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) { failed += 1; results.push({ id, name: brand.name, domain, status: res.status, ok: false }); await sleep(150); continue; }
    const html = await res.text();
    const logoUrl = extractLogoUrl(html, res.url || domain);
    if (!logoUrl) { failed += 1; results.push({ id, name: brand.name, domain, ok: false, reason: "no og:image/icon found" }); await sleep(150); continue; }
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
await writeFile(resolve(root, "300-brands/official-logo-report.json"), JSON.stringify({ attempted, matched, failed, results }, null, 2), "utf8");
console.log(JSON.stringify({ attempted, matched, failed }, null, 2));
