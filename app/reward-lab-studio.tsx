'use client';

import { Activity, CheckCircle2, Circle, FlaskConical, Loader2, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Locale } from './i18n';
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
  locale: Locale;
};

const fieldSpecs: Array<{ key: keyof RewardConfig; hint: string; step: number }> = [
  { key: 'targetSpeed', hint: 'm/s · command vx', step: 0.01 }, { key: 'durationMs', hint: 'ms · 1,000–8,000', step: 500 },
  { key: 'trackingWeight', hint: '+ w × exp(-4 error²)', step: 0.1 }, { key: 'uprightWeight', hint: '+ w × upright', step: 0.1 },
  { key: 'effortWeight', hint: '− w × mean(action²)', step: 0.01 }, { key: 'smoothnessWeight', hint: '− w × mean(Δaction²)', step: 0.01 },
  { key: 'terminationGravityZ', hint: 'gravity z threshold', step: 0.05 }, { key: 'minHeight', hint: 'm · height threshold', step: 0.01 },
];

const content = {
  'zh-CN': {
    fieldLabels: ['目标速度', '最长时长', '速度跟踪权重', '直立奖励权重', '动作能耗惩罚', '动作变化惩罚', '倾倒终止阈值', '最低机身高度'],
    missions: [['定义任务', '设置 command、reward 权重和 termination'], ['运行实验 A', '采集 MuJoCo rollout'], ['运行实验 B', '使用另一组 reward 参数'], ['比较结果', '结合 return 和约束指标解释差异']],
    title: '用两组参数评估同一策略', intro: '两个实验都运行官方 ONNX walk policy，并从 MuJoCo 读取平面速度、姿态和 action。Level 3 只评估任务定义；Level 4 才使用 PPO 更新策略。',
    ready: '物理桥接已就绪 · 20 Hz 采样 / 50 Hz policy', waiting: '正在等待官方模拟器', experiment: '实验', baseline: '平衡基线', tracking: '提高速度跟踪权重',
    collecting: '正在采集', run: '运行实验', stop: '停止当前 rollout', endReason: '结束原因', awaiting: '等待 rollout',
    comparisonLabel: 'A/B return 对比', comparison: '同一 policy 下，B − A = ', comparisonNote: 'return 增加只表示参数组 B 计算出的分数更高。还应比较跟踪误差、能耗、跌倒和录像。当前 tracking 只使用平面速率，侧滑也可能得分，这是本实验可以观察的 reward exploit。',
    equation: 'return = Σ rₜ Δt；本实验重新计算分数，不更新 ONNX 权重。', reset: '清空 Level 3 实验',
  },
  en: {
    fieldLabels: ['Target speed', 'Maximum duration', 'Speed-tracking weight', 'Upright reward weight', 'Action-energy penalty', 'Action-change penalty', 'Tilt termination threshold', 'Minimum body height'],
    missions: [['Define the task', 'Set command, reward weights, and termination'], ['Run experiment A', 'Collect a MuJoCo rollout'], ['Run experiment B', 'Use a second reward configuration'], ['Compare results', 'Interpret return with constraint metrics']],
    title: 'Evaluate one policy with two reward configurations', intro: 'Both experiments run the official ONNX walk policy and read planar speed, posture, and actions from MuJoCo. Level 3 evaluates task definitions; Level 4 will update policies with PPO.',
    ready: 'Physics bridge ready · 20 Hz sampling / 50 Hz policy', waiting: 'Waiting for the official simulator', experiment: 'Experiment', baseline: 'Balanced baseline', tracking: 'Higher tracking weight',
    collecting: 'Collecting', run: 'Run experiment', stop: 'Stop current rollout', endReason: 'End reason', awaiting: 'Waiting for rollout',
    comparisonLabel: 'A/B return comparison', comparison: 'With the same policy, B − A = ', comparisonNote: 'A higher return means only that configuration B assigns a higher score. Also compare tracking error, energy, falls, and recordings. Because tracking uses planar speed, sideways motion may still score; this is an observable reward exploit.',
    equation: 'return = Σ rₜ Δt. This experiment recomputes scores and does not update ONNX weights.', reset: 'Clear Level 3 experiments',
  },
} as const;

