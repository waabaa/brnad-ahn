from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Search the LLM Wiki with FTS plus Korean substring fallback.")
    parser.add_argument("query")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    rows = []
    try:
        rows = conn.execute(
            """
            SELECT page_path, title, tier, snippet(wiki_search_fts, 5, '[', ']', '...', 24) AS snippet, bm25(wiki_search_fts) AS score
            FROM wiki_search_fts
            WHERE wiki_search_fts MATCH ?
            ORDER BY score
            LIMIT ?
            """,
            (args.query, args.limit),
        ).fetchall()
    except sqlite3.OperationalError:
        rows = []

    seen = {row["page_path"] for row in rows}
    fallback = conn.execute(
        """
        SELECT page_path, title, COALESCE(tier, '') AS tier, body
        FROM wiki_pages
        WHERE body LIKE ? OR title LIKE ?
        ORDER BY
            CASE tier WHEN 'A_magazine_ready' THEN 0 WHEN 'B_editorial_review' THEN 1 WHEN 'C_source_backed' THEN 2 ELSE 3 END,
            title
        LIMIT ?
        """,
        (f"%{args.query}%", f"%{args.query}%", args.limit),
    ).fetchall()

    merged = list(rows)
    for row in fallback:
        if row["page_path"] in seen:
            continue
        body = row["body"]
        idx = body.find(args.query)
        snippet = body[max(0, idx - 70) : idx + 140].replace("\n", " ") if idx >= 0 else body[:180].replace("\n", " ")
        merged.append({"page_path": row["page_path"], "title": row["title"], "tier": row["tier"], "snippet": snippet})
        seen.add(row["page_path"])
        if len(merged) >= args.limit:
            break

    for row in merged[: args.limit]:
        print(f"- {row['title']} ({row['tier']})")
        print(f"  {row['page_path']}")
        print(f"  {row['snippet']}")


if __name__ == "__main__":
    main()
