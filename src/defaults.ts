import type { Cue, OutputSettings, Overlay, Page, Show } from './types';

export const uid = () => crypto.randomUUID();

export const defaultOutput: OutputSettings = {
  background: '#000000',
  textColor: '#ffffff',
  outlineEnabled: true,
  outlineWidth: 0,
  outlineColor: '#000000',
  transition: 'dissolve',
  transitionMs: 500,
};

export const fontSizePresets = { S: 15, M: 20, L: 25 } as const;
/** Cue の文字サイズ（出力画面の高さに対する %）の範囲 */
export const cueSizeRange = { min: 5, max: 40 } as const;

export function newCue(text = ''): Cue {
  return {
    id: uid(),
    text,
    duration: 0,
    countdown: false,
    fontSize: fontSizePresets.M,
    triggerAt: null,
    triggerEnabled: true,
  };
}

export function newPage(name: string, cues: Cue[] = []): Page {
  return { id: uid(), name, afterLast: { kind: 'stop' }, timeTriggers: true, cues };
}

/** カウントダウンとメッセージの文字の大きさ（出力画面の高さに対する %）の範囲と既定値 */
export const overlaySizes = {
  countdown: { min: 5, max: 25, default: 9 },
  message: { min: 4, max: 15, default: 7 },
} as const;

export function newOverlay(kind: Overlay['kind']): Overlay {
  const size = overlaySizes[kind].default;
  return kind === 'countdown'
    ? { id: uid(), kind, seconds: 5 * 60, size }
    : { id: uid(), kind, text: '', blink: false, size };
}

export function newShow(): Show {
  return {
    version: 1,
    name: 'Untitled Show',
    pages: [newPage('Page 1', [newCue('Welcome'), newCue('')])],
    overlays: [newOverlay('countdown'), newOverlay('message')],
    output: { ...defaultOutput },
  };
}
