# hencte.top

Hugo 站点源码（`https://hencte.top`）。内容从 Astro 站
[`hencter/astro.hencte.top`](https://github.com/hencter/astro.hencte.top) 迁移而来：
blog 文章、中英文品牌页、小说专区（中英双语 + 插图）、繁体（/tw、/hk）镜像。

## 构建

```bash
pnpm install
pnpm build      # variants → css → hugo（严格构建，含 --panicOnWarning）
pnpm dev        # 本地预览（hugo server -D）
```

`pnpm build` 依次执行四步，缺一不可：

| 步骤 | 命令 | 产物 | 说明 |
| --- | --- | --- | --- |
| 繁体变体 | `pnpm variants` | `content/{tw,hk}/`、`i18n/{tw,hk}.toml` | 由 `content/zh` 经 OpenCC 生成，范围与 Astro 站一致（品牌页 + 书架） |
| Tailwind | `pnpm css` | `assets/css/tailwind.css` | Tailwind CSS CLI 编译主题入口 `themes/kiss/assets/css/main.css` |
| 站点 | `hugo` | `public/` | 读取前三步的产物 |

前两步的产物**不入库**（见 `.gitignore`）。原因是 Hugo 无法可靠地自行启动 Tailwind：
它通过解析 `node_modules/.bin/tailwindcss(.cmd)` 寻找 Node 入口，而 pnpm 的 Windows shim
在文件开头写入的 `NODE_PATH` 会被该解析器误匹配，构建直接失败
（`binary "tailwindcss" is not a Node.js script`）。把编译显式放在 Hugo 之前同时解决了
这个平台问题，也让三语变体的生成过程可复现。

模板里新用的工具类由 `main.css` 顶部的显式 `@source` 覆盖（`layouts/`、主题 `layouts/`、
`content/`、`hugo_stats.json`）。自动内容检测在本项目不覆盖模板目录，只依赖
`hugo_stats.json` 会让新类**晚一个构建**才出现在 CSS 里。`pnpm build` 带
`--cleanDestinationDir`，避免 `public/css/` 里累积旧指纹文件。

## 内容结构

```
content/zh/   简体（默认语言 → /）
content/en/   英文（→ /en/）
content/tw/   繁體（台灣，→ /tw/，生成）
content/hk/   繁體（香港，→ /hk/，生成）
```

博客文章按栏目存放（`log/`、`tech/`、`ancient/`），URL 与 Astro 站一一对应；
旧 Hugo 路径以 `aliases` 形式保留重定向（例：`/tech/hugo/markdown/` → `/tech/hugo/markdown-cheatsheet/`）。

## 脚本

| 脚本 | 用途 |
| --- | --- |
| `scripts/migrate_astro.py` | Astro → Hugo 迁移（YAML→TOML、路径/URL 映射、aliases、短代码转义、图片、wiki 语法） |
| `scripts/build_variants.mjs` | 由 `content/zh` 生成 `/tw`、`/hk` 繁体镜像 |
| `scripts/verify_urls.py` | 用 `public/` 产物验收：live URL 覆盖、别名、已发布页面、图片引用、小说章节归属 |
| `scripts/asset_audit.py` | 按页面统计第三方资源加载面（MathJax/mermaid/Heti/CSS） |
| `scripts/visual_audit.mjs` | Playwright 真机渲染审计：截图 + 控制台错误/破图/横向溢出/字号层级/暗色模式（`pnpm audit:visual`） |

迁移可重复执行（幂等）：

```bash
git clone https://github.com/hencter/astro.hencte.top.git /tmp/astro
pip install pyyaml
python scripts/migrate_astro.py --source /tmp/astro            # 预览计划
python scripts/migrate_astro.py --source /tmp/astro --apply    # 写入
python scripts/verify_urls.py                                  # 验收
```

计划与报告输出在 `migration/`（`plan.json`、`report.md`，含与线上 sitemap 的逐条比对）。

## 抓取与引用政策（Cite vs Protect）

- **Cite 轨**：博客 `/log` `/tech` `/ancient`、品牌页（首页/关于/项目/友链/博客索引）可索引、可引用。
- **Protect 轨**：原创小说 `/shelf/`（旧路径 `/novel/` 永久重定向）——`robots.txt` Disallow、
  页面 `noindex, noai, noimageai`、不进入 `sitemap.xml` 与 RSS，正文不进入 `llms-full.txt`。

机器可读出口：`/llms.txt`、`/llm.txt`、`/llms-full.txt`、`/rss.xml`、`/sitemap.xml`
（均由 `layouts/home.<format>.txt`、`layouts/rss.xml`、`layouts/robots.txt` 生成）。

## 与 Astro 站的已知差异

- Hugo 以 `sitemapindex` 形式输出 `/sitemap.xml`（指向 `/zh/sitemap.xml`、`/en/sitemap.xml`），
  Astro 站是单个扁平 sitemap；URL 集合本身一致。
- `/en/llms.txt` 等英文镜像文件是 Hugo 输出格式的自然结果，Astro 站只有站点级一份。

暗色模式用的是「集中式 `.dark` 覆盖层」（`main.css` 末尾，无 `@layer` 因而优先于 Tailwind 工具类），
一处即可调全站配色；代码块无需处理——当前 `noClasses = true` + monokai 本身就是深色卡片，
明暗两种模式下都是同一块深色代码块。

## 评审（4 名评审员 + 自动审计）与修复

用 Agent Team 做了四个互相独立的只读评审：视觉/主题设计、阅读体验、无障碍（WCAG 2.2 AA 实测）、实现与性能。
报告在 `.review/*.md`（gitignore；含各自的复现脚本与截图）。评审自己交叉发现了**审计工具本身的 bug**：

- `.audit/*-mobile.png` 全部是 1440×900 的桌面图（`visual_audit.mjs` 循环未恢复视口），所以「移动端版式」此前
  从未被真正验证；已修（每张图前强制设置视口），并新增 **WCAG 1.4.10 320/360px reflow 检查**——这条会直接
  报出下表第一行那种问题。审计的对比度采样点也补上了 hero 徽章与面包屑（漏采导致「0 findings」漏判）。

据评审修掉的、已复测的缺陷：

| 缺陷 | 证据 | 修复 |
| --- | --- | --- |
| 移动端表格列塌成 1 字/行、360px 整页横向溢出 21px（320px 61px） | 评审实测：首列 22/29/41…px；`probe-table-360.png` | `.prose-content table` 在 <768px 改为可横向滚动 + 单元格 `nowrap`；320/360 复测 0 溢出 |
| `.audit` 移动端截图是桌面图（工具 bug） | 桌面/移动 PNG 字节数相同 | 视口循环修正 + 重跑；新增 320/360 reflow 门禁 |
| 品牌页 `<title>` 重复站点名，tw/hk 繁简混排 | `关于 \| 亦幸小阁 \| 亦幸小阁`、`關於 \| 亦幸小閣 \| 亦幸小阁` | `seo.html` 用 `TrimSuffix` 去重；hugo.toml 给 tw/hk 设 `title = '亦幸小閣'` |
| `x-default` 冲突 3 条（首条还指向 /tw/） | 首页 head 实测 | 改为「home 为 `/` 的站点」判定默认语言，只输出一条，实测指向 `https://hencte.top/` |
| 语言切换器 `hreflang="tw"` 非法子标签 | `lang-switcher.html:24` | 改用 `.Language.Locale`（zh-TW/zh-HK） |
| 暗色把 14 种 callout 类型色压成同一种灰框 | 像素：亮 (0,184,212) vs 暗 (31,41,55) | 暗色规则只覆盖上/右/下边框，保留左侧强调色 |
| 强调色对比度不足：hero 徽章 4.12:1、暗色 rose-600 3.92–4.45 | 评审 2115 个文本元素逐像素实测 | 徽章 rose-700；补 `.dark .text-rose-600` |
| `.dark .text-gray-300` 映射写反（分隔符暗 2.66/亮 1.41） | 同上 | 删除错误映射，面包屑分隔符改 `text-gray-500`（4.8:1） |
| 无「跳到主内容」、`main` 无 id | 每页到正文前 11 个 Tab 站 | 加 skip link + `id="main"` |
| 章节页「下一章」位于 97.7% 处、章节目录在正文之后 | `/shelf/sky-tax-ch01/` docH 7909 | 顶部加「下一章 →」、章节目录移到正文前；banner 去掉裁切 |
| `/obsidian/` 单篇栏目：卡片占 1/3 宽 + 整篇 Summary 塞进卡（含表格） | 卡片 358×2286 | 列数按页数降级 + `.Summary` 加 `line-clamp-6` |
| MathJax 配置排在外链之后（缓存命中丢配置）、浮动大版本 | `math.html:1-11` | 配置前移 + 固定 `mathjax@3.2.2`（`hugo -D` 实测顺序正确） |
| `_headers` 只覆盖根路径（`/en/llms.txt` 等无 charset） | impl 评审 | 补 `/*/llms*.txt` 与 `/css/*` immutable |

未修、留待决策的项（评审 P1/P2，报告内有逐条证据与改法）：迁移脚本 `--apply` 无条件覆盖内容（建议 `--check`/备份）、
无 CI 与聚合 `check` 脚本、`.pages.yml` 为 0 字节、图片缺 `width/height`（CLS）、文章页标签因 `disableKinds` 完全不显示、
古文竖排 15888px 横向滚动缺可发现性、宽屏右侧 326–806px 空白（可改 sticky 目录侧栏）、卡片/间距/字号体系的多处不一致、
`font.css` 无理由 `!important`、`hugo_stats.json` 被跟踪导致脏树、非默认语言 llms.txt 混排中文。

## 构建：`hugo` 一条命令

`hugo`（`pnpm build`）**单独就能构建整站**，不需要 Node 参与。这是刻意的取舍：Hugo 自己没有
OpenCC 繁化、农历换算，也在 v0.128 起**移除了 Tailwind 独立二进制支持**
（官方文档原文：*"As of v0.128.0, Hugo no longer supports the Tailwind standalone binary.
You must now install the Tailwind CSS CLI via npm."*），`hugo mod npm pack` 也仍要 `npm install`。
所以那三件事改为**一次性生成并提交**，作为构建输入：

| 生成物 | 由谁生成 | 何时重跑 |
| --- | --- | --- |
| `assets/css/tailwind.css` | Tailwind CLI（`pnpm css`） | 改动类名/主题样式后 |
| `content/tw/`、`content/hk/` | OpenCC（`pnpm variants`） | 改动 `content/zh` 后 |
| `assets/fonts/LXGWWenKai-Novel.ttf` | fontTools 子集化（一次性，23.6MB → **1.11MB**，2751 字形） | 小说用字超出子集时 |

一键刷新：`pnpm generate`（= variants + lunar + css），然后照旧 `pnpm build`。
Hugo 侧仍然做了全部该它做的事：`minify` + `fingerprint` + SRI、`images.Text` 画正文图、`.Process` 压缩、
`resources.Get` 按需加载——**能从 Hugo 走的都在 Hugo 里**（`js.Build` 内置 esbuild，连打包器都不用装）。

## 阅读体验（Playwright 审计驱动）

`pnpm audit:visual` 用真实浏览器渲染 15 类页面 × 桌面/移动 × 明暗两套配色，检查控制台错误、
破图、横向溢出、标题层级、正文字号与行长，并输出截图到 `.audit/`。据此修掉的问题：

| 问题 | 现象 | 处理 |
| --- | --- | --- |
| 移动端头部溢出 63px | 390px 下 logo 被压成每行一个字、菜单逐字换行、语言链接被挤出屏幕 | 头部改为单行：logo 不换行 + 主题按钮 + `<details>`「菜单」抽屉（原生 disclosure，无 JS）；≥md 仍是横向导航 |
| 每页 2 个 `<h1>` | 站名和页面标题都是 h1，全站 212 页 | 站名改为 `<p id="logo">`，每页只剩模板那一个 h1 |
| 文章页看不到正文 | 49 个标题的目录比视口还高，正文被推到首屏之外 | 目录收进 `<details>`（默认折叠，summary 显示标题数） |
| 标题层级糊在一起 | 桌面 h2 36px 对正文 20px，h3 30px 几乎等大 | 正文标题改 em 基准：h2 1.4em、h3 1.15em（桌面 28/23px，手机 22/18px），行高 1.35 |
| 文章标题过大 | `prose-xl` 的 h1 约 56px，占满首屏 | `.prose-header h1` 显式 30/36px |
| 语言切换器不完整 | 无译文页面只显示当前语言（`.Rotate` 只遍历本页译文） | 改用 `hugo.Sites` + 各语言首页回退，任何页面都能切到 EN/繁中/简 |
| 手机上的竖排古文 | 竖排在 390px 下退化成一条窄柱，需要横向拖动 | `max-width: 767px` 回退横排；≥md 保留 `heti--vertical` |

审计同时确认：无控制台错误、无破图、无横向溢出；桌面正文 20px/36px、约 38 个汉字一行（舒适区）；
暗色模式在明暗两套配色下截图核对过（此前只能做结构验证，没法看）。
审计脚本对「桌面 + 移动」页面会**两个视口各出一张图**，方便逐页比对。

### 样式迭代（第二轮，截图驱动）

| 位置 | 问题（截图所见） | 处理 |
| --- | --- | --- |
| 小说章节页 | 章节插图不设高度，1150×800 的插画占满整个首屏，第 1 章正文被推到屏幕外 | 插图改为 banner（`max-h-[26rem]` + `object-cover`），标题与正文段落回到首屏内 |
| 代码块 | 无语言标识、无复制按钮（Astro 站也没有，属于补强） | `layouts/_markup/render-codeblock.html` 包一层 chrome：语言标签 + 复制按钮；`_partials/code-copy.html` 只在含代码的页面加载；mermaid 由专用 hook 优先接管，仍是图 |
| 博客索引 | 单行描述铺满 1152px（>90 字符/行），远超舒适行宽 | 列表约束为 `max-w-3xl`；同时日期加 `whitespace-nowrap`，长标题不再把「2026-09-02」断成两行 |
| 小说落地页 | 26 章目录排成单列（要滚很久）；封面右侧一大片空白 | 目录改 2/3 列网格；空白处补「章节目录 · 26」与「开始阅读」（直达第 1 章） |
| 404 | 按钮显示完整 SEO 标题（「博客 \| 亦幸小阁」） | 模板里去掉 `\| 站点名` 后缀，按钮显示「博客 / 项目经历 / 友链 / 关于 / 书架」 |

### WCAG 对比度

`scripts/visual_audit.mjs` 还会对正文/标题/链接/导航/目录/卡片/页脚采样算对比度（明暗两套配色）。
一个坑值得记下：Tailwind v4 输出的颜色是 **`oklch()`**，正则解析 `rgb()` 会让采样悄悄变成 0 条、
看起来「全部通过」；现在改为在 canvas 上画 1 像素再读回像素值，任何色彩空间都能拿到 sRGB。
据此修掉：暗色模式正文链接 rose-600 对 `#030712` 只有 **4.45:1**（略低于 AA 4.5），改用 rose-400（约 7:1）。

### 品牌页占位文案

Astro 的 connect 页面正文里写着给维护者看的说明（如「友链页内容从这里维护。」），而 Astro 组件不渲染正文、
Hugo 会渲染——迁移时按 `PLACEHOLDER_BODY_RE` 丢弃这类短占位正文，因此这些内部备注不会出现在读者看到的页面上。

### 友链 Logo

友链头像取自各站自有的品牌图，并归一成方形（圆形容器裁切后可读）：

| 站点 | 使用的资源 | 说明 |
| --- | --- | --- |
| EOGEE · 岳极技术 | `/static/pic/pwa-icon-192.png`（其方形 logo mark） | 站点声明的 `logo-large.png` 是 1056×211 字标，塞进 48px 圆里不可读 |
| HU4NG's Digital Garden | `apple-touch-icon.png` 180×180 | 与线上字节一致，原本就是真图 |
| SeaWave | `/touxiang.png` 320×320（其头像/图标，与 favicon 同图） | 该站除 favicon 外没有别的 brand 资源；这是 JPEG 数据套了 .png 后缀，已按 JPEG 重编码为 192×192（8.9 KB） |

注意资源归属：迁移脚本会从 Astro 的 `public/` 复制资源并**覆盖同名文件**（`eogee.png` 就是这样被字标覆盖回来的），
所以自选品牌图用 Astro 不会写入的文件名（`eogee-mark.png`、`seawave.jpg`），并在
`scripts/migrate_astro.py` 的 `FRIEND_AVATAR_OVERRIDES` 里登记，重跑迁移仍保持这套 Logo。

## 主题渲染能力

| 能力 | 实现 | 说明 |
| --- | --- | --- |
| Obsidian callout（40 处） | `layouts/_markup/render-blockquote.html` | 用 Hugo 原生 alert 解析（`.Type/.AlertType/.AlertTitle/.AlertSign`），输出与 Astro 站同名的 `div.callout.callout-<type>`；`[!x]-` / `[!x]+` 折叠为 `<details>` |
| Mermaid 图 | `_markup/render-codeblock-mermaid.html` + `_partials/mermaid.html` | 与 Astro 一致用 `mermaid@11`，**仅含图的页面**加载运行时 |
| 目录 | `_partials/toc.html` | 用 `.TableOfContents`（`.Fragments.Headings` 在本内容下是嵌套结构，顶层只有 1 项）；标题数足够才渲染 |
| 阅读时间 | `page.html` | `printf (T "readingTime") .ReadingTime`（`i18n` 不做 `%d` 插值） |
| 古文竖排 | `layouts/ancient/page.html` + `_partials/head/heti.html` | 内置 Heti（MIT，`assets/vendor/heti`）：`heti--vertical` + `autoSpacing()`，仅古文文章页加载 |
| 暗色模式 | `_partials/head/theme-boot.html` + `_partials/theme-toggle.html` + `main.css` 的 `.dark` 层 | 与 Astro 同约定：`localStorage["theme"]`、`<html class="dark">`、`aria-pressed`；首屏前置脚本防闪烁 |
| 404 | `layouts/404.html` | 走 baseof 渲染（带站点导航与暗色模式），列出博客/项目/友链/关于/书架入口 |
| 小说导航 | `layouts/shelf/section.html`（书架）、`layouts/shelf/page.html`（落地页与章节页） | 落地页列**本系列**章节；章节页列章节 + 上一章/下一章，按 `weight`（= `chapter`）排序。系列用 `novel` 参数归组，落地页无此参数，故回退用文件名（见模板注释） |
| 锚点偏移 | `main.css` 的 `:target { scroll-margin-top }` | 吸顶导航不再遮挡跳转目标 |

Wiki 语法在迁移期处理（`scripts/migrate_astro.py`）：`[[页面]]` 有对应页面时转链接、否则降级为纯文本；
无源文件的 `![[图片]]` 嵌入删除（与线上 astro 站结果一致）；**代码块与行内代码一律不动**，
所以 Windows 的 `MKLINK [[/D] | [/H] | [/J]]` 原文保留。

## 性能取舍

- 删除主题里 **309 MB 从未被引用的字体**（19 个 TTF，且没有任何 `@font-face`，等于死重量）；
  Astro 站同样只用系统字体，字体栈里的 `LXGWWenKai` / `MapleMono-NF-CN` 名称保留，
  本机装了这两个字体的读者仍会命中。如需自托管，务必先做子集化。
- MathJax 原先**每个页面**都加载（`site.Params.math` 让 `.Param "math"` 恒为真）。
  现在只按页面 front matter `math` 或正文数学分隔符加载：全站 212 页 → 0 页（唯一需要的是草稿）。
- 移除主题自带的 `console.log('This site was generated by Hugo.')` 脚本。
- `pnpm build` 带 `--cleanDestinationDir`，避免 `public/` 累积旧指纹资源。

用 `python scripts/asset_audit.py` 复查每个第三方资源的加载面（应只有需要的页面）。

## 农历：在模板里算，不需要构建步骤

`data/lunar_years.json` 存每年「农历新年的公历日期 + 各月天数（含闰月标记）」，
`themes/kiss/layouts/_partials/lunar.html` 用减法 + 数组遍历完成公历→农历换算 ——
表 + 模板算术就是它的「运行时」（Go 模板没有位运算，所以月长用数组而非位掩码）。

表由 `lunardate`（Python）一次性生成，范围 2015–2050；几十年后扩表即可，平时零维护。
页面可用 front matter 的 `lunar = '...'` 覆盖（也作为超出表范围时的兜底）。

已核对：`2023-05-19 -> 二〇二三年四月初一`、`2022-08-23 -> 二〇二二年七月廿六`，
与原先 `lunar-javascript` 脚本产出的值逐字一致。

## 多语言：自动检测 + select 管理

- **自动检测**（`themes/kiss/layouts/_partials/head/lang-auto.html`，内联在 `<head>`、首屏前执行，
  避免先闪错语言）：按 `navigator.languages` 的优先级匹配 —— 先精确标签（`zh-TW`），
  再看 Han 脚本提示（`zh-Hant` → 繁體），最后取主语言（`zh` → 默认简体）；
  命中的目标是**当前页的对应译文**（无译文则回该语言首页），与手选逻辑完全一致。
- **两道守卫**：`localStorage.lang`（用户手选过就不再自动跳）与 `sessionStorage.langAuto`
  （每会话最多自动跳一次）—— 因此不会覆盖读者选择、不会来回弹、也不会有重定向环。
  爬虫不带 `navigator.language`，不受影响。
- **select**（`_partials/lang-switcher.html`）：桌面导航与移动菜单各一份，选项值即目标 URL，
  带 `data-locale` 与 `lang` 属性；`assets/js/site.js` 绑定全部实例，切换即跳转并记住选择。

实测（Playwright，逐场景）：`zh-TW→/tw/`、`zh-Hant→/tw/`、`en-US→/en/`、`zh-CN→/`、`fr-FR→不动`、
`/about/` 上的 `en-US→/en/about/`、同一会话二次访问不再跳、手选简体后即使浏览器是 zh-TW 也停在 `/`。
`verify_urls.py` 第 6 项已改为校验 select 选项：536 页的目标全部存在且至少一个指向别处。

## 友链交换：GitHub Issue

友链申请不再走邮件，改为在仓库里提一个 issue（表单已预填）：

| 语言 | 入口 | 模板 |
| --- | --- | --- |
| 简体 / 繁中 | `/links/`、`/tw/links/`、`/hk/links/` | [`.github/ISSUE_TEMPLATE/friend-link.yml`](.github/ISSUE_TEMPLATE/friend-link.yml) |
| English | `/en/links/` | [`.github/ISSUE_TEMPLATE/friend-link-en.yml`](.github/ISSUE_TEMPLATE/friend-link-en.yml) |

直达：<https://github.com/hencter/hencte.top/issues/new?template=friend-link.yml>

表单字段：站点名称、站点地址、头像/Logo（可选）、RSS（可选）、一句话简介、备注（可选），
以及两项必勾确认（已添加本站友链、内容原创且长期更新）。提交后自动打上 `friend-link` 标签。
模板由 `gh api` 直接创建在仓库上；页面侧 `[applyRules]` 新增可选的 `link`/`linkLabel`，
由 `themes/kiss/layouts/page.html` 渲染成卡片内的按钮。
