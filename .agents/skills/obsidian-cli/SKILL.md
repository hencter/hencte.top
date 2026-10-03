---
trust_level: internal
name: obsidian-cli
description: 用 Obsidian 内置 CLI 读写库、搜索、管理属性/任务/标签、开发插件主题。中文触发词：Obsidian 命令行、库操作、属性设置、标签统计、反链查询、插件开发。Interact with Obsidian vaults using the Obsidian CLI to read, create, search, and manage notes, tasks, properties, and more. Also supports plugin and theme development with commands to reload plugins, run JavaScript, capture errors, take screenshots, and inspect the DOM. Use when the user asks to interact with their Obsidian vault, manage notes, search vault content, perform vault operations from the command line, or develop and debug Obsidian plugins and themes.
datetime: "2026-07-15T00:00"
lastmod: "2026-08-19T12:10"
tags:
  - 技术
  - 方法
  - 案例
type: rule
---

## 触发场景

- 用命令行读写 Obsidian 笔记
- 在库里搜索笔记内容或统计标签
- 批量修改笔记属性、任务或标签
- 查某条笔记的反链或改名并同步全库链接
- 开发调试 Obsidian 插件和主题

# Obsidian CLI

使用 Obsidian 内置 CLI（v1.12.7+）。**需要 Obsidian 在运行。**

**执行路径**：`C:\Program Files\Obsidian\Obsidian.com`

> 建议设置 alias：`Set-Alias -Name obs -Value "C:\Program Files\Obsidian\Obsidian.com"`

## 语法

**参数**用 `=` 赋值，含空格的参数需引号：

```bash
& "C:\Program Files\Obsidian\Obsidian.com" create name="My Note" content="Hello world"
```

**Flags** 是布尔开关，无需 `=`：

```bash
& "C:\Program Files\Obsidian\Obsidian.com" create name="My Note" overwrite
```

多行内容用 `\n` 换行、`\t` 制表。

## 文件定位

- `file=<name>` — 按 wikilink 解析（仅文件名，无需路径或扩展名）
- `path=<path>` — vault 根目录精确路径，如 `folder/note.md`

无 `file`/`path` 时默认操作当前活跃文件。

## Vault 定位

默认操作最近聚焦的 vault。用 `vault=<name>` 指定：

```bash
& "C:\Program Files\Obsidian\Obsidian.com" vault="My Vault" search query="test"
```

## 常用命令

```bash
& "C:\Program Files\Obsidian\Obsidian.com" read file="My Note"
& "C:\Program Files\Obsidian\Obsidian.com" create name="New Note" content="# Hello"
& "C:\Program Files\Obsidian\Obsidian.com" append file="My Note" content="New line"
& "C:\Program Files\Obsidian\Obsidian.com" search query="search term" limit=10
& "C:\Program Files\Obsidian\Obsidian.com" daily:read
& "C:\Program Files\Obsidian\Obsidian.com" daily:append content="- [ ] New task"
& "C:\Program Files\Obsidian\Obsidian.com" property:set name="status" value="done" file="My Note"
& "C:\Program Files\Obsidian\Obsidian.com" tasks daily todo
& "C:\Program Files\Obsidian\Obsidian.com" tags sort=count counts
& "C:\Program Files\Obsidian\Obsidian.com" backlinks file="My Note"
& "C:\Program Files\Obsidian\Obsidian.com" files total
```

`total` 返回计数。注：`create` 的 flag 仅有 name/path/content/template/overwrite/open/newtab（`help create` 实测）；`silent` 不存在，未知 flag 会被静默忽略。

## 完整命令列表

运行 `& "C:\Program Files\Obsidian\Obsidian.com" help` 查看最新命令。

### 文件操作
| 命令 | 说明 |
|------|------|
| `read` | 读取文件内容 |
| `create` | 创建新文件 |
| `append` | 追加内容到文件末尾 |
| `prepend` | 追加内容到文件开头 |
| `delete` | 删除文件（默认进回收站） |
| `move` | 移动或重命名 |
| `rename` | 重命名文件 |
| `open` | 在 Obsidian 中打开文件 |
| `file` | 显示文件信息 |
| `files` | 列出 vault 中所有文件 |
| `folder` | 显示文件夹信息 |
| `folders` | 列出 vault 中所有文件夹 |
| `random` | 打开随机笔记 |
| `random:read` | 读取随机笔记 |
| `unique` | 创建唯一文件名笔记 |
| `recents` | 列出最近打开的文件 |
| `reload` | 重新加载 vault |
| `restart` | 重启 Obsidian |

### 搜索
| 命令 | 说明 |
|------|------|
| `search` | 全文搜索 |
| `search:context` | 带上下文行的搜索 |
| `search:open` | 打开搜索视图 |

