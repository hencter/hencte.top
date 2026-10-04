# content-archive —— 停用内容（现已清空）

**这个目录不在 `content/` 下，所以 Hugo 完全不处理它。** 2026-10-05 整理 `content/` 时，
把「既没有发布、也不在旧站 URL 契约里」的内容集中到这里过渡；**当天已全部处理完**，
现在只剩这份说明，作为账目与恢复入口。

**恢复方式**（以后再有需要停用的内容，也照这个走）：把文件移回 `content/zh/<原路径>`，
去掉 front matter 里的 `draft = true`（若有），`pnpm generate && pnpm build`。

> 注意：**不要**用 `content/_xxx/` 当停用目录——实测 Hugo 照样构建以 `_` 开头的目录
> （只有 `_index.md` 是特殊文件）。停用必须移出 `content/`。

## 账目（2026-10-05）

**已发布 15 个**（移回 `content/zh`，并补 `description` + `lastmod`）：

- `tech/hugo/`：npm 依赖处理（文件名改为 `npm-dependencies.md`）、front-matter、shortcode、
  content-types、menu-params-version、post-bundle-archetype-template、
  hugo-cli-convert-front-matter-to-yaml、config/hugo-markup-config
- `tech/editor/` 分区 + lazy-nvim + keyboard-shortcuts（Vim / Neovim 部分按 LazyVim 官方键位表补完）
- `tech/vsc/` 分区 + git
- `log/vim-or-neovim`
- `tech/tools`（与 `log/software` 合并为「工具与软件清单」，alias `/log/2022-10-05-software/`）

**已删除 10 个**（既不在旧站 sitemap、也不在 `migration/plan.json`，且没有内容价值）：

- `log/2025-08-04-hugo-test.md`（正文只有「## 测试」）
- `log/2025-08-15-hugo-obsidian-plugin-dev.md`（正文「测试更新」）
- `log/2024-04-11-table-rowspan-and-coilspan.md`（半个表格）
- `tech/road/plus.md`（原型骨架注释；同系列的 getting-start / lean 已发布）
- `tech/scratch/01-lesson.md`（Scratch 系列孤篇）
- `tech/hugo/_index.md`（旧的草稿分区页，已被 `content/zh/tech/hugo/_index.md` 取代）
- `posts-lorem/{_index.md,post-1.md,post-2.md,post-3/index.md}`（Hugo quick-start 的 Lorem 演示页；
  三者不在旧站 sitemap，`_index.md` 还与 `/log/` 的 `/posts/` 别名冲突）

需要找回任何一个：

```bash
git log --diff-filter=D --oneline -- content-archive     # 找到那次删除
git show <提交>:content-archive/<路径>                    # 取出内容
```
