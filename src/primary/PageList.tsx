import { useState, type Dispatch } from 'react';
import { useLang } from '../i18n';
import { afterLastTarget, type Action } from '../state';
import type { Page } from '../types';

interface Props {
  pages: Page[];
  currentPageId: string;
  /** ショーモード。ページの選択だけできる */
  locked: boolean;
  onImportCsv: () => void;
  dispatch: Dispatch<Action>;
}

export function PageList({ pages, currentPageId, locked, onImportCsv, dispatch }: Props) {
  const { t } = useLang();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  const remove = (page: Page) => {
    if (page.cues.length > 0 && !confirm(t('confirmDeletePage', { name: page.name }))) return;
    dispatch({ type: 'deletePage', id: page.id });
  };

  return (
    <aside className="panel pages">
      <div className="panel-header">
        <span>{t('pages')}</span>
        {!locked && (
          <div className="toolbar-group">
            <button className="small" title={t('importCsvHint')} onClick={onImportCsv}>{t('importCsv')}</button>
            <button className="small" onClick={() => dispatch({ type: 'addPage' })}>{t('addPage')}</button>
          </div>
        )}
      </div>
      <ol className="page-list">
        {pages.map((page, i) => {
          const target = afterLastTarget(pages, page);
          return (
            <li
              key={page.id}
              className={[
                'page-item',
                page.id === currentPageId && 'current',
                dropAt === i && dragFrom !== i && 'drop-target',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!locked}
              // Cue の数は場所を取るので一覧には出さず、マウスを重ねたときに出す
              title={t('pageTooltip', { name: page.name || t('untitled'), count: String(page.cues.length) })}
              onClick={() => dispatch({ type: 'selectPage', id: page.id })}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDropAt(i);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDropAt(null);
              }}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) dispatch({ type: 'movePage', from: dragFrom, to: i });
              }}
            >
              <span className="page-index">{i + 1}</span>
              <span className="page-name">{page.name || t('untitled')}</span>
              {target && (
                <span
                  className="page-auto"
                  title={
                    page.afterLast.kind === 'next'
                      ? t('afterLastNext')
                      : t('afterLastJump', { name: target.name || t('untitled') })
                  }
                >
                  {page.afterLast.kind === 'next' ? '→' : `↪${pages.indexOf(target) + 1}`}
                </span>
              )}
              <button
                className={page.triggerSource === 'tc' ? 'source-toggle tc' : 'source-toggle'}
                disabled={locked}
                title={t('pageSourceHint')}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'setPageTriggerSource', id: page.id, source: page.triggerSource === 'tc' ? 'clock' : 'tc' });
                }}
              >
                {page.triggerSource === 'tc' ? 'TC' : 'CLK'}
              </button>
              {/* 時刻トリガーは本番中に止めたいこともあるのでショーモードでも切り替えられる */}
              <button
                className={page.timeTriggers ? 'on-off trigger-toggle active' : 'on-off trigger-toggle'}
                aria-pressed={page.timeTriggers}
                title={t('pageTriggerHint')}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'setPageTimeTriggers', id: page.id, on: !page.timeTriggers });
                }}
              >
                {page.timeTriggers ? 'ON' : 'OFF'}
              </button>
              {!locked && pages.length > 1 && (
                <button
                  className="icon-button"
                  aria-label={t('deletePage')}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(page);
                  }}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
