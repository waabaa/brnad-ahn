from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
WIKI_DIR = ROOT / "brand_wiki"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9가-힣]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-") or "brand"


def md_escape(value: str | None) -> str:
    return clean(value).replace("|", "\\|")


def frontmatter(data: dict[str, object]) -> str:
    lines = ["---"]
    for key, value in data.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"  - {json.dumps(item, ensure_ascii=False)}")
        else:
            lines.append(f"{key}: {json.dumps(value, ensure_ascii=False)}")
    lines.append("---")
    return "\n".join(lines)


class WikiExporter:
    def __init__(self, db_path: Path, wiki_dir: Path) -> None:
        self.db_path = db_path
        self.wiki_dir = wiki_dir
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()

    def init_db(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS wiki_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_path TEXT NOT NULL UNIQUE,
                page_type TEXT NOT NULL,
                brand_id INTEGER,
                title TEXT NOT NULL,
                tier TEXT,
                domain_slug TEXT,
                body TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS wiki_search_fts USING fts5(
                page_path UNINDEXED,
                page_type,
                title,
                tier,
                domain,
                body,
                tokenize='unicode61'
            );
            """
        )
        self.conn.commit()

    def write(self, rel_path: str, body: str, page_type: str, title: str, brand_id: int | None = None, tier: str | None = None, domain: str | None = None) -> None:
        path = self.wiki_dir / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
        self.conn.execute(
            """
            INSERT INTO wiki_pages (page_path, page_type, brand_id, title, tier, domain_slug, body, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(page_path) DO UPDATE SET
                page_type = excluded.page_type,
                brand_id = excluded.brand_id,
                title = excluded.title,
                tier = excluded.tier,
                domain_slug = excluded.domain_slug,
                body = excluded.body,
                updated_at = excluded.updated_at
            """,
            (rel_path, page_type, brand_id, title, tier, domain, body, now_iso()),
        )

    def rebuild_search(self) -> None:
        self.conn.execute("DELETE FROM wiki_search_fts")
        rows = self.conn.execute(
            """
            SELECT page_path, page_type, title, COALESCE(tier,''), COALESCE(domain_slug,''), body
            FROM wiki_pages
            """
        ).fetchall()
        for row in rows:
            self.conn.execute(
                """
                INSERT INTO wiki_search_fts (page_path, page_type, title, tier, domain, body)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                tuple(row),
            )
        self.conn.commit()

    def export_agents(self) -> None:
        body = """# Brand Wiki Operating Rules

이 위키는 브랜드 전문 매거진 사이트를 만들기 위한 내부 지식 위키다.

## 원칙

- 원본 PDF, 수집 HTML, 원본 이미지는 내부 근거로만 보존한다.
- 공개 문장에는 "PDF에 따르면", "AI에 따르면", "매거진에 따르면" 같은 표현을 쓰지 않는다.
- PDF 본문 캡처, 긴 직접 인용, 페이지 이미지 공개를 금지한다.
- 공개 가능한 해석은 `brand_insights.editorial_status = approved`인 문장만 사용한다.
- 자동 추출 후보는 검수 전까지 내부 참고 자료로만 사용한다.
- 브랜드 상세 페이지는 객관 정보와 해석적 관점을 분리하되, 사용자는 하나의 자연스러운 매거진 글처럼 읽을 수 있어야 한다.

## 페이지 등급

- `A_magazine_ready`: 정식 매거진 상세 공개 가능
- `B_editorial_review`: 편집 검수 후 공개 가능
- `C_source_backed`: 기본 브랜드 사전 가능
- `D_directory_only`: 디렉터리/검색 카드만 권장

## 검색

검색은 SQLite `wiki_search_fts`와 `brand_search_fts`를 함께 사용한다.
"""
        self.write("AGENTS.md", body, "system", "Brand Wiki Operating Rules")

    def brand_rows(self) -> list[sqlite3.Row]:
        return self.conn.execute(
            """
            SELECT
                p.*, q.tier, q.source_entry_count, q.pdf_page_count, q.insight_candidate_count,
                q.approved_insight_count, q.section_total_chars, q.filled_section_count,
                q.media_asset_count, q.recommendation, d.label_ko AS domain_ko, d.label_en AS domain_en
            FROM brand_magazine_profiles p
            JOIN brand_content_quality q ON q.brand_id = p.brand_id
            JOIN magazine_domains d ON d.slug = p.domain_slug
            ORDER BY
                CASE q.tier
                    WHEN 'A_magazine_ready' THEN 0
                    WHEN 'B_editorial_review' THEN 1
                    WHEN 'C_source_backed' THEN 2
                    ELSE 3
                END,
                p.display_name
            """
        ).fetchall()

    def export_index(self, rows: list[sqlite3.Row]) -> None:
        by_tier: dict[str, list[sqlite3.Row]] = {}
        for row in rows:
            by_tier.setdefault(row["tier"], []).append(row)
        parts = [
            frontmatter({"type": "index", "updated": now_iso()}),
            "# Brand Wiki",
            "",
            "브랜드 사전 매거진을 위한 내부 지식 위키다. A/B/C 등급 브랜드는 페이지를 가지며, D 등급은 디렉터리 검색 대상으로만 관리한다.",
            "",
            "## 등급별 현황",
            "",
            "| 등급 | 개수 | 용도 |",
            "|---|---:|---|",
        ]
        labels = {
            "A_magazine_ready": "정식 매거진 공개 가능",
            "B_editorial_review": "편집 검수 후 공개",
            "C_source_backed": "기본 사전 페이지",
            "D_directory_only": "디렉터리 카드",
        }
        for tier in ["A_magazine_ready", "B_editorial_review", "C_source_backed", "D_directory_only"]:
            parts.append(f"| `{tier}` | {len(by_tier.get(tier, []))} | {labels[tier]} |")
        parts.extend(["", "## A/B/C 브랜드"])
        for tier in ["A_magazine_ready", "B_editorial_review", "C_source_backed"]:
            parts.extend(["", f"### {tier}"])
            for row in by_tier.get(tier, []):
                rel = f"brands/{row['slug']}.md"
                parts.append(f"- [{row['display_name']}]({rel}) · {row['domain_ko']} · {row['section_total_chars']} chars")
        self.write("index.md", "\n".join(parts) + "\n", "index", "Brand Wiki")

    def export_domains(self) -> None:
        rows = self.conn.execute(
            """
            SELECT d.*, COUNT(p.brand_id) AS brand_count
            FROM magazine_domains d
            LEFT JOIN brand_magazine_profiles p ON p.domain_slug=d.slug
            GROUP BY d.slug
            ORDER BY d.label_ko
            """
        ).fetchall()
        index_parts = [frontmatter({"type": "domain_index", "updated": now_iso()}), "# 산업 도메인", ""]
        for row in rows:
            index_parts.append(f"- [{row['label_ko']}]({row['slug']}.md) · ISIC {row['isic_code']} · {row['brand_count']} brands")
            brands = self.conn.execute(
                """
                SELECT p.display_name, p.slug, q.tier
                FROM brand_magazine_profiles p
                JOIN brand_content_quality q ON q.brand_id=p.brand_id
                WHERE p.domain_slug=?
                ORDER BY q.tier, p.display_name
                """,
                (row["slug"],),
            ).fetchall()
            parts = [
                frontmatter({
                    "type": "domain",
                    "slug": row["slug"],
                    "label_ko": row["label_ko"],
                    "label_en": row["label_en"],
                    "isic_code": row["isic_code"],
                    "isic_label": row["isic_label"],
                    "updated": now_iso(),
                }),
                f"# {row['label_ko']}",
                "",
                f"- English: {row['label_en']}",
                f"- ISIC Rev.4: `{row['isic_code']}` {row['isic_label']}",
                f"- Brands: {len(brands)}",
                "",
                "## 브랜드",
            ]
            for brand in brands:
                if brand["tier"] == "D_directory_only":
                    parts.append(f"- {brand['display_name']} · `{brand['tier']}`")
                else:
                    parts.append(f"- [{brand['display_name']}](../brands/{brand['slug']}.md) · `{brand['tier']}`")
            self.write(f"domains/{row['slug']}.md", "\n".join(parts) + "\n", "domain", row["label_ko"], domain=row["slug"])
        self.write("domains/index.md", "\n".join(index_parts) + "\n", "domain_index", "산업 도메인")

    def export_brand(self, row: sqlite3.Row) -> None:
        sections = self.conn.execute(
            """
            SELECT section_key, section_title, body
            FROM magazine_sections
            WHERE brand_id=?
            ORDER BY sort_order
            """,
            (row["brand_id"],),
        ).fetchall()
        timeline = self.conn.execute(
            """
            SELECT year, description
            FROM brand_timeline
            WHERE brand_id=?
            ORDER BY year
            LIMIT 20
            """,
            (row["brand_id"],),
        ).fetchall()
        aliases = self.conn.execute(
            "SELECT alias FROM brand_aliases WHERE brand_id=? ORDER BY alias LIMIT 20",
            (row["brand_id"],),
        ).fetchall()
        assets = self.conn.execute(
            """
            SELECT asset_role, local_path, remote_url, alt
            FROM brand_media_assets
            WHERE brand_id=?
            ORDER BY sort_order
            LIMIT 12
            """,
            (row["brand_id"],),
        ).fetchall()
        approved = self.conn.execute(
            """
            SELECT insight_type, public_claim, public_explanation
            FROM brand_insights
            WHERE brand_id=? AND editorial_status='approved'
            ORDER BY insight_type, id
            """,
            (row["brand_id"],),
        ).fetchall()
        review_count = self.conn.execute(
            "SELECT COUNT(*) FROM brand_insights WHERE brand_id=? AND editorial_status!='approved'",
            (row["brand_id"],),
        ).fetchone()[0]

        fm = {
            "type": "brand",
            "brand_id": row["brand_id"],
            "name": row["display_name"],
            "english_name": row["english_name"] or "",
            "slug": row["slug"],
            "domain": row["domain_ko"],
            "domain_slug": row["domain_slug"],
            "isic_code": row["isic_code"],
            "tier": row["tier"],
            "source_entry_count": row["source_entry_count"],
            "pdf_page_count": row["pdf_page_count"],
            "approved_insight_count": row["approved_insight_count"],
            "updated": now_iso(),
        }
        parts = [
            frontmatter(fm),
            f"# {row['display_name']}",
            "",
            row["deck"] or "",
            "",
            "## 프로필",
            "",
            f"- 영문명: {row['english_name'] or ''}",
            f"- 도메인: {row['domain_ko']} ({row['domain_en']})",
            f"- ISIC Rev.4: `{row['isic_code']}` {row['isic_label']}",
            f"- 콘텐츠 등급: `{row['tier']}`",
            f"- 추천 운영: {row['recommendation']}",
            f"- 대표 이미지: `{row['hero_image_path'] or ''}`",
            f"- 로고 이미지: `{row['logo_image_path'] or ''}`",
            "",
            "## 별칭",
            "",
        ]
        parts.extend(f"- {alias['alias']}" for alias in aliases)

        for section in sections:
            body = clean(section["body"])
            if not body or body == "추가 편집이 필요한 섹션입니다.":
                continue
            parts.extend(["", f"## {section['section_title']}", "", body])

        if approved:
            parts.extend(["", "## 승인된 브랜드 관점", ""])
            for insight in approved:
                parts.append(f"- **{insight['public_claim']}** {insight['public_explanation']}")

        if timeline:
            parts.extend(["", "## 연표 후보", ""])
            for item in timeline:
                parts.append(f"- **{item['year']}** {item['description']}")

        if assets:
            parts.extend(["", "## 미디어 자산", "", "| 역할 | 경로 | 설명 |", "|---|---|---|"])
            for asset in assets:
                path = asset["local_path"] or asset["remote_url"] or ""
                parts.append(f"| {md_escape(asset['asset_role'])} | `{md_escape(path)}` | {md_escape(asset['alt'])} |")

        parts.extend([
            "",
            "## 내부 편집 메모",
            "",
            f"- PDF 매칭 페이지: {row['pdf_page_count']}",
            f"- 검수 대기 인사이트: {review_count}",
            "- 공개 페이지에는 내부 근거 문장과 PDF 페이지 이미지를 노출하지 않는다.",
        ])

        self.write(
            f"brands/{row['slug']}.md",
            "\n".join(parts).strip() + "\n",
            "brand",
            row["display_name"],
            brand_id=row["brand_id"],
            tier=row["tier"],
            domain=row["domain_slug"],
        )

    def export_brands(self, rows: list[sqlite3.Row]) -> None:
        for row in rows:
            if row["tier"] == "D_directory_only":
                continue
            self.export_brand(row)

    def export_log(self, rows: list[sqlite3.Row]) -> None:
        body = "\n".join(
            [
                frontmatter({"type": "log", "updated": now_iso()}),
                "# Log",
                "",
                f"- {now_iso()}: exported {sum(1 for r in rows if r['tier'] != 'D_directory_only')} brand wiki pages from SQLite.",
                "- Internal PDF evidence remains in SQLite tables and is not exported as public copy.",
            ]
        )
        self.write("log.md", body + "\n", "log", "Log")

    def run(self) -> None:
        self.export_agents()
        rows = self.brand_rows()
        self.export_index(rows)
        self.export_domains()
        self.export_brands(rows)
        self.export_log(rows)
        self.rebuild_search()
        print("wiki_pages", self.conn.execute("SELECT COUNT(*) FROM wiki_pages").fetchone()[0])
        print("wiki_search_fts", self.conn.execute("SELECT COUNT(*) FROM wiki_search_fts").fetchone()[0])


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Export magazine-ready SQLite data into an LLM Wiki and searchable wiki FTS.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--wiki-dir", type=Path, default=WIKI_DIR)
    args = parser.parse_args()
    WikiExporter(args.db, args.wiki_dir).run()


if __name__ == "__main__":
    main()
