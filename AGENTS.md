# AGENTS.md — hencte.top 的代理约定

亦幸小阁站点源码：Hugo 0.167 + Tailwind v4 的**四语**静态站（`/`、`/en/`、`/tw/`、`/hk/`），
无客户端框架、无运行时后端，部署为 Cloudflare Workers 静态资源。

**本文件只写"代理该怎么干活"；站点事实以 [README.md](README.md) 为准，Cloudflare 环境以
[.agents/CLOUDFLARE.md](.agents/CLOUDFLARE.md) 为准。** 两者冲突时先读它们，再改本文件。

## 1. 技能：先加载 `hugo-static-site`

项目级技能目录是 `.agents/skills/`。其中 **`.agents/skills/hugo-static-site/` 是本仓库的必载技能**
（发布源 <https://hugozh.cn/skill/>，仓库 `hencter/hugozh`），在你做以下任何事之前先读它的
[SKILL.md](.agents/skills/hugo-static-site/SKILL.md)：

- 改 `content/`、`layouts/`、`assets/`、`themes/`、`hugo.toml`、`i18n/`、`data/`
- 构建失败、页面缺失、输出不符合预期（先按 [references/gotchas.md](.agents/skills/hugo-static-site/references/gotchas.md) 的 G1–G28 分诊）
- 批量新增 / 翻译页面、日期与版本控制、SEO 输出、短代码与渲染钩子

技能目录在**会话启动时**扫描：改动其中文件后需要重开会话才会重新加载。

### 版本与完整性

本地这 13 个文件是 hugozh.cn 的**发布副本**（抓取于 2026-10-04，站点版本 v1.3.0）。
清单快照在 [skill-manifest.json](.agents/skills/hugo-static-site/skill-manifest.json)
（`sha256 = d5838277d72592dd6151d3acb6b90200d46239b63c62df72f250d5640122560a`，5,032 B）；
技能目录共 14 个条目 = 清单里的 13 个 + 清单自身。

校验（在仓库根执行，须全部 `True`）：

```powershell
$m = Get-Content .agents/skills/hugo-static-site/skill-manifest.json -Raw | ConvertFrom-Json
$m.files | ForEach-Object {
  $p = Join-Path '.agents/skills/hugo-static-site' $_.path
  [pscustomobject]@{
    path = $_.path
    ok   = ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -eq $_.sha256) -and
           ((Get-Item -LiteralPath $p).Length -eq $_.bytes)
  }
} | Format-Table -AutoSize
```

- 出现 `False` = 本地副本被改动或被上游更新；**不要就地"修好"**，重新按清单同步并逐文件校验。
- 要改规则本身，改上游 `hencter/hugozh` 并在 hugozh.cn 重新发布，然后重新同步；
  就地改这 13 个文件会破坏与发布的哈希一致性，也无法回流。
- 上游是否已发布新版：比对 <https://hugozh.cn/skill/skill-manifest.json> 的 `files[].sha256`。
- 行尾由 `.gitattributes`（`* text=auto eol=lf`）钉死：`core.autocrlf=true` 时 git 会把工作区文件转成 CRLF，
  哈希随即全红而文件"看起来"没变。`.prettierignore` 同时排除这份发布副本与所有生成物，避免 `pnpm format` 改字节。

### 三条铁律（会让**整站**构建失败，不是单页）

1. 内容里不得出现未转义的 `{{<` / `{{%`（代码块也不豁免）——写成 `{{</* name */>}}`。
2. 内容里不得出现字面串 `HAHAHUGOSHORTCODE`（Hugo 短代码占位符前缀）。
3. `hugo.toml` 里所有顶层标量必须在**第一个 `[table]` 之前**；表之后的裸键会静默并入该表。

注意：`content/zh/shortcodes.md`（已发布：<https://hencte.top/shortcodes/>）里有 43 处 `{{<`/`{{%` 是**演示页的真实调用**，不是违规；
那一页同时登记了 6 个 Hugo 内置短代码的实测结论（`figure` 不解析 `assets/`、`qr` 必须自闭合或配对）。

## 2. 本仓库既有的约定（别推翻，先读再改）

- **`pnpm generate` 的产物提交入库，勿手改**：`content/{tw,hk}/`、`i18n/{tw,hk}.toml`、
  `data/projects/{tw,hk}.toml`（`pnpm variants`，来自 `content/zh` 与 `data/projects/zh.toml`）
  与 `assets/css/tailwind.css`（`pnpm css`）。Cloudflare 面板只跑纯 `hugo`，所以它们必须是最新的。
  改 `content/zh` 品牌页、`data/projects/zh.toml` 或模板类名后：`pnpm generate` 再提交。
- **项目数据两处，别写回 front matter**：文案在 `data/projects/<lang>.toml`（`featured` / `more`
  两个数组，条目可带 `repo`），GitHub 侧字段在 `data/projects/live.json`（`pnpm projects` 生成、
  `pnpm projects:check` 对账）。页面用 `projectSections` 开关决定渲染哪几块；两个 partial 对
  每个品牌页都会被调用，去掉开关就会到处长项目网格。
- **content/ 里只放线上内容**：品牌页在语言根目录；文章在 `log/`、`tech/`、`ancient/`、`obsidian/`；
  小说**每本书一个 section**（`shelf/<book>/_index.md` + `ch<NN>.md` → `/shelf/<book>/ch<NN>/`，
  旧平铺 URL 由每章的 `aliases` 保留）。停用/草稿旧文放仓库根的 `content-archive/`——
  **不要**用 `content/_xxx/` 存草稿：以 `_` 开头的目录 Hugo 照样构建（实测）。
- **中英小说的相对路径必须一致**（`shelf/<book>/ch<NN>.md`）：项目没有显式 `translationKey`，
  语言配对靠相对路径；路径一变，语言切换器就悄悄退回首页。
- **Tailwind 必须在 Hugo 之前编译**：Hugo 无法可靠启动它（pnpm 的 Windows shim 会让
  `css.TailwindCSS` 报 `binary "tailwindcss" is not a Node.js script`）。不要"修好"这条顺序。
- **`minify.minifyOutput` 写在 `hugo.toml`**，因为它不能依赖命令行标志（面板跑裸 `hugo`）。
- **`[frontmatter] lastmod = ['lastmod', 'date']`**：迁移已重写全部内容文件，不要改回 `:git`。
- **新增短代码或新工具类后，先 `pnpm css` 再 `pnpm build`**：`assets/css/tailwind.css` 是编译产物，
  Tailwind 的 `@source` 虽覆盖 `layouts/` 与 `content/`，但不重编译就不会产出新类。
- `public/`、`resources/` 是输出，不要手改；抓取政策见 README 的 Cite/Protect 一节。

## 3. 构建与验收

```bash
pnpm generate   # variants + css：刷新两个构建输入
pnpm build      # hugo：严格构建（--ignoreCache --cleanDestinationDir --panicOnWarning --printPathWarnings --printI18nWarnings --minify）
pnpm check      # python scripts/verify_urls.py：用 public/ 产物验收 URL / 别名 / 图片
```

- 改内容先跑 `pnpm build`；报 WARNING 就是失败（`--panicOnWarning`），不要忽略。
- `pnpm check:templates`（`--printUnusedTemplates`）报"未使用的 partial"时**先别删**：
  它可能是另一个缺陷的症状（见 gotchas G26）。
- 判断"某页到底渲染了没有"看 `public/` 产物，不看控制台；页面数用 `pnpm list`（`hugo list all`）。
