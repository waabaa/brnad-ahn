// Batch 28: WEB-VERIFIED content. Expo '85 Tsukuba emblem, cross-checked across
// 3 independent sources (Logo Histories, en/ja Wikipedia). Hallucination guards:
//  - Ikko Tanaka designed the official EMBLEM (1981); the mascot "Cosmo Hoshimaru"
//    is a SEPARATE public-competition entry finished by Makoto Wada -> kept distinct.
//  - The 80%-vote selection detail is single-source -> not asserted.
// Remaining placeholders (Maebashi, Tribank, Juchheim's, SMK, Osaka 2008) FAILED
// 2-source verification and are intentionally left as honest "확인되지 않았습니다".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "../data/brand-atlas.json");
const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

const updates = {
  "brandarchive-expo-85": {
    definition: "엑스포 '85(Expo '85)는 1985년 일본 쓰쿠바에서 열린 국제과학기술박람회로, 심볼마크는 그래픽 디자이너 다나카 잇코가 1981년 디자인했다.",
    overview: "엑스포 '85(Expo '85)는 1985년 일본 쓰쿠바에서 열린 국제과학기술박람회로, '인간·거주·환경과 과학기술'을 주제로 삼았다. 심볼마크는 무인양품(MUJI) 초대 아트 디렉터로 알려진 그래픽 디자이너 다나카 잇코(田中一光)가 1981년 디자인했다.",
    identity: "심볼은 선명한 파란 삼각형 안에 흰 원과 비스듬히 놓인 두 개의 고리를 담은 형태다. 삼각형의 세 꼭짓점은 박람회의 세 전시 구역에 대응하는 인간·거주·환경을 상징하고, 위로 솟은 꼭짓점은 쓰쿠바의 산을 연상시킨다. 흰 원은 태양을, 비스듬한 두 고리는 인간과 과학의 조화를 나타내 21세기 과학기술의 여명을 맞이한다는 의미를 담았다. 한편 박람회 마스코트 '코스모 호시마루(コスモ星丸)'는 이 심볼과 별개로, 학생 공모 당선작을 심사위원 와다 마코토가 다듬어 완성한 것이다.",
  },
};

const bySlug = new Map((data.allBrands || []).map((b) => [b.slug, b]));
let changed = 0, missing = [];
for (const [slug, u] of Object.entries(updates)) {
  const b = bySlug.get(slug);
  if (!b) { missing.push(slug); continue; }
  b.sections = b.sections || {};
  if (u.definition) b.definition = u.definition;
  for (const key of ["overview", "insights", "identity", "products", "people", "current"]) {
    if (u[key] != null) {
      b.sections[key] = b.sections[key] || { body: "" };
      b.sections[key].body = u[key];
    }
  }
  changed++;
  console.log(`updated ${slug} (${b.name})`);
}
if (missing.length) console.error("MISSING:", missing.join(", "));
fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
console.log(`\nwrote ${changed} brands → data/brand-atlas.json (indent=2)`);
