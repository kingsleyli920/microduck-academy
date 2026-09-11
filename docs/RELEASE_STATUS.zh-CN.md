# Microduck Academy 发布状态

公开仓库：<https://github.com/kingsleyli920/microduck-academy>

当前版本：`v0.2.1-preview`

## v0.2 的准确定位

当前版本是一个中英文、local-first 的开源预览：包括强化学习入门、真实策略观察、浏览器动作编排和 Reward A/B 评估。它不是完整训练平台，也尚未连接真实 Microduck。

| 能力 | 状态 |
| --- | --- |
| 中英文课堂 | 可用；覆盖界面、课程、实验室、API Reference 和核心仓库文档 |
| Level 0：强化学习心智模型 | 可用，9 关 |
| Level 1：61D observation / 14D action 实验 | 可用，6 个实验 |
| Level 2：`control.duck` 与官方 3D 模拟器 | 可用，25 项 API |
| 社区策略加载 | 可通过桥接加载 manifest 兼容的 Hub 仓库或 HTTPS ONNX URL |
| Level 3：任务与 Reward A/B 实验 | 当前源码可用；真实 MuJoCo rollout，不更新 policy |
| Level 4：PPO 训练 | 尚未实现 |
| Level 5：评估、ONNX 导出与发布 | 尚未实现 |
| Level 6：真机安装与安全验证 | 尚未实现 |

Academy 嵌入模式关闭上游多人 signaling 和姿态广播；只有执行 `move(ref)` 时才会读取 Hub 仓库或 HTTPS ONNX。

语言偏好保存在浏览器本地学习档案中。切换语言不会覆盖学习者已经编辑的代码和实验记录。

## 源码与第三方边界

Academy 自有源码采用 Apache-2.0。官方 Microduck Simulator 当前没有声明顶层许可证，因此其代码、构建、模型、声音和图形资源不进入 Academy Git 仓库。`npm run setup:runtime` 由使用者从固定上游提交生成本地运行时。

当前同源 iframe 通过上游的 `window.rl` QA surface 通信。这适合作为本地原型；公开托管版本需要上游提供版本化 `postMessage` bridge，或在获得许可后部署同源 simulator service。

## 发布前检查

本次浏览器验收覆盖 macOS 桌面流程和 390 px Chrome 响应式视口。

```bash
npm ci
npm run setup:runtime
npm run verify
npm run academy
```

真机兼容声明必须等硬件到货后，通过真实设备的连接、限位、策略安装、回滚和 telemetry 验收。
