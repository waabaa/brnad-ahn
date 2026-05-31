from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"


DOMAIN_RULES = [
    {
        "slug": "food-beverage",
        "label_ko": "식음료",
        "label_en": "Food & Beverage",
        "isic_code": "C",
        "keywords": ["food", "beverage", "coffee", "restaurant", "fast food", "brewery", "distillery", "chocolate", "cereal", "drink", "패스트푸드", "커피", "음료", "주류", "맥주", "식품"],
    },
    {
        "slug": "fashion-luxury",
        "label_ko": "패션·럭셔리",
        "label_en": "Fashion & Luxury",
        "isic_code": "C",
        "keywords": ["fashion", "luxury", "clothing", "apparel", "watch", "jewelry", "jewellery", "leather", "cosmetics", "패션", "럭셔리", "명품", "의류", "시계", "주얼리", "가죽"],
    },
    {
        "slug": "sports-outdoor",
        "label_ko": "스포츠·아웃도어",
        "label_en": "Sports & Outdoor",
        "isic_code": "C",
        "keywords": ["sportswear", "sporting", "outdoor", "athletic", "running", "sneaker", "스포츠", "아웃도어", "운동화", "러닝"],
    },
    {
        "slug": "beauty-personal-care",
        "label_ko": "뷰티·퍼스널케어",
        "label_en": "Beauty & Personal Care",
        "isic_code": "C",
        "keywords": ["beauty", "cosmetic", "cosmetics", "skincare", "personal care", "fragrance", "뷰티", "화장품", "스킨케어", "향수", "퍼스널케어"],
    },
    {
        "slug": "technology-electronics",
        "label_ko": "기술·전자",
        "label_en": "Technology & Electronics",
        "isic_code": "J",
        "keywords": ["software", "internet", "e-commerce", "computer", "technology", "semiconductor", "electronics", "telecommunication", "정보", "기술", "전자", "반도체", "인터넷", "소프트웨어"],
    },
    {
        "slug": "mobility",
        "label_ko": "모빌리티",
        "label_en": "Mobility",
        "isic_code": "C",
        "keywords": ["automotive", "automobile", "motorcycle", "vehicle", "car", "tire", "transport", "자동차", "모터사이클", "타이어", "운송"],
    },
    {
        "slug": "home-lifestyle",
        "label_ko": "홈·라이프스타일",
        "label_en": "Home & Lifestyle",
        "isic_code": "C",
        "keywords": ["furniture", "kitchen", "home", "household", "stationery", "lifestyle", "toy", "가구", "주방", "생활용품", "문구", "가정"],
    },
    {
        "slug": "travel-hospitality",
        "label_ko": "여행·호스피탈리티",
        "label_en": "Travel & Hospitality",
        "isic_code": "I",
        "keywords": ["hotel", "hospitality", "travel", "resort", "tourism", "여행", "리조트", "호텔"],
    },
    {
        "slug": "retail-commerce",
        "label_ko": "리테일·커머스",
        "label_en": "Retail & Commerce",
        "isic_code": "G",
        "keywords": ["retail", "retailer", "store", "commerce", "supermarket", "리테일", "유통", "커머스", "상점"],
    },
    {
        "slug": "media-entertainment",
        "label_ko": "미디어·엔터테인먼트",
        "label_en": "Media & Entertainment",
        "isic_code": "J",
        "keywords": ["media", "entertainment", "music", "film", "game", "미디어", "엔터테인먼트", "게임"],
    },
    {
        "slug": "health-pharma",
        "label_ko": "헬스·제약",
        "label_en": "Health & Pharma",
        "isic_code": "Q",
        "keywords": ["pharmaceutical", "medicine", "healthcare", "drug", "제약", "의약품", "헬스케어", "약"],
    },
    {
        "slug": "brand-business",
        "label_ko": "브랜드·비즈니스",
        "label_en": "Brand & Business",
        "isic_code": "M",
        "keywords": ["brand valuation", "ranking", "consulting", "브랜드 가치", "랭킹", "컨설팅"],
    },
]


ISIC_LABELS = {
    "C": "Manufacturing",
    "G": "Wholesale and retail trade; repair of motor vehicles and motorcycles",
    "I": "Accommodation and food service activities",
    "J": "Information and communication",
    "M": "Professional, scientific and technical activities",
    "Q": "Human health and social work activities",
}

