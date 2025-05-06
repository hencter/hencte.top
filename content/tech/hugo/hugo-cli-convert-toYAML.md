---
title: Hugo Cli Convert ToYAML
date: 2025-05-06T16:53:11+08:00
slug: hugo-cli-convert-front-matter-to-yaml
draft: true
---

由于之前很多的笔记的 front-matter 都是 TOML 格式的，可很多情况下发文都是很胖大的

[hugo-cli-convert-toYAML.md](https://discourse.gohugo.io/t/howto-convert-your-front-matter-from-toml-to-yaml/332)

```sh
$ hugo help convert
Convert will modify your content to different formats

Usage:
  hugo convert [command]

Available Commands:
  toJSON                    Convert front matter to JSON
  toTOML                    Convert front matter to TOML
  toYAML                    Convert front matter to YAML
--------------------------------------------------------
$ hugo convert toYAML --output content_as_yaml
processing 54 content files
```
