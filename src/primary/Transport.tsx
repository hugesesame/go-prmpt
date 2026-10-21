import type { Dispatch } from 'react';
import { currentPage, type Action, type AppState } from '../state';

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

/** 本番の操作ボタン。ページリストの上に置く。次の Cue は右列の NEXT に出すのでここには出さない */
export function Transport({ state, dispatch }: Props) {
  const nextCue = currentPage(state).cues.find((c) => c.id === state.selectedCueId);

  return (
    <div className="transport-panel">
      {/* Cue が出るたびに作り直し、一瞬だけ緑に光らせる（Space・時刻や TC のトリガーでも光る） */}
      <button
        key={state.live?.key ?? 'idle'}
        className={state.live ? 'go-button flash' : 'go-button'}
        disabled={!nextCue}
        onClick={() => dispatch({ type: 'go' })}
      >
        GO <small>Space</small>
      </button>
      <div className="transport">
        <button onClick={() => dispatch({ type: 'clear' })}>
          CLEAR <small>C</small>
        </button>
        <button
          className={state.blackout ? 'toggle-button blackout active' : 'toggle-button blackout'}
          onClick={() => dispatch({ type: 'toggleBlackout' })}
        >
          BLACK OUT <small>Z</small>
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
