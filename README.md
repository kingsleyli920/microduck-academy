# Microduck Academy

[![CI](https://github.com/kingsleyli920/microduck-academy/actions/workflows/ci.yml/badge.svg)](https://github.com/kingsleyli920/microduck-academy/actions/workflows/ci.yml)
[![Preview release](https://img.shields.io/github/v/release/kingsleyli920/microduck-academy?include_prereleases&label=preview)](https://github.com/kingsleyli920/microduck-academy/releases)
[![License](https://img.shields.io/github/license/kingsleyli920/microduck-academy)](LICENSE)

[English](README.en.md) · 中文

一个面向有软件工程基础、初学强化学习的开发者的 Microduck 强化学习课堂。学习者在同一个页面阅读任务、写 Python、运行测试、观察即时结果，并进入官方 Microduck 3D 模拟器。

这是独立的社区课堂项目，与 Pollen Robotics 或 Hugging Face 没有隶属、合作或背书关系。

**项目状态：公开 Preview。** Level 0–3 已能在本地课堂中运行；PPO 训练、ONNX 导出和真机安装仍在路线图中。能力声明以[发布状态](docs/RELEASE_STATUS.zh-CN.md)为准，运行和数据边界见[架构文档](docs/ARCHITECTURE.md)。

![Microduck Academy 中文课程界面](docs/assets/course.zh-CN.jpg)

## 快速开始

需要 Node.js 22 或更新版本、Git 和 Git LFS：

```bash
git clone https://github.com/kingsleyli920/microduck-academy.git
cd microduck-academy
npm ci
npm run setup:runtime
npm run build
npm run academy
```

打开 `http://localhost:3210`，进入“3D 实验场”后即可边写 `control.duck`、边观察官方 ONNX 策略。

![Microduck Academy 中文 3D 控制编程](docs/assets/lab.zh-CN.jpg)

## 当前能力

- 9 节逐步解锁的中英文练习：reward、observation/action、command-conditioned policy、rollout、连续动作探索、discounted return、PPO clip、reward hacking、部署安全层
- Level 1 的 6 个真实策略实验：61D observation、14D action、command、policy mode、控制响应与安全重置
- Pyodide Web Worker 在浏览器本地执行 Python，不把学习者代码上传到服务器
- 每关 3 组真实函数测试，显示实际值和期望值
- 自动保存当前关卡、已完成关卡和代码
- 同屏测试结果与官方 MuJoCo + ONNX 3D 模拟器
- Level 2 控制程序可用 `drive`、`turn`、`look` 连续发送 command，用 `if obs[i]` 和 `repeat` 编写反馈逻辑，也能调用官方 skills、坐站控制和社区策略
- Level 2 内置可搜索的 25 项完整 `control.duck` Reference；文档以编辑器右侧抽屉打开，示例插入后保持可查。完整中文版见 [`docs/CONTROL_API.zh-CN.md`](docs/CONTROL_API.zh-CN.md)
- Level 3 Task & Reward Lab 可设置目标速度、四项 reward 权重与两个 termination 条件，用官方 MuJoCo 状态采集 A/B rollout，并比较 return、跟踪误差和 action energy
- 中英文课堂界面、课程内容、API Reference 和仓库文档
- Level 0–6 学习路线、同类开源项目调研与产品架构
- 版本化 local-first 学习档案，可导出/导入 JSON
- macOS 一键启动，网页内“停止课堂”可关闭本地服务

## 学习者怎么用

完成首次源码安装后，macOS 用户也可以直接双击仓库根目录的 `launch-microduck-academy.command`。页面打开后，按“本节目标”修改代码并点击“运行代码”；测试通过后继续下一节。

页面右上角的“停止课堂”会关闭本地 Node.js 服务。学习进度保存在浏览器的 `localStorage` 中；“学习路线”页可以导出或导入完整学习档案。

课堂不要求登录，不录制屏幕，也不会把学习进度、代码或实验记录上传到服务端。完整说明见 [`PRIVACY.md`](PRIVACY.md)。

在“3D 实验场”中，课堂会通过官方的 `?boot=1` 入口自动启动模拟器。Level 2 的控制程序会在运行时读取 observation，并向现有 policy 发送速度、转向和头部 command；`skill()` 用于切换内置 policy，`move(ref)` 可以加载官方 manifest 兼容的 Hub / Academy / ONNX 社区动作。训练全新动态动作需要走任务定义、GPU 训练、ONNX 导出与评估流程。

3D 实验场默认打开“Level 1 · 观察策略”。它从官方 simulator 的实时控制循环读取 observation、action、command 和 mode，并按页面提示依次完成六个实验；切换到“Level 2 · 控制编程”可以运行带循环和 observation 条件分支的程序。

切换到“Level 3 · Reward 实验”可以给同一个官方 walk policy 配置两套评分函数，分别运行真实 rollout 并比较结果。这里是在学习任务定义和评估，不会更新 ONNX 权重；具体公式、指标解释和边界见 [`docs/REWARD_LAB.zh-CN.md`](docs/REWARD_LAB.zh-CN.md)。

当前发布边界见 [`docs/RELEASE_STATUS.zh-CN.md`](docs/RELEASE_STATUS.zh-CN.md)；完整调研、课程结构、账号策略和开源里程碑见 [`docs/OPEN_SOURCE_ROADMAP.zh-CN.md`](docs/OPEN_SOURCE_ROADMAP.zh-CN.md)。

## 从源码运行

需要 Node.js 22 或更新版本、Git 和 Git LFS。仓库不分发官方模拟器、ONNX、机器人模型或 Pyodide 构建产物；首次安装时会从固定版本的上游源码和 npm 包生成本地运行时，因此需要联网并会比普通前端安装更久。

```bash
npm ci
npm run setup:runtime
npm run build
npm run academy
```

浏览器会打开 `http://localhost:3210`。以后修改 Academy 源码时运行统一检查：

```bash
npm run verify
```

`npm run academy` 会在 `127.0.0.1:3210` 启动带关闭接口的本地代理；内部 Vinext 服务使用 `3211`。服务只监听本机。

## 增加关卡

关卡全部定义在 `app/lessons.ts`。每关提供题目、初始代码、提示、函数名和测试数据。`public/python-worker.js` 会在独立 Web Worker 中加载 Pyodide，执行函数并比较结果。

贡献流程见 [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)，使用问题见 [`SUPPORT.zh-CN.md`](SUPPORT.zh-CN.md)，维护和发版步骤见 [`docs/MAINTAINER_GUIDE.zh-CN.md`](docs/MAINTAINER_GUIDE.zh-CN.md)。每份文档顶部都可以切换英文版本。

## 与真实强化学习训练的关系

Level 0 的九节练习会立即显示函数输出，但修改奖励函数不会直接改变 3D 鸭子的动作。动作策略需要在支持 NVIDIA CUDA 的机器上重新训练，再导出为 ONNX。Apple Silicon Mac 适合运行课堂、浏览器模拟器和已训练策略；正式训练建议使用云端 GPU。

## 官方模拟器资源

`npm run setup:runtime` 优先使用相邻的 `../simulator` checkout；没有时会下载固定提交 `023172c`。生成的模拟器和 Pyodide 目录都在 `.gitignore` 中。只检查现有运行时可用：

```bash
npm run check:runtime
```

`MICRODUCK_SIMULATOR_DIR=/path/to/checkout npm run setup:runtime` 可以指定现有 checkout。为保证课程与 API 一致，脚本默认拒绝非固定提交；本地开发确需试验上游新版本时可设置 `MICRODUCK_SIMULATOR_ALLOW_UNPINNED=1`。

官方 Simulator Space 当前没有声明顶层许可证，因此本仓库只开源 Academy 自有源码，不提交其构建资源。完整边界见 `THIRD_PARTY_NOTICES.md`。

## 技术结构

- Next.js 兼容 API，由 Vinext + React 19 构建
- Node.js 本地控制服务
- Pyodide 0.29.3 / CPython WebAssembly
- Pollen Robotics 官方 Microduck 浏览器模拟器
- Shadcn UI 与 Tailwind CSS

Academy 自有源码使用 Apache-2.0。公开源码与 Preview Release 位于 [`kingsleyli920/microduck-academy`](https://github.com/kingsleyli920/microduck-academy)。
