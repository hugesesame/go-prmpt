import { useEffect, useMemo, useState, type Dispatch, type ReactNode } from 'react';
import { ColorPicker } from '../components/ColorPicker';
import { OutputView } from '../components/OutputView';
import { cueSizeRange } from '../defaults';
import { useLang } from '../i18n';
import { currentPage, type Action, type AppState } from '../state';
import type { Cue, OutputSettings, OutputState } from '../types';
import { TimecodeSection } from './TimecodeSection';
import type { TimecodeEngine } from './timecodeEngine';

interface Props {
  state: AppState;
  outputState: OutputState;
  timecode: TimecodeEngine;
  /** ショーモード。出力の設定を変えられないようにする */
  locked: boolean;
  dispatch: Dispatch<Action>;
}

export function ControlPanel({ state, outputState, timecode, locked, dispatch }: Props) {
  const { t } = useLang();
  const settings = state.show.output;
  const set = (patch: Partial<OutputSettings>) => dispatch({ type: 'setOutput', patch });
  const nextCue = currentPage(state).cues.find((c) => c.id === state.selectedCueId);
  const [showNext, setShowNext] = useShowNext();
  const nextState = useNextState(nextCue, settings);

  return (
    <aside className="panel controls">
      <div className="panel-header">
        <span>{t('output')}</span>
      </div>
      <div className="controls-body">
        <div className="preview-head program">PROGRAM</div>
        <div className="preview program">
          <OutputView state={outputState} />
        </div>
        <button
          className="preview-head next"
          aria-expanded={showNext}
          title={t('nextPreviewHint')}
          onClick={() => setShowNext(!showNext)}
        >
          {showNext ? '▾' : '▸'} NEXT
        </button>
        {showNext && (
          <div className="preview next">
            <OutputView state={nextState} />
            {!nextCue && <div className="preview-empty">{t('noNextCue')}</div>}
          </div>
        )}

        {/* disabled な fieldset は中のボタン・スライダーをまとめて無効にする */}
        <fieldset className="settings" disabled={locked}>
          <Section title={t('colors')}>
            <ColorField label={t('background')} value={settings.background} onChange={(v) => set({ background: v })} />
            <ColorField label={t('textColor')} value={settings.textColor} onChange={(v) => set({ textColor: v })} />
            <ColorField
              label={t('outline')}
              value={settings.outlineColor}
              onChange={(v) => set({ outlineColor: v })}
              enabled={settings.outlineEnabled}
              onToggle={(v) => set({ outlineEnabled: v })}
            />
          </Section>

          <Section title={t('typography')}>
            <Slider
              label={t('cueSize')}
              title={t('cueSizeHint')}
              min={cueSizeRange.min}
              max={cueSizeRange.max}
              step={0.5}
              value={nextCue?.fontSize}
              onChange={(v) => nextCue && dispatch({ type: 'updateCue', id: nextCue.id, patch: { fontSize: v } })}
            />
            <Slider label={t('outlineWidth')} min={0} max={20} step={0.5} value={settings.outlineWidth} onChange={(v) => set({ outlineWidth: v })} />
          </Section>

          <Section title={t('transition')}>
            <div className="segmented">
              {(['dissolve', 'cut'] as const).map((tr) => (
                <button key={tr} className={settings.transition === tr ? 'active' : ''} onClick={() => set({ transition: tr })}>
                  {t(tr)}
                </button>
              ))}
            </div>
            {settings.transition === 'dissolve' && (
              <Slider
                label={t('time')}
                min={100}
                max={3000}
                step={50}
                value={settings.transitionMs}
                unit="ms"
                onChange={(v) => set({ transitionMs: v })}
              />
            )}
          </Section>
        </fieldset>

        <TimecodeSection engine={timecode} settings={state.show.timecode} locked={locked} dispatch={dispatch} />
      </div>
    </aside>
  );
}

const SHOW_NEXT_KEY = 'prompter.showNext';

/** NEXT の画面を開いておくか。操作する人の好みなのでブラウザに覚える */
function useShowNext() {
  const [on, setOn] = useState(() => localStorage.getItem(SHOW_NEXT_KEY) !== 'off');
  useEffect(() => localStorage.setItem(SHOW_NEXT_KEY, on ? 'on' : 'off'), [on]);
  return [on, setOn] as const;
}

/**
 * NEXT の画面に渡す状態。次の Cue の文字だけを今の色・アウトラインで出す。
 * カウントダウン・メッセージ・暗転・点滅は出さず、選択を変えたときはフェードさせずに切り替える
 */
function useNextState(cue: Cue | undefined, settings: OutputSettings): OutputState {
  return useMemo(
    () => ({
      settings: { ...settings, transition: 'cut' },
      live: cue
        ? {
            key: cue.id,
            cueId: cue.id,
            text: cue.text,
            duration: cue.duration,
            countdown: cue.countdown,
            fontSize: cue.fontSize,
            startedAt: 0,
          }
        : null,
      countdown: null,
      message: null,
      blackout: false,
      blink: false,
    }),
    [cue, settings],
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="control-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** 指定すると色の横にオン/オフのボタンを出す */
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

function ColorField({ label, value, onChange, enabled, onToggle }: ColorFieldProps) {
  // <label> にすると中のクリックがスウォッチに伝わってしまうので <div> にする
  return (
    <div className={enabled === false ? 'field disabled' : 'field'}>
      <span>{label}</span>
      <div className="color-cell">
        <ColorPicker value={value} onChange={onChange} />
        {onToggle && (
          <button
            className={enabled ? 'on-off active' : 'on-off'}
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={() => onToggle(!enabled)}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>
      <code>{value}</code>
    </div>
  );
}

interface SliderProps {
  label: string;
  title?: string;
  min: number;
  max: number;
  step: number;
  /** undefined のときは操作できない */
  value: number | undefined;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, title, min, max, step, value, unit, onChange }: SliderProps) {
  return (
    <label className="field" title={title}>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        disabled={value === undefined}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <code>
        {value ?? '—'}
        {value !== undefined && unit}
      </code>
    </label>
  );
}
