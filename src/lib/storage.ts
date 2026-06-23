import type { ResumeDraft } from '../types';

const prefix = 'resume-template-studio:parsed:';

export function emptyDraft(templateId: string): ResumeDraft {
  return {
    templateId,
    overrides: {},
    manualTextLayers: [],
    imageLayers: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadDraft(templateId: string): ResumeDraft {
  try {
    const raw = localStorage.getItem(`${prefix}${templateId}`);
    if (!raw) return emptyDraft(templateId);
    const data = JSON.parse(raw) as ResumeDraft;
    if (data.templateId !== templateId) return emptyDraft(templateId);
    return {
      ...emptyDraft(templateId),
      ...data,
      overrides: data.overrides ?? {},
      manualTextLayers: data.manualTextLayers ?? [],
      imageLayers: data.imageLayers ?? [],
    };
  } catch {
    return emptyDraft(templateId);
  }
}

export function saveDraft(draft: ResumeDraft): void {
  try {
    localStorage.setItem(`${prefix}${draft.templateId}`, JSON.stringify(draft));
  } catch {
    // Browser storage may be full, especially after adding large photos.
  }
}

export function clearDraft(templateId: string): void {
  localStorage.removeItem(`${prefix}${templateId}`);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export async function readJsonFile(file: File): Promise<ResumeDraft> {
  const raw = await file.text();
  return JSON.parse(raw) as ResumeDraft;
}
