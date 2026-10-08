# Editorial Workbench UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 hencte.top 改造成“编辑部杂志风 × 产品工作台”，同时完成首页、项目、博客、文章、书架和相关文案的整体升级。

**Architecture:** 继续使用 Hugo 模板、Tailwind v4 和现有主题 partial。先把颜色、间距、排版和交互状态收敛到语义 token，再按首页/项目、博客/文章、书架/章节三个内容轨道改模板；文案继续使用 content 与 data 的现有分层，GitHub 客观数据只从 live.json 读取。

**Tech Stack:** Hugo 0.167, Tailwind CSS v4, Go templates, Markdown/TOML, existing `pnpm build` and `scripts/verify_urls.py` checks.

**Spec:** [docs/superpowers/specs/2026-10-09-editorial-workbench-ui-design.md](../specs/2026-10-09-editorial-workbench-ui-design.md)

## Global Constraints

- 不引入客户端框架、运行时 API 或新的运行时依赖。
- 不修改已冻结 URL、语言配对路径、draft、Cite、Protect 规则。
- GitHub 动态字段继续来自 `data/projects/live.json`，不复制到文案 TOML。
- 图片继续通过统一的 `themes/kiss/layouts/_partials/img.html` 解析。
- 简体中文是品牌文案真源；繁体通过现有生成流程转换；英文进行自然改写，不做逐句直译。
- 每一批修改后运行适合的 Hugo 构建检查，最终运行 `pnpm build` 和 `pnpm check`。

## Review Focus

- 没有 GitHub live 数据的项目仍能渲染仓库链接或普通卡片，不出现模板错误；由 Task 2 的项目页构建检查覆盖。
- 没有图片的项目卡片高度和信息层级保持稳定；由 Task 2 的项目页 HTML 检查覆盖。
- 长中文标题、英文长词和繁体导航在移动端不横向溢出；由 Task 4 的 390px 检查覆盖。
- 明暗主题下元信息、按钮、链接和栏目色彩仍有足够对比度；由 Task 1 的 CSS 检查和 Task 5 的截图/构建回归覆盖。
- 草稿、小说保护轨和语言切换不因模板重构改变；由 Task 5 的 `pnpm check` 覆盖。

### Task 1: 收敛全局视觉系统与壳层

**Files:**
- Modify: `themes/kiss/assets/css/main.css`
- Modify: `themes/kiss/layouts/baseof.html`
- Modify: `themes/kiss/layouts/_partials/header.html`
- Modify: `themes/kiss/layouts/_partials/footer.html`
- Modify: `themes/kiss/layouts/_partials/menu.html`
- Modify: `themes/kiss/layouts/_partials/lang-switcher.html`
- Modify: `themes/kiss/layouts/_partials/theme-toggle.html`

**Interfaces:**
- Consumes: existing semantic color tokens, navigation menus, language switcher and theme boot script.
- Produces: stable global shell classes and token names used by all later page tasks.

- [ ] **Step 1: Record the current baseline**

Run `pnpm build` and inspect the current token definitions and shell markup. Record page counts and any existing warnings before editing.

- [ ] **Step 2: Define the visual token contract**

In `main.css`, add only the semantic roles required by the spec: `surface-raised`, section accents for log/tech/ancient/obsidian, and the shared border, focus, shadow, radius and spacing values. Keep the existing light/dark semantic swap model.

- [ ] **Step 3: Refine global shell markup**

Update header, mobile disclosure, language switcher, theme toggle and footer so focus states, click targets, active navigation and spacing are consistent. Keep the current menu data and URLs.

- [ ] **Step 4: Verify the shell**

Run `pnpm css` followed by `hugo --ignoreCache --panicOnWarning --printPathWarnings --printI18nWarnings`; expected result is a successful four-language build with no warnings.

- [ ] **Step 5: Commit the global shell batch**

Use a Conventional Commit subject such as `refactor(ui): 收敛全局视觉系统与站点壳层`.

