+++
title = "短代码速查"
description = "本站短代码全表：提示框、插图、多图网格、章节引用、朱红印章、竖排诗、纯 CSS 标签页、剧透折叠、目录树、时间线，以及可直接使用的 Hugo 内置短代码。"
date = 2026-10-03T21:30:00+08:00
lastmod = 2026-10-04T23:30:00+08:00
+++

本站自带 **10 个短代码**（模板在 `layouts/shortcodes/`），另可直接使用 **6 个 Hugo 内置短代码**。
共同约定是**零 JavaScript、断网可构建、样式只用在主题里已有的 token**（宣纸 / 朱红 / 暖灰），因此自动跟随暗色。

每个短代码的注释里都写了「为什么这样做」——改之前先读那一页的注释头。

## note — 提示框

与 Obsidian 的 `> [!NOTE]` 走同一套类名，所以配色、图标位、折叠行为完全一致。

{{< note >}}默认类型。正文支持 **Markdown**、[链接](/about/) 与 `行内代码`。{{< /note >}}

{{< note type="tip" title="小技巧" >}}标题可以自定义；类型只决定标题的语气色（朱红＝警示类，暖灰＝引用类），卡片本身与站点其他卡片是同一套样式。{{< /note >}}

{{< note type="warning" fold="true" >}}给 `fold="true"` 就变成可折叠的 —— 点标题展开；再加 `open="true"` 则默认展开。{{< /note >}}

写法（示例里的短代码语法必须转义，否则会被 Hugo 当成真调用）：

```go-html-template
{{</* note type="tip" title="小技巧" */>}}正文{{</* /note */>}}
{{</* note type="warning" fold="true" open="true" */>}}正文{{</* /note */>}}
```

## pic — 插图

走站点的图片解析器：`/img/…` 查 `assets/`，相对路径查本页页包，命中后自动补 `width`/`height`（不留 CLS 空间空洞）。

{{< pic src="/img/projects/nova.webp" alt="Nova 知识库封面" caption="**墨纸底上的青瓷星图** —— 图注支持 Markdown；`class=\"mx-auto max-w-md\"` 这类原子类会附加到 figure 上。" >}}

```go-html-template
{{</* pic src="/img/projects/nova.webp" alt="封面" caption="图注" */>}}
{{</* pic src="screenshot.png" alt="页包内的图" eager="true" */>}}
```

## gallery — 多图网格

一行一张图，写作 `路径|图注`（图注可省）。图片仍走 `pic` 用的同一个解析器，所以尺寸、暗色、圆角都一致；排版只用 grid 原子类，窄屏单列、平板两列、桌面按 `cols` 分列。

{{< gallery cols="3" >}}
/img/projects/nova.webp|Nova 知识库
/img/projects/linktrust.webp|LinkTrust 友链
/img/projects/tongtianlu.webp|通天路
{{< /gallery >}}

```text
{{</* gallery cols="3" */>}}
/img/a.webp|图注一
/img/b.webp
{{</* /gallery */>}}
```

注意：图注是纯文本且**同时用作 `alt`**，所以图注里不要写 Markdown、也不要用半角 `|`。

## chapter — 章节引用

按 `novel` + `chapter` 两个字段查找，书名或顺序变了也不会指错；写错章节号会**当场构建失败**（本站带 `--panicOnWarning`），不留静默死链。

《天空税》第 12 章是 {{< chapter novel="sky-tax" n="12" >}}，第 3 章是 {{< chapter novel="sky-tax" n="3" >}}。

```go-html-template
{{</* chapter 12 */>}}                      ← 引用本书（沿用当前页的 novel 字段）
{{</* chapter novel="sky-tax" n="12" */>}}  ← 跨书引用
```

## seal — 朱红印章

站点的强调色本来就取自「宣纸上的朱红印记」，这个短代码让正文也能盖一枚。

落款 {{< seal >}}亦幸{{< /seal >}}，小印 {{< seal size="sm" >}}阁{{< /seal >}}，圆印 {{< seal shape="round" size="lg" >}}幸{{< /seal >}}。

```go-html-template
{{</* seal */>}}亦幸{{</* /seal */>}}
{{</* seal size="sm" shape="round" */>}}幸{{</* /seal */>}}
```

## verse — 竖排诗

竖排用 `writing-mode: vertical-rl`，行由原文换行决定；**窄屏自动回落横排**（手机上的竖排只能靠横向拖拽，不划算）。

