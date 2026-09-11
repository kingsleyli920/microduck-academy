# Microduck Academy: open-source product roadmap

[简体中文](OPEN_SOURCE_ROADMAP.zh-CN.md) · English

Research date: 2026-09-10  
Audience: software and agent engineers who are new to reinforcement learning

## Position

Microduck already has three public technical layers: a hardware runtime, a reinforcement-learning stack, and a browser simulator. Microduck Academy connects those layers into a progressive learning workflow where a developer can read a concept, edit code, inspect metrics, control the official simulated robot, train a policy, and eventually deploy through the same policy contract.

The project should keep its lessons tied to the real Microduck interface. The official policy reads a 61D observation, returns 14 joint-position targets, and runs at 50 Hz. The training repository, browser simulator, and hardware runtime all use this contract.[1][2][3]

The current release is local-first and requires no account. The browser stores progress, code, experiment settings, and aggregate results. Accounts may later support cross-device sync, cloud GPU training, and community publishing, but should remain optional for local learning.

The Academy source is Apache-2.0. The current browser-simulator checkout does not declare a top-level license, so simulator builds, models, sounds, and visual assets are generated locally and excluded from this repository.[1][2][3]

## Three kinds of robot programming

### 1. Compose existing policies

Commands such as `skill("roll")`, `skill("kick_left")`, and `skill("ground_pick")` invoke trained ONNX policies. The learner writes control flow while the dynamic motor skill already exists. Keyboard bindings and click-to-walk controls belong to this layer.[10]

This path is immediate, stable, and does not require a GPU.

### 2. Define deterministic poses and trajectories

A program can interpolate joint targets on a timeline. This works for gestures and slow choreography and teaches joint order, limits, and update rates. It is less suitable for motions that require dynamic balance, impact recovery, or robust landing. The interface should label this as trajectory control rather than reinforcement learning.

### 3. Train a new dynamic policy

A new flip, gait, or recovery behavior requires a task definition: initial state, command, observation, action, reward, termination, and domain randomization. PPO then collects rollouts across many parallel environments and updates the policy. The result is exported as a `[1,61] → [1,14]` ONNX model, evaluated in simulation, described by a policy manifest, and finally installed on hardware.[2][4]

Binding the B key to an existing roll uses layer 1. Teaching a motion that no installed policy can perform uses layer 3. The Academy keeps this distinction visible.

## Official technical path

1. `microduck_rl` trains MJLab tasks with MuJoCo Warp and PPO. The official quickstart uses 4,096 parallel environments and requires CUDA for full training; Hugging Face Jobs is another execution target.[2]
2. Official environments cover velocity, stand-up, sit/stand, ground pick, ball kick, roll, wheels, and spin.[2]
3. The exporter includes the observation normalizer in ONNX. Manually converting a checkpoint would send unnormalized observations to the runtime.[2]
4. The browser simulator runs MuJoCo WASM and performs ONNX inference at 50 Hz without a dedicated backend.[1]
5. The hardware runtime controls 15 servos at 50 Hz. Policies control 14 motion joints while the mouth motor is handled separately.[3]
6. A schema-2 `manifest.json` records tensor dimensions, robot model, control rate, skill type, command encoding, training provenance, and evaluation results.[4]

The resulting artifact lifecycle is:

```text
lesson code → task config → training run → checkpoint → ONNX
→ manifest → simulator evaluation → hardware installation
```

## Common community work before hardware ships

- Add simulator input sources while reusing an existing velocity policy.
- Validate the 61D/14D contract with local CPU inference.
- Add an MJLab task configuration, train it, export ONNX, and report fixed-seed evaluation.
- Build agents, MCP tools, CLIs, and orchestration around the JSON-RPC and skill contracts.
- Document installation constraints, ARM/CUDA compatibility, reproducible runs, and policy indexes.

Hardware compatibility claims should remain marked as unverified until tested on a physical robot.

## Lessons from related projects

| Project | Proven pattern | Application in the Academy |
| --- | --- | --- |
| Microduck Simulator | Real MuJoCo and ONNX in a browser | Connect each lab to policy telemetry. |
| Microduck RL/runtime | Training, export, manifests, and hardware installation form one path | Base lessons on the 61D/14D contract and policy lifecycle. |
| LeLab / LeRobot | A graphical workflow can join configuration, data, training, and deployment | Add training-job, checkpoint, evaluation, and device views later. |
| MuJoCo Playground | Open GPU environments can support sim-to-real workflows | Reuse task templates, reproducible experiments, and benchmark evaluation. |
| Gymnasium Robotics | Consistent reset, step, observation, and action interfaces | Teach a transferable environment API. |
| JupyterLite | Python can run and persist locally in the browser | Keep the foundation course local and account-free. |
| Blockly Games | Open, offline, level-based programming courses work | Use visible progression, immediate feedback, and shareable work. |
| freeCodeCamp | Accounts can sync challenge completion | Add optional sync without blocking anonymous use. |

## Curriculum

### Level 0: reinforcement-learning foundations

