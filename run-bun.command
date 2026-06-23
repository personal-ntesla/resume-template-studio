#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v bun >/dev/null 2>&1; then
  echo "未找到 Bun。请先安装 Bun 1.3.14 或更高版本。"
  exit 1
fi
bun install
bun run dev
