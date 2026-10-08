+++
aliases = ['/log/2023-03-11-npm-mirror-config/', '/log/npm-mirror-config/']
categories = ['开发', '包管理', '配置']
date = '2023-03-11T23:22:52+08:00'
description = 'npm 镜像源切换笔记：用 yrm 工具添加并启用 npmmirror 源，或用 npm config set registry 直接设置，并附清空缓存、检查配置的验证命令。'
draft = false
tags = ['NPM', 'PackManager', 'Config']
title = 'Npm Mirror 配置'
+++
## 两种等价的配置方式

选一种即可：`yrm` 会顺手把 `yarn` 一起配好；不想装额外工具，就用 npm 自带的配置命令。

{{< tabs >}}
{{< tab name="yrm 工具" >}}
通过安装一个 `yrm` 工具「这个工具可以同时配置 `yarn` 」进行配置

```bash
# 注意全局安装可能需管理员权限
npm install -g yrm --registry=https://registry.npmmirror.com 
yrm add npmmirror https://registry.npmmirror.com
yrm use npmmirror
# 检查是否使用成功
yrm ls
```
{{< /tab >}}
{{< tab name="npm 原生" >}}
不引入第三方工具，直接用 npm 自己的配置命令：

```shell
npm config set registry <https://registry>
```
{{< /tab >}}
{{< /tabs >}}

## 清缓存与检查

改完源之后清一次缓存，再确认配置真的生效：

```shell
npm cache clean -f
```

```shell
npm config list
```
