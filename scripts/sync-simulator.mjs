import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const academyDir = join(import.meta.dirname, '..');
const simulatorRoot = process.env.MICRODUCK_SIMULATOR_DIR
  ? process.env.MICRODUCK_SIMULATOR_DIR
  : join(academyDir, '..', 'simulator');
const simulatorDist = join(simulatorRoot, 'app', 'dist');
const publicDir = join(academyDir, 'public');

if (!existsSync(join(simulatorDist, 'index.html'))) {
  console.error(`找不到官方模拟器构建产物：${simulatorDist}`);
  console.error('请先运行 npm run setup:runtime，或设置 MICRODUCK_SIMULATOR_DIR。');
  process.exit(1);
}

for (const folder of ['bundle', 'policies', 'robot', 'assets']) {
  mkdirSync(join(publicDir, folder), { recursive: true });
  cpSync(join(simulatorDist, folder), join(publicDir, folder), { recursive: true, force: true });
}

const html = readFileSync(join(simulatorDist, 'index.html'), 'utf8');
const embeddedHtml = html.replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n    <base href="/" />');
for (const route of ['simulator', 'microduck-simulator']) {
  mkdirSync(join(publicDir, route), { recursive: true });
  writeFileSync(join(publicDir, route, 'index.html'), embeddedHtml);
}
console.log('官方 Microduck 模拟器资源已同步到 public/。');
console.log('嵌入课堂所需的 base 路径和稳定入口已经写入。');
