+++
categories = ['简码', '演示']
date = '2023-04-13T00:09:30+08:00'
draft = true
slug = 'shortcode'
tags = ['Shortcode']
title = 'Shortcode'
+++

## 说明

Shortcode 用于再 Makrdown 中扩展一些 Makdown 本身不支持的特性。

## 使用 Hugo 的内置简码

### `<figure>` 可附标题内容元素

{{< figure src="/imgs/avatar.jpg" caption="了解更多：" attr="亦幸" attrlink="/about" >}}

### Gitub Gist

~~`{{< gist hencter 74114b0f07510d24b70b1a7f2def0596 >}}`~~

---

~~`{{< gist hencter 74114b0f07510d24b70b1a7f2def0596   darkmode.js >}}`~~

~~`{{< gist hencter 74114b0f07510d24b70b1a7f2def0596  hugo-markdown.scss  >}}`~~

### vimeo

{{< vimeo 55073825 >}}

### youtube

{{< youtube w7Ft2ymGmfc >}}

### 代码高亮

强调部分代码，

{{< highlight go "linenos=ture,hl_lines=2 7 3-5,linenostart=1" >}}
package main

import "fmt"

func main() {
fmt.Println("Hello, 世界")
}
{{< /highlight >}}

## 创建自己的简码

参阅：<https://gohugo.io/templates/shortcode-templates/>

{{< year >}}

{{< time.inline >}}{{ now }}{{< /time.inline >}}

{{< time.inline />}}
