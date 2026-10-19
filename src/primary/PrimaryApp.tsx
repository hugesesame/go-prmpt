import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { openChannel, openOutputWindow, type ChannelMessage } from '../channel';
import { VerticalSplit } from '../components/VerticalSplit';
import { newShow } from '../defaults';
import { InvalidShowError, isAbort, openShowFromFile, resetFileHandle, saveShowToFile } from '../fileio';
import { toggleFullscreen, useIsFullscreen } from '../fullscreen';
import { useLang } from '../i18n';
import { currentPage, useAppState } from '../state';
import type { OutputState } from '../types';
import { formatClock, useNow } from '../useNow';
import { ControlPanel } from './ControlPanel';
import { CueList } from './CueList';
import { OverlayList } from './OverlayList';
import { PageList } from './PageList';
import { useOtherPrimaryTabs } from './useOtherPrimaryTabs';
import { useTimeTriggers } from './useTimeTriggers';

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

type Mode = 'program' | 'show';
const MODE_KEY = 'prompter.mode';

/** プログラムモード（編集）とショーモード（本番。編集をロック）。リロードしても前回のモードで開く */
function useMode() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem(MODE_KEY) === 'show' ? 'show' : 'program'));
  useEffect(() => localStorage.setItem(MODE_KEY, mode), [mode]);
  return [mode, setMode] as const;
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
  const otherTabs = useOtherPrimaryTabs();
  const [mode, setMode] = useMode();
  const locked = mode === 'show';
  const page = currentPage(state);
  useTimeTriggers(state.show.pages, dispatch);

  const outputState: OutputState = useMemo(
    () => ({
      settings: state.show.output,
      live: state.live,
      countdown: state.countdown,
      message: state.message,
      blackout: state.blackout,
      blink: state.blink,
    }),
    [state.show.output, state.live, state.countdown, state.message, state.blackout, state.blink],
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

  const keyHandlers = useRef({ save, open, locked });
  keyHandlers.current = { save, open, locked };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        keyHandlers.current.save(e.shiftKey);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        if (!keyHandlers.current.locked) keyHandlers.current.open();
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
        // 文字キーは入力モード（日本語入力中や Caps Lock）に左右されないようキーの位置で見る
        KeyX: () => dispatch({ type: 'toggleBlackout' }),
        KeyB: () => dispatch({ type: 'toggleBlink' }),
      };
      const action = actions[e.key] ?? (e.shiftKey ? undefined : actions[e.code]);
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
    <div className={locked ? 'app show-mode' : 'app'} onDoubleClick={onBackgroundDoubleClick}>
      <header className="topbar">
        <div className="brand">PROMPTER</div>
        <input
          className="show-name"
          value={state.show.name}
          readOnly={locked}
          onChange={(e) => dispatch({ type: 'renameShow', name: e.target.value })}
          aria-label={t('showName')}
        />
        <span className="file-name">{fileName ?? t('unsaved')}</span>
        <Clock />
      </header>
      <nav className="toolbar">
        <div className="toolbar-group">
          <button onClick={createNew} disabled={locked}>{t('new')}</button>
          <button onClick={open} disabled={locked} title="⌘O">{t('open')}</button>
          <button onClick={() => save(false)} title="⌘S">{t('save')}</button>
          <button onClick={() => save(true)} title="⇧⌘S">{t('saveAs')}</button>
        </div>
        <div className="toolbar-group">
          <button
            className="pill-toggle"
            role="switch"
            aria-checked={lang === 'ja'}
            aria-label="ENG / JPN"
            onClick={() => setLang(lang === 'en' ? 'ja' : 'en')}
          >
            <span className={lang === 'en' ? 'active' : ''}>ENG</span>
            <span className={lang === 'ja' ? 'active' : ''}>JPN</span>
          </button>
          <button
            className="pill-toggle mode-toggle"
            role="switch"
            aria-checked={locked}
            aria-label="PROGRAM / SHOW"
            title={t('modeHint')}
            onClick={() => setMode(locked ? 'program' : 'show')}
          >
            <span className={locked ? '' : 'active'}>PROGRAM</span>
            <span className={locked ? 'active' : ''}>SHOW</span>
          </button>
          <button className="primary" onClick={openOutputWindow}>{t('openOutput')}</button>
          <button onClick={toggleFullscreen} title={t('doubleClickFullscreen')}>
            {fullscreen ? t('exitFullscreen') : t('fullscreen')}
          </button>
        </div>
      </nav>
      {otherTabs > 0 && <div className="warning-bar">{t('otherTabOpen')}</div>}
      {error && (
        <div className="error-bar" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      <main className="workspace">
        <PageList pages={state.show.pages} currentPageId={state.currentPageId} locked={locked} dispatch={dispatch} />
        <VerticalSplit
          storageKey="prompter.overlayHeight"
          defaultBottom={190}
          // Cue リストの見出し（約 76px）と 10 行（39px × 10）に境目の 6px を足したもの
          minTop={472}
          minBottom={120}
          title={t('resizeLists')}
          top={
            <CueList
              page={page}
              pages={state.show.pages}
              selectedCueId={state.selectedCueId}
              liveCueId={state.live?.cueId ?? null}
              liveKey={state.live?.key ?? null}
              locked={locked}
              dispatch={dispatch}
            />
          }
          bottom={
            <OverlayList
              overlays={state.show.overlays}
              liveCountdownId={state.countdown?.overlayId ?? null}
              liveMessageId={state.message?.overlayId ?? null}
              locked={locked}
              dispatch={dispatch}
            />
          }
        />
        <ControlPanel state={state} outputState={outputState} locked={locked} dispatch={dispatch} />
      </main>
      <footer className="statusbar">{t('shortcuts')}</footer>
    </div>
  );
}

function Clock() {
  const now = useNow(250);
  return <div className="clock">{formatClock(now)}</div>;
}