{{< verse cite="陆游《游山西村》" >}}
莫笑农家腊酒浑
丰年留客足鸡豚
山重水复疑无路
柳暗花明又一村
{{< /verse >}}

也可以横排、带上出处：

{{< verse mode="horizontal" cite="《周易》" >}}
天行健，君子以自强不息
地势坤，君子以厚德载物
{{< /verse >}}

```text
{{</* verse cite="陆游《游山西村》" */>}}
山重水复疑无路
柳暗花明又一村
{{</* /verse */>}}
```

## spoiler — 剧透折叠

小说、书评、评测里把情节藏起来。与 `note fold="true"` 的差别是：**默认收起**，而且标题刻意弱化为次要色——「有内容被藏起来」不该和「这段内容被标注了」长得一样。

{{< spoiler >}}天空税第 12 章里，铜级人生真正的代价在第 3 段才说出口：**读者第一次知道配额是可以转让的**。{{< /spoiler >}}

标题可以覆盖，也可以默认展开：

{{< spoiler label="剧透警告：结局" open="true" >}}结局那一场雨里，她把印章按进了泥里 —— 这是全书的最后一个动作。{{< /spoiler >}}

```go-html-template
{{</* spoiler */>}}正文{{</* /spoiler */>}}
{{</* spoiler label="剧透警告：结局" open="true" */>}}正文{{</* /spoiler */>}}
```

不带 `label` 时取 i18n 的 `spoiler` 键，四语各自成句（`i18n/{zh,en,tw,hk}.toml`）。

## tabs — 纯 CSS 标签页

`input:checked + label + .tab-panel` 一条相邻选择器搞定切换，**没有 JavaScript**；同一页多组标签页靠父级序号分组，互不干扰。键盘可用（单选组原生支持方向键）。

{{< tabs >}}
{{< tab name="PowerShell" >}}
```powershell
# 找出还没发布的草稿
Select-String -Path content\**\*.md -Pattern 'draft\s*=\s*true' |
  Select-Object -ExpandProperty Path -Unique
```
{{< /tab >}}
{{< tab name="bash" >}}
```bash
# 找出正文里的待办标记
grep -rn 'TODO\|FIXME' content/ || echo 'clean'
```
{{< /tab >}}
{{< tab name="Hugo" >}}
`hugo --ignoreCache --panicOnWarning` 会把任何警告升级为构建失败——这也是上面两条命令要在提交前跑的原因。
{{< /tab >}}
{{< /tabs >}}

```go-html-template
{{</* tabs */>}}
{{</* tab name="PowerShell" */>}}…{{</* /tab */>}}
{{</* tab name="bash" */>}}…{{</* /tab */>}}
{{</* /tabs */>}}
```

## filetree — 目录树

等价于 `tree` 的输出：内容按原样转义，所以 `<`、`&`、`|` 都不会被当成 HTML 或 Markdown；窄屏横向滚动而不是折行（折行会让父子层级失真）。

{{< filetree title="本站仓库结构（节选）" >}}
content/
├── zh/            简体（默认语言 → /）
├── en/            英文（→ /en/）
├── tw/            繁體台灣（→ /tw/，由 pnpm variants 生成）
└── hk/            繁體香港（→ /hk/，同上）
layouts/
├── shortcodes/    本页这些短代码
└── _partials/     项目内局部模板
themes/kiss/       主题：baseof / home / page / render hooks
{{< /filetree >}}

```text
{{</* filetree title="仓库结构" */>}}
content/
├── zh/
└── en/
{{</* /filetree */>}}
```

为什么不用 GoAT 把目录树画成 SVG？下一节有实测数据：**中文会被挤到重叠**，所以这里保持等宽文本。

## goat — ASCII 图 → SVG（构建期，零 JS）

