# Bun 运行说明

此项目只推荐 Bun：

```bash
bun install
bun run dev
```

第一次运行成功会生成 `bun.lock`。请提交此文件；GitHub Actions 会在存在 `bun.lock` 时使用 `bun install --frozen-lockfile`。

照片替换功能同样使用 Bun 开发环境：`bun run dev` 后，在编辑器左侧选择“替换模板中的个人照片”。
