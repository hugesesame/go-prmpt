import { defaultOutput, newCue, overlaySizes, uid } from './defaults';
import type { AfterLast, Overlay, Page, Show } from './types';

export class InvalidShowError extends Error {}

const fileTypes: FilePickerAcceptType[] = [
  { description: 'Prompter Show', accept: { 'application/json': ['.json'] } },
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
    cues: Array.isArray(p.cues) ? p.cues.map((c) => ({ ...newCue(), ...c })) : [],
  }));
  if (pages.length === 0) pages.push({ id: uid(), name: 'Page 1', afterLast: { kind: 'stop' }, cues: [] });

  return {
    version: 1,
    name: typeof raw.name === 'string' ? raw.name : 'Untitled Show',
    pages,
    // オーバーレイが無い古いファイルは空のリストで読む
    overlays: Array.isArray(raw.overlays) ? raw.overlays.flatMap(parseOverlay) : [],
    output: { ...defaultOutput, ...output },
  };
}

function parseOverlay(value: unknown): Overlay[] {
  const o = value as Partial<{ id: unknown; kind: unknown; seconds: unknown; text: unknown; blink: unknown; size: unknown }> | null;
  const id = typeof o?.id === 'string' ? o.id : uid();
  if (o?.kind === 'countdown') {
    const seconds = typeof o.seconds === 'number' && o.seconds >= 0 ? o.seconds : 0;
    return [{ id, kind: 'countdown', seconds, size: parseSize(o.size, 'countdown') }];
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
