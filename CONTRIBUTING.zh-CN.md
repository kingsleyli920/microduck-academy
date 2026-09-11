# 参与 Microduck Academy

[English](CONTRIBUTING.md) · 简体中文

感谢你参与改进 Microduck 强化学习课程。

## 本地环境

需要 Node.js 22 或更新版本、Git 和 Git LFS。

```bash
npm ci
npm run setup:runtime
npm run verify
npm run academy
```

运行时安装会下载固定版本的官方 Microduck 模拟器。生成的模拟器、policy、机器人资源和 Pyodide 目录已由 Git 忽略。

## Pull Request

- 课程中的能力声明必须对应学习者可以运行的代码。
- 修改 `control.duck` 解析或公开 API 示例时，应增加或更新测试。
- 提交前运行 `npm run verify`。该命令会检查发布内容、文档链接、双语结构、测试、lint、TypeScript 和生产构建。
- 不要提交官方模拟器构建、ONNX policy、机器人资源、密钥、训练产物或学习档案。
- 清楚标明仅限模拟器和未经真机验证的行为。
- 改动界面文案时，同时更新中文和英文版本。

## 项目结构

- `app/lessons.ts`：中英文 Python 入门课程。
- `app/i18n.ts`：课堂通用文案与学习路线。
- `app/control-program.ts`：受限的 `control.duck` 语言。
- `app/reward-lab.ts`：Level 3 reward 与 termination 计算。
- `scripts/setup-runtime.mjs`：构建本地且不进入 Git 的固定上游模拟器运行时。
- `docs/ARCHITECTURE.md`：浏览器、本地服务和上游模拟器边界。

Pull Request 应保持范围清楚，先说明学习者可见的变化。模拟器相关改动需要提供直接运行证据，未经真机验证的部分必须明确标注。

提交代码即表示你同意使用 Apache-2.0 许可发布贡献内容。
