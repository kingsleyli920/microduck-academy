'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bird, BookOpen, Check, CheckCircle2, ChevronRight, Circle, Download, FileCode2,
  FlaskConical, Languages, Loader2, Lock, Map, Play, RotateCcw, Square, Trophy, Upload, XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { getLessons, lessons as lessonsZh, type Lesson } from './lessons';
import { learningLevels, localeNames, referenceProjects, rlContexts, uiCopy, type Locale } from './i18n';
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
  schemaVersion: 6;
  locale: Locale;
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

const DEFAULT_SIMULATOR_SCRIPTS: Record<Locale, string> = {
  'zh-CN': DEFAULT_SIMULATOR_SCRIPT,
  en: `# Continuous commands are sent to the walk policy at 50 Hz
drive(0.18, 0.0, 1200)
turn(0.7, 650)

# Read the live observation before choosing the next action
print(obs[5])
if obs[5] < -0.85 {
  look(0.35, -0.15, 0.45, 0.0, 800)
  skill("roll")
}

wait(2200)
reset()`,
};

function MiniLab({ lesson, result, running, locale }: { lesson: Lesson; result: RunResult | null; running: boolean; locale: Locale }) {
  const text = uiCopy[locale];
  const successful = Boolean(result?.passed);
  const lastActual = result?.results.at(-1)?.actual ?? '—';
  return (
    <section className={`mini-lab lesson-${lesson.id} ${successful ? 'is-successful' : ''}`} aria-label={text.miniLabLabel}>
      <div className="lab-title-row">
        <div><p className="eyebrow">{text.liveResult}</p><h3>{lesson.labTitle}</h3></div>
        <span className="lab-badge">{text.testCases}</span>
      </div>
      <div className="duck-stage" aria-hidden="true">
        <div className="target-flag">{text.target}</div>
        <div className={`duck-runner ${running ? 'is-running' : ''} ${successful ? 'did-pass' : ''}`}><Bird /></div>
        <div className="track-line" />
      </div>
      <div className="lab-readout">
        <span>{text.lastOutput}</span><strong>{lastActual}</strong>
        <span>{text.status}</span><strong>{running ? text.calculating : successful ? text.matchesTarget : result ? text.needsChange : text.waiting}</strong>
      </div>
      <div className="trial-strip" aria-label={text.miniLabLabel}>
        {lesson.tests.map((test, index) => {
          const testResult = result?.results[index];
          return <div key={test.label} className={testResult?.passed ? 'trial-pass' : ''}>
            <span>{test.label}</span>
            <strong>{testResult ? testResult.actual : text.notRun}</strong>
          </div>;
        })}
      </div>
      <p>{lesson.labNote}</p>
    </section>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const [view, setView] = useState<'course' | 'simulator' | 'roadmap'>('course');
  const [currentId, setCurrentId] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [solutions, setSolutions] = useState<Record<number, string>>(() =>
    Object.fromEntries(lessonsZh.map((item) => [item.id, item.starter])),
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

  const lessons = getLessons(locale);
  const text = uiCopy[locale];
  const localeLevels = learningLevels[locale];
  const localeReferences = referenceProjects[locale];
  const lesson = lessons[currentId - 1];
  const rlContext = rlContexts[locale][currentId as keyof typeof rlContexts[typeof locale]];
  const code = solutions[currentId] ?? lesson.starter;
  const unlocked = Math.min(lessons.length, Math.max(1, ...completed.map((id) => id + 1)));
  const progress = (completed.length / lessons.length) * 100;
  const phrase = useCallback((zh: string, en: string) => locale === 'en' ? en : zh, [locale]);

  const changeLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    const currentLessons = getLessons(locale);
    const nextLessons = getLessons(nextLocale);
    setSolutions((previous) => Object.fromEntries(nextLessons.map((nextLesson, index) => {
      const currentStarter = currentLessons[index].starter;
      const currentValue = previous[nextLesson.id] ?? currentStarter;
      return [nextLesson.id, currentValue === currentStarter ? nextLesson.starter : currentValue];
    })));
    setSimulatorScript((current) => current === DEFAULT_SIMULATOR_SCRIPTS[locale] ? DEFAULT_SIMULATOR_SCRIPTS[nextLocale] : current);
    setLocale(nextLocale);
    setResult(null);
    setSimulatorStatus(nextLocale === 'en' ? 'Waiting for the official simulator…' : '正在等待官方模拟器加载…');
  };

  // This one-time hydration intentionally restores browser-only local progress.
  // oxlint-disable-next-line react/react-compiler
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedProgress>;
        if (parsed.locale === 'zh-CN' || parsed.locale === 'en') setLocale(parsed.locale);
        setCurrentId(Math.min(lessonsZh.length, Math.max(1, parsed.currentId || 1)));
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
      schemaVersion: 6, locale, currentId, completed, solutions, simulatorScript, simulatorRuns, level1Completed,
      rewardConfigs, rewardResults, level3Completed,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [completed, currentId, hydrated, level1Completed, level3Completed, locale, rewardConfigs, rewardResults, simulatorRuns, simulatorScript, solutions]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = text.appTitle;
  }, [locale, text.appTitle]);

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
          setSimulatorStatus(!entered ? phrase('正在加载官方 MuJoCo 与 ONNX 策略', 'Loading official MuJoCo and ONNX policies') : rl.mode === 'walk'
            ? phrase(`桥接已就绪 · 当前 ${rl.loco === 'legs' ? '双腿' : '轮滑'} / ${rl.mode}`, `Bridge ready · ${rl.loco} / ${rl.mode}`)
            : phrase(`桥接已就绪 · 当前动作 ${rl.mode}`, `Bridge ready · active policy ${rl.mode}`));
        }
      } catch {
        setSimulatorReady(false);
      }
    };
    inspectSimulator();
    const poll = window.setInterval(inspectSimulator, 500);
    return () => window.clearInterval(poll);
  }, [phrase, simulatorRunning, telemetryPaused, view]);

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
      setSimulatorStatus(phrase('已通过快捷键 B 调用 roll policy', 'Triggered the roll policy with keyboard shortcut B'));
    };
    window.addEventListener('keydown', runHotkey);
    const frameWindow = simulatorFrameRef.current?.contentWindow;
    frameWindow?.addEventListener('keydown', runHotkey);
    return () => {
      window.removeEventListener('keydown', runHotkey);
      frameWindow?.removeEventListener('keydown', runHotkey);
    };
  }, [phrase, simulatorEntered, simulatorReady, view]);

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
      setResult({ results: [], passed: false, stdout: '', error: text.timeout });
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
    setSimulatorStatus(phrase('已冻结一帧 61D observation', 'Captured one 61D observation frame'));
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
    setSimulatorStatus(phrase('Academy 控制源正在发送 vx=0.20 m/s', 'Academy input is sending vx=0.20 m/s'));
    if (driveTimerRef.current) window.clearTimeout(driveTimerRef.current);
    driveTimerRef.current = window.setTimeout(() => {
      source.active = false;
      source.command.fill(0);
      setSimulatorStatus(phrase('速度命令结束，policy 已恢复站立目标', 'Speed command ended; the policy returned to its standing target'));
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
    setSimulatorStatus(phrase('物理环境已重置，控制权已交还 walk policy', 'Physics reset; control returned to the walk policy'));
  };
  const replayLevelOne = () => {
    const rl = getSimulator();
    const source = ensureAcademySource();
    if (source) { source.active = false; source.command.fill(0); }
    rl?.resetSim();
    setLevel1Completed([]);
    setTelemetryPaused(false);
    setSimulatorStatus(phrase('Level 1 已重置', 'Level 1 reset'));
  };
  const invokeSimulatorAction = (action: 'roll' | 'kick-left' | 'kick-right' | 'ground-pick' | 'ball' | 'reset') => {
    const rl = getSimulator();
    if (!rl) {
      setSimulatorStatus(phrase('官方模拟器仍在初始化。', 'The official simulator is still initializing.'));
      return;
    }
    if (action === 'roll') rl.triggerRoll('academy-button');
    if (action === 'kick-left') rl.triggerKick('left', 'academy-button');
    if (action === 'kick-right') rl.triggerKick('right', 'academy-button');
    if (action === 'ground-pick') rl.triggerGroundPick('academy-button');
    if (action === 'ball') rl.spawnBall();
    if (action === 'reset') rl.resetSim();
    setSimulatorStatus(phrase(`已发送 ${action} · 模拟器 mode=${rl.mode}`, `Sent ${action} · simulator mode=${rl.mode}`));
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
    setSimulatorStatus(phrase(`第 ${node.line} 行 · ${command}`, `Line ${node.line} · ${command}`));

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
        ? parseNumberArguments(driveMatch[1], node.line, 3, locale)
        : [0, ...parseNumberArguments(turnMatch?.[1] ?? '', node.line, 2, locale)];
      const vx = Math.min(rl.loco === 'rollers' ? 0.6 : 0.25, Math.max(rl.loco === 'rollers' ? -0.5 : -0.2, vxRaw));
      const yaw = Math.min(rl.loco === 'rollers' ? 0.3 : 1, Math.max(rl.loco === 'rollers' ? -0.3 : -1, yawRaw));
      source.command[0] = vx; source.command[1] = 0; source.command[2] = yaw; source.active = true;
      addSimulatorTrace(`L${node.line} command = [${vx.toFixed(2)}, 0.00, ${yaw.toFixed(2)}] · ${milliseconds} ms`);
      try { await waitForProgram(milliseconds, runId); }
      finally { source.active = false; source.command.fill(0); }
      return;
    }

    if (lookMatch) {
      const [neck, pitch, yaw, roll, milliseconds] = parseNumberArguments(lookMatch[1], node.line, 5, locale);
      if (!rl.headMode) rl.toggleHeadMode();
      [neck, pitch, yaw, roll].forEach((value, index) => { rl.headTarget[index] = Math.min(2.5, Math.max(-2.5, value)); });
      addSimulatorTrace(`L${node.line} head target = [${[neck, pitch, yaw, roll].map((value) => value.toFixed(2)).join(', ')}]`);
      await waitForProgram(milliseconds, runId);
      if (rl.headMode) rl.toggleHeadMode();
      return;
    }

    if (waitMatch) {
      const [milliseconds] = parseNumberArguments(waitMatch[1], node.line, 1, locale);
      addSimulatorTrace(`L${node.line} wait ${milliseconds} ms`);
      await waitForProgram(milliseconds, runId);
      return;
    }

    if (printMatch) {
      const index = Number(printMatch[1]);
      if (index > 60) throw new Error(phrase(`第 ${node.line} 行：observation 下标必须在 0–60。`, `Line ${node.line}: observation index must be between 0 and 60.`));
      addSimulatorTrace(`L${node.line} obs[${index}] = ${rl.buildObs()[index].toFixed(4)}`);
      return;
    }

    if (pushMatch) {
      const values = parseNumberArguments(pushMatch[1], node.line, 6, locale);
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
        throw new Error(phrase(`第 ${node.line} 行：move 需要 org/repo、session:id 或 .onnx URL。`, `Line ${node.line}: move expects org/repo, session:id, or an .onnx URL.`));
      }
      addSimulatorTrace(phrase(`L${node.line} 正在校验并加载 ${ref}`, `L${node.line} validating and loading ${ref}`));
      await rl.loadCustomPolicy(ref);
      if (rl.customPolicy?.ref !== ref) throw new Error(phrase(`第 ${node.line} 行：动作未能加载；原策略仍保持启用。`, `Line ${node.line}: the motion failed to load; the previous policy remains active.`));
      addSimulatorTrace(`L${node.line} move = ${rl.customPolicy.name} · ${rl.customPolicy.kind}/${rl.customPolicy.slot}`);
      return;
    }

    const skill = skillMatch?.[1];
    if (skill === 'roll' || command === 'roll()') rl.triggerRoll('academy-program');
    else if (skill === 'kick_left' || legacyKickMatch?.[1] === 'left') rl.triggerKick('left', 'academy-program');
    else if (skill === 'kick_right' || legacyKickMatch?.[1] === 'right') rl.triggerKick('right', 'academy-program');
    else if (skill === 'ground_pick' || command === 'ground_pick()') rl.triggerGroundPick('academy-program');
    else if (skill === 'crouch') {
      if (rl.loco !== 'rollers') throw new Error(phrase(`第 ${node.line} 行：crouch 需要先调用 rollers()。`, `Line ${node.line}: call rollers() before crouch.`));
      rl.triggerCrouch('academy-program');
    }
    else if (command === 'ball()' || command === 'spawn_ball()') rl.spawnBall();
    else if (command === 'rollers()') await rl.setLoco('rollers');
    else if (command === 'legs()') await rl.setLoco('legs');
    else if (command === 'sit()') {
      if (rl.loco !== 'legs') throw new Error(phrase(`第 ${node.line} 行：sit 只支持双腿底盘。`, `Line ${node.line}: sit is available only with the leg base.`));
      if (!(rl.mode === 'sitstand' && rl.sitFlag === 1)) source.onAction?.('sitToggle');
    }
    else if (command === 'stand()' || command === 'walk()') source.onAction?.('walk');
    else if (command === 'quack()') source.onAction?.('quack');
    else if (command === 'play_move()') {
      if (!rl.customPolicy) throw new Error(phrase(`第 ${node.line} 行：请先用 move(ref) 加载社区动作。`, `Line ${node.line}: load a community motion with move(ref) first.`));
      if (rl.customPolicy.slot === 'trick') rl.triggerRoll('academy-program');
      else if (rl.customPolicy.slot === 'script') rl.toggleScript();
      else if (rl.customPolicy.slot === 'sitstand') source.onAction?.('sitToggle');
    }
    else if (command === 'official()') rl.clearCustomPolicy();
    else if (command === 'reset()') rl.resetSim();
    else throw new Error(phrase(`第 ${node.line} 行无法识别：${command}`, `Line ${node.line}: unknown command: ${command}`));
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
      setSimulatorStatus(phrase('官方模拟器仍在初始化，请等待桥接就绪。', 'The official simulator is still initializing. Wait for the bridge to become ready.'));
      return;
    }
    const runId = scriptRunIdRef.current + 1;
    scriptRunIdRef.current = runId;
    setSimulatorRunning(true);
    setSimulatorTrace([]);
    try {
      const program = parseControlProgram(simulatorScript, locale);
      await executeControlNodes(program, rl, source, runId);
      setSimulatorRuns((value) => value + 1);
      addSimulatorTrace(phrase(`完成 · mode=${rl.mode}, loco=${rl.loco}`, `Complete · mode=${rl.mode}, loco=${rl.loco}`));
      setSimulatorStatus(phrase(`控制程序完成 · 模拟器 mode=${rl.mode}`, `Control program complete · simulator mode=${rl.mode}`));
    } catch (error) {
      if (error instanceof Error && error.message === '__PROGRAM_STOPPED__') setSimulatorStatus(phrase('控制程序已停止，command 已清零', 'Control program stopped; command cleared'));
      else {
        const message = error instanceof Error ? error.message : phrase('控制程序运行失败', 'Control program failed');
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
    setSimulatorStatus(phrase('控制程序已停止，command 已清零', 'Control program stopped; command cleared'));
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
    setSimulatorStatus(phrase(`实验 ${slot} · 正在重置并准备 rollout`, `Experiment ${slot} · resetting before rollout`));

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
        setSimulatorStatus(phrase(`实验 ${slot} · command vx=${config.targetSpeed.toFixed(2)} m/s · 正在采样`, `Experiment ${slot} · command vx=${config.targetSpeed.toFixed(2)} m/s · sampling`));
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
      setSimulatorStatus(phrase(`实验 ${slot} 完成 · return=${weightedReturn.toFixed(3)} · ${sampleCount} samples · ${ended}`, `Experiment ${slot} complete · return=${weightedReturn.toFixed(3)} · ${sampleCount} samples · ${ended}`));
    } else setSimulatorStatus(phrase(`实验 ${slot} 未采集到有效数据，请重新运行`, `Experiment ${slot} collected no valid samples; run it again`));
    if (rewardRunIdRef.current === runId) setRewardRunning(null);
  };
  const stopRewardRollout = () => {
    rewardRunIdRef.current += 1;
    const source = ensureAcademySource();
    if (source) { source.active = false; source.command.fill(0); }
    setRewardRunning(null);
    setSimulatorStatus(phrase('Reward rollout 已停止，command 已清零', 'Reward rollout stopped; command cleared'));
  };
  const resetRewardLab = () => {
    stopRewardRollout();
    getSimulator()?.resetSim();
    setRewardConfigs({ A: { ...defaultRewardConfigs.A }, B: { ...defaultRewardConfigs.B } });
    setRewardResults({});
    setLevel3Completed([]);
    setSimulatorStatus(phrase('Level 3 已重置', 'Level 3 reset'));
  };
  const exportProfile = () => {
    const profile: SavedProgress = {
      schemaVersion: 6, locale, currentId, completed, solutions, simulatorScript, simulatorRuns, level1Completed,
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
      if (profile.locale === 'zh-CN' || profile.locale === 'en') setLocale(profile.locale);
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
      window.alert(text.invalidProfile);
    }
  };
  const stopService = async () => {
    try { await fetch('/__shutdown', { method: 'POST' }); } catch { /* The server may close before replying. */ }
    setServiceStopped(true);
  };
  const runtimeLabel = useMemo(() => runtime === 'loading' ? text.pythonLoading : runtime === 'error' ? text.pythonError : text.pythonReady, [runtime, text]);

  if (serviceStopped) {
    return (
      <main className="stopped-screen"><div className="stopped-card">
        <Bird /><p className="eyebrow">MICRODUCK ACADEMY</p><h1>{text.stoppedTitle}</h1>
        <p>{text.stoppedNote}</p>
      </div></main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="academy-header">
        <button className="brand-mark" onClick={() => setView('course')} aria-label={text.backToCourse}>MD</button>
        <div className="brand-copy"><p className="eyebrow">MICRODUCK ACADEMY</p><h1>{text.appTitle}</h1></div>
        <nav className="view-switcher" aria-label={text.viewsLabel}>
          <Button variant={view === 'course' ? 'default' : 'ghost'} size="sm" onClick={() => setView('course')}><BookOpen />{text.course}</Button>
          <Button variant={view === 'simulator' ? 'default' : 'ghost'} size="sm" onClick={() => setView('simulator')}><FlaskConical />{text.simulator}</Button>
          <Button variant={view === 'roadmap' ? 'default' : 'ghost'} size="sm" onClick={() => setView('roadmap')}><Map />{text.roadmap}</Button>
        </nav>
        <div className="language-switcher" aria-label="Language / 语言"><Languages />
          {(Object.keys(localeNames) as Locale[]).map((item) => <button key={item} className={locale === item ? 'active' : ''} onClick={() => changeLocale(item)}>{localeNames[item]}</button>)}
        </div>
        <Progress value={progress} className="header-progress">
          <ProgressLabel>{text.passed}</ProgressLabel><ProgressValue>{() => `${completed.length} / ${lessons.length}`}</ProgressValue>
        </Progress>
        <Button variant="outline" size="sm" onClick={stopService} className="stop-button"><Square />{text.stopService}</Button>
      </header>

      {view === 'roadmap' ? (
        <section className="roadmap-view">
          <div className="roadmap-hero">
            <div><p className="eyebrow">OPEN-SOURCE ROADMAP</p><h2>{text.roadmapTitle}</h2>
              <p>{text.roadmapIntro}</p></div>
            <Button onClick={() => setView('course')}><Play />{text.continueLevel0}</Button>
          </div>
          <div className="level-roadmap">
            {localeLevels.map((item) => <article key={item.level}>
              <span>{item.level}</span><h3>{item.title}</h3><b>{item.status}</b><p>{item.detail}</p>
            </article>)}
          </div>
          <div className="roadmap-columns">
            <section className="research-panel">
              <p className="eyebrow">{text.researchLabel}</p><h3>{text.researchTitle}</h3>
              <ul>{text.researchItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section className="profile-panel">
              <p className="eyebrow">{text.localProfile}</p><h3>{text.profileTitle}</h3>
              <p>{text.profileSummary(completed.length, level1Completed.length, simulatorRuns)}</p>
              <p><b>{text.privacy}</b>{text.privacyNote}</p>
              <div className="profile-actions">
                <Button variant="outline" onClick={exportProfile}><Download />{text.exportProfile}</Button>
                <Button variant="outline" onClick={() => profileInputRef.current?.click()}><Upload />{text.importProfile}</Button>
                <input ref={profileInputRef} hidden type="file" accept="application/json" onChange={(event) => { void importProfile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </div>
              <small>{text.futureAccount}</small>
            </section>
          </div>
          <section className="references-panel">
            <div><p className="eyebrow">{text.sources}</p><h3>{text.sourcesTitle}</h3></div>
            <div className="reference-grid">{localeReferences.map((project) => <a key={project.name} href={project.href} target="_blank" rel="noreferrer">
              <FileCode2 /><span><strong>{project.name}</strong><small>{project.role}</small><p>{project.note}</p></span>
            </a>)}</div>
          </section>
        </section>
      ) : view === 'simulator' ? (
        <section className="simulator-view">
          <div className="simulator-toolbar">
            <div><p className="eyebrow">{text.officialSimulator}</p><h2>{text.simulatorTitle}</h2>
              <p>{text.simulatorIntro}</p></div>
            <Button variant="outline" onClick={() => setView('course')}><BookOpen />{text.backToLessons}</Button>
          </div>
          <div className="real-training-pipeline" aria-label={text.pipelineLabel}>
            {text.pipeline.map((item, index) => <span key={item}><b>{index + 1}</b> {item}</span>)}
          </div>
          <div className="simulator-workspace">
            <aside className="action-studio">
              <div className="studio-tabs" role="tablist" aria-label={text.experimentTypes}>
                <button role="tab" aria-selected={simulatorLabTab === 'observe'} onClick={() => setSimulatorLabTab('observe')}>{text.observePolicy}</button>
                <button role="tab" aria-selected={simulatorLabTab === 'compose'} onClick={() => setSimulatorLabTab('compose')}>{text.controlProgramming}</button>
                <button role="tab" aria-selected={simulatorLabTab === 'reward'} onClick={() => setSimulatorLabTab('reward')}>{text.rewardExperiment}</button>
              </div>
              {simulatorLabTab === 'observe' ? <SimulatorInspector
                telemetry={telemetry} completed={level1Completed} paused={telemetryPaused} entered={simulatorEntered}
                onTogglePause={() => setTelemetryPaused((value) => !value)} onSnapshot={snapshotTelemetry}
                onDrive={driveFromAcademy} onRoll={() => invokeSimulatorAction('roll')} onReset={resetLevelOneExperiment} onReplay={replayLevelOne} locale={locale}
              /> : simulatorLabTab === 'compose' ? <ControlStudio
                entered={simulatorEntered} running={simulatorRunning} status={simulatorStatus}
                script={simulatorScript} trace={simulatorTrace} onScriptChange={setSimulatorScript}
                onRun={() => void runSimulatorScript()} onStop={stopSimulatorScript} onQuick={invokeSimulatorAction} locale={locale}
              /> : <RewardLabStudio
                entered={simulatorEntered} configs={rewardConfigs} results={rewardResults}
                running={rewardRunning} completed={level3Completed} onConfigChange={updateRewardConfig}
                onRun={(slot) => void runRewardRollout(slot)} onStop={stopRewardRollout} onReset={resetRewardLab} locale={locale}
              />}
            </aside>
            <div className="simulator-frame-wrap"><iframe ref={simulatorFrameRef} src="/microduck-simulator/?boot=1" title={text.simulatorFrameTitle} allow="autoplay; fullscreen" /></div>
          </div>
          <p className="truth-note"><strong>{text.levelBoundary}</strong>{text.levelBoundaryNote}</p>
        </section>
      ) : (
        <div className="academy-shell">
          <aside className="lesson-map" aria-label={text.courseMap}>
            <p className="eyebrow">{text.courseMap}</p>
            <ol>{lessons.map((item) => {
              const isActive = item.id === currentId;
              const isDone = completed.includes(item.id);
              const isLocked = item.id > unlocked;
              return <li key={item.id} className={isActive ? 'active' : isLocked ? 'locked' : ''}>
                <button disabled={isLocked} onClick={() => selectLesson(item.id)}>
                  <span className="lesson-node">{isDone ? <CheckCircle2 /> : isLocked ? <Lock /> : isActive ? <Bird /> : <Circle />}</span>
                  <span><small>{text.lesson}{item.id}{text.lessonSuffix}</small>{item.shortTitle}</span>
                </button>
              </li>;
            })}</ol>
            <Button variant="outline" className="map-simulator-button" onClick={() => setView('simulator')}><FlaskConical />{text.openSimulator}</Button>
            <Button variant="ghost" size="sm" className="reset-course-button" onClick={resetCourse}><RotateCcw />{text.resetCourse}</Button>
          </aside>

          <section className="lesson-brief">
            <div><p className="eyebrow">{text.lesson}{lesson.id}{text.lessonSuffix} · {lesson.shortTitle}</p><h2>{lesson.title}</h2></div>
            <p className="mission">{lesson.mission}</p>
            <div className="concept-flow" aria-label={text.objective}>
              {lesson.concept.map((concept, index) => <span key={concept}>{concept}{index < lesson.concept.length - 1 && <b>→</b>}</span>)}
            </div>
            <div className="system-role-card">
              <div><span>{text.codeRole}</span><strong>{rlContext.role}</strong></div>
              <p>{rlContext.realUse}</p>
              <small>{text.agentAnalogy}{rlContext.analogy}</small>
            </div>
            <div className="teacher-note"><strong>{text.objective}</strong><p>{lesson.teacher}</p></div>
            {hintOpen && <output className="hint-box">{lesson.hint.map((line) => <code key={line}>{line.replaceAll(' ', '\u00a0')}</code>)}</output>}
            <Button variant="outline" onClick={() => setHintOpen((value) => !value)}>{hintOpen ? text.hideHint : text.showHint}</Button>
            <MiniLab lesson={lesson} result={result} running={running} locale={locale} />
          </section>

          <section className="coding-desk">
            <div className="desk-heading">
              <div><p className="eyebrow">{text.yourCode}</p><h2>{lesson.filename}</h2></div>
              <span className={`runtime-state ${runtime}`}>{runtime === 'loading' && <Loader2 className="spin" />}{runtimeLabel}</span>
            </div>
            <Textarea aria-label={`${text.lesson}${lesson.id}${text.lessonSuffix} Python`} className="code-editor" spellCheck={false} value={code}
              onChange={(event) => { setSolutions((previous) => ({ ...previous, [currentId]: event.target.value })); setResult(null); }} />
            <div className="code-actions">
              <Button onClick={runCode} size="lg" disabled={runtime !== 'ready' || running}>
                {running ? <Loader2 className="spin" /> : <Play />}{running ? text.runningCode : text.runCode}
              </Button>
              <Button variant="ghost" onClick={resetLesson}><RotateCcw />{text.resetCode}</Button>
            </div>
            <div className={`result-console ${result?.passed ? 'passed' : result ? 'failed' : ''}`} aria-live="polite">
              <div className="console-title"><span>{text.pythonGrader}</span>{result?.passed && <span><Check />{text.pass}</span>}</div>
              {!result ? <p>{running ? text.executingPython : text.pythonLocalNote}</p>
                : result.error ? <div className="error-output"><XCircle /><pre>{result.error}</pre></div>
                : <div className="test-list">
                  {result.results.map((test) => <div className="test-row" key={test.label}>
                    {test.passed ? <CheckCircle2 /> : <XCircle />}
                    <span><strong>{test.label}</strong><small>{text.actualExpected(test.actual, test.expected)}</small></span>
                  </div>)}
                  {result.stdout && <pre className="stdout">{result.stdout}</pre>}
                  {result.passed ? <div className="pass-actions">
                    <strong>{currentId === lessons.length ? text.allLessonsDone : text.testsPassed}</strong>
                    <Button onClick={nextLesson}>{currentId === lessons.length ? <Trophy /> : <ChevronRight />}{currentId === lessons.length ? text.enterSimulator : text.nextLesson}</Button>
                  </div> : <strong className="try-again">{text.testsRemain}</strong>}
                </div>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