### Task 2: 改造首页与项目工作台

**Files:**
- Modify: `themes/kiss/layouts/home.html`
- Modify: `themes/kiss/layouts/page.html`
- Modify: `themes/kiss/layouts/_partials/hero.html`
- Modify: `themes/kiss/layouts/_partials/projects.html`
- Modify: `themes/kiss/layouts/_partials/more-projects.html`
- Modify: `themes/kiss/layouts/_partials/project-github.html`
- Modify: `data/projects/zh.toml`
- Modify: `content/_index.md`
- Modify: `content/projects.md`
- Modify: `i18n/zh.toml`
- Generate: `data/projects/tw.toml`, `data/projects/hk.toml`, related generated variants via `pnpm generate`

**Interfaces:**
- Consumes: Task 1 token contract; `data/projects/<lang>.toml`; `data/projects/live.json`.
- Produces: homepage and project cards with explicit featured/more hierarchy, stable GitHub metadata, and revised Chinese source copy.

- [ ] **Step 1: Define copy before markup changes**

Create a compact old → new copy map for the home Hero, project page Hero, project section headings, CTA labels and project descriptions. Keep each featured description within 40–70 Chinese characters where practical and move facts such as language, stars and update date to metadata.

- [ ] **Step 2: Implement the homepage hierarchy**

Update `home.html` and `hero.html` to express identity, current action and primary entry points. Make projects, latest writing and novels distinct content tracks with their own heading and spacing rhythm.

- [ ] **Step 3: Implement project card hierarchy**

Use a stronger featured card treatment, a quieter “more projects” treatment, and a deterministic placeholder for projects without images. Keep product URL and repository URL as separate actions.

- [ ] **Step 4: Harden GitHub metadata rendering**

Keep the lookup in `project-github.html`; handle a missing repository key, missing language, zero stars, missing license and a product with a separate repository without empty visual gaps or template errors.

- [ ] **Step 5: Generate variants and verify project output**

Run `pnpm generate`, `pnpm build`, then inspect `public/projects/index.html` and `public/en/projects/index.html`. Expected result: all project cards render, GitHub facts appear only when available, and all four language builds succeed.

- [ ] **Step 6: Commit the homepage/project batch**

Use a Conventional Commit subject such as `refactor(ui): 重做首页与项目工作台`.

### Task 3: 改造博客目录、section 和文章阅读页

**Files:**
- Modify: `themes/kiss/layouts/blog/page.html`
- Modify: `themes/kiss/layouts/section.html`
- Modify: `themes/kiss/layouts/page.html`
- Modify: `themes/kiss/layouts/_partials/toc.html`
- Modify: `themes/kiss/layouts/_partials/terms.html`
- Modify: `content/blog.md`
- Modify: `content/log/_index.md`
- Modify: `content/tech/_index.md`
- Modify: `content/ancient/_index.md`
- Modify: `content/obsidian/_index.md`
- Modify: selected article front matter under `content/log/`, `content/tech/`, `content/ancient/`, `content/obsidian/`

**Interfaces:**
- Consumes: Task 1 tokens; section banners and article image fallback already established in the workspace; existing date, tag and TOC data.
- Produces: magazine-like article index, section pages with clear identity, and reading-first article pages with improved copy and navigation.

- [ ] **Step 1: Rewrite directory and section copy**

Rewrite `content/blog.md` and the four section `_index.md` files so each page states what belongs there, who it serves and where to continue. Keep links root-relative and preserve the current URL aliases.

- [ ] **Step 2: Build the magazine directory layout**

Update `blog/page.html` to show section introductions and a scannable latest-article list. Use dates, section labels and summaries as separate visual fields; avoid turning every row into a large card.

- [ ] **Step 3: Build section pages around banner + list**

Update `section.html` so the banner, section title, description and article cards form one hierarchy. Use the section-specific accent token and keep nested technical sections navigable.

