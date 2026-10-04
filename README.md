# hencte.top

亦幸小阁的站点源码（<https://hencte.top>）：**Hugo 0.167 + Tailwind v4** 构建的**四语**静态站 ——
简体（`/`）、英文（`/en/`）、繁體台灣（`/tw/`）、繁體香港（`/hk/`），当前构建产出 **569 页**
（ZH 221 / EN 46 / TW 151 / HK 151），无客户端框架、无运行时后端。

**Astro → Hugo 迁移已全部完成**（2026-10）：blog 文章、四语品牌页、原创小说专区（中英双语 + 插图）、
Cite/Protect 抓取政策与机器可读出口都在本仓库维护。Astro 站
[`hencter/astro.hencte.top`](https://github.com/hencter/astro.hencte.top) 已标注为旧版；
`scripts/migrate_astro.py` 保留下来做对照与幂等复核，日常构建不需要它。

## 构建

```bash
pnpm install
pnpm generate   # variants + css：刷新两个「构建输入」（产物提交入库）
pnpm build      # hugo：严格构建站点（--panicOnWarning 等）
pnpm dev        # 本地预览（hugo server -D）
pnpm check      # python scripts/verify_urls.py：用 public/ 产物做 URL/别名/图片验收
```

`pnpm build` **只跑 `hugo`**；两个「构建输入」由 `pnpm generate` 刷新：

| 步骤 | 命令 | 产物 | 说明 |
| --- | --- | --- | --- |
| 繁体变体 | `pnpm variants` | `content/{tw,hk}/`、`i18n/{tw,hk}.toml` | 由 `content/zh` 经 OpenCC 生成，范围与 Astro 站一致（品牌页 + 书架） |
| Tailwind | `pnpm css` | `assets/css/tailwind.css` | Tailwind CSS CLI 编译主题入口 `themes/kiss/assets/css/main.css` |
| 站点 | `hugo` | `public/` | 读取前两步的产物 |

这两个生成物**都提交入库**（`.gitignore` 末尾的注释写明了原因）：Cloudflare Workers Builds 只跑构建命令，
面板里执行的就是纯 `hugo`，所以 `content/{tw,hk}` 与 `assets/css/tailwind.css` 必须保持仓库内的最新状态。
改动 `content/zh` 的品牌页或模板类名后，先 `pnpm generate` 再提交。

Tailwind 不能交给 Hugo 自己启动，原因是 Hugo 无法可靠地启动它：
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

博客文章按栏目存放（`log/`、`tech/`、`ancient/`）；URL 与迁移前的 Astro 站逐条比对过，
旧 Hugo 路径以 `aliases` 形式保留重定向（例：`/tech/hugo/markdown/` → `/tech/hugo/markdown-cheatsheet/`）。
`content/{tw,hk}` 由 `pnpm variants` 生成，**不要手改**（会被覆盖），只改 `content/zh`。

## 脚本

| 脚本 | 用途 |
| --- | --- |
| `scripts/migrate_astro.py` | Astro → Hugo 迁移（YAML→TOML、路径/URL 映射、aliases、短代码转义、图片、wiki 语法） |
| `scripts/build_variants.mjs` | 由 `content/zh` 生成 `/tw`、`/hk` 繁体镜像 |
| `scripts/verify_urls.py` | 用 `public/` 产物验收：live URL 覆盖、别名、已发布页面、图片引用、小说章节归属 |
| `scripts/asset_audit.py` | 按页面统计第三方资源加载面（MathJax/mermaid/Heti/CSS） |
| `scripts/visual_audit.mjs` | Playwright 真机渲染审计：截图 + 控制台错误/破图/横向溢出/字号层级/暗色模式（`pnpm audit:visual`） |

迁移脚本保留下来做对照与幂等复核（迁移本身已完成，日常不需要再跑）：

```bash
git clone https://github.com/hencter/astro.hencte.top.git /tmp/astro
pip install pyyaml
python scripts/migrate_astro.py --source /tmp/astro            # 预览计划
python scripts/migrate_astro.py --source /tmp/astro --apply    # 写入
python scripts/verify_urls.py                                  # 验收
```

计划与报告输出在 `migration/`（`plan.json`、`report.md`，含与线上 sitemap 的逐条比对）。

## 图片与资源模型（assets = 公共，页包 = 单篇）

图片只有一个入口：`_partials/img.html`。它按顺序解析，模板与正文都用它，不要直接写 `<img>`：

1. **页包（page bundle）** —— `src` 是相对文件名时，先查当前页的 `.Resources`。
   单篇文章专属的图放在文章目录里：

   ```
   content/zh/tech/ai-guardrail/
     index.md            # 原 ai-guardrail.md，URL 不变
     ai-guardrail-cover.webp
   ```

   正文写 `![封面](ai-guardrail-cover.webp)`，front matter 的 `images = ['ai-guardrail-cover.webp']` 同样能被解析（OG 图也会转成绝对地址）。

2. **公共资源（`assets/img/…`）** —— 跨页、跨语言共用的图（项目封面、友链头像、小说章节图与封面、作者头像、OG 图）放这里。
   模板传绝对路径 `/img/…`；解析器会依次尝试原名与 `.webp`，因此**内容里的路径不必随图片改名而改**：
   `/img/novel/sky-tax-ch01.png` 会自动命中 `assets/img/novel/sky-tax-ch01.webp`。

3. 都命中不了时按原样输出 `<img>`（外链图、`data:` URI 等），所以迁移期可以安全替换调用点。

**为什么这样分**：`static/` 里的文件只会被 Hugo 原样拷进 `public/`，不做任何处理；`assets/` 里的文件才被 Hugo 当作资源
（可读尺寸、可发布、可用于 OG）。`static/` 一旦放图，就等于把未压缩的原始字节直接送上 CDN，且拿不到 `width/height`。

**新增图片**：单篇专属 → 放文章目录；跨页共用 → 放 `assets/img/`。两者都建议先压到 WebP（长边 ≤1200、q82），
离线一次性完成，**构建期不做转码**（这是 CI 时长与上传量的关键取舍）。历史图片由 `scripts/*` 之外的一次性脚本处理过，
原图仍可在 git 历史里找回。

## 短代码（`layouts/shortcodes/`）

**10 个自带短代码**，共同约定：**零 JavaScript、断网可构建、只用主题已有的颜色 token**（宣纸 / 朱红 / 暖灰），因此暗色自动跟随。
完整示例见已发布页面 <https://hencte.top/shortcodes/>（源码 `content/zh/shortcodes.md`）；那一页还列了本站可直接用的 **6 个 Hugo 内置短代码**
（`ref`/`relref`、`highlight`、`param`、`qr` 有实况示例，`figure` 与 `youtube` 附了实测后的不用理由）。

新增短代码用到**新的工具类**时，先 `pnpm css` 再构建：Tailwind 的 `@source` 覆盖了 `layouts/`，但需要重新编译 `assets/css/tailwind.css`。

| 短代码 | 用途 | 写法 |
| --- | --- | --- |
| `note` | 提示框，与 Obsidian callout 同一套类名 | `{{</* note type="tip" title="小技巧" fold="true" open="true" */>}}…{{</* /note */>}}` |
| `pic` | 插图 + 图注，走 `_partials/img.html`（页包 → assets） | `{{</* pic src="/img/projects/nova.webp" alt="封面" caption="图注" */>}}` |
| `gallery` | 多图网格，一行一张 `路径\|图注`，图片复用同一个解析器 | `{{</* gallery cols="3" */>}}/img/a.webp\|图注{{</* /gallery */>}}` |
| `chapter` | 按 `novel`+`chapter` 查找章节，自动取标题与链接 | `{{</* chapter 12 */>}}`、`{{</* chapter novel="sky-tax" n="12" */>}}` |
| `seal` | 朱红印章（正文内联，竖排） | `{{</* seal size="sm" shape="round" */>}}幸{{</* /seal */>}}` |
| `verse` | 诗/古文，默认竖排、窄屏自动回落横排 | `{{</* verse cite="陆游《游山西村》" */>}}…{{</* /verse */>}}` |
| `spoiler` | 剧透折叠，默认收起；标题缺省取 i18n 的 `spoiler` 键 | `{{</* spoiler label="剧透警告" */>}}…{{</* /spoiler */>}}` |
| `tabs` + `tab` | 纯 CSS 标签页（`input:checked + label + .tab-panel`） | `{{</* tabs */>}}{{</* tab name="bash" */>}}…{{</* /tab */>}}{{</* /tabs */>}}` |
| `filetree` | 目录树，原样转义、窄屏横向滚动不折行 | `{{</* filetree title="仓库结构" */>}}content/{{</* /filetree */>}}` |
| `timeline` | 时间线，一行 `时间\|标题\|说明`，输出语义化 `<ol>` | `{{</* timeline */>}}2026-10\|标题{{</* /timeline */>}}` |

写内容时的两条硬约束（都会让**整站**构建失败，围栏代码块也不豁免）：
1. 短代码语法示例必须转义成 `{{</* name */>}}`；
2. 正文里不得出现短代码占位符的字面串（要展示时在中间插零宽字符：`H&#xfeff;AHAHUGOSHORTCODE`，实体写在代码 span 之外）。

### 图表：`goat` 围栏（不需要短代码）

写 ```` ```goat ```` 围栏，Hugo 在构建期用 GoAT 把 ASCII 图变成 SVG：零 JS、断网可构建、
线条用 `currentColor` 因此自动跟随暗色。`themes/kiss/layouts/_markup/render-codeblock-goat.html`
在 Hugo 内建钩子之上补了**图注**（围栏属性 `caption`）与响应式包装——内建钩子会忽略 `caption`（实测 `figcaption` 数为 0）。

**中文不要放进图里**：GoAT 逐字符排到 8px 网格上（实测相邻汉字 x=152/160/168/176），
全角汉字约 13–16px 宽，必然重叠。图里用 ASCII 标签，中文说明写进 `caption`。
同理，**目录树不要改成 GoAT**：那会把可复制、可搜索的等宽文本拆成逐字 SVG（`layouts/shortcodes/filetree.html`）。

## 样式架构（组件化约定）

样式分三层，**新样式按顺序落到第一层能表达的地方**：

| 层 | 放什么 | 位置 |
| --- | --- | --- |
| **语义 token** | 颜色：`bg-surface` `bg-surface-soft` `border-line` `border-line-strong` `text-ink` `text-ink-soft` `text-ink-muted` `text-ink-faint` | `@theme` 定义，`.dark` 里整体翻转 |
| **原语组件** | `.card` `.btn` `.btn-primary` `.btn-secondary` `.chip` `.meta`，以及 `.callout` `.tabs` `.toc` `.code-block` `.prose*` | `@layer components`（`@apply` + token） |
| **页面专属规则** | 表达不了的部分 | **层外**（未分层），必须写注释说明为什么不能分层 |

三条硬规矩：

1. **颜色只写 token，不写 `dark:` 变体**——token 在 `.dark` 里整体翻转。也不要再写
   `.dark .text-gray-600 {}` 这类逐工具类映射（已删除 24 条）。
2. **原语优先**：模板里重复出现的组合先进 `@layer components`，再把模板改成组件名
   （`.card` 已经把"圆角 + 发丝边 + 纸面 + 阴影悬停"这组 14 处重复收拢）。
3. **会与原子类竞争的规则必须留在层外**：未分层规则压过所有 Tailwind 层。实测把这类规则
   搬进 `@layer components` 会让原子类反超——整批搬迁导致 `/tech/` 高度 3415→2803px、
   `/blog/` 4313→3656px、`/shelf/` 暗色 71% 像素变化，并新增 1 处对比度不达标（已整批回退）。
   逐条二分后迁移了确证零差异的 3 条；`.pager-link` / `.hero-subtitle` 这类"元素上同时挂着
   原子类"的规则属于承载性规则，保持层外。

**改样式后的验证流程**（只跑构建发现不了层序变化）：

```bash
corepack pnpm css && hugo --ignoreCache --panicOnWarning   # 连续两轮 → 构建不动点
# 12 页 × 明暗（light/dark）全页截图做像素对比：期望 0.0000% 差异
# 全站对比度扫描 + 390px CLS/溢出扫描
```

`hugo_stats.json` 曾是 Tailwind 的 `@source`，而它由**后续**那次 Hugo 构建写出 ——
会让提交的样式表比模板滞后一轮，已删除（实测带与不带产出字节相同）。

## 抓取与引用政策（Cite vs Protect）

- **Cite 轨**：博客 `/log` `/tech` `/ancient`、品牌页（首页/关于/项目/友链/博客索引）可索引、可引用。
- **Protect 轨**：原创小说 `/shelf/`（旧路径 `/novel/` 永久重定向）——`robots.txt` Disallow、
  页面 `noindex, noai, noimageai`、不进入 `sitemap.xml` 与 RSS，正文不进入 `llms-full.txt`。

机器可读出口：`/llms.txt`、`/llm.txt`、`/llms-full.txt`、`/rss.xml`、`/sitemap.xml`
（均由 `layouts/home.<format>.txt`、`layouts/rss.xml`、`layouts/robots.txt` 生成）。
四语各自输出一份镜像，**根路径那份是权威版本**，非默认语言的同名文件里也写明了这一点。

2026-10-04 校准：三份 txt 与 `robots.txt` 的口径已统一为「robots `Disallow` + 页面
`noindex, noai, noimageai` + 不进 `sitemap.xml`/`rss.xml` + 正文不进 `llms-full.txt`」；
语言声明改为实际的四语，技术栈改写为 Hugo + Tailwind v4，并补了一行实体消歧
（GitHub 资料里的 `blog` 字段是 `hencter.top`，与本主站 `hencte.top` 不是同一域名）。

## 迁移状态：Astro → Hugo（已完成）

内容、URL、别名、图片、短代码与 wiki 语法都已迁到本仓库，并用 `verify_urls.py` 与线上 sitemap 逐条比对过
（报告在 `migration/`）。下面两点是**保留的结构差异**，不是待办：

- Hugo 以 `sitemapindex` 形式输出 `/sitemap.xml`（指向 `/zh/sitemap.xml`、`/en/sitemap.xml` 等），
  Astro 站是单个扁平 sitemap；URL 集合本身一致。
- `/en/llms.txt`、`/tw/llms.txt` 等镜像文件是 Hugo 多语言输出格式的自然结果，Astro 站只有站点级一份。

Astro 侧的状态：`hencter/astro.hencte.top` 仓库描述已标注「旧版，已迁移」；
个人主页 README（`hencter/hencter`）里的「用 Astro 建站」与网站徽章也已改成 Hugo。

暗色模式用的是「集中式 `.dark` 覆盖层」（`main.css` 末尾，无 `@layer` 因而优先于 Tailwind 工具类），
一处即可调全站配色；代码块无需处理——当前 `noClasses = true` + monokai 本身就是深色卡片，
明暗两种模式下都是同一块深色代码块。

## 文章信源（脚注）规范

对外文章里可核查的事实、数据与引文一律带脚注。约定如下（`content/zh/log`、`content/zh/tech` 等已按此执行）：

- 标记紧贴断言最后一个字、标点之前：`…零售渗透率达到 61.4%[^1]。`
- 定义块放文末（署名行之后），**每条必须单行** —— Goldmark 的脚注续行需要 4 空格缩进，折行会渲染错：
  `[^1]: 乘联会 2026 年 4 月汽车零售数据. <https://www.cpcaauto.com>（访问 2026-10-04）`
- 编号按正文首次出现顺序；同一信源复用同一编号
- 一手信源优先（官网 / 官方文档 / 论文原文 / 官方仓库）；热搜、快讯、聚合站只作线索，用到时在定义里标明性质
- **无法核实的断言不硬加脚注**：写进验收报告的「未核实」清单并给出弱化或删除建议；
  新找的来源必须 `web_fetch` 实际打开过（HTTP 200 且内容能支撑该断言）

2026-10-04 现状：`content/zh` 与 `content/en` 的非小说共 **108 篇**逐篇评估，**24 篇**补/转脚注
（新增定义 50 条、正文标记 69 处），并修掉 4 处「有标记无定义」的历史缺陷
（`ai-token-carrier-pricing`、`changxin-chip-semiconductor`、`terminal`、`arch-linux`）。
全站标记/定义交叉校验 0 违规；渲染级验证看 `public/**` 里的 `footnote-ref`、`id="fn:*"`、`footnote-backref`。
评估中发现的「断言与来源不符」「数据无源」按来源原文改正，其余记入报告待决策。

## 项目页：重点项目 + 更多公开项目

`content/{zh,en}/projects.md` 的 front matter 驱动，两个数组分工明确：

| 字段 | 渲染 | 内容 |
| --- | --- | --- |
| `featuredProjects` | `themes/kiss/layouts/_partials/projects.html` | 6 个重点项目，带封面图（`assets/img/projects/*`） |
| `moreProjects` + `moreProjectsSection` | `themes/kiss/layouts/_partials/more-projects.html`（2026-10 新增） | 11 个公开项目，纯文字卡片；数组为空时整块不渲染 |

两条约束：条目文案只能来自仓库 README / description（不许凭仓库名编造）；`url` 要么是真实存在的公开仓库，
要么是 `web_fetch` 实测 200 的线上地址 —— 没有封面图就用无图版式，**不要伪造图片 URL**。
模板只用既有原语（`.card`/`.chip`）与语义 token，无新颜色；四语由 `pnpm variants` 同步，
`themes/kiss/layouts/page.html` 只多一行 partial 调用。

## GitHub 仓库 About 维护（gh）

站点与仓库的对外说明都以 `gh` 为准，不要浏览器里逐个点：

```bash
gh repo list hencter --limit 200 --json name,description,homepageUrl,repositoryTopics,visibility,isFork,isArchived,primaryLanguage,pushedAt
gh api repos/hencter/<name> --jq '{description,homepage,topics,archived,fork,visibility}'
gh api -X PATCH repos/hencter/<name> -f description='…' -f homepage='https://…'
gh api -X PUT repos/hencter/<name>/topics --input topics.json      # {"names":["hugo","i18n"]}
```

2026-10-04 现状：**55 个公开非 fork 仓库全部补齐 description + topics**（本轮前 31 个无描述、
45 个无 topics；现在逐仓库读回 55/55 与写入一致，topics 全为小写 ASCII）。分类口径与逐仓库证据：
展示级 13 / 工具级 11 / 实验级 19 / 归档候选 4 / 占位 8。规则：无 README 或空壳仓库只写可证事实
（例：「空仓库：无 README、无文件、无提交」）；`homepage` 只在实测 HTTP 200 时写入；
**不 archive、不删除、不改 README / 代码 / release / visibility**。

## 评审（4 名评审员 + 自动审计）与修复

用 Agent Team 做了四个互相独立的只读评审：视觉/主题设计、阅读体验、无障碍（WCAG 2.2 AA 实测）、实现与性能。
评审报告与截图是一次性产物，写在被 gitignore 的临时目录里、**不入库**（复现入口是 `scripts/` 下的脚本与 `pnpm audit:visual`）。
评审自己交叉发现了**审计工具本身的 bug**：

- 审计输出的移动端截图全部是 1440×900 的桌面图（`visual_audit.mjs` 循环未恢复视口），所以「移动端版式」此前
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

未修、留待决策的项（截至 2026-10-04；逐条证据与改法在评审报告里）：迁移脚本 `--apply` 无条件覆盖内容
（建议加 `--check`/备份）、**无 CI workflow**（`.github/workflows` 不存在）与**仓库无 LICENSE**、
`.pages.yml` 为 0 字节、图片缺 `width/height`（CLS）、文章页标签因 `disableKinds` 完全不显示、
古文竖排 15888px 横向滚动缺可发现性、宽屏右侧 326–806px 空白（可改 sticky 目录侧栏）、
卡片/间距/字号体系的多处不一致、非默认语言 `llms*.txt` 正文仍是中文（根路径为权威版本）、
仓库无 social preview 图、`hencter.top` 域名已无 A 记录但 GitHub profile 的 website 字段与
`site` 仓库的 homepage 仍指向它（profile 需要 `gh auth refresh -h github.com -s user` 之后才能改）。

已解决（原先列在此）：`hugo_stats.json` 不再被跟踪（见 `.gitignore`）；`font.css` 的 `!important` 已清理。

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
| `static/fonts/LXGWWenKai-Novel.woff2` | fontTools 子集化（一次性，**580,884 B**；许可证文本在 `assets/fonts/`） | 小说用字超出子集时 |

一键刷新：`pnpm generate`（= `variants` + `css`；没有 lunar 步骤 —— `data/lunar_years.json` 是静态数据，
换算在模板里做），然后照旧 `pnpm build`，生成物一并提交。
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
| KoiBunny · 锦鲤兔 | `/icons/koi-icons.svg#rabbit`（其页头品牌徽标用的像素兔） | 该站 `/favicon.svg` 是主题的 NEXUS 标记（`aria-label="NEXUS"`，走同一套渐变），`/favicon.ico` 内嵌图只有 16×16，两处都不是可辨的 KoiBunny 自有品牌图；故取它自己图标集里的像素兔，用同一配色（`#40251f` on `#fff1c7`）渲染成 192×192 方图（2.5 KB WebP） |

注意资源归属：迁移脚本会从 Astro 的 `public/` 复制资源并**覆盖同名文件**（`eogee.png` 就是这样被字标覆盖回来的），
所以自选品牌图用 Astro 不会写入的文件名（`eogee-mark.png`、`seawave.jpg`），并在
`scripts/migrate_astro.py` 的 `FRIEND_AVATAR_OVERRIDES` 里登记，重跑迁移仍保持这套 Logo。

## 主题优化（第三轮，实测驱动）

针对 R2 评审的 P0–P2 项做了一轮**主题层**修复，全部以构建产物或真实浏览器实测验收
（`hugo` 严格构建 exit 0；`visual_audit.mjs` 报 `no findings`；`verify_urls.py` 全绿）。

| 问题 | 实测证据 | 改法 |
| --- | --- | --- |
| 亮色正文链接对比度 4.34:1，低于 WCAG AA（暗色上轮已修） | 浏览器逐元素采样：`.prose-content a`、eyebrow、步骤标签 | 新增语义 token `--color-accent`（`main.css` `@theme`），亮色 = rose-700、暗色 = rose-400；30 处 `text-rose-600/700/500` 全改 `text-accent`。实测亮色 **5.49–6.03:1**，暗色 **7.48:1** |
| `font.css` 用无层级元素选择器 + 6 处 `!important` 设字体 | `p, span, div, a, li, td, th { font-family }` 无层级 → 压过 `@layer utilities` 里的一切工具类 | 收进 `@layer base`，只在 `html` 上设一次（继承），去掉全部 `!important`。浏览器断言：**0 条**无层级裸元素 `font-family` 规则；`code`/`pre` 仍是 mono，其余仍是 serif |
| 小说正文只画进 canvas，读屏读不到、Ctrl+F 搜不到（WCAG 1.1.1） | `<template>` 是 inert：`renderedTextNodes=0` | `<template>` → `<div class="sr-only">`（正文本来就在交付 HTML 里，不新增暴露面），canvas 宿主 `aria-hidden="true"`。实测 **4192 字**可被读屏取到 |
| 暗色模式章节仍是米白纸面（整屏眩光） | canvas 像素 `#faf7f0` on `#030712` | 纸张/墨色改为 CSS 变量 `--novel-paper/-ink/-watermark`，`novel.js` 从文档根读取并在 `themechange` 时重绘。实测亮 `rgb(250,247,240)` → 暗 `rgb(17,24,39)` |
| 章节字体晚于排版（回退字体度量 + 580KB 串行） | 上轮实测：排版 t=229ms、字体 t=3247ms | 新增 `_partials/head/novel-font.html` 预加载（`crossorigin` 必需，href 必须与 `@font-face` 一致）；`novel.js` 先渲染占位、`document.fonts.load()` 后**重排一次**，避免用回退度量排版却用 LXGW 绘制 |
| 全站 `<nav>` 无 `aria-label`（含 Hugo 自动生成的 `#TableOfContents`） | 扫描 536 页：**1971/1971** 无标签 | 4 个新 i18n key（主导航/章节导航/章节翻页/站点入口）；TOC 因标签由 Hugo 生成，在 `toc.html` 内注入 `aria-label` 并 `safeHTML` |
| 153 个 `<th>` 全部无 `scope`（WCAG 1.3.1） | 全站扫描 | 新增 `_markup/render-table.html`，逐字节复刻 Goldmark 输出（含 `style="text-align: …"`）只加 `scope="col"`。验收：**153/153**，且与改动前构建产物归一化比对**0 处差异** |
| 复制按钮成功无播报（WCAG 4.1.3） | 只把按钮文案换成「✓」 | 新增 `.code-copy-status`（`aria-live="polite"`）+ i18n `copied`；按钮 `aria-label` 保持稳定 |
| 0 字节 partial、缺失主题元数据、注释指向不存在的模板 | `head/font.html` 0 字节仍被 `partialCached` 调用 | 删除该 partial 及其调用；补 `themes/kiss/theme.toml`；修正 `main.css`/`novel-canvas.html` 里过期的注释 |

**刻意没做**（需要联网验证或属于输出格式/产品决策，另开一批）：

- `mermaid@11` / `mathjax@3` 固定版本 + SRI：本环境 `cdn.jsdelivr.net` 不可达，**无法确认某个精确版本是否存在**，不猜版本号。
- 图片交付管线（无 `.Process`、122 张图 0 尺寸、`/tech/` 首屏 9.36MB、移动 CLS 0.370）——需把 `static/img` 挂进 `assets/` 并改内容引用。
- 单文件 CSS 中约 36.8KB 未被首页使用；按页拆分的收益与维护成本需先定策略。
- 输出格式/SEO：11 个栏目 feed 是整站副本（`/shelf/rss.xml` 62 条含 106 个 `/log|/tech` 链接，而 `/shelf/` 是 Protect 轨）、`/zh/sitemap.xml` 列根路径 URL、非默认语言 `llms*.txt` 语言错配——改动牵涉 robots/sitemap/产品决策。

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
