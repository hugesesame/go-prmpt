import { useEffect, useState } from 'react';

export function toggleFullscreen() {
  // ダブルクリックで近くの文字が選択されてしまうのを消す
  window.getSelection()?.removeAllRanges();
  // ブラウザに拒否された場合（ユーザー操作でない呼び出しなど）は何もしない
  const request = document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
  request.catch(() => {});
}

export function useIsFullscreen() {
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  return fullscreen;
}
