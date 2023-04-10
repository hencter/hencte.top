+++
title = 'Npm Mirror 配置' # 标题
slug = 'npm-mirror-config' # 铭牌
date = '2023-03-11T23:22:52+08:00' # 撰写日期 
description = '' # 文章描述
tags = ["NPM", "PackManager", "Config"] # 标签
categories = ["开发", "包管理", "配置"] # 分类
images = [''] # 文章封面
draft = false # 是否为草稿
+++


## 通过 yrm 工具配置镜像源

这里是通过安装一个 `yrm` 工具「这个工具可以同时配置 `yarn` 」进行配置

```bash
# 注意全局安装可能需管理员权限
npm install -g yrm --registry=https://registry.npmmirror.com 
yrm add npmmirror https://registry.npmmirror.com
yrm use npmmirror
# 检查是否使用成功
yrm ls
```

## 原生 NPM 全局配置源

```shell
npm config set registry <https://registry>
```

清空缓存

```shell
npm cache clean -f
```

检查

```shell
npm config list
```
