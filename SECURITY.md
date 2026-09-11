# Security

Please report a vulnerability through GitHub's private vulnerability reporting for this repository instead of opening a public issue. Include the affected version, reproduction steps, and expected impact.

Learner Python runs locally in a browser Web Worker through Pyodide. The `control.duck` interpreter accepts a bounded language, but community ONNX policies and manifests remain untrusted input and must pass the upstream simulator's compatibility and smoke checks before use.
