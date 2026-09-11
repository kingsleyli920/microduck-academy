# 安全政策

[English](SECURITY.md) · 简体中文

请使用本仓库的 GitHub 私密漏洞报告功能提交安全问题，不要创建公开 Issue。报告应包含受影响版本、复现步骤和预期影响。

## 支持版本

安全修复面向 `main` 最新提交和最新 Preview Release。旧预览版本不保证回移修复。

## 范围

学习者的 Python 通过 Pyodide 在浏览器 Web Worker 中执行。`control.duck` 只接受受限语法；社区 ONNX policy 和 manifest 仍是不可信输入，使用前必须通过上游模拟器的兼容性和 smoke test。

涉及官方 Microduck 模拟器、机器人固件或训练仓库的问题可能需要与 Pollen Robotics 协调。如果问题会影响 Academy 用户，请仍然先通过私密渠道提交 Academy 集成报告。
