import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';
import { helpSections } from './helpContent';

/** 取扱説明書。左に目次、右に本文。ENG / JPN の切り替えに合わせて言語が変わる */
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const { lang, setLang, t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = helpSections[lang];
  const [current, setCurrent] = useState(sections[0].id);

  // 開いたら本文にフォーカスする。いつもの癖で Space を押しても、ボタンではなく本文のスクロールになる
  useEffect(() => {
    ref.current?.showModal();
    bodyRef.current?.focus();
  }, []);

  // 本文をスクロールしたら、見えている節を目次で光らせる
  const onScroll = () => {
    const body = bodyRef.current;
    if (!body) return;
    const top = body.getBoundingClientRect().top + 24;
    let visible = sections[0].id;
    for (const el of body.querySelectorAll<HTMLElement>('section[data-id]')) {
      if (el.getBoundingClientRect().top <= top) visible = el.dataset.id!;
    }
    // 一番下まで来たら最後の節（短くて上まで来ないことがある）
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) visible = sections.at(-1)!.id;
    setCurrent(visible);
  };

  const jump = (id: string) => {
    bodyRef.current?.querySelector(`section[data-id="${id}"]`)?.scrollIntoView({ block: 'start' });
    setCurrent(id);
  };

  return (
    // Esc（cancel）でも閉じる。閉じたら親が消す
    <dialog ref={ref} className="help-dialog" onClose={onClose}>
      <header className="help-header">
        <h2>{t('help')}</h2>
        {/* 開いている間は後ろのツールバーを押せないので、ここでも言語を切り替えられるようにする */}
        <button
          className="pill-toggle help-lang"
          role="switch"
          aria-checked={lang === 'ja'}
          aria-label="ENG / JPN"
          onClick={() => setLang(lang === 'en' ? 'ja' : 'en')}
        >
          <span className={lang === 'en' ? 'active' : ''}>ENG</span>
          <span className={lang === 'ja' ? 'active' : ''}>JPN</span>
        </button>
        <button className="help-close" aria-label={t('close')} onClick={() => ref.current?.close()}>
          ×
        </button>
      </header>
      <div className="help-layout">
        <nav className="help-toc">
          {sections.map((s, i) => (
            <button key={s.id} className={s.id === current ? 'active' : ''} onClick={() => jump(s.id)}>
              <span className="help-toc-number">{i + 1}</span>
              {s.title}
            </button>
          ))}
        </nav>
        <div className="help-body" ref={bodyRef} tabIndex={-1} onScroll={onScroll}>
          {sections.map((s, i) => (
            <section key={s.id} data-id={s.id}>
              <h3>
                <span className="help-toc-number">{i + 1}</span>
                {s.title}
              </h3>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