const format = (value: number, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : '—';

function ResultCard({ slot, result, locale }: { slot: RewardSlot; result?: RolloutResult; locale: Locale }) {
  const text = content[locale];
  return <article className={`reward-result ${result ? 'has-result' : ''}`}>
    <div><b>{text.experiment} {slot}</b><span>{result ? `${result.samples} samples` : text.awaiting}</span></div>
    <strong>{result ? format(result.returnValue) : '—'}<small> return</small></strong>
    <dl>
      <div><dt>mean speed</dt><dd>{result ? format(result.meanSpeed) : '—'}</dd></div>
      <div><dt>tracking error</dt><dd>{result ? format(result.meanTrackingError) : '—'}</dd></div>
      <div><dt>action energy</dt><dd>{result ? format(result.meanEffort) : '—'}</dd></div>
      <div><dt>{text.endReason}</dt><dd>{result?.terminatedBy ?? '—'}</dd></div>
    </dl>
  </article>;
}

export function RewardLabStudio({ entered, configs, results, running, completed, onConfigChange, onRun, onStop, onReset, locale }: RewardLabStudioProps) {
  const text = content[locale];
  const fields = fieldSpecs.map((field, index) => ({ ...field, label: text.fieldLabels[index] }));
  const comparison = results.A && results.B ? results.B.returnValue - results.A.returnValue : null;
  return <div className="reward-lab">
    <div className="program-intro reward-intro">
      <span>LEVEL 3 · TASK & REWARD LAB</span>
      <h3>{text.title}</h3>
      <p>{text.intro}</p>
    </div>

    <div className={`bridge-status ${entered ? 'ready' : ''}`}><span />{entered ? text.ready : text.waiting}</div>

    <div className="reward-missions">
      {text.missions.map(([title, note], index) => <div key={title} className={completed.includes(index + 1) ? 'done' : ''}>
        {completed.includes(index + 1) ? <CheckCircle2 /> : <Circle />}<span><b>{index + 1}. {title}</b><small>{note}</small></span>
      </div>)}
    </div>

    <div className="reward-configs">
      {(['A', 'B'] as const).map((slot) => <section key={slot}>
        <header><div><FlaskConical /><b>{text.experiment} {slot}</b></div><span>{slot === 'A' ? text.baseline : text.tracking}</span></header>
        <div className="reward-fields">{fields.map((field) => <label key={field.key}>
          <span>{field.label}<small>{field.hint}</small></span>
          <input type="number" step={field.step} value={configs[slot][field.key]} disabled={Boolean(running)}
            onChange={(event) => onConfigChange(slot, { ...configs[slot], [field.key]: Number(event.target.value) })} />
        </label>)}</div>
        <Button onClick={() => onRun(slot)} disabled={!entered || Boolean(running)}>
          {running === slot ? <Loader2 className="spin" /> : <Play />}{running === slot ? `${text.collecting} ${slot}` : `${text.run} ${slot}`}
        </Button>
      </section>)}
    </div>

    {running && <Button variant="outline" onClick={onStop}>{text.stop}</Button>}

    <div className="reward-results"><ResultCard slot="A" result={results.A} locale={locale} /><ResultCard slot="B" result={results.B} locale={locale} /></div>
    {comparison !== null && <output className="reward-comparison" aria-label={text.comparisonLabel}>
      <Activity /><span>{text.comparison}<strong>{comparison >= 0 ? '+' : ''}{format(comparison)}</strong></span>
      <small>{text.comparisonNote}</small>
    </output>}
    <div className="reward-equation"><code>rₜ = wᵥ·tracking + wᵤ·upright − wₑ·effort − wₛ·smoothness</code><small>{text.equation}</small></div>
    <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw />{text.reset}</Button>
  </div>;
}
