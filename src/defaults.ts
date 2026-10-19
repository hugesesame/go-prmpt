import type { Cue, OutputSettings, Page, Show } from './types';

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

export function newCue(text = ''): Cue {
  return { id: uid(), text, duration: 0, countdown: false, fontSize: fontSizePresets.M };
}

export function newPage(name: string, cues: Cue[] = []): Page {
  return { id: uid(), name, afterLast: { kind: 'stop' }, cues };
}

export function newShow(): Show {
  return {
    version: 1,
    name: 'Untitled Show',
    pages: [newPage('Page 1', [newCue('Welcome'), newCue('')])],
    output: { ...defaultOutput },
  };
}
