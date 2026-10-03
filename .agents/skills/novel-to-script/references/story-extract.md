---
type: note
title: story-extract
datetime: 2026-08-09T01:07
lastmod: 2026-08-14T00:00
tags:
  - 方法
  - 观点
---
# 故事资产自提炼（通用）

> 在写 SCRIPT 之前**必须**先从正文提炼，禁止未读正文就套死角色名。  
> 有 bible/大纲时：**对照合并**，冲突标 ⚠，以用户指定源为准。

## 产出 `scripts/STORY_EXTRACT.md`（或 `docs/STORY_EXTRACT.md`）

### 1. 叙述契约 `narration_contract`

| 字段 | 说明 | 自提炼方法 |
|------|------|------------|
| `pov` | first / third / multi / omniscient | 正文「我/他」主导 |
| `narrator_id` | 叙述者角色 id 或 `null`（纯第三人称） | 第一人称→「我」对应谁 |
| `tense` | past / present | 时态 |
| `voice_notes` | 语气关键词 | 口语/冷幽默/书面… |

### 2. 角色 `characters[]`

每条至少：

```yaml
id: char_01          # 稳定 slug，可后映射中文名
name:                # 正文称呼
aliases: []
role: protagonist | antagonist | ally | system | extra | unknown
speech_channel: voice | ui | both | none   # 说话主要通道
visual_lock: true/false                    # 是否需要角色锁图
first_seen_beat:                           # 首次出现
notes:
```

**自提炼信号**：对话引号前主语、称呼变化、职位/外貌固定短语。

### 3. 场景 `locations[]`

```yaml
id: loc_01
name:
time: day|night|unknown
mood:
props_default: []
first_seen:
```

**信号**：地点切换句、室内外、专名地名。

### 4. 道具 `props[]`

```yaml
id: prop_01
name:
owner: char_id | null
story_function: clue | macguffin | tool | set_dressing
plant_beat:      # 埋设
payoff_beat:     # 回收（本章无则 pending）
```

**信号**：被特写的物件、反复出现、改变局势的物。

### 5. 关系 `relations[]`

```yaml
from: char_id
to: char_id
type: ally | hostile | hierarchy | romance | system_bind | unknown
change_beats: []   # 关系变化发生在哪些 beat
```

### 6. 线索 `clues[]`

```yaml
id: clue_01
claim:               # 读者应记住的信息
plant: beat/scene
payoff: beat/scene | open
must_keep: true
```

### 7. 情节推演 `plot_spine`

有序列表，每步：

```yaml
step: 1
scene_id:
goal:
conflict:
result:
hooks_next:          # 钩向下一步
```

章末：`open_loops[]` 未回收钩子。

### 8. 表达通道 `channels`（为改编服务，仍通用）

| channel | 何时用 |
|---------|--------|
| `voice_narration` | 叙述者 N 轨 |
| `spoken_dialogue` | 角色开口 D |
| `interface_dialogue` | 系统/AI/短信等**写在界面上的对话**（speech_channel=ui） |
| `visual_only` | 只靠画面，无对白 |

从正文判断：谁通过屏幕/弹窗/系统说话 → `interface_dialogue`，**不要**写死某一个 AI 名。

## 门禁

```
assert STORY_EXTRACT 存在且 characters ≥ 1（或说明是纯景物实验）
assert plot_spine 步数 ≥ 3（完整章）
assert 每个 must_keep clue 在后续 beat 有引用或标 open
assert narration_contract.pov 已填
```

## 与剧本的衔接

编剧写 SCRIPT 时：

- `need_character` ← characters.visual_lock  
- `need_ui` / `speech_channel=ui` ← interface_dialogue  
- 场次地点 ← locations  
- props 列 ← props  
- must_keep ← clues + plot_spine  
