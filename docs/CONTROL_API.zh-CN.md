# Microduck Academy Control API

这份文档完整描述 Level 2 的 `control.duck` 语言。它是一层很薄的教学运行时：程序直接读取官方模拟器的 61D observation、向 50 Hz policy 发送 command，并切换官方或社区训练好的 ONNX policy。

当前能力表已逐项对照 `control.duck` 解释器和官方模拟器提交 `023172c`（2026-09-10）。这里的“完整”特指本版本解释器接受的全部语法，不表示社区里未来发布的所有动作，也不把 `window.rl` 的 MuJoCo 内存、渲染循环和测试钩子当成稳定 API。

它解决的是“如何用程序控制策略”。训练一个策略从未见过的新动力学动作，需要进入 Level 3–5 修改 environment / reward、运行 PPO，再导出新的 ONNX。

## 五分钟上手

```text
# 连续发送速度 command
drive(0.18, 0.0, 1200)
turn(0.55, 600)

# 读取当前 observation
print(obs[5])
if obs[5] < -0.85 {
  skill("roll")
}

wait(2500)
reset()
```

程序按行顺序执行。`#` 后面是注释；行末分号可写可不写。脚本最多 200 个非空语句行。`repeat` 和 `if` 可以嵌套，左花括号必须与声明写在同一行，右花括号单独一行。

## 能力边界

| 标记 | 含义 |
| --- | --- |
| 可迁移 | 控制逻辑和 observation / command 契约可以迁移到真机运行时 |
| 需对应策略 | 部署端还必须具有同名 ONNX policy 或对应底盘能力 |
| 仅模拟器 | 操作 MuJoCo 世界或调试钩子，真机没有直接对应能力 |

Microduck 有三层不同的可执行能力：

1. 本文列出的 `control.duck` 是课堂公开 API，全部命令都可以在左侧编辑器运行。
2. `move(ref)` 加载的社区动作来自 Hub、Academy session 或 ONNX URL，数量会不断变化，没有静态的“全部技能名单”。
3. 官方模拟器还暴露 `model`、`data`、`step()`、`render()`、自动恢复状态等调试对象。它们会随实现变化，不属于面向学习者的稳定编程接口。

## 控制命令

### `drive(vx, yaw, ms)` · 可迁移

在指定时间内持续发送前进速度和转向速度。Academy 固定横移 command 为 0。

- `vx`：双腿范围 `-0.20～0.25 m/s`；滚轮范围 `-0.50～0.60 m/s`
- `yaw`：双腿范围 `-1.00～1.00 rad/s`；滚轮范围 `-0.30～0.30 rad/s`
- `ms`：持续时间 `0～10000 ms`
- 超出运动范围的值会自动限幅；按“停止”会立刻清零 command

```text
drive(0.18, 0.0, 1200)
```

### `turn(yaw, ms)` · 可迁移

原地转向，是 `drive(0, yaw, ms)` 的便捷写法。参数范围与 `drive` 相同。

```text
turn(0.55, 600)
```

### `look(neck, pitch, yaw, roll, ms)` · 需对应策略

临时进入 head mode，把四个目标写入 `command[3..6]`。四个角度都会被限幅到 `-2.50～2.50 rad`；`ms` 最多 10000。时间结束后退出 head mode。

```text
look(0.30, -0.15, 0.45, 0.0, 800)
```

这是 command 条件控制，不是绕过 policy 直接给电机写角度。

### `wait(ms)` · 可迁移

暂停脚本，等待当前 policy 或技能继续运行。范围 `0～10000 ms`，等待期间仍可停止程序。

### `print(obs[i])` · 可迁移

执行到该行时读取一帧 observation，把 `obs[i]` 写入运行轨迹。`i` 必须是 `0～60` 的整数。

## 程序逻辑

### `repeat(n) { … }` · 可迁移

重复执行代码块。`n` 必须是 `1～20` 的整数。

```text
repeat(2) {
  turn(0.4, 350)
  wait(150)
}
```

### `if obs[i] < value { … }` · 可迁移

执行到该行时采样 observation；条件成立才执行代码块。支持 `<`、`<=`、`>`、`>=`，可以嵌套。

```text
if obs[5] < -0.85 {
  skill("roll")
}
```

## 已训练的 ONNX 技能

所有 `skill()` 调用都是非阻塞触发。通常需要在下一行加 `wait()`，给动作留出执行时间。

| 命令 | 策略 | 迁移条件 |
| --- | --- | --- |
| `skill("roll")` | 翻滚 | 部署端安装 roll policy |
| `skill("kick_left")` | 左脚踢球 | 部署端安装 kick policy |
| `skill("kick_right")` | 右脚踢球 | 部署端安装 kick policy |
| `skill("ground_pick")` | 低头触地 | 部署端安装 ground-pick policy |
| `skill("crouch")` | 滚轮模式下蹲 | 必须先 `rollers()`，并具有 crouch policy |

```text
ball()
wait(400)
skill("kick_left")
wait(1800)
```

### `sit()` / `stand()` / `walk()` · 需对应策略

- `sit()`：双腿底盘通过官方 sitstand policy 坐下。
- `stand()`：从坐姿请求回到 walk policy。
- `walk()`：显式请求回到 walk policy，适合放在一段模式切换之后。

这些调用都是非阻塞的，并服从官方安全门。翻滚、恢复或其他一次性动作正在占用控制权时，切换可能被忽略。

```text
sit()
wait(1200)
stand()
wait(1200)
drive(0.16, 0.0, 900)
```

### `quack()` · 可迁移

