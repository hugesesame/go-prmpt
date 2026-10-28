import { useEffect, useRef, useState } from 'react';

// タッチ操作で画面が狭い端末（スマホ）だけ。タブレットや PC では出さない
const PHONE_QUERY = '(pointer: coarse) and (max-width: 767px)';
const DISMISSED_KEY = 'prompter.mobileNoticeDismissed';

function shouldShow(): boolean {
  if (!window.matchMedia(PHONE_QUERY).matches) return false;
  try {
    return sessionStorage.getItem(DISMISSED_KEY) !== '1';
  } catch {
    return true;
  }
}

/** スマホで開いたときの注意。言語の設定にかかわらず英語で出す。閉じたらこのタブでは再読み込みしても出さない */
export function MobileNotice() {
  const [open, setOpen] = useState(shouldShow);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    // アプリの画面は端末より広く、ふつうに中央へ置くと見えている範囲の外に出る。
    // 見えている範囲の左上に置き、スクロールやピンチで範囲が動いたら追いかける
    const view = window.visualViewport;
    const place = () => {
      dialog.style.left = `${(view?.offsetLeft ?? 0) + 16}px`;
      dialog.style.top = `${(view?.offsetTop ?? 0) + 16}px`;
      dialog.style.width = `${(view?.width ?? screen.width) - 32}px`;
    };
    place();
    dialog.showModal();
    view?.addEventListener('resize', place);
    view?.addEventListener('scroll', place);
    return () => {
      view?.removeEventListener('resize', place);
      view?.removeEventListener('scroll', place);
    };
  }, [open]);

  if (!open) return null;

  const onClose = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // 保存できなくても閉じるだけ
    }
    setOpen(false);
  };

  return (
    // Esc（cancel）でも閉じる
    <dialog ref={ref} className="csv-dialog mobile-notice" lang="en" onClose={onClose}>
      <h2>Best on a computer</h2>
      <p>
        GO PRMPT is designed for a computer with a keyboard, running Chrome, with the output shown on a second screen.
      </p>
      <p>On a phone, the screen is too small and some features may not work.</p>
      <div className="dialog-buttons">
        <button className="primary" autoFocus onClick={() => ref.current?.close()}>
          Continue anyway
        </button>
      </div>
    </dialog>
  );
}
