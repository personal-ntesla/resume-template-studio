import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const catalogPath = path.resolve('src/data/catalog.ts');
const raw = await readFile(catalogPath, 'utf8');
const declaration = raw.match(/export const templates: ResumeTemplate\[\] =\s*/);
if (!declaration || declaration.index === undefined) throw new Error('Catalog declaration not found.');
const start = declaration.index + declaration[0].length;
const end = raw.indexOf('\n];\n\nexport const categoryOrder', start) + 2;
if (end < 2) throw new Error('Catalog end not found.');
const items = JSON.parse(raw.slice(start, end));
let missing = 0;
for (const item of items) {
  for (const page of item.pages) {
    try { await access(path.resolve('public', page.image)); } catch { missing += 1; console.error('Missing', page.image); }
  }
  try { await access(path.resolve('public', item.textBoxes)); } catch { missing += 1; console.error('Missing', item.textBoxes); }
}
console.log(`Checked ${items.length} templates / ${items.reduce((n, item) => n + item.pages.length, 0)} pages.`);
if (missing) process.exit(1);
