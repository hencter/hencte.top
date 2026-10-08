"""Import 《我被AI反向驯化了》 published chapters from the Obsidian vault.

Source of truth (outside the repo):
  <VAULT>/20_Areas/创作与内容/我被AI反向驯化了/02-正文/发布版/chapterNNN.md

Those files use Obsidian YAML front matter (`type: reference`, `session`, `datetime`,
`tags`) and carry the chapter title as a `# 第N章 · …` heading in the body. The site
uses TOML front matter and keeps the title in `title`, so this script maps:

  vault YAML  ->  site TOML
  -------------   ------------------------------------------------
  (filename)      chapter = N, weight = N    (ordering for the shelf)
  (body `# …`)    title = "第N章 · …"         (heading removed from the body)
  —               novel = 'ai-counter-taming'
  —               draft = false, [sitemap] disable = true
  —               aliases = ['/novel/<slug>/']  for N <= 4 only (legacy Astro URLs)

Idempotent: re-running overwrites the same files, so it is safe after the vault
changes. Run:  python scripts/import_novel.py [--check]
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

NOVEL_SLUG = "ai-counter-taming"
DEST_DIR = Path("content/shelf")
DEFAULT_SOURCE = Path(
    os.environ.get(
        "NOVEL_VAULT",
        r"C:\Users\hencter\Nutstore\1\Note\20_Areas\创作与内容\我被AI反向驯化了\02-正文\发布版",
    )
)
CHAPTER_RE = re.compile(r"^chapter(\d{1,3})\.md$")
# Chapters 1-4 were published by the Astro site under /novel/<slug>/; later ones are
# new here, so they get no legacy alias.
LEGACY_ALIAS_MAX = 4


def toml_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def parse_chapter(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    body = text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            body = text[end + 4 :]
    body = body.lstrip("\n")
    title = ""
    match = re.match(r"#\s+(.+?)\s*\n", body)
    if match:
        title = match.group(1).strip()
        body = body[match.end() :]
    return title, body.strip("\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(DEFAULT_SOURCE))
    parser.add_argument("--check", action="store_true", help="report without writing")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.is_dir():
        sys.exit(f"source not found: {source}")

    chapters = []
    for path in source.iterdir():
        match = CHAPTER_RE.match(path.name)
        if match:
            chapters.append((int(match.group(1)), path))
    if not chapters:
        sys.exit(f"no chapterNNN.md files in {source}")
    chapters.sort()

    written = 0
    for number, path in chapters:
        title, body = parse_chapter(path)
        if not title or not body:
            print(f"  ! chapter {number}: missing title or body, skipped")
            continue
        slug = f"{NOVEL_SLUG}-ch{number:02d}"
        front = ["+++"]
        if number <= LEGACY_ALIAS_MAX:
            front.append(f"aliases = ['/novel/{slug}/']")
        front += [
            f"chapter = {number}",
            "draft = false",
            f"novel = {toml_string(NOVEL_SLUG)}",
            f"title = {toml_string(title)}",
            f"weight = {number}",
            "",
            "[sitemap]",
            "disable = true",
            "+++",
        ]
        out = "\n".join(front) + "\n" + body + "\n"
        target = DEST_DIR / f"{slug}.md"
        if args.check:
            print(f"  {target.as_posix():52} {len(body):6} chars  {title}")
        else:
            target.write_text(out, encoding="utf-8")
        written += 1

    verb = "would write" if args.check else "wrote"
    print(f"import_novel: {verb} {written} chapter(s) -> {DEST_DIR.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
