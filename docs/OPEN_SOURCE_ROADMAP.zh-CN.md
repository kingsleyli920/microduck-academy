# Microduck Academy：开源学习平台可行性与产品路线

研究日期：2026-09-10
目标读者：懂软件与 Agent 工程、刚开始学习强化学习的开发者

## 结论

这个项目值得做，而且目前是很好的时间窗口。Microduck 官方已经公开了三层关键能力：真机运行时、强化学习训练栈、浏览器模拟器。缺少的是把这三层组织成一条低摩擦学习路径的产品。Microduck Academy 可以占据这个位置：用户在一个页面里理解概念、修改代码、观察指标、控制官方模拟鸭、训练新策略，最后将同一策略契约部署到真机。

项目的核心差异应是“课程和真实工程共用同一个接口”，而不是另做一个与 Microduck 无关的强化学习玩具。官方策略的输入是 61 维 observation，输出是 14 个关节位置目标，以 50 Hz 执行；训练仓库、浏览器模拟器和真机运行时都围绕这份契约工作。[1][2][3]

第一版应该 local-first、免登录。浏览器本地保存进度、代码、实验和策略元数据；用户可以导出与导入学习档案。账号在第二阶段作为可选功能，用于跨设备同步、云端 GPU 训练、社区作品和排行榜。JupyterLite 已证明浏览器 Python、IndexedDB/localStorage 和静态部署能够组成可靠的无后端学习环境；Blockly Games 也证明了开源、离线、按关卡学习的模式。[8][9]

公开发布前有一个明确的许可事项：`pollen-robotics/microduck` 和 `pollen-robotics/microduck_rl` 声明 Apache-2.0，而当前 Hugging Face 浏览器 simulator checkout 中没有发现顶层 LICENSE。平台自己的代码可以开源；模拟器代码、模型、声音和视觉资产不能在未确认授权时直接重新分发。推荐把模拟器做成可替换 adapter，并在 CI 或首次启动时从上游固定 commit 获取资源、校验 hash，或者先获得上游的明确许可。[1][2][3]

## 用户写的代码怎样让鸭子动起来

这里有三种不同难度的“编程”，产品必须清楚区分。

### 1. 编排已有动作

`roll()`、`kick("left")`、`ground_pick()` 之类的代码调用已经训练好的 ONNX policy。它类似 Agent 调用现成 tool：用户写的是控制流，真正的运动技能已经存在。按键绑定也属于这一层。官方 simulator 暴露了 `triggerRoll`、`triggerKick`、`triggerGroundPick`、`resetSim` 等运行时入口；当前 Academy 原型已通过同源 iframe 桥接调用它们。

这条路线即时、稳定、无需 GPU。社区给官方 simulator 增加 click-to-walk 的合并贡献也是同一模式：把点击位置变成现有 locomotion policy 已经能跟踪的速度命令，没有训练新 policy。[10]

### 2. 编写确定性轨迹或姿态

用户给关节写目标姿态、插值和时间轴。这适合挥手、点头或缓慢舞蹈，也适合学习关节顺序、限位和控制频率。动态平衡能力弱，复杂翻滚、落地和受扰恢复不宜只靠关键帧。平台可以提供 pose editor，但应把它标为 trajectory/controller 路线，而不是强化学习。

### 3. 训练一个全新动态技能

如果目标是从未存在过的翻跟头、鞠躬或新步态，用户需要定义训练任务：初始状态、command、observation、action、reward、termination 和 domain randomization；然后在大量并行环境中用 PPO 收集 rollout 并更新 policy。训练结果导出为 `[1,61] → [1,14]` ONNX，先在模拟器评估，再生成 Microduck policy manifest，最后由真机运行时加载。[2][4]

所以，“给 B 键绑定翻滚”只需要第 1 层；“让鸭子学会一个以前不会的后空翻”需要第 3 层。两者都应该在课堂中出现，但不能让用户误以为一段动作脚本会自动变成新的神经网络技能。

## 官方技术链路

