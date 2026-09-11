import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { PYODIDE_FILES, SIMULATOR_COMMIT, SIMULATOR_REPOSITORY } from './runtime-config.mjs';

const academyDir = resolve(import.meta.dirname, '..');
const vendorDir = join(academyDir, 'vendor', 'microduck-simulator');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} 失败。`);
}

function output(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function installPyodide() {
  const source = join(academyDir, 'node_modules', 'pyodide');
  const target = join(academyDir, 'public', 'pyodide');
  if (!existsSync(join(source, 'pyodide.js'))) {
    throw new Error('缺少 node_modules/pyodide。请先运行 npm install。');
  }
  mkdirSync(target, { recursive: true });
  for (const file of PYODIDE_FILES) cpSync(join(source, file), join(target, file), { force: true });
  console.log(`Pyodide ${JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version} 已安装到 public/pyodide。`);
}

function findSimulator() {
  const configured = process.env.MICRODUCK_SIMULATOR_DIR
    ? resolve(process.env.MICRODUCK_SIMULATOR_DIR)
    : null;
  const adjacent = resolve(academyDir, '..', 'simulator');
  for (const candidate of [configured, adjacent, vendorDir]) {
    if (candidate && existsSync(join(candidate, 'app', 'package.json'))) return candidate;
  }
  return null;
}

function installSimulator() {
  let simulatorDir = findSimulator();
  if (!simulatorDir) {
    if (!output('git', ['lfs', 'version'], academyDir)) {
      throw new Error('首次下载官方模拟器需要 Git LFS。请安装 git-lfs 后重新运行 npm run setup:runtime。');
    }
    mkdirSync(join(academyDir, 'vendor'), { recursive: true });
    run('git', ['clone', SIMULATOR_REPOSITORY, vendorDir], { cwd: academyDir });
    simulatorDir = vendorDir;
    run('git', ['checkout', '--detach', SIMULATOR_COMMIT], { cwd: simulatorDir });
    run('git', ['lfs', 'pull'], { cwd: simulatorDir });
  }

  const actualCommit = output('git', ['rev-parse', 'HEAD'], simulatorDir);
  if (actualCommit !== SIMULATOR_COMMIT && process.env.MICRODUCK_SIMULATOR_ALLOW_UNPINNED !== '1') {
    throw new Error(`官方模拟器版本不匹配：需要 ${SIMULATOR_COMMIT.slice(0, 7)}，当前 ${actualCommit?.slice(0, 7) ?? '未知'}。`);
  }

  const simulatorApp = join(simulatorDir, 'app');
  run('npm', ['ci'], { cwd: simulatorApp });
  run('npm', ['test'], { cwd: simulatorApp });
  run('npm', ['run', 'build'], { cwd: simulatorApp });
  run('node', [join(academyDir, 'scripts', 'sync-simulator.mjs')], {
    cwd: academyDir,
    env: { ...process.env, MICRODUCK_SIMULATOR_DIR: simulatorDir },
  });
  return { simulatorDir, actualCommit };
}

installPyodide();
const { simulatorDir, actualCommit } = installSimulator();
const pyodideVersion = JSON.parse(readFileSync(join(academyDir, 'node_modules', 'pyodide', 'package.json'), 'utf8')).version;
writeFileSync(join(academyDir, 'public', 'runtime-versions.json'), `${JSON.stringify({
  simulator: { repository: SIMULATOR_REPOSITORY, commit: actualCommit },
  pyodide: { version: pyodideVersion },
}, null, 2)}\n`);
console.log('运行时安装完成。下一步运行 npm run build && npm run academy。');
