# Changelog

## Unreleased

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
