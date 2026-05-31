from __future__ import annotations

import argparse
import hashlib
import html
import mimetypes
import re
import sqlite3
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"
IMAGE_DIR = ROOT / "images"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)


@dataclass(frozen=True)
class ListItem:
    source: str
    external_id: str
    url: str
    title: str
    summary: str | None = None
    thumbnail_url: str | None = None
    thumbnail_alt: str | None = None
    source_name: str | None = None
    tags: str | None = None


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def absolute_url(base: str, url: str | None) -> str | None:
    if not url:
        return None
    url = html.unescape(url).strip()
    if url.startswith("//"):
        return "https:" + url
    return urljoin(base, url)


def normalize_thumb_url(url: str | None) -> str | None:
    if not url:
        return None
    url = absolute_url("https://example.com", url)
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    fname = qs.get("fname", [None])[0]
    src = qs.get("src", [None])[0]
    if fname:
        return absolute_url("https://example.com", unquote(fname))
    if src:
        return absolute_url("https://example.com", unquote(src).strip('"'))
    return url


def image_extension(response: requests.Response, url: str) -> str:
    content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
    ext = mimetypes.guess_extension(content_type) if content_type else None
    if ext:
        return ".jpg" if ext == ".jpe" else ext
    path_ext = Path(urlparse(url).path).suffix.lower()
    return path_ext if path_ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"} else ".bin"


