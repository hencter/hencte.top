# content-archive —— 停用内容

**这个目录不在 `content/` 下，所以 Hugo 完全不处理它。** 2026-10-05 整理 `content/` 时，
把「既没有发布、也不在旧站 URL 契约里」的东西移到这里，让 `content/{zh,en,tw,hk}` 只剩线上真正在服务的内容。

**恢复方式**：把文件移回 `content/zh/<原路径>`，去掉 front matter 里的 `draft = true`（若有），
`pnpm generate && pnpm build` 即可。内容一直都在 git 里，这里只是"停用"而不是删除。

## legacy/ —— 迁移时被统一标成 draft 的旧文（22 个 + 1 个薄页分区）

这些是 Astro → Hugo 迁移时逐条标了 `draft = true` 的旧笔记（`migration/plan.json` 里有原记录）。
下表是 2026-10-05 的分诊建议：

| 原路径 | 建议 |
| --- | --- |
| `tech/hugo/hugo-npm.md` | ✅ 已发布（2026-10-05，改名为 `npm-dependencies.md`） |
| `tech/hugo/front-matter.md` | ✅ 已发布（2026-10-05） |
| `tech/hugo/hugo-cli-convert-front-matter-to-yaml.md` | **发布**（CLI 实操） |
| `tech/hugo/shortcode.md` | ✅ 已发布（2026-10-05） |
| `tech/hugo/content-types.md` | **发布**，或并入已发布的 `content-formats.md` |
| `tech/hugo/menu-params-version.md` | **发布** |
| `tech/hugo/post-bundle-archetype-template.md` | **发布** |
| `tech/hugo/config/hugo-markup-config.md` | ✅ 已发布（2026-10-05；分区页本就因契约保留在 content/） |
| `log/vim-or-neovim.md` | **发布** |
| `tech/editor/_index.md` + `lazy-nvim.md` | **合并**成一篇「编辑器配置」后发布 |
| `tech/editor/keyboard-shortcuts.md` | **合并**（含 1 处 TODO；正文用 `<kbd>`） |
| `tech/vsc/_index.md` + `git.md` | **发布**（成对）或整对留在这里 |
| `tech/tools.md` | **合并**（只有 bat 一条）到 `log/terminal.md` 或 `log/software.md` |
| `log/software.md` | **合并**（含未完成的 csv TODO） |
| `log/2025-08-04-hugo-test.md` | **删除**（正文只有「## 测试」） |
| `log/2025-08-15-hugo-obsidian-plugin-dev.md` | **删除**（正文「本次开发采用 Trae Solo 模式」「测试更新」） |
| `log/2024-04-11-table-rowspan-and-coilspan.md` | **删除**（正文「现在想写点什么呢？」+ 半个表格） |
| `tech/road/plus.md` | **删除**（正文就是原型骨架注释；同系列的 `getting-start`/`lean` 已发布） |
| `tech/scratch/01-lesson.md` | **删除**或留着（Scratch 少儿编程系列只有这一节） |

## posts-lorem/ —— Hugo quick-start 的 Lorem 演示页（4 个）

`content/zh/posts/{_index.md,post-1.md,post-2.md,post-3/index.md}`：标题就是 "Post 1/2/3"，
正文是 Lorem ipsum，`post-3` 还引用了缺失的 `bryce-canyon.jpg`。三者**都不在旧站 sitemap，
也不在 `migration/plan.json`**；而 `posts/_index.md` 还与 `/log/_index.md` 的
`aliases = ['/post/', '/posts/']` 冲突（`/posts/` 是跳转到 `/log/` 的别名页）。
**建议直接删除**——本目录只作缓冲。
