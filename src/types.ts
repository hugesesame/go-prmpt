export interface Cue {
  id: string;
  text: string;
  /** 表示時間（秒）。0 は無期限 */
  duration: number;
  /** セカンダリー画面に残り時間を表示する */
  countdown: boolean;
  /** 出力画面の高さに対する % */
  fontSize: number;
}

/** 最後の Cue を実行した後の選択の移り先 */
export type AfterLast = { kind: 'stop' } | { kind: 'next' } | { kind: 'page'; pageId: string };

export interface Page {
  id: string;
  name: string;
  afterLast: AfterLast;
  cues: Cue[];
}

export type Transition = 'dissolve' | 'cut';

export interface OutputSettings {
  background: string;
  textColor: string;
  outlineEnabled: boolean;
  /** 出力画面の高さに対する 0.1% 単位 */
  outlineWidth: number;
  outlineColor: string;
  transition: Transition;
  transitionMs: number;
}

/**
 * メインの Cue とは別に重ねて出すもの。ショー全体で 1 つのリスト。
 * カウントダウンは画面の上、メッセージは画面の下に出る
 */
export type Overlay =
  | { id: string; kind: 'countdown'; /** 長さ（秒） */ seconds: number; /** 出力画面の高さに対する % */ size: number }
  | { id: string; kind: 'message'; text: string; /** 点滅させる */ blink: boolean; /** 出力画面の高さに対する % */ size: number };

export interface Show {
  version: 1;
  name: string;
  pages: Page[];
  overlays: Overlay[];
  output: OutputSettings;
}

/** 現在セカンダリー画面に出ている Cue */
export interface LiveCue {
  /** 実行ごとに変わる ID。同じ Cue を再実行してもトランジションさせるため */
  key: string;
  cueId: string;
  text: string;
  duration: number;
  countdown: boolean;
  fontSize: number;
  startedAt: number;
}

/** 動いているカウントダウン。残り時間は startedAt から計算するので、どの画面でも同じ値になる */
export interface LiveCountdown {
  overlayId: string;
  seconds: number;
  size: number;
  startedAt: number;
}

/** 出ているメッセージ */
export interface LiveMessage {
  overlayId: string;
  text: string;
  blink: boolean;
  size: number;
}

/** プライマリー → セカンダリーへ送る状態 */
export interface OutputState {
  settings: OutputSettings;
  live: LiveCue | null;
  countdown: LiveCountdown | null;
  message: LiveMessage | null;
  blackout: boolean;
  blink: boolean;
}