1. `microduck_rl` 用 MJLab、MuJoCo Warp 和 PPO 训练任务。官方 quickstart 使用 4096 个并行环境；完整训练要求 CUDA GPU，也支持通过 Hugging Face Jobs 提交云端训练。[2]
2. 环境族包括 velocity、stand-up、sit/stand、ground pick、ball kick、roulade、rollers 和 spin。Roulade 的定义是向前越过头部翻滚并重新站到脚上。[2]
3. exporter 把 observation normalizer 烘焙进 ONNX。官方说明不应手工转换 checkpoint，否则运行时会收到未归一化的 observation。[2]
4. 浏览器 simulator 用 MuJoCo WASM 跑物理，用 onnxruntime-web 以 50 Hz 推理；无专用后端。[1]
5. 真机 `robotd` 在 Rockchip RK3566 上运行 50 Hz 控制循环，驱动 15 个舵机；policy 控制其中 14 个运动关节，嘴部电机单独控制。客户端、游戏手柄和脚本通过统一 JSON-RPC 合约通信。[3]
6. 新策略可以和 `manifest.json` 一起发布到 Hugging Face Hub。manifest schema 2 描述 obs/action 维度、机器人型号、控制频率、skill 类型、时长、command encoding、训练来源和评估结果。真机用 `robotctl policy add` 注册 episodic skill，用 `robotctl policy load` 替换 gait/slot。[4]

这给平台提供了天然的 artifact 生命周期：`lesson code → task config → training run → checkpoint → ONNX → manifest → simulator eval → hardware install`。

## 社区现在通常怎样开发

截至本次调研，硬件仍处于预发货阶段，所以社区工作的主体是 simulator、policy、开发工具和文档。真机兼容声明需要谨慎；外部项目多数无法完成真实硬件验收。

目前能观察到的典型贡献方式是：

- 在官方 simulator 中增加输入源或交互方式，复用现有速度 policy。Click-to-walk 已经通过 Hugging Face discussion/PR 合入上游。[10]
- 从官方 ONNX 开始做本地 CPU inference，验证 61/14 接口，再尝试短训练或新 reward。
- 为新 task 增加 MJLab env config，训练并导出 ONNX；用录像、成功率和 sim2real testbench 验证。
- 围绕官方 JSON-RPC 和 skill contract 做 agent、MCP、CLI 或编排器。因为硬件未普及，这些项目应明确标注 sim-only 或 hardware-unverified。
- 整理安装陷阱、ARM/CUDA 兼容性、任务复现和策略索引。对早期生态而言，高质量文档与可复现实验本身就是有价值的开源贡献。

## 同类开源项目给我们的启示

| 项目 | 已证明的模式 | Academy 应借鉴什么 |
| --- | --- | --- |
| Microduck simulator | 浏览器中跑真实 MuJoCo + ONNX，无训练服务器 | 让每关直接连到真实策略和 telemetry |
| Microduck RL/runtime | 训练、导出、manifest、真机安装是贯通的 | 所有课程围绕 61D/14D 与 policy 生命周期设计 |
| LeLab / LeRobot | 一个 GUI 串起配置、数据、训练和部署 | 后期加入训练 job、checkpoint、eval 和设备页面；不要让用户背 CLI |
| MuJoCo Playground | 开源 GPU 环境和 sim-to-real 任务结构 | 任务模板、可复现实验、基准评估与研究级扩展 |
| Gymnasium Robotics | 标准化 reset/step/observation/action | 初级课程使用统一 Env API，便于迁移知识 |
| JupyterLite | Python 在 Web Worker/WASM 中执行，本地持久化 | 保持免安装、免登录、可嵌入和静态部署 |
| Blockly Games | 开源、离线和闯关式编程 | 明确的地图、即时反馈、解锁和分享作品 |
| freeCodeCamp | 登录后把 challenge 完成记录关联到用户 | 账号同步作为增强层，不阻塞匿名学习 |

LeLab 是最接近“一站式机器人学习 GUI”的公开参照：它能配置机器人、遥操作、记录数据、训练、查看训练进度并运行 policy，但目前只支持 SO-101。[5] Academy 的机会是为 biped RL 提供同样顺畅的体验，并增加真正的教学关卡和浏览器 simulator。

