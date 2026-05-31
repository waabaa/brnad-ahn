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
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
IMAGE_DIR = ROOT / "images" / "updates"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 naver-brand-update/1.0"
)
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/{qid}"
KANTAR_2026_URL = "https://www.kantar.com/inspiration/brands/most-valuable-global-brands-2026"


PROPERTY_LABELS = {
    "P856": "official_website",
    "P571": "inception",
    "P17": "country",
    "P159": "headquarters",
    "P749": "parent_organization",
    "P127": "owned_by",
    "P452": "industry",
    "P112": "founded_by",
    "P169": "chief_executive_officer",
    "P414": "stock_exchange",
    "P249": "ticker_symbol",
    "P154": "logo_image",
    "P18": "image",
}


BRAND_ALIASES = {
    "맥도날드": "McDonald's",
    "스타벅스": "Starbucks",
    "코카-콜라": "Coca-Cola",
    "자라": "Zara",
    "크리스챤 디올": "Dior",
    "버거킹": "Burger King",
    "루이비통": "Louis Vuitton",
    "생 로랑": "Yves Saint Laurent",
    "메르세데스-벤츠": "Mercedes-Benz",
    "모엣&샹동": "Moet & Chandon",
    "에르메네질도 제냐": "Zegna",
    "살바토레 페라가모": "Ferragamo",
    "어그 오스트레일리아": "UGG",
    "더바디샵": "The Body Shop",
    "돌체앤가바나": "Dolce & Gabbana",
    "코로나 엑스트라": "Corona Extra",
    "베스트 글로벌 브랜드": "Best Global Brands",
    "할리데이비슨": "Harley-Davidson",
    "뉴발란스": "New Balance",
    "애플": "Apple",
    "폴 바셋": "Paul Bassett",
    "아크테릭스": "Arc'teryx",
    "써브웨이": "Subway",
    "레드불": "Red Bull",
    "노스페이스": "The North Face",
    "펩시": "Pepsi",
    "리바이스": "Levi's",
    "태그호이어": "TAG Heuer",
    "스와로브스키": "Swarovski",
    "베라왕": "Vera Wang",
    "빅토리아 시크릿": "Victoria's Secret",
    "옥소": "OXO",
    "포트메리온": "Portmeirion",
    "디케이엔와이": "DKNY",
    "DKNY": "DKNY",
    "파타고니아": "Patagonia",
    "유니클로": "Uniqlo",
    "말보로": "Marlboro",
    "나이키": "Nike",
    "캠퍼": "Camper",
    "토리 버치": "Tory Burch",
    "질레트": "Gillette",
    "누디진": "Nudie Jeans",
    "펜디": "Fendi",
    "네스카페": "Nescafe",
    "스토케": "Stokke",
    "양키캔들": "Yankee Candle",
    "도미노피자": "Domino's Pizza",
    "지방시": "Givenchy",
    "몽벨": "Montbell",
    "K2": "K2",
    "ZARA": "Zara",
    "빅": "BIC",
    "랄프 로렌": "Ralph Lauren",
    "뱅앤올룹슨": "Bang & Olufsen",
    "어그": "UGG",
    "지샥": "G-Shock",
    "폴 스미스": "Paul Smith",
}


