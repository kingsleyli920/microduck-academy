# Third-party notices

[简体中文](THIRD_PARTY_NOTICES.zh-CN.md) · English

This project integrates software and assets from the following upstream projects. Their original licenses continue to apply to their respective files.

## Microduck simulator and robot assets

- Project: Microduck Simulator by Pollen Robotics / Hugging Face
- Source: <https://huggingface.co/spaces/pollen-robotics/microduck-simulator>
- Local source checkout: `../simulator`
- Generated runtime directories: `public/bundle`, `public/policies`, `public/robot`, `public/assets`, `public/simulator`, and `public/microduck-simulator`

No top-level license file or Space license metadata was present in the simulator checkout inspected on 2026-09-10 (commit `023172c8a7d629b5258d90364c13bafe013abbfa`). These generated directories are ignored by Git and are fetched from the upstream repository by `npm run setup:runtime`; they must not be committed or redistributed until their terms are confirmed.

The local build applies one narrow compatibility fix before compilation, then restores the upstream checkout: it retains the leg model's ankle body IDs when switching from rollers back to legs. This prevents the pinned simulator's footstep-audio loop from reading missing address metadata. The generated patched bundle remains ignored and is not redistributed.

The related official runtime and training repositories do declare Apache-2.0:

- <https://github.com/pollen-robotics/microduck>
- <https://github.com/pollen-robotics/microduck_rl>

## Pyodide

- Project: Pyodide
- Source: <https://github.com/pyodide/pyodide>
- Version: 0.29.3
- Integrated directory: `public/pyodide`

Pyodide is distributed under the Mozilla Public License 2.0. Packages included in the Pyodide distribution retain their own licenses.