## 课程结构

### Level 0：强化学习心智模型（已有 9 关）

让 Agent 工程师建立 environment、observation、policy、action、reward、rollout、return、PPO、evaluation 和 safety 的映射。代码短、判题快，重点是概念之间的因果关系。

### Level 1：读懂 Microduck 的真实策略（已实现 6 个引导实验）

1. 拆解 61D observation。
2. 把 14D action 映射到关节。
3. 观察 last action 与控制稳定性。
4. 修改 velocity command，看同一 policy 如何响应目标。
5. 观察 50 Hz policy 与更高频物理 step 的关系。
6. 比较 walk、sitstand、kick、roulade 的 policy 切换。

### Level 2：行为编排（建议 6 关，原型已开始）

1. 调用一个现成 skill。
2. 将 skill 绑定到按键。
3. 用 wait 与顺序组合动作。
4. 根据 mode/telemetry 做条件分支。
5. 发生跌倒时 reset/recover。
6. 保存并分享一个 choreography。

### Level 3：任务与 Reward（建议 8 关）

从一个最小 MJLab task 开始，逐步加入 reset、dense reward、terminal reward、energy penalty、command curriculum 和 domain randomization。每次修改都跑少量 environments/iterations 的 smoke test，先验证系统能学，再花 GPU 时间。

### Level 4：PPO 训练与评估（建议 6 关）

提交本地 NVIDIA 或 HF Jobs 训练，展示 reward curve、episode length、fall rate、energy、success rate 和录像。要求至少对比 baseline 与新 checkpoint，专门设计一关排查 reward hacking。

### Level 5：Policy 工程（建议 5 关）

导出 ONNX、校验输入输出与 NaN、填写 manifest、在浏览器竞技场做固定 seed 回放、发布私有或公开 Hub repo。训练、代码 commit、checkpoint 和 eval 结果进入 provenance。

### Level 6：真机部署（硬件到货后）

连接设备、检查固件与 policy API、安装测试 skill、低风险姿态验证、逐步提高动作幅度、采集真机 observation、与 simulator 轨迹对比，最后建立回滚路径。

## 学习进度与账号设计

### 当前阶段：local-first

浏览器保存一个带版本号的学习档案：

```json
{
  "schemaVersion": 2,
  "currentId": 1,
  "completed": [],
  "solutions": {},
  "simulatorScript": "roll()",
  "simulatorRuns": 1,
  "updatedAt": "2026-09-10T00:00:00.000Z"
}
```

MVP 使用 localStorage 足够保存关卡与文本；当实验记录、录像、ONNX 和多版本代码增加后，应迁移到 IndexedDB。导出/导入 JSON 是第一条跨设备路径。JupyterLite 默认选择可用的持久化浏览器 driver，通常是 IndexedDB，并允许 localStorage fallback，这与我们的选择一致。[8]

### 第二阶段：可选账号

账号只在用户需要以下能力时出现：跨设备同步、云端训练额度、发布作品、排行榜、评论与团队课堂。服务端记录 immutable attempt/event，客户端保留 materialized profile；用 `profileId + schemaVersion + updatedAt` 做合并。代码与实验用内容 hash 去重，冲突时保留双方版本，不静默覆盖。

大型平台使用服务端账号保存 challenge 完成状态，例如 freeCodeCamp 会把第三方 challenge 提交关联到用户的 `completedChallenges`。[11] 这适合社区功能，但不应成为本地学习的前置条件。

## 开源架构建议

```text
apps/web
  course-engine        课程图、判题、解锁、学习档案
  simulator-adapter    postMessage / 同源 adapter，不绑定某一 simulator 实现
  policy-lab           ONNX 加载、contract 校验、固定 seed eval
packages/contracts
  lesson-schema        课程内容与测试格式
  skill-script         白名单动作 DSL
  microduck-policy     61/14 + manifest schema
workers/python         Pyodide 判题
services/training      可选 HF Jobs / 本地 worker adapter
```

