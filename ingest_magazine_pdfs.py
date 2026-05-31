from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
PDF_DIR = ROOT / "brand_wiki" / "raw" / "pdf"


INSIGHT_KEYWORDS = {
    "brand_meaning": ["브랜드", "의미", "정체성", "상징", "철학", "본질", "가치"],
    "experience_strategy": ["경험", "공간", "감각", "시간", "머무", "체류", "라이프스타일", "서비스"],
    "design_philosophy": ["디자인", "조형", "색", "컬러", "로고", "CI", "BI", "패키지", "형태"],
    "strategic_positioning": ["포지셔닝", "전략", "차별화", "시장", "경쟁", "프리미엄", "대중"],
    "consumer_psychology": ["소비자", "고객", "욕망", "심리", "팬", "커뮤니티", "충성"],
    "cultural_meaning": ["문화", "시대", "사회", "아이콘", "트렌드", "서사", "스토리"],
    "product_strategy": ["제품", "서비스", "라인업", "대표", "기술", "품질", "기능"],
}

CLAIM_HINTS = [
    "이 아니다",
    "이 아니라",
    "에 가깝",
    "판매한다",
    "제공한다",
    "설계한다",
    "상징한다",
    "대표한다",
    "구축한다",
    "만든다",
    "바꾸었다",
    "확장했다",
]

ALLOWED_SHORT_ALIASES = {"BMW", "K2", "KFC", "IWC", "H&M", "BIC", "UGG", "OXO", "MINI", "TOMS"}
BLOCKED_ALIASES = {"uni", "fun", "emi", "max", "gap", "it", "ad", "no", "on", "in", "go"}


@dataclass
class BrandAlias:
    brand_id: int
    canonical_name: str
    alias: str
    alias_norm: str


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    value = value.replace("\u00a0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().lower()


def split_sentences(text: str) -> list[str]:
    text = clean_text(text)
    # Korean magazine PDFs often omit clean sentence boundaries after OCR/text extraction,
    # so keep the splitter conservative and avoid tiny fragments.
    parts = re.split(r"(?<=[.!?。])\s+|(?<=다\.)\s+|(?<=다)\s+(?=[가-힣A-Z0-9])|\n+", text)
    return [clean_text(p) for p in parts if len(clean_text(p)) >= 25]


def chunk_text(text: str, size: int = 1800, overlap: int = 180) -> list[str]:
    text = clean_text(text)
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + size)
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = max(0, end - overlap)
    return chunks


def remove_sourcey_phrasing(text: str) -> str:
    text = clean_text(text)
    text = re.sub(r"(이|본)\s*(매거진|잡지|PDF|자료|본문)(에서는|은|는|에 따르면|에서)\s*", "", text)
    text = re.sub(r"(AI|인공지능)\s*(분석|에 따르면|는)\s*", "", text, flags=re.I)
    text = re.sub(r"\s*\(?p\.\s*\d+\)?", "", text, flags=re.I)
    return clean_text(text)


def classify_insight(sentence: str) -> str:
    lowered = sentence.lower()
    best_type = "editorial_thesis"
    best_hits = 0
    for insight_type, keywords in INSIGHT_KEYWORDS.items():
        hits = sum(1 for keyword in keywords if keyword.lower() in lowered)
        if hits > best_hits:
            best_type = insight_type
            best_hits = hits
    return best_type