#### search 参数（`help search` 实测）

| 参数 | 说明 |
|------|------|
| `query=<text>` | 搜索式（必填） |
| `path=<folder>` | 限定文件夹 |
| `limit=<n>` | 最大返回文件数 |
| `total` | 只返回命中计数 |
| `case` | 区分大小写 |
| `format=text\|json` | 输出格式（json 输出文件路径数组） |

> [!warning] 能力边界（2026-08-19 实测）
> `search` **不支持任意 frontmatter 属性运算符**：`search query="type:note"` 实测报错 `Error: Operator "type" not recognized`。表达式中任何 `xxx:` 形式都会被当运算符解析，只有内置运算符可用（`file:` `path:` `tag:` 实测可用；`line:type:rule` 同样报错）。
> - 纯文本值可以搜到：`search query="v2.27.5"` 能命中 AGENTS.md 的 version 属性值（frontmatter 参与全文匹配，但 `属性:值` 语法不可用）
> - **按属性查询的正道**：单文件单属性用 `property:read`；任意条件筛选用 `eval`；结构化视图用 `base:query`

`search:context` 同参数，输出 `file:line` 前缀的匹配行（实测 2026-08-19），适合精确定位。

### 属性（Frontmatter）
| 命令 | 说明 |
|------|------|
| `properties` | 列出 vault 属性 |
| `property:read` | 读取属性值 |
| `property:set` | 设置属性 |
| `property:remove` | 移除属性 |

#### 参数细节（`help` 实测）

- `properties`：`file=`/`path=` 限定单文件；`name=<属性>` 取单属性计数；`total` 返回属性总数；`sort=count` 按出现次数排序；`counts` 附带计数；`format=yaml|json|tsv`；`active` 当前活跃文件
- `property:read`：`name=`（必填）+ `file=`/`path=`
- `property:set`：`name=` `value=`（必填）+ `type=text|list|number|checkbox|date|datetime` + `file=`/`path=`
- `property:remove`：`name=`（必填）+ `file=`/`path=`

> [!tip] Frontmatter 索引的 CLI 定位
> 属性读写走 `property:*`；**属性查询**（"哪些文件 type=moc"）走 `eval` 或 `base:query`，`search` 做不到（见上）。

### 任务
| 命令 | 说明 |
|------|------|
| `tasks` | 列出任务 |
| `task` | 显示/更新任务状态 |

`tasks` 参数（实测）：`total` 计数；`todo`/`done` 过滤；`status="<char>"` 按状态字符过滤；`verbose` 按文件分组带行号；`format=text|json|tsv|csv`（json 输出 `{status, text, file, line}` 数组，可直接程序化处理）；`file=`/`path=` 限定文件；`active` 当前活跃文件；`daily` 日记任务。`task` 更新：`ref=<path:line>` 精确定位 + `toggle`/`done`/`todo`/`status="<char>"`。

### 标签
| 命令 | 说明 |
|------|------|
| `tags` | 列出标签 |
| `tag` | 获取标签信息 |

### 链接
| 命令 | 说明 |
|------|------|
| `backlinks` | 列出指向文件的反链 |
| `aliases` | 列出别名 |
| `unresolved` | 列出未解析链接 |
| `deadends` | 列出无外链的文件 |
| `orphans` | 列出无入链的文件 |

### 日记
| 命令 | 说明 |
|------|------|
| `daily` | 打开日记 |
| `daily:read` | 读取日记 |
| `daily:append` | 追加到日记 |
| `daily:prepend` | 前插到日记 |
| `daily:path` | 获取日记路径 |

### Base（.base 文件）
| 命令 | 说明 |
|------|------|
| `bases` | 列出所有 base 文件 |
| `base:views` | 列出 base 的视图 |
| `base:create` | 在 base 中创建条目 |
| `base:query` | 查询 base |

`base:query` 参数：`file=`/`path=`（定位 .base 文件）+ `view=`（视图名）+ `format=json|csv|tsv|md|paths`（默认 json）。**Base 即"用 frontmatter 建索引"的原生方案**——需要按属性结构化检索时优先考虑建/查 base（本库已有 7 个，如 `50_Life/个人待办/个人待办看板.base`）。

### 书签
| 命令 | 说明 |
|------|------|
| `bookmark` | 添加书签 |
| `bookmarks` | 列出书签 |

### 模板
| 命令 | 说明 |
|------|------|
| `templates` | 列出模板 |
| `template:read` | 读取模板 |
| `template:insert` | 插入模板到活跃文件 |

### 大纲
| 命令 | 说明 |
|------|------|
| `outline` | 显示标题大纲 |