DOMAIN_OVERRIDES = {
    "adidas": "sports-outdoor",
    "nike": "sports-outdoor",
    "puma": "sports-outdoor",
    "reebok": "sports-outdoor",
    "newbalance": "sports-outdoor",
    "thenorthface": "sports-outdoor",
    "patagonia": "sports-outdoor",
    "arcteryx": "sports-outdoor",
    "k2": "sports-outdoor",
    "montbell": "sports-outdoor",
    "gshock": "fashion-luxury",
    "aspirin": "health-pharma",
    "vaseline": "beauty-personal-care",
    "dove": "beauty-personal-care",
    "lancôme": "beauty-personal-care",
    "lancome": "beauty-personal-care",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9가-힣]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-") or "brand"


def compact(value: str, limit: int) -> str:
    value = clean_text(value)
    if len(value) <= limit:
        return value
    cut = value[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(".,;:") + "..."


def norm_key(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^0-9a-z가-힣]+", "", value.lower())


BAD_PROFILE_MARKERS = [
    "surname",
    "given name",
    "family name",
    "disambiguation",
    "list of people",
    "university",
    "college",
    "학교",
    "대학교",
    "성씨",
    "동명이인",
]


def looks_bad_profile(title: str | None, description: str | None, summary: str | None) -> bool:
    text = " ".join(clean_text(part).lower() for part in [title, description, summary] if part)
    return any(marker in text for marker in BAD_PROFILE_MARKERS)


def looks_like_brand_profile(brand: sqlite3.Row, title: str | None, description: str | None, summary: str | None) -> bool:
    if looks_bad_profile(title, description, summary):
        return False
    title_key = norm_key(title)
    if not title_key:
        return False
    for candidate in [brand["canonical_name"], brand["english_name"], brand["wikidata_label"]]:
        key = norm_key(candidate)
        if len(key) >= 3 and (key in title_key or title_key in key):
            return True
    return False


def safe_wikidata_description(brand: sqlite3.Row) -> str:
    description = brand["wikidata_description"] or ""
    label = brand["wikidata_label"] or ""
    if looks_bad_profile(label, description, ""):
        return ""
    return description


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?。])\s+|(?<=다\.)\s+|\n+", text)
    return [clean_text(part) for part in parts if len(clean_text(part)) > 20]


