+++
aliases = ['/log/2022-05-22-netlify-cms/', '/log/netlify-cms/']
categories = ['静态站点生成器']
date = '2022-05-22T11:29:00.337Z'
description = '2022 年在 Hugo 静态站尝试 Netlify CMS 的配置记录：后台入口、Git Gateway 与本地预览；说明它后来更名为 Decap CMS。'
draft = false
lastmod = '2026-11-23T00:00:00+08:00'
publishDate = '2022-05-23T14:08:15.017Z'
tags = ['Hugo', 'Netlify CMS', 'Decap CMS']
title = 'Netlify CMS 尝试：一份 2022 年的静态站后台记录'
+++

> **历史记录（2026 年 11 月整理）**：本文描述的是 2022 年的尝试，不是当前亦幸小阁的部署教程。**Netlify CMS 已在 2023 年更名为 [Decap CMS](https://decapcms.org/docs/)**。下方仍保留当年的 `netlify-cms@^2.0.0`、`master` 分支和 Git Gateway 示例，便于理解旧项目，但不应不加检查地直接用于新项目。

当时想给 Hugo 博客增加一个可视化写作后台，不必每次都手动编辑 Markdown。我尝试通过 Git 工作流管理文章，后来因为博客迁移到 Cloudflare Pages，这一套配置没有继续使用。

## 当时的实现思路

静态站点本身不需要额外的文章数据库；CMS 管理界面可以放在 `static/admin/`，它的任务是编辑内容并通过 Git 后端提交到仓库。

### 1. 创建后台入口

在 `static/admin/` 下创建 `index.html` 和 `config.yml`：

```text
static/
  admin/
    index.html
    config.yml
  img/
content/
  post/
```

当时的 `index.html` 使用以下资源（**仅作旧版示例**）：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  </head>
  <body>
    <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
  </body>
</html>
```

### 2. 认识 config.yml 中的关键字段

下面保留当年的核心配置结构，注意示例中的 `master` 和 `content/post` **并不是当前站点的默认分支和文章路径**：

```yaml
backend:
  name: git-gateway
  branch: master

publish_mode: editorial_workflow
local_backend: true

media_folder: static/img
public_folder: /img

collections:
  - name: "Post"
    label: "Post"
    folder: "content/post"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Publish Date", name: "date", widget: "datetime" }
      - { label: "Description", name: "description", widget: "string" }
      - { label: "Body", name: "body", widget: "markdown" }
```

`git-gateway` 并不是只写一行配置就能工作的通用 GitHub 登录方式，它还依赖相应的身份认证与网关服务。换平台后，认证与仓库写入方案要重新设计。

### 3. 当时的本地预览流程

原先的做法是在两个终端分别运行：

```bash
npx netlify-cms-proxy-server
```

```bash
hugo server
```

这里记录的是旧版工作流，**不保证在当前 Decap CMS 和当前项目环境下仍可直接运行**；新项目应按 [Decap CMS 文档](https://decapcms.org/docs/) 选择适用的安装、认证和本地开发方式。

## 最后的结论

这次尝试验证了“静态站 + Git 内容管理后台”的可行方向，但引入管理界面也意味着额外的身份认证、分支权限和维护成本。对当时的个人博客来说，迁移站点之后，我没有继续维护这套 CMS。今天保留它，更适合作为一次技术选型的历史记录，而不是推荐读者照着旧命令部署。
