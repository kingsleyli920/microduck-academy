'use client';

import { Activity, BookOpen, FileCode2, Loader2, PanelRightOpen, Play, SquareTerminal } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ControlApiReference } from './control-api-reference';

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
};

const apiGroups = [
  { title: '连续控制', tone: 'live', items: ['drive(vx, yaw, ms)', 'turn(yaw, ms)', 'look(neck, pitch, yaw, roll, ms)'] },
  { title: '程序逻辑', tone: 'logic', items: ['repeat(n) { … }', 'if obs[i] < value { … }', 'print(obs[i])'] },
  { title: '策略与社区动作', tone: 'skill', items: ['skill("roll") / sit() / stand()', 'move(ref) / play_move()', 'official()'] },
  { title: '世界与表现', tone: 'world', items: ['ball() / rollers() / legs()', 'quack() / camera("follow")', 'wait(ms) / reset()'] },
];

export function ControlStudio({ entered, running, status, script, trace, onScriptChange, onRun, onStop, onQuick }: ControlStudioProps) {
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
      <span>LEVEL 2 · 实时控制程序</span>
      <h3>这些按钮不是上限</h3>
      <p><strong>drive / turn / look</strong> 会连续改变 50 Hz policy 的 command；<strong>if / repeat</strong> 让程序读取 observation 并决定下一步；<strong>skill</strong> 才是调用现成 ONNX 动作。</p>
      <Button className="api-doc-button" size="sm" aria-pressed={referenceOpen} onClick={() => setReferenceOpen((open) => !open)}>
        {referenceOpen ? <BookOpen /> : <PanelRightOpen />}{referenceOpen ? '文档已在右侧打开' : '边写边查 API'}
      </Button>
    </div>

    <div className={`bridge-status ${entered ? 'ready' : ''}`}><span />{status}</div>

    <div className="control-api-grid" aria-label="Microduck 控制程序 API">
      {apiGroups.map((group) => <section key={group.title} className={group.tone}>
        <b>{group.title}</b>
        {group.items.map((item) => <code key={item}>{item}</code>)}
      </section>)}
    </div>

    <details className="quick-skills">
      <summary>快速试一下现成 skills</summary>
      <div className="action-buttons">
        <Button onClick={() => onQuick('roll')} disabled={!entered}>翻滚</Button>
        <Button variant="outline" onClick={() => onQuick('kick-left')} disabled={!entered}>左脚踢</Button>
        <Button variant="outline" onClick={() => onQuick('kick-right')} disabled={!entered}>右脚踢</Button>
        <Button variant="outline" onClick={() => onQuick('ground-pick')} disabled={!entered}>低头触地</Button>
        <Button variant="outline" onClick={() => onQuick('ball')} disabled={!entered}>生成球</Button>
        <Button variant="ghost" onClick={() => onQuick('reset')} disabled={!entered}>重置</Button>
      </div>
    </details>

    <label htmlFor="simulator-script"><FileCode2 />control.duck</label>
    <Textarea ref={editorRef} id="simulator-script" aria-label="Microduck 控制程序" className="action-code control-code" spellCheck={false} value={script} onChange={(event) => onScriptChange(event.target.value)} />
    <div className="program-actions">
      <Button size="lg" onClick={onRun} disabled={!entered || running}>
        {running ? <Loader2 className="spin" /> : <Play />}{running ? '程序运行中' : '运行控制程序'}
      </Button>
      <Button variant="outline" onClick={onStop} disabled={!running}><SquareTerminal />停止</Button>
    </div>

    <output className="program-trace" aria-label="程序运行轨迹">
      <span><Activity />运行轨迹</span>
      {trace.length ? trace.slice(-6).map((line, index) => <code key={`${index}-${line}`}>{line}</code>) : <small>运行后，这里会显示 command、observation 分支和 policy 切换。</small>}
    </output>

    <p className="program-boundary"><b>这是真正的运行时编程：</b>同一个 walk policy 能产生无数条速度与转向轨迹。若要发明训练集中没有的新动力学动作，例如新的跳跃姿势，需要进入 Level 3–5 修改 reward 并重新训练 ONNX。</p>
    {referenceOpen && <aside className="control-reference-drawer">
      <ControlApiReference onBack={() => setReferenceOpen(false)} onInsert={insertSnippet} />
    </aside>}
  </div>;
}
