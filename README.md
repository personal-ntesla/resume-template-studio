# 简历模板大全在线生成简历（真实解析结果版 · Bun）

这是根据 `resume-template-export.zip` 生成的纯前端项目。当前内置 **293 套**文档模板与 **679 张**解析页面图。

## 本版工作方式

- 模板库缩略图直接使用对应模板的真实解析页面。
- 打开模板后，编辑页默认使用同一份页面底图；不会再按“文艺 / 简约”等分类跳转到通用简历样式。
- 点击原模板中的文字，可在相同坐标处创建覆盖文字层；支持修改文字、字号、颜色、底色及图片图层。
- 支持多页模板、浏览器本地草稿、JSON 导入导出和浏览器打印为 PDF。
- 项目使用 **Bun** 管理依赖、运行开发服务、构建并部署 GitHub Pages。

> 当前解析结果尚未提供标准语义字段映射，因此本版采用“坐标图层编辑”，而不是假装已能自动识别姓名、电话、工作经历等字段。

## 环境要求

- Bun `1.3.14` 或更高版本
- macOS、Windows、Linux 均可运行

确认版本：

```bash
bun --version
```

## 首次启动

> 请解压到一个**新的目录**后再执行。此项目不包含 `package-lock.json`，不要运行 `npm install`。

```bash
cd /你的路径/resume-template-studio-parsed-library-bun
bun install
bun run dev
```

浏览器访问终端显示的地址，通常是：

```text
http://localhost:5173
```

macOS 也可双击 `run-bun.command` 启动；首次双击前如被系统拦截，可在终端执行：

```bash
xattr -dr com.apple.quarantine .
chmod +x run-bun.command
./run-bun.command
```

## 常用命令

```bash
# 启动开发环境
bun run dev

# 类型检查
bun run typecheck

# 校验解析后的页面图和文字框数据是否齐全
bun run check:assets

# 构建生产版本
bun run build

# 本地预览生产构建
bun run preview
```

## 若安装停在不动

本项目已使用 `.bunfig.toml` 固定 npm 官方仓库，正常情况下只需等待依赖下载完成。

若你曾在此目录执行过 npm、pnpm 或旧版 Bun 安装，请先清理再安装：

```bash
rm -rf node_modules package-lock.json pnpm-lock.yaml bun.lockb
bun install --verbose
```

不要删除 `bun.lock`；第一次 `bun install` 成功后会生成它，请一并提交到 Git 仓库。

## GitHub Pages

项目内的 `.github/workflows/deploy.yml` 已改为 Bun 构建流程。

首次本地安装完成后，提交 Bun 锁文件并推送：

```bash
git add bun.lock package.json .bunfig.toml .github/workflows/deploy.yml
git commit -m "chore: use bun"
git push
```

进入 GitHub 仓库：

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

推送到 `main` 后会自动执行：

```text
bun install → bun run build → Deploy GitHub Pages
```

## 重要限制

- 当前解析包只包含 DOC / DOCX / PDF 的解析结果；没有独立 JPG/PNG 或 PSD 的模板记录，因此暂不展示这些类别。
- 复杂彩色背景、图片内嵌文字、曲线字和渐变字不能可靠地自动替换。可通过新增文字层或图片层手工覆盖。
- 真正的“结构化表单编辑”需要解析阶段继续输出字段语义、字段分组和去文字背景图。

## 个人照片替换

当模板原页面中存在样例证件照或个人头像时，使用编辑器左侧的 **“替换模板中的个人照片”**：

1. 选择新的照片；
2. 选择圆形、圆角矩形或直角矩形；
3. 在右侧页面上拖拽框选原照片所在区域；
4. 后续可点击新照片，在“图层属性”中微调位置、尺寸、裁切焦点与显示形状；
5. 点击“恢复原模板照片”会删除覆盖层，恢复解析页面中的原始样例照片。

页面缩略图、编辑器与导出 PDF 共享同一套图片图层数据。当前解析结果没有携带 DOCX 图片坐标，因此首次使用某个模板时需要人工框选一次个人照片区域；框选结果会随草稿保存在浏览器并可通过“导出草稿”复用。
