---
trust_level: internal
name: obsidian-markdown
description: 创建和编辑 Obsidian 风格 Markdown——wikilink 双链、嵌入、callout、frontmatter 属性、标签等 Obsidian 专属语法。处理 .md 文件、用户提到 wikilink/callout/frontmatter/tags/embeds/Obsidian 笔记时使用。中文触发词：双链、嵌入、提示框、笔记格式、Obsidian 语法。
datetime: "2026-06-07T13:39"
lastmod: "2026-09-14T02:00"
tags:
  - 技术
  - 方法
  - 案例
type: task
---

## 触发场景

- 写 Obsidian 笔记、用双链（wikilink）链接笔记
- 给笔记加 callout 提示框、frontmatter 属性、标签
- 在笔记里嵌入图片、PDF 或其他笔记内容
- 处理 `00_Inbox/`、`80_Zettelkasten/`、`70_MOCs/` 等目录下的 .md 文件

# Obsidian Flavored Markdown Skill

创建和编辑合法的 Obsidian 风格 Markdown。Obsidian 在 CommonMark/GFM 之上扩展了 wikilink、嵌入、callout、属性、注释等语法。本 skill 只覆盖 Obsidian 专属扩展——标准 Markdown（标题、粗体、斜体、列表、引用、代码块、表格）视为已知知识。

> [!warning] 本库强制协议（写任何笔记前必过）
> 1. frontmatter 必填 `type`（词汇表见 cross-tag-validator）与 `datetime`
> 2. `tags` 值必须 ∈ 十字标签法白名单（Y 轴：生活/方法/原理/概念/目标/学习/工作/技术；X 轴：故事/案例/金句/感受/观点）——禁止自造白名单外标签
> 3. 禁止给已有旧 frontmatter 的文件追加第二个 YAML 块（单一 YAML 块铁律）
> 4. 正文 `#话题` 需转义为 `\#话题`（避免被当作标签）

## Workflow: Creating an Obsidian Note

1. **Add frontmatter**（输入：笔记主题；输出：合法 YAML 头）——`type`/`datetime`/`tags` 必填，标签 ∈ 白名单。属性类型见 [PROPERTIES.md](references/PROPERTIES.md)。
2. **Write content**（输入：frontmatter；输出：正文）——标准 Markdown 结构 + 下方 Obsidian 专属语法。
3. **Link related notes**（输入：正文；输出：双链）——库内笔记用 wikilink，外部 URL 用 Markdown 链接。
4. **Embed content**（输入：目标笔记/图片/PDF；输出：嵌入）——用 `![[...]]` 语法，见 [EMBEDS.md](references/EMBEDS.md)。
5. **Add callouts**（输入：正文段落；输出：提示框）——`> [!type]` 语法，见 [CALLOUTS.md](references/CALLOUTS.md)。
6. **Verify**（输入：成稿；输出：渲染确认）——逐条过「检查点」，确认 wikilink 可跳转、callout 渲染、frontmatter 单一闭合。

## Internal Links (Wikilinks)

```markdown
[[Note Name]]                        Link to note
[[Note Name|Display Text]]           Custom display text
[[Note Name#Heading]]                Link to heading
[[Note Name#^block-id]]              Link to block
[[#Heading in same note]]            Same-note heading link
[[Note Name#^block-id|自定义文字]]    块引用+自定义显示（本库段落引用协议）
```

> [!tip] 段落级引用（本库协议）
> 引用外部原文必须段落级：`[[原文#^块ID]]`（块 ID 定义见下），验证可跳转才算完成。

Define a block ID by appending `^block-id` to any paragraph:

```markdown
This paragraph can be linked to. ^my-block-id
```

For lists and quotes, place the block ID on a separate line after the block:

```markdown
> A quote block

^quote-id
```

## Embeds

Prefix any wikilink with `!` to embed its content inline:

```markdown
![[Note Name]]                        Embed full note
![[Note Name#Heading]]                Embed section
![[image.png]]                        Embed image
![[image.png|300]]                    Embed image with width
![[document.pdf#page=3]]              Embed PDF page
```

See [EMBEDS.md](references/EMBEDS.md) for audio, video, search embeds, and external images.

## Callouts

