import { Fragment, useEffect, useRef, useState, type Dispatch } from 'react';
import { fontSizePresets } from '../defaults';
import { useLang } from '../i18n';
import type { Action } from '../state';
import type { AfterLast, Page } from '../types';

interface Props {
  page: Page;
  pages: Page[];
  selectedCueId: string | null;
  liveCueId: string | null;
  /** GO のたびに変わる。オートフォローのきっかけにする */
  liveKey: string | null;
  /** ショーモード。Cue の選択だけできる */
  locked: boolean;
  dispatch: Dispatch<Action>;
}

const encodeAfterLast = (a: AfterLast) => (a.kind === 'page' ? `page:${a.pageId}` : a.kind);

function decodeAfterLast(value: string): AfterLast {
  if (value.startsWith('page:')) return { kind: 'page', pageId: value.slice(5) };
  return value === 'next' ? { kind: 'next' } : { kind: 'stop' };
}

export function CueList({ page, pages, selectedCueId, liveCueId, liveKey, locked, dispatch }: Props) {
  const { t } = useLang();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOnSelect, setEditOnSelect] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoFollow, setAutoFollow] = useAutoFollow();

  // ↑↓ で選択が動いたら見える位置までスクロール
  useEffect(() => {
    listRef.current?.querySelector('.cue-row.selected')?.scrollIntoView({ block: 'nearest' });
  }, [selectedCueId]);

  // オートフォロー：GO したら実行した Cue を一番上に（次に選択された Cue が 2 段目に来る）。
  // ↑↓ で選択を動かしただけでは動かさない。実行した Cue がこのページに無いときは選択中の Cue を一番上にする
  useEffect(() => {
    const list = listRef.current;
    if (!autoFollow || !list) return;
    const row = list.querySelector<HTMLElement>('.cue-row.live') ?? list.querySelector<HTMLElement>('.cue-row.selected');
    if (!row) return;
    const top = list.scrollTop + row.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollTo({ top, behavior: 'smooth' });
  }, [liveKey, page.id, autoFollow]);

  // 「＋ Cue」で追加された Cue（追加後に選択される）をそのまま編集状態にする
  useEffect(() => {
    if (!editOnSelect) return;
    setEditingId(selectedCueId);
    setEditOnSelect(false);
  }, [selectedCueId, editOnSelect]);

  useEffect(() => setEditingId(null), [page.id, locked]);

  const addCue = () => {
    setEditOnSelect(true);
    dispatch({ type: 'addCue' });
  };

  return (
    <section className="panel cues">
      <div className="panel-header">
        <input
          className="page-title"
          value={page.name}
          readOnly={locked}
          onChange={(e) => dispatch({ type: 'renamePage', id: page.id, name: e.target.value })}
          aria-label={t('pageName')}
        />
        <label className="toggle">
          {t('afterLastCue')}
          <select
            value={encodeAfterLast(page.afterLast)}
            disabled={locked}
            onChange={(e) => dispatch({ type: 'setPageAfterLast', id: page.id, value: decodeAfterLast(e.target.value) })}
          >
            <option value="stop">{t('stop')}</option>
            <option value="next">{t('nextPage')}</option>
            <optgroup label={t('jumpToPage')}>
              {pages.map((p, i) => (
                <option key={p.id} value={`page:${p.id}`}>
                  {i + 1}. {p.name || t('untitled')}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <button
          className={autoFollow ? 'small follow-toggle active' : 'small follow-toggle'}
          aria-pressed={autoFollow}
          title={t('autoFollowHint')}
          onClick={() => setAutoFollow(!autoFollow)}
        >
          {t('autoFollow')}
        </button>
        {!locked && <button className="small" onClick={addCue}>{t('addCue')}</button>}
      </div>

      <div className="cue-head">
        <span />
        <span>#</span>
        <span>{t('text')}</span>
        {/* 保留中: Sec / CD（docs/ideas.md 参照）
        <span>{t('duration')}</span>
        <span title={t('countdownHint')}>CD</span>
        */}
        <span className="time-head" title={t('triggerTimeHint')}>{t('triggerTime')}</span>
        <span />
        <span className="size-head">{t('size')}</span>
        <span />
      </div>
      <div className={autoFollow ? 'cue-list follow' : 'cue-list'} ref={listRef}>
        {page.cues.length === 0 && <div className="empty">{t('noCues')}</div>}
        {page.cues.map((cue, i) => (
          <div
            key={cue.id}
            className={[
              'cue-row',
              cue.id === selectedCueId && 'selected',
              cue.id === liveCueId && 'live',
              dropAt === i && dragFrom !== i && 'drop-target',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => dispatch({ type: 'selectCue', id: cue.id })}
            onDoubleClick={(e) => {
              if (!locked && !(e.target as HTMLElement).closest('textarea, input, button')) setEditingId(cue.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropAt(i);
            }}
            onDrop={() => {
              if (dragFrom !== null && dragFrom !== i) dispatch({ type: 'moveCue', from: dragFrom, to: i });
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
            <span className="cue-number">{i + 1}</span>
            {editingId === cue.id ? (
              <CueTextEditor
                initial={cue.text}
                placeholder={t('emptyText')}
                hint={t('textHint')}
                onDone={(text) => {
                  if (text !== null && text !== cue.text) dispatch({ type: 'updateCue', id: cue.id, patch: { text } });
                  setEditingId(null);
                }}
              />
            ) : (
              <div className="cue-text-display" title={locked ? undefined : t('doubleClickToEdit')}>
                {cue.text ? (
                  cue.text.split('\n').map((line, n) => (
                    <Fragment key={n}>
                      {n > 0 && <span className="newline-mark"> ↵ </span>}
                      {line}
                    </Fragment>
                  ))
                ) : (
                  <span className="placeholder">{t('emptyText')}</span>
                )}
              </div>
            )}
            {/* 保留中: Sec / CD（docs/ideas.md 参照）
            <input
              className="cue-duration"
              type="number"
              min={0}
              step={1}
              value={cue.duration}
              title={t('durationHint')}
              onFocus={() => dispatch({ type: 'selectCue', id: cue.id })}
              onChange={(e) =>
                dispatch({ type: 'updateCue', id: cue.id, patch: { duration: Math.max(0, Number(e.target.value) || 0) } })
              }
            />
            <input
              type="checkbox"
              checked={cue.countdown}
              aria-label={t('countdownHint')}
              title={t('countdownHint')}
              onChange={(e) => dispatch({ type: 'updateCue', id: cue.id, patch: { countdown: e.target.checked } })}
            />
            */}
            <TimeInput
              key={cue.triggerAt}
              seconds={cue.triggerAt}
              off={!cue.triggerEnabled || !page.timeTriggers}
              readOnly={locked}
              title={t('triggerTimeHint')}
              onCommit={(triggerAt) => dispatch({ type: 'updateCue', id: cue.id, patch: { triggerAt } })}
            />
            {/* 時刻トリガーだけのオン／オフ。手動の GO や ↑↓ の選択には関係しない。ショーモードでも切り替えられる */}
            <button
              className={cue.triggerEnabled ? 'on-off trigger-toggle active' : 'on-off trigger-toggle'}
              aria-pressed={cue.triggerEnabled}
              disabled={cue.triggerAt === null}
              title={t('cueTriggerHint')}
              onClick={() => dispatch({ type: 'updateCue', id: cue.id, patch: { triggerEnabled: !cue.triggerEnabled } })}
            >
              {cue.triggerEnabled ? 'ON' : 'OFF'}
            </button>
            <div className="size-presets" title={t('cueSizeHint')}>
              {Object.entries(fontSizePresets).map(([label, size]) => (
                <button
                  key={label}
                  className={cue.fontSize === size ? 'active' : ''}
                  disabled={locked}
                  onClick={() => dispatch({ type: 'updateCue', id: cue.id, patch: { fontSize: size } })}
                >
                  {label}
                </button>
              ))}
            </div>
            {locked ? (
              <span />
            ) : (
              <button
                className="icon-button"
                aria-label={t('deleteCue')}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'deleteCue', id: cue.id });
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const AUTO_FOLLOW_KEY = 'prompter.autoFollow';

/** オートフォローの ON/OFF。操作する人の好みなのでショーファイルではなくブラウザに覚える */
function useAutoFollow() {
  const [on, setOn] = useState(() => localStorage.getItem(AUTO_FOLLOW_KEY) !== 'off');
  useEffect(() => localStorage.setItem(AUTO_FOLLOW_KEY, on ? 'on' : 'off'), [on]);
  return [on, setOn] as const;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 0 時からの秒を「14:30:00」にする */
function formatTimeOfDay(seconds: number) {
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
}

/** 「14:30」「14:30:05」「1430」「143005」を 0 時からの秒にする。空は null、読めなければ undefined */
function parseTimeOfDay(text: string): number | null | undefined {
  const value = text.trim();
  if (value === '') return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value) ?? /^(\d{2})(\d{2})(\d{2})?$/.exec(value);
  if (!match) return undefined;
  const [h, m, s] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  if (h > 23 || m > 59 || s > 59) return undefined;
  return h * 3600 + m * 60 + s;
}

interface TimeInputProps {
  seconds: number | null;
  /** トリガーがオフ（Cue かページで）。時刻を薄く表示する */
  off: boolean;
  readOnly: boolean;
  title: string;
  onCommit: (seconds: number | null) => void;
}

/** 時刻トリガーの時刻。Enter か欄の外をクリックで確定し、読めない入力は元に戻す */
function TimeInput({ seconds, off, readOnly, title, onCommit }: TimeInputProps) {
  const [draft, setDraft] = useState(seconds === null ? '' : formatTimeOfDay(seconds));
  const commit = () => {
    const parsed = parseTimeOfDay(draft);
    if (parsed === undefined || parsed === seconds) setDraft(seconds === null ? '' : formatTimeOfDay(seconds));
    else onCommit(parsed);
  };
  return (
    <input
      className={off ? 'cue-time off' : 'cue-time'}
      value={draft}
      placeholder="--:--:--"
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

interface EditorProps {
  initial: string;
  placeholder: string;
  hint: string;
  /** 確定したテキスト。取り消しは null */
  onDone: (text: string | null) => void;
}

function CueTextEditor({ initial, placeholder, hint, onDone }: EditorProps) {
  const [value, setValue] = useState(initial);
  const cancelled = useRef(false);

  return (
    <textarea
      className="cue-text"
      rows={1}
      autoFocus
      value={value}
      placeholder={placeholder}
      title={hint}
      onFocus={(e) => e.currentTarget.setSelectionRange(value.length, value.length)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(cancelled.current ? null : value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        // Enter で確定、Shift+Enter で改行、Esc で取り消し
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
    />
  );
}
