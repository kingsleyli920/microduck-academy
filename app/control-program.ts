export type ControlProgramNode =
  | { type: 'command'; line: number; source: string }
  | { type: 'repeat'; line: number; count: number; children: ControlProgramNode[] }
  | { type: 'condition'; line: number; index: number; operator: '<' | '<=' | '>' | '>='; value: number; children: ControlProgramNode[] };

type SourceLine = { number: number; text: string };

export function parseControlProgram(source: string): ControlProgramNode[] {
  const lines: SourceLine[] = source.split('\n').map((raw, index) => {
    const trimmed = raw.trim();
    return {
      number: index + 1,
      text: trimmed.startsWith('#') ? '' : raw.replace(/\s+#.*$/, '').trim(),
    };
  }).filter((line) => line.text.length > 0);

  if (lines.length > 200) throw new Error('程序最多 200 行。');

  const parseBlock = (start: number, nested: boolean): [ControlProgramNode[], number] => {
    const nodes: ControlProgramNode[] = [];
    let cursor = start;
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.text === '}') {
        if (!nested) throw new Error(`第 ${line.number} 行：多了一个 }`);
        return [nodes, cursor + 1];
      }

      const repeat = line.text.match(/^repeat\((\d+)\)\s*\{$/);
      if (repeat) {
        const count = Number(repeat[1]);
        if (count < 1 || count > 20) throw new Error(`第 ${line.number} 行：repeat 次数必须在 1–20。`);
        const [children, next] = parseBlock(cursor + 1, true);
        nodes.push({ type: 'repeat', line: line.number, count, children });
        cursor = next;
        continue;
      }

      const condition = line.text.match(/^if\s+obs\[(\d+)]\s*(<=|>=|<|>)\s*(-?(?:\d+\.?\d*|\.\d+))\s*\{$/);
      if (condition) {
        const index = Number(condition[1]);
        if (index < 0 || index > 60) throw new Error(`第 ${line.number} 行：observation 下标必须在 0–60。`);
        const [children, next] = parseBlock(cursor + 1, true);
        nodes.push({
          type: 'condition', line: line.number, index,
          operator: condition[2] as '<' | '<=' | '>' | '>=', value: Number(condition[3]), children,
        });
        cursor = next;
        continue;
      }

      if (line.text.endsWith('{')) throw new Error(`第 ${line.number} 行：只支持 repeat(n) { 或 if obs[i] < value {。`);
      nodes.push({ type: 'command', line: line.number, source: line.text.replace(/;$/, '') });
      cursor += 1;
    }
    if (nested) throw new Error(`程序缺少一个 }`);
    return [nodes, cursor];
  };

  return parseBlock(0, false)[0];
}

export function parseNumberArguments(source: string, line: number, expected: number): number[] {
  const parts = source.trim() ? source.split(',').map((part) => Number(part.trim())) : [];
  if (parts.length !== expected || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`第 ${line} 行：需要 ${expected} 个数字参数。`);
  }
  return parts;
}
