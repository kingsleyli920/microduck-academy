'use client';

import { BookOpen, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { controlApi, legacyAliases, observationGroups } from './control-api';

type ControlApiReferenceProps = {
  onBack: () => void;
  onInsert: (snippet: string) => void;
};

export function ControlApiReference({ onBack, onInsert }: ControlApiReferenceProps) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => controlApi.filter((entry) => !normalized || [
    entry.id, entry.title, entry.signature, entry.category, entry.portability, entry.summary,
    ...entry.parameters, ...entry.notes, ...entry.keywords,
  ].join(' ').toLowerCase().includes(normalized)), [normalized]);
  const showObservations = !normalized || ['obs', 'observation', '观测', '状态', '61d', 'command'].some((term) => term.includes(normalized) || normalized.includes(term));

  return <section className="control-reference" aria-label="Microduck Control API 完整文档">
    <div className="reference-head">
      <Button variant="ghost" size="sm" onClick={onBack}><X />关闭文档</Button>
      <span><BookOpen />control.duck 全量 · {controlApi.length} 项</span>
    </div>
    <div className="reference-title">
      <p className="eyebrow">CONTROL.DUCK REFERENCE</p>
      <h3>边写程序，边查完整语言</h3>
      <p>这里逐项对应解释器实际接受的命令，并按官方模拟器 023172c 审计。“需对应策略”表示目标端也要安装相同 policy；“仅模拟器”用于物理实验。</p>
    </div>
    <label className="reference-search">
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 drive、obs、翻滚、参数范围…" aria-label="搜索 Control API" />
      <kbd>{matches.length}</kbd>
    </label>

    <div className="reference-scroll">
      {matches.length ? matches.map((entry) => <article className="api-entry" key={entry.id}>
        <div className="api-entry-head">
          <div><span>{entry.category}</span><h4>{entry.title}</h4></div>
          <em data-portability={entry.portability}>{entry.portability}</em>
        </div>
        <code className="api-signature">{entry.signature}</code>
        <p>{entry.summary}</p>
        <div className="api-detail"><b>参数与范围</b>{entry.parameters.map((parameter) => <small key={parameter}>{parameter}</small>)}</div>
        <div className="api-detail"><b>行为说明</b>{entry.notes.map((note) => <small key={note}>{note}</small>)}</div>
        <pre>{entry.example}</pre>
        <Button variant="outline" size="sm" onClick={() => onInsert(entry.example)}>插入示例 · 文档保持打开</Button>
      </article>) : <div className="api-empty">没有匹配的命令。试试 <button onClick={() => setQuery('obs')}>obs</button>、<button onClick={() => setQuery('skill')}>skill</button> 或 <button onClick={() => setQuery('模拟器')}>模拟器</button>。</div>}

      {showObservations && <section className="observation-reference">
        <div><span>61D INPUT CONTRACT</span><h4>observation 下标地图</h4></div>
        {observationGroups.map((group) => <div className="observation-row" key={group.range}>
          <code>{group.range}</code><b>{group.name}</b><small>{group.length} · {group.detail}</small>
        </div>)}
        <p>14 个关节顺序：左 hip yaw / roll / pitch / knee / ankle，neck pitch，head pitch / yaw / roll，右 hip yaw / roll / pitch / knee / ankle。</p>
      </section>}

      {!normalized && <section className="alias-reference">
        <span>兼容旧写法</span>
        <p>旧课程脚本仍能运行；新代码建议统一使用右侧写法。</p>
        {legacyAliases.map(([legacy, current]) => <code key={legacy}>{legacy} <b>→</b> {current}</code>)}
      </section>}

      {!normalized && <section className="scope-reference">
        <span>“全部”的准确边界</span>
        <h4>三层能力不能混成一张函数表</h4>
        <p><b>本页：</b>当前 <code>control.duck</code> 解释器的全部可执行语法。</p>
        <p><b>动态动作：</b><code>move(ref)</code> 可加载 Hub、Academy session 或 ONNX URL，所以社区技能没有固定总数。</p>
        <p><b>官方内部对象：</b><code>model</code>、<code>data</code>、<code>step()</code>、<code>render()</code>、恢复状态机等只供调试与测试，不作为稳定教学 API。</p>
      </section>}
    </div>
  </section>;
}
