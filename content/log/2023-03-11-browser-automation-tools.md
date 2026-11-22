+++
aliases = ['/log/2023-03-11-browser-automation-tools/', '/log/browser-automation-tools/']
categories = ['自动化', '测试']
date = '2023-03-11T23:44:25+08:00'
description = 'Selenium、Playwright 与 Cypress 的定位比较；更新 Selenium Manager 驱动管理说明，并提供带显式等待与资源释放的 Python 示例。'
draft = false
lastmod = '2026-11-23T00:00:00+08:00'
tags = ['Test', 'End to End Testing', 'Selenium', 'Playwright']
title = '浏览器自动化测试：Selenium、Playwright 与 Cypress 怎么选'
+++

> **修订说明（2026 年 11 月）**：本文最初写于 2023 年。旧版教程强调手动下载与浏览器版本匹配的 ChromeDriver；Selenium 4.6 及更新版本内置 Selenium Manager，普通场景下可自动管理匹配的驱动。因此更新了安装步骤和示例，但保留当初的三款工具比较。

浏览器自动化能帮助我们验证登录、表单、页面导航等用户操作；它也可以用于重复性的浏览器任务。不过，能打开网页不等于已经有了可靠的端到端测试：断言、稳定的元素定位、等待条件和测试环境同样重要。

## 三款工具的定位

| 工具 | 更适合的场景 | 需要注意 |
| --- | --- | --- |
| [Selenium](https://www.selenium.dev/documentation/) | 跨语言的 WebDriver 自动化、现有测试框架集成 | 测试组织、等待和断言通常需要自行组合 |
| [Playwright](https://playwright.dev/) | 多浏览器端到端测试、自动等待、追踪与调试 | 要根据项目选用对应的语言绑定和测试运行器 |
| [Cypress](https://docs.cypress.io/) | 以前端开发工作流为核心的端到端与组件测试 | 运行模式及跨浏览器覆盖应按项目需求核对 |

这里不按“谁最先进”排序。已有 Java/Python 自动化体系，可以先看 Selenium；新建 Web 端到端测试项目，可以重点评估 Playwright 和 Cypress，比较调试体验、CI 成本与团队熟悉程度。

## 使用 Selenium 运行一个最小示例

准备 Python 环境和可用的 Chrome 浏览器，然后安装近期版本的 Selenium：

```bash
python -m pip install --upgrade selenium
```

以下示例访问公开的演示页面，等待标题出现并检查页面内容：

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

with webdriver.Chrome() as driver:
    driver.get("https://example.com/")

    heading = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "h1"))
    )
    assert heading.text == "Example Domain"
```

`with` 结束时会关闭 WebDriver 会话，避免测试运行后留下浏览器进程。显式等待也比随意加入固定的 `sleep` 更适合处理页面加载的时间差。

Selenium Manager 在一般联网环境中会查找并管理所需的驱动；离线环境、指定浏览器版本或公司内网可能需要额外配置。**因此不再把“手动下载 ChromeDriver”作为所有人的必做步骤**。

## 写成真实测试前，还要考虑什么？

- **稳定的定位方式**：尽量选择明确的 ID 或测试专用属性，避免依赖易变的页面结构。
- **有意义的断言**：不只检查网页能打开，还要验证操作后的预期状态。
- **等待条件**：等待元素出现、可点击或状态变化，不要用任意秒数掩盖竞态。
- **可重复环境**：尽可能使用受控测试数据，减少第三方页面改版带来的失败。

这段代码是一个入门冒烟测试，不是完整的测试框架；实际业务应在测试项目中运行并收集失败信息。

参考资料：[Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/) · [Selenium Python API](https://www.selenium.dev/selenium/docs/api/py/) · [Playwright](https://playwright.dev/) · [Cypress](https://docs.cypress.io/)