### 插件管理
| 命令 | 说明 |
|------|------|
| `plugins` | 列出已安装插件 |
| `plugins:enabled` | 列出已启用插件 |
| `plugins:restrict` | 切换/检查受限模式 |
| `plugin` | 获取插件信息 |
| `plugin:install` | 安装社区插件 |
| `plugin:uninstall` | 卸载社区插件 |
| `plugin:enable` | 启用插件 |
| `plugin:disable` | 禁用插件 |
| `plugin:reload` | 重载插件（开发者用） |

### 主题
| 命令 | 说明 |
|------|------|
| `themes` | 列出已安装主题 |
| `theme` | 显示活跃主题 |
| `theme:install` | 安装社区主题 |
| `theme:uninstall` | 卸载主题 |
| `theme:set` | 设置活跃主题 |

### 片段
| 命令 | 说明 |
|------|------|
| `snippets` | 列出 CSS 片段 |
| `snippets:enabled` | 列出已启用片段 |
| `snippet:enable` | 启用片段 |
| `snippet:disable` | 禁用片段 |

### 窗口/标签页
| 命令 | 说明 |
|------|------|
| `tabs` | 列出打开的标签页 |
| `tab:open` | 打开新标签页 |
| `workspace` | 显示工作区树 |

### 历史版本
| 命令 | 说明 |
|------|------|
| `history` | 列出文件历史版本 |
| `history:list` | 列出有历史的文件 |
| `history:read` | 读取历史版本 |
| `history:restore` | 恢复历史版本 |
| `history:open` | 打开文件恢复 |

实测（2026-08-19）：`history file=AGENTS.md` 输出版本表（编号/时间/大小，**version=1 是最新**）；`history:read file=X version=N` 输出该版本全文；`history:list` 输出很长（本库 5900+ 文件有历史），慎用或重定向。`history:restore version=<n>` 需显式指定版本号。

### 其他
| 命令 | 说明 |
|------|------|
| `vault` | 显示 vault 信息 |
| `vaults` | 列出已知 vault |
| `wordcount` | 统计字数/字符数 |
| `command` | 执行 Obsidian 命令 |
| `commands` | 列出可用命令 |
| `hotkeys` | 列出快捷键 |
| `hotkey` | 获取命令的快捷键 |
| `diff` | 列出/对比本地与同步版本 |
| `web` | 在 web 查看器中打开 URL |
| `version` | 显示 Obsidian 版本 |

实测参数（2026-08-19）：`vault` 输出 name/path/files/folders/size，`info=name|path|files|folders|size` 取单项；`wordcount` 输出 words/characters，`words`/`characters` flag 取单项；`outline` 支持 `format=tree|md|json`（json 为 `{level, heading, line}` 数组，结构化大纲）；`files` 支持 `folder=`/`ext=`/`total`（如 `ext=canvas` 统计 canvas 文件）；`diff` 依赖 Sync 且**必须显式 `file=`/`path=`**（无活跃文件报错）。

## 开发者工具

### 开发/测试流程

1. **重载**插件以加载修改：
   ```bash
   & "C:\Program Files\Obsidian\Obsidian.com" plugin:reload id=my-plugin
   ```
2. **检查错误**：
   ```bash
   & "C:\Program Files\Obsidian\Obsidian.com" dev:errors
   ```
3. **视觉验证**：
   ```bash
   & "C:\Program Files\Obsidian\Obsidian.com" dev:screenshot path=screenshot.png
   & "C:\Program Files\Obsidian\Obsidian.com" dev:dom selector=".workspace-leaf" text
   ```
4. **检查控制台**：
   ```bash
   & "C:\Program Files\Obsidian\Obsidian.com" dev:console level=error
   ```

### 其他开发命令

在 Obsidian 上下文中执行 JavaScript：

```bash
& "C:\Program Files\Obsidian\Obsidian.com" eval code="app.vault.getFiles().length"
```

**查询 frontmatter 的实战模板**（2026-08-19 实测，`=>` 前缀为返回值）：

```bash
# 全库 frontmatter 覆盖统计（含 type 值分布）
& "C:\Program Files\Obsidian\Obsidian.com" eval code="(() => { const files = app.vault.getMarkdownFiles(); let n = 0; const types = new Set(); for (const f of files) { const c = app.metadataCache.getFileCache(f); if (c && c.frontmatter) { n++; if (c.frontmatter.type) types.add(c.frontmatter.type); } } return JSON.stringify({ total: files.length, withFrontmatter: n, typeValues: [...types] }); })()"

# 按属性筛选文件列表（例：所有 type=moc 的笔记）
& "C:\Program Files\Obsidian\Obsidian.com" eval code="(() => { const files = app.vault.getMarkdownFiles(); const out = []; for (const f of files) { const c = app.metadataCache.getFileCache(f); const fm = c && c.frontmatter; if (fm && fm.type === 'moc') out.push(f.path); } return JSON.stringify({ count: out.length, sample: out.slice(0, 5) }); })()"
```

