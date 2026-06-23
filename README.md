# 简历模板工作台（Bun / GitHub Pages 完整部署版）

这个项目已包含真实解析模板资产、图片/个人照片替换、Bun 运行配置，以及 GitHub Pages 自动部署工作流。

## 1. 本地运行

要求：Bun 1.3.14 或更高版本。

```bash
bun install
bun run dev
```

浏览器访问终端显示的地址，通常为：

```text
http://localhost:5173
```

## 2. 本地验证生产构建

```bash
bun run build
bun run verify:pages
bun run preview
```

`verify:pages` 会确认 `dist/index.html` 已正确引用 `/assets/...` 构建文件，而不是源码入口 `/src/main.tsx`。

## 3. GitHub Pages 部署

项目已内置：

```text
.github/workflows/deploy.yml
```

工作流会执行：

```text
bun install → bun run build → 上传 dist → Deploy to GitHub Pages
```

请在 GitHub 仓库中保持：

```text
Settings → Pages → Source → GitHub Actions
```

不要选择 `GitHub Pages Jekyll` 或 `Static HTML` 的 `Configure`，也不要使用“Deploy from a branch”。

### 当前自定义域名

本项目默认保留：

```text
template.resumetemplate.cn
```

对应文件：

```text
public/CNAME
```

由于使用自定义域名，`vite.config.ts` 中必须保持：

```ts
base: '/'
```

如果你以后取消自定义域名，改用：

```text
https://<GitHub 用户名>.github.io/<仓库名>/
```

再把 `vite.config.ts` 改为：

```ts
base: '/<仓库名>/'
```

## 4. 覆盖旧项目

建议保留旧项目的 `.git` 目录，以便继续向同一个 GitHub 仓库推送：

```bash
# 在旧项目根目录执行
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# 解压本压缩包后，把 resume-template-studio-deployable-bun 内的所有内容复制到旧项目根目录
# Finder 会隐藏 .github；请确认复制了该隐藏目录。
```

然后执行：

```bash
bun install
bun run build
bun run verify:pages
git add -A
git commit -m "fix: deploy built Vite site to GitHub Pages"
git push origin main
```

若你的实际分支不是 `main`，请同时修改 `.github/workflows/deploy.yml` 的触发分支名。

## 5. 个人照片与其他图片替换

模板解析数据只有文字坐标，无法稳定自动识别 Word 内图片的精确位置。因此：

1. 点击“替换模板中的个人照片”；
2. 上传自己的照片；
3. 在页面上拖拽框选原照片位置；
4. 可选择圆形、圆角矩形、矩形；
5. 点击替换后的图片可继续调整坐标、尺寸和裁剪焦点；
6. 删除该图片图层即可恢复模板原图。

普通图片也可以通过“添加普通图片”添加、选中后再替换。

## 6. 重要说明

- 模板库缩略图、编辑器底图、导出 PDF 共用同一份解析页面图。
- 网站不能直接双击 `index.html` 用 `file://` 打开；必须使用 `bun run dev`、`bun run preview` 或 GitHub Pages。
- `.github` 是隐藏目录，Finder 默认不显示；终端可用 `ls -la` 检查。
