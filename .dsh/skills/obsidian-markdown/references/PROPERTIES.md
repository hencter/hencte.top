---
datetime: "2026-06-10T01:16"
tags:
  - 方法
type: note
---
# Properties (Frontmatter) Reference

Properties use YAML frontmatter at the start of a note:

```yaml
---
title: My Note Title
date: 2024-01-15
tags:
  - 方法
  - 案例
aliases:
  - My Note
  - Alternative Name
cssclasses:
  - custom-class
status: in-progress
rating: 4.5
completed: false
due: 2024-02-01T14:30:00
---
```

## Property Types

| Type | Example |
|------|---------|
| Text | `title: My Title` |
| Number | `rating: 4.5` |
| Checkbox | `completed: true` |
| Date | `date: 2024-01-15` |
| Date & Time | `due: 2024-01-15T14:30:00` |
| List | `tags: [one, two]` or YAML list |
| Links | `related: "Other Note"` |

## Default Properties

- `tags` - Note tags (searchable, shown in graph view)
- `aliases` - Alternative names for the note (used in link suggestions)
- `cssclasses` - CSS classes applied to the note in reading/editing view

## Tags

```markdown
#tag
#nested/tag
#tag-with-dashes
#tag_with_underscores
```

Tags can contain: letters (any language), numbers (not first character), underscores `_`, hyphens `-`, forward slashes `/` (for nesting).

In frontmatter:

```yaml
---
tags:
  - 方法
  - 案例
---
```

> [!warning] 本库标签白名单铁律
> frontmatter `tags` 值必须 ∈ 十字标签法白名单（Y 轴：生活/方法/原理/概念/目标/学习/工作/技术；X 轴：故事/案例/金句/感受/观点）。上例为合法组合；`project`/`important` 等不在白名单，禁止照抄旧示例。正文 `#tag` 若用于话题需转义为 `\#tag`。