> [!note] eval 约定（实测）
> 代码必须写成 IIFE `(() => {...})()` 并 `return JSON.stringify(...)` 才能稳定返回；`app.vault.getMarkdownFiles()` + `app.metadataCache.getFileCache(f)` 是读 frontmatter 的标准路径。**eval 是 CLI 中唯一能任意查询 frontmatter 的入口**。
>
> **发 Notice 通知（2026-08-19 实测）**：`eval code="(() => { new Notice('文本'); return 'ok'; })()"` 可在 Obsidian 界面弹出右上角通知——用于任务完成/报告就绪等提醒。`new Notice` 是 Obsidian 全局类，无需 import；返回值随意（`'ok'` 即可）。

检查 CSS 值：

```bash
& "C:\Program Files\Obsidian\Obsidian.com" dev:css selector=".workspace-leaf-content" prop="background-color"
```

| 命令 | 说明 |
|------|------|
| `dev:cdp` | 执行 Chrome DevTools Protocol 命令 |
| `dev:console` | 查看捕获的控制台消息 |
| `dev:css` | 检查 CSS 属性及源位置 |
| `dev:debug` | 附加/分离 CDP 调试器 |
| `dev:dom` | 查询 DOM 元素 |
| `dev:errors` | 查看捕获的错误 |
| `dev:mobile` | 切换移动端模拟 |
| `dev:screenshot` | 截图 |
| `devtools` | 切换 Electron DevTools |
| `eval` | 执行 JavaScript 并返回结果 |

## 职责边界

- **语法细节**（wikilink/callout/frontmatter）→ `obsidian-markdown`
- **结构层**（PARA 定位/Inbox/MOC）→ `obsidian-vault`
- **标签校验**（白名单权威）→ `cross-tag-validator`
- 本 skill 只做 **Obsidian 运行时能力**：tags 权威快照、unresolved 断链、属性/任务操作、插件主题开发

> [!warning] AGENTS.md L8 检索优先
> 库内普通检索优先 read/grep/glob；**CLI 检索仅用于需要 Obsidian 运行时能力的场景**（`tags` 权威快照、`unresolved` 断链、插件开发、DOM 检查）。Windows 控制台中文可能乱码——输出重定向到文件再读（跨库铁律）。

## 失败模式与兜底

| 触发条件 | 一线修复 | 仍失败兜底 |
|----------|---------|------------|
| Obsidian 未运行 | 先启动 Obsidian 再执行 | 用 read/grep/glob 代替 |
| 命令不存在（如 links） | 运行 `help` 查最新命令表 | 用等价命令（外链查询用 `help` 或 Obsidian 界面） |
| 文件名重名/解析歧义 | 用 `path=` 精确路径 | 用 `files` 列出确认 |
| search 无结果 | 检查 query 引号与大小写 | 换关键词或用 grep 兜底 |
| 控制台中文乱码 | 输出重定向到临时文件再读 | 用 `eval` 返回 JSON |
| 未知 flag 静默忽略 | 先 `help <command>` 确认 flag | 按 help 输出重写命令 |
| search 报 `Operator "xxx" not recognized` | 属性运算符不支持：改用 `eval` / `base:query` / `property:read` | 纯文本值直接搜（frontmatter 参与全文匹配） |

## 检查点（执行 CLI 操作后）

- [ ] 命令经 `help` 确认存在（勿信旧文档）
- [ ] 参数用 `=` 赋值、含空格加引号
- [ ] 库内检索已优先 read/grep/glob（非 CLI 场景）
- [ ] 输出中文正常（乱码则重定向文件）
- [ ] 涉及删除/移动已确认目标

## 反例与黑名单

| 禁止 | 原因 |
|------|------|
| 禁止照抄未实测的命令（如 `links`） | 实测不存在，照抄即失败 |
| 禁止用不存在的 flag（如 `silent`） | 被静默忽略，行为不符 |
| 禁止用 `属性:值` 语法搜 frontmatter（如 `search query="type:note"`） | 实测报错 `Operator "type" not recognized`，`search` 不认属性运算符 |
| 禁止普通检索用 CLI 而非 read/grep/glob | 违反 AGENTS.md L8 |
| 禁止用 PowerShell Out-File 保存 CLI 输出 | 中文乱码（库内数据入库规则） |
| 禁止在 Obsidian 未运行时执行 CLI | 命令不可用 |