Simulator adapter 应优先使用 `postMessage` 形式的公开、版本化协议。当前原型直接读取同源 iframe 的 `window.rl`，适合证明可行性，但它是上游的 debug/QA surface，不是稳定公共 API。下一步应向上游提出一个很小的正式 bridge 提案：`ready`、`getState`、`invokeSkill`、`setCommand`、`reset` 和事件回传。

训练服务应是 adapter：浏览器生成 task patch/job spec；执行可以是本地 NVIDIA、用户自己的机器、HF Jobs 或其他云 GPU。Apple Silicon 本机继续负责课程、CPU inference 和浏览器 simulator，不承诺复现官方 MuJoCo Warp 训练吞吐。

## 开源与 reputation 路线

Reputation 来自可复用成果和持续维护，不只来自 star 数。最有效的顺序是：

1. 公开一条完整、可运行的 Level 0–2 学习路径和中英 README。
2. 把课程、simulator adapter 和 policy contract 拆清楚，提供贡献指南与 good first issue。
3. 为每个 release 保存浏览器验收、固定版本、已知限制和短 demo。
4. 把通用改进回馈上游，例如正式 simulator bridge、可访问性、文档、policy validator 或小型测试。
5. 发布一个真正的新 Microduck policy，附可复现训练命令、commit、manifest、固定 seed eval 和失败案例。
6. 硬件到货后补上真机 telemetry 与 sim-to-real 报告。这会是项目从“漂亮 demo”走向可信工具的关键证据。

建议项目早期避免自己造通用 RL framework。我们的独特价值是教学编排、可视化、运行证据和 Microduck 端到端集成；训练算法继续依赖官方 MJLab/PPO 栈。

## 接下来三个可交付里程碑

### M1：Simulator Bridge（当前）

- 页面调用 roll/kick/pick/reset。
- 行为脚本、快捷键、mode 状态。
- 浏览器中证明动作真实发生。
- 学习档案记录脚本与运行次数。

### M2：Instrumented Policy Lab（基础版本已实现）

- 已新增 Level 1 六个自动引导实验。
- 已在页面显示 61D observation 分组、13D command 和 14D action。
- 已支持冻结一帧、发送速度 command、观察 action 响应和切换 roll policy。
- 后续增加完整 rollout 时间轴，以及导入任意符合契约的 ONNX 与固定 seed baseline 对比。

### M3：Training Job Lab

- 基于官方 env config 的 reward/task 编辑器。
- 生成可审查 diff，不直接拼接任意 shell。
- 提交 64 env × 5 iteration smoke test。
- 完整训练、checkpoint、ONNX export、manifest 与 Hub 发布保持分步授权。

## 来源

1. Pollen Robotics, “Microduck Simulator,” Hugging Face Space repository and README: <https://huggingface.co/spaces/pollen-robotics/microduck-simulator>
2. Pollen Robotics, `microduck_rl`, official training repository: <https://github.com/pollen-robotics/microduck_rl>
3. Pollen Robotics, `microduck`, official robot runtime repository: <https://github.com/pollen-robotics/microduck>
4. Pollen Robotics, “The policy manifest, schema 2”: <https://github.com/pollen-robotics/microduck/blob/main/docs/policy-manifest.md>
5. Hugging Face, “LeLab - LeRobot Guide”: <https://github.com/huggingface/lerobot/blob/main/docs/source/lelab.mdx>
6. Google DeepMind, `mujoco_playground`: <https://github.com/google-deepmind/mujoco_playground>
7. Farama Foundation, `Gymnasium-Robotics`: <https://github.com/Farama-Foundation/Gymnasium-Robotics>
8. JupyterLite documentation, “Configure the browser storage”: <https://jupyterlite.readthedocs.io/en/stable/howto/configure/storage.html>
9. Google Blockly Games, repository and offline documentation: <https://github.com/blockly-games/blockly-games>
10. Microduck Simulator discussion #3, “Add click-to-walk waypoint source”: <https://huggingface.co/spaces/pollen-robotics/microduck-simulator/discussions/3>
11. freeCodeCamp contributor documentation, “How the User Token Workflow Works”: <https://contribute.freecodecamp.org/user-token-workflow/>
