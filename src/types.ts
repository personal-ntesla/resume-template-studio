export type ResumeTemplate = {
  id: string;
  assetKey: string;
  name: string;
  sourceType: 'doc' | 'docx' | 'pdf' | string;
  sourceRelativePath: string;
  category: string;
  subCategory: string | null;
  categoryPath: string[];
  tags: string[];
  pageCount: number;
  pages: TemplatePage[];
  textBoxes: string;
  status: string;
};

export type TemplatePage = {
  number: number;
  image: string;
  widthPt: number;
  heightPt: number;
};

export type SourceWord = {
  text: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type SourceTextBoxes = {
  pages: Array<{
    page: number;
    width: number;
    height: number;
    words: SourceWord[];
  }>;
};

export type TextLine = {
  id: string;
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LineOverride = {
  text: string;
  fontSize: number;
  color: string;
  background: string;
  cover: boolean;
  bold: boolean;
};

export type ManualTextLayer = {
  id: string;
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  background: string;
  cover: boolean;
  bold: boolean;
};

export type ImageShape = 'rect' | 'rounded' | 'circle';
export type ImageRole = 'portrait' | 'image';
export type CropAnchor =
  | 'xMinYMin' | 'xMidYMin' | 'xMaxYMin'
  | 'xMinYMid' | 'xMidYMid' | 'xMaxYMid'
  | 'xMinYMax' | 'xMidYMax' | 'xMaxYMax';

export type ImageLayer = {
  id: string;
  page: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  /** "portrait" is a replacement for the personal photo already printed in the template image. */
  role?: ImageRole;
  /** Clip shape of the replacement image. Legacy drafts default to rect. */
  shape?: ImageShape;
  /** Which part of an uploaded image remains visible when it is cropped to the photo slot. */
  cropAnchor?: CropAnchor;
  fileName?: string;
};

export type ResumeDraft = {
  templateId: string;
  overrides: Record<string, LineOverride>;
  manualTextLayers: ManualTextLayer[];
  imageLayers: ImageLayer[];
  updatedAt: string;
};

export type EditorSelection =
  | { kind: 'source'; id: string }
  | { kind: 'manualText'; id: string }
  | { kind: 'image'; id: string }
  | null;
