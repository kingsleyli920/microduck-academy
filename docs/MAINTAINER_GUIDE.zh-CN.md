# 维护者指南

[English](MAINTAINER_GUIDE.md) · 简体中文

## 合并前

1. 确认 Pull Request 说明学习者可见的行为，以及模拟器或硬件边界。
2. 要求仓库 CI 全部通过。
3. UI、桥接、策略或 rollout 行为改变时，在真实浏览器模拟器中运行对应流程。
4. 确认 diff 中没有生成的运行时、policy、学习档案、密钥或机器本地路径。
5. 能力声明改变时，同时更新 changelog 和发布状态文档。

## Preview 发布检查

1. 将已评审的 Pull Request 合入 `main`。
2. 从干净 checkout 运行 `npm ci`、`npm run setup:runtime`、`npm run verify` 和 `npm run academy`。
3. 在浏览器中运行入门课程和所有改动过的 3D Lab 流程，并检查中英文界面。
4. 更新 `package.json` 版本，把 changelog 的 Unreleased 内容移到对应版本，并更新中英文发布状态。
5. 给准确的 `main` 提交打 tag，创建 GitHub prerelease，并写明安装步骤、已验证能力和限制。
