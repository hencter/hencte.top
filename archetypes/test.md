---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true
---

**Insert Lead paragraph here.**

## New log Posts

<!-- 没错，原型文件里面可以渲染模版 -->

{{ range first 10 ( where .Site.RegularPages "Type" "log" ) }}
* {{ .Title }}
{{ end }}