Nine short Python lessons connect environment, observation, policy, action, reward, rollout, return, PPO, evaluation, and safety. The goal is conceptual causality, not Python syntax instruction.

### Level 1: inspect the real Microduck policy

Six guided experiments cover the 61D observation, 14D action, command changes, the 50 Hz policy loop, and policy switching.

### Level 2: control programming

The `control.duck` language invokes existing skills, sends continuous commands, waits, loops, branches on observations, resets after failures, and loads compatible community policies.

### Level 3: task and reward evaluation

The current A/B lab edits commands, reward weights, and termination thresholds, then collects real MuJoCo rollouts from one fixed policy. It teaches evaluation and reward exploits without claiming to update model weights.

### Level 4: PPO training and evaluation

Submit local NVIDIA or Hugging Face Jobs training, display reward, episode length, fall rate, energy, success rate, and recordings, and compare a baseline with new checkpoints across fixed seeds.

### Level 5: policy engineering

Export ONNX, validate inputs, outputs, and finite values, complete the manifest, run fixed-seed browser evaluations, and publish to a private or public Hub repository with provenance.

### Level 6: hardware deployment

Connect the device, check firmware and policy APIs, install a test skill, begin with limited motion, collect hardware observations, compare simulator trajectories, and verify rollback.

## Progress and accounts

The current browser profile is versioned and stores the locale, lesson progress, code, Level 1 and Level 3 state, the control program, and aggregate results in `localStorage`. JSON export and import provide the first cross-device path. Larger trajectories, recordings, and ONNX artifacts should move to IndexedDB.

Accounts should appear only for cross-device sync, cloud training quotas, publishing, comments, leaderboards, or team classrooms. Local lessons should remain fully usable without one.

## Architecture direction

```text
apps/web
  course-engine        lesson graph, tests, unlocks, profile
  simulator-adapter    versioned bridge independent of one simulator build
  policy-lab           ONNX loading, contract checks, fixed-seed evaluation
packages/contracts
  lesson-schema        bilingual lesson and test format
  skill-script         bounded control DSL
  microduck-policy     61D/14D and manifest schema
workers/python         Pyodide test runner
services/training      optional local NVIDIA or HF Jobs adapter
```

The current prototype reads the same-origin iframe’s `window.rl` test surface. A stable public integration should use a small versioned bridge with `ready`, `getState`, `invokeSkill`, `setCommand`, `reset`, and event messages.

Training should also use adapters. The browser produces a reviewable task patch or job specification, while execution can occur on local NVIDIA hardware, a user-managed machine, or a cloud GPU service.

## Open-source reputation

Reputation comes from reusable work and maintenance rather than star count. Useful evidence includes a complete runnable learning path, clear contracts, contributor documentation, browser acceptance tests, fixed dependencies, honest limitations, upstream contributions, and eventually a reproducible new Microduck policy with failed cases as well as successful ones.

The Academy should not create another general-purpose RL framework. Its distinct contribution is curriculum design, observability, reproducible evidence, and end-to-end Microduck integration.

## Milestones

### M1: Simulator Bridge — implemented

- Invoke roll, kick, ground-pick, and reset.
- Run control scripts and keyboard bindings.
- Observe actual behavior in the browser.
- Save script text and run count locally.

### M2: Instrumented Policy Lab — foundation implemented

- Display observation, command, and action groups.
- Capture a frame, send a command, inspect policy response, and switch policies.
- Run reward A/B evaluation over MuJoCo rollouts.
- Next: add complete timelines and fixed-seed comparisons for arbitrary compatible ONNX models.

### M3: Training Job Lab — planned

- Edit a task and reward configuration based on an official environment.
- Generate a reviewable patch rather than arbitrary shell commands.
- Run a small smoke training job before full training.
- Keep checkpoint selection, ONNX export, manifest creation, and Hub publishing as explicit steps.

## Sources

1. [Pollen Robotics: Microduck Simulator](https://huggingface.co/spaces/pollen-robotics/microduck-simulator)
2. [Pollen Robotics: microduck_rl](https://github.com/pollen-robotics/microduck_rl)
3. [Pollen Robotics: microduck runtime](https://github.com/pollen-robotics/microduck)
4. [Microduck policy manifest, schema 2](https://github.com/pollen-robotics/microduck/blob/main/docs/policy-manifest.md)
5. [Hugging Face: LeLab](https://github.com/huggingface/lerobot/blob/main/docs/source/lelab.mdx)
6. [Google DeepMind: MuJoCo Playground](https://github.com/google-deepmind/mujoco_playground)
7. [Farama Foundation: Gymnasium Robotics](https://github.com/Farama-Foundation/Gymnasium-Robotics)
8. [JupyterLite browser storage](https://jupyterlite.readthedocs.io/en/stable/howto/configure/storage.html)
9. [Blockly Games](https://github.com/blockly-games/blockly-games)
10. [Microduck Simulator discussion #3: click-to-walk](https://huggingface.co/spaces/pollen-robotics/microduck-simulator/discussions/3)
11. [freeCodeCamp user-token workflow](https://contribute.freecodecamp.org/user-token-workflow/)
