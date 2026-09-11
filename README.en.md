# Microduck Academy

English · [中文](README.md)

A local-first, CodeCombat-style reinforcement learning classroom for developers learning with Microduck. Learners read a mission, write code, run browser-local tests, inspect real policy telemetry, and control the official MuJoCo + ONNX simulator from one page.

![Microduck Academy lesson workspace](docs/assets/course.png)

## Quick start

Requirements: Node.js 22+, Git, and Git LFS.

```bash
git clone https://github.com/kingsleyli920/microduck-academy.git
cd microduck-academy
npm install
npm run setup:runtime
npm run build
npm run academy
```

Open `http://localhost:3210`, select **3D Lab**, and run a `control.duck` program against the official ONNX policies.

![Microduck Academy 3D control studio](docs/assets/lab.png)

## Current scope

- Level 0: nine guided lessons covering rewards, observations, actions, commands, rollouts, exploration, returns, PPO, reward hacking, and deployment safety
- Level 1: six experiments against the simulator's real 61D observation, 13D command, and 14D action contract
- Level 2: a bounded `control.duck` language with 25 documented API entries for continuous control, feedback logic, built-in skills, and compatible community moves
- Browser-local Python through Pyodide; progress stays in `localStorage` and can be exported as JSON

No account is required. The classroom does not record the screen or upload learner progress, code, or experiment history. See [PRIVACY.md](PRIVACY.md).

Task authoring, PPO training, ONNX publishing, and physical robot deployment are planned work. The current release is a simulator programming preview, not a complete training or hardware platform.

## Run from source

Requirements: Node.js 22+, Git, and Git LFS.

```bash
npm install
npm run setup:runtime
npm test
npm run lint
npm run build
npm run academy
```

Open `http://localhost:3210`. The Stop button shuts down the local service.

The repository does not redistribute the official simulator, ONNX policies, robot models, or generated Pyodide runtime. `npm run setup:runtime` builds those local files from a pinned upstream checkout and the installed Pyodide package. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [the current release boundary](docs/RELEASE_STATUS.zh-CN.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Academy source is licensed under Apache-2.0. Microduck is a Pollen Robotics project; this independent classroom is not affiliated with or endorsed by Pollen Robotics or Hugging Face.
