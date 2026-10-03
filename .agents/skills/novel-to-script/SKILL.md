---
type: rule
title: SKILL
datetime: 2026-07-31T16:00
lastmod: 2026-08-01T16:00
tags:
  - 方法
  - 观点
  - 故事
trust_level: internal
name: novel-to-script
description: 小说/网文章节→可拍剧本（非摘要）。先自提炼角色/场景/道具/关系/线索/情节，再拆场次节拍与 N/D/M/V 轨。通用，不写死具体书名角色。触发：小说转剧本、故事资产提炼、章节改编、解说漫剧本。
metadata:
  short-description: 小说→资产提炼→剧本（通用）
version: 2.0.0
---

# 小说 → 剧本（通用）

> **品类前提**：叙事分镜 / 解说漫画，**不是口播新闻台**。  
> **通用性**：角色、场景、道具、关系、线索、情节推演均从**正文自提炼**；项目圣经仅作对照，禁止未提炼就套死「某书某角色」。  
> 方法：场次=目标-冲突-结果；视觉化 V 轨；`references/story-extract.md`。

## 触发

小说转剧本、整章改编、故事资产表、从正文出分场、别摘要、按章节出戏。

## 铁律

1. **整章进，整章出。** 禁止只读摘要当源。  
2. **先提炼，后编剧。** 无 `STORY_EXTRACT` 不得写 SCRIPT。  
3. **禁止总结成口播。** 情节节拍、道具、关系变化不可吞。  
4. **先剧本，后口播。** 本 skill 不写 TTS 定稿。  
5. **对话里的画面句 → V。** 系统/界面说话 → **M（interface_dialogue）**，由 EXTRACT 的 speech_channel 决定，不写死某一个 AI 名。  
6. **人称跟 EXTRACT。** `narration_contract.pov=first` 则 N 用「我」且绑定 `narrator_id`；第三人称则禁止硬改第一人称（除非 DIRECTOR_BRIEF 覆盖）。  
7. **虚构边界。** 版权/脱敏按用户要求。

## 标准流程

```
1) Ingest     读全文 + 可选 bible/大纲
2) Extract ★  自提炼 STORY_EXTRACT（角色/场景/道具/关系/线索/情节）
3) Spine      场次表（对齐 plot_spine + locations）
4) Beats      每场拆 beat — 密度见下
5) Tracks     每 beat → N / D / M / V（通道来自 EXTRACT）
6) Gate       密度 + 线索 must_keep + 人称一致性
7) Export     STORY_EXTRACT + SCRIPT + BEAT_INDEX
```

## 密度下限（可观测）

| 文本信号 | 最少 beat |
|----------|-----------|
| 一次地点/时间切换 | +1 场或 +1 beat |
| 一句改变关系的对话 | +1 |
| 一个新道具/消息/UI 出现 | +1 |
| 一个不可省略的动作（开门/接电话/逃跑） | +1 |
| 纯氛围描写无动作 | 可合并，但**不得删掉后续因果所需的信息** |

**粗算**：中文小说约 **300–500 字 / beat** 作起点；若整章 4000 字却只出 8 个 beat → **失败，重拆**。  
解说漫默认目标：**整章 panels ≈ beat 数**（可 1 beat 多镜，禁止 1 镜吞 5 beat）。

## 输出格式

### `scripts/STORY_EXTRACT.md`

见 `references/story-extract.md`（强制）。

### `scripts/SCRIPT.md`

```markdown
# 剧本 · {书名} · 第X章
- source: {路径}
- extract: scripts/STORY_EXTRACT.md
- narration: {pov} / narrator={id}
- word_count: N
- scene_count: S
- beat_count: B
- density: B / (N/400)  # 应 ≥ 0.8

## 场次 S01 · {loc_id} · {日/夜}
- 在场: [char_ids]
- 目标 / 冲突 / 结果: …

### Beat B01
- N: …（遵守 narration_contract）
- D:char_id: …（voice）
- M:char_id: …（interface_dialogue，写在 UI 上）
- V: …
- props: [prop_ids]
- clues: [clue_ids]
- need_character: [char_ids]
- need_ui: channel key | null
- emotion: …
```

### `scripts/BEAT_INDEX.md`

`beat_id | scene | one_line_V | chars | props | clues | need_ui | must_keep`

### 自检清单

- [ ] STORY_EXTRACT 完整（角色/场景/道具/关系/线索/情节）  
- [ ] 源是整章正文  
- [ ] 密度达标  
- [ ] 每 beat 有 V；界面对话走 M 不走 N 复读  
- [ ] must_keep 线索已挂 beat  
- [ ] 人称与 narration_contract 一致（或 BRIEF 显式覆盖）  

## 反模式

| 反模式 | 正确 |
|--------|------|
| 未读正文就写死「主角叫某某」 | 先 EXTRACT 再命名 |
| 「本章讲了接单」一段 N | 拆动作链多 beat |
| 把系统弹幕全念成旁白 | M 轨 + V/UI |
| 12 镜硬编码整章 | 镜数由 beat/小场景 N 决定 |
| 只改编高潮 | 铺垫/道具/线索必须保留 |

## 下游

| 下一步 | |
|--------|--|
| 导演交叉审 R1 | `manga-explainer-pipeline/references/director-role.md` |
| 分镜 | `manga-explainer-pipeline` + storyboard-from-beats |
| 项目特例（可覆盖通用） | `DIRECTOR_BRIEF.md` 的 `project_profile` |

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-07-31 | 初版：整章密度 + N/D/V |
| 2026-08-01 | **v2 通用**：强制 STORY_EXTRACT；M 轨；人称/UI 通道自提炼；去硬编码角色 |