```markdown
> [!note]
> Basic callout.

> [!warning] Custom Title
> Callout with a custom title.

> [!faq]- Collapsed by default
> Foldable callout (- collapsed, + expanded).
```

Common types: `note`, `tip`, `warning`, `info`, `example`, `quote`, `bug`, `danger`, `success`, `failure`, `question`, `abstract`, `todo`, `important`, `caution`, `help`, `check`, `done`, `cite`, `summary`, `hint`, `missing`, `error`, `pinned`, `search`, `stop`, `tldr`, `key`, `activity`, `chart`, `graph`, `image`, `map`, `people`, `table`, `video`, `story`, `idea`, `pros`, `cons`.

> [!note] 本库 callout 惯例
> 关键结论用 `> [!note]`、警告用 `> [!warning]`、提示用 `> [!tip]`、引用用 `> [!quote]`（见 AGENTS.md L3 笔记质量标准）。

## 失败模式与兜底

| 触发条件 | 一线修复 | 仍失败兜底 |
|----------|---------|------------|
| wikilink 不跳转（断链） | 检查目标文件是否存在/被移动，用 `[[文件名]]` 精确匹配 | glob 搜索目标，更新链接路径 |
| callout 不渲染（显示为纯引用） | 检查 `> [!type]` 首行格式（类型后跟空格+标题） | 删除空行问题，确保块内每行都有 `>` 前缀 |
| frontmatter 解析失败 | 检查单一 YAML 块、闭合分隔线 `---` | 用 `python scripts/scan_dup_frontmatter.py` 复扫归零 |
| 标签不在白名单 | 换成白名单标签（cross-tag-validator 校验） | 无法归类时问亦幸，不自造标签 |
| embed 不显示 | 检查 `!` 前缀与 `[[ ]]` 定界符 | 确认目标文件存在；图片过大需压缩（AGENTS L3） |
| 正文 `#话题` 被识别为标签 | 转义为 `\#话题` | 用 Obsidian CLI `obsidian tags` 验证全库无新增标签 |
| 表格里的双链不跳转／把一行撑成多列 | 别名竖线写成 `\|`（裸写竖线会被当单元格分隔符，`[[…\|别名]]` 被切成两半、沦为哑文本），并去掉目标尾部多余的 `/` | ⚠️ `obsidian unresolved` **查不出哑文本**（切碎的链接根本不进索引），要用 `obsidian backlinks path=<目标.md>` 抽查反链是否产生；`python scripts/vault_check.py --only tablelink` 可全库扫 |

## 检查点（成稿后逐条过）

- [ ] frontmatter 单一 YAML 块、闭合分隔线，`type` ∈ 词汇表、`datetime` 存在
- [ ] `tags` 全部 ∈ 十字标签法白名单（Y+X 双维）
- [ ] 库内笔记链接全部用 `[[wikilink]]`（外部 URL 才用 `[text](url)`）
- [ ] 表格单元格内的双链别名已写 `\|`，且目标不带尾斜杠
- [ ] 段落级引用符合 `[[原文#^块ID]]` 协议且可跳转
- [ ] callout 语法正确（首行 `> [!type]`，块内每行 `>` 前缀）
- [ ] 正文无未转义的 `#话题`
- [ ] 涉及批量 frontmatter 修改 → 已跑 scan_dup 复扫 0 命中
- [ ] commit 前跑 `obsidian tags` 确认无新增标签

## 反例与黑名单

| 禁止 | 原因 |
|------|------|
| 禁止自造白名单外标签（如 `tags: [project, important]`） | 违反标签白名单铁律，照抄 PROPERTIES 旧示例即违规 |
| 禁止用 Markdown 链接指向库内笔记 | 丢 Obsidian 重命名追踪/反链能力 |
| 禁止正文未转义的 `#话题` | 会被识别为标签污染图谱 |
| 禁止给旧文件追加第二个 YAML 块 | 违反 frontmatter 完整性协议 |
| 禁止 wikilink 不加 `[[ ]]` 定界符 | 无法成链，只是纯文本 |
| 禁止 embed 忘加 `!` 前缀 | 变成普通链接而非嵌入 |
| 禁止 `.base`/`.canvas` 文件当 Markdown 处理 | 格式不同，用 obsidian-bases/json-canvas skill |
