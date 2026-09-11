# Level 3: Task and Reward Lab

[简体中文](REWARD_LAB.zh-CN.md) · English

Level 3 uses state from the official Microduck MuJoCo simulator to turn a task specification into commands, rewards, termination conditions, and evaluation metrics. It collects trajectories with the current official `walk` ONNX policy and scores each trajectory with the selected configuration.

## What happens during one experiment

1. Restore the official leg base and walk policy, then reset physics.
2. Send the target forward velocity through the Academy input source as `command vx`.
3. Every 50 ms, read planar body speed `hypot(qvel[0], qvel[1])`, body height `qpos[2]`, projected gravity `observation[5]`, and the 14D `lastAction`.
4. Compute a reward for each sample and integrate it as `return = Σ reward × Δt`.
5. Stop at the duration limit or when a tilt or height termination condition fires.

## Reward function

```text
tracking   = exp(-4 × (planar_speed - target_speed)²)
upright    = clamp(-projected_gravity_z, 0, 1)
effort     = mean(action²)
smoothness = mean((action - previous_action)²)

reward =
    tracking_weight × tracking
  + upright_weight × upright
  - effort_weight × effort
  - smoothness_weight × smoothness
```

Termination is controlled by:

- `terminationGravityZ`: end when projected gravity rises above this value.
- `minHeight`: end when body height falls below this value.
- `durationMs`: end at the time limit.

## Interpreting the A/B experiment

The A and B runs use the same trained policy. Changing the reward configuration changes only how the trajectory is scored. It does not change the ONNX weights.

Compare more than return:

- `mean speed` shows actual motion speed.
- `tracking error` measures distance from the target speed.
- `action energy` approximates action magnitude.
- `end reason` distinguishes timeout, tilt, low body height, and manual stop.
- A recording is still needed to judge the visible motion.

The current tracking term uses planar speed magnitude. Sideways motion can therefore receive tracking reward. This deliberate limitation makes a reward exploit visible and gives a concrete reason to add direction-sensitive metrics later.

## Training boundary

Level 3 performs task design and offline reward evaluation over live simulator rollouts. Level 4 will run PPO, update policy weights, compare checkpoints across fixed seeds, and produce a new ONNX model. Until that training loop exists, changing Level 3 values cannot teach Microduck a new motion.
