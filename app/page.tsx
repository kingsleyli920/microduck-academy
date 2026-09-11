'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bird, BookOpen, Check, CheckCircle2, ChevronRight, Circle, Download, FileCode2,
  FlaskConical, Loader2, Lock, Map, Play, RotateCcw, Square, Trophy, Upload, XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { lessons, type Lesson } from './lessons';
import { SimulatorInspector, type SimulatorTelemetry } from './simulator-inspector';
import { ControlStudio } from './control-studio';
import { parseControlProgram, parseNumberArguments, type ControlProgramNode } from './control-program';
import { RewardLabStudio } from './reward-lab-studio';
import {
  defaultRewardConfigs, planarSpeedFromState, sanitizeRewardConfig, scoreRewardSample, terminationReason,
  type RewardConfig, type RewardSlot, type RolloutResult,
} from './reward-lab';

type TestResult = { label: string; passed: boolean; actual: string; expected: string };
type RunResult = { results: TestResult[]; passed: boolean; stdout: string; error: string | null };
type SimulatorRl = {
  mode: string;
  sitFlag: number;
  loco: 'legs' | 'rollers';
  resetSim: () => void;
  spawnBall: () => void;
  triggerRoll: (source?: string) => void;
  triggerKick: (foot: 'left' | 'right', source?: string) => boolean;
  triggerGroundPick: (source?: string) => void;
  triggerCrouch: (source?: string) => void;
  debugPush: (vx: number, vy: number, vz: number, wx: number, wy: number, wz: number) => void;
  setRelief: (enabled: boolean) => void;
  buildObs: () => Float32Array;
  cmd: Float32Array;
  lastAction: Float32Array;
  data: { qpos: ArrayLike<number>; qvel: ArrayLike<number> };
  controller: { addSource: (source: AcademyInputSource) => void };
  headTarget: Float32Array;
  headMode: boolean;
  toggleHeadMode: () => void;
  setLoco: (name: 'legs' | 'rollers') => Promise<void>;
  locoSwitching: boolean;
  chaseCam: boolean;
  loadCustomPolicy: (ref: string) => Promise<void>;
  clearCustomPolicy: () => void;
  customPolicy: null | { ref: string; name: string; kind: 'perpetual' | 'episodic' | 'script'; slot: 'walk' | 'sitstand' | 'trick' | 'script' };
  toggleScript: () => void;
  inputLocked: boolean;
  respawnActive: boolean;
};
type AcademyInputSource = {
  id: string;
  connected: boolean;
  command: Float32Array;
  axes: { jaw: number; orbitX: number; orbitY: number; ride: number };
  pressed: Record<string, boolean>;
  active: boolean;
  isActive: () => boolean;
  init: () => void;
  dispose: () => void;
  poll: () => void;
  onAction?: (name: string, meta?: unknown) => void;
};
type SimulatorWindow = Window & typeof globalThis & { rl?: SimulatorRl; academySource?: AcademyInputSource };
type SavedProgress = {
  schemaVersion: 5;
  currentId: number;
  completed: number[];
  solutions: Record<number, string>;
  simulatorScript: string;
  simulatorRuns: number;
  level1Completed: number[];
  rewardConfigs: Record<RewardSlot, RewardConfig>;
  rewardResults: Partial<Record<RewardSlot, RolloutResult>>;
  level3Completed: number[];
  updatedAt: string;
};

const STORAGE_KEY = 'microduck-academy-progress-v1';
const LEGACY_SIMULATOR_SCRIPT = `# 这些函数调用官方已经训练好的 ONNX skills
roll()
wait(2500)
kick("left")
wait(1800)
reset()`;

const DEFAULT_SIMULATOR_SCRIPT = `# 连续控制：参数会在 50 Hz 下交给 walk policy
drive(0.18, 0.0, 1200)
turn(0.7, 650)

# 读取实时 observation 后再决定动作
print(obs[5])
if obs[5] < -0.85 {
  look(0.35, -0.15, 0.45, 0.0, 800)
  skill("roll")
}

wait(2200)
reset()`;

const learningLevels = [
  { level: 'Level 0', title: '强化学习心智模型', status: '现在可学 · 9 关', detail: '用 Python 掌握 environment、observation、action、reward、rollout、return、PPO 与部署安全。' },
  { level: 'Level 1', title: '读懂真实策略', status: '现在可学 · 6 个实验', detail: '在官方模拟器中观察 61D observation、14D action、50 Hz 控制循环和 policy 切换。' },
  { level: 'Level 2', title: '编写实时控制程序', status: '现在可用', detail: '用 drive、turn、look、if、repeat 和 observation 分支控制 50 Hz policy，也能调用已有 skills。' },
  { level: 'Level 3', title: '任务与 Reward 实验室', status: '现在可学 · A/B 实验', detail: '在官方 MuJoCo 中配置 command、reward 与 termination，采集真实 rollout 并比较 return。' },
  { level: 'Level 4', title: '训练与评估 Policy', status: '需要 NVIDIA GPU / HF Jobs', detail: '并行 rollout、PPO 训练、checkpoint 对比、录像与指标评估，排查 reward hacking。' },
  { level: 'Level 5', title: '发布 ONNX Skill', status: '官方接口已具备', detail: '导出 [1,61] → [1,14] ONNX，生成 manifest，放进浏览器竞技场和 Hugging Face Hub。' },
  { level: 'Level 6', title: '部署到真实 Microduck', status: '硬件到货后', detail: '通过 robotctl 安装策略，先限速和空载验证，再记录真机 observation 做 sim-to-real 对比。' },
];

const referenceProjects = [
  { name: 'Microduck + microduck_rl', role: '我们的真实目标接口', note: '官方运行时、MJLab/PPO 训练、ONNX 导出和策略 manifest。', href: 'https://github.com/pollen-robotics/microduck' },
  { name: 'Microduck Simulator', role: '浏览器物理与推理', note: 'MuJoCo WASM + onnxruntime-web，真实策略以 50 Hz 在浏览器运行。', href: 'https://huggingface.co/spaces/pollen-robotics/microduck-simulator' },
  { name: 'LeLab / LeRobot', role: '一站式产品参照', note: '把配置、遥操作、数据、训练和部署放进一个 GUI；当前 LeLab 只支持 SO-101。', href: 'https://github.com/huggingface/leLab' },
  { name: 'MuJoCo Playground', role: '训练与 sim-to-real 参照', note: '开源 GPU 机器人学习环境，展示任务、训练、评估和真机迁移的工程结构。', href: 'https://github.com/google-deepmind/mujoco_playground' },
  { name: 'Gymnasium Robotics', role: '环境 API 参照', note: '用统一 reset/step/observation/action 契约组织 MuJoCo 机器人任务。', href: 'https://github.com/Farama-Foundation/Gymnasium-Robotics' },
  { name: 'JupyterLite / Blockly Games', role: '免登录学习体验参照', note: '浏览器运行、持久化与离线学习；适合作为 local-first 课堂的产品基线。', href: 'https://jupyterlite.readthedocs.io/en/stable/' },
];

