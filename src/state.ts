import { useEffect, useReducer } from 'react';
import { newCue, newOverlay, newPage, newShow, uid } from './defaults';
import { parseShow } from './fileio';
import type { AfterLast, Cue, LiveCountdown, LiveCue, LiveMessage, OutputSettings, Overlay, Page, Show } from './types';

export interface AppState {
  show: Show;
  currentPageId: string;
  selectedCueId: string | null;
  live: LiveCue | null;
  countdown: LiveCountdown | null;
  message: LiveMessage | null;
  blackout: boolean;
  blink: boolean;
}

export type Action =
  | { type: 'loadShow'; show: Show }
  | { type: 'renameShow'; name: string }
  | { type: 'addPage' }
  | { type: 'renamePage'; id: string; name: string }
  | { type: 'deletePage'; id: string }
  | { type: 'movePage'; from: number; to: number }
  | { type: 'selectPage'; id: string }
  | { type: 'selectPageRelative'; delta: number }
  | { type: 'setPageAfterLast'; id: string; value: AfterLast }
  | { type: 'addCue' }
  | { type: 'updateCue'; id: string; patch: Partial<Omit<Cue, 'id'>> }
  | { type: 'deleteCue'; id: string }
  | { type: 'moveCue'; from: number; to: number }
  | { type: 'selectCue'; id: string | null }
  | { type: 'selectCueRelative'; delta: number }
  | { type: 'addOverlay'; kind: Overlay['kind'] }
  | { type: 'updateOverlay'; id: string; patch: { seconds?: number; text?: string; blink?: boolean; size?: number } }
  | { type: 'deleteOverlay'; id: string }
  | { type: 'moveOverlay'; from: number; to: number }
  /** 出ていなければ出す（カウントダウンは最初から開始）、出ていれば消す。同じ種類は入れ替わる */
  | { type: 'toggleOverlay'; id: string }
  | { type: 'go' }
  | { type: 'clear' }
  | { type: 'toggleBlackout' }
  | { type: 'toggleBlink' }
  | { type: 'setOutput'; patch: Partial<OutputSettings> };

const STORAGE_KEY = 'prompter.show.v1';

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function currentPage(state: AppState): Page {
  return state.show.pages.find((p) => p.id === state.currentPageId) ?? state.show.pages[0];
}

function withShow(show: Show): AppState {
  const page = show.pages[0];
  return {
    show,
    currentPageId: page.id,
    selectedCueId: page.cues[0]?.id ?? null,
    live: null,
    countdown: null,
    message: null,
    blackout: false,
    blink: false,
  };
}

function updatePage(state: AppState, id: string, fn: (p: Page) => Page): AppState {
  return {
    ...state,
    show: { ...state.show, pages: state.show.pages.map((p) => (p.id === id ? fn(p) : p)) },
  };
}

/** Cue を実行し、選択を次の Cue（必要なら次のページ）へ進める */
function fire(state: AppState, page: Page, index: number): AppState {
  const cue = page.cues[index];
  if (!cue) return state;
  const live: LiveCue = {
    key: uid(),
    cueId: cue.id,
    text: cue.text,
    duration: cue.duration,
    countdown: cue.countdown,
    fontSize: cue.fontSize,
    startedAt: Date.now(),
  };
  const next = page.cues[index + 1];
  if (next) return { ...state, live, currentPageId: page.id, selectedCueId: next.id };

  const target = afterLastTarget(state.show.pages, page);
  if (target) {
    return { ...state, live, currentPageId: target.id, selectedCueId: target.cues[0]?.id ?? null };
  }
  return { ...state, live, currentPageId: page.id, selectedCueId: null };
}

