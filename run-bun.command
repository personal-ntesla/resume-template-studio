#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v bun >/dev/null 2>&1; then
  echo "未检测到 Bun。请先安装 Bun 后重新运行。"
  exit 1
fi

bun install
bun run dev
