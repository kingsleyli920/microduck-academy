# Changelog

## Unreleased

### English

- Added complete Chinese and English classroom UI, nine lessons, the 3D Lab, the `control.duck` API Reference, and core repository documentation.
- Rewrote lesson and lab copy around testable reinforcement learning terms: observation, action, reward, rollout, policy, and deployment boundaries.
- Saved the language preference in the local learning profile while preserving edited code and experiment records across language changes.
- Added bilingual structure tests to detect missing lesson, API, UI, or documentation counterparts.
- Added the Level 3 Task & Reward Lab for evaluating two reward and termination configurations against the same official ONNX policy with real MuJoCo rollouts.
- Added return, mean velocity, tracking error, action energy, smoothness, and termination metrics to the local experiment profile.
- Added reward, termination, and configuration-boundary tests.
- Added `npm run verify`, TypeScript CI, Dependabot, architecture documentation, and a maintainer release checklist.

### 简体中文

- 增加完整的中英文课堂界面、9 节课程、3D 实验室、`control.duck` API Reference 和配套仓库文档。
- 重写课程与实验文案，使用可验证的强化学习术语描述 observation、action、reward、rollout、policy 和部署边界。
- 语言偏好随本地学习档案保存；切换语言时保留学习者已编辑的代码和实验记录。
- 增加双语结构一致性测试，防止课程、API 或核心界面只更新一种语言。
- 增加 Level 3 Task & Reward Lab：为同一个官方 ONNX policy 配置 A/B reward 与 termination，并从真实 MuJoCo 状态采集 rollout。
- 显示 return、平均速度、跟踪误差、action energy、smoothness 和终止原因；实验与进度保存在本地学习档案。
- 增加 reward 计算、termination 和配置边界的自动测试。
- 增加统一的 `npm run verify`、TypeScript CI、Dependabot、架构文档和维护者发布清单。
- 更新 README、贡献、安全和隐私文档，使能力、数据边界与上游依赖更容易审阅。

## 0.1.0-preview — 2026-09-10

- Added nine browser-local reinforcement learning lessons with Python execution and automatic checks.
- Added six real-policy observation experiments against the official Microduck simulator.
- Added the 25-entry `control.duck` language, searchable reference, and live simulator bridge.
- Added local learning profiles with JSON export and import.
- Added pinned, source-only runtime setup for the official simulator and Pyodide.

Training new PPO policies, exporting learner ONNX artifacts, and physical robot deployment remain planned work.
