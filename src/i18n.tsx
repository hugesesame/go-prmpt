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
  invalidShowFile: 'This is not a Prompter show file.',
  otherTabOpen:
    'Prompter is also open in another tab. Edits in each tab overwrite the other — close all but one tab.',
  modeHint: 'PROGRAM: edit the show / SHOW: run the show with editing locked',
  shortcuts:
    'Space: GO   ↑↓: Select cue   ←→: Switch page   Esc: Clear   X: Black out   B: Blink   Double-click cue: Edit   ⌘S: Save   ⌘O: Open   Double-click background: Fullscreen',

  pages: 'Pages',
  addPage: '+ Page',
  untitled: '(Untitled)',
  deletePage: 'Delete page',
  confirmDeletePage: 'Delete "{name}"?',
  afterLastNext: 'Then next page',
  afterLastJump: 'Then go to "{name}"',

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

  overlays: 'Countdown & Message',
  addCountdown: '+ Countdown',
  addMessage: '+ Message',
  noOverlays: 'Add a countdown (shown at the top) or a message (shown at the bottom).',
  countdownTime: 'Length (m:ss, e.g. 5:00)',
  messagePlaceholder: 'Message text',
  overlaySize: 'Text size (% of screen height)',
  messageBlinkHint: 'Blink this message (takes effect immediately while it is shown)',
  deleteOverlay: 'Delete',
  resizeLists: 'Drag to resize',

  output: 'Output',
  next: 'NEXT',
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
  doubleClickFullscreen: 'Double-click for fullscreen',
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
  invalidShowFile: 'Prompter のショーファイルではありません。',
  modeHint: 'PROGRAM：ショーを編集 / SHOW：本番用（編集をロック）',
  otherTabOpen: '他のタブでも Prompter が開いています。お互いの編集が上書きされるので、1 つだけ残して閉じてください。',
  shortcuts: 'Space: GO　↑↓: Cue 選択　←→: ページ切替　Esc: クリア　X: ブラックアウト　B: ブリンク　Cue をダブルクリック: 編集　⌘S: 保存　⌘O: 開く　余白をダブルクリック: フルスクリーン',

  pages: 'ページ',
  addPage: '＋ ページ',
  untitled: '（無題）',
  deletePage: 'ページを削除',
  confirmDeletePage: '「{name}」を削除しますか？',
  afterLastNext: '次のページへ進む',
  afterLastJump: '「{name}」へ移動',

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

  overlays: 'カウントダウン・メッセージ',
  addCountdown: '＋ カウントダウン',
  addMessage: '＋ メッセージ',
  noOverlays: 'カウントダウン（画面の上に表示）かメッセージ（画面の下に表示）を追加してください。',
  countdownTime: '長さ（分:秒、例 5:00）',
  messagePlaceholder: 'メッセージの文言',
  overlaySize: '文字の大きさ（画面の高さに対する %）',
  messageBlinkHint: 'このメッセージを点滅させる（出している間に押すとすぐ反映）',
  deleteOverlay: '削除',
  resizeLists: 'ドラッグで高さを変更',

  output: '出力',
  next: 'NEXT',
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
  doubleClickFullscreen: 'ダブルクリックでフルスクリーン',
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
