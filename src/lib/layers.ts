import type { SourceTextBoxes, SourceWord, TextLine } from '../types';

function gapText(previous: SourceWord, current: SourceWord): string {
  const gap = current.xMin - previous.xMax;
  const previousAscii = /[A-Za-z0-9@._-]$/.test(previous.text);
  const currentAscii = /^[A-Za-z0-9@._-]/.test(current.text);
  const referenceHeight = Math.max(6, Math.min(previous.yMax - previous.yMin, current.yMax - current.yMin));
  return previousAscii && currentAscii && gap > Math.max(1.6, referenceHeight * 0.14) ? ' ' : '';
}

function splitRowIntoSegments(words: SourceWord[]): SourceWord[][] {
  if (words.length === 0) return [];
  const segments: SourceWord[][] = [[words[0]]];
  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1];
    const current = words[index];
    const gap = current.xMin - previous.xMax;
    const height = Math.max(6, Math.min(previous.yMax - previous.yMin, current.yMax - current.yMin));
    const shouldSplit = gap > Math.max(22, height * 4.6);
    if (shouldSplit) segments.push([current]);
    else segments[segments.length - 1].push(current);
  }
  return segments;
}

export function buildTextLines(source: SourceTextBoxes): Map<number, TextLine[]> {
  const result = new Map<number, TextLine[]>();
  source.pages.forEach((page) => {
    const words = page.words
      .filter((word) => word.text.trim().length > 0)
      .slice()
      .sort((left, right) => (left.yMin - right.yMin) || (left.xMin - right.xMin));

    const rows: SourceWord[][] = [];
    words.forEach((word) => {
      const centerY = (word.yMin + word.yMax) / 2;
      const height = Math.max(6, word.yMax - word.yMin);
      const row = rows.find((candidate) => {
        const sample = candidate[Math.floor(candidate.length / 2)];
        const sampleCenter = (sample.yMin + sample.yMax) / 2;
        const threshold = Math.max(3.6, Math.min(height, sample.yMax - sample.yMin) * 0.42);
        return Math.abs(sampleCenter - centerY) <= threshold;
      });
      if (row) row.push(word);
      else rows.push([word]);
    });

    const lines: TextLine[] = [];
    rows.forEach((row) => {
      const sorted = row.slice().sort((left, right) => left.xMin - right.xMin);
      splitRowIntoSegments(sorted).forEach((segment) => {
        const first = segment[0];
        const last = segment[segment.length - 1];
        const text = segment.reduce((value, current, index) => {
          if (index === 0) return current.text;
          return `${value}${gapText(segment[index - 1], current)}${current.text}`;
        }, '');
        lines.push({
          id: `p${page.page}-l${lines.length + 1}`,
          page: page.page,
          text,
          x: first.xMin,
          y: Math.min(...segment.map((word) => word.yMin)),
          width: Math.max(4, last.xMax - first.xMin),
          height: Math.max(...segment.map((word) => word.yMax - word.yMin)),
        });
      });
    });
    result.set(page.page, lines);
  });
  return result;
}

export function initialFontSize(line: TextLine): number {
  return Math.max(7, Math.min(34, Number((line.height * 0.88).toFixed(1))));
}

export async function loadTextBoxes(url: string): Promise<SourceTextBoxes> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法加载文本定位数据：${response.status}`);
  return response.json() as Promise<SourceTextBoxes>;
}
