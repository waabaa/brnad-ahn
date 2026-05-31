from __future__ import annotations

import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS brand_content_quality (
            brand_id INTEGER PRIMARY KEY REFERENCES brand_entities(id) ON DELETE CASCADE,
            tier TEXT NOT NULL,
            source_entry_count INTEGER NOT NULL DEFAULT 0,
            pdf_page_count INTEGER NOT NULL DEFAULT 0,
            insight_candidate_count INTEGER NOT NULL DEFAULT 0,
            approved_insight_count INTEGER NOT NULL DEFAULT 0,
            section_total_chars INTEGER NOT NULL DEFAULT 0,
            filled_section_count INTEGER NOT NULL DEFAULT 0,
            media_asset_count INTEGER NOT NULL DEFAULT 0,
            recommendation TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE VIEW IF NOT EXISTS v_magazine_ready_brands AS
        SELECT
            p.brand_id,
            p.slug,
            p.display_name,
            p.english_name,
            d.label_ko AS domain_ko,
            q.tier,
            q.source_entry_count,
            q.pdf_page_count,
            q.insight_candidate_count,
            q.approved_insight_count,
            q.section_total_chars,
            q.filled_section_count,
            q.media_asset_count,
            q.recommendation,
            p.hero_image_path,
            p.logo_image_path
        FROM brand_magazine_profiles p
        JOIN brand_content_quality q ON q.brand_id = p.brand_id
        JOIN magazine_domains d ON d.slug = p.domain_slug;
        """
    )

    brands = conn.execute("SELECT id FROM brand_entities").fetchall()
    for row in brands:
        brand_id = int(row["id"])
        source_entry_count = int(
            conn.execute("SELECT COUNT(*) FROM brand_entry_map WHERE brand_id = ?", (brand_id,)).fetchone()[0]
        )
        pdf_page_count = int(
            conn.execute(
                """
                SELECT COUNT(*)
                FROM pdf_pages p
                WHERE EXISTS (
                  SELECT 1 FROM json_each(p.matched_brand_ids)
                  WHERE json_each.value = ?
                )
                """,
                (brand_id,),
            ).fetchone()[0]
        )
        insight_candidate_count = int(
            conn.execute("SELECT COUNT(*) FROM brand_insights WHERE brand_id = ?", (brand_id,)).fetchone()[0]
        )
        approved_insight_count = int(
            conn.execute(
                "SELECT COUNT(*) FROM brand_insights WHERE brand_id = ? AND editorial_status='approved'",
                (brand_id,),
            ).fetchone()[0]
        )
        section_stats = conn.execute(
            """
            SELECT
              COALESCE(SUM(length(body)), 0) AS total_chars,
              COUNT(CASE WHEN body != '추가 편집이 필요한 섹션입니다.' THEN 1 END) AS filled
            FROM magazine_sections
            WHERE brand_id = ?
            """,
            (brand_id,),
        ).fetchone()
        media_asset_count = int(
            conn.execute("SELECT COUNT(*) FROM brand_media_assets WHERE brand_id = ?", (brand_id,)).fetchone()[0]
        )

        section_total_chars = int(section_stats["total_chars"] or 0)
        filled_section_count = int(section_stats["filled"] or 0)

        if source_entry_count >= 2 and approved_insight_count >= 1 and section_total_chars >= 1200:
            tier = "A_magazine_ready"
            recommendation = "상세 브랜드 매거진 공개 가능. 관점 섹션은 승인 문장 기반으로 사용."
        elif source_entry_count >= 1 and (pdf_page_count >= 5 or insight_candidate_count >= 3):
            tier = "B_editorial_review"
            recommendation = "원문과 PDF 근거는 충분하나 관점 문장 검수/승인이 더 필요."
        elif source_entry_count >= 1:
            tier = "C_source_backed"
            recommendation = "기본 브랜드 사전 페이지 가능. 매거진형으로 쓰려면 PDF/관점 보강 필요."
        else:
            tier = "D_directory_only"
            recommendation = "검색/디렉터리 카드 수준. 상세 매거진 공개 대상에서 제외 권장."

        conn.execute(
            """
            INSERT INTO brand_content_quality (
                brand_id, tier, source_entry_count, pdf_page_count, insight_candidate_count,
                approved_insight_count, section_total_chars, filled_section_count,
                media_asset_count, recommendation, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(brand_id) DO UPDATE SET
                tier = excluded.tier,
                source_entry_count = excluded.source_entry_count,
                pdf_page_count = excluded.pdf_page_count,
                insight_candidate_count = excluded.insight_candidate_count,
                approved_insight_count = excluded.approved_insight_count,
                section_total_chars = excluded.section_total_chars,
                filled_section_count = excluded.filled_section_count,
                media_asset_count = excluded.media_asset_count,
                recommendation = excluded.recommendation,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                brand_id,
                tier,
                source_entry_count,
                pdf_page_count,
                insight_candidate_count,
                approved_insight_count,
                section_total_chars,
                filled_section_count,
                media_asset_count,
                recommendation,
            ),
        )

    conn.commit()
    for r in conn.execute("SELECT tier, COUNT(*) FROM brand_content_quality GROUP BY tier ORDER BY tier"):
        print(r[0], r[1])


if __name__ == "__main__":
    main()
