'use client';

import { CheckCircle2, Circle, Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
};

const groups = [
  { name: '角速度 gyro', range: '0–2', start: 0, end: 3, tone: 'orange' },
  { name: '投影重力 gravity', range: '3–5', start: 3, end: 6, tone: 'teal' },
  { name: '关节位置 joint pos', range: '6–19', start: 6, end: 20, tone: 'purple' },
  { name: '关节速度 joint vel', range: '20–33', start: 20, end: 34, tone: 'blue' },
  { name: '上次动作 last action', range: '34–47', start: 34, end: 48, tone: 'rose' },
  { name: '目标指令 command', range: '48–60', start: 48, end: 61, tone: 'green' },
];

const missions = [
  { id: 1, title: '进入 50 Hz 控制循环', note: '官方策略就绪后自动完成' },
  { id: 2, title: '冻结一帧 61D observation', note: '点击“截取这一帧”' },
  { id: 3, title: '发送 0.20 m/s 速度命令', note: '让 command[0] 改变' },
  { id: 4, title: '观察 14D action 响应', note: '检测 policy 输出变化' },
  { id: 5, title: '切换到 roulade policy', note: '观察 mode 变成 roll' },
  { id: 6, title: '重置并交还 walk policy', note: '完成一次安全闭环' },
];

const format = (value: number) => Number.isFinite(value) ? value.toFixed(3) : '—';

export function SimulatorInspector({ telemetry, completed, paused, entered, onTogglePause, onSnapshot, onDrive, onRoll, onReset, onReplay }: InspectorProps) {
  const nextMission = missions.find((mission) => !completed.includes(mission.id))?.id ?? 7;
  const actionPeak = Math.max(0, ...(telemetry?.action.map((value) => Math.abs(value)) ?? []));

  return (
    <div className="policy-inspector">
      <div className="inspector-head">
        <div><p className="eyebrow">LEVEL 1 · 真实 POLICY</p><h3>61 → 14 实时仪表</h3></div>
        <Button variant="ghost" size="sm" onClick={onTogglePause} disabled={!entered}>
          {paused ? <Play /> : <Pause />}{paused ? '继续' : '暂停'}
        </Button>
      </div>

      <div className="contract-strip" aria-label="策略接口">
        <span><b>61D</b> observation</span><i>→</i><span><b>{telemetry?.mode ?? '—'}</b> policy</span><i>→</i><span><b>14D</b> action</span>
      </div>

      <div className="telemetry-summary">
        <span>MODE<strong>{telemetry?.mode ?? '等待'}</strong></span>
        <span>LOCO<strong>{telemetry?.loco ?? '—'}</strong></span>
        <span>ACTION PEAK<strong>{format(actionPeak)}</strong></span>
      </div>

      <div className="observation-groups" aria-label="61 维 observation 分组">
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
        <div><strong>action[0:14]</strong><small>14 个关节位置 offset</small></div>
        <div className="action-bars">{Array.from({ length: 14 }, (_, index) => {
          const value = telemetry?.action[index] ?? 0;
          return <span key={index} title={`action[${index}] = ${format(value)}`}><i style={{ height: `${Math.min(100, Math.abs(value) * 72 + 4)}%` }} /></span>;
        })}</div>
      </div>

      <div className="level-one-missions">
        <div><strong>Level 1 实验</strong><span>{completed.length} / 6</span></div>
        <ol>{missions.map((mission) => <li key={mission.id} className={completed.includes(mission.id) ? 'done' : nextMission === mission.id ? 'active' : ''}>
          {completed.includes(mission.id) ? <CheckCircle2 /> : <Circle />}
          <span><b>{mission.id}. {mission.title}</b><small>{mission.note}</small></span>
        </li>)}</ol>
        {nextMission === 1 && <p className="mission-prompt">正在启动官方 MuJoCo 与 ONNX 策略，首次加载会稍慢。</p>}
        {nextMission === 2 && <Button onClick={onSnapshot}>截取这一帧</Button>}
        {nextMission === 3 && <Button onClick={onDrive}>发送前进命令</Button>}
        {nextMission === 4 && <p className="mission-prompt">正在等 policy 的 action 作出响应…</p>}
        {nextMission === 5 && <Button onClick={onRoll}>切换到 roll policy</Button>}
        {nextMission === 6 && <Button onClick={onReset}><RotateCcw />重置并回到 walk</Button>}
        {nextMission === 7 && <div className="mission-finished">
          <p className="mission-complete"><CheckCircle2 />Level 1 已完成，进度已保存在本机。</p>
          <Button variant="outline" onClick={onReplay}><RotateCcw />重新体验 Level 1</Button>
        </div>}
      </div>
    </div>
  );
}
