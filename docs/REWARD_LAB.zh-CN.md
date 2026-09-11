# Level 3：Task & Reward Lab

[English](REWARD_LAB.md) · 简体中文

Level 3 用官方 Microduck 3D 模拟器里的真实 MuJoCo 状态，帮助学习者把“想让鸭子完成什么”翻译成 command、reward、termination 和评估指标。它使用当前官方 `walk` ONNX policy 采集轨迹，然后按配置计算分数。

## 一次实验发生了什么

1. 切换到官方双腿底盘与官方 walk policy，并重置物理世界。
2. 通过 Academy input source 持续发送目标前进速度 `command vx`。
3. 每 50 ms 从模拟器读取一次机身平面速率 `hypot(qvel[0], qvel[1])`，与官方 HUD 的 speed 定义一致；同时读取 `qpos[2]`、投影重力 `observation[5]` 和 14D `lastAction`。
4. 对每个样本计算 reward，并用 `return = Σ reward × Δt` 累积整条 rollout 的分数。
5. 达到最长时长，或者触发倾倒/最低高度条件时结束。

## 当前 reward

```text
tracking   = exp(-4 × (velocity_x - target_speed)²)
upright    = clamp(-projected_gravity_z, 0, 1)
effort     = mean(action²)
smoothness = mean((action_t - action_t-1)²)

reward = tracking_weight × tracking
       + upright_weight × upright
       - effort_weight × effort
       - smoothness_weight × smoothness
```

各项含义：

- `tracking` 奖励实际平面速率接近 command；默认 `0.24 m/s` 是当前官方 walk policy 在浏览器里能稳定展示位移的教学目标。
- `upright` 奖励机身保持直立。
- `effort` 惩罚较大的关节 action。
- `smoothness` 惩罚相邻控制步之间剧烈变化的 action。
- `terminationGravityZ` 与 `minHeight` 定义 episode 提前结束的条件。

## A/B 实验应该怎么看

实验 A 是相对均衡的基线。实验 B 默认更重视速度跟踪、较少惩罚能耗。两次实验使用同一个 policy，但物理轨迹仍可能有少量差异。

不要只比较 return：A 和 B 使用不同的评分尺子，权重变大本身就可能让 return 变大。还要同时看：

- `mean vx` 是否接近目标速度；
- `tracking error` 是否下降；
- `action energy` 与 `smoothness` 是否恶化；
- 是否因为 `tilt` 或 `height` 提前终止；
- 右侧 3D 动作是否符合任务本意。

当前 `tracking` 只看平面速率，不区分前进、后退或侧滑。这是故意保留的第一个 reward hacking 观察点：若鸭子以错误方向达到目标速率，分数仍可能很好。后续训练任务应改用机身朝向速度，并加入横向速度惩罚。

## 与策略训练的边界

Level 3 是 policy evaluation 和 reward prototyping。改变这里的权重会重新给轨迹打分，但不会反向传播，也不会修改 ONNX 神经网络。Level 4 才会把同类 reward 放入 MJLab 环境，运行大量并行 rollout 和 PPO 更新，产出新的 checkpoint；Level 5 再把 checkpoint 导出为浏览器和真机可加载的 ONNX policy。

所有配置、结果和四步实验进度都保存在浏览器 `localStorage`，也会包含在“导出学习档案”的 JSON 中。无需登录，不上传轨迹。
