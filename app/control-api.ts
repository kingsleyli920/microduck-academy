export type ControlApiEntry = {
  id: string;
  title: string;
  signature: string;
  category: '控制' | '逻辑' | '技能' | '世界' | '模拟器';
  portability: '可迁移' | '需对应策略' | '仅模拟器';
  summary: string;
  parameters: string[];
  notes: string[];
  example: string;
  keywords: string[];
};

export const controlApi: ControlApiEntry[] = [
  {
    id: 'drive', title: '连续行走 / 滚轮移动', signature: 'drive(vx, yaw, ms)', category: '控制', portability: '可迁移',
    summary: '在指定时间内持续把前进速度和转向速度送入当前 locomotion policy。横移 command 目前固定为 0。',
    parameters: ['vx：前进速度；双腿范围 -0.20～0.25 m/s，滚轮范围 -0.50～0.60 m/s', 'yaw：偏航角速度；双腿范围 -1.00～1.00 rad/s，滚轮范围 -0.30～0.30 rad/s', 'ms：持续时间，0～10000 ms；超出运动范围的值会被限幅'],
    notes: ['按下“停止”会立刻清零 command。', '键盘、手柄或触控输入正在活动时，官方控制器会优先采用人工输入。'],
    example: 'drive(0.18, 0.0, 1200)', keywords: ['move', 'walk', 'velocity', 'command', '速度', '行走'],
  },
  {
    id: 'turn', title: '原地转向', signature: 'turn(yaw, ms)', category: '控制', portability: '可迁移',
    summary: '用零前进速度发送 yaw command，是 drive(0, yaw, ms) 的便捷写法。',
    parameters: ['yaw：双腿范围 -1.00～1.00 rad/s，滚轮范围 -0.30～0.30 rad/s', 'ms：持续时间，0～10000 ms'],
    notes: ['正负方向取决于模拟器采用的坐标约定，可先用较小数值观察。'],
    example: 'turn(0.55, 600)', keywords: ['yaw', 'rotate', '转向', '转身'],
  },
  {
    id: 'look', title: '控制颈部和头部', signature: 'look(neck, pitch, yaw, roll, ms)', category: '控制', portability: '需对应策略',
    summary: '临时进入 head mode，把 4 个头部目标写入 command[3..6]；时间结束后退出 head mode。',
    parameters: ['neck / pitch / yaw / roll：目标弧度，各自限幅到 -2.50～2.50', 'ms：保持时间，0～10000 ms'],
    notes: ['需要部署端支持同样的头部 command 接口。', '这是 command 条件控制，不是直接给电机写角度。'],
    example: 'look(0.30, -0.15, 0.45, 0.0, 800)', keywords: ['head', 'neck', 'command', '头', '脖子'],
  },
  {
    id: 'wait', title: '等待', signature: 'wait(ms)', category: '控制', portability: '可迁移',
    summary: '暂停脚本执行，让当前 policy 或已触发的技能继续运行。',
    parameters: ['ms：等待毫秒数，0～10000 ms'],
    notes: ['等待期间仍可按“停止”中断整个程序。'],
    example: 'wait(800)', keywords: ['sleep', 'delay', '等待'],
  },
  {
    id: 'reset', title: '重置物理世界', signature: 'reset()', category: '世界', portability: '仅模拟器',
    summary: '调用官方模拟器的 resetSim()，恢复鸭子和场景的初始状态。',
    parameters: ['无参数'], notes: ['真机没有“瞬间复位物理世界”的对应能力。'],
    example: 'reset()', keywords: ['world', 'resetSim', '重置'],
  },
  {
    id: 'print', title: '读取并打印 observation', signature: 'print(obs[i])', category: '逻辑', portability: '可迁移',
    summary: '在执行到这一行时读取一帧真实 61D observation，并把指定值写入运行轨迹。',
    parameters: ['i：observation 下标，整数 0～60'], notes: ['完整 observation 分段见本页下方。'],
    example: 'print(obs[5])', keywords: ['observation', 'obs', 'debug', '状态', '观测'],
  },
  {
    id: 'repeat', title: '重复执行代码块', signature: 'repeat(n) { … }', category: '逻辑', portability: '可迁移',
    summary: '按顺序重复执行花括号里的控制程序，可嵌套 repeat 和 if。',
    parameters: ['n：重复次数，整数 1～20'], notes: ['左花括号必须写在 repeat 同一行；右花括号单独一行。'],
    example: 'repeat(2) {\n  turn(0.4, 350)\n  wait(150)\n}', keywords: ['loop', '循环', '重复'],
  },
  {
    id: 'if', title: '按 observation 分支', signature: 'if obs[i] < value { … }', category: '逻辑', portability: '可迁移',
    summary: '执行到这一行时采样 observation；条件成立才执行代码块。',
    parameters: ['i：observation 下标，0～60', '比较符：<、<=、>、>=', 'value：任意有限数字'],
    notes: ['当前只支持单个数值条件；可以嵌套。'],
    example: 'if obs[5] < -0.85 {\n  skill("roll")\n}', keywords: ['condition', 'observation', 'obs', '条件', '反馈'],
  },
  {
    id: 'skill-roll', title: '翻滚策略', signature: 'skill("roll")', category: '技能', portability: '需对应策略',
    summary: '切换到官方已训练好的 roll ONNX policy。', parameters: ['固定技能名 "roll"'],
    notes: ['触发是非阻塞的；通常在后面加 wait(2500) 等待动作完成。', '这是调用已有 policy，不会训练新动作。'],
    example: 'skill("roll")\nwait(2500)', keywords: ['policy', 'onnx', '翻滚'],
  },
  {
    id: 'skill-kick', title: '踢球策略', signature: 'skill("kick_left" | "kick_right")', category: '技能', portability: '需对应策略',
    summary: '切换到官方左脚或右脚 kick ONNX policy。', parameters: ['技能名："kick_left" 或 "kick_right"'],
    notes: ['可先调用 ball() 在模拟器中生成足球。', '触发是非阻塞的。'],
    example: 'ball()\nwait(400)\nskill("kick_left")\nwait(1800)', keywords: ['policy', 'onnx', 'kick', '足球', '踢球'],
  },
  {
    id: 'skill-ground-pick', title: '低头触地策略', signature: 'skill("ground_pick")', category: '技能', portability: '需对应策略',
    summary: '切换到官方 ground-pick ONNX policy。', parameters: ['固定技能名 "ground_pick"'],
    notes: ['触发是非阻塞的；需要用 wait() 留出执行时间。'],
    example: 'skill("ground_pick")\nwait(2200)', keywords: ['policy', 'onnx', 'ground', '触地'],
  },
  {
    id: 'skill-crouch', title: '滚轮底盘下蹲策略', signature: 'skill("crouch")', category: '技能', portability: '需对应策略',
    summary: '在 rollers 模式下触发官方 crouch policy。', parameters: ['固定技能名 "crouch"'],
    notes: ['必须先切换 rollers()；双腿模式会给出错误。'],
    example: 'rollers()\nwait(600)\nskill("crouch")\nwait(1600)', keywords: ['policy', 'onnx', 'rollers', '下蹲'],
  },
  {
    id: 'ball', title: '生成足球', signature: 'ball()', category: '世界', portability: '仅模拟器',
    summary: '在官方 MuJoCo 场景里生成足球，便于测试 kick policy。', parameters: ['无参数'],
    notes: ['兼容旧写法 spawn_ball()。'], example: 'ball()', keywords: ['spawn', 'world', '足球', '球'],
  },
  {
    id: 'rollers', title: '切换滚轮底盘', signature: 'rollers()', category: '世界', portability: '需对应策略',
    summary: '让官方模拟器加载滚轮模型与对应 locomotion policy。', parameters: ['无参数'],
    notes: ['切换模型是异步操作，下一条命令会在切换完成后执行。', '真机需要安装滚轮并具备对应策略。'],
    example: 'rollers()\nwait(500)\ndrive(0.4, 0.0, 1200)', keywords: ['loco', 'base', 'wheel', '底盘', '滚轮'],
  },
  {
    id: 'legs', title: '切换双腿底盘', signature: 'legs()', category: '世界', portability: '需对应策略',
    summary: '让官方模拟器加载双腿模型与 walk policy。', parameters: ['无参数'],
    notes: ['切换模型是异步操作，下一条命令会在切换完成后执行。'],
    example: 'legs()\nwait(500)\ndrive(0.15, 0.0, 1000)', keywords: ['loco', 'base', 'walk', '底盘', '双腿'],
  },
  {
    id: 'push', title: '施加外力扰动', signature: 'push(vx, vy, vz, wx, wy, wz)', category: '模拟器', portability: '仅模拟器',
    summary: '通过官方 debugPush 接口给机身施加线速度与角速度扰动，用来测试 policy 的抗扰和恢复能力。',
    parameters: ['vx / vy / vz：线速度扰动，各自限幅 -2.00～2.00', 'wx / wy / wz：角速度扰动，各自限幅 -8.00～8.00'],
    notes: ['这是教学实验钩子，不对应真机命令。', '从小数值开始；reset() 可恢复场景。'],
    example: 'push(0.0, 0.7, 0.0, 0.0, 0.0, 0.0)\nwait(1800)\nreset()', keywords: ['disturbance', 'debugPush', 'force', '外力', '扰动', '恢复'],
  },
  {
    id: 'relief', title: '切换起伏地形', signature: 'relief(true | false)', category: '模拟器', portability: '仅模拟器',
    summary: '调用官方 setRelief() 让平地平滑变成带缓坡的起伏地形，用来测试 locomotion policy 对地形变化的适应。',
    parameters: ['enabled：只能写 true 或 false'], notes: ['这是模拟器原型调试开关。', '程序结束和 reset() 都不会自动关闭；记得显式执行 relief(false)。'],
    example: 'relief(true)\nwait(1800)\nrelief(false)\nreset()', keywords: ['setRelief', 'terrain', 'slope', 'debug', '地形', '缓坡', '起伏'],
  },
  {
    id: 'sit', title: '坐下', signature: 'sit()', category: '技能', portability: '需对应策略',
    summary: '通过官方控制器触发双腿底盘的 sitstand policy，并进入坐姿。', parameters: ['无参数'],
    notes: ['只支持双腿底盘。', '动作切换是非阻塞的，可用 wait(1200) 等待坐稳。'],
    example: 'sit()\nwait(1200)', keywords: ['sitstand', 'sit', '坐下', '坐姿'],
  },
  {
    id: 'stand', title: '站起', signature: 'stand()', category: '技能', portability: '需对应策略',
    summary: '请求官方控制器从坐姿回到 walk policy。', parameters: ['无参数'],
    notes: ['官方控制器会拒绝不安全的中途切换。'],
    example: 'stand()\nwait(1200)', keywords: ['sitstand', 'stand', '站起', '起立'],
  },
  {
    id: 'walk', title: '回到行走策略', signature: 'walk()', category: '技能', portability: '需对应策略',
    summary: '请求控制器回到 walk policy；适合在坐站策略后显式恢复行走。', parameters: ['无参数'],
    notes: ['翻滚、下蹲或恢复状态机占用控制权时，官方安全门会忽略切换。'],
    example: 'walk()\nwait(500)\ndrive(0.16, 0.0, 900)', keywords: ['walk', 'mode', 'policy', '行走', '恢复'],
  },
  {
    id: 'quack', title: '让鸭子叫一声', signature: 'quack()', category: '世界', portability: '可迁移',
    summary: '调用官方控制器的 quack 动作：播放当前配色的叫声，并驱动模拟嘴部动画。', parameters: ['无参数'],
    notes: ['声音和浏览器嘴部动画不参与 ONNX policy 的 14D action。', '真机需要对应的声音资源与嘴部运行时。'],
    example: 'quack()\nwait(600)', keywords: ['audio', 'jaw', 'sound', '叫声', '嘴巴'],
  },
  {
    id: 'camera', title: '切换跟随相机', signature: 'camera("follow" | "free")', category: '模拟器', portability: '仅模拟器',
    summary: '开启或关闭官方 3D 场景的追踪相机，便于录制动作或手动观察。', parameters: ['mode："follow" 自动跟随；"free" 保持自由镜头'],
    notes: ['只改变观看方式，不进入 policy observation。'],
    example: 'camera("follow")', keywords: ['chaseCam', 'camera', 'view', '相机', '镜头', '跟随'],
  },
  {
    id: 'move', title: '加载社区 / 自定义动作', signature: 'move(ref)', category: '技能', portability: '需对应策略',
    summary: '使用最新版官方加载器读取 manifest，再校验输入输出形状、有限值和非恒定输出，校验通过后挂载动作。',
    parameters: ['ref："org/repo"、"session:id[:round]"，或可访问的 HTTPS .onnx URL'],
    notes: ['社区动作是动态发布的，因此不存在固定的“全部技能名单”。', '支持 perpetual gait / sitstand、episodic trick 和 command script 三种 manifest kind。', '加载失败时官方策略保持启用。'],
    example: 'move("org/repo")', keywords: ['community', 'custom', 'hub', 'policy', 'manifest', '社区', '自定义', '加载'],
  },
  {
    id: 'play-move', title: '播放已加载动作', signature: 'play_move()', category: '技能', portability: '需对应策略',
    summary: '按动作 manifest 的 slot 启动已加载的 episodic、script 或 sitstand 动作；walk gait 在加载后已经生效。', parameters: ['无参数'],
    notes: ['必须先执行 move(ref)。', 'script 再次调用 play_move() 会停止时间线。'],
    example: 'move("org/repo")\nplay_move()\nwait(3000)', keywords: ['play', 'customPolicy', 'script', 'trick', '播放', '社区动作'],
  },
  {
    id: 'official', title: '恢复官方策略', signature: 'official()', category: '技能', portability: '需对应策略',
    summary: '卸载当前社区动作，并恢复模拟器启动时保存的官方 walk、sitstand 和 roll 策略。', parameters: ['无参数'],
    notes: ['这是可逆的安全回退；不会删除 Hub 或本地的动作文件。'],
    example: 'official()\nreset()', keywords: ['clearCustomPolicy', 'revert', 'official', '恢复', '官方'],
  },
];

export const observationGroups = [
  { range: 'obs[0..2]', length: '3D', name: '陀螺仪角速度', detail: '机身角速度 x / y / z' },
  { range: 'obs[3..5]', length: '3D', name: '投影重力', detail: '重力方向在机身坐标系中的投影；直立时 obs[5] 约为 -1' },
  { range: 'obs[6..19]', length: '14D', name: '关节位置', detail: '14 个关节相对默认姿态的位置' },
  { range: 'obs[20..33]', length: '14D', name: '关节速度', detail: '14 个关节的速度' },
  { range: 'obs[34..47]', length: '14D', name: '上一帧 action', detail: 'policy 在上一控制周期输出的 14D action' },
  { range: 'obs[48..60]', length: '13D', name: 'command', detail: '速度 3D + 头部 4D + 当前预留为 0 的身体 6D' },
];

export const legacyAliases = [
  ['roll()', 'skill("roll")'], ['kick("left")', 'skill("kick_left")'], ['kick("right")', 'skill("kick_right")'],
  ['ground_pick()', 'skill("ground_pick")'], ['spawn_ball()', 'ball()'],
] as const;
