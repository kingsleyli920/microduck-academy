'use client';

import { CheckCircle2, Circle, Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Locale } from './i18n';

export type SimulatorTelemetry = {
  observation: number[];
  action: number[];
  command: number[];
  mode: string;
  loco: 'legs' | 'rollers';
  capturedAt: number;
};

type InspectorProps = {
  telemetry: SimulatorTelemetry | null;
  completed: number[];
  paused: boolean;
  entered: boolean;
  onTogglePause: () => void;
  onSnapshot: () => void;
  onDrive: () => void;
  onRoll: () => void;
  onReset: () => void;
  onReplay: () => void;
  locale: Locale;
};

const content = {
  'zh-CN': {
    groups: [
      ['角速度', 'gyro'], ['投影重力', 'gravity'], ['关节位置', 'joint position'],
      ['关节速度', 'joint velocity'], ['上一动作', 'last action'], ['目标指令', 'command'],
    ],
    missions: [
      ['进入 50 Hz 控制循环', '官方策略就绪后自动完成'],
      ['截取一帧 61D observation', '点击“截取当前帧”'],
      ['发送 0.20 m/s 速度指令', '观察 command[0] 的变化'],
      ['观察 14D action 响应', '检测 policy 输出变化'],
      ['切换到 roll policy', '确认 mode 变为 roll'],
      ['重置并恢复 walk policy', '完成一次控制闭环'],
    ],
    title: '61D → 14D 实时监视器', continue: '继续', pause: '暂停', interface: '策略接口', waiting: '等待',
    groupsLabel: '61 维 observation 分组', offsets: '14 个关节位置偏移量', experiments: 'Level 1 实验',
    loading: '正在加载官方 MuJoCo 环境和 ONNX 策略，首次加载可能需要一些时间。', snapshot: '截取当前帧',
    drive: '发送前进指令', actionWait: '等待 policy 输出新的 action…', roll: '切换到 roll policy',
    reset: '重置并恢复 walk', complete: 'Level 1 已完成，进度已保存在本机。', replay: '重新运行 Level 1',
  },
  en: {
    groups: [
      ['Angular velocity', 'gyro'], ['Projected gravity', 'gravity'], ['Joint position', 'joint position'],
      ['Joint velocity', 'joint velocity'], ['Previous action', 'last action'], ['Target command', 'command'],
    ],
    missions: [
      ['Enter the 50 Hz control loop', 'Completes when the official policy is ready'],
      ['Capture one 61D observation', 'Select “Capture current frame”'],
      ['Send a 0.20 m/s speed command', 'Observe command[0] change'],
      ['Inspect the 14D action response', 'Detect a change in policy output'],
      ['Switch to the roll policy', 'Confirm that mode changes to roll'],
      ['Reset and restore the walk policy', 'Complete one control cycle'],
    ],
    title: '61D → 14D live monitor', continue: 'Resume', pause: 'Pause', interface: 'Policy interface', waiting: 'Waiting',
    groupsLabel: '61D observation groups', offsets: '14 joint-position offsets', experiments: 'Level 1 experiments',
    loading: 'Loading the official MuJoCo environment and ONNX policies. The first load may take a moment.', snapshot: 'Capture current frame',
    drive: 'Send forward command', actionWait: 'Waiting for a new policy action…', roll: 'Switch to roll policy',
    reset: 'Reset and restore walk', complete: 'Level 1 complete. Progress is saved locally.', replay: 'Run Level 1 again',
  },
} as const;

const ranges = [
  { range: '0–2', start: 0, end: 3, tone: 'orange' }, { range: '3–5', start: 3, end: 6, tone: 'teal' },
  { range: '6–19', start: 6, end: 20, tone: 'purple' }, { range: '20–33', start: 20, end: 34, tone: 'blue' },
  { range: '34–47', start: 34, end: 48, tone: 'rose' }, { range: '48–60', start: 48, end: 61, tone: 'green' },
];

const format = (value: number) => Number.isFinite(value) ? value.toFixed(3) : '—';

