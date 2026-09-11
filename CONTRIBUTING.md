# Contributing to Microduck Academy

Thanks for helping make reinforcement learning easier to learn with Microduck.

## Local setup

Use Node.js 22+, Git, and Git LFS.

```bash
npm install
npm run setup:runtime
npm test
npm run lint
npm run build
npm run academy
```

The runtime setup downloads a pinned copy of the official Microduck simulator. Generated simulator, policy, robot, asset, and Pyodide directories are intentionally ignored by Git.

## Pull requests

- Keep lesson claims tied to code that learners can run.
- Add or update a test when changing `control.duck` parsing or published API examples.
- Run `npm test`, `npm run lint`, and `npm run build` before opening a pull request.
- Do not commit official simulator builds, ONNX policies, robot assets, secrets, training outputs, or user learning profiles.
- Mark simulator-only and hardware-unverified behavior clearly.

By contributing, you agree that your contribution is licensed under Apache-2.0.
