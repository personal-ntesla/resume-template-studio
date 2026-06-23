import { useMemo, useRef, useState } from 'react';
import type { CropAnchor, ImageLayer, ImageShape, LineOverride, ManualTextLayer, TemplatePage, TextLine } from '../types';
import { assetUrl } from '../lib/assets';

type DrawArea = { x: number; y: number; width: number; height: number };

type PageSurfaceProps = {
  page: TemplatePage;
  lines?: TextLine[];
  overrides?: Record<string, LineOverride>;
  manualTextLayers?: ManualTextLayer[];
  imageLayers?: ImageLayer[];
  selectedLineId?: string | null;
  selectedManualTextId?: string | null;
  selectedImageId?: string | null;
  showGuides?: boolean;
  interactive?: boolean;
  compact?: boolean;
  portraitPlacement?: { shape: ImageShape } | null;
  onLineSelect?: (line: TextLine) => void;
  onManualTextSelect?: (layer: ManualTextLayer) => void;
  onImageSelect?: (layer: ImageLayer) => void;
  onPortraitAreaCreate?: (area: DrawArea) => void;
};

function lineTspans(text: string, x: number, fontSize: number) {
  return text.split(/\n/).map((part, index) => (
    <tspan key={`${part}-${index}`} x={x} dy={index === 0 ? 0 : fontSize * 1.12}>{part || ' '}</tspan>
  ));
}

function effectiveShape(layer: ImageLayer): ImageShape {
  return layer.shape ?? 'rect';
}

function effectiveCropAnchor(layer: ImageLayer): CropAnchor {
  return layer.cropAnchor ?? 'xMidYMid';
}

function imageClipPath(layer: ImageLayer, clipId: string) {
  const shape = effectiveShape(layer);
  if (shape === 'circle') {
    return <clipPath id={clipId}><ellipse cx={layer.x + layer.width / 2} cy={layer.y + layer.height / 2} rx={layer.width / 2} ry={layer.height / 2} /></clipPath>;
  }
  if (shape === 'rounded') {
    return <clipPath id={clipId}><rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} rx={Math.min(layer.radius || 10, layer.width / 2, layer.height / 2)} /></clipPath>;
  }
  return <clipPath id={clipId}><rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} /></clipPath>;
}

function guideShape(layer: ImageLayer) {
  const shape = effectiveShape(layer);
  if (shape === 'circle') return <ellipse className="page-surface__guide page-surface__guide--image" cx={layer.x + layer.width / 2} cy={layer.y + layer.height / 2} rx={layer.width / 2} ry={layer.height / 2} />;
  return <rect className="page-surface__guide page-surface__guide--image" x={layer.x} y={layer.y} width={layer.width} height={layer.height} rx={shape === 'rounded' ? Math.min(layer.radius || 10, layer.width / 2, layer.height / 2) : 0} />;
}

function previewShape(area: DrawArea, shape: ImageShape) {
  if (shape === 'circle') return <ellipse className="page-surface__portrait-preview" cx={area.x + area.width / 2} cy={area.y + area.height / 2} rx={area.width / 2} ry={area.height / 2} />;
  return <rect className="page-surface__portrait-preview" x={area.x} y={area.y} width={area.width} height={area.height} rx={shape === 'rounded' ? Math.min(12, area.width / 2, area.height / 2) : 0} />;
}

