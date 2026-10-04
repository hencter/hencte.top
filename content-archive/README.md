# content-archive —— 停用内容

**这个目录不在 `content/` 下，所以 Hugo 完全不处理它。** 2026-10-05 整理 `content/` 时，
把「既没有发布、也不在旧站 URL 契约里」的内容移到这里，让 `content/{zh,en,tw,hk}` 只剩线上真正在服务的东西。

**恢复方式**：把文件移回 `content/zh/<原路径>`，去掉 front matter 里的 `draft = true`（若有），
`pnpm generate && pnpm build`。内容一直都在 git 里，这里只是"停用"而不是删除。

## 现在留在这里的（3 个）

| 路径 | 为什么还留着 |
| --- | --- |
| `legacy/tech/editor/keyboard-shortcuts.md` | 正文含 `TODO···`（Vim/Neovim 部分未写）；补完或并入 `tech/editor/lazy-nvim` 后再发 |
| `legacy/tech/tools.md` | 只有 bat 一条；与 `legacy/log/software.md` 合并成一篇工具清单后再发 |
| `legacy/log/software.md` | 含未完成的 csv TODO（Markdown 表格不适合维护长清单） |

## 已处理（2026-10-05）

**已发布 13 个**（移回 `content/zh`，并补了 `description` + `lastmod`）：
`tech/hugo/` 下的 npm 依赖处理（文件名改为 `npm-dependencies.md`）、front-matter、shortcode、
content-types、menu-params-version、post-bundle-archetype-template、
hugo-cli-convert-front-matter-to-yaml、config/hugo-markup-config；`tech/editor/` 分区 + lazy-nvim；
`tech/vsc/` 分区 + git；`log/vim-or-neovim`。

**已删除 10 个**（既不在旧站 sitemap、也不在 `migration/plan.json`，且没有内容价值）：

- `legacy/log/2025-08-04-hugo-test.md`（正文只有「## 测试」）
- `legacy/log/2025-08-15-hugo-obsidian-plugin-dev.md`（正文「测试更新」）
- `legacy/log/2024-04-11-table-rowspan-and-coilspan.md`（半个表格）
- `legacy/tech/road/plus.md`（原型骨架注释；同系列的 getting-start / lean 已发布）
- `legacy/tech/scratch/01-lesson.md`（Scratch 系列孤篇）
- `legacy/tech/hugo/_index.md`（旧的草稿分区页，已被 `content/zh/tech/hugo/_index.md` 取代）
- `posts-lorem/{_index.md,post-1.md,post-2.md,post-3/index.md}`（Hugo quick-start 的 Lorem 演示页；
  三者不在旧站 sitemap，`_index.md` 还与 `/log/` 的 `/posts/` 别名冲突）

需要找回任何一个：

```bash
git log --diff-filter=D --oneline -- content-archive     # 找到那次删除
git show <提交>:content-archive/<路径>                    # 取出内容
```
