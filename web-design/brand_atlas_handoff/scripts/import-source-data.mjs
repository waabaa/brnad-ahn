import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const dataPath = resolve(root, "data/brand-atlas.json");
const importDir = resolve(root, "source-imports");
const now = new Date().toISOString();

const SOURCE_CONFIG = {
  brandirectory: {
    allowedFile: /brand(directory|finance)|brand[-_ ]?finance/i,
  },
  wipo: {
    allowedFile: /wipo|global[-_ ]?brand|trademark|mark/i,
  },
  references: {
    allowedFile: /reference|brunch|source[-_ ]?note/i,
  },
  brandb: {
    allowedFile: /brandb|brand[-_ ]?b|브랜드비/i,
  },
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  const headers = rows.shift()?.map(h => normalizeHeader(h)) || [];
  return rows
    .filter(r => r.some(v => String(v || "").trim()))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, String(r[i] || "").trim()])));
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\ufeff/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function readRows(path) {
  const ext = extname(path).toLowerCase();
  const raw = await readFile(path, "utf8");
  if (ext === ".json") {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeKeys);
    if (Array.isArray(parsed.rows)) return parsed.rows.map(normalizeKeys);
    if (Array.isArray(parsed.data)) return parsed.data.map(normalizeKeys);
    return [normalizeKeys(parsed)];
  }
  if (ext === ".csv" || ext === ".tsv") {
    return parseCsv(ext === ".tsv" ? raw.replace(/\t/g, ",") : raw);
  }
  throw new Error(`${path} is not supported. Export CSV/JSON first, then import.`);
}

function normalizeKeys(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([k, v]) => [normalizeHeader(k), v == null ? "" : String(v).trim()]));
}

