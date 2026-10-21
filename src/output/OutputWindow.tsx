import { useEffect, useState } from 'react';
import { openChannel, type ChannelMessage } from '../channel';
import { OutputView } from '../components/OutputView';
import { toggleFullscreen, useIsFullscreen } from '../fullscreen';
import { useLang } from '../i18n';
import type { OutputState } from '../types';

export function OutputWindow() {
  const { t } = useLang();
  const [state, setState] = useState<OutputState | null>(null);
  const fullscreen = useIsFullscreen();
  const [cursorIdle, setCursorIdle] = useState(false);

  useEffect(() => {
    document.title = 'Prompter Output';
    const channel = openChannel();
    channel.onmessage = (e: MessageEvent<ChannelMessage>) => {
      if (e.data.type === 'state') setState(e.data.state);
    };
    channel.postMessage({ type: 'hello' } satisfies ChannelMessage);
    return () => channel.close();
  }, []);

  // F でフルスクリーン（メイン画面と同じく、入力モードに左右されないようキーの位置で見る）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyF' || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 本番中にマウスカーソルやボタンが映り込まないよう、動かさなければ隠す
  useEffect(() => {
    let timer = setTimeout(() => setCursorIdle(true), 2000);
    const onMove = () => {
      setCursorIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setCursorIdle(true), 2000);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div
      className="output-window"
      style={{ cursor: cursorIdle ? 'none' : 'default' }}
      onDoubleClick={toggleFullscreen}
    >
      {/* プレビューと見た目をそろえるため、ウィンドウの比率に関係なく 16:9 で描画する */}
      <div className="output-stage">
        {state ? <OutputView state={state} /> : <div className="output-waiting">{t('waitingForPrimary')}</div>}
      </div>
      {!cursorIdle && (
        <button
          className="output-fullscreen-button"
          title={t('doubleClickFullscreen')}
          onClick={toggleFullscreen}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {fullscreen ? t('exitFullscreen') : t('fullscreen')}
        </button>
      )}
    </div>
  );
}
