+++
aliases = ['/tech/keyboard-shortcuts/', '/tech/editor/keyboard-shortcuts/']
categories = ['编辑器', '按键绑定']
date = '2023-04-13T16:39:15+08:00'
description = '去哪看编辑器当前生效的按键绑定：VS Code 的快捷键参考，以及 Vim / Neovim 的 :map 系列与 LazyVim 的键位搜索。'
lastmod = '2026-10-05T03:00:00+08:00'
tags = ['Editor', 'Keymap']
title = '关于编辑器的快捷键'
+++
## VS Code

按下 <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>Ctrl</kbd>+<kbd>R</kbd>，会在浏览器里打开当前系统的按键绑定参考。

## Vim / Neovim

Vim 自己就能回答「这个键现在绑了什么」，不必先翻外部文档：

| 命令 | 作用 |
| --- | --- |
| `:map` | 列出当前生效的映射；`nmap` / `vmap` / `xmap` 只看某一种模式 |
| `:verbose nmap <键>` | 除了映射本身，还告诉你是**哪个文件**定义或覆盖了它——排查插件冲突最有用的一条 |
| `:help map.txt` | 映射系统的完整说明（各模式前缀、取消映射的 `:nunmap` 等） |

用 LazyVim 这类发行版时，默认键位表可以直接搜：

- `<leader>sk` —— **Keymaps**，打开全部键位搜索
- `<leader>?` —— **Buffer Keymaps**，只看当前 buffer 的键位
- 忘了前缀就按 `<space>`，which-key 会弹出接下来可用的键位

默认 `<leader>` 是空格、`<localleader>` 是 `\`。

> 键位以各插件当前版本为准：上表是 2026-10 查阅 LazyVim 官方键位表（<https://www.lazyvim.org/keymaps>，访问 2026-10-05）时的默认值。
