import { decodeCsv } from './csv';
import { defaultOutput, defaultTimecode, newCue, newPage, overlaySizes, uid } from './defaults';
import { formatTc, frameRates, parseTc } from './timecode';
import type { AfterLast, Cue, Overlay, Page, Show, TimecodeSettings } from './types';

export class InvalidShowError extends Error {}

const fileTypes: FilePickerAcceptType[] = [
  { description: 'GO PRMPT Show', accept: { 'application/json': ['.json'] } },
];

let fileHandle: FileSystemFileHandle | null = null;

export function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function resetFileHandle() {
  fileHandle = null;
}

/** 保存したファイル名を返す。上書き保存は前回のファイルへ書き込む */
export async function saveShowToFile(show: Show, saveAs: boolean): Promise<string> {
  if (!fileHandle || saveAs) {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `${show.name || 'show'}.json`,
      types: fileTypes,
    });
  }
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(show, null, 2));
  await writable.close();
  return fileHandle.name;
}

export async function openShowFromFile(): Promise<{ show: Show; fileName: string }> {
  const [handle] = await window.showOpenFilePicker({ types: fileTypes });
  const show = parseShow(await (await handle.getFile()).text());
  fileHandle = handle;
  return { show, fileName: handle.name };
}

/** CSV を選んで中身の文字列を返す。ショーのファイルとは別なので上書き保存先は変えない */
export async function openCsvFile(): Promise<{ text: string; fileName: string }> {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }],
  });
  const file = await handle.getFile();
  return { text: decodeCsv(await file.arrayBuffer()), fileName: file.name };
}

/** 読み込んだ JSON を検証し、欠けている項目は既定値で補う */
export function parseShow(text: string): Show {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new InvalidShowError();
  }
  if (!raw || !Array.isArray(raw.pages)) throw new InvalidShowError();

  // 旧形式のショー全体の文字サイズは捨てる（サイズを持たない Cue は M になる）
  const { fontSize: _legacyFontSize, ...output } = raw.output ?? {};

  const pages: Page[] = raw.pages.map((p: Partial<Page> & { autoAdvance?: boolean }, i: number) => ({
    id: typeof p.id === 'string' ? p.id : uid(),
    name: typeof p.name === 'string' ? p.name : `Page ${i + 1}`,
    afterLast: parseAfterLast(p.afterLast, p.autoAdvance),
    // 時刻トリガーが無かった頃のファイルはオンで読む
    timeTriggers: p.timeTriggers !== false,
    triggerSource: p.triggerSource === 'tc' ? 'tc' : 'clock',
    cues: Array.isArray(p.cues) ? p.cues.map(parseCue) : [],
  }));
  if (pages.length === 0) pages.push(newPage('Page 1'));

  return {
    version: 1,
    name: typeof raw.name === 'string' ? raw.name : 'Untitled Show',
    pages,
    // オーバーレイが無い古いファイルは空のリストで読む
    overlays: Array.isArray(raw.overlays) ? raw.overlays.flatMap(parseOverlay) : [],
    output: { ...defaultOutput, ...output },
    timecode: parseTimecodeSettings(raw.timecode),
  };
}

/** タイムコードが無かった頃のファイルは既定値（使わない）で読む */
function parseTimecodeSettings(value: unknown): TimecodeSettings {
  const v = value as Partial<TimecodeSettings> | undefined;
  const start = typeof v?.start === 'string' ? parseTc(v.start) : null;
  return {
    source: v?.source === 'mtc' || v?.source === 'ltc' || v?.source === 'internal' ? v.source : 'off',
    frameRate: frameRates.find((r) => r === v?.frameRate) ?? defaultTimecode.frameRate,
    start: start ? formatTc(start) : defaultTimecode.start,
  };
}

function parseCue(value: Partial<Cue>): Cue {
  const cue = { ...newCue(), ...value };
  const { triggerAt } = cue;
  const validTime = Number.isInteger(triggerAt) && triggerAt! >= 0 && triggerAt! < 24 * 60 * 60;
  const tc = typeof cue.tcAt === 'string' ? parseTc(cue.tcAt) : null;
  return {
    ...cue,
    triggerAt: validTime ? triggerAt : null,
    tcAt: tc ? formatTc(tc) : null,
    triggerEnabled: cue.triggerEnabled !== false,
  };
}

function parseOverlay(value: unknown): Overlay[] {
  const o = value as Partial<{
    id: unknown;
    kind: unknown;
    mode: unknown;
    seconds: unknown;
    until: unknown;
    text: unknown;
    blink: unknown;
    size: unknown;
  }> | null;
  const id = typeof o?.id === 'string' ? o.id : uid();
  if (o?.kind === 'countdown') {
    const seconds = typeof o.seconds === 'number' && o.seconds >= 0 ? o.seconds : 0;
    // 時刻まで数える設定が無かった頃のファイルは、長さを数えるカウントダウンとして読む
    const until = Number.isInteger(o.until) && (o.until as number) >= 0 && (o.until as number) < 24 * 60 * 60 ? (o.until as number) : null;
    const mode = o.mode === 'until' ? 'until' : 'length';
    return [{ id, kind: 'countdown', mode, seconds, until, size: parseSize(o.size, 'countdown') }];
  }
  if (o?.kind === 'message') {
    const text = typeof o.text === 'string' ? o.text : '';
    return [{ id, kind: 'message', text, blink: o.blink === true, size: parseSize(o.size, 'message') }];
  }
  return [];
}

/** 大きさが無い古いデータは既定値、範囲外は範囲に収める */
function parseSize(value: unknown, kind: Overlay['kind']): number {
  const { min, max, default: fallback } = overlaySizes[kind];
  return typeof value === 'number' ? Math.min(max, Math.max(min, value)) : fallback;
}

/** 旧形式の autoAdvance（true で次のページへ）も読めるようにする */
function parseAfterLast(value: unknown, autoAdvance?: boolean): AfterLast {
  const v = value as Partial<{ kind: string; pageId: unknown }> | undefined;
  if (v?.kind === 'next') return { kind: 'next' };
  if (v?.kind === 'page' && typeof v.pageId === 'string') return { kind: 'page', pageId: v.pageId };
  if (v?.kind === 'stop') return { kind: 'stop' };
  return autoAdvance ? { kind: 'next' } : { kind: 'stop' };
}
