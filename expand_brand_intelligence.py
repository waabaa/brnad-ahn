from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import re
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
IMAGE_DIR = ROOT / "images" / "intelligence"
SPARQL_URL = "https://query.wikidata.org/sparql"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
OFF_SEARCH_API = "https://world.openfoodfacts.org/cgi/search.pl"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 naver-brand-intelligence/1.0"
)


ISIC_SECTIONS = {
    "A": "Agriculture, forestry and fishing",
    "B": "Mining and quarrying",
    "C": "Manufacturing",
    "D": "Electricity, gas, steam and air conditioning supply",
    "E": "Water supply; sewerage, waste management and remediation activities",
    "F": "Construction",
    "G": "Wholesale and retail trade; repair of motor vehicles and motorcycles",
    "H": "Transportation and storage",
    "I": "Accommodation and food service activities",
    "J": "Information and communication",
    "K": "Financial and insurance activities",
    "L": "Real estate activities",
    "M": "Professional, scientific and technical activities",
    "N": "Administrative and support service activities",
    "O": "Public administration and defence; compulsory social security",
    "P": "Education",
    "Q": "Human health and social work activities",
    "R": "Arts, entertainment and recreation",
    "S": "Other service activities",
    "T": "Activities of households as employers",
    "U": "Activities of extraterritorial organizations and bodies",
}


INDUSTRY_KEYWORDS = [
    ("I", ["restaurant", "fast food", "coffeehouse", "food service", "hotel", "hospitality", "cafe", "café"]),
    ("J", ["software", "internet", "e-commerce", "computer", "telecommunication", "technology", "semiconductor", "social media", "electronics"]),
    ("H", ["airline", "shipping", "logistics", "transport", "automotive", "motorcycle", "vehicle", "car manufacturer"]),
    ("K", ["bank", "insurance", "financial", "payment"]),
    ("M", ["advertising", "consulting", "design", "brand valuation"]),
    ("R", ["entertainment", "media", "sports", "video game"]),
    ("Q", ["pharmaceutical", "healthcare", "medicine", "cosmetics", "personal care"]),
    ("C", ["manufacturing", "fashion", "clothing", "apparel", "luxury", "watch", "jewelry", "jewellery", "food", "beverage", "brewery", "distillery", "furniture", "consumer goods", "sportswear", "cosmetic", "automobile", "tire"]),
    ("G", ["retail", "retailer", "store", "supermarket"]),
]


FOOD_KEYWORDS = [
    "food",
    "beverage",
    "coffee",
    "restaurant",
    "fast food",
    "brewery",
    "distillery",
    "confectionery",
    "chocolate",
    "cereal",
    "drink",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def qid_from_uri(uri: str | None) -> str | None:
    if not uri:
        return None
    match = re.search(r"/(Q\d+)$", uri)
    return match.group(1) if match else None


def lookup_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().replace("’", "'"))


def infer_year(*values: str | None) -> str | None:
    for value in values:
        if not value:
            continue
        match = re.search(r"\b(19\d{2}|20\d{2})\b", value)
        if match:
            return match.group(1)
    return None


