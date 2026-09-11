export type LessonTest = {
  label: string;
  args: unknown[];
  expected: unknown;
};

export type Lesson = {
  id: number;
  shortTitle: string;
  title: string;
  mission: string;
  teacher: string;
  concept: string[];
  filename: string;
  functionName: string;
  starter: string;
  hint: string[];
  tests: LessonTest[];
  labTitle: string;
  labNote: string;
};

export const lessons: Lesson[] = [
  {
    id: 1,
    shortTitle: '奖励：什么叫做得好',
    title: '告诉鸭子什么叫“做得好”',
    mission: '鸭子每前进 1 米得 10 分；如果摔倒，扣 50 分。',
    teacher: '实现一个逐时刻 reward：位移增量是 dense reward，摔倒是 terminal penalty。重点观察同一段 rollout 因终止条件得到怎样不同的 return。',
    concept: ['鸭子行动', '环境变化', '得到分数'],
    filename: 'reward.py',
    functionName: 'duck_reward',
    starter: `def duck_reward(distance_m, fell):
    score = 0.0

    # ① 每前进 1 米，加 10 分
    # 在这里写第一行

    # ② 如果摔倒，扣 50 分
    # 在这里写 if 和扣分代码

    return score`,
    hint: ['score = distance_m * 10', 'if fell:', '    score -= 50'],
    tests: [
      { label: '站着不动', args: [0, false], expected: 0 },
      { label: '前进 0.3 米', args: [0.3, false], expected: 3 },
      { label: '前进后摔倒', args: [0.3, true], expected: -47 },
    ],
    labTitle: '奖励仪表',
    labNote: '这里展示的是你的奖励函数怎样给一次动作打分。训练时，算法会反复寻找能拿到更多分的动作。',
  },
  {
    id: 2,
    shortTitle: '状态：鸭子现在怎样',
    title: '看懂鸭子是否歪了',
    mission: '根据身体倾斜角度，决定向左修正、向右修正，还是保持。',
    teacher: '先写一个 heuristic policy 作为 baseline：根据 roll angle 的符号输出离散修正动作。后面再把它替换成神经网络策略。',
    concept: ['读取倾斜角', '判断状态', '选择修正'],
    filename: 'balance.py',
    functionName: 'balance_action',
    starter: `def balance_action(tilt_deg):
    # 身体向右歪，需要往左修正
    if tilt_deg > 5:
        return ""

    # 身体向左歪，需要往右修正
    if tilt_deg < -5:
        return ""

    return ""`,
    hint: ['第一个空填 left', '第二个空填 right', '最后一个空填 hold'],
    tests: [
      { label: '向右歪 8°', args: [8], expected: 'left' },
      { label: '向左歪 8°', args: [-8], expected: 'right' },
      { label: '只歪 2°', args: [2], expected: 'hold' },
    ],
    labTitle: '平衡台',
    labNote: '倾斜角是状态的一部分。真正的 Microduck 会同时观察很多关节角度、速度和身体姿态。',
  },
  {
    id: 3,
    shortTitle: '动作：下一步做什么',
    title: '离目标越近，动作越轻',
    mission: '让鸭子根据离目标的距离选择前进速度。',
    teacher: '实现 command-conditioned policy 的简化版本：目标距离进入 observation，策略输出期望速度。比较远、中、近三种 command。',
    concept: ['观察距离', '选择速度', '执行动作'],
    filename: 'action.py',
    functionName: 'choose_speed',
    starter: `def choose_speed(distance_to_goal):
    if distance_to_goal > 0.5:
        return 0.0
    if distance_to_goal > 0.1:
        return 0.0
    return 0.0`,
    hint: ['把第一个 0.0 改成 0.4', '把第二个 0.0 改成 0.15', '最后仍然是 0.0'],
    tests: [
      { label: '目标还很远', args: [1.2], expected: 0.4 },
      { label: '目标已经较近', args: [0.3], expected: 0.15 },
      { label: '已经抵达目标', args: [0.05], expected: 0 },
    ],
    labTitle: '速度指令',
    labNote: '策略就是“看到某种状态后，应该输出什么动作”的规则。强化学习会自动学出更复杂的策略。',
  },
  {
    id: 4,
    shortTitle: '一局：从开始到结束',
    title: '算出整局拿了多少分',
    mission: '把一局中每一步的奖励加起来，得到这一局的总回报。',
    teacher: '把 trajectory 中的逐步 reward 聚合为 episodic return。它是评估策略的第一条曲线，但不能单独证明动作质量。',
    concept: ['开始一局', '累积奖励', '回合结束'],
    filename: 'episode.py',
    functionName: 'episode_return',
    starter: `def episode_return(rewards):
    # 返回所有奖励的总和
    return 0`,
    hint: ['return sum(rewards)'],
    tests: [
      { label: '连续得到奖励', args: [[1, 2, 3]], expected: 6 },
      { label: '中途受到惩罚', args: [[5, -2, 4]], expected: 7 },
      { label: '还没有开始', args: [[]], expected: 0 },
    ],
    labTitle: '回合时间线',
    labNote: '一次 episode 是从重置环境到结束的一整局。训练会收集很多局，再更新策略。',
  },
  {
    id: 5,
    shortTitle: '探索：从动作分布采样',
    title: '给策略动作加入受控探索',
    mission: '从策略均值与噪声生成连续关节动作，并限制在 [-1, 1]。',
    teacher: 'PPO 的 actor 输出动作分布参数，训练时从分布采样。这里用 mean + sigma × noise 模拟一次采样，再做 action clipping。',
    concept: ['策略动作均值', '加入探索噪声', '限制动作范围'],
    filename: 'action_sampling.py',
    functionName: 'sample_joint_action',
    starter: `def sample_joint_action(mean_action, noise, sigma):
    # 从连续动作分布采样，并限制到 [-1, 1]
    action = mean_action
    return action`,
    hint: ['action = mean_action + sigma * noise', 'return max(-1.0, min(1.0, action))'],
    tests: [
      { label: '小幅正向探索', args: [0.2, 0.5, 0.1], expected: 0.25 },
      { label: '超过动作上限', args: [0.95, 1, 0.2], expected: 1 },
      { label: '超过动作下限', args: [-0.95, -1, 0.2], expected: -1 },
    ],
    labTitle: '连续动作采样器',
    labNote: 'Microduck 的关节控制是连续动作空间。训练需要探索，部署推理通常使用分布均值以获得稳定动作。',
  },
  {
    id: 6,
    shortTitle: '价值：现在和未来的分数',
    title: '给未来奖励打一点折扣',
    mission: '计算折扣回报：第 t 步奖励乘以 gamma 的 t 次方。',
    teacher: '实现 return-to-go。gamma 控制 credit assignment 的时间尺度；下一步会看到 value function 如何减少策略梯度方差。',
    concept: ['现在的奖励', '未来的奖励', '折扣后相加'],
    filename: 'discount.py',
    functionName: 'discounted_return',
    starter: `def discounted_return(rewards, gamma):
    total = 0.0
    for t, reward in enumerate(rewards):
        # 把这一项加到 total
        pass
    return total`,
    hint: ['total += reward * (gamma ** t)'],
    tests: [
      { label: '两次十分奖励', args: [[10, 10], 0.9], expected: 19 },
      { label: '三步折扣', args: [[1, 2, 3], 0.5], expected: 2.75 },
      { label: '空回合', args: [[], 0.9], expected: 0 },
    ],
    labTitle: '未来价值尺',
    labNote: 'gamma 越接近 1，算法越重视长远结果；越接近 0，越在意眼前奖励。',
  },
  {
    id: 7,
    shortTitle: '学习：PPO 裁剪目标',
    title: '限制一次策略更新的幅度',
    mission: '实现 PPO clipped surrogate objective 的单样本版本。',
    teacher: 'ratio 是新旧策略对同一动作的概率比。用 clip_epsilon 把 ratio 限制在可信区间，再取 unclipped 与 clipped objective 的较小值。',
    concept: ['计算概率比影响', '裁剪更新幅度', '保守优化策略'],
    filename: 'ppo_clip.py',
    functionName: 'ppo_objective',
    starter: `def ppo_objective(ratio, advantage, clip_epsilon):
    unclipped = ratio * advantage
    clipped_ratio = ratio
    clipped = clipped_ratio * advantage
    return unclipped`,
    hint: ['clipped_ratio = max(1 - clip_epsilon, min(1 + clip_epsilon, ratio))', 'return min(unclipped, clipped)'],
    tests: [
      { label: '更新仍在可信区间', args: [1.1, 2, 0.2], expected: 2.2 },
      { label: '正优势触发上限', args: [1.4, 2, 0.2], expected: 2.4 },
      { label: '负优势触发下限', args: [0.6, -2, 0.2], expected: -1.6 },
    ],
    labTitle: 'PPO 更新监视器',
    labNote: 'PPO 不直接学习离散 Q 表；它用 actor-critic、advantage 与裁剪目标稳定更新连续控制策略。',
  },
  {
    id: 8,
    shortTitle: '奖励漏洞：高分却没完成',
    title: '别让鸭子靠拖时间刷分',
    mission: '只奖励前进并惩罚摔倒，不要因为存活步数越来越多就不断加分。',
    teacher: 'alive_steps 是 reward hacking 诱饵。同样的任务进度与终止状态，单纯拖长 episode 不应提高任务得分。把 reward 曲线与行为录像一起评估。',
    concept: ['设计目标', '寻找漏洞', '检查真实行为'],
    filename: 'safe_reward.py',
    functionName: 'safe_reward',
    starter: `def safe_reward(distance_m, fell, alive_steps):
    score = distance_m * 10

    # 不要用 alive_steps 加分

    if fell:
        score -= 50
    return score`,
    hint: ['这关的初始代码已经正确。直接运行，观察为什么 alive_steps 没被使用。'],
    tests: [
      { label: '正常前进 10 步', args: [0.5, false, 10], expected: 5 },
      { label: '同样距离拖 1000 步', args: [0.5, false, 1000], expected: 5 },
      { label: '前进后摔倒', args: [0.5, true, 20], expected: -45 },
    ],
    labTitle: '奖励漏洞检查器',
    labNote: '奖励塑形最难的地方，是高分必须对应你真正想要的行为。训练后一定要看动作，不能只看曲线。',
  },
  {
    id: 9,
    shortTitle: '部署：保护真实关节',
    title: '把策略输出变成安全关节目标',
    mission: '把策略给出的关节角限制在 -1 到 1 弧度之间，避免超出安全范围。',
    teacher: '实现部署侧 action guard。实际机器人还需要速度、力矩、温度、通信超时和 emergency stop；policy inference 只是控制栈的一层。',
    concept: ['策略输出动作', '限制安全范围', '发送给电机'],
    filename: 'joint_safety.py',
    functionName: 'safe_joint_target',
    starter: `def safe_joint_target(target_rad):
    # 把目标角度限制在 -1.0 到 1.0 之间
    return target_rad`,
    hint: ['return max(-1.0, min(1.0, target_rad))'],
    tests: [
      { label: '目标超过上限', args: [2.5], expected: 1 },
      { label: '目标超过下限', args: [-1.8], expected: -1 },
      { label: '目标在安全范围', args: [0.4], expected: 0.4 },
    ],
    labTitle: '关节安全限位器',
    labNote: '真实部署还会有速度、力矩、温度和通信检查。这一关先理解：策略输出不能不经保护就直接送给电机。',
  },
];
