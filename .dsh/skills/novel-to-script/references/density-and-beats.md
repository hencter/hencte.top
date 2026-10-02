---
type: note
title: density-and-beats
datetime: 2026-08-09T01:07
lastmod: 2026-08-14T00:00
tags:
  - 方法
  - 观点
---
# 密度与节拍细则

## 何时必须新开 Beat

- 主体动作改变（走→跑、坐→站）
- 信息状态改变（未知→已知、未接→已接）
- 构图主体改变（人→手机屏→对面人）
- 时间跳切（「三小时后」）

## 何时可合并

- 同一动作的连续微描写（「他抬手、解锁、点开」可 1–2 beat，但**若有 UI 字**必须单独 V 或 need_phone_ui）
- 纯修辞无新信息

## 与 panel 数关系

```
beat_count ──1:1 或 1:2──► panel_plan 行数
禁止：panel_plan 固定 12 行覆盖任意章节
```

出图前：`len(panel_plan) >= beat_count * 0.9` 否则退回剧本。
