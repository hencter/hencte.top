# 亦幸小阁 (hencte.top) 项目规则

## 项目概述

- **项目名称**: 亦幸小阁
- **网站地址**: <https://hencte.top/>
- **项目类型**: Hugo 静态博客网站
- **主要语言**: 中文 (支持中英双语)
- **作者**: Hencter Lew
- **许可证**: MIT

## 重要提醒

- **任何情况下不要去运行本项目，我本人可以进行操作只需要检查是否启动了即可**

## 技术栈

### 核心工具

- **pnpm** - 包管理器
- **hugo** - 静态网站生成器 (Go 1.24.5)
- **tailwindcss** v4.0.7 - CSS 框架
- **lunisolar.js** v2.5.2 - 农历日期库

### 开发工具

- **@babel/core** - JavaScript 编译器
- **prettier** - 代码格式化 (支持 Go 模板)
- **autoprefixer** - CSS 前缀自动添加
- **@tailwindcss/typography** - 排版插件

## 项目结构

```plaintext
├── content/             # 内容目录
│   ├── log/             # 日志文章 (主要内容)
│   ├── tech/            # 技术文章
│   ├── posts/           # 一般文章
│   ├── ancient/         # 古籍文档
│   └── about/           # 关于页面
├── layouts/             # Hugo 模板
│   ├── _default/        # 默认模板
│   ├── partials/        # 部分模板
│   └── shortcodes/      # 短代码
├── assets/              # 资源文件
│   ├── css/             # 样式文件
│   ├── js/              # JavaScript 文件
│   └── jslibs/          # 第三方 JS 库
├── static/              # 静态文件
│   ├── img/             # 图片资源
│   └── js/              # 静态 JS 文件
└── config/              # 配置文件
```

## 开发命令

执行命令时请参考项目使用的工具:

### 开发服务器

```bash
pnpm run dev          # 启动开发服务器 (hugo server -D)
# or
hugo server -D --bind 0.0.0.0
```

### 构建

```bash
pnpm run build        # 生产构建 (hugo --gc --minify)
pnpm run build:css    # 构建 CSS
```

### CSS 开发

```bash
pnpm run watch:css    # 监听 CSS 变化
```

## 内容规范

### 文章命名

- 格式: `YYYY-MM-DD-title.md`
- 位置: `content/log/` (主要) 或 `content/tech/`

### Front Matter 配置

```yaml
---
date: "2022-07-12T23:48:54+08:00"
title: "文章标题"
tags: ["标签1", "标签2"]
categories: ["分类"]
---
```

### 图片资源

- 路径: `/static/img/`
- 引用: `![描述](/img/filename.jpg)`

## 自定义功能

### Shortcodes

- `{{< heti >}}` - 中文排版优化
- `{{< lunar >}}` - 农历日期
- `{{< year >}}` - 年份显示
- `{{< gist >}}` - GitHub Gist 嵌入
- `{{< kbd "按键" >}}` - 键盘按键样式

### 特殊样式

- `.text-center.text-rose` - 居中红色文本
- `.heti` - 中文排版优化类

## 配置文件说明

### hugo.toml

- 网站基础配置
- 多语言支持 (中英文)
- 菜单配置
- 模块导入 (lunisolar)

### package.json

- 依赖管理
- 构建脚本
- 项目元信息

### tailwind.config.js

- TailwindCSS 配置 (主要为 VS Code 插件支持)

## 部署配置

- **Vercel**: `.vercel/project.json`
- **构建输出**: `public/` 目录
- **资源缓存**: `resources/` 目录

## 开发注意事项

1. **代码格式化**: 使用 Prettier，支持 Go 模板语法
2. **CSS 开发**: 使用 TailwindCSS v4，配置文件主要用于 IDE 支持
3. **JavaScript**: 使用 Babel 编译，支持现代 ES6+ 语法
4. **中文排版**: 使用 heti 短代码优化中文显示
5. **农历功能**: 集成 lunisolar 库支持农历日期显示
6. **模块管理**: 使用 Hugo Modules 管理第三方依赖
