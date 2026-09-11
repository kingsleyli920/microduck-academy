'use client';

import { BookOpen, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { controlApi, legacyAliases, observationGroups } from './control-api';
import { englishControlCopy, englishObservationGroups } from './control-api.en';
import type { Locale } from './i18n';

type ControlApiReferenceProps = {
  onBack: () => void;
  onInsert: (snippet: string) => void;
  locale: Locale;
};

const content = {
  'zh-CN': {
    close: '关闭文档', count: '项', title: 'control.duck API Reference',
    intro: '本页逐项对应解释器实际接受的命令，并基于官方模拟器提交 023172c 验证。目标端需要安装兼容策略，模拟器专用命令只用于物理实验。',
    search: '搜索 drive、obs、翻滚或参数范围…', searchLabel: '搜索 Control API', parameters: '参数与范围', behavior: '行为说明', insert: '插入示例',
    empty: '没有匹配的命令。可以搜索', obsTitle: 'observation 下标', joints: '14 个关节顺序：左 hip yaw / roll / pitch / knee / ankle，neck pitch，head pitch / yaw / roll，右 hip yaw / roll / pitch / knee / ankle。',
    aliases: '兼容旧写法', aliasNote: '旧课程脚本仍可运行；新代码建议使用右侧写法。', scope: 'API 范围', scopeTitle: '控制语言、动态策略与内部对象',
    scopePage: '本页：', scopePageNote: '当前 control.duck 解释器支持的全部可执行语法。', scopeDynamic: '动态动作：', scopeDynamicNote: 'move(ref) 可以加载 Hub、Academy session 或 ONNX URL，因此社区策略没有固定总数。',
    scopeInternal: '内部对象：', scopeInternalNote: 'model、data、step()、render() 和恢复状态机用于调试与测试，不属于稳定教学 API。',
    categories: { 控制: '控制', 逻辑: '逻辑', 技能: '策略', 世界: '环境', 模拟器: '模拟器' },
    portability: { 可迁移: '可迁移', 需对应策略: '需要兼容策略', 仅模拟器: '仅模拟器' },
  },
  en: {
    close: 'Close reference', count: 'entries', title: 'control.duck API Reference',
    intro: 'Every entry matches syntax accepted by the interpreter and was verified against official simulator commit 023172c. Compatible policies must exist on the target; simulator-only commands are for physics experiments.',
    search: 'Search drive, obs, roll, or parameter ranges…', searchLabel: 'Search Control API', parameters: 'Parameters and bounds', behavior: 'Behavior', insert: 'Insert example',
    empty: 'No matching command. Try', obsTitle: 'Observation index map', joints: 'Joint order: left hip yaw / roll / pitch / knee / ankle, neck pitch, head pitch / yaw / roll, right hip yaw / roll / pitch / knee / ankle.',
    aliases: 'Legacy aliases', aliasNote: 'Older lesson scripts still run. Prefer the form on the right for new code.', scope: 'API scope', scopeTitle: 'Control language, dynamic policies, and internal objects',
    scopePage: 'This page: ', scopePageNote: 'Every executable construct supported by the current control.duck interpreter.', scopeDynamic: 'Dynamic motions: ', scopeDynamicNote: 'move(ref) loads Hub, Academy session, or ONNX URLs, so community policies have no fixed total.',
    scopeInternal: 'Internal objects: ', scopeInternalNote: 'model, data, step(), render(), and recovery state machines are debugging and test surfaces, not stable teaching APIs.',
    categories: { 控制: 'Control', 逻辑: 'Logic', 技能: 'Policy', 世界: 'Environment', 模拟器: 'Simulator' },
    portability: { 可迁移: 'Portable', 需对应策略: 'Compatible policy required', 仅模拟器: 'Simulator only' },
  },
} as const;

export function ControlApiReference({ onBack, onInsert, locale }: ControlApiReferenceProps) {
  const text = content[locale];
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const localizedApi = useMemo(() => controlApi.map((entry) => locale === 'en' ? { ...entry, ...englishControlCopy[entry.id] } : entry), [locale]);
  const matches = useMemo(() => localizedApi.filter((entry) => !normalized || [
    entry.id, entry.title, entry.signature, entry.category, entry.portability, entry.summary,
    ...entry.parameters, ...entry.notes, ...entry.keywords,
  ].join(' ').toLowerCase().includes(normalized)), [localizedApi, normalized]);
  const showObservations = !normalized || ['obs', 'observation', '观测', '状态', 'state', '61d', 'command'].some((term) => term.includes(normalized) || normalized.includes(term));
  const localizedObservationGroups = locale === 'en' ? englishObservationGroups : observationGroups;

  return <section className="control-reference" aria-label="Microduck Control API Reference">
    <div className="reference-head">
      <Button variant="ghost" size="sm" onClick={onBack}><X />{text.close}</Button>
      <span><BookOpen />control.duck · {controlApi.length} {text.count}</span>
    </div>
    <div className="reference-title">
      <p className="eyebrow">CONTROL.DUCK REFERENCE</p>
      <h3>{text.title}</h3>
      <p>{text.intro}</p>
    </div>
    <label className="reference-search">
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.search} aria-label={text.searchLabel} />
      <kbd>{matches.length}</kbd>
    </label>

    <div className="reference-scroll">
      {matches.length ? matches.map((entry) => <article className="api-entry" key={entry.id}>
        <div className="api-entry-head">
          <div><span>{text.categories[entry.category]}</span><h4>{entry.title}</h4></div>
          <em data-portability={entry.portability}>{text.portability[entry.portability]}</em>
        </div>
        <code className="api-signature">{entry.signature}</code>
        <p>{entry.summary}</p>
        <div className="api-detail"><b>{text.parameters}</b>{entry.parameters.map((parameter) => <small key={parameter}>{parameter}</small>)}</div>
        <div className="api-detail"><b>{text.behavior}</b>{entry.notes.map((note) => <small key={note}>{note}</small>)}</div>
        <pre>{entry.example}</pre>
        <Button variant="outline" size="sm" onClick={() => onInsert(entry.example)}>{text.insert}</Button>
      </article>) : <div className="api-empty">{text.empty} <button onClick={() => setQuery('obs')}>obs</button>, <button onClick={() => setQuery('skill')}>skill</button>, <button onClick={() => setQuery(locale === 'en' ? 'simulator' : '模拟器')}>{locale === 'en' ? 'simulator' : '模拟器'}</button>.</div>}

      {showObservations && <section className="observation-reference">
        <div><span>61D INPUT CONTRACT</span><h4>{text.obsTitle}</h4></div>
        {localizedObservationGroups.map((group) => <div className="observation-row" key={group.range}>
          <code>{group.range}</code><b>{group.name}</b><small>{group.length} · {group.detail}</small>
        </div>)}
        <p>{text.joints}</p>
      </section>}

      {!normalized && <section className="alias-reference">
        <span>{text.aliases}</span>
        <p>{text.aliasNote}</p>
        {legacyAliases.map(([legacy, current]) => <code key={legacy}>{legacy} <b>→</b> {current}</code>)}
      </section>}

      {!normalized && <section className="scope-reference">
        <span>{text.scope}</span>
        <h4>{text.scopeTitle}</h4>
        <p><b>{text.scopePage}</b>{text.scopePageNote}</p>
        <p><b>{text.scopeDynamic}</b>{text.scopeDynamicNote}</p>
        <p><b>{text.scopeInternal}</b>{text.scopeInternalNote}</p>
      </section>}
    </div>
  </section>;
}
