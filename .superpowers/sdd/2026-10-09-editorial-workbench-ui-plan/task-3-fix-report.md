# Task 3 fix report

## Scope

Implemented only the two reviewer fixes from `task-3-fix-brief.md`:

- Localized newly introduced editorial chrome through the existing Hugo i18n layer for zh/en/tw/hk: blog directory, section labels, article metadata/navigation, TOC count, taxonomy label, article list/count, and related reading.
- Made the blog section map and latest feed use the same public editorial sections: `log`, `tech`, `ancient`, and `obsidian`. Removed `shelf` from the blog map/feed contract because protected shelf pages are not part of that feed. Kept translated blog front matter aligned and updated its descriptive copy accordingly.

## Files

- `content/blog.md`
- `content/blog.en.md`
- `content/blog.tw.md`
- `content/blog.hk.md`
- `i18n/zh.toml`
- `i18n/en.toml`
- `i18n/tw.toml`
- `i18n/hk.toml`
- `themes/kiss/layouts/blog/page.html`
- `themes/kiss/layouts/section.html`
- `themes/kiss/layouts/page.html`
- `themes/kiss/layouts/_partials/terms.html`
- `themes/kiss/layouts/_partials/toc.html`

## Validation

- `pnpm generate` — passed; regenerated traditional variants and CSS.
- `pnpm build` — passed with Hugo 0.167.0, strict warning/path/i18n checks enabled.
- `pnpm check` — passed: 77/77 live URLs, 92/92 alias targets, 129/129 published pages, 187/187 image references, and 552 language switchers verified.
- Inspected rendered `public/blog/index.html` for zh/en/tw/hk: all maps contain log/tech/ancient/obsidian and no shelf map card; EN chrome is English; TW/HK chrome is generated from traditional i18n.
- Inspected rendered zh/en article output: TOC, taxonomy, article navigation, and related-reading chrome use the matching language.
- `git diff --check` — passed for the fix diff.

## Residual concern

TW/HK intentionally do not generate translated copies of the editorial article sections under the repository's existing variant-generation scope. Their blog map retains the existing `relLangURL` routing pattern; this fix does not broaden that content-generation contract or change URLs, aliases, protection, Cite, or shortcodes.

The focused conventional commit containing this report is identified in the final handoff.
