import type { FrameRate } from './timecode';

export interface Cue {
  id: string;
  text: string;
  /** 表示時間（秒）。0 は無期限 */
  duration: number;
  /** セカンダリー画面に残り時間を表示する */
  countdown: boolean;
  /** 出力画面の高さに対する % */
  fontSize: number;
  /** 自動で実行する時刻（0 時からの秒）。null は時刻トリガー無し */
  triggerAt: number | null;
  /** タイムコードで実行する位置（「01:02:15:12」）。null はトリガー無し。ページが TC のときに使う */
  tcAt: string | null;
  /** 時刻・タイムコードのトリガーを有効にする。手動の GO には関係しない */
  triggerEnabled: boolean;
}

/** 最後の Cue を実行した後の選択の移り先 */
export type AfterLast = { kind: 'stop' } | { kind: 'next' } | { kind: 'page'; pageId: string };

export interface Page {
  id: string;
  name: string;
  afterLast: AfterLast;
  /** このページの Cue の時刻・タイムコードのトリガーを有効にする */
  timeTriggers: boolean;
  /** Cue を時計の時刻（clock）とタイムコード（tc）のどちらで実行するか */
  triggerSource: TriggerSource;
  cues: Cue[];
}

export type TriggerSource = 'clock' | 'tc';

/** off: 使わない / mtc: 外部の MTC を受ける / internal: アプリの中で生成する */
export type TimecodeSource = 'off' | 'mtc' | 'internal';

export interface TimecodeSettings {
  source: TimecodeSource;
  /** 内部生成の fps。受信のときは届いた MTC の fps を使う */
  frameRate: FrameRate;
  /** 内部生成の開始位置（⏮ で戻る位置） */
  start: string;
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
  timecode: TimecodeSettings;
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
