import { useMemo, useState } from 'react';
import { categoryOrder, templates } from '../data/catalog';
import { cleanCategory } from '../lib/assets';
import type { ResumeTemplate } from '../types';
import { PageSurface } from './PageSurface';

type GalleryProps = {
  onOpen: (template: ResumeTemplate) => void;
};

export function Gallery({ onOpen }: GalleryProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [pages, setPages] = useState('全部');
  const [sourceType, setSourceType] = useState('全部');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchKeyword = !keyword || [template.name, template.category, template.subCategory ?? '', template.tags.join(' ')].join(' ').toLowerCase().includes(keyword);
      const matchCategory = category === '全部' || template.category === category;
      const matchPages = pages === '全部' || String(template.pageCount) === pages;
      const matchType = sourceType === '全部' || template.sourceType.toUpperCase() === sourceType;
      return matchKeyword && matchCategory && matchPages && matchType;
    });
  }, [query, category, pages, sourceType]);

  const pageOptions = [...new Set(templates.map((template) => template.pageCount))].sort((left, right) => left - right);
  const sourceOptions = [...new Set(templates.map((template) => template.sourceType.toUpperCase()))].sort();

  return (
    <main className="gallery-shell">
      <header className="gallery-hero">
        <div>
          <span className="eyebrow">PARSED TEMPLATE LIBRARY</span>
          <h1>简历模板大全在线生成简历</h1>
          <p>已载入 {templates.length} 套真实文档渲染模板。缩略图与编辑页使用同一份解析页面底图，不再跳转到通用紫色简历。</p>
        </div>
        <div className="gallery-hero__stats">
          <strong>{templates.length}</strong>
          <span>已解析模板</span>
          <small>DOC / DOCX / PDF</small>
        </div>
      </header>

      <section className="gallery-toolbar" aria-label="模板筛选">
        <label className="search-field">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板名称、风格、行业" />
        </label>
        <div className="filter-row">
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="全部">全部分类</option>
            {categoryOrder.map((item) => <option value={item} key={item}>{cleanCategory(item)}</option>)}
          </select>
          <select value={pages} onChange={(event) => setPages(event.target.value)}>
            <option value="全部">全部页数</option>
            {pageOptions.map((item) => <option value={String(item)} key={item}>{item} 页</option>)}
          </select>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
            <option value="全部">全部来源</option>
            {sourceOptions.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="gallery-meta">
        <span>显示 <strong>{filtered.length}</strong> 套模板</span>
        <span>选择任一模板后，可直接在真实页面坐标上覆盖文字与图片。</span>
      </section>

      <section className="template-grid">
        {filtered.map((template) => (
          <article className="template-card" key={template.id}>
            <button className="template-card__preview" onClick={() => onOpen(template)} aria-label={`打开 ${template.name}`}>
              <PageSurface page={template.pages[0]} compact />
              <span className="template-card__pages">{template.pageCount} 页</span>
            </button>
            <div className="template-card__body">
              <p className="template-card__category">{cleanCategory(template.category)}{template.subCategory ? ` · ${template.subCategory}` : ''}</p>
              <h2>{template.name}</h2>
              <p className="template-card__path" title={template.sourceRelativePath}>{template.sourceRelativePath}</p>
              <div className="tag-row">
                {template.tags.slice(0, 2).map((tag) => <span key={tag}>{cleanCategory(tag)}</span>)}
              </div>
              <button className="button button--primary" onClick={() => onOpen(template)}>按原样打开编辑器</button>
            </div>
          </article>
        ))}
      </section>
      {filtered.length === 0 && <div className="empty-state">没有找到匹配的模板。</div>}
    </main>
  );
}