export function afterLastTarget(pages: Page[], page: Page): Page | undefined {
  const { afterLast } = page;
  if (afterLast.kind === 'next') return pages[pages.findIndex((p) => p.id === page.id) + 1];
  if (afterLast.kind === 'page') return pages.find((p) => p.id === afterLast.pageId);
  return undefined;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'loadShow':
      return withShow(action.show);
    case 'renameShow':
      return { ...state, show: { ...state.show, name: action.name } };

    case 'addPage': {
      const page = newPage(`Page ${state.show.pages.length + 1}`, [newCue()]);
      return {
        ...state,
        show: { ...state.show, pages: [...state.show.pages, page] },
        currentPageId: page.id,
        selectedCueId: page.cues[0].id,
      };
    }
    case 'renamePage':
      return updatePage(state, action.id, (p) => ({ ...p, name: action.name }));
    case 'deletePage': {
      const pages = state.show.pages;
      if (pages.length <= 1) return state;
      const index = pages.findIndex((p) => p.id === action.id);
      // 削除したページを移動先にしていたページは「停止」に戻す
      const rest = pages
        .filter((p) => p.id !== action.id)
        .map((p) =>
          p.afterLast.kind === 'page' && p.afterLast.pageId === action.id
            ? { ...p, afterLast: { kind: 'stop' } as const }
            : p,
        );
      const show = { ...state.show, pages: rest };
      if (state.currentPageId !== action.id) return { ...state, show };
      const page = rest[Math.min(index, rest.length - 1)];
      return { ...state, show, currentPageId: page.id, selectedCueId: page.cues[0]?.id ?? null };
    }
    case 'movePage':
      return { ...state, show: { ...state.show, pages: move(state.show.pages, action.from, action.to) } };
    case 'selectPage': {
      if (action.id === state.currentPageId) return state;
      const page = state.show.pages.find((p) => p.id === action.id);
      if (!page) return state;
      return { ...state, currentPageId: page.id, selectedCueId: page.cues[0]?.id ?? null };
    }
    case 'selectPageRelative': {
      const pages = state.show.pages;
      const index = pages.findIndex((p) => p.id === state.currentPageId);
      const page = pages[Math.max(0, Math.min(pages.length - 1, index + action.delta))];
      return reducer(state, { type: 'selectPage', id: page.id });
    }
    case 'setPageAfterLast':
      return updatePage(state, action.id, (p) => ({ ...p, afterLast: action.value }));

    case 'addCue': {
      const page = currentPage(state);
      const cue = newCue();
      const index = page.cues.findIndex((c) => c.id === state.selectedCueId);
      const cues = [...page.cues];
      cues.splice(index === -1 ? cues.length : index + 1, 0, cue);
      return { ...updatePage(state, page.id, (p) => ({ ...p, cues })), selectedCueId: cue.id };
    }
    case 'updateCue': {
      const page = currentPage(state);
      const next = updatePage(state, page.id, (p) => ({
        ...p,
        cues: p.cues.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      }));
      // 出力中の Cue のサイズはプレビューを見ながら合わせられるよう即反映する
      const { fontSize } = action.patch;
      if (fontSize !== undefined && next.live?.cueId === action.id) {
        return { ...next, live: { ...next.live, fontSize } };
      }
      return next;
    }
    case 'deleteCue': {
      const page = currentPage(state);
      const index = page.cues.findIndex((c) => c.id === action.id);
      const cues = page.cues.filter((c) => c.id !== action.id);
      const next = updatePage(state, page.id, (p) => ({ ...p, cues }));
      if (state.selectedCueId !== action.id) return next;
      return { ...next, selectedCueId: cues[Math.min(index, cues.length - 1)]?.id ?? null };
    }
    case 'moveCue': {
      const page = currentPage(state);
      return updatePage(state, page.id, (p) => ({ ...p, cues: move(p.cues, action.from, action.to) }));
    }
    case 'selectCue':
      return { ...state, selectedCueId: action.id };
    case 'selectCueRelative': {
      const cues = currentPage(state).cues;
      if (cues.length === 0) return state;
      const index = cues.findIndex((c) => c.id === state.selectedCueId);
      const target =
        index === -1
          ? action.delta > 0
            ? 0
            : cues.length - 1
          : Math.max(0, Math.min(cues.length - 1, index + action.delta));
      return { ...state, selectedCueId: cues[target].id };
    }

    case 'addOverlay':
      return { ...state, show: { ...state.show, overlays: [...state.show.overlays, newOverlay(action.kind)] } };
    case 'updateOverlay': {
      const overlays = state.show.overlays.map((o) =>
        o.id !== action.id
          ? o
          : o.kind === 'countdown'
            ? { ...o, seconds: action.patch.seconds ?? o.seconds, size: action.patch.size ?? o.size }
            : {
                ...o,
                text: action.patch.text ?? o.text,
                blink: action.patch.blink ?? o.blink,
                size: action.patch.size ?? o.size,
              },
      );
      const next = { ...state, show: { ...state.show, overlays } };
      // 出ているものは書き直した文言・点滅・大きさにすぐ差し替える（長さは次に開始したときから）
      const { text, blink, size } = action.patch;
      if (next.message?.overlayId === action.id) {
        const m = next.message;
        return { ...next, message: { ...m, text: text ?? m.text, blink: blink ?? m.blink, size: size ?? m.size } };
      }
      if (next.countdown?.overlayId === action.id && size !== undefined) {
        return { ...next, countdown: { ...next.countdown, size } };
      }
      return next;
    }
    case 'deleteOverlay':
      return {
        ...state,
        show: { ...state.show, overlays: state.show.overlays.filter((o) => o.id !== action.id) },
        countdown: state.countdown?.overlayId === action.id ? null : state.countdown,
        message: state.message?.overlayId === action.id ? null : state.message,
      };
    case 'moveOverlay':
      return { ...state, show: { ...state.show, overlays: move(state.show.overlays, action.from, action.to) } };
    case 'toggleOverlay': {
      const overlay = state.show.overlays.find((o) => o.id === action.id);
      if (!overlay) return state;
      if (overlay.kind === 'countdown') {
        if (state.countdown?.overlayId === overlay.id) return { ...state, countdown: null };
        return { ...state, countdown: { overlayId: overlay.id, seconds: overlay.seconds, size: overlay.size, startedAt: Date.now() } };
      }
      if (state.message?.overlayId === overlay.id) return { ...state, message: null };
      return { ...state, message: { overlayId: overlay.id, text: overlay.text, blink: overlay.blink, size: overlay.size } };
    }

    case 'go': {
      const page = currentPage(state);
      return fire(state, page, page.cues.findIndex((c) => c.id === state.selectedCueId));
    }
    case 'clear':
      return { ...state, live: null };
    case 'toggleBlackout':
      return { ...state, blackout: !state.blackout };
    case 'toggleBlink':
      return { ...state, blink: !state.blink };
    case 'setOutput':
      return { ...state, show: { ...state.show, output: { ...state.show.output, ...action.patch } } };
  }
}

function init(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return withShow(parseShow(saved));
  } catch {
    // 壊れた保存データは捨てて新規から始める
  }
  return withShow(newShow());
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // 誤ってタブを閉じても編集内容が残るように自動保存する
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.show));
      } catch {
        // 容量超過などは無視（ファイル保存が本命）
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state.show]);

  return [state, dispatch] as const;
}
