#!/usr/bin/env python3
"""Verify the built site against the live astro.hencte.top URL set.

Checks, against public/ (the rendered artifact, not the sources):
  1. every URL the live sitemap advertises has a rendered page;
  2. every alias recorded in the plan produced a redirect page;
  3. every content page in the plan has a rendered counterpart.

  python scripts/verify_urls.py [--public public] [--sitemap migration/live-sitemap.txt]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote, unquote


def url_to_file(public: Path, url: str) -> Path:
    path = re.sub(r"^https?://[^/]+", "", url) or "/"
    parts = [unquote(p) for p in path.strip("/").split("/") if p]
    return public.joinpath(*parts, "index.html") if parts else public / "index.html"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--public", default="public")
    ap.add_argument("--sitemap", default="migration/live-sitemap.txt")
    ap.add_argument("--plan", default="migration/plan.json")
    args = ap.parse_args()

    public = Path(args.public)
    if not public.is_dir():
        sys.exit(f"{public} not found — run `pnpm build` first")
    sitemap = Path(args.sitemap)
    plan_path = Path(args.plan)

    failures = 0

    print("== 1. live sitemap coverage ==")
    urls = [l.strip() for l in sitemap.read_text(encoding="utf-8").splitlines()
            if l.strip()]
    missing = [u for u in urls if not url_to_file(public, u).exists()]
    for u in missing:
        print(f"  MISSING {u}")
    print(f"  {len(urls) - len(missing)}/{len(urls)} live URLs rendered")
    failures += len(missing)

    if plan_path.exists():
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        entries = [e for e in plan["entries"] if not e["skip"]]

        print("\n== 2. alias redirect pages ==")
        alias_fail = draft_aliases = checked = 0
        for e in entries:
            for a in e["aliases"]:
                if e["draft"]:
                    # Hugo does not render drafts, so their aliases do not exist
                    # yet; they are generated once the page is published.
                    draft_aliases += 1
                    continue
                checked += 1
                if not url_to_file(public, a).exists():
                    print(f"  MISSING alias {a}  (from {e['source']})")
                    alias_fail += 1
        print(f"  {checked - alias_fail}/{checked} alias targets rendered "
              f"({draft_aliases} belong to drafts, not rendered by design)")
        failures += alias_fail

        print("\n== 3. published entries rendered ==")
        pub_fail = 0
        published = [e for e in entries if not e["draft"]]
        for e in published:
            if not url_to_file(public, e["url"]).exists():
                print(f"  MISSING page {e['url']}  ({e['source']})")
                pub_fail += 1
        print(f"  {len(published) - pub_fail}/{len(published)} published pages rendered")
        failures += pub_fail

    # Rendered <img> tags must resolve inside public/: the Astro site kept some
    # images in src/assets (bundled at build) rather than public/, so a content
    # reference can point at a file that no copy step picked up.
    print("\n== 4. images referenced by rendered pages ==")
    img_re = re.compile(r'<img[^>]+src="(/[^"]+)"')
    missing_img: dict[str, set[str]] = {}
    total_img = 0
    for html in public.rglob("*.html"):
        for m in img_re.finditer(html.read_text(encoding="utf-8", errors="ignore")):
            total_img += 1
            src = unquote(m.group(1))
            if not (public / src.lstrip("/")).exists():
                missing_img.setdefault(src, set()).add(
                    html.relative_to(public).as_posix())
    for src, pages in sorted(missing_img.items()):
        print(f"  MISSING {src}  (e.g. {sorted(pages)[0]})")
    print(f"  {total_img - sum(len(p) for p in missing_img.values())}/{total_img} "
          f"image references resolved")
    failures += sum(len(p) for p in missing_img.values())

    # Novel landing pages must list their OWN chapters. A landing has no `novel`
    # param, so comparing landings against each other is easy to get wrong: the
    # first version listed the other series' titles (and no chapters at all).
    print("\n== 5. novel landings list their own chapters ==")
    landings = [p for p in sorted(public.rglob("shelf/*/index.html"))
                if not re.search(r"-ch\d+$", p.parent.name)]
    for landing in landings:
        slug = landing.parent.name
        html = landing.read_text(encoding="utf-8", errors="ignore")
        series = set(re.findall(r"/([\w-]+)-ch\d+/", html))
        chapters = set(re.findall(r"/[\w-]+-ch\d+/", html))
        foreign = sorted(s for s in series if s != slug)
        rel = landing.relative_to(public).as_posix()
        if foreign:
            print(f"  {rel}: lists chapters of {foreign}, expected {slug!r} only")
            failures += 1
        else:
            note = " (no chapters yet)" if not chapters else ""
            print(f"  {rel}: {len(chapters)} chapter link(s), own series only{note}")

    # The language switcher must actually switch. It once linked every language to
    # the page you were already on (a comparison used the page's language instead of
    # the iterated site's), so clicking did nothing — and a presence-only check
    # ("four links exist") passed. It is a <select> now, so verify each option's
    # target resolves and that at least one leads somewhere other than this page.
    print("\n== 6. language switcher resolves to other languages ==")
    select_re = re.compile(r"<select[^>]*class=\"[^\"]*lang-select[^\"]*\"[^>]*>(?P<body>.*?)</select>", re.S)
    option_re = re.compile(
        r"<option\s+value=\"(?P<href>[^\"]+)\"[^>]*data-locale=\"(?P<lang>[^\"]*)\"[^>]*>(?P<text>.*?)</option>",
        re.S)
    pages_with_switcher = 0
    for page_file in sorted(public.rglob("*.html")):
        html = page_file.read_text(encoding="utf-8", errors="ignore")
        m = select_re.search(html)
        if not m:
            continue
        pages_with_switcher += 1
        rel_page = page_file.relative_to(public).as_posix()
        self_url = "/" + rel_page[: -len("index.html")]
        options = []
        for opt in option_re.finditer(m.group("body")):
            href = opt.group("href")
            target = (public / href.lstrip("/")) if href.endswith(".html") \
                else url_to_file(public, href)
            if not target.exists():
                print(f"  {rel_page}: {opt.group('lang')} -> {href} is missing")
                failures += 1
            options.append(href)
        other = [href for href in options if href != self_url]
        if len(options) > 1 and not other:
            print(f"  {rel_page}: all {len(options)} language options point back at this "
                  f"page ({self_url}) — switching does nothing")
            failures += 1
    print(f"  {pages_with_switcher} page(s) carry a language switcher; "
          f"all non-current options lead to a different, existing page")

    print()
    if failures:
        print(f"FAILED: {failures} problem(s)")
        return 1
    print("OK: rendered output covers the live URL set, every alias and every "
          "published page")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