export function PageSurface({
  page,
  lines = [],
  overrides = {},
  manualTextLayers = [],
  imageLayers = [],
  selectedLineId = null,
  selectedManualTextId = null,
  selectedImageId = null,
  showGuides = false,
  interactive = false,
  compact = false,
  portraitPlacement = null,
  onLineSelect,
  onManualTextSelect,
  onImageSelect,
  onPortraitAreaCreate,
}: PageSurfaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawArea, setDrawArea] = useState<DrawArea | null>(null);

  const editableOverrides = useMemo(() => lines
    .map((line) => ({ line, override: overrides[line.id] }))
    .filter((item): item is { line: TextLine; override: LineOverride } => Boolean(item.override)), [lines, overrides]);

  function getPoint(event: React.PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? svgRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(page.widthPt, ((event.clientX - bounds.left) / bounds.width) * page.widthPt)),
      y: Math.max(0, Math.min(page.heightPt, ((event.clientY - bounds.top) / bounds.height) * page.heightPt)),
    };
  }

  function makeArea(start: { x: number; y: number }, end: { x: number; y: number }): DrawArea {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  function beginPortraitDraw(event: React.PointerEvent<SVGRectElement>) {
    if (!portraitPlacement) return;
    const point = getPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawStart(point);
    setDrawArea({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  function movePortraitDraw(event: React.PointerEvent<SVGRectElement>) {
    if (!drawStart || !portraitPlacement) return;
    setDrawArea(makeArea(drawStart, getPoint(event)));
  }

  function finishPortraitDraw(event: React.PointerEvent<SVGRectElement>) {
    if (!drawStart || !portraitPlacement) return;
    const area = makeArea(drawStart, getPoint(event));
    setDrawStart(null);
    setDrawArea(null);
    if (area.width < 16 || area.height < 16) return;
    onPortraitAreaCreate?.(area);
  }

  const imageLayersOnPage = imageLayers.filter((layer) => layer.page === page.number);

  return (
    <div className={`page-surface ${compact ? 'page-surface--compact' : ''} ${portraitPlacement ? 'page-surface--placing-portrait' : ''}`} style={{ aspectRatio: `${page.widthPt} / ${page.heightPt}` }}>
      <img className="page-surface__background" src={assetUrl(page.image)} alt="模板页面预览" loading={compact ? 'lazy' : 'eager'} />
      {!compact && (
        <svg
          ref={svgRef}
          className="page-surface__overlay"
          viewBox={`0 0 ${page.widthPt} ${page.heightPt}`}
          preserveAspectRatio="none"
          aria-label="可编辑模板图层"
        >
          <defs>
            {imageLayersOnPage.map((layer) => imageClipPath(layer, `clip-${layer.id}`))}
          </defs>

          {imageLayersOnPage.map((layer) => (
            <g key={layer.id} onClick={() => !portraitPlacement && onImageSelect?.(layer)} className="page-surface__image-layer">
              <image
                href={layer.src}
                x={layer.x}
                y={layer.y}
                width={layer.width}
                height={layer.height}
                preserveAspectRatio={`${effectiveCropAnchor(layer)} slice`}
                clipPath={`url(#clip-${layer.id})`}
              />
              {(showGuides || selectedImageId === layer.id) && guideShape(layer)}
            </g>
          ))}

          {editableOverrides.map(({ line, override }) => {
            const padding = Math.max(1.4, line.height * 0.1);
            const baseline = line.y + Math.min(line.height * 0.92, override.fontSize);
            return (
              <g key={line.id}>
                {override.cover && (
                  <rect
                    x={line.x - padding}
                    y={line.y - padding}
                    width={line.width + padding * 2}
                    height={Math.max(line.height + padding * 2, override.fontSize * 1.35)}
                    fill={override.background}
                  />
                )}
                <text
                  x={line.x}
                  y={baseline}
                  fill={override.color}
                  fontSize={override.fontSize}
                  fontWeight={override.bold ? 700 : 400}
                  fontFamily="Arial, 'Microsoft YaHei', 'PingFang SC', sans-serif"
                >
                  {lineTspans(override.text, line.x, override.fontSize)}
                </text>
              </g>
            );
          })}

          {manualTextLayers.filter((layer) => layer.page === page.number).map((layer) => {
            const padding = Math.max(1.4, layer.height * 0.08);
            const baseline = layer.y + Math.min(layer.height * 0.92, layer.fontSize);
            return (
              <g key={layer.id} onClick={() => !portraitPlacement && onManualTextSelect?.(layer)} className="page-surface__manual-text">
                {layer.cover && (
                  <rect
                    x={layer.x - padding}
                    y={layer.y - padding}
                    width={layer.width + padding * 2}
                    height={Math.max(layer.height + padding * 2, layer.fontSize * 1.35)}
                    fill={layer.background}
                  />
                )}
                <text
                  x={layer.x}
                  y={baseline}
                  fill={layer.color}
                  fontSize={layer.fontSize}
                  fontWeight={layer.bold ? 700 : 400}
                  fontFamily="Arial, 'Microsoft YaHei', 'PingFang SC', sans-serif"
                >
                  {lineTspans(layer.text, layer.x, layer.fontSize)}
                </text>
                {(showGuides || selectedManualTextId === layer.id) && (
                  <rect className="page-surface__guide page-surface__guide--manual" x={layer.x - padding} y={layer.y - padding} width={layer.width + padding * 2} height={Math.max(layer.height + padding * 2, layer.fontSize * 1.35)} />
                )}
              </g>
            );
          })}

          {interactive && !portraitPlacement && lines.map((line) => (
            <rect
              key={line.id}
              className={`page-surface__hitbox ${selectedLineId === line.id || showGuides ? 'page-surface__hitbox--visible' : ''}`}
              x={line.x - 1.5}
              y={line.y - 1.5}
              width={line.width + 3}
              height={Math.max(line.height + 3, 12)}
              onClick={() => onLineSelect?.(line)}
            />
          ))}

          {portraitPlacement && (
            <>
              <rect
                className="page-surface__portrait-capture"
                x={0}
                y={0}
                width={page.widthPt}
                height={page.heightPt}
                onPointerDown={beginPortraitDraw}
                onPointerMove={movePortraitDraw}
                onPointerUp={finishPortraitDraw}
              />
              {drawArea && previewShape(drawArea, portraitPlacement.shape)}
              <text className="page-surface__portrait-help" x={page.widthPt / 2} y={28} textAnchor="middle">拖拽框选原个人照片的位置</text>
            </>
          )}
        </svg>
      )}
    </div>
  );
}