触发官方 quack 动作。模拟器会播放当前配色的叫声并驱动嘴部动画；声音与浏览器嘴部动画不进入 ONNX policy 的 14D action。真机迁移需要运行时具有对应声音和嘴部能力。

## 世界和底盘

### `ball()` · 仅模拟器

在 MuJoCo 场景中生成足球，便于测试 kick policy。

### `rollers()` / `legs()` · 需对应策略

切换滚轮或双腿模型以及相应 locomotion policy。模型切换是异步操作，解释器会等待完成再执行下一行。真机能否切换取决于实际硬件和已安装策略。

### `reset()` · 仅模拟器

调用官方 `resetSim()`，恢复鸭子和场景初始状态。

### `camera("follow" | "free")` · 仅模拟器

切换 3D 场景的追踪相机。它只改变观看方式，不进入 observation，也不影响 policy。

## 社区和自定义动作

最新版官方模拟器支持三类 manifest：持续 gait / sitstand policy、一次性 episodic trick，以及驱动 13D command 的 script。

### `move(ref)` · 需对应策略

加载并挂载一个动作。`ref` 支持：

- Hugging Face Hub 仓库：`"org/repo"`
- Academy 私有训练：`"session:id"` 或 `"session:id:round"`
- 可访问的直接链接：以 `.onnx` 结尾的 HTTPS URL

官方加载器会先检查 manifest、`[1,61] → [1,14]` 形状、有限输出以及非恒定输出，校验失败时保留原策略。

### `play_move()` · 需对应策略

启动 `move(ref)` 已挂载的动作。episodic trick 会作为一次性动作运行，script 会启动或停止 command 时间线，sitstand 会切换坐姿。walk gait 加载完成时已经生效。

```text
move("org/repo")
play_move()
wait(3000)
official()
```

### `official()` · 需对应策略

卸载当前社区动作，恢复模拟器启动时保存的官方 walk、sitstand 和 roll 策略。

## 模拟器实验命令

### `push(vx, vy, vz, wx, wy, wz)` · 仅模拟器

通过官方 `debugPush` 钩子给机身施加线速度和角速度扰动，用来观察 policy 的抗扰和恢复能力。

- `vx / vy / vz`：各自限幅 `-2.00～2.00`
- `wx / wy / wz`：各自限幅 `-8.00～8.00`

```text
push(0.0, 0.7, 0.0, 0.0, 0.0, 0.0)
wait(1800)
reset()
```

### `relief(true | false)` · 仅模拟器

调用官方 `setRelief()`，让平地平滑变成带缓坡的起伏地形，用来测试 locomotion policy 对地形变化的适应。这是官方模拟器里的原型调试开关。

```text
relief(true)
wait(1800)
relief(false)
reset()
```

程序结束和 `reset()` 都不会自动关闭起伏地形；记得显式执行 `relief(false)`。

## 61D observation 下标地图

| 下标 | 维度 | 含义 |
| --- | ---: | --- |
| `obs[0..2]` | 3 | 机身陀螺仪角速度 x / y / z |
| `obs[3..5]` | 3 | 重力方向在机身坐标系中的投影；直立时 `obs[5]` 约为 -1 |
| `obs[6..19]` | 14 | 关节位置，相对默认姿态 |
| `obs[20..33]` | 14 | 关节速度 |
| `obs[34..47]` | 14 | policy 上一控制周期输出的 action |
| `obs[48..60]` | 13 | command：速度 3D + 头部 4D + 当前预留为 0 的身体 6D |

14 个关节的顺序是：

1. 左 hip yaw / roll / pitch / knee / ankle
2. neck pitch
3. head pitch / yaw / roll
4. 右 hip yaw / roll / pitch / knee / ankle

policy 的输入形状是 `[1, 61]`，输出是 `[1, 14]`。14D action 表示相对默认关节位置的目标偏移，由模拟器的控制层应用到关节。

## 输入优先级与停止行为

Academy 把自己的 command source 注册到官方控制器。官方控制器按来源优先级选择第一个活跃输入；键盘、手柄或触控正在使用时，会覆盖 Academy 脚本的连续 command。这样用户可以随时用人工输入接管。

按“停止”会：

1. 中断当前 `wait()`、`drive()`、`turn()` 或 `look()`；
2. 把 Academy 的 13D command 清零并设为 inactive；
3. 退出 head mode；
4. 不会删除编辑器里的程序。

## 兼容旧脚本

以下旧写法仍能运行，新程序建议统一使用 `skill()` 和 `ball()`：

| 旧写法 | 推荐写法 |
| --- | --- |
| `roll()` | `skill("roll")` |
| `kick("left")` | `skill("kick_left")` |
| `kick("right")` | `skill("kick_right")` |
| `ground_pick()` | `skill("ground_pick")` |
| `spawn_ball()` | `ball()` |

## 常见错误

- `第 N 行不认识`：函数名、引号或括号有误，先从页面 API Reference 插入可运行示例。
- `需要 N 个数字参数`：参数数量不对，或写入了非数字值。
- `observation 下标必须在 0–60`：超出了 policy 的 61D 输入。
- `repeat 次数必须在 1–20`：课堂限制循环上限，避免浏览器被意外长程序占用。
- `crouch 需要先调用 rollers()`：当前 crouch policy 只属于滚轮底盘。
- `move 需要 org/repo…`：动作引用格式不属于官方加载器支持的三种格式。
- `动作未能加载`：仓库不存在、跨域受限、manifest 不兼容或 ONNX smoke test 未通过；原策略会继续工作。
