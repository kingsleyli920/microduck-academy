# Release status

[中文](RELEASE_STATUS.zh-CN.md) · English

Current version: `v0.2.1-preview`

Microduck Academy is a public preview. The repository is suitable for learning, experimentation, and contribution, but does not yet provide an end-to-end policy-training and hardware-deployment workflow.

| Capability | Status |
| --- | --- |
| Chinese and English classroom | Available; UI, lessons, labs, API Reference, and core repository docs |
| Level 0 browser-local Python curriculum | Available, 9 lessons |
| Level 1 real policy observation | Available, 6 experiments |
| Level 2 `control.duck` programming | Available, 25 API entries |
| Compatible community policy loading | Manifest-compatible Hub repositories and HTTPS ONNX URLs through the simulator bridge |
| Level 3 reward and termination A/B lab | Available in the current source; real MuJoCo rollout, no policy update |
| Level 4 PPO training | Planned |
| Level 5 evaluation and ONNX export | Planned |
| Level 6 physical Microduck installation | Planned; hardware-unverified |

## Verified environment

- Node.js 22
- macOS browser workflow
- 390 px responsive Chrome viewport
- Official simulator commit `023172c8a7d629b5258d90364c13bafe013abbfa`
- Pyodide 0.29.3

Academy embedded mode disables upstream multiplayer signaling and pose broadcast. Hub or HTTPS ONNX files are fetched only after an explicit `move(ref)` command.

The selected language is stored with the browser-local learning profile. Switching languages preserves learner-edited code and experiment records.

The CI validates source hygiene, bilingual structure, Markdown links, tests, lint, TypeScript, and the production build. Simulator interaction is additionally checked in a real local browser because generated upstream assets are intentionally absent from GitHub Actions.

## Release verification

```bash
npm ci
npm run setup:runtime
npm run verify
npm run academy
```

## Distribution boundary

This repository distributes Academy-owned source under Apache-2.0. It does not redistribute generated simulator assets, robot models, official ONNX policies, or the Pyodide runtime. `npm run setup:runtime` produces those ignored files locally from pinned inputs. See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
