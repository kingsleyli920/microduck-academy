import { spawn } from 'node:child_process';
import { createServer, request as httpRequest } from 'node:http';
import { accessSync, createReadStream } from 'node:fs';
import { join } from 'node:path';

const projectDir = join(import.meta.dirname, '..');
const publicPort = 3210;
const appPort = 3211;
const publicUrl = `http://localhost:${publicPort}`;
let shuttingDown = false;

function openBrowser() {
  spawn('open', [publicUrl], { detached: true, stdio: 'ignore' }).unref();
}

function probe(port) {
  return new Promise((resolve) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path: '/', timeout: 500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function waitForApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await probe(appPort)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('课堂服务启动超时，请查看 academy/.academy.log');
}

async function stopEverything(server, response) {
  if (shuttingDown) return;
  shuttingDown = true;
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ stopped: true }));
  child?.kill('SIGTERM');
  setTimeout(() => server.close(() => process.exit(0)), 180);
  setTimeout(() => process.exit(0), 1_500);
}

if (await probe(publicPort)) {
  openBrowser();
  process.exit(0);
}

try {
  accessSync(join(projectDir, 'dist', 'server', 'wrangler.json'));
} catch {
  console.error('缺少构建产物。请先在 academy 目录运行 npm run build。');
  process.exit(1);
}

const child = spawn('npm', ['run', 'start', '--', '--port', String(appPort)], {
  cwd: projectDir,
  env: { ...process.env, BROWSER: 'none' },
  stdio: 'inherit',
});

child.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`课堂内部服务已退出（${code ?? 'unknown'}）。`);
    process.exit(code ?? 1);
  }
});

await waitForApp();

const server = createServer((incoming, outgoing) => {
  if (incoming.method === 'POST' && incoming.url === '/__shutdown') {
    void stopEverything(server, outgoing);
    return;
  }

  const pathname = new URL(incoming.url ?? '/', publicUrl).pathname;
  if (incoming.method === 'GET' && (pathname === '/microduck-simulator' || pathname === '/microduck-simulator/')) {
    outgoing.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    createReadStream(join(projectDir, 'public', 'microduck-simulator', 'index.html')).pipe(outgoing);
    return;
  }

  const proxy = httpRequest({
    hostname: '127.0.0.1',
    port: appPort,
    method: incoming.method,
    path: incoming.url,
    headers: { ...incoming.headers, host: `localhost:${appPort}` },
  }, (proxied) => {
    outgoing.writeHead(proxied.statusCode ?? 502, proxied.headers);
    proxied.pipe(outgoing);
  });
  proxy.on('error', () => {
    if (!outgoing.headersSent) outgoing.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    outgoing.end('课堂正在启动，请稍后刷新。');
  });
  incoming.pipe(proxy);
});

server.listen(publicPort, '127.0.0.1', () => {
  console.log(`Microduck 课堂已启动：${publicUrl}`);
  openBrowser();
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true;
    child?.kill('SIGTERM');
    server.close(() => process.exit(0));
  });
}
