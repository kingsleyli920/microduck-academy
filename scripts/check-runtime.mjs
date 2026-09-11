import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { PYODIDE_FILES, SIMULATOR_COMMIT } from './runtime-config.mjs';

const academyDir = resolve(import.meta.dirname, '..');
const required = [
  ...PYODIDE_FILES.map((file) => join('public', 'pyodide', file)),
  join('public', 'microduck-simulator', 'index.html'),
  join('public', 'bundle'),
  join('public', 'policies'),
  join('public', 'robot'),
];
const missing = required.filter((path) => !existsSync(join(academyDir, path)));
if (missing.length) {
  console.error(`运行时缺少：${missing.join('、')}`);
  console.error('请运行 npm run setup:runtime。');
  process.exit(1);
}

const manifestPath = join(academyDir, 'public', 'runtime-versions.json');
if (!existsSync(manifestPath)) {
  console.error('缺少 public/runtime-versions.json；请重新运行 npm run setup:runtime。');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.simulator?.commit !== SIMULATOR_COMMIT) {
  console.error(`模拟器版本不匹配：需要 ${SIMULATOR_COMMIT}。`);
  process.exit(1);
}
console.log(`runtime-ok: simulator ${SIMULATOR_COMMIT.slice(0, 7)}, Pyodide ${manifest.pyodide?.version}`);