class MagazinePdfIngester:
    def __init__(self, db_path: Path, pdf_dir: Path, reset: bool = False) -> None:
        self.db_path = db_path
        self.pdf_dir = pdf_dir
        self.pdf_dir.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()
        if reset:
            self.reset_pdf_tables()
        self.aliases = self.load_aliases()

    def init_db(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS pdf_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                title TEXT,
                file_path TEXT NOT NULL,
                file_hash TEXT NOT NULL UNIQUE,
                page_count INTEGER NOT NULL,
                imported_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS pdf_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,
                page_number INTEGER NOT NULL,
                text TEXT,
                matched_brand_ids TEXT,
                UNIQUE(document_id, page_number)
            );

            CREATE TABLE IF NOT EXISTS pdf_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,
                page_start INTEGER NOT NULL,
                page_end INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                matched_brand_ids TEXT,
                UNIQUE(document_id, page_start, chunk_index)
            );

            CREATE TABLE IF NOT EXISTS brand_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL REFERENCES brand_entities(id) ON DELETE CASCADE,
                insight_type TEXT NOT NULL,
                public_claim TEXT NOT NULL,
                public_explanation TEXT,
                internal_evidence_text TEXT NOT NULL,
                internal_source_document_id INTEGER NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,
                internal_page_number INTEGER NOT NULL,
                confidence REAL NOT NULL DEFAULT 0.5,
                editorial_status TEXT NOT NULL DEFAULT 'review_needed',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(brand_id, insight_type, public_claim, internal_source_document_id, internal_page_number)
            );

            CREATE INDEX IF NOT EXISTS idx_pdf_pages_document ON pdf_pages(document_id);
            CREATE INDEX IF NOT EXISTS idx_pdf_chunks_document ON pdf_chunks(document_id);
            CREATE INDEX IF NOT EXISTS idx_brand_insights_brand ON brand_insights(brand_id);

            CREATE VIEW IF NOT EXISTS v_brand_insight_review_queue AS
            SELECT
                i.id,
                b.canonical_name,
                b.english_name,
                i.insight_type,
                i.public_claim,
                i.public_explanation,
                i.confidence,
                i.editorial_status,
                d.filename,
                i.internal_page_number,
                i.internal_evidence_text
            FROM brand_insights i
            JOIN brand_entities b ON b.id = i.brand_id
            JOIN pdf_documents d ON d.id = i.internal_source_document_id
            WHERE i.editorial_status IN ('candidate', 'review_needed')
            ORDER BY i.confidence DESC, b.canonical_name, d.filename, i.internal_page_number;

            CREATE VIEW IF NOT EXISTS v_brand_pdf_coverage AS
            SELECT
                b.id AS brand_id,
                b.canonical_name,
                COUNT(DISTINCT p.document_id) AS pdf_count,
                COUNT(DISTINCT p.id) AS page_count,
                COUNT(DISTINCT i.id) AS insight_count
            FROM brand_entities b
            LEFT JOIN pdf_pages p ON EXISTS (
                SELECT 1
                FROM json_each(p.matched_brand_ids)
                WHERE json_each.value = b.id
            )
            LEFT JOIN brand_insights i ON i.brand_id = b.id
            GROUP BY b.id, b.canonical_name;
            """
        )
        self.conn.commit()

    def reset_pdf_tables(self) -> None:
        self.conn.executescript(
            """
            DELETE FROM brand_insights;
            DELETE FROM pdf_chunks;
            DELETE FROM pdf_pages;
            DELETE FROM pdf_documents;
            """
        )
        self.conn.commit()

    def valid_alias(self, alias: str) -> bool:
        alias = clean_text(alias)
        if not alias:
            return False
        if alias.lower() in BLOCKED_ALIASES:
            return False
        if alias.upper() in ALLOWED_SHORT_ALIASES:
            return True
        if re.fullmatch(r"[A-Za-z0-9&'.\- ]+", alias):
            compact = re.sub(r"[^A-Za-z0-9]", "", alias)
            return len(compact) >= 4
        return len(alias) >= 2

    def load_aliases(self) -> list[BrandAlias]:
        aliases: list[BrandAlias] = []
        rows = self.conn.execute(
            """
            SELECT b.id AS brand_id, b.canonical_name, a.alias
            FROM brand_entities b
            JOIN brand_entry_map m ON m.brand_id = b.id
            LEFT JOIN brand_aliases a ON a.brand_id = b.id
            GROUP BY b.id, b.canonical_name, a.alias
            """
        ).fetchall()
        seen: set[tuple[int, str]] = set()
        for row in rows:
            for alias in [row["alias"], row["canonical_name"]]:
                alias = clean_text(alias)
                if not self.valid_alias(alias):
                    continue
                key = (int(row["brand_id"]), norm(alias))
                if key in seen:
                    continue
                seen.add(key)
                aliases.append(BrandAlias(int(row["brand_id"]), row["canonical_name"], alias, norm(alias)))
        aliases.sort(key=lambda x: len(x.alias), reverse=True)
        return aliases

    def matched_brands(self, text: str) -> dict[int, BrandAlias]:
        text_norm = norm(text)
        matches: dict[int, BrandAlias] = {}
        for alias in self.aliases:
            if alias.brand_id in matches:
                continue
            if alias.alias_norm in text_norm:
                matches[alias.brand_id] = alias
        return matches

    def upsert_document(self, path: Path, page_count: int) -> int:
        digest = file_hash(path)
        rel = str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path)
        self.conn.execute(
            """
            INSERT INTO pdf_documents (filename, title, file_path, file_hash, page_count, imported_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(file_hash) DO UPDATE SET
                filename = excluded.filename,
                title = excluded.title,
                file_path = excluded.file_path,
                page_count = excluded.page_count,
                imported_at = excluded.imported_at
            """,
            (path.name, path.stem, rel, digest, page_count, now_iso()),
        )
        self.conn.commit()
        return int(self.conn.execute("SELECT id FROM pdf_documents WHERE file_hash = ?", (digest,)).fetchone()["id"])

    def save_page(self, document_id: int, page_number: int, text: str, brand_ids: list[int]) -> None:
        self.conn.execute(
            """
            INSERT INTO pdf_pages (document_id, page_number, text, matched_brand_ids)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(document_id, page_number) DO UPDATE SET
                text = excluded.text,
                matched_brand_ids = excluded.matched_brand_ids
            """,
            (document_id, page_number, text, json.dumps(brand_ids, ensure_ascii=False)),
        )

    def save_chunks(self, document_id: int, page_number: int, text: str) -> None:
        for index, chunk in enumerate(chunk_text(text), start=1):
            brand_ids = sorted(self.matched_brands(chunk).keys())
            self.conn.execute(
                """
                INSERT INTO pdf_chunks (document_id, page_start, page_end, chunk_index, chunk_text, matched_brand_ids)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(document_id, page_start, chunk_index) DO UPDATE SET
                    chunk_text = excluded.chunk_text,
                    matched_brand_ids = excluded.matched_brand_ids
                """,
                (document_id, page_number, page_number, index, chunk, json.dumps(brand_ids, ensure_ascii=False)),
            )

    def save_insights(self, document_id: int, page_number: int, text: str, page_matches: dict[int, BrandAlias]) -> int:
        sentences = split_sentences(text)
        saved = 0
        for idx, sentence in enumerate(sentences):
            if len(sentence) < 40 or len(sentence) > 520:
                continue
            if re.match(r"^(이 아니라|서\)|고\)|며\)|그리고|하지만)\b", sentence):
                continue
            sentence_norm = norm(sentence)
            has_claim_hint = any(hint in sentence for hint in CLAIM_HINTS)
            has_insight_keyword = any(keyword.lower() in sentence_norm for keywords in INSIGHT_KEYWORDS.values() for keyword in keywords)
            if not (has_claim_hint or has_insight_keyword):
                continue
            local_matches = {
                brand_id: alias
                for brand_id, alias in page_matches.items()
                if alias.alias_norm in sentence_norm or norm(alias.canonical_name) in sentence_norm
            }
            if not local_matches:
                continue
            explanation_parts = []
            if idx > 0:
                explanation_parts.append(sentences[idx - 1])
            explanation_parts.append(sentence)
            if idx + 1 < len(sentences):
                explanation_parts.append(sentences[idx + 1])
            public_claim = remove_sourcey_phrasing(sentence)
            public_explanation = remove_sourcey_phrasing(" ".join(explanation_parts))
            if len(public_claim) < 35:
                continue
            if len(public_claim) > 420:
                public_claim = public_claim[:420].rsplit(" ", 1)[0].rstrip(".,;:") + "..."
            if len(public_explanation) > 900:
                public_explanation = public_explanation[:900].rsplit(" ", 1)[0].rstrip(".,;:") + "..."
            insight_type = classify_insight(sentence)
            confidence = 0.62 + (0.12 if has_claim_hint else 0) + (0.08 if has_insight_keyword else 0)
            for brand_id in local_matches:
                self.conn.execute(
                    """
                    INSERT OR IGNORE INTO brand_insights (
                        brand_id, insight_type, public_claim, public_explanation,
                        internal_evidence_text, internal_source_document_id,
                        internal_page_number, confidence, editorial_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        brand_id,
                        insight_type,
                        public_claim,
                        public_explanation,
                        sentence,
                        document_id,
                        page_number,
                        min(confidence, 0.9),
                        "candidate" if min(confidence, 0.9) >= 0.8 else "review_needed",
                    ),
                )
                saved += self.conn.total_changes
        return saved

    def ingest_pdf(self, path: Path) -> None:
        doc = fitz.open(path)
        document_id = self.upsert_document(path, doc.page_count)
        total_matches: set[int] = set()
        insight_count = 0
        for page_index in range(doc.page_count):
            page_number = page_index + 1
            text = clean_text(doc.load_page(page_index).get_text("text"))
            matches = self.matched_brands(text)
            brand_ids = sorted(matches.keys())
            total_matches.update(brand_ids)
            self.save_page(document_id, page_number, text, brand_ids)
            self.save_chunks(document_id, page_number, text)
            before = self.conn.total_changes
            self.save_insights(document_id, page_number, text, matches)
            insight_count += max(0, self.conn.total_changes - before)
            if page_number % 20 == 0:
                self.conn.commit()
        self.conn.commit()
        print(f"{path.name}: pages={doc.page_count}, matched_brands={len(total_matches)}, insight_candidates={insight_count}")

    def ingest_all(self) -> None:
        pdfs = sorted(self.pdf_dir.glob("*.pdf"))
        if not pdfs:
            print(f"No PDFs found in {self.pdf_dir}")
            return
        for path in pdfs:
            self.ingest_pdf(path)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Ingest brand magazine PDFs into internal evidence tables and public-safe insight candidates.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--pdf-dir", type=Path, default=PDF_DIR)
    parser.add_argument("--pdf", type=Path, default=None)
    parser.add_argument("--reset", action="store_true", help="Clear PDF ingest tables before processing.")
    args = parser.parse_args()

    ingester = MagazinePdfIngester(args.db, args.pdf_dir, reset=args.reset)
    if args.pdf:
        ingester.ingest_pdf(args.pdf)
    else:
        ingester.ingest_all()


if __name__ == "__main__":
    main()
