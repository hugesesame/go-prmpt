import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ja';

const en = {
  showName: 'Show name',
  unsaved: 'Unsaved',
  new: 'New',
  open: 'Open',
  save: 'Save',
  saveAs: 'Save As',
  openOutput: 'Open Output',
  confirmNew: 'Create a new show? Unsaved changes will be lost.',
  invalidShowFile: 'This is not a GO PRMPT show file.',
  otherTabOpen:
    'GO PRMPT is also open in another tab. Edits in each tab overwrite the other — close all but one tab.',
  modeHint: 'PROGRAM: edit the show / SHOW: run the show with editing locked',
  shortcuts:
    'Space: GO   ↑↓: Select cue   ←→: Switch page   C: Clear   Z: Black out   B: Blink   F: Fullscreen   ?: Help   Double-click cue: Edit   ⌘S: Save   ⌘O: Open   Double-click background: Fullscreen',

  pages: 'Pages',
  addPage: '+ Page',
  untitled: '(Untitled)',
  deletePage: 'Delete page',
  confirmDeletePage: 'Delete "{name}"?',
  afterLastNext: 'Then next page',
  afterLastJump: 'Then go to "{name}"',
  importCsv: 'CSV',
  importCsvHint: 'Import a CSV as new pages (columns: text, time, page, size, trigger)',
  csvTitle: 'Import CSV — {file}',
  csvSummary: '{pages} new page(s), {cues} cue(s). Existing pages are not changed.',
  csvPage: 'Page',
  csvCues: 'Cues',
  csvTimed: 'Time / TC',
  csvFirstCue: 'First cue',
  csvNoCues: 'No cues found in this file.',
  csvNoTextColumn: 'The CSV header has no "text" column.',
  csvBadTime: 'Row {row}: time "{value}" could not be read — imported without a time.',
  csvBadSize: 'Row {row}: size "{value}" could not be read — imported as M.',
  csvSizeClamped: 'Row {row}: size "{value}" is outside {min}–{max} — imported as {size}.',
  csvBadTrigger: 'Row {row}: trigger "{value}" could not be read — imported as ON.',
  cancel: 'Cancel',
  import: 'Import',

  pageName: 'Page name',
  afterLastCue: 'After last cue',
  autoFollow: 'Auto Follow',
  autoFollowHint: 'On GO, scroll so the cue that just ran is at the top and the next cue is second',
  stop: 'Stop',
  nextPage: 'Next page',
  jumpToPage: 'Go to page',
  addCue: '+ Cue',
  text: 'Text',
  duration: 'Sec',
  textHint: 'Enter: done   Shift+Enter: new line   Esc: cancel',
  doubleClickToEdit: 'Double-click to edit',
  durationHint: '0 = unlimited',
  countdownHint: 'Show remaining time on output',
  noCues: 'No cues yet. Click "+ Cue" to add one.',
  emptyText: '(empty)',
  dragToReorder: 'Drag to reorder',
  deleteCue: 'Delete cue',
  triggerTime: 'Time',
  triggerTimeHint: 'Run this cue automatically at this time (24h, e.g. 14:30:00). Leave empty for none. Times already passed are skipped.',
  cueTriggerHint: 'Time trigger of this cue on/off (Space GO still works)',
  pageTriggerHint: 'Time triggers on this page on/off',
  pageSourceHint: 'Run cues on this page by clock time (CLK) or by timecode (TC)',
  triggerTcHint: 'Run this cue automatically when the timecode reaches this position (e.g. 01:02:15:12). Leave empty for none. Positions skipped by a jump are not run.',
  timecode: 'Timecode',
  tcOff: 'Off',
  tcMtcIn: 'MTC In',
  tcLtcIn: 'LTC In',
  tcInternal: 'Internal',
  tcInput: 'MTC In',
  tcOutput: 'MTC Out',
  tcFrameRate: 'fps',
  tcStart: 'Start',
  tcStartHint: 'Where the generator starts and where ⏮ returns to (e.g. 01:00:00:00)',
  tcNone: 'None',
  tcDisconnected: '(not connected)',
  tcPlay: 'PLAY',
  tcStop: 'STOP',
  tcRewind: 'Back to start',
  midiConnect: 'Connect MIDI',
  midiConnectHint: 'Chrome asks for permission to use MIDI devices (including SysEx, used by MTC)',
  midiOptionalForInternal: 'Needed only for MTC Out',
  midiDenied: 'MIDI access is blocked. Allow it from the site settings (icon at the left of the address bar), then reload.',
  midiUnsupported: 'This browser does not support Web MIDI. Use Chrome.',
  ltcInput: 'LTC In',
  ltcChannel: 'Channel',
  ltcOutput: 'LTC Out',
  ltcSignal: 'Signal',
  ltcNoSignal: 'No signal',
  ltcNotReadable: 'Signal present, no LTC',
  ltcReceiving: 'Receiving LTC',
  audioConnect: 'Connect audio',
  audioConnectHint: 'Chrome asks for permission to use audio inputs, which is also needed to list audio devices by name',
  audioOptionalForInternal: 'Needed only for LTC Out',
  audioPending: 'Choose "Allow" in the Chrome prompt near the address bar',
  audioDenied: 'Audio input is blocked. Allow the microphone from the site settings (icon at the left of the address bar), then reload.',

  overlays: 'Countdown & Message',
  addCountdown: '+ Countdown',
  addMessage: '+ Message',
  noOverlays: 'Add a countdown (shown at the top) or a message (shown at the bottom).',
  countdownTime: 'Length (m:ss, e.g. 5:00)',
  messagePlaceholder: 'Message text',
  overlaySize: 'Text size (% of screen height)',
  countdownPause: 'Pause the countdown',
  countdownResume: 'Resume the countdown',
  countdownReset: 'Back to the full time and pause (press ▶ to start)',
  messageBlinkHint: 'Blink this message (takes effect immediately while it is shown)',
  deleteOverlay: 'Delete',
  resizeLists: 'Drag to resize',

  output: 'Output',
  nextPreviewHint: 'Show or hide the preview of the cue that runs on the next GO',
  noNextCue: 'No next cue',
  nextEditHint: 'Double-click to edit the text',
  colors: 'Colors',
  background: 'Background',
  textColor: 'Text',
  outline: 'Outline',
  brightness: 'Brightness',
  typography: 'Typography',
  size: 'Size',
  cueSize: 'Cue size',
  cueSizeHint: 'Font size of the selected cue',
  outlineWidth: 'Outline',
  transition: 'Transition',
  dissolve: 'Dissolve',
  cut: 'Cut',
  time: 'Time',

  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',
  waitingForPrimary: 'Waiting for the primary screen…',
  help: 'Help',
  helpHint: 'Open the user guide (? key)',
  close: 'Close',
  doubleClickFullscreen: 'F or double-click for fullscreen',
};

