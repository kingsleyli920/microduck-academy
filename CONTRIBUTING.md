# Contributing to Microduck Academy

Thanks for helping make reinforcement learning easier to learn with Microduck.

## Local setup

Use Node.js 22+, Git, and Git LFS.

```bash
npm install
npm run setup:runtime
npm run verify
npm run academy
```

The runtime setup downloads a pinned copy of the official Microduck simulator. Generated simulator, policy, robot, asset, and Pyodide directories are intentionally ignored by Git.

## Pull requests

- Keep lesson claims tied to code that learners can run.
- Add or update a test when changing `control.duck` parsing or published API examples.
- Run `npm run verify` before opening a pull request. It checks release hygiene, tests, lint, TypeScript, and the production build.
- Do not commit official simulator builds, ONNX policies, robot assets, secrets, training outputs, or user learning profiles.
- Mark simulator-only and hardware-unverified behavior clearly.

## Project structure

- `app/lessons.ts` contains the introductory Python curriculum.
- `app/control-program.ts` implements the bounded `control.duck` language.
- `app/reward-lab.ts` contains Level 3 reward and termination calculations.
- `scripts/setup-runtime.mjs` builds the ignored, pinned upstream simulator runtime.
- `docs/ARCHITECTURE.md` explains the browser, local service, and upstream simulator boundaries.

Keep pull requests focused. Explain the learner-facing behavior first, include direct runtime evidence for simulator changes, and document anything that remains hardware-unverified.

By contributing, you agree that your contribution is licensed under Apache-2.0.