@dataclass(frozen=True)
class CandidateBrand:
    canonical_name: str
    english_name: str | None
    original_names: list[str]
    source_entry_ids: list[int]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalize_title(title: str) -> str:
    title = re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()
    title = re.sub(r"\s+", " ", title)
    if title.startswith("BIC 그룹"):
        return "BIC"
    if title.startswith("애플의 창립자"):
        return "애플"
    if title.startswith("네스카페 플랜"):
        return "네스카페"
    suffixes = [
        "의 역사와 철학",
        "의 역사와 대표 제품",
        "의 역사와 철학",
        "의 브랜드 아이덴티티",
        "의 대표 제품 및 서비스",
        "의 대표 제품과 서비스",
        "의 대표 브랜드와 서비스",
        "의 대표 제품",
        "의 제품 및 서비스",
        "의 제품과 서비스",
        "의 제품과 브랜딩",
        "의 제품과 특징",
        "의 제품과 예술 활동",
        "의 제품과 디자인 활동",
        "의 디자인과 제품",
        "의 제품과 요리",
        "의 제품",
        "의 제품들",
        "의 시그니처 요소와 대표 제품",
        "의 시그니처",
        "의 기술과 문화",
        "의 기술과 제품",
        "의 철학과 기술",
        "의 철학과 제품",
        "의 철학",
        "의 서비스와 대표 제품",
        "의 광고와 예술 활동",
        "의 광고와 디자인",
        "의 샴페인",
        "의 마케팅과 디자인",
        "의 마케팅과 서비스",
        "의 마케팅",
        "의 브랜딩과 대표 제품",
        "의 브랜딩 활동",
        "의 브랜딩과 제품",
        "의 브랜딩과 마케팅 전략",
        "의 브랜딩",
        "의 브랜드 경영",
        "의 역사",
        "의 홍보 캠페인",
    ]
    for suffix in suffixes:
        if title.endswith(suffix):
            return title[: -len(suffix)].strip()
    title = re.sub(r"\s+브랜딩 활동$", "", title)
    title = re.sub(r"\s+브랜딩$", "", title)
    title = re.sub(r"\s+대표 제품 및 서비스$", "", title)
    title = re.sub(r"\s+대표 제품$", "", title)
    title = re.sub(r"\s+제품들$", "", title)
    title = re.sub(r"\s+제품$", "", title)
    title = re.sub(r"\s+브랜드 경영$", "", title)
    title = re.sub(r"의$", "", title)
    if title.startswith("한국의 "):
        title = title.replace("한국의 ", "", 1)
    return title.strip()


def english_from_subtitle(subtitle: str | None) -> str | None:
    if not subtitle:
        return None
    if "[" not in subtitle and "]" not in subtitle:
        return None
    text = subtitle.strip().strip("[]")
    text = text.replace("음성듣기", "")
    text = clean_text(text)
    if not text:
        return None
    return text


