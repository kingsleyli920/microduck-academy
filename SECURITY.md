# Security

[简体中文](SECURITY.zh-CN.md) · English

Please report a vulnerability through GitHub's private vulnerability reporting for this repository instead of opening a public issue. Include the affected version, reproduction steps, and expected impact.

## Supported versions

Security fixes target the latest commit on `main` and the newest tagged preview release. Older preview releases may not receive backports.

## Scope

Learner Python runs locally in a browser Web Worker through Pyodide. The `control.duck` interpreter accepts a bounded language, but community ONNX policies and manifests remain untrusted input and must pass the upstream simulator's compatibility and smoke checks before use.

Reports involving the official Microduck simulator, robot firmware, or upstream training repositories may need to be coordinated with Pollen Robotics. Please still report an Academy integration issue privately when it exposes Academy users.
