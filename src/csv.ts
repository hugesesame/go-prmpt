import { cueSizeRange, fontSizePresets, newCue, newPage } from './defaults';
import { parseTimeOfDay } from './timeOfDay';
import type { Page } from './types';

/** 見出しに text（テキスト）の列が無い */
export class NoTextColumnError extends Error {}

type Column = 'text' | 'time' | 'page' | 'size' | 'trigger';

/** 見出しが無い CSV はこの順の列とみなす */
const columnOrder: Column[] = ['text', 'time', 'page', 'size', 'trigger'];

const columnNames: Record<string, Column> = {
  text: 'text',
  テキスト: 'text',
  time: 'time',
  時刻: 'time',
  page: 'page',
  ページ: 'page',
  size: 'size',
  サイズ: 'size',
  trigger: 'trigger',
  トリガー: 'trigger',
};

/** 読めなかったセル。row は Excel の行番号（見出しを含めて 1 から） */
export interface CsvWarning {
  row: number;
  column: 'time' | 'size' | 'trigger';
  value: string;
  /** 範囲外のサイズは範囲に収めて読む。そのときの値 */
  clampedTo?: number;
}

export interface CsvImport {
  pages: Page[];
  warnings: CsvWarning[];
}

/** 日本語版 Excel は CSV を Shift_JIS で保存するので、UTF-8 として読めなければ Shift_JIS で読む */
export function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('shift_jis').decode(buffer);
  }
}

/** CSV を行ごとのセルにする。"…" で囲んだセルの中のカンマ・改行・""（" 1 つ）もそのまま読む */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') cell += text[++i];
      else quoted = false;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** S / M / L か数値（% を付けてもよい）。空は null、読めなければ undefined */
function parseCueSize(text: string): number | null | undefined {
  const value = text.trim().toUpperCase();
  if (value === '') return null;
  if (value in fontSizePresets) return fontSizePresets[value as keyof typeof fontSizePresets];
  const match = /^(\d+(?:\.\d+)?)%?$/.exec(value);
  return match ? Number(match[1]) : undefined;
}

/** ON / OFF。空は null、読めなければ undefined */
function parseTrigger(text: string): boolean | null | undefined {
  const value = text.trim().toLowerCase();
  if (value === '') return null;
  if (['on', 'true', '1', 'yes', 'オン'].includes(value)) return true;
  if (['off', 'false', '0', 'no', 'オフ'].includes(value)) return false;
  return undefined;
}

/** 既存のページと同じ名前なら「名前 (2)」のように番号を付ける */
function uniqueName(name: string, taken: Set<string>) {
  let result = name;
  for (let n = 2; taken.has(result); n++) result = `${name} (${n})`;
  taken.add(result);
  return result;
}

/**
 * CSV の行から新しいページを作る。今あるページには手を加えない。
 * page が同じ行は 1 つのページにまとめ、page が空の行は 1 つ上の行と同じページに入れる。
 * page の列が無ければファイル名のページに入れる
 */
export function buildCsvImport(rows: string[][], fileName: string, existingPageNames: string[]): CsvImport {
  const header = rows[0]?.map((cell) => columnNames[cell.trim().toLowerCase()]);
  const hasHeader = header?.some(Boolean) ?? false;
  const columns = hasHeader ? header! : columnOrder;
  if (!columns.includes('text')) throw new NoTextColumnError();
  const indexOf = (column: Column) => columns.indexOf(column);

  const defaultPage = fileName.replace(/\.[^.]*$/, '') || 'CSV';
  const groups = new Map<string, Page['cues']>();
  const warnings: CsvWarning[] = [];
  let pageName = defaultPage;

  rows.forEach((cells, i) => {
    if (hasHeader && i === 0) return;
    if (cells.every((cell) => cell.trim() === '')) return;
    const row = i + 1;
    const get = (column: Column) => cells[indexOf(column)] ?? '';

    pageName = get('page').trim() || pageName;
    const cue = newCue(get('text').replace(/\r\n?/g, '\n').trim());

    const time = parseTimeOfDay(get('time'));
    if (time === undefined) warnings.push({ row, column: 'time', value: get('time').trim() });
    else cue.triggerAt = time;

    const size = parseCueSize(get('size'));
    if (size === undefined) {
      warnings.push({ row, column: 'size', value: get('size').trim() });
    } else if (size !== null) {
      cue.fontSize = Math.min(cueSizeRange.max, Math.max(cueSizeRange.min, size));
      if (cue.fontSize !== size) warnings.push({ row, column: 'size', value: get('size').trim(), clampedTo: cue.fontSize });
    }

    const trigger = parseTrigger(get('trigger'));
    if (trigger === undefined) warnings.push({ row, column: 'trigger', value: get('trigger').trim() });
    else if (trigger !== null) cue.triggerEnabled = trigger;

    const cues = groups.get(pageName) ?? [];
    cues.push(cue);
    groups.set(pageName, cues);
  });

  const taken = new Set(existingPageNames);
  const pages = [...groups].map(([name, cues]) => newPage(uniqueName(name, taken), cues));
  return { pages, warnings };
}