function pick(row, names) {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function brandKey(row) {
  return normalize(pick(row, ["brand", "brand_name", "name", "mark", "trademark", "브랜드", "상표명"]));
}

function findBrand(brands, row) {
  const key = brandKey(row);
  if (!key) return null;
  return brands.find(b => {
    const variants = [b.name, b.nameKo, b.nameEn, b.slug].filter(Boolean).map(normalize);
    return variants.includes(key);
  }) || brands.find(b => {
    const variants = [b.name, b.nameKo, b.nameEn].filter(Boolean).map(normalize);
    return variants.some(v => v && (v.includes(key) || key.includes(v)));
  });
}

function slugify(value) {
  const slug = normalize(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `brand-${Date.now()}`;
}

function inferDomain(row, brand = {}) {
  const text = normalize([
    pick(row, ["domain", "domain_slug", "industry", "sector", "category", "산업", "카테고리"]),
    brand.industry,
  ].join(" "));
  const rules = [
    ["food-beverage", /food|beverage|drink|coffee|restaurant|cafe|식음료|커피|음료|식품|외식|주류/],
    ["retail-commerce", /retail|commerce|ecommerce|store|shopping|market|소매|리테일|커머스|유통|쇼핑/],
    ["fashion-luxury", /fashion|luxury|apparel|clothing|beauty fashion|패션|럭셔리|의류|잡화/],
    ["media-entertainment", /media|entertainment|game|music|film|contents|art|culture|character|k pop|미디어|엔터|콘텐츠|게임|음악|방송|아트|문화|캐릭터/],
    ["technology-electronics", /technology|electronics|software|platform|internet|ai|it|tech|기술|전자|소프트웨어|플랫폼|인터넷/],
    ["beauty-personal-care", /beauty|cosmetic|personal care|뷰티|화장품|퍼스널/],
    ["mobility", /mobility|automotive|car|vehicle|motor|모빌리티|자동차|차량|오토바이/],
    ["sports-outdoor", /sports|outdoor|athletic|스포츠|아웃도어|운동/],
    ["home-lifestyle", /home|lifestyle|living|furniture|interior|홈|라이프스타일|리빙|가구|인테리어/],
    ["health-pharma", /health|pharma|medical|wellness|헬스|제약|의료|건강/],
    ["travel-hospitality", /travel|hotel|hospitality|tourism|airline|여행|호텔|호스피탈리티|관광|항공/],
    ["brand-business", /business|consulting|brand|agency|marketing|professional service|public|ngo|startup|industrial|비즈니스|컨설팅|마케팅|공공|기관|스타트업/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || "brand-business";
}

function industryName(data, domainSlug, fallback = "") {
  return data.industries?.find(i => i.id === domainSlug)?.name || fallback || "브랜드·비즈니스";
}

function createBrand(data, row, configKey) {
  const name = pick(row, ["brand", "brand_name", "name", "mark", "trademark", "브랜드", "상표명"]);
  if (!name) return null;
  const domainSlug = inferDomain(row);
  const industry = industryName(data, domainSlug, pick(row, ["industry", "sector", "category", "산업", "카테고리"]));
  const description = pick(row, ["description", "summary", "definition", "설명", "요약"]);
  const value = pick(row, ["brand_value", "brand_value_usd", "value", "brand value", "브랜드_가치"]);
  const rank = pick(row, ["rank", "ranking", "brand_rank", "순위"]);
  const year = pick(row, ["year", "ranking_year", "report_year", "년도", "연도"]);
  if (!description && !value && !rank) return null;
  const id = Math.max(0, ...(data.allBrands || []).map(b => Number(b.id) || 0)) + 1;
  const brand = {
    id,
    slug: slugify(name),
    name,
    nameKo: name,
    nameEn: pick(row, ["name_en", "english_name", "brand_en", "영문명"]) || name,
    definition: description,
    summary: description,
    industry,
    domainSlug,
    tier: configKey === "brandirectory" ? "C_source_backed" : "D_directory_only",
    rating: configKey === "brandirectory" ? 4.3 : 3.6,
    image: pick(row, ["image", "image_url", "thumbnail", "이미지"]) || "assets/objects/brand_atlas_logo_mark.png",
    logo: pick(row, ["logo", "logo_url", "로고"]) || "",
    insight: "",
    logoHistory: [],
    sections: {
      overview: { body: description },
      insights: { body: "" },
      origin: { body: "" },
      identity: { body: "" },
      external: { body: "" },
      products: { body: "" },
      people: { body: "" },
      current: { body: "" },
    },
    timeline: [],
  };
  if (brand.logo) brand.logoHistory.push({ src: brand.logo, label: "대표 로고", note: "대표 브랜드 마크", alt: `${name} logo` });
  data.allBrands.push(brand);
  data.brands = data.brands || [];
  data.brands.push(brand);
  return brand;
}

function addSource(brand, source) {
  return brand || source;
}

function uniquePush(list, item, keyFn) {
  const key = keyFn(item);
  if (!key) return;
  if (!list.some(row => keyFn(row) === key)) list.push(item);
}

function renderCurrent(brand) {
  const facts = [];
  if (brand.officialWebsite) facts.push(`공식 웹사이트: ${brand.officialWebsite}`);
  if (brand.country) facts.push(`국가: ${brand.country}`);
  if (brand.headquarters) facts.push(`본사: ${brand.headquarters}`);
  if (brand.industry) facts.push(`산업: ${brand.industry}`);
  if (brand.brandFinance?.brandValue) {
    const year = brand.brandFinance.year ? `${brand.brandFinance.year}년 ` : "";
    const rank = brand.brandFinance.rank ? `; 순위: ${brand.brandFinance.rank}` : "";
    const strength = brand.brandFinance.brandStrength ? `; 브랜드 강도: ${brand.brandFinance.brandStrength}` : "";
    facts.push(`Brand Finance: ${year}브랜드 가치 ${brand.brandFinance.brandValue}${rank}${strength}`);
  }
  if (Array.isArray(brand.trademarks) && brand.trademarks.length) {
    const count = brand.trademarks.length;
    const first = brand.trademarks[0];
    const classes = [...new Set(brand.trademarks.flatMap(t => String(t.niceClasses || "").split(/[;,]\s*/).filter(Boolean)))].slice(0, 8);
    facts.push(`상표 데이터: WIPO Global Brand Database ${count}건${first.owner ? `; 권리자: ${first.owner}` : ""}${classes.length ? `; Nice class: ${classes.join(", ")}` : ""}`);
  }
  brand.sections = brand.sections || {};
  brand.sections.current = { body: facts.join("; ") };
}

function applyBrandirectory(brand, row, file) {
  const finance = {
    year: pick(row, ["year", "ranking_year", "report_year", "년도", "연도"]),
    rank: pick(row, ["rank", "ranking", "brand_rank", "순위"]),
    brandValue: pick(row, ["brand_value", "brand_value_usd", "value", "brand value", "브랜드_가치"]),
    brandStrength: pick(row, ["brand_strength", "bsi", "brand_strength_index", "브랜드_강도"]),
    sector: pick(row, ["sector", "industry", "category", "산업", "카테고리"]),
    country: pick(row, ["country", "국가"]),
  };
  brand.brandFinance = { ...(brand.brandFinance || {}), ...Object.fromEntries(Object.entries(finance).filter(([, v]) => v)) };
  if (finance.sector && !brand.industry) brand.industry = finance.sector;
  brand.domainSlug = brand.domainSlug || inferDomain(row, brand);
  if (finance.country && !brand.country) brand.country = finance.country;
  const logo = pick(row, ["logo", "logo_url", "로고"]);
  const image = pick(row, ["image", "image_url", "thumbnail", "이미지"]);
  if (logo && !brand.logo) {
    brand.logo = logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    uniquePush(brand.logoHistory, { src: logo, label: "대표 로고", note: "대표 브랜드 마크", alt: `${brand.name} logo` }, x => x.src);
  }
  if (image && (!brand.image || String(brand.image).includes("brand_atlas_logo_mark"))) brand.image = image;
  renderCurrent(brand);
}

function applyWipo(brand, row, file) {
  brand.trademarks = Array.isArray(brand.trademarks) ? brand.trademarks : [];
  const trademark = {
    mark: pick(row, ["mark", "brand", "brand_name", "trademark", "상표명"]),
    owner: pick(row, ["holder", "owner", "applicant", "name_of_holder", "권리자", "출원인"]),
    status: pick(row, ["status", "registration_status", "상태"]),
    jurisdiction: pick(row, ["office", "origin", "jurisdiction", "designated_contracting_party", "국가", "관청"]),
    registrationNumber: pick(row, ["registration_number", "reg_no", "international_registration_number", "number", "등록번호"]),
    applicationNumber: pick(row, ["application_number", "app_no", "출원번호"]),
    niceClasses: pick(row, ["nice_class", "nice_classes", "class", "goods_services_classes", "니스_분류"]),
    registrationDate: pick(row, ["registration_date", "date", "등록일"]),
  };
  uniquePush(brand.trademarks, trademark, t => [t.mark, t.owner, t.registrationNumber, t.applicationNumber].filter(Boolean).join("|"));
  renderCurrent(brand);
}

function applyReference(brand, row, file) {
  const url = pick(row, ["url", "link", "source_url", "링크"]);
  const title = pick(row, ["title", "name", "source_title", "제목"]);
  const note = pick(row, ["note", "memo", "usage", "메모"]);
  const officialWebsite = pick(row, ["official_website", "officialWebsite", "website", "공식웹사이트"]);
  const logo = pick(row, ["logo", "logo_url", "로고"]);
  const image = pick(row, ["image", "image_url", "thumbnail", "이미지"]);
  const description = pick(row, ["description", "summary", "definition", "설명", "요약"]);
  const country = pick(row, ["country", "국가"]);
  if (!url && !title) return;
  if (description) {
    brand.definition = description;
    brand.summary = description;
    brand.sections = brand.sections || {};
    brand.sections.overview = { body: description };
  }
  if (officialWebsite) brand.officialWebsite = officialWebsite;
  if (country) brand.country = country;
  if (logo && !brand.logo) {
    brand.logo = logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    uniquePush(brand.logoHistory, { src: logo, label: "대표 로고", note: "대표 브랜드 마크", alt: `${brand.name} logo` }, x => x.src);
  }
  if (image && (!brand.image || String(brand.image).includes("brand_atlas_logo_mark"))) brand.image = image;
  renderCurrent(brand);
}

function applyBrandB(data, brand, row, file) {
  const title = pick(row, ["title", "case_title", "제목"]) || brand.name;
  const url = pick(row, ["url", "brandb_url", "case_url", "source_url", "링크"]);
  const officialWebsite = pick(row, ["official_website", "officialWebsite", "website", "브랜드_공식_웹사이트", "공식웹사이트"]);
  const caseStudyUrl = pick(row, ["case_study", "case_study_url", "케이스스터디"]);
  const description = pick(row, ["description", "summary", "definition", "설명", "요약"]);
  const status = pick(row, ["status", "brand_status", "상태"]);
  const scopes = pick(row, ["scope", "design_scope", "type", "작업범위"]);
  const category = pick(row, ["category", "industry", "산업", "카테고리"]);
  const tags = pick(row, ["tags", "tag", "키워드"]);
  const year = pick(row, ["year", "연도"]);
  const image = pick(row, ["image", "image_url", "thumbnail", "이미지"]);
  const logo = pick(row, ["logo", "logo_url", "로고"]);
  const note = [status, scopes, category, tags, year ? `${year}` : ""].filter(Boolean).join(" · ");

  if (description) {
    brand.definition = description;
    brand.summary = description;
    brand.sections = brand.sections || {};
    brand.sections.overview = { body: description };
  }
  brand.domainSlug = inferDomain(row, brand);
  brand.industry = industryName(data, brand.domainSlug, category || brand.industry);
  if (officialWebsite) brand.officialWebsite = officialWebsite;
  if (image && (!brand.image || String(brand.image).includes("brand_atlas_logo_mark"))) brand.image = image;
  if (logo && !brand.logo) {
    brand.logo = logo;
    brand.logoHistory = Array.isArray(brand.logoHistory) ? brand.logoHistory : [];
    uniquePush(brand.logoHistory, { src: logo, label: "대표 로고", note: "대표 브랜드 마크", alt: `${brand.name} logo` }, x => x.src);
  }
  brand.brandB = {
    ...(brand.brandB || {}),
    status: status || brand.brandB?.status,
    scopes: scopes || brand.brandB?.scopes,
    category: category || brand.brandB?.category,
    tags: tags || brand.brandB?.tags,
    year: year || brand.brandB?.year,
  };
  renderCurrent(brand);
}

function refreshIndustries(data) {
  const brands = data.allBrands || [];
  for (const industry of data.industries || []) {
    const rows = brands.filter(b => b.domainSlug === industry.id);
    industry.count = rows.length;
    industry.examples = rows
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 3)
      .map(b => b.name);
  }
  data.stats = data.stats || {};
  data.stats.brands = brands.length;
  data.stats.magazineBrands = brands.length;
  data.stats.aTier = brands.filter(b => String(b.tier || "").startsWith("A_")).length;
  data.stats.images = brands.filter(b => b.image && !String(b.image).includes("brand_atlas_logo_mark")).length;
}

async function main() {
  const data = JSON.parse(await readFile(dataPath, "utf8"));
  const brands = data.allBrands || [];
  const files = await readdir(importDir, { withFileTypes: true }).catch(() => []);
  const imports = files
    .filter(f => f.isFile())
    .map(f => f.name)
    .filter(name => [".csv", ".json", ".tsv"].includes(extname(name).toLowerCase()))
    .filter(name => !/\.sample\./i.test(name));

  const report = { files: [], unmatchedRows: [] };

  for (const file of imports) {
    const configKey = Object.entries(SOURCE_CONFIG).find(([, cfg]) => cfg.allowedFile.test(file))?.[0];
    if (!configKey) continue;
    const rows = await readRows(join(importDir, file));
    let matched = 0;
    let created = 0;
    for (const row of rows) {
      let brand = findBrand(brands, row);
      const existed = Boolean(brand);
      if (!brand) {
        if (configKey === "brandirectory" || configKey === "references" || configKey === "brandb") {
          brand = createBrand(data, row, configKey);
        }
      }
      if (!brand) {
        report.unmatchedRows.push({ file, brand: pick(row, ["brand", "brand_name", "name", "mark", "trademark", "브랜드", "상표명"]) });
        continue;
      }
      if (!existed) created += 1;
      if (configKey === "brandirectory") applyBrandirectory(brand, row, file);
      if (configKey === "wipo") applyWipo(brand, row, file);
      if (configKey === "references") applyReference(brand, row, file);
      if (configKey === "brandb") applyBrandB(data, brand, row, file);
      matched += 1;
    }
    report.files.push({ file, type: configKey, rows: rows.length, matched, created });
  }

  refreshIndustries(data);
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