type Key = keyof typeof en;

const ja: Record<Key, string> = {
  showName: 'ショー名',
  unsaved: '未保存',
  new: '新規',
  open: '開く',
  save: '保存',
  saveAs: '別名で保存',
  openOutput: '出力ウィンドウを開く',
  confirmNew: '新規ショーを作成します。保存していない変更は失われます。',
  invalidShowFile: 'GO PRMPT のショーファイルではありません。',
  modeHint: 'PROGRAM：ショーを編集 / SHOW：本番用（編集をロック）',
  otherTabOpen: '他のタブでも GO PRMPT が開いています。お互いの編集が上書きされるので、1 つだけ残して閉じてください。',
  shortcuts: 'Space: GO　↑↓: Cue 選択　←→: ページ切替　C: クリア　Z: ブラックアウト　B: ブリンク　F: フルスクリーン　?: ヘルプ　Cue をダブルクリック: 編集　⌘S: 保存　⌘O: 開く　余白をダブルクリック: フルスクリーン',

  pages: 'ページ',
  addPage: '＋ ページ',
  untitled: '（無題）',
  deletePage: 'ページを削除',
  confirmDeletePage: '「{name}」を削除しますか？',
  afterLastNext: '次のページへ進む',
  afterLastJump: '「{name}」へ移動',
  importCsv: 'CSV',
  importCsvHint: 'CSV を新しいページとして読み込む（列: text, time, page, size, trigger）',
  csvTitle: 'CSV を読み込む — {file}',
  csvSummary: '新しいページ {pages} つ、Cue {cues} 個。今あるページは変わりません。',
  csvPage: 'ページ',
  csvCues: 'Cue',
  csvTimed: '時刻・TC',
  csvFirstCue: '最初の Cue',
  csvNoCues: 'このファイルには読み込める行がありません。',
  csvNoTextColumn: 'CSV の見出しに「text」の列がありません。',
  csvBadTime: '{row} 行目: time「{value}」が読めません — 時刻なしで読み込みます。',
  csvBadSize: '{row} 行目: size「{value}」が読めません — M で読み込みます。',
  csvSizeClamped: '{row} 行目: size「{value}」は {min}〜{max} の範囲外です — {size} で読み込みます。',
  csvBadTrigger: '{row} 行目: trigger「{value}」が読めません — ON で読み込みます。',
  cancel: 'キャンセル',
  import: '読み込む',

  pageName: 'ページ名',
  afterLastCue: '最後の Cue の後',
  autoFollow: 'オートフォロー',
  autoFollowHint: 'GO したら、実行した Cue が一番上、次の Cue が 2 段目に来るようにスクロールする',
  stop: '停止',
  nextPage: '次のページ',
  jumpToPage: 'ページへ移動',
  addCue: '＋ Cue',
  text: 'テキスト',
  duration: '表示秒',
  textHint: 'Enter: 確定　Shift+Enter: 改行　Esc: 取り消し',
  doubleClickToEdit: 'ダブルクリックで編集',
  durationHint: '0 は無期限',
  countdownHint: 'セカンダリー画面に残り時間を表示',
  noCues: 'Cue がありません。「＋ Cue」で追加してください。',
  emptyText: '（空のテキスト）',
  dragToReorder: 'ドラッグで並べ替え',
  deleteCue: 'Cue を削除',
  triggerTime: '時刻',
  triggerTimeHint: 'この時刻に自動で実行（24 時間表記、例 14:30:00）。空欄なら実行しない。過ぎた時刻は飛ばす',
  cueTriggerHint: 'この Cue の時刻トリガーのオン／オフ（Space の GO は使える）',
  pageTriggerHint: 'このページの時刻トリガーのオン／オフ',
  pageSourceHint: 'このページの Cue を時計の時刻（CLK）とタイムコード（TC）のどちらで実行するか',
  triggerTcHint: 'タイムコードがこの位置に来たら自動で実行（例 01:02:15:12）。空欄なら実行しない。頭出しで飛ばした位置は実行しない',
  timecode: 'タイムコード',
  tcOff: '使わない',
  tcMtcIn: 'MTC 受信',
  tcLtcIn: 'LTC 受信',
  tcInternal: '内部生成',
  tcInput: 'MTC 入力',
  tcOutput: 'MTC 出力',
  tcFrameRate: 'fps',
  tcStart: '開始位置',
  tcStartHint: '生成を始める位置。⏮ でここに戻る（例 01:00:00:00）',
  tcNone: 'なし',
  tcDisconnected: '（未接続）',
  tcPlay: 'PLAY',
  tcStop: 'STOP',
  tcRewind: '開始位置に戻る',
  midiConnect: 'MIDI に接続',
  midiConnectHint: 'MIDI 機器の使用許可（MTC で使う SysEx を含む）を Chrome が確認します',
  midiOptionalForInternal: 'MTC 出力を使うときだけ必要です',
  midiDenied: 'MIDI の使用がブロックされています。アドレスバー左のアイコンのサイト設定で許可してから再読み込みしてください。',
  midiUnsupported: 'このブラウザは Web MIDI に対応していません。Chrome を使ってください。',
  ltcInput: 'LTC 入力',
  ltcChannel: 'チャンネル',
  ltcOutput: 'LTC 出力',
  ltcSignal: '信号',
  ltcNoSignal: '信号なし',
  ltcNotReadable: '音はあるが LTC を読めない',
  ltcReceiving: 'LTC 受信中',
  audioConnect: 'オーディオに接続',
  audioConnectHint: 'オーディオ入力の使用許可を Chrome が確認します。機器の名前を一覧に出すのにも必要です',
  audioOptionalForInternal: 'LTC 出力を使うときだけ必要です',
  audioPending: 'アドレスバー付近に出た Chrome の確認で「許可する」を選んでください',
  audioDenied: 'オーディオ入力がブロックされています。アドレスバー左のアイコンのサイト設定でマイクを許可してから再読み込みしてください。',

  overlays: 'カウントダウン・メッセージ',
  addCountdown: '＋ カウントダウン',
  addMessage: '＋ メッセージ',
  noOverlays: 'カウントダウン（画面の上に表示）かメッセージ（画面の下に表示）を追加してください。',
  countdownTime: '長さ（分:秒、例 5:00）',
  messagePlaceholder: 'メッセージの文言',
  overlaySize: '文字の大きさ（画面の高さに対する %）',
  countdownPause: 'カウントダウンを一時停止',
  countdownResume: 'カウントダウンを再開',
  countdownReset: '最初の時間に戻して一時停止（▶ で開始）',
  messageBlinkHint: 'このメッセージを点滅させる（出している間に押すとすぐ反映）',
  deleteOverlay: '削除',
  resizeLists: 'ドラッグで高さを変更',

  output: '出力',
  nextPreviewHint: '次の GO で出る Cue のプレビューを表示／非表示',
  noNextCue: '次の Cue はありません',
  nextEditHint: 'ダブルクリックで文字を編集',
  colors: 'カラー',
  background: '背景',
  textColor: '文字',
  outline: 'アウトライン',
  brightness: '明るさ',
  typography: '文字',
  size: 'サイズ',
  cueSize: 'Cue サイズ',
  cueSizeHint: '選択中の Cue の文字サイズ',
  outlineWidth: 'アウトライン',
  transition: 'トランジション',
  dissolve: 'ディゾルブ',
  cut: 'カット',
  time: '時間',

  fullscreen: 'フルスクリーン',
  exitFullscreen: 'フルスクリーン解除',
  waitingForPrimary: 'プライマリー画面を待っています…',
  help: 'ヘルプ',
  helpHint: '使い方の説明を開く（? キー）',
  close: '閉じる',
  doubleClickFullscreen: 'F キーかダブルクリックでフルスクリーン',
};

const dictionaries: Record<Lang, Record<Key, string>> = { en, ja };
const STORAGE_KEY = 'prompter.lang';

export type Translate = (key: Key, params?: Record<string, string>) => string;

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}

const LangContext = createContext<LangContextValue | null>(null);

function readLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ja' ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  // 出力ウィンドウなど別ウィンドウで切り替えられても追従する
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLangState(readLang());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても今の画面の表示は切り替わる
    }
  };

  const t: Translate = (key, params) =>
    dictionaries[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => params?.[name] ?? '');

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang must be used inside LangProvider');
  return value;
}