class Scraper:
    def __init__(self, db_path: Path, image_dir: Path, delay: float) -> None:
        self.db_path = db_path
        self.image_dir = image_dir
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"})
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.image_dir.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.init_db()

    def init_db(self) -> None:
        self.conn.executescript(
            """
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                external_id TEXT NOT NULL,
                title TEXT NOT NULL,
                subtitle TEXT,
                summary TEXT,
                body_text TEXT,
                detail_url TEXT NOT NULL,
                list_url TEXT,
                source_name TEXT,
                tags TEXT,
                provider TEXT,
                published_at TEXT,
                modified_at TEXT,
                raw_html TEXT,
                scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source, external_id)
            );

            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
                image_order INTEGER NOT NULL,
                kind TEXT NOT NULL,
                remote_url TEXT NOT NULL,
                normalized_url TEXT,
                local_path TEXT,
                alt TEXT,
                width INTEGER,
                height INTEGER,
                content_type TEXT,
                bytes INTEGER,
                downloaded_at TEXT,
                UNIQUE(entry_id, kind, remote_url)
            );

            CREATE INDEX IF NOT EXISTS idx_entries_source ON entries(source);
            CREATE INDEX IF NOT EXISTS idx_images_entry ON images(entry_id);
            """
        )
        self.conn.commit()

    def get(self, url: str) -> str:
        response = self.session.get(url, timeout=25)
        response.raise_for_status()
        response.encoding = response.apparent_encoding or "utf-8"
        time.sleep(self.delay)
        return response.text

    def download_image(self, source: str, entry_id: int, order: int, kind: str, remote_url: str) -> tuple[str | None, str | None, int | None]:
        normalized = normalize_thumb_url(remote_url) or remote_url
        try:
            response = self.session.get(normalized, timeout=30)
            response.raise_for_status()
        except requests.RequestException:
            return None, None, None

        ext = image_extension(response, normalized)
        digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:14]
        target_dir = self.image_dir / source
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"{entry_id:04d}_{order:03d}_{kind}_{digest}{ext}"
        if not target.exists():
            target.write_bytes(response.content)
        return str(target.relative_to(ROOT)), response.headers.get("Content-Type"), len(response.content)

    def upsert_entry(self, item: ListItem, detail: dict[str, str | None]) -> int:
        self.conn.execute(
            """
            INSERT INTO entries (
                source, external_id, title, subtitle, summary, body_text, detail_url, list_url,
                source_name, tags, provider, published_at, modified_at, raw_html, scraped_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(source, external_id) DO UPDATE SET
                title = excluded.title,
                subtitle = excluded.subtitle,
                summary = excluded.summary,
                body_text = excluded.body_text,
                detail_url = excluded.detail_url,
                list_url = excluded.list_url,
                source_name = excluded.source_name,
                tags = excluded.tags,
                provider = excluded.provider,
                published_at = excluded.published_at,
                modified_at = excluded.modified_at,
                raw_html = excluded.raw_html,
                scraped_at = CURRENT_TIMESTAMP
            """,
            (
                item.source,
                item.external_id,
                detail.get("title") or item.title,
                detail.get("subtitle"),
                detail.get("summary") or item.summary,
                detail.get("body_text"),
                item.url,
                None,
                item.source_name,
                detail.get("tags") or item.tags,
                detail.get("provider"),
                detail.get("published_at"),
                detail.get("modified_at"),
                detail.get("raw_html"),
            ),
        )
        row = self.conn.execute(
            "SELECT id FROM entries WHERE source = ? AND external_id = ?",
            (item.source, item.external_id),
        ).fetchone()
        self.conn.commit()
        return int(row["id"])

    def save_images(self, entry_id: int, source: str, images: Iterable[dict[str, str | int | None]]) -> None:
        seen: set[str] = set()
        for order, image in enumerate(images, start=1):
            remote_url = str(image.get("remote_url") or "")
            if not remote_url or remote_url in seen:
                continue
            seen.add(remote_url)
            kind = str(image.get("kind") or "content")
            local_path, content_type, size = self.download_image(source, entry_id, order, kind, remote_url)
            self.conn.execute(
                """
                INSERT INTO images (
                    entry_id, image_order, kind, remote_url, normalized_url, local_path,
                    alt, width, height, content_type, bytes, downloaded_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END)
                ON CONFLICT(entry_id, kind, remote_url) DO UPDATE SET
                    image_order = excluded.image_order,
                    normalized_url = excluded.normalized_url,
                    local_path = excluded.local_path,
                    alt = excluded.alt,
                    width = excluded.width,
                    height = excluded.height,
                    content_type = excluded.content_type,
                    bytes = excluded.bytes,
                    downloaded_at = excluded.downloaded_at
                """,
                (
                    entry_id,
                    order,
                    kind,
                    remote_url,
                    normalize_thumb_url(remote_url),
                    local_path,
                    image.get("alt"),
                    image.get("width"),
                    image.get("height"),
                    content_type,
                    size,
                    local_path,
                ),
            )
        self.conn.commit()

    def scrape_naver_list(self, limit: int | None = None) -> list[ListItem]:
        base = "https://terms.naver.com/list.naver?cid=43168&categoryId=43168"
        items: list[ListItem] = []
        page = 1
        while True:
            url = base if page == 1 else f"{base}&page={page}"
            soup = BeautifulSoup(self.get(url), "html.parser")
            page_items = []
            for li in soup.select("li.view_list_item"):
                link = li.select_one(".info_area strong.title a[href*='entry.naver']")
                if not link:
                    continue
                detail_url = absolute_url("https://terms.naver.com", link.get("href")) or ""
                doc_id = parse_qs(urlparse(detail_url).query).get("docId", [""])[0]
                img = li.select_one("img")
                page_items.append(
                    ListItem(
                        source="naver",
                        external_id=doc_id,
                        url=detail_url,
                        title=clean_text(link.get_text(" ")),
                        thumbnail_url=absolute_url("https://terms.naver.com", img.get("data-src") or img.get("src")) if img else None,
                        thumbnail_alt=img.get("alt") if img else None,
                        source_name="세계 브랜드 백과",
                    )
                )
            items.extend(page_items)
            if limit and len(items) >= limit:
                return items[:limit]
            next_page = soup.select_one(f"#paginate a[href*='page={page + 1}']")
            if not next_page or not page_items:
                break
            page += 1
        return items

    def scrape_naver_detail(self, item: ListItem) -> tuple[dict[str, str | None], list[dict[str, str | int | None]]]:
        raw_html = self.get(item.url)
        soup = BeautifulSoup(raw_html, "html.parser")
        title = clean_text((soup.select_one("h2.headword") or soup.select_one("meta[property='og:title']")).get_text(" ") if soup.select_one("h2.headword") else None)
        if not title:
            meta_title = soup.select_one("meta[property='og:title']")
            title = clean_text(meta_title.get("content") if meta_title else item.title)
        summary_meta = soup.select_one("meta[property='og:description']")
        body = soup.select_one("#size_ct") or soup.select_one(".section_wrap")
        for selector in [".u_likeit_module", ".tmp_source_area", "script", "style"]:
            for node in body.select(selector) if body else []:
                node.decompose()
        body_text = clean_text(body.get_text("\n")) if body else None
        provider = clean_text(soup.select_one(".tmp_source_area").get_text(" ")) if soup.select_one(".tmp_source_area") else None
        images = []
        og_image = soup.select_one("meta[property='og:image']")
        if og_image and og_image.get("content"):
            images.append({"kind": "og", "remote_url": absolute_url(item.url, og_image.get("content")), "alt": title})
        if item.thumbnail_url:
            images.append({"kind": "thumbnail", "remote_url": item.thumbnail_url, "alt": item.thumbnail_alt})
        if body:
            for img in body.select("img"):
                src = img.get("data-src") or img.get("src")
                if src:
                    images.append(
                        {
                            "kind": "content",
                            "remote_url": absolute_url(item.url, src),
                            "alt": img.get("alt"),
                            "width": int(img.get("width")) if str(img.get("width", "")).isdigit() else None,
                            "height": int(img.get("height")) if str(img.get("height", "")).isdigit() else None,
                        }
                    )
        return (
            {
                "title": title,
                "subtitle": clean_text(soup.select_one(".headword_title .word").get_text(" ")) if soup.select_one(".headword_title .word") else None,
                "summary": clean_text(summary_meta.get("content")) if summary_meta else item.summary,
                "body_text": body_text,
                "provider": provider,
                "raw_html": raw_html,
            },
            images,
        )

    def scrape_daum_list(self, limit: int | None = None) -> list[ListItem]:
        base = "https://100.daum.net/series/9/list"
        items: list[ListItem] = []
        page = 1
        while True:
            url = base if page == 1 else f"{base}?page={page}"
            soup = BeautifulSoup(self.get(url), "html.parser")
            page_items = []
            for li in soup.select("ul.list_register > li"):
                link = li.select_one("a.link_register[href*='/encyclopedia/view/']")
                if not link:
                    continue
                detail_url = absolute_url("https://100.daum.net", link.get("href")) or ""
                external_id = detail_url.rstrip("/").split("/")[-1]
                img = li.select_one("a.thumb_register img")
                tags = ", ".join(clean_text(a.get_text(" ")) for a in li.select(".wrap_source a.link_tag"))
                source_link = li.select_one(".wrap_source a.link_source")
                page_items.append(
                    ListItem(
                        source="daum",
                        external_id=external_id,
                        url=detail_url,
                        title=clean_text(link.get_text(" ")),
                        summary=clean_text(li.select_one(".desc_register").get_text(" ")) if li.select_one(".desc_register") else None,
                        thumbnail_url=absolute_url("https://100.daum.net", img.get("src")) if img else None,
                        thumbnail_alt=img.get("alt") if img else None,
                        source_name=clean_text(source_link.get_text(" ")) if source_link else "브랜드뮤지엄101",
                        tags=tags or None,
                    )
                )
            items.extend(page_items)
            if limit and len(items) >= limit:
                return items[:limit]
            next_page = soup.select_one(f"a.link_page[href*='page={page + 1}'], a.btn_next[href*='page={page + 1}']")
            if not next_page or not page_items:
                break
            page += 1
        return items

    def scrape_daum_detail(self, item: ListItem) -> tuple[dict[str, str | None], list[dict[str, str | int | None]]]:
        raw_html = self.get(item.url)
        soup = BeautifulSoup(raw_html, "html.parser")
        title = clean_text(soup.select_one("h3.tit_desc").get_text(" ")) if soup.select_one("h3.tit_desc") else item.title
        subtitle = clean_text(soup.select_one(".desc_filed").get_text(" ")) if soup.select_one(".desc_filed") else None
        summary = clean_text(soup.select_one(".desc_summary").get_text(" ")) if soup.select_one(".desc_summary") else item.summary
        body = soup.select_one(".info_details")
        for selector in ["script", "style", ".wrap_source", ".wrap_episode"]:
            for node in body.select(selector) if body else []:
                node.decompose()
        body_text = clean_text(body.get_text("\n")) if body else None
        tags = ", ".join(clean_text(a.get_text(" ")) for a in soup.select("#tagInfo a.link_tag")) or item.tags
        provider_meta = soup.select_one("meta[name='article:media_name']")
        provider = clean_text(provider_meta.get("content")) if provider_meta else item.source_name
        images = []
        og_image = soup.select_one("meta[property='og:image']")
        if og_image and og_image.get("content"):
            images.append({"kind": "og", "remote_url": absolute_url(item.url, og_image.get("content")), "alt": title})
        if item.thumbnail_url:
            images.append({"kind": "thumbnail", "remote_url": item.thumbnail_url, "alt": item.thumbnail_alt})
        if body:
            for img in body.select("img"):
                src = img.get("src")
                if src:
                    images.append(
                        {
                            "kind": "content",
                            "remote_url": absolute_url(item.url, src),
                            "alt": img.get("alt"),
                            "width": int(img.get("width")) if str(img.get("width", "")).isdigit() else None,
                            "height": int(img.get("height")) if str(img.get("height", "")).isdigit() else None,
                        }
                    )
        return (
            {
                "title": title,
                "subtitle": subtitle,
                "summary": summary,
                "body_text": body_text,
                "tags": tags,
                "provider": provider,
                "published_at": (soup.select_one("meta[property='article:published_time']") or {}).get("content"),
                "modified_at": (soup.select_one("meta[property='article:modified_time']") or {}).get("content"),
                "raw_html": raw_html,
            },
            images,
        )

    def run(self, sources: list[str], limit: int | None = None) -> None:
        plan = []
        if "naver" in sources:
            plan.extend(self.scrape_naver_list(limit))
        if "daum" in sources:
            plan.extend(self.scrape_daum_list(limit))

        print(f"Found {len(plan)} entries")
        for index, item in enumerate(plan, start=1):
            print(f"[{index}/{len(plan)}] {item.source} {item.external_id} {item.title}")
            try:
                if item.source == "naver":
                    detail, images = self.scrape_naver_detail(item)
                else:
                    detail, images = self.scrape_daum_detail(item)
                entry_id = self.upsert_entry(item, detail)
                self.save_images(entry_id, item.source, images)
            except Exception as exc:
                print(f"  ERROR: {exc}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Scrape Naver Terms and Daum 100 brand encyclopedia data into SQLite.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--images", type=Path, default=IMAGE_DIR)
    parser.add_argument("--source", choices=["all", "naver", "daum"], default="all")
    parser.add_argument("--limit", type=int, default=None, help="Limit entries per source for testing.")
    parser.add_argument("--delay", type=float, default=0.25)
    args = parser.parse_args()

    sources = ["naver", "daum"] if args.source == "all" else [args.source]
    scraper = Scraper(args.db, args.images, args.delay)
    scraper.run(sources=sources, limit=args.limit)


if __name__ == "__main__":
    main()