const rlContexts: Record<number, { role: string; analogy: string; realUse: string }> = {
  1: {
    role: 'Environment / Reward',
    analogy: '类似 Agent 系统里的 evaluator，但 reward 会在每个 simulation step 高频执行。',
    realUse: '训练环境根据位移、姿态和终止条件给分；它只参与训练，不部署到硬件。',
  },
  2: {
    role: 'Observation → Policy → Action',
    analogy: '类似把 state/context 交给 agent，再由 agent 选择 tool call。',
    realUse: '真实策略读取关节角、角速度、机身姿态等 observation，输出关节目标。',
  },
  3: {
    role: 'Command-conditioned Policy',
    analogy: '类似把用户目标作为 context 的一部分，让同一个 agent 执行不同任务。',
    realUse: '目标速度或方向会并入 observation，使一个策略能响应不同运动指令。',
  },
  4: {
    role: 'Rollout / Trajectory',
    analogy: '类似一条完整 agent trace：状态、动作、结果按时间组成一条轨迹。',
    realUse: '训练并行收集大量 episode，再用 return、成功率和行为录像评估策略。',
  },
  5: {
    role: 'Stochastic Policy',
    analogy: '类似模型采样温度，但这里是在连续动作分布中探索关节控制。',
    realUse: 'PPO 训练时从 actor 分布采样；部署时通常取均值以获得稳定动作。',
  },
  6: {
    role: 'Return / Value Estimation',
    analogy: '类似给长链路 agent 结果做 temporal credit assignment。',
    realUse: '折扣回报和 value function 用来估计动作的长期影响，并降低策略梯度方差。',
  },
  7: {
    role: 'PPO Policy Update',
    analogy: '类似限制一次 model update 不要偏离旧策略太远。',
    realUse: 'Microduck 连续控制使用 actor-critic 路线；PPO clip 约束新旧策略概率比。',
  },
  8: {
    role: 'Reward Design / Evaluation',
    analogy: '与 Agent evaluator 被 gaming 的问题相同：指标提升不等于任务真的完成。',
    realUse: '必须同时检查 reward 曲线、成功率、能耗、跌倒率和真实动作录像。',
  },
  9: {
    role: 'Deployment / Safety Layer',
    analogy: '类似 tool execution 前的 policy guard 与参数校验。',
    realUse: 'ONNX policy 输出经过限位和安全检查，再由控制循环发送给真实关节。',
  },
};

