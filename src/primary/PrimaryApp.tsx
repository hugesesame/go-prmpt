import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { openChannel, openOutputWindow, type ChannelMessage } from '../channel';
import { newShow } from '../defaults';
import { InvalidShowError, isAbort, openShowFromFile, resetFileHandle, saveShowToFile } from '../fileio';
import { toggleFullscreen, useIsFullscreen } from '../fullscreen';
import { useLang } from '../i18n';
import { currentPage, useAppState } from '../state';
import type { OutputState } from '../types';
import { formatClock, useNow } from '../useNow';
import { ControlPanel } from './ControlPanel';
import { CueList } from './CueList';
import { PageList } from './PageList';

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** ダブルクリックが独自の意味を持つ要素（文字選択・Cue 実行・ボタン連打）ではフルスクリーンにしない */
function onBackgroundDoubleClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('input, textarea, select, button, .cue-row, .page-item')) return;
  toggleFullscreen();
}

export function PrimaryApp() {
  const { lang, setLang, t } = useLang();
  const [state, dispatch] = useAppState();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fullscreen = useIsFullscreen();
  const page = currentPage(state);

  const outputState: OutputState = useMemo(
    () => ({ settings: state.show.output, live: state.live, blackout: state.blackout, blink: state.blink }),
    [state.show.output, state.live, state.blackout, state.blink],
  );

  // 出力ウィンドウへ状態を送る。後から開いたウィンドウには hello への返事で送る
  const channelRef = useRef<BroadcastChannel | null>(null);
  const outputRef = useRef(outputState);
  outputRef.current = outputState;
  useEffect(() => {
    const channel = openChannel();
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data.type === 'hello') channel.postMessage({ type: 'state', state: outputRef.current } satisfies ChannelMessage);
    };
    channelRef.current = channel;
    return () => channel.close();
  }, []);
  useEffect(() => {
    channelRef.current?.postMessage({ type: 'state', state: outputState } satisfies ChannelMessage);
  }, [outputState]);

  const run = async (task: () => Promise<void>) => {
    try {
      setError(null);
      await task();
    } catch (err) {
      if (isAbort(err)) return;
      if (err instanceof InvalidShowError) setError(t('invalidShowFile'));
      else setError(err instanceof Error ? err.message : String(err));
    }
  };
  const save = (saveAs: boolean) => run(async () => setFileName(await saveShowToFile(state.show, saveAs)));
  const open = () =>
    run(async () => {
      const { show, fileName } = await openShowFromFile();
      dispatch({ type: 'loadShow', show });
      setFileName(fileName);
    });
  const createNew = () => {
    if (!confirm(t('confirmNew'))) return;
    resetFileHandle();
    setFileName(null);
    dispatch({ type: 'loadShow', show: newShow() });
  };

  const keyHandlers = useRef({ save, open });
  keyHandlers.current = { save, open };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        keyHandlers.current.save(e.shiftKey);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        keyHandlers.current.open();
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const actions: Record<string, () => void> = {
        ' ': () => dispatch({ type: 'go' }),
        ArrowUp: () => dispatch({ type: 'selectCueRelative', delta: -1 }),
        ArrowDown: () => dispatch({ type: 'selectCueRelative', delta: 1 }),
        ArrowLeft: () => dispatch({ type: 'selectPageRelative', delta: -1 }),
        ArrowRight: () => dispatch({ type: 'selectPageRelative', delta: 1 }),
        Escape: () => dispatch({ type: 'clear' }),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      // ボタンにフォーカスが残っていると Space で二重に押されるので外す
      (document.activeElement as HTMLElement | null)?.blur();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div className="app" onDoubleClick={onBackgroundDoubleClick}>
      <header className="topbar">
        <div className="brand">PROMPTER</div>
        <input
          className="show-name"
          value={state.show.name}
          onChange={(e) => dispatch({ type: 'renameShow', name: e.target.value })}
          aria-label={t('showName')}
        />
        <span className="file-name">{fileName ?? t('unsaved')}</span>
        <Clock />
      </header>
      <nav className="toolbar">
        <div className="toolbar-group">
          <button onClick={createNew}>{t('new')}</button>
          <button onClick={open} title="⌘O">{t('open')}</button>
          <button onClick={() => save(false)} title="⌘S">{t('save')}</button>
          <button onClick={() => save(true)} title="⇧⌘S">{t('saveAs')}</button>
        </div>
        <div className="toolbar-group">
          <button className="primary" onClick={openOutputWindow}>{t('openOutput')}</button>
          <button onClick={toggleFullscreen} title={t('doubleClickFullscreen')}>
            {fullscreen ? t('exitFullscreen') : t('fullscreen')}
          </button>
          <button
            className="lang-toggle"
            role="switch"
            aria-checked={lang === 'ja'}
            aria-label="ENG / JPN"
            onClick={() => setLang(lang === 'en' ? 'ja' : 'en')}
          >
            <span className={lang === 'en' ? 'active' : ''}>ENG</span>
            <span className={lang === 'ja' ? 'active' : ''}>JPN</span>
          </button>
        </div>
      </nav>
      {error && (
        <div className="error-bar" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      <main className="workspace">
        <PageList pages={state.show.pages} currentPageId={state.currentPageId} dispatch={dispatch} />
        <CueList
          page={page}
          pages={state.show.pages}
          selectedCueId={state.selectedCueId}
          liveCueId={state.live?.cueId ?? null}
          dispatch={dispatch}
        />
        <ControlPanel state={state} outputState={outputState} dispatch={dispatch} />
      </main>
      <footer className="statusbar">{t('shortcuts')}</footer>
    </div>
  );
}

function Clock() {
  const now = useNow(250);
  return <div className="clock">{formatClock(now)}</div>;
}
