+++
categories = ['']
date = '2023-04-12T23:25:25+08:00'
description = ''
draft = false
images = ['']
slug = 'leaf-bundles'
tags = ['']
title = '页捆绑（Leaf Bundles）'
+++

## 页捆绑是什么

其主要是为了更合理的管理内容，比如一个页面一个 Markdown 文件没有问题，这时突然我们加入了不少的图片，或者 PDF、JS、CSS等文件，这个时候是不是
就难以管理，这个时候我们将其放在一个文件夹里面会更好处理这些需要 “捆绑” 在一起的文件。

具体

## Leaf Bundle 组织例子

```text
content/
├── about
│   ├── index.md
├── posts
│   ├── my-post
│   │   ├── content1.md
│   │   ├── content2.md
│   │   ├── image1.jpg
│   │   ├── image2.png
│   │   └── index.md
│   └── my-other-post
│       └── index.md
│
└── another-section
    ├── ..
    └── not-a-leaf-bundle
        ├── ..
        └── another-leaf-bundle
            └── index.md
```

了解更多请参考：<https://gohugo.io/content-management/page-bundles/>
