import { useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl, cleanCategory } from '../lib/assets';
import { buildTextLines, initialFontSize, loadTextBoxes } from '../lib/layers';
import { clearDraft, downloadJson, emptyDraft, loadDraft, readJsonFile, saveDraft } from '../lib/storage';
import type { CropAnchor, EditorSelection, ImageLayer, ImageShape, LineOverride, ManualTextLayer, ResumeDraft, ResumeTemplate, TextLine } from '../types';
import { LayerInspector } from './LayerInspector';
import { PageSurface } from './PageSurface';

type EditorProps = {
  template: ResumeTemplate;
  onBack: () => void;
};

type PendingPortrait = { src: string; fileName: string; shape: ImageShape; cropAnchor: CropAnchor };

function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择。'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function Editor({ template, onBack }: EditorProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [draft, setDraft] = useState<ResumeDraft>(() => loadDraft(template.id));
  const [linesByPage, setLinesByPage] = useState<Map<number, TextLine[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState<EditorSelection>(null);
  const [filter, setFilter] = useState('');
  const [portraitShape, setPortraitShape] = useState<ImageShape>('circle');
  const [pendingPortrait, setPendingPortrait] = useState<PendingPortrait | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDraft(loadDraft(template.id));
    setSelection(null);
    setPageIndex(0);
    setPendingPortrait(null);
    loadTextBoxes(assetUrl(template.textBoxes))
      .then((data) => {
        if (!active) return;
        setLinesByPage(buildTextLines(data));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : '文本定位数据加载失败');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [template.id, template.textBoxes]);

  useEffect(() => {
    if (!loading) saveDraft({ ...draft, updatedAt: new Date().toISOString() });
  }, [draft, loading]);

  const page = template.pages[pageIndex];
  const lines = linesByPage.get(page?.number) ?? [];
  const selectedLine = selection?.kind === 'source' ? [...linesByPage.values()].flat().find((line) => line.id === selection.id) : undefined;
  const selectedManualText = selection?.kind === 'manualText' ? draft.manualTextLayers.find((layer) => layer.id === selection.id) : undefined;
  const selectedImage = selection?.kind === 'image' ? draft.imageLayers.find((layer) => layer.id === selection.id) : undefined;
  const currentPagePortraits = draft.imageLayers.filter((layer) => layer.page === page?.number && (layer.role ?? 'image') === 'portrait');

  const visibleLines = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return lines;
    return lines.filter((line) => line.text.toLowerCase().includes(keyword));
  }, [filter, lines]);

  function selectSourceLine(line: TextLine) {
    if (!draft.overrides[line.id]) {
      setDraft((current) => ({
        ...current,
        overrides: {
          ...current.overrides,
          [line.id]: {
            text: line.text,
            fontSize: initialFontSize(line),
            color: '#172033',
            background: '#ffffff',
            cover: true,
            bold: false,
          },
        },
      }));
    }
    setSelection({ kind: 'source', id: line.id });
  }

  function patchSource(patch: Partial<LineOverride>) {
    if (!selectedLine) return;
    setDraft((current) => ({
      ...current,
      overrides: { ...current.overrides, [selectedLine.id]: { ...current.overrides[selectedLine.id], ...patch } },
    }));
  }

  function addManualText() {
    const layer: ManualTextLayer = {
      id: id('text'), page: page.number, text: '填写文字', x: page.widthPt * 0.15, y: page.heightPt * 0.15,
      width: page.widthPt * 0.45, height: 18, fontSize: 14, color: '#172033', background: '#ffffff', cover: true, bold: false,
    };
    setDraft((current) => ({ ...current, manualTextLayers: [...current.manualTextLayers, layer] }));
    setSelection({ kind: 'manualText', id: layer.id });
  }

  function patchManualText(patch: Partial<ManualTextLayer>) {
    if (!selectedManualText) return;
    setDraft((current) => ({ ...current, manualTextLayers: current.manualTextLayers.map((layer) => layer.id === selectedManualText.id ? { ...layer, ...patch } : layer) }));
  }

  async function addImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const src = await readImageAsDataUrl(file);
      const layer: ImageLayer = {
        id: id('image'), page: page.number, src, x: page.widthPt * 0.69, y: page.heightPt * 0.08,
        width: page.widthPt * 0.2, height: page.heightPt * 0.24, radius: 10, role: 'image', shape: 'rounded', cropAnchor: 'xMidYMid', fileName: file.name,
      };
      setDraft((current) => ({ ...current, imageLayers: [...current.imageLayers, layer] }));
      setSelection({ kind: 'image', id: layer.id });
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : '图片添加失败。');
    } finally {
      event.target.value = '';
    }
  }

  async function choosePortrait(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const src = await readImageAsDataUrl(file);
      setPendingPortrait({ src, fileName: file.name, shape: portraitShape, cropAnchor: 'xMidYMid' });
      setSelection(null);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : '照片读取失败。');
    } finally {
      event.target.value = '';
    }
  }

  function createPortraitAt(area: { x: number; y: number; width: number; height: number }) {
    if (!pendingPortrait) return;
    const layer: ImageLayer = {
      id: id('portrait'), page: page.number, src: pendingPortrait.src, x: area.x, y: area.y, width: area.width, height: area.height,
      radius: pendingPortrait.shape === 'rounded' ? 12 : 0, role: 'portrait', shape: pendingPortrait.shape, cropAnchor: pendingPortrait.cropAnchor, fileName: pendingPortrait.fileName,
    };
    setDraft((current) => ({ ...current, imageLayers: [...current.imageLayers, layer] }));
    setPendingPortrait(null);
    setSelection({ kind: 'image', id: layer.id });
  }

  async function replaceSelectedImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const targetId = replaceTargetId;
    if (!file || !targetId) return;
    try {
      const src = await readImageAsDataUrl(file);
      setDraft((current) => ({
        ...current,
        imageLayers: current.imageLayers.map((layer) => layer.id === targetId ? { ...layer, src, fileName: file.name } : layer),
      }));
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : '图片替换失败。');
    } finally {
      setReplaceTargetId(null);
      event.target.value = '';
    }
  }

  function requestReplaceImage(targetId: string) {
    setReplaceTargetId(targetId);
    replaceInputRef.current?.click();
  }

  function patchImage(patch: Partial<ImageLayer>) {
    if (!selectedImage) return;
    setDraft((current) => ({ ...current, imageLayers: current.imageLayers.map((layer) => layer.id === selectedImage.id ? { ...layer, ...patch } : layer) }));
  }

  function restoreSource() {
    if (!selectedLine) return;
    setDraft((current) => {
      const overrides = { ...current.overrides };
      delete overrides[selectedLine.id];
      return { ...current, overrides };
    });
    setSelection(null);
  }

  function removeSelected() {
    if (!selection) return;
    setDraft((current) => {
      if (selection.kind === 'manualText') return { ...current, manualTextLayers: current.manualTextLayers.filter((layer) => layer.id !== selection.id) };
      if (selection.kind === 'image') return { ...current, imageLayers: current.imageLayers.filter((layer) => layer.id !== selection.id) };
      return current;
    });
    setSelection(null);
  }

  function resetDraft() {
    if (!window.confirm('将清除当前模板在此浏览器中的全部覆盖编辑内容，是否继续？')) return;
    clearDraft(template.id);
    setDraft(emptyDraft(template.id));
    setSelection(null);
    setPendingPortrait(null);
  }

  async function importDraft(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await readJsonFile(file);
      if (imported.templateId !== template.id) throw new Error('这份草稿不属于当前模板。');
      setDraft({ ...emptyDraft(template.id), ...imported });
      setSelection(null);
      setPendingPortrait(null);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : '草稿文件无法读取。');
    } finally {
      event.target.value = '';
    }
  }

  if (!page) return <main className="editor-error">此模板没有可展示页面。</main>;

  return (
    <main className="editor-shell">
      <header className="editor-topbar no-print">
        <button className="back-button" onClick={onBack}>← 返回模板库</button>
        <div className="editor-title"><span>COORDINATE EDITOR</span><strong>{template.name}</strong><small>{cleanCategory(template.category)} · {template.pageCount} 页</small></div>
        <div className="editor-actions">
          <button className="button" onClick={() => downloadJson(`${template.name}-草稿.json`, draft)}>导出草稿</button>
          <button className="button" onClick={() => importInputRef.current?.click()}>导入草稿</button>
          <button className="button button--primary" onClick={() => window.print()}>导出 PDF</button>
          <input ref={importInputRef} type="file" accept="application/json" hidden onChange={importDraft} />
        </div>
      </header>

      <section className="editor-workspace no-print">
        <aside className="editor-sidebar">
          <div className="template-context">
            <PageSurface page={template.pages[0]} compact />
            <div><span>当前真实模板</span><strong>{template.name}</strong><small>{template.sourceRelativePath}</small></div>
          </div>
          <div className="sidebar-actions">
            <button className="button button--wide" onClick={addManualText}>＋ 添加文字层</button>
            <button className="button button--wide" onClick={() => fileInputRef.current?.click()}>＋ 添加普通图片</button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={addImage} />
          </div>

          <div className="portrait-tool">
            <div className="portrait-tool__heading"><strong>个人照片替换</strong><span>{currentPagePortraits.length} 张</span></div>
            <p>模板原图中有样例证件照时，上传后在右侧页面拖拽框选原照片区域即可精准覆盖。</p>
            <label className="inspector-field portrait-tool__shape">
              <span>照片区域形状</span>
              <select value={portraitShape} disabled={Boolean(pendingPortrait)} onChange={(event) => setPortraitShape(event.target.value as ImageShape)}>
                <option value="circle">圆形 / 椭圆</option>
                <option value="rounded">圆角矩形</option>
                <option value="rect">直角矩形</option>
              </select>
            </label>
            {pendingPortrait ? (
              <div className="portrait-tool__pending"><strong>正在设置照片区域</strong><span>请在右侧页面拖拽框选原个人照片的位置。</span><button className="text-button" onClick={() => setPendingPortrait(null)}>取消替换</button></div>
            ) : (
              <button className="button button--primary button--wide" onClick={() => portraitInputRef.current?.click()}>替换模板中的个人照片</button>
            )}
            <input ref={portraitInputRef} type="file" accept="image/*" hidden onChange={choosePortrait} />
            <input ref={replaceInputRef} type="file" accept="image/*" hidden onChange={replaceSelectedImage} />
          </div>

          <label className="checkbox-field sidebar-checkbox"><input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} /> 显示解析文字与图片定位框</label>

          <div className="sidebar-section">
            <div className="sidebar-section__header"><strong>可编辑文字层</strong><span>{lines.length}</span></div>
            <input className="layer-filter" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选当前页文字" />
            <div className="layer-list">
              {visibleLines.map((line) => <button className={`layer-list__item ${selection?.kind === 'source' && selection.id === line.id ? 'is-active' : ''}`} key={line.id} onClick={() => selectSourceLine(line)}><span>{line.text || '空文字层'}</span><small>{line.x.toFixed(0)}, {line.y.toFixed(0)}</small></button>)}
            </div>
          </div>
          <div className="sidebar-footer"><button className="danger-button" onClick={resetDraft}>重置当前草稿</button></div>
        </aside>

        <section className="inspector-panel">
          <div className="panel-heading"><span>图层属性</span><small>修改会自动保存到当前浏览器</small></div>
          <LayerInspector
            selection={selection}
            sourceLine={selectedLine}
            override={selectedLine ? draft.overrides[selectedLine.id] : undefined}
            manualTextLayer={selectedManualText}
            imageLayer={selectedImage}
            onSourceChange={patchSource}
            onManualTextChange={patchManualText}
            onImageChange={patchImage}
            onImageReplace={() => selectedImage && requestReplaceImage(selectedImage.id)}
            onRestore={restoreSource}
            onRemove={removeSelected}
          />
          <div className="editor-note"><strong>图片替换说明</strong><p>个人照片会覆盖在模板原图指定区域上。选择圆形、圆角或矩形后拖拽框选，缩略图、编辑页和导出 PDF 都使用同一份图片图层数据。</p></div>
        </section>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div><strong>A4 页面预览</strong><span>{pendingPortrait ? '拖拽框选原照片区域；完成后可在左侧图层属性中继续微调。' : '点击页面文字可直接创建可编辑覆盖层。'}</span></div>
            <div className="page-switcher">
              <button disabled={pageIndex === 0 || Boolean(pendingPortrait)} onClick={() => { setPageIndex((value) => value - 1); setSelection(null); }}>←</button>
              <span>{pageIndex + 1} / {template.pages.length}</span>
              <button disabled={pageIndex === template.pages.length - 1 || Boolean(pendingPortrait)} onClick={() => { setPageIndex((value) => value + 1); setSelection(null); }}>→</button>
            </div>
          </div>
          {loading && <div className="canvas-loading">正在读取模板的文字定位数据…</div>}
          {error && <div className="canvas-error">{error}</div>}
          {!loading && !error && (
            <div className="canvas-scroll"><PageSurface page={page} lines={lines} overrides={draft.overrides} manualTextLayers={draft.manualTextLayers} imageLayers={draft.imageLayers} selectedLineId={selection?.kind === 'source' ? selection.id : null} selectedManualTextId={selection?.kind === 'manualText' ? selection.id : null} selectedImageId={selection?.kind === 'image' ? selection.id : null} showGuides={showGuides} interactive portraitPlacement={pendingPortrait ? { shape: pendingPortrait.shape } : null} onLineSelect={selectSourceLine} onManualTextSelect={(layer) => setSelection({ kind: 'manualText', id: layer.id })} onImageSelect={(layer) => setSelection({ kind: 'image', id: layer.id })} onPortraitAreaCreate={createPortraitAt} /></div>
          )}
        </section>
      </section>

      <section className="print-only">
        {template.pages.map((printPage) => <div className="print-page" key={printPage.number}><PageSurface page={printPage} lines={linesByPage.get(printPage.number) ?? []} overrides={draft.overrides} manualTextLayers={draft.manualTextLayers} imageLayers={draft.imageLayers} /></div>)}
      </section>
    </main>
  );
}
