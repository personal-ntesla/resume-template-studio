# Bun 使用说明

```bash
bun install
bun run dev
```

生产构建与 GitHub Pages 部署前检查：

```bash
bun run build
bun run verify:pages
```

首次 `bun install` 会生成 `bun.lock`。请把它一并提交：

```bash
git add bun.lock
git commit -m "chore: add Bun lockfile"
```

不要在该项目目录运行 `npm install`，以避免新增 `package-lock.json`。
