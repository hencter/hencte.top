+++
title = "短代码速查"
description = "本站自带的短代码：提示框、插图、章节引用、朱红印章、竖排诗、纯 CSS 标签页。"
date = 2026-10-03T21:30:00+08:00
draft = true
+++

这是一页**草稿**（`draft = true`）：`hugo server -D` 或 `hugo -D` 能看到，正式构建不会发布。
下面六个短代码都在 `layouts/shortcodes/`，共同约定是**零 JavaScript、断网可构建、样式只用在主题里已有的 token**（宣纸 / 朱红 / 暖灰），因此自动跟随暗色。

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

## tabs — 纯 CSS 标签页

`input:checked + label + .tab-panel` 一条相邻选择器搞定切换，**没有 JavaScript**；同一页多组标签页靠父级序号分组，互不干扰。键盘可用（单选组原生支持方向键）。

{{< tabs >}}
{{< tab name="PowerShell" >}}
```powershell
# 找出还没发布的草稿
Select-String -Path content\zh\**\*.md -Pattern 'draft\s*=\s*true' |
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

> 写这一页时踩到过 Hugo 的第二个内容级地雷：短代码占位符的字面串一旦出现在正文或**围栏代码块**里，会让整站构建失败、且报错指向别处。
> 要展示它必须在中间插入零宽字符：H&#xfeff;AHAHUGOSHORTCODE（实体写在代码 span 之外，否则读者会看到实体本身）。
> 同理，示例里的短代码语法必须写成 `{{</* note */>}}` 这种转义形式（见上文各节的写法块）。

```go-html-template
{{</* tabs */>}}
{{</* tab name="PowerShell" */>}}…{{</* /tab */>}}
{{</* tab name="bash" */>}}…{{</* /tab */>}}
{{</* /tabs */>}}
```

## 还有两个内置的

- `{{</* kbd */>}}Ctrl`+`K{{</* /kbd */>}}` → 键盘按键样式；
- `{{</* year */>}}` → 当前年份（避免版权年份写死后过期）。
