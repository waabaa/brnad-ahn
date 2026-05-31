from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
OPEN_FOOD_FACTS_API = "https://world.openfoodfacts.org/cgi/search.pl"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 naver-brand-external-enrichment/1.0"
)


CLAIM_PROPERTIES = {
    "P1056": "product_or_material_produced",
    "P112": "founder",
    "P169": "chief_executive_officer",
    "P2139": "total_revenue",
    "P1128": "employees",
    "P571": "inception",
    "P856": "official_website",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def qid_from_entity(value: dict[str, Any] | None) -> str | None:
    if not value or value.get("entity-type") != "item":
        return None
    return "Q" + str(value.get("numeric-id"))


class ExternalEnricher:
    def __init__(self, db_path: Path, delay: float) -> None:
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"})
        self.delay = delay
        self.init_db()

    def init_db(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS external_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                source TEXT NOT NULL,
                language TEXT,
                title TEXT,
                url TEXT NOT NULL,
                description TEXT,
                summary TEXT,
                license TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                retrieved_at TEXT NOT NULL,
                UNIQUE(brand_id, source, language, url)
            );

            CREATE TABLE IF NOT EXISTS brand_external_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                link_type TEXT NOT NULL,
                title TEXT,
                url TEXT NOT NULL,
                language TEXT,
                source_document_id INTEGER,
                metadata_json TEXT,
                retrieved_at TEXT NOT NULL,
                UNIQUE(brand_id, link_type, url)
            );
            """
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
        return int(self.conn.execute("SELECT id FROM source_documents WHERE url=?", (url,)).fetchone()["id"])

    def get_json(self, url: str, params: dict[str, Any] | None = None, retries: int = 3) -> dict[str, Any] | None:
        for attempt in range(retries):
            try:
                response = self.session.get(url, params=params, timeout=35)
                if response.status_code in {404, 410}:
                    return None
                if response.status_code in {429, 503}:
                    time.sleep((attempt + 1) * max(2.0, self.delay))
                    continue
                response.raise_for_status()
                time.sleep(self.delay)
                return response.json()
            except requests.RequestException:
                time.sleep((attempt + 1) * self.delay)
        return None

    def target_brands(self, tiers: set[str], limit: int | None) -> list[sqlite3.Row]:
        placeholders = ",".join("?" for _ in tiers)
        rows = self.conn.execute(
            f"""
            SELECT b.*, q.tier, p.domain_slug, d.label_ko AS domain_ko
            FROM brand_entities b
            JOIN brand_content_quality q ON q.brand_id=b.id
            JOIN brand_magazine_profiles p ON p.brand_id=b.id
            JOIN magazine_domains d ON d.slug=p.domain_slug
            WHERE q.tier IN ({placeholders})
            ORDER BY CASE q.tier WHEN 'A_magazine_ready' THEN 0 WHEN 'B_editorial_review' THEN 1 ELSE 2 END, b.canonical_name
            """,
            tuple(tiers),
        ).fetchall()
        return rows[:limit] if limit else rows

    def fetch_wikidata_entities(self, qids: list[str]) -> dict[str, Any]:
        entities: dict[str, Any] = {}
        for i in range(0, len(qids), 25):
            chunk = qids[i : i + 25]
            data = self.get_json(
                WIKIDATA_API,
                {
                    "action": "wbgetentities",
                    "format": "json",
                    "ids": "|".join(chunk),
                    "props": "labels|descriptions|claims|sitelinks",
                    "languages": "ko|en",
                    "sitefilter": "kowiki|enwiki|commonswiki",
                },
            )
            if data:
                entities.update(data.get("entities", {}))
        return entities

    def fetch_labels(self, qids: set[str]) -> dict[str, str]:
        labels: dict[str, str] = {}
        qid_list = sorted(qids)
        for i in range(0, len(qid_list), 50):
            data = self.get_json(
                WIKIDATA_API,
                {
                    "action": "wbgetentities",
                    "format": "json",
                    "ids": "|".join(qid_list[i : i + 50]),
                    "props": "labels",
                    "languages": "ko|en",
                },
            )
            if not data:
                continue
            for qid, entity in data.get("entities", {}).items():
                labels[qid] = (
                    entity.get("labels", {}).get("ko", {}).get("value")
                    or entity.get("labels", {}).get("en", {}).get("value")
                    or qid
                )
        return labels

    def enrich_wikidata_claims_and_links(self, brands: list[sqlite3.Row]) -> None:
        qid_to_brand = {row["wikidata_id"]: int(row["id"]) for row in brands if row["wikidata_id"]}
        entities = self.fetch_wikidata_entities(list(qid_to_brand.keys()))
        linked_qids: set[str] = set()
        for entity in entities.values():
            for prop in ["P1056", "P112", "P169"]:
                for claim in entity.get("claims", {}).get(prop, [])[:12]:
                    qid = qid_from_entity(claim.get("mainsnak", {}).get("datavalue", {}).get("value"))
                    if qid:
                        linked_qids.add(qid)
        labels = self.fetch_labels(linked_qids)
        source_id = self.source_document(
            "knowledge_graph",
            "Wikidata",
            "Wikidata entity claims and sitelinks",
            "https://www.wikidata.org/wiki/Wikidata:Main_Page",
            70,
            "Structured external links, products, people and high-level facts.",
        )

        for qid, entity in entities.items():
            brand_id = qid_to_brand.get(qid)
            if not brand_id:
                continue
            sitelinks = entity.get("sitelinks", {})
            for site, link_type, language in [("kowiki", "wikipedia", "ko"), ("enwiki", "wikipedia", "en"), ("commonswiki", "wikimedia_commons", None)]:
                link = sitelinks.get(site)
                if not link:
                    continue
                title = link.get("title")
                if site == "commonswiki":
                    url = f"https://commons.wikimedia.org/wiki/{quote(title.replace(' ', '_'))}"
                else:
                    host = "ko.wikipedia.org" if language == "ko" else "en.wikipedia.org"
                    url = f"https://{host}/wiki/{quote(title.replace(' ', '_'))}"
                self.conn.execute(
                    """
                    INSERT OR IGNORE INTO brand_external_links
                    (brand_id, link_type, title, url, language, source_document_id, metadata_json, retrieved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (brand_id, link_type, title, url, language, source_id, json.dumps(link, ensure_ascii=False), now_iso()),
                )

            for prop, fact_type in CLAIM_PROPERTIES.items():
                for claim in entity.get("claims", {}).get(prop, [])[:12]:
                    value = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
                    if value is None:
                        continue
                    rendered = None
                    qid_value = qid_from_entity(value) if isinstance(value, dict) else None
                    if qid_value:
                        rendered = labels.get(qid_value, qid_value)
                    elif isinstance(value, dict) and "time" in value:
                        rendered = value["time"].lstrip("+")
                    elif isinstance(value, dict) and "amount" in value:
                        rendered = value["amount"].lstrip("+")
                    elif isinstance(value, str):
                        rendered = value
                    if not rendered:
                        continue
                    if prop == "P1056":
                        self.save_product(brand_id, rendered, "Wikidata P1056", source_id, None, claim)
                    elif prop in {"P112", "P169"}:
                        role = "founder" if prop == "P112" else "chief_executive_officer"
                        self.save_person(brand_id, role, rendered, qid_value, None, source_id, claim)
                    elif prop in {"P2139", "P1128"}:
                        metric = "revenue" if prop == "P2139" else "employees"
                        self.save_financial(brand_id, metric, rendered, None, source_id, claim)
                    else:
                        self.save_fact(brand_id, fact_type, rendered, source_id, claim)
        self.conn.commit()

    def save_fact(self, brand_id: int, fact_type: str, value: str, source_id: int, metadata: Any) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO brand_facts
            (brand_id, fact_type, fact_value, fact_json, source_document_id, confidence)
            VALUES (?, ?, ?, ?, ?, 0.72)
            """,
            (brand_id, fact_type, value, json.dumps(metadata, ensure_ascii=False), source_id),
        )

    def save_product(self, brand_id: int, name: str, source: str, source_id: int, image_url: str | None, metadata: Any) -> None:
        self.conn.execute(
            """
            INSERT INTO brand_products
            (brand_id, product_name, source, source_document_id, image_url, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, product_name, source) DO UPDATE SET
                image_url = COALESCE(excluded.image_url, brand_products.image_url),
                metadata_json = excluded.metadata_json
            """,
            (brand_id, clean(name), source, source_id, image_url, json.dumps(metadata, ensure_ascii=False)),
        )

    def save_person(self, brand_id: int, role: str, name: str, qid: str | None, image_url: str | None, source_id: int, metadata: Any) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO brand_people
            (brand_id, role, person_name, wikidata_id, image_url, source_document_id, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (brand_id, role, clean(name), qid, image_url, source_id, json.dumps(metadata, ensure_ascii=False)),
        )

    def save_financial(self, brand_id: int, metric: str, value: str, point: str | None, source_id: int, metadata: Any) -> None:
        self.conn.execute(
            """
            INSERT OR IGNORE INTO brand_financials
            (brand_id, metric, value, point_in_time, source_document_id, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (brand_id, metric, value, point, source_id, json.dumps(metadata, ensure_ascii=False)),
        )

    def enrich_wikipedia_summaries(self, brands: list[sqlite3.Row]) -> None:
        links = self.conn.execute(
            """
            SELECT l.*, b.canonical_name
            FROM brand_external_links l
            JOIN brand_entities b ON b.id=l.brand_id
            JOIN brand_content_quality q ON q.brand_id=b.id
            WHERE l.link_type='wikipedia' AND q.tier!='D_directory_only'
            ORDER BY CASE l.language WHEN 'ko' THEN 0 ELSE 1 END, b.canonical_name
            """
        ).fetchall()
        for link in links:
            host = "ko.wikipedia.org" if link["language"] == "ko" else "en.wikipedia.org"
            data = self.get_json(f"https://{host}/api/rest_v1/page/summary/{quote(link['title'])}", retries=2)
            if not data or data.get("type") == "disambiguation":
                continue
            url = data.get("content_urls", {}).get("desktop", {}).get("page") or link["url"]
            source_id = self.source_document(
                "encyclopedia_summary",
                f"Wikipedia {link['language']}",
                data.get("title") or link["title"],
                url,
                68,
                "Wikipedia summary is CC BY-SA licensed. Use with attribution or as internal enrichment for editorial rewriting.",
            )
            self.conn.execute(
                """
                INSERT INTO external_profiles
                (brand_id, source, language, title, url, description, summary, license, source_document_id, metadata_json, retrieved_at)
                VALUES (?, 'wikipedia_summary', ?, ?, ?, ?, ?, 'CC BY-SA', ?, ?, ?)
                ON CONFLICT(brand_id, source, language, url) DO UPDATE SET
                    description = excluded.description,
                    summary = excluded.summary,
                    metadata_json = excluded.metadata_json,
                    retrieved_at = excluded.retrieved_at
                """,
                (
                    int(link["brand_id"]),
                    link["language"],
                    data.get("title"),
                    url,
                    data.get("description"),
                    data.get("extract"),
                    source_id,
                    json.dumps(data, ensure_ascii=False),
                    now_iso(),
                ),
            )
        self.conn.commit()

    def enrich_open_food_facts(self, brands: list[sqlite3.Row], per_brand: int) -> None:
        source_id = self.source_document(
            "open_data",
            "Open Food Facts",
            "Open Food Facts product search",
            "https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/",
            70,
            "Open food product database. Product examples require editorial review for representative use.",
        )
        food_brands = [row for row in brands if row["domain_slug"] == "food-beverage"]
        for row in food_brands:
            query = row["english_name"] or row["canonical_name"]
            data = self.get_json(
                OPEN_FOOD_FACTS_API,
                {
                    "search_terms": query,
                    "search_simple": 1,
                    "action": "process",
                    "json": 1,
                    "page_size": per_brand,
                    "fields": "product_name,brands,categories,countries,image_front_url,url",
                },
                retries=2,
            )
            if not data:
                continue
            for product in data.get("products", []):
                name = clean(product.get("product_name"))
                if not name:
                    continue
                self.save_product(int(row["id"]), name, "Open Food Facts", source_id, product.get("image_front_url"), product)
        self.conn.commit()

    def enrich_gdelt_news(self, brands: list[sqlite3.Row], max_brands: int, per_brand: int, days: int) -> None:
        source_id = self.source_document(
            "news_api",
            "GDELT Project",
            "GDELT DOC 2.0 brand news search",
            "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
            65,
            "Recent news candidates. Use as current signal, not as authoritative brand fact.",
        )
        start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y%m%d%H%M%S")
        for row in brands[:max_brands]:
            query = f'"{row["english_name"] or row["canonical_name"]}"'
            data = self.get_json(
                GDELT_DOC_API,
                {
                    "query": query,
                    "mode": "artlist",
                    "format": "json",
                    "maxrecords": per_brand,
                    "sort": "hybridrel",
                    "startdatetime": start,
                },
                retries=2,
            )
            if not data:
                continue
            for article in data.get("articles", []):
                url = article.get("url")
                title = clean(article.get("title"))
                if not url or not title:
                    continue
                self.conn.execute(
                    """
                    INSERT OR IGNORE INTO brand_news
                    (brand_id, title, url, domain, language, published_at, source_document_id, metadata_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        int(row["id"]),
                        title,
                        url,
                        article.get("domain"),
                        article.get("language"),
                        article.get("seendate"),
                        source_id,
                        json.dumps(article, ensure_ascii=False),
                    ),
                )
        self.conn.commit()

    def run(self, tiers: set[str], limit: int | None, off_per_brand: int, news_brands: int, news_per_brand: int) -> None:
        brands = self.target_brands(tiers, limit)
        print(f"target brands: {len(brands)}")
        self.enrich_wikidata_claims_and_links(brands)
        self.enrich_wikipedia_summaries(brands)
        self.enrich_open_food_facts(brands, off_per_brand)
        self.enrich_gdelt_news(brands, news_brands, news_per_brand, 90)
        for table in ["external_profiles", "brand_external_links", "brand_products", "brand_people", "brand_financials", "brand_news"]:
            print(table, self.conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Enrich A/B/C brand content with Wikidata links, Wikipedia summaries, Open Food Facts and GDELT.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--tiers", default="A_magazine_ready,B_editorial_review,C_source_backed")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--delay", type=float, default=0.25)
    parser.add_argument("--off-per-brand", type=int, default=4)
    parser.add_argument("--news-brands", type=int, default=40)
    parser.add_argument("--news-per-brand", type=int, default=2)
    args = parser.parse_args()

    tiers = {tier.strip() for tier in args.tiers.split(",") if tier.strip()}
    ExternalEnricher(args.db, args.delay).run(tiers, args.limit, args.off_per_brand, args.news_brands, args.news_per_brand)


if __name__ == "__main__":
    main()