class MagazineBuilder:
    def __init__(self, db_path: Path) -> None:
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()

    def init_db(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS magazine_domains (
                slug TEXT PRIMARY KEY,
                label_ko TEXT NOT NULL,
                label_en TEXT NOT NULL,
                isic_code TEXT NOT NULL,
                isic_label TEXT NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS brand_aliases (
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                alias TEXT NOT NULL,
                alias_type TEXT NOT NULL,
                source TEXT,
                PRIMARY KEY (brand_id, alias)
            );

            CREATE TABLE IF NOT EXISTS brand_magazine_profiles (
                brand_id INTEGER PRIMARY KEY REFERENCES brand_entities(id) ON DELETE CASCADE,
                slug TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                english_name TEXT,
                domain_slug TEXT NOT NULL REFERENCES magazine_domains(slug),
                isic_code TEXT NOT NULL,
                isic_label TEXT NOT NULL,
                hero_image_path TEXT,
                logo_image_path TEXT,
                deck TEXT,
                editorial_summary TEXT,
                origin_story TEXT,
                identity_story TEXT,
                product_story TEXT,
                people_story TEXT,
                current_status TEXT,
                source_coverage_score INTEGER NOT NULL DEFAULT 0,
                magazine_ready_score INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS magazine_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                section_key TEXT NOT NULL,
                section_title TEXT NOT NULL,
                body TEXT NOT NULL,
                source_json TEXT,
                sort_order INTEGER NOT NULL,
                UNIQUE(brand_id, section_key)
            );

            CREATE TABLE IF NOT EXISTS brand_timeline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                year INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                source_entry_id INTEGER,
                confidence REAL NOT NULL DEFAULT 0.5,
                UNIQUE(brand_id, year, description)
            );

            CREATE TABLE IF NOT EXISTS brand_media_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                asset_role TEXT NOT NULL,
                local_path TEXT,
                remote_url TEXT,
                alt TEXT,
                source_table TEXT,
                source_id INTEGER,
                sort_order INTEGER NOT NULL DEFAULT 0,
                UNIQUE(brand_id, asset_role, local_path, remote_url)
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS brand_search_fts USING fts5(
                brand_id UNINDEXED,
                display_name,
                english_name,
                domain,
                aliases,
                searchable_text,
                tokenize='unicode61'
            );

            CREATE VIEW IF NOT EXISTS v_brand_directory AS
            SELECT
                p.brand_id,
                p.slug,
                p.display_name,
                p.english_name,
                d.label_ko AS domain_ko,
                d.label_en AS domain_en,
                p.isic_code,
                p.isic_label,
                p.deck,
                p.hero_image_path,
                p.logo_image_path,
                p.source_coverage_score,
                p.magazine_ready_score
            FROM brand_magazine_profiles p
            JOIN magazine_domains d ON d.slug = p.domain_slug;

            CREATE VIEW IF NOT EXISTS v_brand_magazine AS
            SELECT
                p.brand_id,
                p.slug,
                p.display_name,
                p.english_name,
                p.domain_slug,
                p.isic_code,
                p.hero_image_path,
                p.logo_image_path,
                s.section_key,
                s.section_title,
                s.body,
                s.sort_order
            FROM brand_magazine_profiles p
            JOIN magazine_sections s ON s.brand_id = p.brand_id;
            """
        )
        for rule in DOMAIN_RULES:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO magazine_domains
                (slug, label_ko, label_en, isic_code, isic_label, description)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    rule["slug"],
                    rule["label_ko"],
                    rule["label_en"],
                    rule["isic_code"],
                    ISIC_LABELS.get(rule["isic_code"], ""),
                    f"{rule['label_ko']} 브랜드를 위한 편집 도메인. 표준 축은 ISIC Rev.4 {rule['isic_code']} 섹션입니다.",
                ),
            )
        self.conn.commit()

    def classify_domain(self, brand: sqlite3.Row, text: str) -> dict[str, str]:
        keys = [
            re.sub(r"[^a-z0-9]+", "", clean_text(brand["english_name"]).lower()),
            re.sub(r"[^a-z0-9]+", "", clean_text(brand["canonical_name"]).lower()),
        ]
        for key in keys:
            if key in DOMAIN_OVERRIDES:
                return next(rule for rule in DOMAIN_RULES if rule["slug"] == DOMAIN_OVERRIDES[key])
        lowered = text.lower()
        best = DOMAIN_RULES[-1]
        best_hits = -1
        for rule in DOMAIN_RULES:
            hits = sum(1 for keyword in rule["keywords"] if keyword.lower() in lowered)
            if hits > best_hits:
                best = rule
                best_hits = hits
        if best_hits <= 0:
            industry = clean_text(brand["industry"]).lower()
            isic = self.conn.execute(
                "SELECT code FROM brand_industries WHERE brand_id = ? ORDER BY confidence DESC LIMIT 1",
                (brand["id"],),
            ).fetchone()
            if isic and isic["code"] == "J":
                best = next(rule for rule in DOMAIN_RULES if rule["slug"] == "technology-electronics")
            elif isic and isic["code"] == "I":
                best = next(rule for rule in DOMAIN_RULES if rule["slug"] == "travel-hospitality")
            elif "retail" in industry:
                best = next(rule for rule in DOMAIN_RULES if rule["slug"] == "retail-commerce")
        return best

    def brand_entries(self, brand_id: int) -> list[sqlite3.Row]:
        return self.conn.execute(
            """
            SELECT e.*
            FROM entries e
            JOIN brand_entry_map m ON m.entry_id = e.id
            WHERE m.brand_id = ?
            ORDER BY CASE WHEN e.source='naver' THEN 0 ELSE 1 END, e.id
            """,
            (brand_id,),
        ).fetchall()

    def best_images(self, brand_id: int) -> tuple[str | None, str | None]:
        logo = self.conn.execute(
            """
            SELECT local_path FROM update_images
            WHERE brand_id = ? AND image_type = 'logo' AND local_path IS NOT NULL
            ORDER BY id LIMIT 1
            """,
            (brand_id,),
        ).fetchone()
        if not logo:
            logo = self.conn.execute(
                """
                SELECT local_path FROM logo_history
                WHERE brand_id = ? AND local_path IS NOT NULL
                ORDER BY COALESCE(inferred_year, '9999') DESC, id DESC LIMIT 1
                """,
                (brand_id,),
            ).fetchone()

        hero = self.conn.execute(
            """
            SELECT i.local_path
            FROM images i
            JOIN brand_entry_map m ON m.entry_id = i.entry_id
            WHERE m.brand_id = ? AND i.local_path IS NOT NULL
            ORDER BY
                CASE i.kind WHEN 'og' THEN 0 WHEN 'content' THEN 1 ELSE 2 END,
                COALESCE(i.bytes, 0) DESC,
                i.id
            LIMIT 1
            """,
            (brand_id,),
        ).fetchone()
        if not hero:
            hero = self.conn.execute(
                """
                SELECT local_path FROM update_images
                WHERE brand_id = ? AND local_path IS NOT NULL
                ORDER BY CASE image_type WHEN 'image' THEN 0 ELSE 1 END, id LIMIT 1
                """,
                (brand_id,),
            ).fetchone()
        return (hero["local_path"] if hero else None, logo["local_path"] if logo else None)

    def source_count(self, brand_id: int) -> int:
        return int(
            self.conn.execute(
                """
                SELECT COUNT(DISTINCT sd.id)
                FROM source_documents sd
                JOIN (
                    SELECT source_document_id FROM brand_facts WHERE brand_id = ?
                    UNION ALL SELECT source_document_id FROM brand_updates WHERE brand_id = ?
                    UNION ALL SELECT source_document_id FROM update_images WHERE brand_id = ?
                    UNION ALL SELECT source_document_id FROM brand_products WHERE brand_id = ?
                    UNION ALL SELECT source_document_id FROM brand_people WHERE brand_id = ?
                    UNION ALL SELECT source_document_id FROM brand_news WHERE brand_id = ?
                ) x ON x.source_document_id = sd.id
                """,
                (brand_id, brand_id, brand_id, brand_id, brand_id, brand_id),
            ).fetchone()[0]
            or 0
        )

    def aliases_for(self, brand: sqlite3.Row, entries: list[sqlite3.Row]) -> list[str]:
        aliases = {brand["canonical_name"]}
        for value in [brand["english_name"], brand["wikidata_label"]]:
            if value:
                aliases.add(clean_text(value))
        for entry in entries:
            aliases.add(clean_text(entry["title"]))
            subtitle = clean_text(entry["subtitle"])
            if subtitle:
                aliases.add(subtitle.strip("[]").replace("음성듣기", "").strip())
        aliases = {alias for alias in aliases if alias}
        for alias in aliases:
            alias_type = "primary" if alias == brand["canonical_name"] else "alternate"
            self.conn.execute(
                "INSERT OR REPLACE INTO brand_aliases (brand_id, alias, alias_type, source) VALUES (?, ?, ?, ?)",
                (brand["id"], alias, alias_type, "derived"),
            )
        return sorted(aliases)

    def section_texts(self, brand: sqlite3.Row, entries: list[sqlite3.Row]) -> dict[str, str]:
        summaries = [clean_text(e["summary"]) for e in entries if e["summary"]]
        bodies = [clean_text(e["body_text"]) for e in entries if e["body_text"]]
        all_text = "\n".join(summaries + bodies)

        update_rows = self.conn.execute(
            "SELECT title, summary FROM brand_updates WHERE brand_id = ? ORDER BY confidence DESC, id LIMIT 4",
            (brand["id"],),
        ).fetchall()
        update_text = " ".join(clean_text(row["summary"]) for row in update_rows)

        fact_rows = self.conn.execute(
            "SELECT fact_type, fact_value FROM brand_facts WHERE brand_id = ? ORDER BY confidence DESC, id LIMIT 20",
            (brand["id"],),
        ).fetchall()
        facts = {row["fact_type"]: row["fact_value"] for row in fact_rows}

        product_entries = [e for e in entries if any(k in e["title"] for k in ["제품", "서비스", "기술"])]
        identity_entries = [e for e in entries if any(k in e["title"] for k in ["브랜딩", "철학", "시그니처", "아이덴티티"])]
        origin_entries = [e for e in entries if "역사" in e["title"]] or entries[:1]

        product_rows = self.conn.execute(
            "SELECT product_name, source FROM brand_products WHERE brand_id = ? ORDER BY id LIMIT 8",
            (brand["id"],),
        ).fetchall()
        people_rows = self.conn.execute(
            "SELECT role, person_name FROM brand_people WHERE brand_id = ? ORDER BY role, id LIMIT 8",
            (brand["id"],),
        ).fetchall()
        financial_rows = self.conn.execute(
            "SELECT metric, value, point_in_time FROM brand_financials WHERE brand_id = ? ORDER BY id LIMIT 8",
            (brand["id"],),
        ).fetchall()
        external_rows = self.conn.execute(
            """
            SELECT source, language, title, description, summary, url
            FROM external_profiles
            WHERE brand_id = ?
            ORDER BY CASE language WHEN 'ko' THEN 0 WHEN 'en' THEN 1 ELSE 2 END, id
            LIMIT 3
            """,
            (brand["id"],),
        ).fetchall()
        insight_rows = self.conn.execute(
            """
            SELECT insight_type, public_claim, public_explanation, confidence, editorial_status
            FROM brand_insights
            WHERE brand_id = ? AND editorial_status = 'approved'
            ORDER BY
                confidence DESC,
                id
            LIMIT 8
            """,
            (brand["id"],),
        ).fetchall()

        people_bits = [f"{row['role']}: {row['person_name']}" for row in people_rows]
        for key in ["founded_by", "chief_executive_officer"]:
            if facts.get(key):
                people_bits.append(f"{key}: {facts[key]}")

        current_bits = []
        for label, key in [
            ("공식 웹사이트", "official_website"),
            ("국가", "country"),
            ("본사", "headquarters"),
            ("상위/소유 조직", "parent_organization"),
            ("소유자", "owned_by"),
            ("산업", "industry"),
            ("상장 시장", "stock_exchange"),
            ("티커", "ticker_symbol"),
        ]:
            value = facts.get(key) or brand[key] if key in brand.keys() else None
            if value:
                current_bits.append(f"{label}: {value}")
        for row in financial_rows:
            point = f" ({row['point_in_time']})" if row["point_in_time"] else ""
            current_bits.append(f"{row['metric']}{point}: {row['value']}")

        insight_bits = []
        for row in insight_rows:
            claim = clean_text(row["public_claim"])
            explanation = clean_text(row["public_explanation"])
            if not claim:
                continue
            if explanation and explanation != claim:
                insight_bits.append(f"{claim} {explanation}")
            else:
                insight_bits.append(claim)

        external_bits = []
        for row in external_rows:
            if not looks_like_brand_profile(brand, row["title"], row["description"], row["summary"]):
                continue
            description = clean_text(row["description"])
            summary = clean_text(row["summary"])
            text = " ".join(part for part in [description, summary] if part)
            if text:
                external_bits.append(text)
        wikidata_description = safe_wikidata_description(brand)

        return {
            "deck": compact(
                summaries[0] if summaries else update_text or (external_bits[0] if external_bits else wikidata_description),
                160,
            ),
            "editorial_summary": compact(
                " ".join([
                    insight_bits[0] if insight_bits else "",
                    update_text,
                    summaries[0] if summaries else "",
                    external_bits[0] if external_bits else "",
                    wikidata_description,
                ]),
                1100,
            ),
            "origin_story": compact(" ".join(clean_text(e["summary"]) or clean_text(e["body_text"]) for e in origin_entries[:3]), 1200),
            "identity_story": compact(" ".join(clean_text(e["summary"]) or clean_text(e["body_text"]) for e in identity_entries[:4]), 1200),
            "insight_story": compact(" ".join(insight_bits), 1500),
            "external_story": compact(" ".join(external_bits), 1500),
            "product_story": compact(" ".join([*(clean_text(e["summary"]) for e in product_entries[:4]), ", ".join(row["product_name"] for row in product_rows)]), 1400),
            "people_story": compact("; ".join(people_bits), 700),
            "current_status": compact("; ".join(current_bits) or update_text, 1200),
            "searchable": " ".join([
                all_text,
                " ".join(external_bits),
                " ".join(row["product_name"] for row in product_rows),
                " ".join(row["person_name"] for row in people_rows),
            ]),
        }

    def build_timeline(self, brand_id: int, entries: list[sqlite3.Row]) -> None:
        for entry in entries:
            text = clean_text(entry["summary"] or "") + " " + clean_text(entry["body_text"] or "")
            for sent in sentences(text)[:120]:
                years = sorted({int(y) for y in re.findall(r"\b(18\d{2}|19\d{2}|20\d{2})\b", sent)})
                for year in years[:2]:
                    if year > datetime.now().year:
                        continue
                    self.conn.execute(
                        """
                        INSERT OR IGNORE INTO brand_timeline
                        (brand_id, year, title, description, source_entry_id, confidence)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (brand_id, year, f"{year}년", compact(sent, 500), entry["id"], 0.55),
                    )

    def build_media_assets(self, brand_id: int) -> None:
        rows = self.conn.execute(
            """
            SELECT i.id, i.kind, i.local_path, i.remote_url, i.alt, i.bytes
            FROM images i
            JOIN brand_entry_map m ON m.entry_id = i.entry_id
            WHERE m.brand_id = ? AND i.local_path IS NOT NULL
            ORDER BY CASE i.kind WHEN 'og' THEN 0 WHEN 'content' THEN 1 ELSE 2 END, COALESCE(i.bytes,0) DESC
            LIMIT 16
            """,
            (brand_id,),
        ).fetchall()
        for index, row in enumerate(rows, start=1):
            role = "hero" if index == 1 else row["kind"]
            self.conn.execute(
                """
                INSERT OR IGNORE INTO brand_media_assets
                (brand_id, asset_role, local_path, remote_url, alt, source_table, source_id, sort_order)
                VALUES (?, ?, ?, ?, ?, 'images', ?, ?)
                """,
                (brand_id, role, row["local_path"], row["remote_url"], row["alt"], row["id"], index),
            )
        logo_rows = self.conn.execute(
            """
            SELECT id, local_path, remote_url, title
            FROM logo_history
            WHERE brand_id = ?
            ORDER BY COALESCE(inferred_year, '9999'), id
            LIMIT 12
            """,
            (brand_id,),
        ).fetchall()
        for index, row in enumerate(logo_rows, start=200):
            self.conn.execute(
                """
                INSERT OR IGNORE INTO brand_media_assets
                (brand_id, asset_role, local_path, remote_url, alt, source_table, source_id, sort_order)
                VALUES (?, 'logo_history', ?, ?, ?, 'logo_history', ?, ?)
                """,
                (brand_id, row["local_path"], row["remote_url"], row["title"], row["id"], index),
            )
        update_rows = self.conn.execute(
            """
            SELECT id, image_type, local_path, remote_url
            FROM update_images
            WHERE brand_id = ? AND local_path IS NOT NULL
            ORDER BY CASE image_type WHEN 'logo' THEN 0 ELSE 1 END, id
            """,
            (brand_id,),
        ).fetchall()
        for index, row in enumerate(update_rows, start=100):
            self.conn.execute(
                """
                INSERT OR IGNORE INTO brand_media_assets
                (brand_id, asset_role, local_path, remote_url, alt, source_table, source_id, sort_order)
                VALUES (?, ?, ?, ?, NULL, 'update_images', ?, ?)
                """,
                (brand_id, row["image_type"], row["local_path"], row["remote_url"], row["id"], index),
            )

    def save_sections(self, brand_id: int, texts: dict[str, str]) -> None:
        sections = [
            ("overview", "한눈에 보는 브랜드", texts["editorial_summary"], 10),
            ("origin", "시작과 성장", texts["origin_story"], 20),
            ("identity", "브랜드 아이덴티티", texts["identity_story"], 30),
            ("insights", "브랜드 관점", texts["insight_story"], 35),
            ("external", "확장 지식", texts["external_story"], 37),
            ("products", "제품과 서비스", texts["product_story"], 40),
            ("people", "사람들", texts["people_story"], 50),
            ("current", "현재 상태", texts["current_status"], 60),
        ]
        for key, title, body, order in sections:
            body = body or "추가 편집이 필요한 섹션입니다."
            self.conn.execute(
                """
                INSERT INTO magazine_sections
                (brand_id, section_key, section_title, body, source_json, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(brand_id, section_key) DO UPDATE SET
                    section_title = excluded.section_title,
                    body = excluded.body,
                    source_json = excluded.source_json,
                    sort_order = excluded.sort_order
                """,
                (brand_id, key, title, body, json.dumps({"generated_from": "entries+brand_facts+brand_updates"}, ensure_ascii=False), order),
            )

    def build(self) -> None:
        self.conn.execute("DELETE FROM brand_search_fts")
        brands = self.conn.execute("SELECT * FROM brand_entities ORDER BY id").fetchall()
        for brand in brands:
            entries = self.brand_entries(int(brand["id"]))
            aliases = self.aliases_for(brand, entries)
            all_text = " ".join([brand["canonical_name"] or "", brand["english_name"] or "", brand["industry"] or "", brand["wikidata_description"] or ""] + [clean_text(e["summary"]) for e in entries])
            domain = self.classify_domain(brand, all_text)
            hero, logo = self.best_images(int(brand["id"]))
            texts = self.section_texts(brand, entries)
            source_score = min(100, self.source_count(int(brand["id"])) * 12 + len(entries) * 8)
            media_bonus = 20 if hero else 0
            ready_score = min(100, source_score + media_bonus + (20 if texts["identity_story"] else 0) + (10 if texts["product_story"] else 0))
            slug = slugify(brand["english_name"] or brand["canonical_name"])
            self.conn.execute(
                """
                INSERT INTO brand_magazine_profiles (
                    brand_id, slug, display_name, english_name, domain_slug, isic_code, isic_label,
                    hero_image_path, logo_image_path, deck, editorial_summary, origin_story,
                    identity_story, product_story, people_story, current_status,
                    source_coverage_score, magazine_ready_score, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(brand_id) DO UPDATE SET
                    slug = excluded.slug,
                    display_name = excluded.display_name,
                    english_name = excluded.english_name,
                    domain_slug = excluded.domain_slug,
                    isic_code = excluded.isic_code,
                    isic_label = excluded.isic_label,
                    hero_image_path = excluded.hero_image_path,
                    logo_image_path = excluded.logo_image_path,
                    deck = excluded.deck,
                    editorial_summary = excluded.editorial_summary,
                    origin_story = excluded.origin_story,
                    identity_story = excluded.identity_story,
                    product_story = excluded.product_story,
                    people_story = excluded.people_story,
                    current_status = excluded.current_status,
                    source_coverage_score = excluded.source_coverage_score,
                    magazine_ready_score = excluded.magazine_ready_score,
                    updated_at = excluded.updated_at
                """,
                (
                    brand["id"],
                    slug,
                    brand["canonical_name"],
                    brand["english_name"],
                    domain["slug"],
                    domain["isic_code"],
                    ISIC_LABELS.get(domain["isic_code"], ""),
                    hero,
                    logo,
                    texts["deck"],
                    texts["editorial_summary"],
                    texts["origin_story"],
                    texts["identity_story"],
                    texts["product_story"],
                    texts["people_story"],
                    texts["current_status"],
                    source_score,
                    ready_score,
                    now_iso(),
                ),
            )
            self.save_sections(int(brand["id"]), texts)
            self.build_timeline(int(brand["id"]), entries)
            self.build_media_assets(int(brand["id"]))
            self.conn.execute(
                """
                INSERT INTO brand_search_fts
                (brand_id, display_name, english_name, domain, aliases, searchable_text)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    brand["id"],
                    brand["canonical_name"],
                    brand["english_name"] or "",
                    domain["label_ko"],
                    " ".join(aliases),
                    " ".join([texts["searchable"], texts["editorial_summary"], texts["identity_story"], texts["product_story"]]),
                ),
            )
        self.conn.commit()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Build magazine-ready brand profiles, domains, search index, sections, timeline, and media tables.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    args = parser.parse_args()
    builder = MagazineBuilder(args.db)
    builder.build()

    conn = sqlite3.connect(args.db)
    print("brand_magazine_profiles", conn.execute("SELECT COUNT(*) FROM brand_magazine_profiles").fetchone()[0])
    print("magazine_sections", conn.execute("SELECT COUNT(*) FROM magazine_sections").fetchone()[0])
    print("brand_timeline", conn.execute("SELECT COUNT(*) FROM brand_timeline").fetchone()[0])
    print("brand_media_assets", conn.execute("SELECT COUNT(*) FROM brand_media_assets").fetchone()[0])


if __name__ == "__main__":
    main()