export function SimulatorInspector({ telemetry, completed, paused, entered, onTogglePause, onSnapshot, onDrive, onRoll, onReset, onReplay, locale }: InspectorProps) {
  const text = content[locale];
  const groups = ranges.map((group, index) => ({ ...group, name: `${text.groups[index][0]} ${text.groups[index][1]}` }));
  const missions = text.missions.map(([title, note], index) => ({ id: index + 1, title, note }));
  const nextMission = missions.find((mission) => !completed.includes(mission.id))?.id ?? 7;
  const actionPeak = Math.max(0, ...(telemetry?.action.map((value) => Math.abs(value)) ?? []));

  return (
    <div className="policy-inspector">
      <div className="inspector-head">
        <div><p className="eyebrow">LEVEL 1 · POLICY INSPECTION</p><h3>{text.title}</h3></div>
        <Button variant="ghost" size="sm" onClick={onTogglePause} disabled={!entered}>
          {paused ? <Play /> : <Pause />}{paused ? text.continue : text.pause}
        </Button>
      </div>

      <div className="contract-strip" aria-label={text.interface}>
        <span><b>61D</b> observation</span><i>→</i><span><b>{telemetry?.mode ?? '—'}</b> policy</span><i>→</i><span><b>14D</b> action</span>
      </div>

      <div className="telemetry-summary">
        <span>MODE<strong>{telemetry?.mode ?? text.waiting}</strong></span>
        <span>LOCO<strong>{telemetry?.loco ?? '—'}</strong></span>
        <span>ACTION PEAK<strong>{format(actionPeak)}</strong></span>
      </div>

      <div className="observation-groups" aria-label={text.groupsLabel}>
        {groups.map((group) => {
          const values = telemetry?.observation.slice(group.start, group.end) ?? [];
          const magnitude = values.length ? Math.min(100, Math.max(...values.map((value) => Math.abs(value))) * 55) : 0;
          return <div key={group.name} className={`obs-group ${group.tone}`}>
            <div><span>{group.name}</span><small>[{group.range}] · {values.length || group.end - group.start}D</small></div>
            <div className="signal-track"><i style={{ width: `${magnitude}%` }} /></div>
            <code>{values.slice(0, 3).map(format).join('  ') || '—'}</code>
          </div>;
        })}
      </div>

      <div className="vector-block">
        <div><strong>command[0:13]</strong><small>twist 3 · head 4 · body 6</small></div>
        <div className="number-grid command-grid">{Array.from({ length: 13 }, (_, index) => <span key={index}>{format(telemetry?.command[index] ?? Number.NaN)}</span>)}</div>
      </div>

      <div className="vector-block">
        <div><strong>action[0:14]</strong><small>{text.offsets}</small></div>
        <div className="action-bars">{Array.from({ length: 14 }, (_, index) => {
          const value = telemetry?.action[index] ?? 0;
          return <span key={index} title={`action[${index}] = ${format(value)}`}><i style={{ height: `${Math.min(100, Math.abs(value) * 72 + 4)}%` }} /></span>;
        })}</div>
      </div>

      <div className="level-one-missions">
        <div><strong>{text.experiments}</strong><span>{completed.length} / 6</span></div>
        <ol>{missions.map((mission) => <li key={mission.id} className={completed.includes(mission.id) ? 'done' : nextMission === mission.id ? 'active' : ''}>
          {completed.includes(mission.id) ? <CheckCircle2 /> : <Circle />}
          <span><b>{mission.id}. {mission.title}</b><small>{mission.note}</small></span>
        </li>)}</ol>
        {nextMission === 1 && <p className="mission-prompt">{text.loading}</p>}
        {nextMission === 2 && <Button onClick={onSnapshot}>{text.snapshot}</Button>}
        {nextMission === 3 && <Button onClick={onDrive}>{text.drive}</Button>}
        {nextMission === 4 && <p className="mission-prompt">{text.actionWait}</p>}
        {nextMission === 5 && <Button onClick={onRoll}>{text.roll}</Button>}
        {nextMission === 6 && <Button onClick={onReset}><RotateCcw />{text.reset}</Button>}
        {nextMission === 7 && <div className="mission-finished">
          <p className="mission-complete"><CheckCircle2 />{text.complete}</p>
          <Button variant="outline" onClick={onReplay}><RotateCcw />{text.replay}</Button>
        </div>}
      </div>
    </div>
  );
}
