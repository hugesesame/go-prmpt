import type { Dispatch, ReactNode } from 'react';
import { ColorPicker } from '../components/ColorPicker';
import { OutputView } from '../components/OutputView';
import { useLang } from '../i18n';
import { currentPage, type Action, type AppState } from '../state';
import type { OutputSettings, OutputState } from '../types';

interface Props {
  state: AppState;
  outputState: OutputState;
  dispatch: Dispatch<Action>;
}

export function ControlPanel({ state, outputState, dispatch }: Props) {
  const { t } = useLang();
  const settings = state.show.output;
  const set = (patch: Partial<OutputSettings>) => dispatch({ type: 'setOutput', patch });
  const nextCue = currentPage(state).cues.find((c) => c.id === state.selectedCueId);

  return (
    <aside className="panel controls">
      <div className="panel-header">
        <span>{t('output')}</span>
      </div>
      <div className="controls-body">
        <div className="preview">
          <OutputView state={outputState} />
        </div>

        <div className="next-cue">
          <span className="label">{t('next')}</span>
          <span className="next-text">{nextCue ? nextCue.text || t('emptyText') : '—'}</span>
        </div>

        <button className="go-button" disabled={!nextCue} onClick={() => dispatch({ type: 'go' })}>
          GO <small>Space</small>
        </button>
        <div className="transport">
          <button onClick={() => dispatch({ type: 'clear' })}>
            CLEAR <small>Esc</small>
          </button>
          <button
            className={state.blackout ? 'toggle-button blackout active' : 'toggle-button blackout'}
            onClick={() => dispatch({ type: 'toggleBlackout' })}
          >
            BLACK OUT
          </button>
          <button
            className={state.blink ? 'toggle-button blink active' : 'toggle-button blink'}
            onClick={() => dispatch({ type: 'toggleBlink' })}
          >
            BLINK
          </button>
        </div>

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
            min={5}
            max={40}
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
      </div>
    </aside>
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
