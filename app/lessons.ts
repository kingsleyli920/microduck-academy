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

const lessonsZh: Lesson[] = [
  {
    id: 1,
    shortTitle: '奖励函数与终止条件',
    title: '实现基础奖励函数',
    mission: '按位移提供密集奖励，并在摔倒时施加终止惩罚。',
    teacher: '实现逐时间步奖励：位移增量构成 dense reward，摔倒触发 terminal penalty。运行三组状态，比较终止条件对 return 的影响。',
    concept: ['读取状态', '计算奖励', '返回分数'],
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
    labTitle: '奖励函数输出',
    labNote: '每组输入代表一个环境状态。训练器会依据这些逐步奖励更新策略。',
  },
  {
    id: 2,
    shortTitle: '观测与反馈控制',
    title: '根据倾角选择修正动作',
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
    labNote: '倾斜角只是 observation 的一部分。实际策略会同时读取关节角、速度和机身姿态。',
  },
  {
    id: 3,
    shortTitle: '目标条件动作',
    title: '根据目标距离选择速度',
    mission: '根据目标距离输出分段速度指令。',
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
    labNote: '策略把 observation 映射为 action。这里使用分段规则模拟最简单的目标条件策略。',
  },
  {
    id: 4,
    shortTitle: '回合与累计回报',
    title: '计算单个回合的累计回报',
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
    shortTitle: '连续动作探索',
    title: '从动作分布采样并限幅',
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
    shortTitle: '折扣回报',
    title: '计算折扣回报',
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
    labTitle: '折扣回报曲线',
    labNote: 'gamma 越接近 1，算法越重视长远结果；越接近 0，越在意眼前奖励。',
  },
  {
    id: 7,
    shortTitle: 'PPO 裁剪目标',
    title: '实现 PPO 裁剪目标',
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
    shortTitle: '奖励漏洞',
    title: '识别存活奖励漏洞',
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
    labNote: '高 return 只有在对应预期行为时才有意义。评估时应同时检查曲线、指标和动作录像。',
  },
  {
    id: 9,
    shortTitle: '部署安全层',
    title: '限制策略输出范围',
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

const lessonsEn: Lesson[] = [
  {
    id: 1,
    shortTitle: 'Reward and termination',
    title: 'Implement a basic reward function',
    mission: 'Reward forward displacement and apply a terminal penalty when the robot falls.',
    teacher: 'Implement a per-step reward: displacement provides a dense signal and a fall triggers a terminal penalty. Run three states and compare how termination changes the return.',
    concept: ['Read state', 'Compute reward', 'Return score'],
    filename: 'reward.py',
    functionName: 'duck_reward',
    starter: `def duck_reward(distance_m, fell):
    score = 0.0

    # 1. Add 10 points per metre travelled
    # Write the first expression here

    # 2. Subtract 50 points after a fall
    # Add the condition and penalty here

    return score`,
    hint: ['score = distance_m * 10', 'if fell:', '    score -= 50'],
    tests: [
      { label: 'Standing still', args: [0, false], expected: 0 },
      { label: 'Moves forward 0.3 m', args: [0.3, false], expected: 3 },
      { label: 'Moves forward, then falls', args: [0.3, true], expected: -47 },
    ],
    labTitle: 'Reward output',
    labNote: 'Each input represents an environment state. A trainer uses these step rewards to update the policy.',
  },
  {
    id: 2,
    shortTitle: 'Observation and feedback',
    title: 'Choose a correction from body tilt',
    mission: 'Use the body roll angle to select a left correction, right correction, or hold action.',
    teacher: 'Build a heuristic baseline that maps the sign of the roll angle to a discrete correction. A later lesson replaces this rule with a neural policy.',
    concept: ['Read tilt', 'Evaluate state', 'Choose correction'],
    filename: 'balance.py',
    functionName: 'balance_action',
    starter: `def balance_action(tilt_deg):
    # A rightward tilt needs a left correction
    if tilt_deg > 5:
        return ""

    # A leftward tilt needs a right correction
    if tilt_deg < -5:
        return ""

    return ""`,
    hint: ['Use left in the first branch', 'Use right in the second branch', 'Return hold at the end'],
    tests: [
      { label: 'Tilted 8° right', args: [8], expected: 'left' },
      { label: 'Tilted 8° left', args: [-8], expected: 'right' },
      { label: 'Tilted only 2°', args: [2], expected: 'hold' },
    ],
    labTitle: 'Balance response',
    labNote: 'Tilt is one part of the state. The real policy observes joint positions, velocities, and body orientation together.',
  },
  {
    id: 3,
    shortTitle: 'Goal-conditioned action',
    title: 'Select speed from target distance',
    mission: 'Return a piecewise speed command based on distance to the target.',
    teacher: 'Implement a simplified goal-conditioned policy: target distance enters the observation and the policy returns a speed command. Compare far, near, and reached states.',
    concept: ['Observe distance', 'Select speed', 'Apply action'],
    filename: 'action.py',
    functionName: 'choose_speed',
    starter: `def choose_speed(distance_to_goal):
    if distance_to_goal > 0.5:
        return 0.0
    if distance_to_goal > 0.1:
        return 0.0
    return 0.0`,
    hint: ['Change the first 0.0 to 0.4', 'Change the second 0.0 to 0.15', 'Keep the final value at 0.0'],
    tests: [
      { label: 'Target is far away', args: [1.2], expected: 0.4 },
      { label: 'Target is nearby', args: [0.3], expected: 0.15 },
      { label: 'Target reached', args: [0.05], expected: 0 },
    ],
    labTitle: 'Speed command',
    labNote: 'A policy maps observations to actions. This exercise uses a piecewise rule as a minimal goal-conditioned policy.',
  },
  {
    id: 4,
    shortTitle: 'Episodes and return',
    title: 'Compute an episode return',
    mission: 'Sum the rewards from every step in one episode.',
    teacher: 'Aggregate step rewards from a trajectory into episodic return. Return is a useful first metric, but it does not establish behavior quality on its own.',
    concept: ['Start episode', 'Accumulate rewards', 'End episode'],
    filename: 'episode.py',
    functionName: 'episode_return',
    starter: `def episode_return(rewards):
    # Return the sum of all step rewards
    return 0`,
    hint: ['return sum(rewards)'],
    tests: [
      { label: 'Positive rewards', args: [[1, 2, 3]], expected: 6 },
      { label: 'Includes a penalty', args: [[5, -2, 4]], expected: 7 },
      { label: 'Empty episode', args: [[]], expected: 0 },
    ],
    labTitle: 'Episode timeline',
    labNote: 'An episode runs from environment reset to termination. Training collects many episodes before each policy update.',
  },
  {
    id: 5,
    shortTitle: 'Continuous action exploration',
    title: 'Sample and clamp a continuous action',
    mission: 'Generate a joint action from a policy mean and noise, then clamp it to [-1, 1].',
    teacher: 'A PPO actor produces action-distribution parameters. During training, the controller samples mean + sigma × noise and clips the resulting action.',
    concept: ['Policy mean', 'Exploration noise', 'Action bounds'],
    filename: 'action_sampling.py',
    functionName: 'sample_joint_action',
    starter: `def sample_joint_action(mean_action, noise, sigma):
    # Sample a continuous action and clamp it to [-1, 1]
    action = mean_action
    return action`,
    hint: ['action = mean_action + sigma * noise', 'return max(-1.0, min(1.0, action))'],
    tests: [
      { label: 'Small positive sample', args: [0.2, 0.5, 0.1], expected: 0.25 },
      { label: 'Above upper bound', args: [0.95, 1, 0.2], expected: 1 },
      { label: 'Below lower bound', args: [-0.95, -1, 0.2], expected: -1 },
    ],
    labTitle: 'Continuous action sampler',
    labNote: 'Microduck uses a continuous joint-action space. Training samples actions for exploration; deployment commonly uses the distribution mean for stability.',
  },
  {
    id: 6,
    shortTitle: 'Discounted return',
    title: 'Compute discounted return',
    mission: 'Multiply the reward at step t by gamma to the power of t, then sum the terms.',
    teacher: 'Implement return-to-go. Gamma sets the time scale for credit assignment; value functions later reduce variance in policy-gradient estimates.',
    concept: ['Current reward', 'Future reward', 'Discounted sum'],
    filename: 'discount.py',
    functionName: 'discounted_return',
    starter: `def discounted_return(rewards, gamma):
    total = 0.0
    for t, reward in enumerate(rewards):
        # Add this discounted term to total
        pass
    return total`,
    hint: ['total += reward * (gamma ** t)'],
    tests: [
      { label: 'Two rewards of ten', args: [[10, 10], 0.9], expected: 19 },
      { label: 'Three discounted steps', args: [[1, 2, 3], 0.5], expected: 2.75 },
      { label: 'Empty episode', args: [[], 0.9], expected: 0 },
    ],
    labTitle: 'Discounted return curve',
    labNote: 'Gamma near 1 gives more weight to long-term outcomes. Gamma near 0 emphasizes immediate rewards.',
  },
  {
    id: 7,
    shortTitle: 'PPO clipped objective',
    title: 'Implement the PPO clipped objective',
    mission: 'Implement a single-sample PPO clipped surrogate objective.',
    teacher: 'The ratio compares new and old policy probabilities for the same action. Clamp it to the trust region and take the smaller of the unclipped and clipped objectives.',
    concept: ['Apply probability ratio', 'Clip update size', 'Optimize conservatively'],
    filename: 'ppo_clip.py',
    functionName: 'ppo_objective',
    starter: `def ppo_objective(ratio, advantage, clip_epsilon):
    unclipped = ratio * advantage
    clipped_ratio = ratio
    clipped = clipped_ratio * advantage
    return unclipped`,
    hint: ['clipped_ratio = max(1 - clip_epsilon, min(1 + clip_epsilon, ratio))', 'return min(unclipped, clipped)'],
    tests: [
      { label: 'Ratio inside clip range', args: [1.1, 2, 0.2], expected: 2.2 },
      { label: 'Positive advantage hits upper bound', args: [1.4, 2, 0.2], expected: 2.4 },
      { label: 'Negative advantage hits lower bound', args: [0.6, -2, 0.2], expected: -1.6 },
    ],
    labTitle: 'PPO objective monitor',
    labNote: 'PPO uses an actor-critic model, advantage estimates, and a clipped objective to stabilize policy updates in continuous control.',
  },
  {
    id: 8,
    shortTitle: 'Reward exploits',
    title: 'Identify a survival-reward exploit',
    mission: 'Reward progress and penalize falls without adding score merely for extending the episode.',
    teacher: 'The alive_steps input is a reward-hacking trap. With equal task progress and termination state, a longer episode should not increase task reward. Evaluate curves alongside behavior videos.',
    concept: ['Specify objective', 'Probe exploit', 'Inspect behavior'],
    filename: 'safe_reward.py',
    functionName: 'safe_reward',
    starter: `def safe_reward(distance_m, fell, alive_steps):
    score = distance_m * 10

    # Do not reward alive_steps

    if fell:
        score -= 50
    return score`,
    hint: ['The starter is already correct. Run it and inspect why alive_steps is unused.'],
    tests: [
      { label: 'Moves 0.5 m in 10 steps', args: [0.5, false, 10], expected: 5 },
      { label: 'Same distance in 1,000 steps', args: [0.5, false, 1000], expected: 5 },
      { label: 'Moves forward, then falls', args: [0.5, true, 20], expected: -45 },
    ],
    labTitle: 'Reward exploit check',
    labNote: 'A high return is useful only when it corresponds to the intended behavior. Review curves, metrics, and behavior recordings together.',
  },
  {
    id: 9,
    shortTitle: 'Deployment safety layer',
    title: 'Bound policy outputs',
    mission: 'Clamp the target joint angle to the safe range from -1 to 1 radian.',
    teacher: 'Implement a deployment-side action guard. A physical robot also needs velocity, torque, temperature, communication-timeout, and emergency-stop checks.',
    concept: ['Policy output', 'Apply safety bound', 'Send motor target'],
    filename: 'joint_safety.py',
    functionName: 'safe_joint_target',
    starter: `def safe_joint_target(target_rad):
    # Clamp the target angle to [-1.0, 1.0]
    return target_rad`,
    hint: ['return max(-1.0, min(1.0, target_rad))'],
    tests: [
      { label: 'Target above upper bound', args: [2.5], expected: 1 },
      { label: 'Target below lower bound', args: [-1.8], expected: -1 },
      { label: 'Target inside safe range', args: [0.4], expected: 0.4 },
    ],
    labTitle: 'Joint target clamp',
    labNote: 'Real deployment adds velocity, torque, temperature, and communication checks. Policy output must pass a safety layer before reaching the motors.',
  },
];

export const lessons = lessonsZh;

export function getLessons(locale: Locale): Lesson[] {
  return locale === 'en' ? lessonsEn : lessonsZh;
}
import type { Locale } from './i18n';