class BrandIntelligenceExpander:
    def __init__(self, db_path: Path, image_dir: Path, delay: float) -> None:
        self.db_path = db_path
        self.image_dir = image_dir
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"})
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()

    def init_db(self) -> None:
        self.image_dir.mkdir(parents=True, exist_ok=True)
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS industry_taxonomy (
                scheme TEXT NOT NULL,
                code TEXT NOT NULL,
                label TEXT NOT NULL,
                PRIMARY KEY (scheme, code)
            );

            CREATE TABLE IF NOT EXISTS brand_industries (
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                scheme TEXT NOT NULL,
                code TEXT NOT NULL,
                label TEXT NOT NULL,
                evidence TEXT,
                confidence REAL NOT NULL DEFAULT 0,
                source_document_id INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (brand_id, scheme, code)
            );

            CREATE TABLE IF NOT EXISTS brand_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                product_name TEXT NOT NULL,
                product_type TEXT,
                source TEXT NOT NULL,
                source_document_id INTEGER,
                image_url TEXT,
                local_image_path TEXT,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, product_name, source)
            );

            CREATE TABLE IF NOT EXISTS brand_people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                person_name TEXT NOT NULL,
                wikidata_id TEXT,
                image_url TEXT,
                local_image_path TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, role, person_name, source_document_id)
            );

            CREATE TABLE IF NOT EXISTS brand_financials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                metric TEXT NOT NULL,
                value TEXT NOT NULL,
                point_in_time TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, metric, value, point_in_time, source_document_id)
            );

            CREATE TABLE IF NOT EXISTS logo_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                inferred_year TEXT,
                remote_url TEXT NOT NULL,
                local_path TEXT,
                license_short_name TEXT,
                attribution TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, remote_url)
            );

            CREATE TABLE IF NOT EXISTS brand_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                domain TEXT,
                language TEXT,
                published_at TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, url)
            );
            """
        )
        for code, label in ISIC_SECTIONS.items():
            self.conn.execute(
                "INSERT OR IGNORE INTO industry_taxonomy (scheme, code, label) VALUES ('ISIC Rev.4', ?, ?)",
                (code, label),
            )
        self.conn.commit()

    def source_document(self, source_type: str, publisher: str, title: str, url: str, reliability: int, notes: str | None = None) -> int:
        self.conn.execute(
            """
            INSERT INTO source_documents (source_type, publisher, title, url, retrieved_at, reliability, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                retrieved_at = excluded.retrieved_at,
                reliability = excluded.reliability,
                notes = excluded.notes
            """,
            (source_type, publisher, title, url, now_iso(), reliability, notes),
        )
        self.conn.commit()
        return int(self.conn.execute("SELECT id FROM source_documents WHERE url = ?", (url,)).fetchone()["id"])

    def get_json(self, url: str, params: dict[str, Any], retries: int = 3) -> dict[str, Any]:
        for attempt in range(retries):
            response = self.session.get(url, params=params, timeout=45)
            if response.status_code in {429, 503}:
                time.sleep((attempt + 1) * max(3, self.delay))
                continue
            response.raise_for_status()
            time.sleep(self.delay)
            return response.json()
        response.raise_for_status()
        return response.json()

    def sparql(self, query: str, retries: int = 3) -> list[dict[str, dict[str, str]]]:
        data = self.get_json(
            SPARQL_URL,
            {"query": query, "format": "json"},
            retries=retries,
        )
        return data.get("results", {}).get("bindings", [])

    def ensure_brand(
        self,
        canonical_name: str,
        english_name: str | None,
        wikidata_id: str | None,
        description: str | None,
        website: str | None,
        country: str | None,
        industry: str | None,
        confidence: float,
    ) -> int:
        self.conn.execute(
            """
            INSERT INTO brand_entities (
                canonical_name, english_name, wikidata_id, wikidata_label, wikidata_description,
                official_website, country, industry, confidence, status, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'expanded', CURRENT_TIMESTAMP)
            ON CONFLICT(canonical_name) DO UPDATE SET
                english_name = COALESCE(brand_entities.english_name, excluded.english_name),
                wikidata_id = COALESCE(brand_entities.wikidata_id, excluded.wikidata_id),
                wikidata_label = COALESCE(brand_entities.wikidata_label, excluded.wikidata_label),
                wikidata_description = COALESCE(brand_entities.wikidata_description, excluded.wikidata_description),
                official_website = COALESCE(brand_entities.official_website, excluded.official_website),
                country = COALESCE(brand_entities.country, excluded.country),
                industry = COALESCE(brand_entities.industry, excluded.industry),
                confidence = MAX(brand_entities.confidence, excluded.confidence),
                updated_at = CURRENT_TIMESTAMP
            """,
            (canonical_name, english_name, wikidata_id, english_name, description, website, country, industry, confidence),
        )
        self.conn.commit()
        return int(self.conn.execute("SELECT id FROM brand_entities WHERE canonical_name = ?", (canonical_name,)).fetchone()["id"])

    def expand_wikidata_brands(self, limit: int) -> None:
        source_id = self.source_document(
            "knowledge_graph",
            "Wikidata Query Service",
            "Wikidata SPARQL brand/company expansion",
            "https://www.wikidata.org/wiki/Wikidata:QUERY",
            70,
            "Adds additional brand/company entities using public SPARQL results.",
        )
        query = f"""
        SELECT DISTINCT ?item ?itemLabel ?itemDescription ?website ?countryLabel ?industryLabel WHERE {{
          {{
            ?item wdt:P31/wdt:P279* wd:Q431289 .
          }} UNION {{
            ?item wdt:P31/wdt:P279* wd:Q4830453 .
            ?item wdt:P452 ?industry .
          }}
          OPTIONAL {{ ?item wdt:P856 ?website. }}
          OPTIONAL {{ ?item wdt:P17 ?country. }}
          OPTIONAL {{ ?item wdt:P452 ?industry. }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ko,en". }}
        }}
        LIMIT {limit}
        """
        rows = self.sparql(query)
        added = 0
        for row in rows:
            label = clean_text(row.get("itemLabel", {}).get("value"))
            if not label or label.startswith("Q"):
                continue
            qid = qid_from_uri(row.get("item", {}).get("value"))
            brand_id = self.ensure_brand(
                canonical_name=label,
                english_name=label,
                wikidata_id=qid,
                description=clean_text(row.get("itemDescription", {}).get("value")),
                website=row.get("website", {}).get("value"),
                country=clean_text(row.get("countryLabel", {}).get("value")),
                industry=clean_text(row.get("industryLabel", {}).get("value")),
                confidence=0.68,
            )
            self.classify_brand(brand_id, clean_text(row.get("industryLabel", {}).get("value")), source_id)
            added += 1
        print(f"Wikidata expanded rows processed: {added}")

    def classify_brand(self, brand_id: int, evidence: str | None, source_id: int | None = None) -> None:
        row = self.conn.execute("SELECT canonical_name, english_name, industry, wikidata_description FROM brand_entities WHERE id = ?", (brand_id,)).fetchone()
        text = " ".join([clean_text(evidence), clean_text(row["industry"]), clean_text(row["wikidata_description"]), clean_text(row["canonical_name"]), clean_text(row["english_name"])]).lower()
        code = "C"
        confidence = 0.45
        matched = []
        for candidate_code, keywords in INDUSTRY_KEYWORDS:
            hits = [kw for kw in keywords if kw in text]
            if hits:
                code = candidate_code
                confidence = min(0.95, 0.55 + len(hits) * 0.08)
                matched = hits
                break
        label = ISIC_SECTIONS[code]
        self.conn.execute(
            """
            INSERT INTO brand_industries (brand_id, scheme, code, label, evidence, confidence, source_document_id)
            VALUES (?, 'ISIC Rev.4', ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, scheme, code) DO UPDATE SET
                evidence = excluded.evidence,
                confidence = MAX(brand_industries.confidence, excluded.confidence),
                source_document_id = COALESCE(excluded.source_document_id, brand_industries.source_document_id)
            """,
            (brand_id, code, label, json.dumps({"text": text[:1000], "matched_keywords": matched}, ensure_ascii=False), confidence, source_id),
        )

    def classify_all_existing(self) -> None:
        source_id = self.source_document(
            "classification",
            "Internal mapping",
            "ISIC Rev.4 keyword mapping from Wikidata industry and descriptions",
            "urn:local:isic-rev4-keyword-mapping",
            60,
            "Uses ISIC Rev.4 section-level categories because ISO has no single global brand-domain taxonomy equivalent.",
        )
        for row in self.conn.execute("SELECT id, industry FROM brand_entities").fetchall():
            self.classify_brand(int(row["id"]), row["industry"], source_id)
        self.conn.commit()

    def enrich_structured_facts(self, fact_limit: int | None = None) -> None:
        source_id = self.source_document(
            "knowledge_graph",
            "Wikidata Query Service",
            "Wikidata SPARQL products, people, financial and workforce fields",
            "https://www.wikidata.org/wiki/Wikidata:QUERY",
            70,
            "Pulls P1056, P112, P169, P2139, P1128 for brands with Wikidata IDs.",
        )
        qids = [r["wikidata_id"] for r in self.conn.execute("SELECT wikidata_id FROM brand_entities WHERE wikidata_id IS NOT NULL").fetchall()]
        if fact_limit:
            qids = qids[:fact_limit]
        for i in range(0, len(qids), 20):
            chunk = qids[i : i + 20]
            values = " ".join(f"wd:{qid}" for qid in chunk)
            query = f"""
            SELECT ?brand ?productLabel ?founder ?founderLabel ?founderImage ?ceo ?ceoLabel ?ceoImage ?revenue ?employees WHERE {{
              VALUES ?brand {{ {values} }}
              OPTIONAL {{ ?brand wdt:P1056 ?product. }}
              OPTIONAL {{ ?brand wdt:P112 ?founder. OPTIONAL {{ ?founder wdt:P18 ?founderImage. }} }}
              OPTIONAL {{ ?brand wdt:P169 ?ceo. OPTIONAL {{ ?ceo wdt:P18 ?ceoImage. }} }}
              OPTIONAL {{ ?brand wdt:P2139 ?revenue. }}
              OPTIONAL {{ ?brand wdt:P1128 ?employees. }}
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ko,en". }}
            }}
            """
            try:
                result_rows = self.sparql(query, retries=2)
            except Exception as exc:
                print(f"  facts batch skipped: {exc}")
                continue
            for row in result_rows:
                qid = qid_from_uri(row.get("brand", {}).get("value"))
                brand_row = self.conn.execute("SELECT id FROM brand_entities WHERE wikidata_id = ?", (qid,)).fetchone()
                if not brand_row:
                    continue
                brand_id = int(brand_row["id"])
                if row.get("productLabel", {}).get("value"):
                    self.save_product(brand_id, clean_text(row["productLabel"]["value"]), "Wikidata P1056", source_id, None, row)
                if row.get("founderLabel", {}).get("value"):
                    self.save_person(brand_id, "founder", clean_text(row["founderLabel"]["value"]), qid_from_uri(row.get("founder", {}).get("value")), row.get("founderImage", {}).get("value"), source_id, row)
                if row.get("ceoLabel", {}).get("value"):
                    self.save_person(brand_id, "chief_executive_officer", clean_text(row["ceoLabel"]["value"]), qid_from_uri(row.get("ceo", {}).get("value")), row.get("ceoImage", {}).get("value"), source_id, row)
                if row.get("revenue", {}).get("value"):
                    self.save_financial(brand_id, "revenue", row["revenue"]["value"], None, source_id, row)
                if row.get("employees", {}).get("value"):
                    self.save_financial(brand_id, "employees", row["employees"]["value"], None, source_id, row)
            self.conn.commit()

    def save_product(self, brand_id: int, name: str, source: str, source_id: int, image_url: str | None, metadata: Any) -> None:
        local = self.download(image_url, "product") if image_url else None
        self.conn.execute(
            """
            INSERT INTO brand_products (brand_id, product_name, source, source_document_id, image_url, local_image_path, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, product_name, source) DO UPDATE SET
                image_url = COALESCE(excluded.image_url, brand_products.image_url),
                local_image_path = COALESCE(excluded.local_image_path, brand_products.local_image_path),
                metadata_json = excluded.metadata_json
            """,
            (brand_id, name, source, source_id, image_url, local, json.dumps(metadata, ensure_ascii=False)),
        )

    def save_person(self, brand_id: int, role: str, name: str, qid: str | None, image_url: str | None, source_id: int, metadata: Any) -> None:
        local = self.download(image_url, "person") if image_url else None
        self.conn.execute(
            """
            INSERT INTO brand_people (brand_id, role, person_name, wikidata_id, image_url, local_image_path, source_document_id, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, role, person_name, source_document_id) DO UPDATE SET
                wikidata_id = COALESCE(excluded.wikidata_id, brand_people.wikidata_id),
                image_url = COALESCE(excluded.image_url, brand_people.image_url),
                local_image_path = COALESCE(excluded.local_image_path, brand_people.local_image_path),
                metadata_json = excluded.metadata_json
            """,
            (brand_id, role, name, qid, image_url, local, source_id, json.dumps(metadata, ensure_ascii=False)),
        )

    def save_financial(self, brand_id: int, metric: str, value: str, point: str | None, source_id: int, metadata: Any) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO brand_financials (brand_id, metric, value, point_in_time, source_document_id, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (brand_id, metric, value, point, source_id, json.dumps(metadata, ensure_ascii=False)),
        )

    def commons_logo_history(self, max_per_brand: int, brand_limit: int | None = None) -> None:
        source_id = self.source_document(
            "media",
            "Wikimedia Commons",
            "Wikimedia Commons logo file search",
            "https://commons.wikimedia.org/wiki/Commons:API",
            75,
            "Logo candidates are file search results. Year is inferred from file title or Commons metadata and should be editorially reviewed.",
        )
        rows = self.conn.execute(
            """
            SELECT id, canonical_name, english_name, wikidata_label
            FROM brand_entities
            ORDER BY CASE WHEN status='enriched' THEN 0 ELSE 1 END, id
            """
        ).fetchall()
        if brand_limit:
            rows = rows[:brand_limit]
        for row in rows:
            query = f"{row['english_name'] or row['wikidata_label'] or row['canonical_name']} logo"
            try:
                data = self.get_json(
                    COMMONS_API,
                    {
                        "action": "query",
                        "format": "json",
                        "generator": "search",
                        "gsrnamespace": 6,
                        "gsrlimit": max_per_brand,
                        "gsrsearch": query,
                        "prop": "imageinfo",
                        "iiprop": "url|mime|size|extmetadata|timestamp",
                    },
                    retries=2,
                )
            except Exception:
                continue
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                title = page.get("title", "")
                if "logo" not in title.lower():
                    continue
                info = (page.get("imageinfo") or [{}])[0]
                url = info.get("url")
                if not url:
                    continue
                metadata = info.get("extmetadata", {})
                date_value = None
                for key in ["DateTimeOriginal", "DateTime", "ObjectName"]:
                    if key in metadata:
                        date_value = metadata[key].get("value")
                        break
                local = self.download(url, "logo")
                self.conn.execute(
                    """
                    INSERT INTO logo_history (
                        brand_id, title, inferred_year, remote_url, local_path, license_short_name,
                        attribution, source_document_id, metadata_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(brand_id, remote_url) DO UPDATE SET
                        inferred_year = COALESCE(excluded.inferred_year, logo_history.inferred_year),
                        local_path = COALESCE(excluded.local_path, logo_history.local_path),
                        metadata_json = excluded.metadata_json
                    """,
                    (
                        int(row["id"]),
                        title,
                        infer_year(title, date_value),
                        url,
                        local,
                        clean_text(metadata.get("LicenseShortName", {}).get("value")),
                        clean_text(metadata.get("Artist", {}).get("value") or metadata.get("Credit", {}).get("value")),
                        source_id,
                        json.dumps(info, ensure_ascii=False),
                    ),
                )
            self.conn.commit()

    def gdelt_news(self, max_per_brand: int, days: int, brand_limit: int | None = None) -> None:
        base_source_id = self.source_document(
            "news_api",
            "GDELT Project",
            "GDELT DOC 2.0 brand news search",
            "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
            65,
            "Recent public news search. Use as signal, not as authoritative source for facts.",
        )
        start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y%m%d%H%M%S")
        rows = self.conn.execute("SELECT id, canonical_name, english_name FROM brand_entities ORDER BY id").fetchall()
        if brand_limit:
            rows = rows[:brand_limit]
        for row in rows:
            query = f'"{row["english_name"] or row["canonical_name"]}"'
            try:
                data = self.get_json(
                    GDELT_DOC_API,
                    {
                        "query": query,
                        "mode": "artlist",
                        "format": "json",
                        "maxrecords": max_per_brand,
                        "sort": "hybridrel",
                        "startdatetime": start,
                    },
                    retries=2,
                )
            except Exception:
                continue
            for article in data.get("articles", []):
                url = article.get("url")
                title = clean_text(article.get("title"))
                if not url or not title:
                    continue
                self.conn.execute(
                    """
                    INSERT OR IGNORE INTO brand_news (
                        brand_id, title, url, domain, language, published_at, source_document_id, metadata_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        int(row["id"]),
                        title,
                        url,
                        article.get("domain"),
                        article.get("language"),
                        article.get("seendate"),
                        base_source_id,
                        json.dumps(article, ensure_ascii=False),
                    ),
                )
            self.conn.commit()

    def open_food_facts_products(self, max_per_brand: int, brand_limit: int | None = None) -> None:
        source_id = self.source_document(
            "open_data",
            "Open Food Facts",
            "Open Food Facts brand product search",
            "https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/",
            70,
            "Open Food Facts is useful for packaged food and beverage product examples; not all brand results are official.",
        )
        rows = self.conn.execute("SELECT id, canonical_name, english_name, industry, wikidata_description FROM brand_entities ORDER BY id").fetchall()
        if brand_limit:
            rows = rows[:brand_limit]
        for row in rows:
            text = " ".join([clean_text(row["industry"]), clean_text(row["wikidata_description"]), clean_text(row["canonical_name"]), clean_text(row["english_name"])]).lower()
            if not any(keyword in text for keyword in FOOD_KEYWORDS):
                continue
            query = row["english_name"] or row["canonical_name"]
            try:
                data = self.get_json(
                    OFF_SEARCH_API,
                    {
                        "search_terms": query,
                        "search_simple": 1,
                        "action": "process",
                        "json": 1,
                        "page_size": max_per_brand,
                        "fields": "product_name,brands,categories,countries,image_front_url,url",
                    },
                    retries=2,
                )
            except Exception:
                continue
            for product in data.get("products", []):
                name = clean_text(product.get("product_name"))
                if not name:
                    continue
                self.save_product(int(row["id"]), name, "Open Food Facts", source_id, product.get("image_front_url"), product)
            self.conn.commit()

    def download(self, url: str | None, prefix: str) -> str | None:
        if not url:
            return None
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException:
            return None
        content_type = response.headers.get("Content-Type", "").split(";")[0]
        ext = mimetypes.guess_extension(content_type) or Path(urlparse(url).path).suffix or ".bin"
        if ext == ".jpe":
            ext = ".jpg"
        digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
        target = self.image_dir / f"{prefix}_{digest}{ext}"
        if not target.exists():
            target.write_bytes(response.content)
        return str(target.relative_to(ROOT))

    def run(
        self,
        steps: set[str],
        wikidata_limit: int,
        logo_limit: int,
        news_limit: int,
        news_days: int,
        off_limit: int,
        brand_limit: int | None,
        fact_limit: int | None,
    ) -> None:
        if "expand" in steps:
            print("step: expand")
            self.expand_wikidata_brands(wikidata_limit)
        if "classify" in steps:
            print("step: classify")
            self.classify_all_existing()
        if "facts" in steps:
            print("step: facts")
            self.enrich_structured_facts(fact_limit)
        if "logos" in steps:
            print("step: logos")
            self.commons_logo_history(logo_limit, brand_limit)
        if "products" in steps:
            print("step: products")
            self.open_food_facts_products(off_limit, brand_limit)
        if "news" in steps:
            print("step: news")
            self.gdelt_news(news_limit, news_days, brand_limit)
        self.conn.commit()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Expand brand intelligence with open sources: Wikidata SPARQL, Commons, Open Food Facts, and GDELT.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--images", type=Path, default=IMAGE_DIR)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--wikidata-limit", type=int, default=250)
    parser.add_argument("--logo-limit", type=int, default=4)
    parser.add_argument("--news-limit", type=int, default=3)
    parser.add_argument("--news-days", type=int, default=60)
    parser.add_argument("--off-limit", type=int, default=5)
    parser.add_argument(
        "--steps",
        default="expand,classify,facts,logos,products,news",
        help="Comma-separated steps: expand,classify,facts,logos,products,news",
    )
    parser.add_argument("--brand-limit", type=int, default=None, help="Limit brands for logos/products/news steps.")
    parser.add_argument("--fact-limit", type=int, default=160, help="Limit brands with Wikidata IDs for SPARQL fact enrichment.")
    args = parser.parse_args()

    expander = BrandIntelligenceExpander(args.db, args.images, args.delay)
    steps = {step.strip() for step in args.steps.split(",") if step.strip()}
    expander.run(steps, args.wikidata_limit, args.logo_limit, args.news_limit, args.news_days, args.off_limit, args.brand_limit, args.fact_limit)


if __name__ == "__main__":
    main()
