+++
title = '终端模拟器'
date = '2022-07-27T21:05:30+08:00'
slug = 'terminal'
categories = ['奇技淫巧']
tags = ['Windows', 'Tips']
+++

## Windows Terminal 配置标题栏图标

### 图标文件配置[^1]

1. 将图标放在这个目录，然后 `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\RoamingState`

2. 通过在 `settings.json` 中将此行添加到配置文件来显示图标：
   `"icon": "ms-appdata:///roaming/ kali.ico"`。

### 图形化配置

- 打开 Windows 终端，`Ctrl` + `,` 进入终端 GUI 配置
