import type { Dispatch } from 'react';
import { useLang } from '../i18n';
import type { Action } from '../state';
import { frameRates, type FrameRate } from '../timecode';
import type { TimecodeSettings, TimecodeSource } from '../types';
import { TcInput } from './TcInput';
import { useTimecode, type MidiPort, type TimecodeEngine } from './timecodeEngine';

const rateLabel = (rate: FrameRate) => (rate === '29.97df' ? '29.97DF' : rate);

/**
 * ヘッダーの時計の横に出す今のタイムコード。進んでいる間は緑。
 * 内部生成のときは左に PLAY / STOP / ⏮ を付ける（右列のボタンと同じ働き。ショーモードでも使える）
 */
export function TimecodeDisplay({ engine, source }: { engine: TimecodeEngine; source: TimecodeSource }) {
  const { t } = useLang();
  const { tc, rate, running } = useTimecode(engine);
  if (source === 'off') return null;
  return (
    <div className="tc-header">
      {source === 'internal' && (
        <div className="tc-header-transport">
          <button
            className={running ? 'active' : ''}
            title={t('tcPlay')}
            aria-label={t('tcPlay')}
            onClick={() => engine.play()}
          >
            ▶
          </button>
          <button title={t('tcStop')} aria-label={t('tcStop')} onClick={() => engine.stop()}>
            ■
          </button>
          <button title={t('tcRewind')} aria-label={t('tcRewind')} onClick={() => engine.rewind()}>
            ⏮
          </button>
        </div>
      )}
      <div className={running ? 'tc-display running' : 'tc-display'} title={t(source === 'mtc' ? 'tcMtcIn' : 'tcInternal')}>
        <span className="tc-label">{source === 'mtc' ? 'MTC' : 'TC'}</span>
        <span className="tc-value">{tc ?? '--:--:--:--'}</span>
        <span className="tc-rate">{rate ? rateLabel(rate) : ''}</span>
      </div>
    </div>
  );
}

interface Props {
  engine: TimecodeEngine;
  settings: TimecodeSettings;
  /** ショーモード。生成の PLAY / STOP / ⏮ だけ使える */
  locked: boolean;
  dispatch: Dispatch<Action>;
}

export function TimecodeSection({ engine, settings, locked, dispatch }: Props) {
  const { t } = useLang();
  const snapshot = useTimecode(engine);
  const set = (patch: Partial<TimecodeSettings>) => dispatch({ type: 'setTimecode', patch });
  const { source } = settings;

  return (
    <section className="control-section">
      <h3>{t('timecode')}</h3>
      <fieldset className="tc-settings" disabled={locked}>
        <div className="segmented three">
          {(['off', 'mtc', 'internal'] as const).map((s) => (
            <button key={s} className={source === s ? 'active' : ''} onClick={() => set({ source: s })}>
              {t(s === 'off' ? 'tcOff' : s === 'mtc' ? 'tcMtcIn' : 'tcInternal')}
            </button>
          ))}
        </div>

        {source !== 'off' && snapshot.midi !== 'ready' && (
          <div className="midi-notice">
            {snapshot.midi === 'unsupported' && t('midiUnsupported')}
            {snapshot.midi === 'denied' && t('midiDenied')}
            {snapshot.midi === 'idle' && (
              <button className="small" title={t('midiConnectHint')} onClick={() => engine.connectMidi()}>
                {t('midiConnect')}
              </button>
            )}
            {snapshot.midi === 'idle' && source === 'internal' && <span>{t('midiOptionalForInternal')}</span>}
          </div>
        )}

        {source === 'mtc' && (
          <PortField
            label={t('tcInput')}
            ports={snapshot.inputs}
            value={snapshot.inputId}
            disabled={snapshot.midi !== 'ready'}
            onChange={(id) => engine.setInput(id)}
          />
        )}

        {source === 'internal' && (
          <>
            <label className="field">
              <span>{t('tcFrameRate')}</span>
              <select value={settings.frameRate} onChange={(e) => set({ frameRate: e.target.value as FrameRate })}>
                {frameRates.map((r) => (
                  <option key={r} value={r}>
                    {rateLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('tcStart')}</span>
              <TcInput
                key={settings.start}
                value={settings.start}
                allowEmpty={false}
                className="tc-start"
                title={t('tcStartHint')}
                onCommit={(start) => start && set({ start })}
              />
            </label>
            <PortField
              label={t('tcOutput')}
              ports={snapshot.outputs}
              value={snapshot.outputId}
              disabled={snapshot.midi !== 'ready'}
              onChange={(id) => engine.setOutput(id)}
            />
          </>
        )}
      </fieldset>

      {/* 生成の操作は本番中にも使うのでショーモードでもロックしない */}
      {source === 'internal' && (
        <div className="tc-transport">
          <button className={snapshot.running ? 'tc-play active' : 'tc-play'} onClick={() => engine.play()}>
            ▶ {t('tcPlay')}
          </button>
          <button onClick={() => engine.stop()}>■ {t('tcStop')}</button>
          <button title={t('tcRewind')} aria-label={t('tcRewind')} onClick={() => engine.rewind()}>
            ⏮
          </button>
        </div>
      )}
    </section>
  );
}

interface PortFieldProps {
  label: string;
  ports: MidiPort[];
  value: string | null;
  disabled: boolean;
  onChange: (id: string | null) => void;
}

/** MIDI の入力・出力先。前に選んだ機器が今つながっていなければ「（未接続）」として残す */
function PortField({ label, ports, value, disabled, onChange }: PortFieldProps) {
  const { t } = useLang();
  const missing = value !== null && !ports.some((p) => p.id === value);
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{t('tcNone')}</option>
        {ports.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        {missing && <option value={value}>{t('tcDisconnected')}</option>}
      </select>
    </label>
  );
}
