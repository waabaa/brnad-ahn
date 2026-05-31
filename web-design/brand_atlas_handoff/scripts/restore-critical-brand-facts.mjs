import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

const corrections = {
  "필립스": {
    industry: "기술·전자",
    domainSlug: "technology-electronics",
    definition: "필립스는 네덜란드에서 출발한 헬스테크와 전자 제품 브랜드입니다. 조명, 가전, 개인관리, 의료기기 영역에서 브랜드 인지도를 쌓아왔습니다.",
    current: "국가: 네덜란드; 산업: 헬스테크; 전자 제품; 개인관리; 의료기기",
  },
  "파타고니아": {
    industry: "스포츠·아웃도어",
    domainSlug: "sports-outdoor",
    definition: "파타고니아는 미국의 아웃도어 의류와 장비 브랜드입니다. 등반과 아웃도어 활동을 기반으로 성장했고 환경 책임과 제품 수선 문화를 브랜드 운영의 중요한 축으로 삼아왔습니다.",
    current: "국가: 미국; 산업: 아웃도어 의류; 스포츠·아웃도어",
  },
  "앱솔루트": {
    industry: "식음료",
    domainSlug: "food-beverage",
    definition: "앱솔루트는 스웨덴의 보드카 브랜드입니다. 병 형태와 광고 캠페인을 통해 주류 브랜드 안에서 강한 시각적 아이덴티티를 구축했습니다.",
    current: "국가: 스웨덴; 산업: 주류; 보드카",
  },
  "코치": {
    industry: "패션·럭셔리",
    domainSlug: "fashion-luxury",
    definition: "코치는 미국의 패션 브랜드입니다. 가죽 가방과 액세서리를 중심으로 성장했고 접근 가능한 럭셔리 포지션에서 브랜드 인지도를 쌓아왔습니다.",
    current: "국가: 미국; 산업: 패션; 가죽제품; 액세서리",
  },
  "몽블랑": {
    industry: "패션·럭셔리",
    domainSlug: "fashion-luxury",
    definition: "몽블랑은 독일에서 출발한 럭셔리 브랜드입니다. 필기구를 대표 자산으로 삼고 가죽제품, 시계, 액세서리로 브랜드 범위를 확장했습니다.",
    current: "국가: 독일; 산업: 럭셔리; 필기구; 가죽제품; 시계",
  },
  "질레트": {
    industry: "뷰티·퍼스널케어",
    domainSlug: "beauty-personal-care",
    definition: "질레트는 면도기와 남성 그루밍 제품으로 알려진 퍼스널케어 브랜드입니다. 면도 시스템과 교체형 카트리지 제품군을 중심으로 시장 인지도를 쌓았습니다.",
    current: "산업: 퍼스널케어; 면도기; 그루밍",
  },
  "고디바": {
    industry: "식음료",
    domainSlug: "food-beverage",
    definition: "고디바는 벨기에에서 출발한 프리미엄 초콜릿 브랜드입니다. 초콜릿과 선물용 패키지를 중심으로 고급 디저트 브랜드 이미지를 구축했습니다.",
    current: "국가: 벨기에; 산업: 초콜릿; 프리미엄 디저트",
  },
  "폴 바셋": {
    industry: "식음료",
    domainSlug: "food-beverage",
    definition: "폴 바셋은 스페셜티 커피를 중심으로 운영되는 커피 브랜드입니다. 바리스타 전문성과 커피 품질을 브랜드의 핵심 자산으로 삼습니다.",
    current: "산업: 커피; 카페; 식음료",
  },
  "갭": {
    industry: "패션·럭셔리",
    domainSlug: "fashion-luxury",
    definition: "갭은 미국의 캐주얼 패션 브랜드입니다. 데님, 티셔츠, 베이식 의류를 중심으로 대중적인 라이프스타일 패션 이미지를 구축했습니다.",
    current: "국가: 미국; 산업: 캐주얼 패션; 의류",
  },
  "스와로브스키": {
    industry: "패션·럭셔리",
    domainSlug: "fashion-luxury",
    definition: "스와로브스키는 크리스털 주얼리와 장식 제품으로 알려진 오스트리아 기반 브랜드입니다. 절단 크리스털 기술과 패션 액세서리 제품군을 중심으로 성장했습니다.",
    current: "국가: 오스트리아; 산업: 주얼리; 크리스털; 액세서리",
  },
  "투미": {
    industry: "패션·럭셔리",
    domainSlug: "fashion-luxury",
    definition: "투미는 여행가방과 비즈니스 가방을 중심으로 성장한 프리미엄 러기지 브랜드입니다. 내구성, 수납 설계, 이동 경험을 핵심 제품 가치로 삼습니다.",
    current: "산업: 러기지; 가방; 여행용품",
  },
};

let updated = 0;
for (const brand of [...(data.allBrands || []), ...(data.brands || [])]) {
  const patch = corrections[brand.name];
  if (!patch) continue;
  Object.assign(brand, {
    industry: patch.industry,
    domainSlug: patch.domainSlug,
    definition: patch.definition,
    summary: patch.definition,
    publicReady: true,
    displayPriority: "normal",
  });
  brand.sections = brand.sections || {};
  brand.sections.overview = { body: patch.definition };
  brand.sections.current = { body: patch.current };
  for (const key of ["insights", "external"]) {
    if (brand.sections[key]?.body && /wikidata_description|성씨|남성의 이름|commune|town|genus|record label|음악과 아티스트/.test(brand.sections[key].body)) {
      brand.sections[key] = { body: "" };
    }
  }
  updated += 1;
}

for (const industry of data.industries || []) {
  const rows = (data.allBrands || []).filter(b => b.domainSlug === industry.id);
  industry.count = rows.length;
  industry.examples = rows
    .filter(b => b.publicReady !== false)
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 3)
    .map(b => b.name);
}

data.factCorrections = {
  updated,
  rule: "correct_known_entity_mismatches",
  updatedAt: new Date().toISOString(),
};

await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.factCorrections, null, 2));
