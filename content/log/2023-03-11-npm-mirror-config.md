+++
aliases = ['/log/2023-03-11-npm-mirror-config/', '/log/npm-mirror-config/']
categories = ['开发', '包管理', '配置']
date = '2023-03-11T23:22:52+08:00'
description = 'npm 镜像源配置备忘：原生设置和 yrm 两种方式、验证当前 registry、按项目配置与恢复官方源。'
draft = false
lastmod = '2026-11-23T00:00:00+08:00'
tags = ['NPM', 'PackManager', 'Config']
title = 'npm 镜像源配置：切换、验证与恢复'
+++

> **修订说明（2026 年 11 月）**：这篇笔记写于 2023 年。原文的 `npm config set registry <https://registry>` 是占位写法，不能直接作为命令执行；以下改为可复制的命令，并补上恢复方式。

网络条件不同，选择的 npm registry 也可能不同。**不想安装额外工具时，优先用 npm 自带的配置命令**。

## 方式一：npm 原生命令

切换到 npmmirror：

```bash
npm config set registry=https://registry.npmmirror.com
```

检查当前设置：

```bash
npm config get registry
npm ping
```

恢复 npm 官方源：

```bash
npm config set registry=https://registry.npmjs.org/
npm config get registry
```

如果只希望**当前项目**使用镜像，不想影响其他项目，可以在该项目根目录的 `.npmrc` 中写入：

```ini
registry=https://registry.npmmirror.com
```

项目内的 `.npmrc` 会参与 npm 配置合并；如果使用公司私有源或带 scope 的依赖，先确认项目的 registry 与认证配置，避免全局切换影响其他包。

## 方式二：使用 yrm

如果经常在多个 registry 之间切换，可以考虑第三方工具 `yrm`：

```bash
npm install --global yrm
yrm add npmmirror https://registry.npmmirror.com
yrm use npmmirror
yrm ls
```

是否需要 `yrm` 取决于你是否经常切换；仅配置 npm 一次，不必专门安装它。第三方工具的具体兼容性以其当前文档为准。

## 常见问题

- **切换后仍旧使用旧地址**：先用 `npm config get registry` 检查生效值，再查看项目根目录的 `.npmrc` 和环境变量是否覆盖了它。
- **下载失败**：先检查网络、镜像服务和包是否存在，不要立即删除整个缓存。
- **确实怀疑缓存异常**：可先运行 `npm cache verify`，排查后再决定是否清理。

参考资料：[npm config](https://docs.npmjs.com/cli/commands/npm-config/) · [npm 配置文件](https://docs.npmjs.com/cli/configuring-npm/npmrc/)
