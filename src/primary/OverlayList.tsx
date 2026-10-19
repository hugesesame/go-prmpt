import { useState, type Dispatch } from 'react';
import { overlaySizes } from '../defaults';
import { useLang } from '../i18n';
import type { Action } from '../state';
import type { Overlay } from '../types';
import { formatCountdown } from '../useNow';

interface Props {
  overlays: Overlay[];
  liveCountdownId: string | null;
  liveMessageId: string | null;
  /** ショーモード。出す・消すだけできる */
  locked: boolean;
  dispatch: Dispatch<Action>;
}

/** カウントダウンとメッセージのリスト（ショー全体で 1 つ）。メインの GO とは別に出し入れする */
export function OverlayList({ overlays, liveCountdownId, liveMessageId, locked, dispatch }: Props) {
  const { t } = useLang();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  return (
    <section className="panel overlays">
      <div className="panel-header">
        <span>{t('overlays')}</span>
        {!locked && (
          <div className="toolbar-group">
            <button className="small" onClick={() => dispatch({ type: 'addOverlay', kind: 'countdown' })}>
              {t('addCountdown')}
            </button>
            <button className="small" onClick={() => dispatch({ type: 'addOverlay', kind: 'message' })}>
              {t('addMessage')}
            </button>
          </div>
        )}
      </div>
      <div className="cue-list">
        {overlays.length === 0 && <div className="empty">{t('noOverlays')}</div>}
        {overlays.map((overlay, i) => {
          const live = overlay.id === (overlay.kind === 'countdown' ? liveCountdownId : liveMessageId);
          return (
            <div
              key={overlay.id}
              className={[
                'overlay-row',
                live && 'live',
                // 点滅中のメッセージは左端のバーも点滅させる
                live && overlay.kind === 'message' && overlay.blink && 'blinking',
                dropAt === i && dragFrom !== i && 'drop-target',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={(e) => {
                e.preventDefault();
                setDropAt(i);
              }}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) dispatch({ type: 'moveOverlay', from: dragFrom, to: i });
              }}
            >
              <span
                className="drag-handle"
                draggable={!locked}
                title={locked ? undefined : t('dragToReorder')}
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.setDragImage(e.currentTarget.parentElement!, 0, 0);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDropAt(null);
                }}
              >
                ⋮⋮
              </span>
              <span className={`overlay-kind ${overlay.kind}`}>{overlay.kind === 'countdown' ? 'CD' : 'MSG'}</span>
              {overlay.kind === 'countdown' ? (
                <DurationInput
                  // 確定した値が変わったら作り直して下書きを捨てる
                  key={overlay.seconds}
                  seconds={overlay.seconds}
                  readOnly={locked}
                  title={t('countdownTime')}
                  onCommit={(seconds) => dispatch({ type: 'updateOverlay', id: overlay.id, patch: { seconds } })}
                />
              ) : (
                <input
                  className="overlay-text"
                  value={overlay.text}
                  readOnly={locked}
                  placeholder={t('messagePlaceholder')}
                  onChange={(e) => dispatch({ type: 'updateOverlay', id: overlay.id, patch: { text: e.target.value } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur();
                  }}
                />
              )}
              <input
                className="overlay-size"
                type="range"
                min={overlaySizes[overlay.kind].min}
                max={overlaySizes[overlay.kind].max}
                step={0.5}
                value={overlay.size}
                disabled={locked}
                title={`${t('overlaySize')}: ${overlay.size}`}
                aria-label={t('overlaySize')}
                onChange={(e) => dispatch({ type: 'updateOverlay', id: overlay.id, patch: { size: Number(e.target.value) } })}
              />
              {overlay.kind === 'message' ? (
                // 本番中に切り替える操作なのでショーモードでも使える
                <button
                  className={overlay.blink ? 'overlay-blink active' : 'overlay-blink'}
                  aria-pressed={overlay.blink}
                  title={t('messageBlinkHint')}
                  onClick={() => dispatch({ type: 'updateOverlay', id: overlay.id, patch: { blink: !overlay.blink } })}
                >
                  BLINK
                </button>
              ) : (
                <span />
              )}
              <button
                className={live ? 'overlay-toggle active' : 'overlay-toggle'}
                onClick={() => dispatch({ type: 'toggleOverlay', id: overlay.id })}
              >
                {overlay.kind === 'countdown' ? (live ? '■ STOP' : '▶ START') : live ? '■ OFF' : '▶ ON'}
              </button>
              {locked ? (
                <span />
              ) : (
                <button
                  className="icon-button"
                  aria-label={t('deleteOverlay')}
                  onClick={() => dispatch({ type: 'deleteOverlay', id: overlay.id })}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 「5:00」「90」「1:00:00」を秒にする。読めなければ null */
function parseDuration(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  return parts.reduce((total, p) => total * 60 + Number(p), 0);
}

interface DurationInputProps {
  seconds: number;
  readOnly: boolean;
  title: string;
  onCommit: (seconds: number) => void;
}

function DurationInput({ seconds, readOnly, title, onCommit }: DurationInputProps) {
  const [draft, setDraft] = useState(formatCountdown(seconds));
  const commit = () => {
    const parsed = parseDuration(draft);
    if (parsed === null || parsed === seconds) setDraft(formatCountdown(seconds));
    else onCommit(parsed);
  };
  return (
    <input
      className="overlay-duration"
      value={draft}
      readOnly={readOnly}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
