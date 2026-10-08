+++
aliases = ['/tech/hugo/config/markup/', '/tech/hugo/config/hugo-markup-config/']
date = '2025-09-27T19:19:56+08:00'
description = 'Hugo 的 markup 配置示例：开启 Goldmark 的 passthrough 扩展后，行内与块级 LaTeX 公式的写法与渲染验证。'
lastmod = '2026-10-05T02:00:00+08:00'
draft = false
math = true
title = 'Hugo Markup Config'
+++
## Latex 数学公式

This is an inline \(a^*=x-b^*\) equation.

These are block equations:

\[a^*=x-b^*\]

\[ a^*=x-b^* \]

\[
a^*=x-b^*
\]

These are also block equations:

$$a^*=x-b^*$$

$$ a^*=x-b^* $$

$$
a^*=x-b^*
$$
