import { useEffect, useRef } from 'react';
import type { CsvImport, CsvWarning } from '../csv';
import { cueSizeRange } from '../defaults';
import { useLang, type Translate } from '../i18n';

interface Props {
  fileName: string;
  result: CsvImport;
  onImport: () => void;
  onCancel: () => void;
}

/** CSV から作るページの確認。「読み込む」を押すまでショーは変わらない */
export function CsvImportDialog({ fileName, result, onImport, onCancel }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const cueCount = result.pages.reduce((sum, p) => sum + p.cues.length, 0);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    // Esc（cancel）でも閉じる。閉じたら親が消す
    <dialog ref={ref} className="csv-dialog" onClose={onCancel}>
      <h2>{t('csvTitle', { file: fileName })}</h2>
      {cueCount === 0 ? (
        <p>{t('csvNoCues')}</p>
      ) : (
        <>
          <p>{t('csvSummary', { pages: String(result.pages.length), cues: String(cueCount) })}</p>
          <table className="csv-pages">
            <thead>
              <tr>
                <th>{t('csvPage')}</th>
                <th>{t('csvCues')}</th>
                <th>{t('csvTimed')}</th>
                <th>{t('csvFirstCue')}</th>
              </tr>
            </thead>
            <tbody>
              {result.pages.map((page) => (
                <tr key={page.id}>
                  <td>{page.name}</td>
                  <td className="num">{page.cues.length}</td>
                  <td className="num">{page.cues.filter((c) => c.triggerAt !== null || c.tcAt !== null).length}</td>
                  <td className="first-cue">{page.cues[0].text.replace(/\n/g, ' ↵ ') || t('emptyText')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {result.warnings.length > 0 && (
        <ul className="csv-warnings">
          {result.warnings.map((w, i) => (
            <li key={i}>⚠ {warningText(w, t)}</li>
          ))}
        </ul>
      )}
      {/* 最初はキャンセルにフォーカスする。いつもの癖で Space を押しても読み込まない */}
      <div className="dialog-buttons">
        <button autoFocus onClick={() => ref.current?.close()}>{t('cancel')}</button>
        <button className="primary" disabled={cueCount === 0} onClick={onImport}>
          {t('import')}
        </button>
      </div>
    </dialog>
  );
}

function warningText(w: CsvWarning, t: Translate) {
  const params = { row: String(w.row), value: w.value };
  if (w.column === 'time') return t('csvBadTime', params);
  if (w.column === 'trigger') return t('csvBadTrigger', params);
  if (w.clampedTo === undefined) return t('csvBadSize', params);
  return t('csvSizeClamped', {
    ...params,
    min: String(cueSizeRange.min),
    max: String(cueSizeRange.max),
    size: String(w.clampedTo),
  });
}
