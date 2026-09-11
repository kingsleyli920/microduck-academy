# Privacy and local data / 隐私与本地数据

Microduck Academy is local-first and does not require an account.

- Language preference, lesson progress, lesson code, Level 1 completion, the current `control.duck` program, its run count, and Level 3 reward configurations and aggregate rollout results are stored in browser `localStorage` under `microduck-academy-progress-v1`.
- The Learning Path page can export and import this small learning profile as JSON.
- The classroom does not record the screen, camera, or microphone.
- Raw runtime traces, per-step telemetry, observations, actions, videos, checkpoints, and ONNX files are not persisted by the current release. Level 3 keeps aggregate metrics such as return, mean speed, tracking error, action energy, and termination reason.
- The local Node.js service serves the application and exposes the user-triggered shutdown endpoint. It does not receive learner code or progress.
- Academy embedded mode disables the upstream simulator multiplayer ghost connection, so it does not join public Nostr relays or broadcast pose data.
- A community policy reference may fetch a manifest or ONNX file from the Hub repository or HTTPS URL explicitly supplied by the learner.

Clearing site data, changing browser profiles, using private browsing, or changing the site origin can remove access to saved progress. Export the JSON profile before doing so.

Microduck Academy 采用本地优先设计，无需登录。

- 语言偏好、关卡进度、每关代码、Level 1 实验完成状态、当前 `control.duck` 程序、运行次数，以及 Level 3 的 reward 配置和汇总 rollout 结果，保存在浏览器 `localStorage` 的 `microduck-academy-progress-v1` 键中。
- “学习路线”页面可以把这份小型学习档案导出或导入为 JSON。
- 课堂不会录制屏幕、摄像头或麦克风。
- 当前版本不会持久化逐步运行轨迹、原始遥测、observation、action、录像、checkpoint 或 ONNX 文件。Level 3 会保存 return、平均速度、跟踪误差、action energy 和终止原因等汇总指标。
- 本地 Node.js 服务负责提供页面和执行用户主动触发的关闭操作，不接收学习者代码或进度。
- Academy 嵌入模式会关闭上游模拟器的多人幽灵连接，不加入公共 Nostr relay，也不广播鸭子的姿态数据。
- 当学习者明确填写 Hub 仓库或 HTTPS 社区策略地址时，页面可能从该地址读取 manifest 或 ONNX 文件。

清除网站数据、更换浏览器配置、使用无痕浏览或更换站点地址，都可能导致原有进度不可见。进行这些操作前请先导出 JSON 档案。
