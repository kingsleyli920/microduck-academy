# Changelog

## Unreleased

No unreleased changes.

## 0.2.1-preview — 2026-09-11

- Corrected the Level 2 projected-gravity branch and tightened the Level 0 explanations of goal control, discounted return, PPO clipping, reward exploits, and hardware-specific safety limits.
- Removed the unsupported standalone `session:id` motion reference and documented the two verified `move(ref)` inputs: Hub repositories and HTTPS ONNX URLs.
- Disabled upstream multiplayer signaling and pose broadcast in Academy embedded mode while preserving explicit community-policy downloads.
- Localized Python missing-function errors and validated imported learning profiles before restoring them.
- Hardened local service discovery, shutdown origin checks, port-conflict handling, and the macOS launcher.
- Made `reset()` and base switching wait for the simulator’s real ready state, and report rejected policy triggers instead of silently continuing.
- Added a local-build compatibility patch for the pinned simulator's rollers-to-legs address handoff; generated upstream files remain untracked.
- Added an explicit mobile viewport and repaired narrow-screen navigation and lesson-card wrapping.
- Removed unused hosting scaffolding and expanded release tests.
- Marked the application package as private to prevent accidental npm publication; GitHub source remains Apache-2.0.

### 简体中文

- 修正 Level 2 投影重力分支，并收紧 Level 0 对目标控制、折扣回报、PPO 裁剪、reward exploit 和硬件安全边界的表述。
- 删除独立版本实际不可用的 `session:id`，只保留经过支持边界核对的 Hub 仓库和 HTTPS ONNX 两类 `move(ref)` 输入。
- Academy 嵌入模式关闭上游多人 signaling 与姿态广播，同时保留学习者主动触发的社区策略下载。
- Python 缺失函数错误跟随界面语言，并在恢复导入档案前校验数据。
- 加固本地服务识别、关闭接口的来源检查、端口冲突处理和 macOS 启动器。
- 让 `reset()` 与底盘切换等待模拟器真实就绪，并在策略触发被安全门拒绝时明确报错。
- 为固定模拟器版本的滚轮至双腿地址交接增加本地构建兼容补丁；生成的上游文件仍不进入 Git。
- 增加明确的移动端 viewport，并修复窄屏导航与课程卡片换行。
- 删除未使用的托管脚手架并扩充发布检查。
- 将应用包标记为 private，避免误发布到 npm；GitHub 源码仍采用 Apache-2.0。

## 0.2.0-preview — 2026-09-11

### English

- Added complete Chinese and English classroom UI, nine lessons, the 3D Lab, the `control.duck` API Reference, and core repository documentation.
- Rewrote lesson and lab copy around testable reinforcement learning terms: observation, action, reward, rollout, policy, and deployment boundaries.
- Saved the language preference in the local learning profile while preserving edited code and experiment records across language changes.
- Added bilingual structure tests to detect missing lesson, API, UI, or documentation counterparts.
- Added a release-ready project image and refreshed package and release metadata for v0.2.
- Added the Level 3 Task & Reward Lab for evaluating two reward and termination configurations against the same official ONNX policy with real MuJoCo rollouts.
- Added return, mean velocity, tracking error, action energy, smoothness, and termination metrics to the local experiment profile.
- Added reward, termination, and configuration-boundary tests.
- Added `npm run verify`, TypeScript CI, Dependabot, architecture documentation, and a maintainer release checklist.

### 简体中文

- 增加完整的中英文课堂界面、9 节课程、3D 实验室、`control.duck` API Reference 和配套仓库文档。
- 重写课程与实验文案，使用可验证的强化学习术语描述 observation、action、reward、rollout、policy 和部署边界。
- 语言偏好随本地学习档案保存；切换语言时保留学习者已编辑的代码和实验记录。
- 增加双语结构一致性测试，防止课程、API 或核心界面只更新一种语言。
- 增加适合公开发布的项目首图，并更新 v0.2 的包与 Release 元数据。
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
