# Microduck Academy Control API

[简体中文](CONTROL_API.zh-CN.md) · English

This document describes every executable construct in the Level 2 `control.duck` language. Programs read the official simulator’s 61D observation, send commands to a 50 Hz policy, and switch between official or compatible community ONNX policies.

The table was checked against the interpreter and official simulator commit `023172c` on 2026-09-10. “Complete” refers to the language in this release. It does not include every future community motion or expose internal MuJoCo memory and render-loop objects as stable APIs.

## Five-minute example

```text
drive(0.18, 0.0, 1200)
turn(0.55, 600)

print(obs[5])
if obs[5] > -0.85 {
  look(0.30, -0.15, 0.45, 0.0, 800)
  skill("roll")
}

wait(3000)
reset()
```

## Portability labels

- **Portable**: the construct can move to hardware when the target runtime supplies the same command and observation contract.
- **Compatible policy required**: the target must include the named policy or feature.
- **Simulator only**: a physics or camera experiment with no direct hardware equivalent.

## Complete command index

| Command | Category | Portability | Purpose |
| --- | --- | --- | --- |
| `drive(vx, yaw, ms)` | Control | Portable | Send forward speed and yaw rate for a fixed duration. |
| `turn(yaw, ms)` | Control | Portable | Turn with zero forward speed. |
| `look(neck, pitch, yaw, roll, ms)` | Control | Compatible policy required | Send four head targets through command conditioning. |
| `wait(ms)` | Control | Portable | Pause script execution without stopping the active policy. |
| `print(obs[i])` | Logic | Portable | Read and print one observation value. |
| `repeat(n) { … }` | Logic | Portable | Repeat a nested block 1–20 times. |
| `if obs[i] < value { … }` | Logic | Portable | Execute a block when an observation condition passes. |
| `skill("roll")` | Policy | Compatible policy required | Trigger the official roll policy. |
| `skill("kick_left")` / `skill("kick_right")` | Policy | Compatible policy required | Trigger an official kick policy. |
| `skill("ground_pick")` | Policy | Compatible policy required | Trigger the official ground-pick policy. |
| `skill("crouch")` | Policy | Compatible policy required | Trigger the wheel-base crouch policy. |
| `sit()` / `stand()` / `walk()` | Policy | Compatible policy required | Control sit-stand and walk transitions. |
| `quack()` | Environment | Portable | Trigger sound and simulated mouth motion. |
| `ball()` | Environment | Simulator only | Spawn a football. |
| `rollers()` / `legs()` | Environment | Compatible policy required | Switch the active robot base and locomotion policy. |
| `reset()` | Environment | Simulator only | Restore the initial physics state. |
| `camera("follow" | "free")` | Simulator | Simulator only | Change the camera mode. |
| `move(ref)` | Policy | Compatible policy required | Load a compatible Hub repository or HTTPS ONNX policy. A direct URL without a sibling manifest defaults to a perpetual walk slot. |
| `play_move()` | Policy | Compatible policy required | Play the loaded episodic, script, or sit-stand motion. |
| `official()` | Policy | Compatible policy required | Unload a community motion and restore official policies. |
| `push(vx, vy, vz, wx, wy, wz)` | Simulator | Simulator only | Apply a bounded external disturbance. |
| `relief(true | false)` | Simulator | Simulator only | Toggle smooth uneven terrain. |

The in-app API Reference contains parameter bounds, behavior notes, and an insertable example for all 25 entries.

## Observation layout

| Range | Size | Meaning |
| --- | --- | --- |
| `obs[0..2]` | 3D | Body angular velocity x / y / z |
| `obs[3..5]` | 3D | Gravity projected into body coordinates |
| `obs[6..19]` | 14D | Joint position relative to the default pose |
| `obs[20..33]` | 14D | Joint velocity |
| `obs[34..47]` | 14D | Previous policy action |
| `obs[48..60]` | 13D | Velocity 3D + head 4D + reserved body 6D command |

Joint order is left hip yaw / roll / pitch / knee / ankle, neck pitch, head pitch / yaw / roll, then right hip yaw / roll / pitch / knee / ankle.

## Reset behavior

`reset()` restores the initial physics state and waits until the simulator releases its respawn input lock. The next statement therefore does not silently run during the reset animation.

## Input priority and stopping

The Academy registers an input source with the official controller. While a program is active, `drive` and `turn` update its command. Active keyboard, gamepad, or touch input can take priority according to the official controller.

Selecting **Stop** increments the run identifier, clears the command, disables head mode, and interrupts `wait`. A new run cannot inherit a stale motion command.

## Legacy aliases

| Legacy | Current form |
| --- | --- |
| `roll()` | `skill("roll")` |
| `kick("left")` | `skill("kick_left")` |
| `kick("right")` | `skill("kick_right")` |
| `ground_pick()` | `skill("ground_pick")` |
| `spawn_ball()` | `ball()` |

## Training boundary

This API controls and composes existing policies. A new dynamic motion requires a task definition, a reward function, PPO training, evaluation, and ONNX export in Levels 3–5.
