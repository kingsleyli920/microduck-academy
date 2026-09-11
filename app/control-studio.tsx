'use client';

import { Activity, BookOpen, FileCode2, Loader2, PanelRightOpen, Play, SquareTerminal } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ControlApiReference } from './control-api-reference';
import type { Locale } from './i18n';

type ControlStudioProps = {
  entered: boolean;
  running: boolean;
  status: string;
  script: string;
  trace: string[];
  onScriptChange: (value: string) => void;
  onRun: () => void;
  onStop: () => void;
  onQuick: (action: 'roll' | 'kick-left' | 'kick-right' | 'ground-pick' | 'ball' | 'reset') => void;
  locale: Locale;
};

const content = {
  'zh-CN': {
    level: 'LEVEL 2 · 实时控制程序',
    groupTitles: ['连续控制', '程序逻辑', '策略与社区动作', '环境与模拟器'],
    title: '控制语言与策略调用',
    intro: 'drive、turn 和 look 持续更新 50 Hz policy 的 command；if 和 repeat 根据 observation 组织控制流程；skill 调用已训练的 ONNX 策略。',
    docsOpen: '关闭 API Reference', docsClosed: '打开 API Reference', quick: '运行内置策略', roll: '翻滚', kickLeft: '左脚踢球',
    kickRight: '右脚踢球', ground: '低头触地', ball: '生成足球', reset: '重置环境', programLabel: 'Microduck 控制程序',
    running: '程序运行中', run: '运行控制程序', stop: '停止', trace: '运行轨迹', traceEmpty: '运行后显示 command、observation 分支和 policy 切换。',
    boundaryLabel: '运行边界：', boundary: '控制程序可以组合现有 walk 和 skill policy，生成不同的速度与转向轨迹。新的动力学动作需要修改任务和 reward，并在 Level 4–5 重新训练和导出 ONNX。',
  },
  en: {
    level: 'LEVEL 2 · REAL-TIME CONTROL PROGRAM',
    groupTitles: ['Continuous control', 'Program logic', 'Policies and community motions', 'Environment and simulator'],
    title: 'Control language and policy calls',
    intro: 'drive, turn, and look update the command for the 50 Hz policy. if and repeat organize control flow around observations. skill invokes a trained ONNX policy.',
    docsOpen: 'Close API Reference', docsClosed: 'Open API Reference', quick: 'Run built-in policies', roll: 'Roll', kickLeft: 'Kick with left foot',
    kickRight: 'Kick with right foot', ground: 'Touch ground', ball: 'Spawn football', reset: 'Reset environment', programLabel: 'Microduck control program',
    running: 'Program running', run: 'Run control program', stop: 'Stop', trace: 'Execution trace', traceEmpty: 'Commands, observation branches, and policy switches appear here after a run.',
    boundaryLabel: 'Runtime scope: ', boundary: 'A control program composes existing walk and skill policies into different speed and turning trajectories. A new dynamic motion requires a revised task and reward, followed by ONNX training and export in Levels 4–5.',
  },
} as const;

const apiItems = [
  ['drive(vx, yaw, ms)', 'turn(yaw, ms)', 'look(neck, pitch, yaw, roll, ms)'],
  ['repeat(n) { … }', 'if obs[i] < value { … }', 'print(obs[i])'],
  ['skill("roll") / sit() / stand()', 'move(ref) / play_move()', 'official()'],
  ['ball() / rollers() / legs()', 'quack() / camera("follow")', 'wait(ms) / reset()'],
];
const apiTones = ['live', 'logic', 'skill', 'world'];

export function ControlStudio({ entered, running, status, script, trace, onScriptChange, onRun, onStop, onQuick, locale }: ControlStudioProps) {
  const text = content[locale];
  const apiGroups = text.groupTitles.map((title, index) => ({ title, tone: apiTones[index], items: apiItems[index] }));
  const [referenceOpen, setReferenceOpen] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const insertSnippet = (snippet: string) => {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? script.length;
    const end = editor?.selectionEnd ?? start;
    const prefix = start > 0 && script[start - 1] !== '\n' ? '\n' : '';
    const suffix = end < script.length && script[end] !== '\n' ? '\n' : '';
    const insertion = `${prefix}${snippet}${suffix}`;
    onScriptChange(`${script.slice(0, start)}${insertion}${script.slice(end)}`);
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  };

  return <div className="control-studio">
    <div className="program-intro">
      <span>{text.level}</span>
      <h3>{text.title}</h3>
      <p>{text.intro}</p>
      <Button className="api-doc-button" size="sm" aria-pressed={referenceOpen} onClick={() => setReferenceOpen((open) => !open)}>
        {referenceOpen ? <BookOpen /> : <PanelRightOpen />}{referenceOpen ? text.docsOpen : text.docsClosed}
      </Button>
    </div>

    <div className={`bridge-status ${entered ? 'ready' : ''}`}><span />{status}</div>

    <div className="control-api-grid" aria-label={locale === 'en' ? 'Microduck control program API' : 'Microduck 控制程序 API'}>
      {apiGroups.map((group) => <section key={group.title} className={group.tone}>
        <b>{group.title}</b>
        {group.items.map((item) => <code key={item}>{item}</code>)}
      </section>)}
    </div>

    <details className="quick-skills">
      <summary>{text.quick}</summary>
      <div className="action-buttons">
        <Button onClick={() => onQuick('roll')} disabled={!entered}>{text.roll}</Button>
        <Button variant="outline" onClick={() => onQuick('kick-left')} disabled={!entered}>{text.kickLeft}</Button>
        <Button variant="outline" onClick={() => onQuick('kick-right')} disabled={!entered}>{text.kickRight}</Button>
        <Button variant="outline" onClick={() => onQuick('ground-pick')} disabled={!entered}>{text.ground}</Button>
        <Button variant="outline" onClick={() => onQuick('ball')} disabled={!entered}>{text.ball}</Button>
        <Button variant="ghost" onClick={() => onQuick('reset')} disabled={!entered}>{text.reset}</Button>
      </div>
    </details>

    <label htmlFor="simulator-script"><FileCode2 />control.duck</label>
    <Textarea ref={editorRef} id="simulator-script" aria-label={text.programLabel} className="action-code control-code" spellCheck={false} value={script} onChange={(event) => onScriptChange(event.target.value)} />
    <div className="program-actions">
      <Button size="lg" onClick={onRun} disabled={!entered || running}>
        {running ? <Loader2 className="spin" /> : <Play />}{running ? text.running : text.run}
      </Button>
      <Button variant="outline" onClick={onStop} disabled={!running}><SquareTerminal />{text.stop}</Button>
    </div>

    <output className="program-trace" aria-label={locale === 'en' ? 'Program execution trace' : '程序运行轨迹'}>
      <span><Activity />{text.trace}</span>
      {trace.length ? trace.slice(-6).map((line, index) => <code key={`${index}-${line}`}>{line}</code>) : <small>{text.traceEmpty}</small>}
    </output>

    <p className="program-boundary"><b>{text.boundaryLabel}</b>{text.boundary}</p>
    {referenceOpen && <aside className="control-reference-drawer">
      <ControlApiReference onBack={() => setReferenceOpen(false)} onInsert={insertSnippet} locale={locale} />
    </aside>}
  </div>;
}