function MiniLab({ lesson, result, running }: { lesson: Lesson; result: RunResult | null; running: boolean }) {
  const successful = Boolean(result?.passed);
  const lastActual = result?.results.at(-1)?.actual ?? '—';
  return (
    <section className={`mini-lab lesson-${lesson.id} ${successful ? 'is-successful' : ''}`} aria-label="本关即时演示">
      <div className="lab-title-row">
        <div><p className="eyebrow">即时可视化</p><h3>{lesson.labTitle}</h3></div>
        <span className="lab-badge">小实验</span>
      </div>
      <div className="duck-stage" aria-hidden="true">
        <div className="target-flag">目标</div>
        <div className={`duck-runner ${running ? 'is-running' : ''} ${successful ? 'did-pass' : ''}`}><Bird /></div>
        <div className="track-line" />
      </div>
      <div className="lab-readout">
        <span>最后一组输出</span><strong>{lastActual}</strong>
        <span>状态</span><strong>{running ? '计算中' : successful ? '符合目标' : result ? '需要修改' : '等待运行'}</strong>
      </div>
      <div className="trial-strip" aria-label="Microduck 测试场景">
        {lesson.tests.map((test, index) => {
          const testResult = result?.results[index];
          return <div key={test.label} className={testResult?.passed ? 'trial-pass' : ''}>
            <span>{test.label}</span>
            <strong>{testResult ? testResult.actual : '待运行'}</strong>
          </div>;
        })}
      </div>
      <p>{lesson.labNote}</p>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<'course' | 'simulator' | 'roadmap'>('course');
  const [currentId, setCurrentId] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [solutions, setSolutions] = useState<Record<number, string>>(() =>
    Object.fromEntries(lessons.map((item) => [item.id, item.starter])),
  );
  const [hintOpen, setHintOpen] = useState(false);
  const [runtime, setRuntime] = useState<'loading' | 'ready' | 'error'>('loading');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [serviceStopped, setServiceStopped] = useState(false);
  const [simulatorScript, setSimulatorScript] = useState(DEFAULT_SIMULATOR_SCRIPT);
  const [simulatorRuns, setSimulatorRuns] = useState(0);
  const [simulatorReady, setSimulatorReady] = useState(false);
  const [simulatorEntered, setSimulatorEntered] = useState(false);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState('正在等待官方模拟器加载…');
  const [simulatorTrace, setSimulatorTrace] = useState<string[]>([]);
  const [simulatorLabTab, setSimulatorLabTab] = useState<'observe' | 'compose' | 'reward'>('observe');
  const [telemetry, setTelemetry] = useState<SimulatorTelemetry | null>(null);
  const [telemetryPaused, setTelemetryPaused] = useState(false);
  const [level1Completed, setLevel1Completed] = useState<number[]>([]);
  const [rewardConfigs, setRewardConfigs] = useState<Record<RewardSlot, RewardConfig>>(defaultRewardConfigs);
  const [rewardResults, setRewardResults] = useState<Partial<Record<RewardSlot, RolloutResult>>>({});
  const [rewardRunning, setRewardRunning] = useState<RewardSlot | null>(null);
  const [level3Completed, setLevel3Completed] = useState<number[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const simulatorFrameRef = useRef<HTMLIFrameElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const runningLessonIdRef = useRef(1);
  const requestIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const driveTimerRef = useRef<number | null>(null);
  const driveBaselineRef = useRef<number[] | null>(null);
  const scriptRunIdRef = useRef(0);
  const rewardRunIdRef = useRef(0);

  const lesson = lessons[currentId - 1];
  const rlContext = rlContexts[currentId];
  const code = solutions[currentId] ?? lesson.starter;
  const unlocked = Math.min(lessons.length, Math.max(1, ...completed.map((id) => id + 1)));
  const progress = (completed.length / lessons.length) * 100;

  // This one-time hydration intentionally restores browser-only local progress.
  // oxlint-disable-next-line react/react-compiler
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedProgress>;
        setCurrentId(Math.min(lessons.length, Math.max(1, parsed.currentId || 1)));
        setCompleted(Array.isArray(parsed.completed) ? parsed.completed : []);
        setSolutions((previous) => ({ ...previous, ...parsed.solutions }));
        if (typeof parsed.simulatorScript === 'string') {
          const needsControlExample = (parsed.schemaVersion ?? 0) < 4 && parsed.simulatorScript.trim() === LEGACY_SIMULATOR_SCRIPT.trim();
          setSimulatorScript(needsControlExample ? DEFAULT_SIMULATOR_SCRIPT : parsed.simulatorScript);
        }
        if (typeof parsed.simulatorRuns === 'number') setSimulatorRuns(parsed.simulatorRuns);
        if (Array.isArray(parsed.level1Completed)) setLevel1Completed(parsed.level1Completed);
        if (parsed.rewardConfigs) {
          setRewardConfigs({
            A: sanitizeRewardConfig(parsed.rewardConfigs.A ?? {}, defaultRewardConfigs.A),
            B: sanitizeRewardConfig(parsed.rewardConfigs.B ?? {}, defaultRewardConfigs.B),
          });
        }
        if (parsed.rewardResults && typeof parsed.rewardResults === 'object') setRewardResults(parsed.rewardResults);
        if (Array.isArray(parsed.level3Completed)) setLevel3Completed(parsed.level3Completed);
      }
    } catch {
      // A damaged local save should never prevent the classroom from opening.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saved: SavedProgress = {
      schemaVersion: 5, currentId, completed, solutions, simulatorScript, simulatorRuns, level1Completed,
      rewardConfigs, rewardResults, level3Completed,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [completed, currentId, hydrated, level1Completed, level3Completed, rewardConfigs, rewardResults, simulatorRuns, simulatorScript, solutions]);

  useEffect(() => {
    if (view !== 'simulator') return;
    const inspectSimulator = () => {
      try {
        const rl = (simulatorFrameRef.current?.contentWindow as SimulatorWindow | null)?.rl;
        const entered = Boolean(rl);
        setSimulatorReady(Boolean(rl));
        setSimulatorEntered(entered);
        if (entered) setLevel1Completed((previous) => previous.includes(1) ? previous : [...previous, 1].sort((a, b) => a - b));
        if (rl && entered && !telemetryPaused) {
          const observation = Array.from(rl.buildObs());
          const action = Array.from(rl.lastAction);
          setTelemetry({ observation, action, command: Array.from(rl.cmd), mode: rl.mode, loco: rl.loco, capturedAt: Date.now() });
          const baseline = driveBaselineRef.current;
          if (baseline && action.some((value, index) => Math.abs(value - (baseline[index] ?? 0)) > 0.015)) {
            setLevel1Completed((previous) => previous.includes(4) ? previous : [...previous, 4].sort((a, b) => a - b));
            driveBaselineRef.current = null;
          }
          if (rl.mode === 'roll') {
            setLevel1Completed((previous) => previous.includes(4) && !previous.includes(5) ? [...previous, 5].sort((a, b) => a - b) : previous);
          }
        }
        if (rl && !simulatorRunning) {
          setSimulatorStatus(!entered ? '正在加载官方 MuJoCo 与 ONNX 策略' : rl.mode === 'walk'
            ? `桥接已就绪 · 当前 ${rl.loco === 'legs' ? '双腿' : '轮滑'} / ${rl.mode}`
            : `桥接已就绪 · 当前动作 ${rl.mode}`);
        }
      } catch {
        setSimulatorReady(false);
      }
    };
    inspectSimulator();
    const poll = window.setInterval(inspectSimulator, 500);
    return () => window.clearInterval(poll);
  }, [simulatorRunning, telemetryPaused, view]);

  useEffect(() => () => {
    if (driveTimerRef.current) window.clearTimeout(driveTimerRef.current);
  }, []);

  useEffect(() => {
    if (view !== 'simulator' || !simulatorReady || !simulatorEntered) return;
    const runHotkey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('textarea, input, [contenteditable="true"]')) return;
      if (event.code !== 'KeyB') return;
      const rl = (simulatorFrameRef.current?.contentWindow as SimulatorWindow | null)?.rl;
      if (!rl) return;
      rl.triggerRoll('academy-hotkey');
      setSimulatorStatus('已从课堂快捷键 B 调用 roll policy');
    };
    window.addEventListener('keydown', runHotkey);
    const frameWindow = simulatorFrameRef.current?.contentWindow;
    frameWindow?.addEventListener('keydown', runHotkey);
    return () => {
      window.removeEventListener('keydown', runHotkey);
      frameWindow?.removeEventListener('keydown', runHotkey);
    };
  }, [simulatorEntered, simulatorReady, view]);

  useEffect(() => {
    const worker = new Worker('/python-worker.js');
    workerRef.current = worker;
    const warmupId = ++requestIdRef.current;
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        setRuntime('ready');
      } else if (event.data.type === 'result') {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        const nextResult = event.data.payload as RunResult;
        setResult(nextResult);
        setRunning(false);
        if (nextResult.passed) {
          const finishedId = runningLessonIdRef.current;
          setCompleted((previous) => previous.includes(finishedId) ? previous : [...previous, finishedId].sort((a, b) => a - b));
        }
      } else if (event.data.type === 'worker-error') {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setRuntime('error');
        setRunning(false);
        setResult({ results: [], passed: false, stdout: '', error: event.data.error });
      }
    };
    worker.postMessage({ id: warmupId, type: 'warmup' });
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      worker.terminate();
    };
  }, []);

  const runCode = () => {
    if (!workerRef.current || runtime !== 'ready') return;
    setRunning(true);
    setResult(null);
    runningLessonIdRef.current = currentId;
    workerRef.current.postMessage({
      id: ++requestIdRef.current,
      type: 'run',
      payload: { code, functionName: lesson.functionName, tests: lesson.tests },
    });
    timerRef.current = window.setTimeout(() => {
      workerRef.current?.terminate();
      setRuntime('error');
      setRunning(false);
      setResult({ results: [], passed: false, stdout: '', error: '代码运行超过 20 秒。请刷新页面后检查是否写了无限循环。' });
    }, 20_000);
  };

  const selectLesson = (id: number) => {
    if (id > unlocked) return;
    setCurrentId(id);
    setResult(null);
    setHintOpen(false);
  };
  const resetLesson = () => {
    setSolutions((previous) => ({ ...previous, [currentId]: lesson.starter }));
    setResult(null);
  };
  const resetCourse = () => {
    setCurrentId(1);
    setCompleted([]);
    setSolutions(Object.fromEntries(lessons.map((item) => [item.id, item.starter])));
    setResult(null);
    setHintOpen(false);
    setLevel1Completed([]);
    setRewardResults({});
    setLevel3Completed([]);
  };
  const nextLesson = () => {
    if (currentId >= lessons.length) setView('simulator');
    else selectLesson(currentId + 1);
  };
  const getSimulatorWindow = () => simulatorFrameRef.current?.contentWindow as SimulatorWindow | null;
  const getSimulator = () => getSimulatorWindow()?.rl;
  const completeLevelOne = (mission: number) => {
    setLevel1Completed((previous) => previous.includes(mission) ? previous : [...previous, mission].sort((a, b) => a - b));
  };
  const ensureAcademySource = () => {
    const frameWindow = getSimulatorWindow();
    const rl = frameWindow?.rl;
    if (!frameWindow || !rl) return null;
    if (!frameWindow.academySource) {
      const source: AcademyInputSource = {
        id: 'academy', connected: true, command: new Float32Array(3),
        axes: { jaw: 0, orbitX: 0, orbitY: 0, ride: 0 }, pressed: {}, active: false,
        isActive() { return this.active; }, init() {}, dispose() {}, poll() {},
      };
      rl.controller.addSource(source);
      frameWindow.academySource = source;
    }
    return frameWindow.academySource;
  };
  const snapshotTelemetry = () => {
    const rl = getSimulator();
    if (!rl) return;
    setTelemetry({
      observation: Array.from(rl.buildObs()), action: Array.from(rl.lastAction),
      command: Array.from(rl.cmd), mode: rl.mode, loco: rl.loco, capturedAt: Date.now(),
    });
    setTelemetryPaused(true);
    completeLevelOne(2);
    setSimulatorStatus('已冻结一帧真实的 61D observation');
  };
  const driveFromAcademy = () => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (!rl || !source) return;
    setTelemetryPaused(false);
    driveBaselineRef.current = Array.from(rl.lastAction);
    source.command[0] = 0.2; source.command[1] = 0; source.command[2] = 0;
    source.active = true;
    completeLevelOne(3);
    setSimulatorStatus('Academy source 正在发送 vx=0.20 m/s');
    if (driveTimerRef.current) window.clearTimeout(driveTimerRef.current);
    driveTimerRef.current = window.setTimeout(() => {
      source.active = false;
      source.command.fill(0);
      setSimulatorStatus('速度命令结束，policy 回到站立目标');
    }, 1800);
  };
  const resetLevelOneExperiment = () => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (!rl) return;
    if (source) { source.active = false; source.command.fill(0); }
    rl.resetSim();
    setTelemetryPaused(false);
    if (level1Completed.includes(5)) completeLevelOne(6);
    setSimulatorStatus('已重置物理世界并交还 walk policy');
  };
  const replayLevelOne = () => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (source) { source.active = false; source.command.fill(0); }
    rl?.resetSim();
    setLevel1Completed([]);
    setTelemetryPaused(false);
    setSimulatorStatus('Level 1 已重新开始');
  };
  const invokeSimulatorAction = (action: 'roll' | 'kick-left' | 'kick-right' | 'ground-pick' | 'ball' | 'reset') => {
    const rl = getSimulator();
    if (!rl) {
      setSimulatorStatus('官方模拟器还在初始化，请稍等。');
      return;
    }
    if (action === 'roll') rl.triggerRoll('academy-button');
    if (action === 'kick-left') rl.triggerKick('left', 'academy-button');
    if (action === 'kick-right') rl.triggerKick('right', 'academy-button');
    if (action === 'ground-pick') rl.triggerGroundPick('academy-button');
    if (action === 'ball') rl.spawnBall();
    if (action === 'reset') rl.resetSim();
    setSimulatorStatus(`课堂已发送 ${action} · 模拟器 mode=${rl.mode}`);
  };
  const addSimulatorTrace = (message: string) => setSimulatorTrace((previous) => [...previous, message].slice(-30));
  const waitForProgram = async (milliseconds: number, runId: number) => {
    const deadline = Date.now() + Math.min(10_000, Math.max(0, milliseconds));
    while (Date.now() < deadline) {
      if (scriptRunIdRef.current !== runId) throw new Error('__PROGRAM_STOPPED__');
      await new Promise((resolve) => window.setTimeout(resolve, Math.min(50, deadline - Date.now())));
    }
  };
  const executeControlCommand = async (node: Extract<ControlProgramNode, { type: 'command' }>, rl: SimulatorRl, source: AcademyInputSource, runId: number) => {
    const command = node.source;
    setSimulatorStatus(`第 ${node.line} 行 · ${command}`);

    const driveMatch = command.match(/^drive\((.*)\)$/);
    const turnMatch = command.match(/^turn\((.*)\)$/);
    const lookMatch = command.match(/^look\((.*)\)$/);
    const waitMatch = command.match(/^wait\((.*)\)$/);
    const printMatch = command.match(/^print\(obs\[(\d+)]\)$/);
    const skillMatch = command.match(/^skill\(["'](roll|kick_left|kick_right|ground_pick|crouch)["']\)$/);
    const legacyKickMatch = command.match(/^kick\(["'](left|right)["']\)$/);
    const pushMatch = command.match(/^push\((.*)\)$/);
    const reliefMatch = command.match(/^relief\((true|false)\)$/);
    const cameraMatch = command.match(/^camera\(["'](follow|free)["']\)$/);
    const moveMatch = command.match(/^move\(["']([^"']+)["']\)$/);

    if (driveMatch || turnMatch) {
      const [vxRaw, yawRaw, milliseconds] = driveMatch
        ? parseNumberArguments(driveMatch[1], node.line, 3)
        : [0, ...parseNumberArguments(turnMatch?.[1] ?? '', node.line, 2)];
      const vx = Math.min(rl.loco === 'rollers' ? 0.6 : 0.25, Math.max(rl.loco === 'rollers' ? -0.5 : -0.2, vxRaw));
      const yaw = Math.min(rl.loco === 'rollers' ? 0.3 : 1, Math.max(rl.loco === 'rollers' ? -0.3 : -1, yawRaw));
      source.command[0] = vx; source.command[1] = 0; source.command[2] = yaw; source.active = true;
      addSimulatorTrace(`L${node.line} command = [${vx.toFixed(2)}, 0.00, ${yaw.toFixed(2)}] · ${milliseconds} ms`);
      try { await waitForProgram(milliseconds, runId); }
      finally { source.active = false; source.command.fill(0); }
      return;
    }

    if (lookMatch) {
      const [neck, pitch, yaw, roll, milliseconds] = parseNumberArguments(lookMatch[1], node.line, 5);
      if (!rl.headMode) rl.toggleHeadMode();
      [neck, pitch, yaw, roll].forEach((value, index) => { rl.headTarget[index] = Math.min(2.5, Math.max(-2.5, value)); });
      addSimulatorTrace(`L${node.line} head target = [${[neck, pitch, yaw, roll].map((value) => value.toFixed(2)).join(', ')}]`);
      await waitForProgram(milliseconds, runId);
      if (rl.headMode) rl.toggleHeadMode();
      return;
    }

    if (waitMatch) {
      const [milliseconds] = parseNumberArguments(waitMatch[1], node.line, 1);
      addSimulatorTrace(`L${node.line} wait ${milliseconds} ms`);
      await waitForProgram(milliseconds, runId);
      return;
    }

    if (printMatch) {
      const index = Number(printMatch[1]);
      if (index > 60) throw new Error(`第 ${node.line} 行：observation 下标必须在 0–60。`);
      addSimulatorTrace(`L${node.line} obs[${index}] = ${rl.buildObs()[index].toFixed(4)}`);
      return;
    }

    if (pushMatch) {
      const values = parseNumberArguments(pushMatch[1], node.line, 6);
      const safe = values.map((value, index) => Math.min(index < 3 ? 2 : 8, Math.max(index < 3 ? -2 : -8, value)));
      rl.debugPush(safe[0], safe[1], safe[2], safe[3], safe[4], safe[5]);
      addSimulatorTrace(`L${node.line} push = [${safe.map((value) => value.toFixed(2)).join(', ')}]`);
      await waitForProgram(80, runId);
      return;
    }

    if (reliefMatch) {
      const enabled = reliefMatch[1] === 'true';
      rl.setRelief(enabled);
      addSimulatorTrace(`L${node.line} relief = ${enabled}`);
      await waitForProgram(80, runId);
      return;
    }

    if (cameraMatch) {
      rl.chaseCam = cameraMatch[1] === 'follow';
      addSimulatorTrace(`L${node.line} camera = ${cameraMatch[1]}`);
      return;
    }

    if (moveMatch) {
      const ref = moveMatch[1].trim();
      if (!/^(?:[\w.-]+\/[\w.-]+|session:[\w.-]+(?::[\w.-]+)?|https?:\/\/\S+\.onnx(?:\?\S*)?)$/i.test(ref)) {
        throw new Error(`第 ${node.line} 行：move 需要 org/repo、session:id 或 .onnx URL。`);
      }
      addSimulatorTrace(`L${node.line} 正在校验并加载 ${ref}`);
      await rl.loadCustomPolicy(ref);
      if (rl.customPolicy?.ref !== ref) throw new Error(`第 ${node.line} 行：动作未能加载；原策略仍保持启用。`);
      addSimulatorTrace(`L${node.line} move = ${rl.customPolicy.name} · ${rl.customPolicy.kind}/${rl.customPolicy.slot}`);
      return;
    }

    const skill = skillMatch?.[1];
    if (skill === 'roll' || command === 'roll()') rl.triggerRoll('academy-program');
    else if (skill === 'kick_left' || legacyKickMatch?.[1] === 'left') rl.triggerKick('left', 'academy-program');
    else if (skill === 'kick_right' || legacyKickMatch?.[1] === 'right') rl.triggerKick('right', 'academy-program');
    else if (skill === 'ground_pick' || command === 'ground_pick()') rl.triggerGroundPick('academy-program');
    else if (skill === 'crouch') {
      if (rl.loco !== 'rollers') throw new Error(`第 ${node.line} 行：crouch 需要先调用 rollers()。`);
      rl.triggerCrouch('academy-program');
    }
    else if (command === 'ball()' || command === 'spawn_ball()') rl.spawnBall();
    else if (command === 'rollers()') await rl.setLoco('rollers');
    else if (command === 'legs()') await rl.setLoco('legs');
    else if (command === 'sit()') {
      if (rl.loco !== 'legs') throw new Error(`第 ${node.line} 行：sit 只支持双腿底盘。`);
      if (!(rl.mode === 'sitstand' && rl.sitFlag === 1)) source.onAction?.('sitToggle');
    }
    else if (command === 'stand()' || command === 'walk()') source.onAction?.('walk');
    else if (command === 'quack()') source.onAction?.('quack');
    else if (command === 'play_move()') {
      if (!rl.customPolicy) throw new Error(`第 ${node.line} 行：请先用 move(ref) 加载社区动作。`);
      if (rl.customPolicy.slot === 'trick') rl.triggerRoll('academy-program');
      else if (rl.customPolicy.slot === 'script') rl.toggleScript();
      else if (rl.customPolicy.slot === 'sitstand') source.onAction?.('sitToggle');
    }
    else if (command === 'official()') rl.clearCustomPolicy();
    else if (command === 'reset()') rl.resetSim();
    else throw new Error(`第 ${node.line} 行不认识：${command}`);
    addSimulatorTrace(`L${node.line} ${command} → mode=${rl.mode}, loco=${rl.loco}`);
    await waitForProgram(80, runId);
  };
  const executeControlNodes = async (nodes: ControlProgramNode[], rl: SimulatorRl, source: AcademyInputSource, runId: number): Promise<void> => {
    for (const node of nodes) {
      if (scriptRunIdRef.current !== runId) throw new Error('__PROGRAM_STOPPED__');
      if (node.type === 'command') {
        await executeControlCommand(node, rl, source, runId);
      } else if (node.type === 'repeat') {
        for (let iteration = 1; iteration <= node.count; iteration += 1) {
          addSimulatorTrace(`L${node.line} repeat ${iteration}/${node.count}`);
          await executeControlNodes(node.children, rl, source, runId);
        }
      } else {
        const actual = rl.buildObs()[node.index];
        const passed = node.operator === '<' ? actual < node.value
          : node.operator === '<=' ? actual <= node.value
          : node.operator === '>' ? actual > node.value : actual >= node.value;
        addSimulatorTrace(`L${node.line} obs[${node.index}]=${actual.toFixed(3)} ${node.operator} ${node.value} → ${passed}`);
        if (passed) await executeControlNodes(node.children, rl, source, runId);
      }
    }
  };
  const runSimulatorScript = async () => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (!rl || !source || simulatorRunning) {
      setSimulatorStatus('官方模拟器还在初始化，等桥接状态显示“已就绪”。');
      return;
    }
    const runId = scriptRunIdRef.current + 1;
    scriptRunIdRef.current = runId;
    setSimulatorRunning(true);
    setSimulatorTrace([]);
    try {
      const program = parseControlProgram(simulatorScript);
      await executeControlNodes(program, rl, source, runId);
      setSimulatorRuns((value) => value + 1);
      addSimulatorTrace(`完成 · mode=${rl.mode}, loco=${rl.loco}`);
      setSimulatorStatus(`控制程序完成 · 模拟器 mode=${rl.mode}`);
    } catch (error) {
      if (error instanceof Error && error.message === '__PROGRAM_STOPPED__') setSimulatorStatus('控制程序已停止，command 已清零');
      else {
        const message = error instanceof Error ? error.message : '控制程序运行失败';
        addSimulatorTrace(`ERROR · ${message}`);
        setSimulatorStatus(message);
      }
    } finally {
      source.active = false;
      source.command.fill(0);
      if (scriptRunIdRef.current === runId) setSimulatorRunning(false);
    }
  };
  const stopSimulatorScript = () => {
    scriptRunIdRef.current += 1;
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (source) { source.active = false; source.command.fill(0); }
    if (rl?.headMode) rl.toggleHeadMode();
    setSimulatorRunning(false);
    addSimulatorTrace('STOP · command = [0, 0, 0]');
    setSimulatorStatus('控制程序已停止，command 已清零');
  };
  const updateRewardConfig = (slot: RewardSlot, config: RewardConfig) => {
    setRewardConfigs((previous) => ({ ...previous, [slot]: sanitizeRewardConfig(config, previous[slot]) }));
    setLevel3Completed((previous) => previous.includes(1) ? previous : [...previous, 1].sort((a, b) => a - b));
  };
  const runRewardRollout = async (slot: RewardSlot) => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (!rl || !source || rewardRunning || simulatorRunning) return;
    const config = sanitizeRewardConfig(rewardConfigs[slot], defaultRewardConfigs[slot]);
    const runId = rewardRunIdRef.current + 1;
    rewardRunIdRef.current = runId;
    setRewardRunning(slot);
    setTelemetryPaused(false);
    setSimulatorStatus(`实验 ${slot} · 正在重置并准备真实 rollout`);

    let sampleCount = 0;
    let weightedReturn = 0;
    let speedSum = 0;
    let trackingErrorSum = 0;
    let effortSum = 0;
    let smoothnessSum = 0;
    let previousAction: number[] | null = null;
    let ended: RolloutResult['terminatedBy'] = 'timeout';
    let startedAt = performance.now();
    let previousAt = startedAt;

    try {
      rl.clearCustomPolicy();
      if (rl.loco !== 'legs') await rl.setLoco('legs');
      rl.resetSim();
      const settleDeadline = performance.now() + 2500;
      while ((rl.inputLocked || rl.respawnActive) && performance.now() < settleDeadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      if (rewardRunIdRef.current !== runId) ended = 'stopped';
      else {
        source.command[0] = config.targetSpeed;
        source.command[1] = 0;
        source.command[2] = 0;
        source.active = true;
        startedAt = performance.now();
        previousAt = startedAt;
        setSimulatorStatus(`实验 ${slot} · command vx=${config.targetSpeed.toFixed(2)} m/s · 正在采样`);
      }

      while (ended !== 'stopped' && performance.now() - startedAt < config.durationMs) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        if (rewardRunIdRef.current !== runId) { ended = 'stopped'; break; }
        const now = performance.now();
        const action = Array.from(rl.lastAction);
        const observation = Array.from(rl.buildObs());
        const sample = {
          velocityX: planarSpeedFromState(rl.data.qvel),
          gravityZ: observation[5],
          height: Number(rl.data.qpos[2]),
          action,
        };
        const breakdown = scoreRewardSample(config, sample, previousAction);
        const dt = Math.min(0.1, Math.max(0, (now - previousAt) / 1000));
        weightedReturn += breakdown.reward * dt;
        speedSum += sample.velocityX;
        trackingErrorSum += Math.abs(sample.velocityX - config.targetSpeed);
        effortSum += breakdown.effort;
        smoothnessSum += breakdown.smoothness;
        sampleCount += 1;
        previousAction = action;
        previousAt = now;
        const reason = terminationReason(config, sample);
        if (reason) { ended = reason; break; }
      }
    } catch {
      ended = 'stopped';
    } finally {
      source.active = false;
      source.command.fill(0);
    }

    const durationSeconds = Math.max(0, (performance.now() - startedAt) / 1000);
    const divisor = Math.max(1, sampleCount);
    const rollout: RolloutResult = {
      slot, config, samples: sampleCount, durationSeconds,
      returnValue: weightedReturn,
      meanSpeed: speedSum / divisor,
      meanTrackingError: trackingErrorSum / divisor,
      meanEffort: effortSum / divisor,
      meanSmoothness: smoothnessSum / divisor,
      terminatedBy: ended,
      capturedAt: Date.now(),
    };
    if (sampleCount > 0) {
      setRewardResults((previous) => ({ ...previous, [slot]: rollout }));
      const hasComparison = Boolean(rewardResults[slot === 'A' ? 'B' : 'A']);
      setLevel3Completed((missions) => hasComparison
        ? [1, 2, 3, 4]
        : Array.from(new Set([...missions, 1, slot === 'A' ? 2 : 3])).sort((a, b) => a - b));
      setSimulatorStatus(`实验 ${slot} 完成 · return=${weightedReturn.toFixed(3)} · ${sampleCount} samples · ${ended}`);
    } else setSimulatorStatus(`实验 ${slot} 未采到有效数据，请重新运行`);
    if (rewardRunIdRef.current === runId) setRewardRunning(null);
  };
  const stopRewardRollout = () => {
    rewardRunIdRef.current += 1;
    const source = ensureAcademySource();
    if (source) { source.active = false; source.command.fill(0); }
    setRewardRunning(null);
    setSimulatorStatus('Reward rollout 已停止，command 已清零');
  };
  const resetRewardLab = () => {
    stopRewardRollout();
    getSimulator()?.resetSim();
    setRewardConfigs({ A: { ...defaultRewardConfigs.A }, B: { ...defaultRewardConfigs.B } });
    setRewardResults({});
    setLevel3Completed([]);
    setSimulatorStatus('Level 3 已重置');
  };
  const exportProfile = () => {
    const profile: SavedProgress = {
      schemaVersion: 5, currentId, completed, solutions, simulatorScript, simulatorRuns, level1Completed,
      rewardConfigs, rewardResults, level3Completed,
      updatedAt: new Date().toISOString(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `microduck-learning-profile-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importProfile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const profile = JSON.parse(await file.text()) as Partial<SavedProgress>;
      setCurrentId(Math.min(lessons.length, Math.max(1, profile.currentId || 1)));
      setCompleted(Array.isArray(profile.completed) ? profile.completed.filter((id) => Number.isInteger(id) && id >= 1 && id <= lessons.length) : []);
      setSolutions((previous) => ({ ...previous, ...profile.solutions }));
      if (typeof profile.simulatorScript === 'string') setSimulatorScript(profile.simulatorScript);
      if (typeof profile.simulatorRuns === 'number') setSimulatorRuns(profile.simulatorRuns);
      if (Array.isArray(profile.level1Completed)) setLevel1Completed(profile.level1Completed.filter((id) => Number.isInteger(id) && id >= 1 && id <= 6));
      if (profile.rewardConfigs) setRewardConfigs({
        A: sanitizeRewardConfig(profile.rewardConfigs.A ?? {}, defaultRewardConfigs.A),
        B: sanitizeRewardConfig(profile.rewardConfigs.B ?? {}, defaultRewardConfigs.B),
      });
      if (profile.rewardResults && typeof profile.rewardResults === 'object') setRewardResults(profile.rewardResults);
      if (Array.isArray(profile.level3Completed)) setLevel3Completed(profile.level3Completed.filter((id) => Number.isInteger(id) && id >= 1 && id <= 4));
    } catch {
      window.alert('这不是有效的 Microduck 学习档案 JSON。');
    }
  };
  const stopService = async () => {
    try { await fetch('/__shutdown', { method: 'POST' }); } catch { /* The server may close before replying. */ }
    setServiceStopped(true);
  };
  const runtimeLabel = useMemo(() => runtime === 'loading' ? '正在准备 Python…' : runtime === 'error' ? 'Python 需要刷新' : 'Python 已就绪', [runtime]);

  if (serviceStopped) {
    return (
      <main className="stopped-screen"><div className="stopped-card">
        <Bird /><p className="eyebrow">MICRODUCK ACADEMY</p><h1>课堂已安全关闭</h1>
        <p>这个标签页可以直接关掉。下次双击“启动 Microduck 课堂”就会回到这里。</p>
      </div></main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="academy-header">
        <button className="brand-mark" onClick={() => setView('course')} aria-label="返回课堂">MD</button>
        <div className="brand-copy"><p className="eyebrow">MICRODUCK ACADEMY</p><h1>强化学习闯关课堂</h1></div>
        <nav className="view-switcher" aria-label="课堂视图">
          <Button variant={view === 'course' ? 'default' : 'ghost'} size="sm" onClick={() => setView('course')}><BookOpen />闯关课堂</Button>
          <Button variant={view === 'simulator' ? 'default' : 'ghost'} size="sm" onClick={() => setView('simulator')}><FlaskConical />3D 实验场</Button>
          <Button variant={view === 'roadmap' ? 'default' : 'ghost'} size="sm" onClick={() => setView('roadmap')}><Map />学习路线</Button>
        </nav>
        <Progress value={progress} className="header-progress">
          <ProgressLabel>已通过</ProgressLabel><ProgressValue>{() => `${completed.length} / ${lessons.length}`}</ProgressValue>
        </Progress>
        <Button variant="outline" size="sm" onClick={stopService} className="stop-button"><Square />停止课堂</Button>
      </header>

      {view === 'roadmap' ? (
        <section className="roadmap-view">
          <div className="roadmap-hero">
            <div><p className="eyebrow">OPEN-SOURCE ROADMAP</p><h2>从 9 关入门，到给真实小鸭子发布一个 Skill</h2>
              <p>课程与工程共用同一条 observation → policy → action 契约。每一层都有能运行、能看到、能测量的产物。</p></div>
            <Button onClick={() => setView('course')}><Play />从 Level 0 继续</Button>
          </div>
          <div className="level-roadmap">
            {learningLevels.map((item) => <article key={item.level}>
              <span>{item.level}</span><h3>{item.title}</h3><b>{item.status}</b><p>{item.detail}</p>
            </article>)}
          </div>
          <div className="roadmap-columns">
            <section className="research-panel">
              <p className="eyebrow">调研结论</p><h3>为什么这个开源项目可行</h3>
              <ul>
                <li>官方已经开放训练、运行时和策略发布契约，我们要补的是“一站式学习与实验 UX”。</li>
                <li>第一版可完全 local-first：Python、MuJoCo 和 ONNX 都在浏览器运行，访客无需账号。</li>
                <li>新的动态动作需要训练新 ONNX policy；动作编排层则可以立刻复用 roll、kick 等已有 skills。</li>
                <li>公开发布前需要解决浏览器 simulator 仓库未声明 LICENSE 的边界，平台代码与上游资产应分离。</li>
              </ul>
            </section>
            <section className="profile-panel">
              <p className="eyebrow">LOCAL-FIRST 学习档案</p><h3>现在免登录，以后可选同步</h3>
              <p>当前保存：Level 0 完成 {completed.length}/9 关、Level 1 完成 {level1Completed.length}/6 个实验、每关代码、动作脚本和 {simulatorRuns} 次编排运行。数据只在这个浏览器中。</p>
              <p><b>隐私：</b>无需登录，不录屏，不上传代码或学习记录。清除浏览器数据前，请先导出 JSON 档案。</p>
              <div className="profile-actions">
                <Button variant="outline" onClick={exportProfile}><Download />导出档案</Button>
                <Button variant="outline" onClick={() => profileInputRef.current?.click()}><Upload />导入档案</Button>
                <input ref={profileInputRef} hidden type="file" accept="application/json" onChange={(event) => { void importProfile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </div>
              <small>未来账号只负责跨设备同步、云训练和社区发布；不开账号仍能完整学习。运行轨迹、observation 历史和录像目前不会持久化。</small>
            </section>
          </div>
          <section className="references-panel">
            <div><p className="eyebrow">PRIMARY SOURCES</p><h3>值得借鉴的开源项目</h3></div>
            <div className="reference-grid">{referenceProjects.map((project) => <a key={project.name} href={project.href} target="_blank" rel="noreferrer">
              <FileCode2 /><span><strong>{project.name}</strong><small>{project.role}</small><p>{project.note}</p></span>
            </a>)}</div>
          </section>
        </section>
      ) : view === 'simulator' ? (
        <section className="simulator-view">
          <div className="simulator-toolbar">
            <div><p className="eyebrow">官方 MICRODUCK 模拟器</p><h2>3D 策略实验场</h2>
              <p>课堂会自动启动官方 MuJoCo 物理与 ONNX 策略；你只需按左侧任务一步步观察。</p></div>
            <Button variant="outline" onClick={() => setView('course')}><BookOpen />回到课程</Button>
          </div>
          <div className="real-training-pipeline" aria-label="从训练到硬件的真实流程">
            <span><b>1</b> 定义 observation、action、reward</span>
            <span><b>2</b> GPU 并行 rollout + PPO 更新</span>
            <span><b>3</b> 导出 policy.onnx</span>
            <span><b>4</b> 浏览器 3D 回放验证</span>
            <span><b>5</b> 安全层 → 真实 Microduck</span>
          </div>
          <div className="simulator-workspace">
            <aside className="action-studio">
              <div className="studio-tabs" role="tablist" aria-label="实验类型">
                <button role="tab" aria-selected={simulatorLabTab === 'observe'} onClick={() => setSimulatorLabTab('observe')}>Level 1 · 观察策略</button>
                <button role="tab" aria-selected={simulatorLabTab === 'compose'} onClick={() => setSimulatorLabTab('compose')}>Level 2 · 控制编程</button>
                <button role="tab" aria-selected={simulatorLabTab === 'reward'} onClick={() => setSimulatorLabTab('reward')}>Level 3 · Reward 实验</button>
              </div>
              {simulatorLabTab === 'observe' ? <SimulatorInspector
                telemetry={telemetry} completed={level1Completed} paused={telemetryPaused} entered={simulatorEntered}
                onTogglePause={() => setTelemetryPaused((value) => !value)} onSnapshot={snapshotTelemetry}
                onDrive={driveFromAcademy} onRoll={() => invokeSimulatorAction('roll')} onReset={resetLevelOneExperiment} onReplay={replayLevelOne}
              /> : simulatorLabTab === 'compose' ? <ControlStudio
                entered={simulatorEntered} running={simulatorRunning} status={simulatorStatus}
                script={simulatorScript} trace={simulatorTrace} onScriptChange={setSimulatorScript}
                onRun={() => void runSimulatorScript()} onStop={stopSimulatorScript} onQuick={invokeSimulatorAction}
              /> : <RewardLabStudio
                entered={simulatorEntered} configs={rewardConfigs} results={rewardResults}
                running={rewardRunning} completed={level3Completed} onConfigChange={updateRewardConfig}
                onRun={(slot) => void runRewardRollout(slot)} onStop={stopRewardRollout} onReset={resetRewardLab}
              />}
            </aside>
            <div className="simulator-frame-wrap"><iframe ref={simulatorFrameRef} src="/microduck-simulator/?boot=1" title="Microduck 官方 3D 模拟器" allow="autoplay; fullscreen" /></div>
          </div>
          <p className="truth-note"><strong>三个层次：</strong>Level 2 编写实时控制程序；Level 3 用真实 rollout 设计和检验 reward；Level 4 才运行 PPO 来更新神经网络权重。只有训练并导出新的 ONNX，鸭子的动作策略才真正改变。</p>
        </section>
      ) : (
        <div className="academy-shell">
          <aside className="lesson-map" aria-label="课程关卡">
            <p className="eyebrow">关卡地图</p>
            <ol>{lessons.map((item) => {
              const isActive = item.id === currentId;
              const isDone = completed.includes(item.id);
              const isLocked = item.id > unlocked;
              return <li key={item.id} className={isActive ? 'active' : isLocked ? 'locked' : ''}>
                <button disabled={isLocked} onClick={() => selectLesson(item.id)}>
                  <span className="lesson-node">{isDone ? <CheckCircle2 /> : isLocked ? <Lock /> : isActive ? <Bird /> : <Circle />}</span>
                  <span><small>第 {item.id} 关</small>{item.shortTitle}</span>
                </button>
              </li>;
            })}</ol>
            <Button variant="outline" className="map-simulator-button" onClick={() => setView('simulator')}><FlaskConical />打开 3D 实验场</Button>
            <Button variant="ghost" size="sm" className="reset-course-button" onClick={resetCourse}><RotateCcw />从第 1 关重新学习</Button>
          </aside>

          <section className="lesson-brief">
            <div><p className="eyebrow">第 {lesson.id} 关 · {lesson.shortTitle.split('：')[0]}</p><h2>{lesson.title}</h2></div>
            <p className="mission">{lesson.mission}</p>
            <div className="concept-flow" aria-label="本关概念流程">
              {lesson.concept.map((concept, index) => <span key={concept}>{concept}{index < lesson.concept.length - 1 && <b>→</b>}</span>)}
            </div>
            <div className="system-role-card">
              <div><span>这段代码在系统里的角色</span><strong>{rlContext.role}</strong></div>
              <p>{rlContext.realUse}</p>
              <small>Agent 工程类比：{rlContext.analogy}</small>
            </div>
            <div className="teacher-note"><strong>这一关验证什么</strong><p>{lesson.teacher}</p></div>
            {hintOpen && <output className="hint-box">{lesson.hint.map((line) => <code key={line}>{line.replaceAll(' ', '\u00a0')}</code>)}</output>}
            <Button variant="outline" onClick={() => setHintOpen((value) => !value)}>{hintOpen ? '收起提示' : '给我提示'}</Button>
            <MiniLab lesson={lesson} result={result} running={running} />
          </section>

          <section className="coding-desk">
            <div className="desk-heading">
              <div><p className="eyebrow">你的代码</p><h2>{lesson.filename}</h2></div>
              <span className={`runtime-state ${runtime}`}>{runtime === 'loading' && <Loader2 className="spin" />}{runtimeLabel}</span>
            </div>
            <Textarea aria-label={`第 ${lesson.id} 关 Python 代码`} className="code-editor" spellCheck={false} value={code}
              onChange={(event) => { setSolutions((previous) => ({ ...previous, [currentId]: event.target.value })); setResult(null); }} />
            <div className="code-actions">
              <Button onClick={runCode} size="lg" disabled={runtime !== 'ready' || running}>
                {running ? <Loader2 className="spin" /> : <Play />}{running ? '正在运行' : '运行代码'}
              </Button>
              <Button variant="ghost" onClick={resetLesson}><RotateCcw />恢复初始代码</Button>
            </div>
            <div className={`result-console ${result?.passed ? 'passed' : result ? 'failed' : ''}`} aria-live="polite">
              <div className="console-title"><span>真正的 Python 自动判题</span>{result?.passed && <span><Check />过关</span>}</div>
              {!result ? <p>{running ? '正在浏览器中执行你的 Python…' : '代码会在你的电脑浏览器中运行，结果直接显示在这里。'}</p>
                : result.error ? <div className="error-output"><XCircle /><pre>{result.error}</pre></div>
                : <div className="test-list">
                  {result.results.map((test) => <div className="test-row" key={test.label}>
                    {test.passed ? <CheckCircle2 /> : <XCircle />}
                    <span><strong>{test.label}</strong><small>得到 {test.actual} · 应为 {test.expected}</small></span>
                  </div>)}
                  {result.stdout && <pre className="stdout">{result.stdout}</pre>}
                  {result.passed ? <div className="pass-actions">
                    <strong>{currentId === lessons.length ? '全部基础关卡完成！去 3D 实验场看真正的 Microduck。' : '三组测试全部通过。下一关已解锁。'}</strong>
                    <Button onClick={nextLesson}>{currentId === lessons.length ? <Trophy /> : <ChevronRight />}{currentId === lessons.length ? '进入 3D 实验场' : '进入下一关'}</Button>
                  </div> : <strong className="try-again">还有测试没通过。对照“得到”和“应为”，或者点左侧提示。</strong>}
                </div>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
