#!/usr/bin/env python3
"""Migrate content from the Astro site into this Hugo project.

Source: github.com/hencter/astro.hencte.top (src/content/**, src/pages/pages.md).
Routes are reproduced exactly as the Astro site serves them, and every legacy
Hugo URL recorded in the Astro front matter (`legacyPath`) is emitted as a Hugo
alias so old links keep working.

  src/content/blog/**             -> content/<lang>/<slug or repo id>.md
                                     (section index pages -> <id>/_index.md)
  src/content/{zh,en}/<page>.md   -> content/<lang>/<page>.md
  src/content/novel/{zh-CN,en}/** -> content/<lang>/shelf/**.md
  src/pages/pages.md              -> content/pages.md

Brand pages (home/about/projects/links/blog/obsidian) keep their content in
front matter: the Astro site renders it with components, the body is a
placeholder. That structured data is carried over unchanged as page params.

Requires PyYAML (`pip install pyyaml`).

  python scripts/migrate_astro.py --source <astro-repo>            # dry run
  python scripts/migrate_astro.py --source <astro-repo> --apply    # write files
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML is required: pip install pyyaml")

FM_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.S)
SHORTCODE_RE = re.compile(r"\{\{([<%])(.*?)([>%])\}\}", re.S)
WIKI_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
EMBED_RE = re.compile(r"!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]")
FENCE_RE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE_RE = re.compile(r"`+[^`]*`+")
MARK_RE = re.compile(r"==([^=\n]+)==")
# The Astro connect pages keep a one-line authoring note in the body ("Friend link
# page content is maintained here.") because their real content lives in front
# matter and components. Hugo renders the body, so those notes leaked onto the
# live pages; bodies matching this are dropped.
PLACEHOLDER_BODY_RE = re.compile(
    r"从这里维护|内容用于驱动首页展示|is maintained here|drives the English home page")
PLACEHOLDER_MAX_LEN = 80
CALLOUT_RE = re.compile(r"^>\s*\[!(\w+)\]\s*(.*)$", re.M)
RAW_HTML_RE = re.compile(r"</?(?:div|span|details|summary|figure|figcaption|img|mark|kbd|br|iframe|video|table|sup|sub)\b", re.I)

# Front-matter keys that belong to the Astro collection schema / routing and
# must not be carried into Hugo front matter. Everything else is kept verbatim:
# the brand pages drive their layout from these tables, so dropping an unknown
# key would silently delete page content.
DROP_KEYS = {
    "page",         # routing key, encoded by the target file path
    "locale",       # Hugo derives the language from contentDir
    "section",      # Hugo derives the section from the path
    "slug",         # the target file path already encodes the public route
    "legacyPath",   # converted to `aliases`
    "aliases",      # merged and normalised separately
    "order",        # superseded by `weight`
}

# Astro collection entry -> public slug for novels (novel-helpers.ts entrySlug).
CH_RE = re.compile(r"^ch(\d+)$", re.I)
INDEX_IDS = {"novel", "zh-cn/novel", "en/novel"}
# blog-index.ts BLOG_ROUTE_SECTIONS: only these sections are routed by
# pages/[...slug].astro. Entries in other sections have no public URL.
BLOG_ROUTE_SECTIONS = {"log", "tech", "ancient", "posts"}

# Public URL and target path of each connect page. The `page` value is the key
# used in the Astro front matter (lib/i18n.ts ConnectPage plus obsidian-plugins,
# which src/pages/obsidian/plugins.astro serves at /obsidian/plugins/).
CONNECT_PAGES = {
    "zh": {
        "home": ("_index.md", "/"),
        "about": ("about.md", "/about/"),
        "projects": ("projects.md", "/projects/"),
        "blog": ("blog.md", "/blog/"),
        "links": ("links.md", "/links/"),
        "obsidian-plugins": ("obsidian/plugins.md", "/obsidian/plugins/"),
    },
    "en": {
        "home": ("_index.md", "/en/"),
        "about": ("about.md", "/en/about/"),
        "projects": ("projects.md", "/en/projects/"),
        "blog": ("blog.md", "/en/blog/"),
        "links": ("links.md", "/en/links/"),
        "obsidian-plugins": ("obsidian/plugins.md", "/en/obsidian/plugins/"),
    },
}

# Old Hugo files whose Astro counterpart records a *different* legacyPath.
# Verified by comparing title/date/body, so the old copy is a duplicate of the
# migrated page and its URL becomes an alias. Maps old content path -> astro
# blog source (relative to src/content/blog).
SUPERSEDE_OVERRIDES = {
    "tech/usage.md": "tech/hugo/usage.md",
    "tech/git.md": "tech/vsc/git.md",
    "tech/keyboard-shortcuts.md": "tech/editor/keyboard-shortcuts.md",
    "tech/lazy-nvim.md": "tech/editor/lazy-nvim.md",
}
# Old Hugo files whose public URL is now served by a connect page.
SUPERSEDE_NO_ALIAS = ["_index.md", "about/_index.md"]
# Aliases that the recorded legacyPath cannot express (wrong metadata in Astro).
EXTRA_ALIASES = {astro: [f"/{old[:-3]}/".replace("//", "/")]
                 for old, astro in SUPERSEDE_OVERRIDES.items()}
# Curated friend-link avatars. The Astro data points EOGEE at a 1056x211 wordmark
# (unreadable when cropped into the 48px circular avatar) and leaves SeaWave with
# no image at all; these are the sites' own square brand images, stored under
# static/img/friends/ with names Astro's asset copy never writes.
FRIEND_AVATAR_OVERRIDES = {
    "https://eogee.com/": "/img/friends/eogee-mark.png",
    "https://seawave.top/": "/img/friends/seawave.jpg",
}
# Projects retired from the site. Applied to the featuredProjects arrays so a re-run
# of --apply does not resurrect them (those content files are regenerated wholesale).
DROP_PROJECT_KEY = re.compile(r"Hugo.*(迁移|Migration)|(迁移|Migration).*Hugo")


@dataclass
class Entry:
    kind: str                      # blog | connect | novel | page
    src: Path
    rel: str                       # path relative to its collection root (posix)
    fm: dict
    body: str
    lang: str = "zh"               # zh | en
    target: str = ""               # path relative to content/<lang>/ (posix)
    url: str = ""
    aliases: list[str] = field(default_factory=list)
    skip: str = ""                 # reason for skipping, if any

    @property
    def out_name(self) -> str:
        return f"content/{self.lang}/{self.target}"


def read_entry(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    if not m:
        return {}, text
    fm = yaml.safe_load(m.group(1)) or {}
    if not isinstance(fm, dict):
        fm = {}
    return fm, text[m.end():]


def legacy_url(legacy_path: str) -> str:
    """Old Hugo URL for a path recorded in the Astro front matter."""
    p = legacy_path.replace("\\", "/")
    if p.endswith("/_index.md"):
        p = p[: -len("_index.md")]
    elif p.endswith(".md"):
        p = p[: -3]
    return "/" + p.strip("/") + "/"


def load_entries(src: Path) -> list[Entry]:
    entries: list[Entry] = []

    # ---- blog -----------------------------------------------------------------
    blog_root = src / "src/content/blog"
    for f in sorted(blog_root.rglob("*.md")):
        rel = f.relative_to(blog_root).as_posix()
        fm, body = read_entry(f)
        eid = rel[:-3]
        section = fm.get("section") or eid.split("/")[0]
        is_index = bool(str(fm.get("legacyPath", "")).endswith("_index.md"))
        route = fm.get("slug") or eid
        target = f"{route}/_index.md" if is_index else f"{route}.md"
        e = Entry("blog", f, rel, fm, body, "zh", target,
                  f"/{route.strip('/')}/")
        if section not in BLOG_ROUTE_SECTIONS:
            # e.g. blog/about.md: unrouted, and the live /about/ page is the
            # connect entry, so this file would collide with it.
            e.skip = (f"section '{section}' is not routed (it is served by the "
                      f"connect page) — see blog-index.ts BLOG_ROUTE_SECTIONS")
        entries.append(e)

    # ---- connect pages (zh / en) ---------------------------------------------
    for lang in ("zh", "en"):
        for f in sorted((src / f"src/content/{lang}").rglob("*.md")):
            rel = f.relative_to(src / f"src/content/{lang}").as_posix()
            fm, body = read_entry(f)
            page = fm.get("page")
            mapped = CONNECT_PAGES[lang].get(page)
            if mapped:
                target, url = mapped
            else:
                target = rel
                prefix = "" if lang == "zh" else "en/"
                url = f"/{prefix}{target[:-3].rstrip('/')}/".replace("//", "/")
            entries.append(Entry("connect", f, rel, fm, body, lang, target, url))

    # ---- standalone page (src/pages/pages.md) ---------------------------------
    pages_md = src / "src/pages/pages.md"
    if pages_md.exists():
        fm, body = read_entry(pages_md)
        entries.append(Entry("page", pages_md, "pages.md", fm, body, "zh",
                             "pages.md", "/pages/"))

    # ---- novels ---------------------------------------------------------------
    novel_root = src / "src/content/novel"
    for f in sorted(novel_root.rglob("*.md")):
        rel = f.relative_to(novel_root).as_posix()
        fm, body = read_entry(f)
        parts = rel.split("/")
        locale = parts[0]
        if locale not in ("zh-CN", "en"):          # flat legacy duplicates
            entries.append(Entry("novel", f, rel, fm, body, "zh",
                                 skip="legacy flat novel file (superseded by "
                                      "the nested per-locale copy)"))
            continue
        lang = "zh" if locale == "zh-CN" else "en"
        rest = parts[1:]
        if len(rest) == 1:
            if rest[0] == "novel.md":
                target = "shelf/_index.md"
                url = "/shelf/" if lang == "zh" else "/en/shelf/"
            else:
                target = f"shelf/{rest[0]}"
                url = f"/shelf/{rest[0][:-3]}/" if lang == "zh" else f"/en/shelf/{rest[0][:-3]}/"
        else:
            novel, name = rest[0], rest[1]
            m = CH_RE.match(name[:-3])
            slug = f"{novel}-ch{int(m.group(1)):02d}" if m else (
                novel if name == "index.md" else f"{novel}/{name[:-3]}")
            target = f"shelf/{slug}.md"
            url = (f"/shelf/{slug}/" if lang == "zh" else f"/en/shelf/{slug}/")
        entries.append(Entry("novel", f, rel, fm, body, lang, target, url))

    return entries


def compute_aliases(e: Entry) -> list[str]:
    out: list[str] = []
    lp = e.fm.get("legacyPath")
    if lp:
        out.append(legacy_url(str(lp)))
    if e.kind == "blog":
        out.extend(EXTRA_ALIASES.get(e.rel, []))
    if e.kind == "novel" and e.target.startswith("shelf/"):
        # The Astro site permanently redirects its pre-rename /novel/ paths to
        # /shelf/ (see llms.txt); reproduce them as aliases.
        legacy = e.target[len("shelf/"):]
        legacy = "" if legacy == "_index.md" else (
            legacy[:-3] + "/" if legacy.endswith(".md") else legacy)
        out.append(f"/novel/{legacy}")
    for a in e.fm.get("aliases") or []:
        a = str(a).strip()
        if a:
            out.append(a)
    # Normalise: Hugo writes one file per alias, so "/x" and "/x/" would both
    # target x/index.html and trip the duplicate-target-path warning.
    seen, uniq = set(), []
    for a in out:
        path = "/" + a.strip("/") + "/"
        key = path.lower()
        if path != e.url and key not in seen:
            seen.add(key)
            uniq.append(path)
    return uniq


# --------------------------------------------------------------------------- #
# front matter -> TOML
# --------------------------------------------------------------------------- #

def toml_value(v) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, datetime.datetime):
        # PyYAML turns unquoted YAML timestamps into date/datetime objects; str()
        # would emit "2026-09-19 13:00:00+08:00", which Hugo does not parse as a
        # date. Emit ISO 8601 with the T separator instead.
        return "'" + v.isoformat() + "'"
    if isinstance(v, datetime.date):
        return "'" + v.isoformat() + "'"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        if "\n" in v:
            body = v.strip("\n")
            return '"""\n' + body + '\n"""'
        if "'" in v:
            return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'
        return "'" + v + "'"
    if isinstance(v, list):
        if all(not isinstance(i, (dict, list)) for i in v):
            return "[" + ", ".join(toml_value(i) for i in v) + "]"
        return "[" + ", ".join(toml_value(i) for i in v) + "]"
    if isinstance(v, dict):
        return "{ " + ", ".join(f"{k} = {toml_value(x)}" for k, x in v.items()) + " }"
    return "'" + str(v) + "'"


def emit_front_matter(fm: dict) -> str:
    scalars = {k: v for k, v in fm.items() if not isinstance(v, dict)}
    tables = {k: v for k, v in fm.items() if isinstance(v, dict)}
    lines = ["+++"]
    for k in sorted(scalars):
        lines.append(f"{k} = {toml_value(scalars[k])}")
    # Tables and arrays of tables must come after every scalar (a bare key below
    # the first table header would silently join that table).
    for k in sorted(tables):
        v = tables[k]
        if v is None:
            continue
        lines.append("")
        if isinstance(v, list):
            for item in v:
                lines.append(f"[[{k}]]")
                for ik in sorted(item):
                    lines.append(f"{ik} = {toml_value(item[ik])}")
                lines.append("")
            if lines[-1] == "":
                lines.pop()
        else:
            lines.append(f"[{k}]")
            for ik in sorted(v):
                lines.append(f"{ik} = {toml_value(v[ik])}")
    lines.append("+++")
    return "\n".join(lines)


def transform_body(body: str, stats: dict) -> str:
    # Iron rule: never leave an unescaped shortcode delimiter in content.
    if "{{<" in body or "{{%" in body:
        stats["shortcode_delims"] += 1
        body = SHORTCODE_RE.sub(
            lambda m: "{{" + m.group(1) + "/*" + m.group(2).rstrip() + "*/"
            + m.group(3) + "}}", body)
    if "HAHAHUGOSHORTCODE" in body:
        stats["hahahugo"] += 1
        body = body.replace("HAHAHUGOSHORTCODE", "HAHAHUGO&#xfeff;SHORTCODE")
    if "[[" in body:
        stats["wiki_links"] += 1
    if "==" in body:
        stats["highlights"] += len(MARK_RE.findall(body))
    return body


def rewrite_wiki(body: str, routes: dict[str, str], stats: dict) -> str:
    """Resolve Obsidian wiki links and embeds, never inside code.

    `[[page]]` / `[[page|alias]]` become a link when the target corresponds to a
    migrated page, and plain text otherwise (the Astro site linked every wiki
    target to /blog/<target>, which 404s for knowledge-base references).
    `![[file]]` embeds point at Obsidian vault attachments that do not exist in
    the Astro repository, so they are dropped — the same outcome as the live site.
    Fenced blocks and inline code spans are left untouched: Windows' own
    `MKLINK [[/D] | [/H] | [/J]] Link Target` must survive verbatim.
    """
    out: list[str] = []
    fence: str | None = None
    for line in body.split("\n"):
        m = FENCE_RE.match(line)
        if m:
            if fence is None:
                fence = m.group(1)
            elif line.strip().startswith(fence):
                fence = None
            out.append(line)
            continue
        if fence is not None:
            out.append(line)
            continue

        spans: list[str] = []

        def mask(mm: re.Match) -> str:
            spans.append(mm.group(0))
            return f"\x00{len(spans) - 1}\x00"

        line = INLINE_CODE_RE.sub(mask, line)

        def drop_embed(_mm: re.Match) -> str:
            stats["embeds_dropped"] += 1
            return ""

        def link(mm: re.Match) -> str:
            target = mm.group(1).strip()
            alias = (mm.group(2) or target).strip()
            route = routes.get(target.lower()) or routes.get(alias.lower())
            if route:
                stats["wiki_resolved"] += 1
                return f"[{alias}]({route})"
            stats["wiki_plain"] += 1
            return alias

        line = EMBED_RE.sub(drop_embed, line)
        line = WIKI_RE.sub(link, line)
        for i, span in enumerate(spans):
            line = line.replace(f"\x00{i}\x00", span)
        out.append(line)
    return "\n".join(out)


def build_plan(src: Path, hugo: Path) -> tuple[list[Entry], dict]:
    entries = load_entries(src)
    stats = {"shortcode_delims": 0, "hahahugo": 0, "wiki_links": 0,
             "highlights": 0, "callouts": 0, "raw_html_pages": 0,
             "mermaid_pages": 0, "math_pages": 0, "wiki_resolved": 0,
             "wiki_plain": 0, "embeds_dropped": 0, "callout_blocks": 0}

    # Route table for wiki-link resolution: file stem and title -> public URL.
    routes: dict[str, str] = {}
    for e in entries:
        if e.skip or not e.url:
            continue
        for key in (Path(e.target).stem if e.target else "",
                    str(e.fm.get("title", ""))):
            key = key.strip().lower()
            if key:
                routes.setdefault(key, e.url)

    for e in entries:
        if e.skip:
            continue
        e.aliases = compute_aliases(e)
        stats["callout_blocks"] += len(CALLOUT_RE.findall(e.body))
        if CALLOUT_RE.search(e.body):
            stats["callouts"] += 1
        if "```mermaid" in e.body:
            stats["mermaid_pages"] += 1
        if "$$" in e.body or "\\[" in e.body:
            stats["math_pages"] += 1
        if RAW_HTML_RE.search(e.body):
            stats["raw_html_pages"] += 1
        if "[[" in e.body:
            stats["wiki_links"] += 1
            e.body = rewrite_wiki(e.body, routes, stats)
        transform_body(e.body, stats)

    # Which files already in this Hugo repo are superseded by an Astro entry?
    # Paths are compared case-insensitively: git records one spelling, the
    # Astro front matter another, and Windows resolves either.
    def norm(p: str) -> str:
        return p.replace("\\", "/").lower()

    superseded: dict[str, tuple[str, Entry]] = {}

    def mark(old_abs: Path, entry: Entry) -> None:
        if old_abs.exists():
            rel = old_abs.relative_to(hugo / "content").as_posix()
            superseded[norm(rel)] = (rel, entry)

    for e in entries:
        if e.skip:
            continue
        if e.fm.get("legacyPath"):
            mark(hugo / "content" / str(e.fm["legacyPath"]).replace("\\", "/"), e)
    for old_rel, astro_rel in SUPERSEDE_OVERRIDES.items():
        match = next((e for e in entries
                      if e.kind == "blog" and e.rel == astro_rel), None)
        if match:
            mark(hugo / "content" / old_rel, match)
    for old_rel in SUPERSEDE_NO_ALIAS:
        mark(hugo / "content" / old_rel,
             Entry("connect", Path(old_rel), old_rel, {}, "", "zh", "", ""))

    # Files this repo already had *outside* the per-language dirs are the legacy
    # Hugo content. Files under content/<lang>/ are migration output and must not
    # be treated as legacy again (that is what keeps re-running the script safe).
    lang_dirs = {p.lower() for p in ("zh", "en", "tw", "hk")}
    existing = sorted(p.relative_to(hugo / "content").as_posix()
                      for p in (hugo / "content").rglob("*.md")
                      if p.relative_to(hugo / "content").parts[0].lower()
                      not in lang_dirs)
    keep = [p for p in existing if norm(p) not in superseded]

    # Asset copy plan. Two sources:
    #   1. the Astro public/ tree (static files copied verbatim by Astro);
    #   2. anything content references as /img/... that is NOT in public/ — those
    #      are Astro build-time assets (src/assets/**, bundled by astro:assets,
    #      e.g. the project webp images) and are resolved by filename.
    assets: list[tuple[str, int, Path]] = []
    pub = src / "public"
    if pub.exists():
        for f in sorted(pub.rglob("*")):
            if not f.is_file():
                continue
            rel = f.relative_to(pub).as_posix()
            if rel in {"robots.txt", "llm.txt", "llms.txt", "llms-full.txt",
                       "sitemap.xml", "rss.xml"} or rel.startswith("_astro/"):
                continue
            assets.append((rel, f.stat().st_size, f))

    refs: set[str] = set()
    for e in entries:
        # Front matter arrives here as a dict (serialise it) and the body as
        # Markdown, so cover both the JSON-style and inline forms.
        text = json.dumps(e.fm, ensure_ascii=False, default=str) + e.body
        refs.update(re.findall(r'"(/img/[^"]+)"', text))
        refs.update(re.findall(r"'(/img/[^']+)'", text))
        refs.update(re.findall(r"\((/img/[^)\s]+)\)", text))
    have = {rel for rel, _s, _f in assets}
    asset_index: dict[str, Path] = {}
    assets_root = src / "src/assets"
    if assets_root.exists():
        for f in sorted(assets_root.rglob("*")):
            if f.is_file():
                asset_index.setdefault(f.name, f)
    missing_refs: list[str] = []
    for ref in sorted(refs):
        rel = ref.lstrip("/")
        if rel in have:
            continue
        found = asset_index.get(Path(rel).name)
        if found:
            assets.append((rel, found.stat().st_size, found))
            have.add(rel)
        else:
            missing_refs.append(ref)

    return entries, {"stats": stats, "superseded": superseded, "keep": keep,
                     "assets": assets, "missing_refs": missing_refs}


def url_parity(entries: list[Entry], live: Path | None) -> dict:
    from urllib.parse import quote

    def enc(path: str) -> str:
        """Percent-encode like the live sitemap does (CJK slugs, spaces)."""
        out = quote(path, safe="/%")
        return out

    published = [e for e in entries
                 if not e.skip and not e.fm.get("draft")]
    ours = {enc(e.url) for e in published}
    report = {"ours": sorted(ours), "live": [], "missing": [], "extra": []}
    if live and live.exists():
        theirs = set()
        for line in live.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            path = re.sub(r"^https?://[^/]+", "", line) or "/"
            if not path.endswith("/"):
                path += "/"
            theirs.add(quote(path, safe="/%") if "%" not in path else path)
        report["live"] = sorted(theirs)
        report["missing"] = sorted(t for t in theirs if t not in ours)
        report["extra"] = sorted(o for o in ours if o not in theirs)
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=None,
                    help="astro.hencte.top checkout (env ASTRO_SITE_ROOT)")
    ap.add_argument("--hugo", default=".", help="this Hugo project root")
    ap.add_argument("--live-sitemap", default="migration/live-sitemap.txt")
    ap.add_argument("--plan-out", default="migration/plan.json")
    ap.add_argument("--report-out", default="migration/report.md")
    ap.add_argument("--apply", action="store_true",
                    help="write content files and assets (default: dry run)")
    args = ap.parse_args()

    import os
    src = Path(args.source or os.environ.get("ASTRO_SITE_ROOT", ""))
    if not src or not (src / "src/content").exists():
        sys.exit("--source must point at an astro.hencte.top checkout "
                 "(or set ASTRO_SITE_ROOT)")
    hugo = Path(args.hugo).resolve()

    entries, extra = build_plan(src, hugo)
    parity = url_parity(entries, Path(args.live_sitemap))

    wrote = moved = deleted = copied = 0
    if args.apply:
        for e in entries:
            if e.skip:
                continue
            dest = hugo / e.out_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            fm = {k: v for k, v in (e.fm or {}).items()
                  if k not in DROP_KEYS and v is not None}
            if e.kind == "connect" and e.fm.get("page") == "blog":
                # /blog/ is an article index in the Astro site (src/pages/blog/index.astro),
                # not a content page: give it its own Hugo type so the listing template applies.
                fm["type"] = "blog"
            if e.kind == "novel" and "chapter" in fm and "weight" not in fm:
                fm["weight"] = fm["chapter"]
            if e.kind == "novel":
                # Protect track: novels stay out of sitemap.xml, matching the
                # Astro site (and the robots.txt Disallow rules).
                fm["sitemap"] = {"disable": True}
            if e.aliases:
                fm["aliases"] = e.aliases
            # Curated friend-link avatars (see FRIEND_AVATAR_OVERRIDES).
            if isinstance(fm.get("friendLinks"), list):
                for item in fm["friendLinks"]:
                    if isinstance(item, dict) and item.get("url") in FRIEND_AVATAR_OVERRIDES:
                        item["avatar"] = FRIEND_AVATAR_OVERRIDES[item["url"]]
            # Retired projects (see DROP_PROJECT_KEY).
            if isinstance(fm.get("featuredProjects"), list):
                fm["featuredProjects"] = [
                    item for item in fm["featuredProjects"]
                    if not (isinstance(item, dict)
                            and DROP_PROJECT_KEY.search(str(item.get("title", ""))))
                ]
            # Drop the connect pages' authoring notes (see PLACEHOLDER_BODY_RE).
            if (e.kind == "connect" and len(e.body.strip()) <= PLACEHOLDER_MAX_LEN
                    and PLACEHOLDER_BODY_RE.search(e.body)):
                e.body = ""
            body = transform_body(e.body, {"shortcode_delims": 0, "hahahugo": 0,
                                           "wiki_links": 0, "highlights": 0})
            dest.write_text(emit_front_matter(fm) + body, encoding="utf-8")
            wrote += 1

        # Preserve Hugo-only content by moving it under the default language dir.
        for rel in extra["keep"]:
            old = hugo / "content" / rel
            new = hugo / "content" / rel
            if old.exists() and not new.exists():
                new.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(old), str(new))
                moved += 1
        for rel, _entry in extra["superseded"].values():
            old = hugo / "content" / rel
            if old.exists():
                old.unlink()
                deleted += 1

        for rel, _size, source in extra["assets"]:
            s = source
            d = hugo / "static" / rel
            d.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(s, d)
            copied += 1

    # ---- report --------------------------------------------------------------
    kinds: dict[str, int] = {}
    for e in entries:
        kinds[e.kind] = kinds.get(e.kind, 0) + 1
    plan = {
        "source": str(src),
        "entries": [
            {"kind": e.kind, "source": e.src.relative_to(src).as_posix(),
             "target": e.out_name, "url": e.url, "lang": e.lang,
             "draft": bool(e.fm.get("draft")), "aliases": e.aliases,
             "skip": e.skip}
            for e in entries],
        "kinds": kinds,
        "stats": extra["stats"],
        "superseded": sorted((rel, e.kind) for rel, e in
                             extra["superseded"].values()),
        "keep_in_place": extra["keep"],
        "assets": {"count": len(extra["assets"]),
                   "bytes": sum(s for _r, s, _f in extra["assets"]),
                   "missing_refs": extra["missing_refs"]},
        "parity": parity,
    }
    Path(args.plan_out).write_text(json.dumps(plan, ensure_ascii=False, indent=1),
                                   encoding="utf-8")

    md = ["# Astro -> Hugo migration plan", "",
          f"Source: `{src}`", "",
          f"Entries: {len(entries)} ({kinds})", "",
          "## Live-URL parity (published entries vs live sitemap)", "",
          f"- matched: {len(parity['ours']) - len(parity['extra'])}",
          f"- live URLs missing from the plan: {len(parity['missing'])}",
          f"- planned URLs not in the live sitemap: {len(parity['extra'])}", ""]
    if parity["missing"]:
        md += ["### Missing (must be explained)", ""]
        md += [f"- `{u}`" for u in parity["missing"]] + [""]
    if parity["extra"]:
        md += ["### Extra (planned but not live)", ""]
        md += [f"- `{u}`" for u in parity["extra"]] + [""]
    md += ["## Content feature census", ""]
    md += [f"- {k}: {v}" for k, v in sorted(extra["stats"].items())] + [""]
    md += ["## Superseded files in this repo (old Hugo copies)", "",
           f"{len(extra['superseded'])} file(s) — deleted, with their public URL",
           "reproduced by the migrated page (via alias where the path changed):",
           ""]
    md += [f"- `content/{rel}`  ({entry.kind})"
           for rel, entry in sorted(extra["superseded"].values())] + [""]
    md += ["## Hugo-only content kept (moved under content/)", "",
           f"{len(extra['keep'])} file(s):", ""]
    md += [f"- `content/{p}`" for p in extra["keep"]] + [""]
    md += ["## Assets", "",
           f"- {len(extra['assets'])} files, "
           f"{sum(s for _r, s, _f in extra['assets']) / 1048576:.1f} MB -> static/", ""]
    if extra["missing_refs"]:
        md += ["### Image references with no asset in the Astro repo", ""]
        md += [f"- `{r}`" for r in extra["missing_refs"]] + [""]
    Path(args.report_out).write_text("\n".join(md), encoding="utf-8")

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(f"[{mode}] entries={len(entries)} kinds={kinds}")
    print(f"  live sitemap: matched={len(parity['ours']) - len(parity['extra'])} "
          f"missing={len(parity['missing'])} extra={len(parity['extra'])}")
    print(f"  census: {extra['stats']}")
    print(f"  superseded={len(extra['superseded'])} keep={len(extra['keep'])} "
          f"assets={len(extra['assets'])}")
    if args.apply:
        print(f"  wrote={wrote} moved={moved} deleted={deleted} copied={copied}")
    if parity["missing"]:
        print("  MISSING live URLs (first 10):")
        for u in parity["missing"][:10]:
            print(f"    - {u}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
