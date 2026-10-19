import type { Dispatch } from 'react';
import { useLang } from '../i18n';
import { currentPage, type Action, type AppState } from '../state';

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

/** 本番の操作ボタン。ページリストの上に置く。幅が狭いので NEXT の長い文言は省略する */
export function Transport({ state, dispatch }: Props) {
  const { t } = useLang();
  const nextCue = currentPage(state).cues.find((c) => c.id === state.selectedCueId);

  return (
    <div className="transport-panel">
      <button className="go-button" disabled={!nextCue} onClick={() => dispatch({ type: 'go' })}>
        GO <small>Space</small>
      </button>
      <div className="next-cue">
        <span className="label">{t('next')}</span>
        <span className="next-text">{nextCue ? nextCue.text || t('emptyText') : '—'}</span>
      </div>
      <div className="transport">
        <button onClick={() => dispatch({ type: 'clear' })}>
          CLEAR <small>Esc</small>
        </button>
        <button
          className={state.blackout ? 'toggle-button blackout active' : 'toggle-button blackout'}
          onClick={() => dispatch({ type: 'toggleBlackout' })}
        >
          BLACK OUT <small>X</small>
        </button>
        <button
          className={state.blink ? 'toggle-button blink active' : 'toggle-button blink'}
          onClick={() => dispatch({ type: 'toggleBlink' })}
        >
          BLINK <small>B</small>
        </button>
      </div>
    </div>
  );
}
