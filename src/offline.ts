import { useEffect, useState } from 'react';

/**
 * 公開版を回線のない場所でも開き直せるようにする（Service Worker、元は src/sw.js）。
 * ページとファイルの保存が済んだら true。開発サーバーでは使わない
 */
export function useOfflineReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // 保存が済むまで sw.js は有効にならない
    let active = true;
    void navigator.serviceWorker.ready.then(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);
  return ready;
}
