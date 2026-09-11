'use client';

import { Activity, CheckCircle2, Circle, FlaskConical, Loader2, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { RewardConfig, RewardSlot, RolloutResult } from './reward-lab';

type RewardLabStudioProps = {
  entered: boolean;
  configs: Record<RewardSlot, RewardConfig>;
  results: Partial<Record<RewardSlot, RolloutResult>>;
  running: RewardSlot | null;
  completed: number[];
  onConfigChange: (slot: RewardSlot, config: RewardConfig) => void;
  onRun: (slot: RewardSlot) => void;
  onStop: () => void;
  onReset: () => void;
};

const fields: Array<{ key: keyof RewardConfig; label: string; hint: string; step: number }> = [
  { key: 'targetSpeed', label: '目标速度', hint: 'm/s · command vx', step: 0.01 },
  { key: 'durationMs', label: '最长时长', hint: 'ms · 1,000–8,000', step: 500 },
  { key: 'trackingWeight', label: '速度跟踪', hint: '+ w × exp(-4 error²)', step: 0.1 },
  { key: 'uprightWeight', label: '保持直立', hint: '+ w × upright', step: 0.1 },
  { key: 'effortWeight', label: '动作能耗', hint: '− w × mean(action²)', step: 0.01 },
  { key: 'smoothnessWeight', label: '动作抖动', hint: '− w × mean(Δaction²)', step: 0.01 },
  { key: 'terminationGravityZ', label: '倾倒阈值', hint: 'gravity z 高于它就终止', step: 0.05 },
  { key: 'minHeight', label: '最低高度', hint: 'm · 低于它就终止', step: 0.01 },
];

const missions = [
  ['定义任务', '设置 command、reward 权重和 termination'],
  ['运行实验 A', '采集官方 MuJoCo 的真实 rollout'],
  ['运行实验 B', '换一套 reward 配方再次采集'],
  ['比较结果', '用 return 与约束指标解释差异'],
];

const format = (value: number, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : '—';

function ResultCard({ slot, result }: { slot: RewardSlot; result?: RolloutResult }) {
  return <article className={`reward-result ${result ? 'has-result' : ''}`}>
    <div><b>实验 {slot}</b><span>{result ? `${result.samples} samples` : '等待 rollout'}</span></div>
    <strong>{result ? format(result.returnValue) : '—'}<small> return</small></strong>
    <dl>
      <div><dt>mean speed</dt><dd>{result ? format(result.meanSpeed) : '—'}</dd></div>
      <div><dt>tracking error</dt><dd>{result ? format(result.meanTrackingError) : '—'}</dd></div>
      <div><dt>action energy</dt><dd>{result ? format(result.meanEffort) : '—'}</dd></div>
      <div><dt>结束原因</dt><dd>{result?.terminatedBy ?? '—'}</dd></div>
    </dl>
  </article>;
}

export function RewardLabStudio({ entered, configs, results, running, completed, onConfigChange, onRun, onStop, onReset }: RewardLabStudioProps) {
  const comparison = results.A && results.B ? results.B.returnValue - results.A.returnValue : null;
  return <div className="reward-lab">
    <div className="program-intro reward-intro">
      <span>LEVEL 3 · TASK & REWARD LAB</span>
      <h3>同一个 policy，两把奖励尺子</h3>
      <p>两次实验都会驱动官方 ONNX walk policy，并从 MuJoCo 读取平面速度、姿态和 action。先学会定义与评估任务，再到 Level 4 用 PPO 更新 policy。</p>
    </div>

    <div className={`bridge-status ${entered ? 'ready' : ''}`}><span />{entered ? '真实物理桥接已就绪 · 20 Hz 采样 / 50 Hz policy' : '正在等待官方模拟器'}</div>

    <div className="reward-missions">
      {missions.map(([title, note], index) => <div key={title} className={completed.includes(index + 1) ? 'done' : ''}>
        {completed.includes(index + 1) ? <CheckCircle2 /> : <Circle />}<span><b>{index + 1}. {title}</b><small>{note}</small></span>
      </div>)}
    </div>

    <div className="reward-configs">
      {(['A', 'B'] as const).map((slot) => <section key={slot}>
        <header><div><FlaskConical /><b>实验 {slot}</b></div><span>{slot === 'A' ? '平衡基线' : '偏重追速'}</span></header>
        <div className="reward-fields">{fields.map((field) => <label key={field.key}>
          <span>{field.label}<small>{field.hint}</small></span>
          <input type="number" step={field.step} value={configs[slot][field.key]} disabled={Boolean(running)}
            onChange={(event) => onConfigChange(slot, { ...configs[slot], [field.key]: Number(event.target.value) })} />
        </label>)}</div>
        <Button onClick={() => onRun(slot)} disabled={!entered || Boolean(running)}>
          {running === slot ? <Loader2 className="spin" /> : <Play />}{running === slot ? `正在采集 ${slot}` : `运行实验 ${slot}`}
        </Button>
      </section>)}
    </div>

    {running && <Button variant="outline" onClick={onStop}>停止当前 rollout</Button>}

    <div className="reward-results"><ResultCard slot="A" result={results.A} /><ResultCard slot="B" result={results.B} /></div>
    {comparison !== null && <output className="reward-comparison" aria-label="A B 回报对比">
      <Activity /><span>相同 policy 下，B − A = <strong>{comparison >= 0 ? '+' : ''}{format(comparison)}</strong></span>
      <small>return 变大只说明“B 这把尺子给分更高”。还要看误差、能耗、跌倒和录像；当前 tracking 只看平面速率，侧滑也可能得分，这正是一个可观察的 reward hacking 缺口。</small>
    </output>}
    <div className="reward-equation"><code>rₜ = wᵥ·tracking + wᵤ·upright − wₑ·effort − wₛ·smoothness</code><small>return = Σ rₜ Δt；本实验重算分数，不更新 ONNX 权重。</small></div>
    <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw />清空 Level 3 实验</Button>
  </div>;
}