`goat` 不是短代码，而是**代码块语言**：写 ```` ```goat ```` 围栏，Hugo 在构建期把它变成 SVG。
线条用 `currentColor`，因此自动跟随暗色；宽图在窄屏等比缩放。图注写在围栏属性 `caption` 里
（Hugo 内建钩子会忽略 `caption`，本站用 `themes/kiss/layouts/_markup/render-codeblock-goat.html` 补上）。

```goat {caption="本站构建链：内容目录 → Hugo → public/ → Cloudflare 静态资源"}
.-----------.    .-----------.    .-----------.    .-----------.
| content   +--->| Hugo      +--->| public    +--->| Cloudflare|
'-----------'    '-----------'    '-----------'    '-----------'
```

````text
```goat {caption="图注写在这里"}
.---.     .-.       .-.
| A +--->| 1 |<--->| 2 |
'---'     '-'       '+'
```
````

**两条实测边界**（Hugo 0.167，本机实测）：

1. **中文不要放进图里**。GoAT 把每个字符排到 8px 网格上（实测相邻汉字 x=152/160/168/176），
   全角汉字约 13–16px 宽，必然重叠。规则：**图里用 ASCII 标签，中文写进 `caption`**。
   这也是本站 `filetree` 故意不改成 GoAT 的原因——目录树是可复制、可搜索的等宽文本。
2. **不是图形也不报错**。随便一段文字会被逐字符渲染成 SVG 文本（实测退出码 0），
   所以"图画歪了"不会有任何提示，写完记得看一眼。

## timeline — 时间线

一行一件事：`时间|标题|说明`，后两段可省。输出语义化 `<ol>`，零 JS；说明段支持 Markdown。

{{< timeline >}}
2026-10|Astro → Hugo 迁移完成|四语站点、569 页，URL 与旧站逐条对齐，旧路径以 `aliases` 保留
2026-10|构建链定型|`pnpm generate`（OpenCC 繁化 + Tailwind）先于 `hugo` 运行
2026-10|短代码表补齐|新增 gallery / spoiler / filetree / timeline 四个
{{< /timeline >}}

## Hugo 内置短代码

这些不用写模板，Hugo 自带；下面是本站实测可用的六个。

### ref / relref — 内部链接（构建期校验）

把页面路径交给 Hugo 解析：**写错就构建失败**，不会留静默死链（站点曾经在迁移时手工对齐过一批旧路径，这类链接正是需要机器看住的地方）。

- `ref` 输出绝对地址：[关于本站]({{< ref "/about" >}})
- `relref` 输出根相对地址：[关于本站]({{< relref "/about" >}})

```go-html-template
[关于本站]({{</* ref "/about" */>}})
[关于本站]({{</* relref "/about" */>}})
```

### highlight — 带行号 / 高亮行的代码块

比围栏代码块多出 `linenos`、`hl_lines`、`linenostart` 这些选项：

{{< highlight go "linenos=table,hl_lines=2" >}}
func main() {
	println("这一行被 hl_lines 标出来了")
}
{{< /highlight >}}

```go-html-template
{{</* highlight go "linenos=table,hl_lines=2" */>}}
代码
{{</* /highlight */>}}
```

### param — 读站点参数

{{< param "title" >}} 是 `hugo.toml` 里 `[params]` 的 `title`；`{{</* param "author" */>}}` 同理。
好处是同一个说法只写一遍，页面之间不会各写各的。

### qr — 二维码（构建期生成，零网络）

{{< qr text="https://hencte.top/" />}}

两个实测细节：它生成的是**一张 PNG**（不是内联 SVG），且 Hugo 按模板是否用 `.Inner` 判断能否自闭合 —— 所以必须写成自闭合 `{{</* qr text="…" */>}}`，或写成配对形式 `{{</* qr */>}}文本{{</* /qr */>}}`；写成 `{{</* qr text="…" */>}}`（带参数又不闭合）会直接构建失败。

### figure — 本站的图**不要**用它

实测结论：内置 `figure` 不经过本站的 `_partials/img.html`，它**不解析 `assets/`**，指到一个不存在的文件也**不报错**——构建照常 exit 0，页面上留一条死链。本站图片全部在 `assets/img/`，所以统一用 `pic`。
只有图片放在**页包**里（和文章同一个目录）时，`figure` 才值得用，那时它能拿到尺寸并做处理。

```go-html-template
{{</* figure src="页包内相对路径.png" title="标题" caption="图注" */>}}
```

### youtube — 视频嵌入（本站暂无视频内容，只登记不嵌入）

它会输出一个 `youtube.com/embed` 的 `<iframe>`（默认 `loading="eager"`），也就是给页面加一个外部请求。本站正文目前没有视频，所以这里不嵌入真实视频，避免文档页莫名其妙地请求第三方。

```go-html-template
{{</* youtube id="视频 ID" */>}}
```

> 写这一页时踩到过 Hugo 的两个内容级地雷：短代码占位符的字面串一旦出现在正文或**围栏代码块**里，会让整站构建失败、且报错指向别处。
> 要展示它必须在中间插入零宽字符：H&#xfeff;AHAHUGOSHORTCODE（实体写在代码 span 之外，否则读者会看到实体本身）。
> 同理，上面每个示例里的短代码语法都必须写成 `{{</* note */>}}` 这种转义形式。
