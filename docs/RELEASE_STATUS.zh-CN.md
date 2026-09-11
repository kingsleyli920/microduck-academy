# Microduck Academy 发布状态

公开仓库：<https://github.com/kingsleyli920/microduck-academy>

当前版本：`v0.1.0-preview`

## v0.1 的准确定位

当前版本是一个 local-first 的开源预览：完成强化学习入门、真实策略观察和浏览器动作编排。它不是完整训练平台，也尚未连接真实 Microduck。

| 能力 | 状态 |
| --- | --- |
| Level 0：强化学习心智模型 | 可用，9 关 |
| Level 1：61D observation / 14D action 实验 | 可用，6 个实验 |
| Level 2：`control.duck` 与官方 3D 模拟器 | 可用，25 项 API |
| 社区策略加载 | 模拟器基础路径可用 |
| Level 3–4：任务、reward、PPO 训练 | 尚未实现 |
| Level 5：评估、ONNX 导出与发布 | 尚未实现 |
| Level 6：真机安装与安全验证 | 尚未实现 |

## 源码与第三方边界

Academy 自有源码采用 Apache-2.0。官方 Microduck Simulator 当前没有声明顶层许可证，因此其代码、构建、模型、声音和图形资源不进入 Academy Git 仓库。`npm run setup:runtime` 由使用者从固定上游提交生成本地运行时。

当前同源 iframe 通过上游的 `window.rl` QA surface 通信。这适合作为本地原型；公开托管版本需要上游提供版本化 `postMessage` bridge，或在获得许可后部署同源 simulator service。

## 发布前检查

```bash
npm ci
npm run setup:runtime
npm run check:runtime
npm test
npm run lint
npm run build
```

真机兼容声明必须等硬件到货后，通过真实设备的连接、限位、策略安装、回滚和 telemetry 验收。
