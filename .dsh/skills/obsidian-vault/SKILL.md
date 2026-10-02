---
trust_level: internal
name: obsidian-vault
description: 本库（PARA 结构）Vault 级运维路由——定位笔记归属、创建/更新 MOC 索引、处理 Inbox、跨目录导航；文件语法细节委托 obsidian-markdown，标签校验委托 cross-tag-validator。当用户需要找笔记、整理笔记、建索引、处理收件箱、判断内容归哪个目录时使用。中文触发词：找笔记、整理笔记、建索引、MOC、收件箱、归位、知识库结构。
datetime: "2026-06-07T13:39"
lastmod: "2026-08-18T17:30"
tags:
  - 技术
  - 方法
  - 案例
type: task
---

## 触发场景

- 在库里找笔记、判断某内容该放哪个目录（PARA 定位）
- 创建/更新 MOC 索引（`70_MOCs/*-MOC.md`）、处理 `00_Inbox/`
- 跨目录导航、找相关笔记与反链
- 结构性整理（移动/重命名后更新链接）

> [!warning] 边界声明（避免越界）
> - 文件**语法**（wikilink/callout/frontmatter）→ 加载 `obsidian-markdown`
> - 标签**校验**（白名单）→ 加载 `cross-tag-validator`
> - 本 skill 只做**结构层**：定位、归位、索引、导航。不重复语法细节。

## 本库结构（PARA 定位速查）

| 目录 | 放什么 | 谁操作 |
|------|--------|--------|
| `00_Inbox/` | 临时待处理内容 | 亦幸 + 工具采集 |
| `10_Projects/` | 有明确目标和时间线的任务 | 幸知 |
| `20_Areas/` | 持续关注的责任范围 | 幸知 |
| `30_Resources/` | 感兴趣暂无行动的内容（只读） | 亦幸 + 工具 |
| `40_Journal/` | 日志、思考、复盘 | 幸知 |
| `50_Life/` | 生活信息、习惯、偏好 | 幸知 |
| `70_MOCs/` | 主题索引（`*-MOC.md`） | 幸知 |
| `80_Zettelkasten/` | 原子化知识卡片 | 幸知 |
| `90_Profile/` | 个人身份、简历、成就 | 幸知 |
| `99_Archive/` | 已完成/不再活跃 | 幸知 |
| `template/` | 可复用笔记模板 | 幸知 |
| `skills/` | 技能文档（根级） | 幸知 |

## 工作流

### 定位：内容该放哪（输入：内容类型；输出：目标目录）

| 内容类型 | 归位 |
|----------|------|
| 新闻/外部文章 | `30_Resources/新闻情报/` 或相关资源子目录 |
| 直播实录/项目回顾 | `10_Projects/<项目>/` |
| 方法论/概念 | `80_Zettelkasten/`（原子化卡片）+ `70_MOCs/` 索引 |
| 待办/计划 | `50_Life/个人待办/` |
| 临时未分类 | `00_Inbox/`（每日检查清空） |

### 处理 Inbox（输入：Inbox 内容；输出：归位 + 索引更新）

1. 读取 `00_Inbox/` 全部内容
2. 按上表逐项定位 → 移动（git mv 或 Move-Item + git add）
3. 更新涉及的 MOC 索引
4. 空库确认，追加 `memory/session-log.md` 记录

### 建/更新 MOC（输入：主题名；输出：`70_MOCs/主题-MOC.md`）

- 命名：中文标题 + `-MOC` 后缀（如 `Obsidian-MOC.md`）
- 结构：frontmatter（type: index + datetime + tags 白名单）+ 分类链接列表
- 大主题才建 MOC；单卡片不建
- 用 `[[wikilink]]` 链接成员笔记

### 找笔记/反链（输入：关键词/笔记名；输出：命中列表）

- 优先 read/grep/glob（AGENTS.md L8：检索优先，shell 兜底）
- 反链：grep `[[笔记名]]` 全库
- 断链检查：Obsidian CLI unresolved 或周末维护流程

### 移动/重命名（输入：旧路径 + 新路径；输出：git 移动 + 链接修复）

1. `git mv` 或 Move-Item + git add（untracked 文件）
2. 全局搜索旧名引用，更新 `[[wikilink]]`
3. 更新相关 MOC
4. 验证可跳转

## 失败模式与兜底

| 触发条件 | 一线修复 | 仍失败兜底 |
|----------|---------|------------|
| 不确定内容归哪个目录 | 按 PARA 语义逐项排除（项目？领域？资源？） | 先放 00_Inbox，标注"待亦幸定夺" |
| MOC 与已有索引重叠 | 检查 `70_MOCs/` 是否已有同主题索引，并入而非新建 | 在现有 MOC 加小节 |
| 移动后 wikilink 断裂 | 全局 grep 旧名，逐个更新 | Obsidian 重命名追踪（库内编辑移动） |
| git mv 失败（untracked） | 用 Move-Item + git add | 保留原位，标注待处理 |
| Inbox 内容无法分类 | 列出候选目录给亦幸确认 | 留在 Inbox 并标注原因 |

## 检查点（结构性操作后逐条过）

- [ ] 文件已在正确 PARA 目录（非临时乱放）
- [ ] MOC 已更新（涉及大主题时）
- [ ] 移动/重命名后 wikilink 无断裂（grep 验证）
- [ ] 标签 ∈ 白名单（cross-tag-validator）
- [ ] frontmatter 完整（type/datetime/tags）
- [ ] 已追加 session-log 记录

## 反例与黑名单

| 禁止 | 原因 |
|------|------|
| 禁止用英文 Title Case 命名笔记 | AGENTS.md L3：中文标题 |
| 禁止在根级散落文件（无文件夹） | PARA 结构是库的骨架 |
| 禁止绕过 obsidian-markdown 直接写语法 | 语法细节以该 skill 为准 |
| 禁止用 shell find/grep 当首选检索 | AGENTS.md L8：read/grep/glob 优先 |
| 禁止移动后不更新链接 | 断链污染图谱 |
| 禁止把 `00_Inbox/` 当长期存放处 | 每日检查、当日或次日清空 |
