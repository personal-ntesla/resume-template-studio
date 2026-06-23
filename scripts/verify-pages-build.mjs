import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const indexPath = resolve(dist, 'index.html');
const cnamePath = resolve(dist, 'CNAME');

if (!existsSync(indexPath)) {
  throw new Error('找不到 dist/index.html。请先执行 bun run build。');
}

if (!existsSync(cnamePath)) {
  throw new Error('找不到 dist/CNAME。请检查 public/CNAME。');
}

const html = readFileSync(indexPath, 'utf8');
if (html.includes('src/main.tsx')) {
  throw new Error('dist/index.html 仍然引用 src/main.tsx。当前不是有效的 Vite 构建产物。');
}

if (!/\/assets\/index-[^"']+\.(?:js|css)/.test(html)) {
  throw new Error('dist/index.html 中未找到 Vite 构建后的 assets 引用。');
}

console.log('GitHub Pages 构建产物检查通过。');
