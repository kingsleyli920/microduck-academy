#!/bin/zsh
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "需要 Node.js 22 或更新版本" message "请先安装 Node.js，然后重新双击启动。"'
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if (( node_major < 22 )); then
  osascript -e 'display alert "Node.js 版本过旧" message "Microduck Academy 需要 Node.js 22 或更新版本。"'
  exit 1
fi

if [[ ! -d node_modules || ! -f public/pyodide/pyodide.js || ! -f public/microduck-simulator/index.html || ! -f dist/server/wrangler.json ]]; then
  osascript -e 'display alert "首次安装尚未完成" message "请在终端进入项目目录，依次运行 npm ci、npm run setup:runtime 和 npm run build。"'
  exit 1
fi

nohup node scripts/server-control.mjs >> .academy.log 2>&1 </dev/null &
