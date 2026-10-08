+++
aliases = ['/tech/hugo/content-types/']
categories = ['内容管理']
date = '2023-04-13T14:05:22+08:00'
description = 'Hugo 的内容类型（type）：怎么在 front matter 里设置 type，模板目录又是怎么命中的。'
lastmod = '2026-10-05T02:30:00+08:00'
draft = false
tags = ['Hugo', 'Content']
title = '内容类型与模板查找'
+++
## 什么是内容类型？

官方给出的回答：

> Hugo assumes that the same structure that works to organize your source content is used to organize the rendered site.

简单翻译一下：Hugo 假设「用来组织源内容的结构」同样用来组织渲染出的站点[^1]。

内容类型是一种组织内容的方式。

Hugo 从 front matter 的 `type` 字段中解析内容类型。

如果没有设置那么，类型就是第一个目录的目录名。

例如： 如果没有设置类型，content/blog/my-first-event.md 将是 blog 类型。

## 手动在 front matter 中设置类型

```md
+++
title = " "
type = "blog"
+++
```

那么在模版中如果有 `layout/blog/目录`

[^1]: Hugo Documentation, Content organization. <https://gohugo.io/content-management/organization/>（访问 2026-10-04）