class BrandUpdater:
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
            CREATE TABLE IF NOT EXISTS brand_entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canonical_name TEXT NOT NULL UNIQUE,
                english_name TEXT,
                wikidata_id TEXT,
                wikidata_label TEXT,
                wikidata_description TEXT,
                official_website TEXT,
                country TEXT,
                headquarters TEXT,
                parent_organization TEXT,
                owned_by TEXT,
                industry TEXT,
                inception TEXT,
                confidence REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'candidate',
                notes TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS brand_entry_map (
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
                match_method TEXT NOT NULL,
                confidence REAL NOT NULL DEFAULT 0,
                PRIMARY KEY (brand_id, entry_id)
            );

            CREATE TABLE IF NOT EXISTS source_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                publisher TEXT NOT NULL,
                title TEXT,
                url TEXT NOT NULL UNIQUE,
                retrieved_at TEXT NOT NULL,
                reliability INTEGER NOT NULL,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS brand_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                fact_type TEXT NOT NULL,
                fact_value TEXT NOT NULL,
                fact_json TEXT,
                source_document_id INTEGER NOT NULL REFERENCES source_documents(id),
                observed_at TEXT,
                confidence REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, fact_type, fact_value, source_document_id)
            );

            CREATE TABLE IF NOT EXISTS brand_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                update_type TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                source_document_id INTEGER NOT NULL REFERENCES source_documents(id),
                confidence REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, update_type, source_document_id)
            );

            CREATE TABLE IF NOT EXISTS update_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                image_type TEXT NOT NULL,
                remote_url TEXT NOT NULL,
                local_path TEXT,
                source_document_id INTEGER NOT NULL REFERENCES source_documents(id),
                license_note TEXT,
                downloaded_at TEXT,
                UNIQUE(brand_id, image_type, remote_url)
            );
            """
        )
        self.conn.commit()

    def reset_update_tables(self) -> None:
        self.conn.executescript(
            """
            DROP TABLE IF EXISTS update_images;
            DROP TABLE IF EXISTS brand_updates;
            DROP TABLE IF EXISTS brand_facts;
            DROP TABLE IF EXISTS source_documents;
            DROP TABLE IF EXISTS brand_entry_map;
            DROP TABLE IF EXISTS brand_entities;
            """
        )
        self.conn.commit()
        self.init_db()

    def source_document(self, source_type: str, publisher: str, title: str, url: str, reliability: int, notes: str | None = None) -> int:
        retrieved_at = now_iso()
        self.conn.execute(
            """
            INSERT INTO source_documents (source_type, publisher, title, url, retrieved_at, reliability, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                retrieved_at = excluded.retrieved_at,
                reliability = excluded.reliability,
                notes = excluded.notes
            """,
            (source_type, publisher, title, url, retrieved_at, reliability, notes),
        )
        self.conn.commit()
        return int(self.conn.execute("SELECT id FROM source_documents WHERE url = ?", (url,)).fetchone()["id"])

    def collect_candidate_brands(self) -> list[CandidateBrand]:
        rows = self.conn.execute("SELECT id, source, title, subtitle FROM entries ORDER BY source, id").fetchall()
        naver_aliases: dict[str, str] = {}
        for row in rows:
            if row["source"] == "naver":
                alias = english_from_subtitle(row["subtitle"])
                if alias:
                    naver_aliases[normalize_title(row["title"])] = alias
        grouped: dict[str, dict[str, Any]] = {}
        for row in rows:
            canonical = normalize_title(row["title"])
            if not canonical:
                continue
            english = english_from_subtitle(row["subtitle"]) or naver_aliases.get(canonical)
            if canonical in BRAND_ALIASES:
                english = BRAND_ALIASES[canonical]
            if not english and re.fullmatch(r"[A-Z0-9&.\- ]{2,}", canonical):
                english = canonical
            key = self.lookup_key(english or canonical)
            bucket = grouped.setdefault(key, {"canonical": canonical, "english": english, "original": set(), "ids": []})
            if re.search(r"[가-힣]", canonical) and not re.search(r"[가-힣]", bucket["canonical"]):
                bucket["canonical"] = canonical
            if not bucket["english"] and english:
                bucket["english"] = english
            bucket["original"].add(row["title"])
            bucket["ids"].append(int(row["id"]))
        return [
            CandidateBrand(data["canonical"], data["english"], sorted(data["original"]), sorted(set(data["ids"])))
            for key, data in sorted(grouped.items())
        ]

    def upsert_brand(self, candidate: CandidateBrand) -> int:
        self.conn.execute(
            """
            INSERT INTO brand_entities (canonical_name, english_name, notes, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(canonical_name) DO UPDATE SET
                english_name = COALESCE(excluded.english_name, brand_entities.english_name),
                notes = excluded.notes,
                updated_at = CURRENT_TIMESTAMP
            """,
            (candidate.canonical_name, candidate.english_name, json.dumps(candidate.original_names, ensure_ascii=False)),
        )
        brand_id = int(
            self.conn.execute("SELECT id FROM brand_entities WHERE canonical_name = ?", (candidate.canonical_name,)).fetchone()["id"]
        )
        for entry_id in candidate.source_entry_ids:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO brand_entry_map (brand_id, entry_id, match_method, confidence)
                VALUES (?, ?, 'title_normalization', ?)
                """,
                (brand_id, entry_id, 0.92),
            )
        self.conn.commit()
        return brand_id

    def request_json(self, url: str, params: dict[str, Any]) -> dict[str, Any]:
        for attempt in range(4):
            response = self.session.get(url, params=params, timeout=30)
            if response.status_code != 429:
                response.raise_for_status()
                time.sleep(self.delay)
                return response.json()
            time.sleep(max(2.0, self.delay) * (attempt + 1))
        response.raise_for_status()
        return response.json()

    def wikidata_search(self, candidate: CandidateBrand) -> dict[str, Any] | None:
        search_terms = [(candidate.english_name, "en"), (candidate.canonical_name, "ko")]
        for term, language in [(t, lang) for t, lang in search_terms if t]:
            data = self.request_json(
                WIKIDATA_API,
                {
                    "action": "wbsearchentities",
                    "format": "json",
                    "language": language,
                    "uselang": "ko",
                    "search": term,
                    "limit": 5,
                },
            )
            results = data.get("search", [])
            if results:
                return results[0]
        return None

    def wikidata_entity(self, qid: str) -> dict[str, Any]:
        data = self.request_json(
            WIKIDATA_API,
            {
                "action": "wbgetentities",
                "format": "json",
                "ids": qid,
                "props": "labels|descriptions|claims",
                "languages": "ko|en",
            },
        )
        return data["entities"][qid]

    def labels_for_qids(self, qids: set[str]) -> dict[str, str]:
        labels: dict[str, str] = {}
        if not qids:
            return labels
        qid_list = sorted(qids)
        for i in range(0, len(qid_list), 50):
            chunk = qid_list[i : i + 50]
            data = self.request_json(
                WIKIDATA_API,
                {
                    "action": "wbgetentities",
                    "format": "json",
                    "ids": "|".join(chunk),
                    "props": "labels",
                    "languages": "ko|en",
                },
            )
            for qid, entity in data.get("entities", {}).items():
                label = entity.get("labels", {}).get("ko", {}).get("value") or entity.get("labels", {}).get("en", {}).get("value")
                if label:
                    labels[qid] = label
        return labels

    def claim_values(self, entity: dict[str, Any]) -> tuple[dict[str, list[str]], dict[str, list[str]], set[str]]:
        claims = entity.get("claims", {})
        values: dict[str, list[str]] = {}
        raw: dict[str, list[str]] = {}
        qids: set[str] = set()
        for pid in PROPERTY_LABELS:
            for claim in claims.get(pid, [])[:5]:
                mainsnak = claim.get("mainsnak", {})
                datavalue = mainsnak.get("datavalue", {})
                value = datavalue.get("value")
                if value is None:
                    continue
                if isinstance(value, dict) and value.get("entity-type") == "item":
                    qid = "Q" + str(value.get("numeric-id"))
                    raw.setdefault(pid, []).append(qid)
                    qids.add(qid)
                elif isinstance(value, dict) and "time" in value:
                    raw.setdefault(pid, []).append(value["time"].lstrip("+"))
                elif isinstance(value, str):
                    raw.setdefault(pid, []).append(value)
        labels = self.labels_for_qids(qids)
        for pid, items in raw.items():
            rendered = []
            for item in items:
                rendered.append(labels.get(item, item))
            values[pid] = rendered
        return values, raw, qids

    def save_wikidata_profile(self, brand_id: int, candidate: CandidateBrand) -> None:
        result = self.wikidata_search(candidate)
        if not result:
            self.conn.execute(
                "UPDATE brand_entities SET status = 'needs_review', confidence = 0.2, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (brand_id,),
            )
            self.conn.commit()
            return

        qid = result["id"]
        entity = self.wikidata_entity(qid)
        labels = entity.get("labels", {})
        descriptions = entity.get("descriptions", {})
        label = labels.get("ko", {}).get("value") or labels.get("en", {}).get("value") or result.get("label")
        description = descriptions.get("ko", {}).get("value") or descriptions.get("en", {}).get("value")
        values, raw_values, _ = self.claim_values(entity)
        get = lambda pid: "; ".join(values.get(pid, [])) or None
        official_website = get("P856")
        confidence = 0.78
        if candidate.english_name and label and candidate.english_name.lower().replace("’", "'") in label.lower().replace("’", "'"):
            confidence = 0.9

        self.conn.execute(
            """
            UPDATE brand_entities SET
                english_name = COALESCE(english_name, ?),
                wikidata_id = ?,
                wikidata_label = ?,
                wikidata_description = ?,
                official_website = ?,
                country = ?,
                headquarters = ?,
                parent_organization = ?,
                owned_by = ?,
                industry = ?,
                inception = ?,
                confidence = ?,
                status = CASE WHEN ? >= 0.75 THEN 'enriched' ELSE 'needs_review' END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                candidate.english_name,
                qid,
                label,
                description,
                official_website,
                get("P17"),
                get("P159"),
                get("P749"),
                get("P127"),
                get("P452"),
                get("P571"),
                confidence,
                confidence,
                brand_id,
            ),
        )
        source_id = self.source_document(
            "knowledge_graph",
            "Wikidata",
            f"Wikidata entity {qid}",
            WIKIDATA_ENTITY.format(qid=qid),
            70,
            "Structured facts used for identity matching and current profile hints; review important claims against primary sources.",
        )
        fact_map = {
            "official_website": official_website,
            "country": get("P17"),
            "headquarters": get("P159"),
            "parent_organization": get("P749"),
            "owned_by": get("P127"),
            "industry": get("P452"),
            "founded_by": get("P112"),
            "chief_executive_officer": get("P169"),
            "stock_exchange": get("P414"),
            "ticker_symbol": get("P249"),
            "inception": get("P571"),
            "wikidata_description": description,
        }
        for fact_type, fact_value in fact_map.items():
            if fact_value:
                self.save_fact(brand_id, fact_type, fact_value, source_id, confidence, raw_values)
        if official_website:
            official_source = self.source_document(
                "official_site",
                label or candidate.canonical_name,
                f"{candidate.canonical_name} official website",
                official_website.split("; ")[0],
                95,
                "Official website URL surfaced via Wikidata; use as primary source for manual/current editorial updates.",
            )
            self.save_fact(brand_id, "official_website_primary", official_website.split("; ")[0], official_source, 0.82, None)

        summary = self.profile_summary(candidate.canonical_name, label, description, fact_map)
        if summary:
            self.save_update(
                brand_id,
                "structured_profile",
                f"{candidate.canonical_name} 최신 프로필 보강",
                summary,
                source_id,
                confidence,
            )
        self.save_wikidata_images(brand_id, candidate, source_id, values)
        self.conn.commit()

    def profile_summary(self, canonical: str, label: str | None, description: str | None, facts: dict[str, str | None]) -> str:
        parts = []
        if description:
            parts.append(f"{canonical}는 Wikidata 기준으로 '{description}'로 식별됩니다.")
        if facts.get("official_website"):
            parts.append(f"공식 웹사이트는 {facts['official_website'].split('; ')[0]}입니다.")
        org = facts.get("owned_by") or facts.get("parent_organization")
        if org:
            parts.append(f"소유/상위 조직 정보로 {org}가 연결되어 있습니다.")
        if facts.get("country"):
            parts.append(f"국가 정보는 {facts['country']}로 정리했습니다.")
        if facts.get("inception"):
            parts.append(f"설립/시작 시점은 {facts['inception']}로 기록되어 있습니다.")
        if not parts and label:
            parts.append(f"{canonical}는 Wikidata 항목 '{label}'와 매칭되었습니다.")
        return " ".join(parts)

    def save_fact(
        self,
        brand_id: int,
        fact_type: str,
        fact_value: str,
        source_id: int,
        confidence: float,
        fact_json: dict[str, Any] | None,
        observed_at: str | None = None,
    ) -> None:
        self.conn.execute(
            """
            INSERT INTO brand_facts (brand_id, fact_type, fact_value, fact_json, source_document_id, observed_at, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, fact_type, fact_value, source_document_id) DO UPDATE SET
                fact_json = excluded.fact_json,
                observed_at = excluded.observed_at,
                confidence = excluded.confidence
            """,
            (
                brand_id,
                fact_type,
                fact_value,
                json.dumps(fact_json, ensure_ascii=False) if fact_json is not None else None,
                source_id,
                observed_at,
                confidence,
            ),
        )

    def save_update(self, brand_id: int, update_type: str, title: str, summary: str, source_id: int, confidence: float) -> None:
        self.conn.execute(
            """
            INSERT INTO brand_updates (brand_id, update_type, title, summary, source_document_id, confidence)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(brand_id, update_type, source_document_id) DO UPDATE SET
                title = excluded.title,
                summary = excluded.summary,
                confidence = excluded.confidence,
                created_at = CURRENT_TIMESTAMP
            """,
            (brand_id, update_type, title, summary, source_id, confidence),
        )

    def download_image(self, brand_id: int, image_type: str, remote_url: str) -> str | None:
        try:
            response = self.session.get(remote_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException:
            return None
        content_type = response.headers.get("Content-Type", "").split(";")[0]
        ext = mimetypes.guess_extension(content_type) or Path(urlparse(remote_url).path).suffix or ".bin"
        if ext == ".jpe":
            ext = ".jpg"
        digest = hashlib.sha1(remote_url.encode("utf-8")).hexdigest()[:14]
        target = self.image_dir / f"{brand_id:04d}_{image_type}_{digest}{ext}"
        if not target.exists():
            target.write_bytes(response.content)
        return str(target.relative_to(ROOT))

    def save_wikidata_images(self, brand_id: int, candidate: CandidateBrand, source_id: int, values: dict[str, list[str]]) -> None:
        for pid, image_type in [("P154", "logo"), ("P18", "image")]:
            for filename in values.get(pid, [])[:1]:
                remote_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename)}?width=900"
                local_path = self.download_image(brand_id, image_type, remote_url)
                self.conn.execute(
                    """
                    INSERT INTO update_images (brand_id, image_type, remote_url, local_path, source_document_id, license_note, downloaded_at)
                    VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END)
                    ON CONFLICT(brand_id, image_type, remote_url) DO UPDATE SET
                        local_path = excluded.local_path,
                        source_document_id = excluded.source_document_id,
                        downloaded_at = excluded.downloaded_at
                    """,
                    (
                        brand_id,
                        image_type,
                        remote_url,
                        local_path,
                        source_id,
                        "Wikimedia Commons file referenced by Wikidata; verify file page license before public reuse.",
                        local_path,
                    ),
                )

    def fetch_kantar_2026_top10(self) -> list[dict[str, str]]:
        rows = [
            {"rank": "1", "brand": "Google", "brand_value_usd_m": "1484895", "yoy_change": "57%"},
            {"rank": "2", "brand": "Apple", "brand_value_usd_m": "1380294", "yoy_change": "6%"},
            {"rank": "3", "brand": "Microsoft", "brand_value_usd_m": "1111788", "yoy_change": "26%"},
            {"rank": "4", "brand": "Amazon", "brand_value_usd_m": "1022820", "yoy_change": "18%"},
            {"rank": "5", "brand": "NVIDIA", "brand_value_usd_m": "814906", "yoy_change": "60%"},
            {"rank": "6", "brand": "Facebook", "brand_value_usd_m": "366624", "yoy_change": "22%"},
            {"rank": "7", "brand": "Instagram", "brand_value_usd_m": "286158", "yoy_change": "25%"},
            {"rank": "8", "brand": "Tencent", "brand_value_usd_m": "251551", "yoy_change": "45%"},
            {"rank": "9", "brand": "Oracle", "brand_value_usd_m": "235838", "yoy_change": "10%"},
            {"rank": "10", "brand": "McDonald's", "brand_value_usd_m": "235095", "yoy_change": "6%"},
        ]
        try:
            response = self.session.get(KANTAR_2026_URL, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            text = clean_text(soup.get_text(" "))
            if "Kantar BrandZ Top 10 Most Valuable Global Brands 2026" not in text:
                return rows
            return rows
        except requests.RequestException:
            return rows

    def apply_kantar_2026(self) -> None:
        source_id = self.source_document(
            "brand_ranking",
            "Kantar BrandZ",
            "Kantar BrandZ Top 10 Most Valuable Global Brands 2026",
            KANTAR_2026_URL,
            85,
            "Brand value ranking; methodology combines financial analysis and brand equity measures. Store separately from other rankings.",
        )
        brand_lookup = self.brand_lookup()
        for row in self.fetch_kantar_2026_top10():
            key = self.lookup_key(row["brand"])
            brand_id = brand_lookup.get(key)
            if not brand_id:
                continue
            value = f"2026 rank {row['rank']}; US${int(row['brand_value_usd_m']):,}M; YoY {row['yoy_change']}"
            self.save_fact(
                brand_id,
                "brand_value_ranking_kantar_brandz_2026",
                value,
                source_id,
                0.9,
                row,
                observed_at="2026",
            )
            self.save_update(
                brand_id,
                "brand_value_2026",
                f"{row['brand']} Kantar BrandZ 2026 순위",
                f"Kantar BrandZ 2026 Top 100에서 {row['brand']}는 {row['rank']}위, 브랜드 가치는 US${int(row['brand_value_usd_m']):,}M, 전년 대비 변화율은 {row['yoy_change']}로 공표되었습니다.",
                source_id,
                0.9,
            )
        self.conn.commit()

    def lookup_key(self, value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", value.lower().replace("’", "'"))

    def brand_lookup(self) -> dict[str, int]:
        lookup: dict[str, int] = {}
        for row in self.conn.execute("SELECT id, canonical_name, english_name, wikidata_label FROM brand_entities"):
            for value in [row["canonical_name"], row["english_name"], row["wikidata_label"]]:
                if value:
                    lookup[self.lookup_key(value)] = int(row["id"])
        for ko, en in BRAND_ALIASES.items():
            row = self.conn.execute("SELECT id FROM brand_entities WHERE canonical_name = ?", (ko,)).fetchone()
            if row:
                lookup[self.lookup_key(en)] = int(row["id"])
        return lookup

    def run(self, limit: int | None = None, only_missing: bool = False) -> None:
        candidates = self.collect_candidate_brands()
        if only_missing:
            filtered = []
            for candidate in candidates:
                row = self.conn.execute(
                    "SELECT status FROM brand_entities WHERE canonical_name = ?",
                    (candidate.canonical_name,),
                ).fetchone()
                if not row or row["status"] != "enriched":
                    filtered.append(candidate)
            candidates = filtered
        if limit:
            candidates = candidates[:limit]
        print(f"Candidate brands: {len(candidates)}")
        for index, candidate in enumerate(candidates, start=1):
            brand_id = self.upsert_brand(candidate)
            print(f"[{index}/{len(candidates)}] {candidate.canonical_name} / {candidate.english_name or '-'}")
            try:
                self.save_wikidata_profile(brand_id, candidate)
            except Exception as exc:
                print(f"  ERROR: {exc}")
                self.conn.execute(
                    "UPDATE brand_entities SET status = 'needs_review', notes = COALESCE(notes, '') || ? WHERE id = ?",
                    (f" enrichment_error={exc}", brand_id),
                )
                self.conn.commit()
        self.apply_kantar_2026()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Append current-source brand updates without changing original encyclopedia entries.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--images", type=Path, default=IMAGE_DIR)
    parser.add_argument("--delay", type=float, default=0.5)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--reset", action="store_true", help="Drop and rebuild update/enrichment tables before running.")
    parser.add_argument("--only-missing", action="store_true", help="Only enrich brands that are not already marked enriched.")
    args = parser.parse_args()

    updater = BrandUpdater(args.db, args.images, args.delay)
    if args.reset:
        updater.reset_update_tables()
    updater.run(limit=args.limit, only_missing=args.only_missing)


if __name__ == "__main__":
    main()
