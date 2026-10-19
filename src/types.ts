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
  /** 出力画面の高さに対する 0.1% 単位 */
  outlineWidth: number;
  outlineColor: string;
  transition: Transition;
  transitionMs: number;
}

export interface Show {
  version: 1;
  name: string;
  pages: Page[];
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

/** プライマリー → セカンダリーへ送る状態 */
export interface OutputState {
  settings: OutputSettings;
  live: LiveCue | null;
  blackout: boolean;
  blink: boolean;
}
