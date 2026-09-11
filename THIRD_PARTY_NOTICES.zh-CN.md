# 第三方软件与资源说明

[English](THIRD_PARTY_NOTICES.md) · 简体中文

本项目集成了以下上游项目的软件和资源。各文件继续适用其原始许可证。

## Microduck 模拟器与机器人资源

- 项目：Pollen Robotics / Hugging Face 的 Microduck Simulator
- 来源：<https://huggingface.co/spaces/pollen-robotics/microduck-simulator>
- 本地源码 checkout：`../simulator`
- 生成的运行时目录：`public/bundle`、`public/policies`、`public/robot`、`public/assets`、`public/simulator` 和 `public/microduck-simulator`

截至 2026-09-10 检查的 simulator 提交 `023172c8a7d629b5258d90364c13bafe013abbfa`，其 checkout 中没有顶层许可证文件，Space 元数据也未声明许可证。这些生成目录由 Git 忽略，并通过 `npm run setup:runtime` 从上游仓库获取。在许可条款确认前，不应提交或重新分发这些目录。

本地构建会在编译前应用一处最小兼容修复，编译后恢复上游 checkout：从滚轮切回双腿时保留腿部模型的脚踝 body ID，避免固定版本模拟器的脚步声音循环读取缺失地址。修复后的生成 bundle 仍被 Git 忽略，不会随仓库重新分发。

相关的官方运行时和训练仓库声明了 Apache-2.0：

- <https://github.com/pollen-robotics/microduck>
- <https://github.com/pollen-robotics/microduck_rl>

## Pyodide

- 项目：Pyodide
- 来源：<https://github.com/pyodide/pyodide>
- 版本：0.29.3
- 集成目录：`public/pyodide`

Pyodide 使用 Mozilla Public License 2.0 发布。Pyodide 发行包中包含的其他软件包继续适用各自许可证。
