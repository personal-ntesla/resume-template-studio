import type { CropAnchor, EditorSelection, ImageLayer, ImageShape, LineOverride, ManualTextLayer, TextLine } from '../types';
import { initialFontSize } from '../lib/layers';

type LayerInspectorProps = {
  selection: EditorSelection;
  sourceLine?: TextLine;
  override?: LineOverride;
  manualTextLayer?: ManualTextLayer;
  imageLayer?: ImageLayer;
  onSourceChange: (patch: Partial<LineOverride>) => void;
  onManualTextChange: (patch: Partial<ManualTextLayer>) => void;
  onImageChange: (patch: Partial<ImageLayer>) => void;
  onImageReplace: () => void;
  onRestore: () => void;
  onRemove: () => void;
};

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="inspector-field">
      <span>{label}</span>
      <div className="range-value"><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><output>{value.toFixed(step < 1 ? 1 : 0)}</output></div>
    </label>
  );
}

function TextAppearance({ value, onChange }: { value: { fontSize: number; color: string; background: string; cover: boolean; bold: boolean }; onChange: (patch: Partial<LineOverride>) => void }) {
  return (
    <>
      <NumberField label="字号" value={value.fontSize} min={7} max={48} step={0.5} onChange={(fontSize) => onChange({ fontSize })} />
      <label className="inspector-field">
        <span>文字颜色</span>
        <input type="color" value={value.color} onChange={(event) => onChange({ color: event.target.value })} />
      </label>
      <label className="inspector-field">
        <span>遮盖底色</span>
        <input type="color" value={value.background} onChange={(event) => onChange({ background: event.target.value })} />
      </label>
      <label className="checkbox-field"><input type="checkbox" checked={value.cover} onChange={(event) => onChange({ cover: event.target.checked })} /> 覆盖原始文字</label>
      <label className="checkbox-field"><input type="checkbox" checked={value.bold} onChange={(event) => onChange({ bold: event.target.checked })} /> 加粗</label>
    </>
  );
}

const cropAnchors: Array<{ value: CropAnchor; label: string }> = [
  { value: 'xMinYMin', label: '左上' }, { value: 'xMidYMin', label: '上方居中' }, { value: 'xMaxYMin', label: '右上' },
  { value: 'xMinYMid', label: '左侧居中' }, { value: 'xMidYMid', label: '正中' }, { value: 'xMaxYMid', label: '右侧居中' },
  { value: 'xMinYMax', label: '左下' }, { value: 'xMidYMax', label: '下方居中' }, { value: 'xMaxYMax', label: '右下' },
];

export function LayerInspector({ selection, sourceLine, override, manualTextLayer, imageLayer, onSourceChange, onManualTextChange, onImageChange, onImageReplace, onRestore, onRemove }: LayerInspectorProps) {
  if (!selection) return <div className="inspector-empty">点击页面文字可修改对应文字。模板中需要替换的个人照片，请使用左侧“替换个人照片”后，在页面中拖拽框选照片区域。</div>;

  if (selection.kind === 'source' && sourceLine) {
    const current: LineOverride = override ?? {
      text: sourceLine.text,
      fontSize: initialFontSize(sourceLine),
      color: '#172033',
      background: '#ffffff',
      cover: true,
      bold: false,
    };
    return (
      <div className="inspector-form">
        <div className="inspector-heading"><span>解析文字层</span><button className="text-button" onClick={onRestore}>还原原文</button></div>
        <p className="inspector-hint">第 {sourceLine.page} 页 · 坐标 {sourceLine.x.toFixed(1)}, {sourceLine.y.toFixed(1)}</p>
        <label className="inspector-field"><span>文字内容</span><textarea value={current.text} onChange={(event) => onSourceChange({ text: event.target.value })} rows={5} /></label>
        <TextAppearance value={current} onChange={onSourceChange} />
      </div>
    );
  }

  if (selection.kind === 'manualText' && manualTextLayer) {
    return (
      <div className="inspector-form">
        <div className="inspector-heading"><span>自定义文字层</span><button className="danger-button" onClick={onRemove}>删除</button></div>
        <label className="inspector-field"><span>文字内容</span><textarea value={manualTextLayer.text} onChange={(event) => onManualTextChange({ text: event.target.value })} rows={5} /></label>
        <TextAppearance value={manualTextLayer} onChange={(patch) => onManualTextChange(patch)} />
        <NumberField label="横向位置" value={manualTextLayer.x} min={0} max={595} step={1} onChange={(x) => onManualTextChange({ x })} />
        <NumberField label="纵向位置" value={manualTextLayer.y} min={0} max={842} step={1} onChange={(y) => onManualTextChange({ y })} />
        <NumberField label="文本区域宽度" value={manualTextLayer.width} min={20} max={595} step={1} onChange={(width) => onManualTextChange({ width })} />
      </div>
    );
  }

  if (selection.kind === 'image' && imageLayer) {
    const isPortrait = (imageLayer.role ?? 'image') === 'portrait';
    const shape = imageLayer.shape ?? 'rect';
    const cropAnchor = imageLayer.cropAnchor ?? 'xMidYMid';
    return (
      <div className="inspector-form">
        <div className="inspector-heading"><span>{isPortrait ? '个人照片替换层' : '图片图层'}</span><button className="danger-button" onClick={onRemove}>{isPortrait ? '恢复原模板照片' : '删除'}</button></div>
        <p className="inspector-hint">{isPortrait ? '当前图片覆盖在模板原照片位置上；删除后即可恢复模板原始照片。' : '可用于添加图标、作品图或其他附加图片。'}</p>
        <button className="button button--wide" onClick={onImageReplace}>{isPortrait ? '更换个人照片' : '更换图片'}</button>
        <label className="inspector-field">
          <span>图片裁切定位</span>
          <select value={cropAnchor} onChange={(event) => onImageChange({ cropAnchor: event.target.value as CropAnchor })}>
            {cropAnchors.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="inspector-field">
          <span>显示形状</span>
          <select value={shape} onChange={(event) => onImageChange({ shape: event.target.value as ImageShape })}>
            <option value="rect">直角矩形</option>
            <option value="rounded">圆角矩形</option>
            <option value="circle">圆形 / 椭圆</option>
          </select>
        </label>
        <NumberField label="横向位置" value={imageLayer.x} min={0} max={595} step={1} onChange={(x) => onImageChange({ x })} />
        <NumberField label="纵向位置" value={imageLayer.y} min={0} max={842} step={1} onChange={(y) => onImageChange({ y })} />
        <NumberField label="宽度" value={imageLayer.width} min={10} max={595} step={1} onChange={(width) => onImageChange({ width })} />
        <NumberField label="高度" value={imageLayer.height} min={10} max={842} step={1} onChange={(height) => onImageChange({ height })} />
        {shape === 'rounded' && <NumberField label="圆角" value={imageLayer.radius} min={0} max={48} step={1} onChange={(radius) => onImageChange({ radius })} />}
      </div>
    );
  }

  return <div className="inspector-empty">当前图层不可用。</div>;
}