- [ ] **Step 4: Refine article reading shell and copy entry points**

Update `page.html`, TOC and terms so article metadata, image/banner, TOC, body, tags and related navigation follow the reading order in the spec. Do not change content rendering rules or shortcodes.

- [ ] **Step 5: Verify articles and sections**

Run `pnpm build`, inspect representative `log`, `tech`, `ancient`, `obsidian`, `blog` and article HTML outputs, and verify that draft pages remain absent from published output.

- [ ] **Step 6: Commit the blog/reading batch**

Use a Conventional Commit subject such as `refactor(ui): 优化博客目录与文章阅读体验`.

### Task 4: 优化书架、小说落地页与章节导航

**Files:**
- Modify: `themes/kiss/layouts/shelf/section.html`
- Modify: `themes/kiss/layouts/shelf/page.html`
- Modify: `themes/kiss/layouts/_partials/novel-landing.html`
- Modify: `themes/kiss/layouts/_partials/novel-canvas.html`
- Modify: `content/shelf/_index.md`
- Modify: `content/shelf/ai-counter-taming/_index.md`
- Modify: `content/shelf/sky-tax/_index.md`
- Modify: related Chinese/English shelf copy where the visible entry text is changed

**Interfaces:**
- Consumes: Task 1 tokens; existing cover, chapter, canvas, aliases and Protect-track metadata.
- Produces: distinct literary shelf visuals with clearer continuation actions and unchanged chapter protection behavior.

- [ ] **Step 1: Rewrite shelf and book landing copy**

Clarify the shelf description, book blurbs, chapter count labels and continue-reading actions. Preserve titles, aliases, language pairing and copyright/protection statements.

- [ ] **Step 2: Refine shelf cards and book landing hierarchy**

Give covers, title, blurb and next action explicit levels. Keep missing-cover behavior safe and keep chapter counts scoped to the current book.

- [ ] **Step 3: Refine chapter navigation**

Improve top navigation, chapter index, banner spacing and bottom pager without changing canvas rendering, chapter ordering or URL generation.

- [ ] **Step 4: Verify the protected reading track**

Run `pnpm build` and inspect ZH/EN chapter output, robots/meta behavior and novel landing links. Expected result: chapter pages remain on the Protect track and all own-chapter checks pass.

- [ ] **Step 5: Commit the shelf batch**

Use a Conventional Commit subject such as `refactor(ui): 优化书架与小说阅读界面`.

### Task 5: Full copy, responsive, theme and site regression

**Files:**
- Modify: all touched UI/content files from Tasks 1–4 as needed after regression
- Test: generated `public/` output, `scripts/verify_urls.py`, CSS build output

**Interfaces:**
- Consumes: completed UI and copy batches from Tasks 1–4.
- Produces: a verified four-language, light/dark, desktop/mobile site ready for review.

- [ ] **Step 1: Run the complete generation and build chain**

Run `pnpm generate`, `pnpm build`, and `pnpm check`. Expected result: no Hugo warnings, all live URLs and aliases render, all published pages and images resolve, and language switchers point to existing counterparts.

- [ ] **Step 2: Run responsive and visual checks**

Use the available local browser/screenshot workflow to inspect at least home, projects, blog, one section, one article, shelf, one novel landing and one chapter at 390px and desktop width, in light and dark themes. Check overflow, focus visibility, card alignment, image cropping and reading width.

- [ ] **Step 3: Run copy audit**

Search the changed content and templates for placeholder language, duplicate CTA labels, accidental Simplified Chinese in English copy, broken root-relative links, and descriptions that expose stale project status.

- [ ] **Step 4: Fix only regression findings**

Apply targeted fixes, rerun the narrow failing check, then rerun `pnpm build` and `pnpm check` after all fixes.

- [ ] **Step 5: Commit the verified release batch**

Use a Conventional Commit subject such as `refactor(ui): 完成整站视觉与文案升级` and report any intentionally excluded pre-existing workspace changes.
