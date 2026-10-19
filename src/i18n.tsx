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
  shortcuts:
    'Space: GO   ↑↓: Select cue   ←→: Switch page   Esc: Clear   Double-click cue: Edit   ⌘S: Save   ⌘O: Open   Double-click background: Fullscreen',

  pages: 'Pages',
  addPage: '+ Page',
  untitled: '(Untitled)',
  deletePage: 'Delete page',
  confirmDeletePage: 'Delete "{name}"?',
  afterLastNext: 'Then next page',
  afterLastJump: 'Then go to "{name}"',

  pageName: 'Page name',
  afterLastCue: 'After last cue',
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

  output: 'Output',
  next: 'NEXT',
  colors: 'Colors',
  background: 'Background',
  textColor: 'Text',
  outline: 'Outline',
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
  shortcuts: 'Space: GO　↑↓: Cue 選択　←→: ページ切替　Esc: クリア　Cue をダブルクリック: 編集　⌘S: 保存　⌘O: 開く　余白をダブルクリック: フルスクリーン',

  pages: 'ページ',
  addPage: '＋ ページ',
  untitled: '（無題）',
  deletePage: 'ページを削除',
  confirmDeletePage: '「{name}」を削除しますか？',
  afterLastNext: '次のページへ進む',
  afterLastJump: '「{name}」へ移動',

  pageName: 'ページ名',
  afterLastCue: '最後の Cue の後',
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

  output: '出力',
  next: 'NEXT',
  colors: 'カラー',
  background: '背景',
  textColor: '文字',
  outline: 'アウトライン',
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
