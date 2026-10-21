// 公開版を、回線のない場所でも開き直せるようにする Service Worker の元。
// ビルドのとき vite.config.ts が版とファイルの一覧（ページ以外の全ファイル）を埋めて dist/sw.js にする。
// 回線がある時はページを常に取りに行き、取れない時だけ保存した版を返す。ファイル名に中身のハッシュが入る
// JS・CSS などは、保存した版をそのまま使う

const CACHE = 'go-prmpt-__VERSION__';
const PAGE = self.registration.scope;
const FILES = __FILES__.map((file) => new URL(file, PAGE).href);
const TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([PAGE, ...FILES]))
      .then(() => self.skipWaiting()),
  );
});

// 前の版の保存を消す
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('go-prmpt-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // 出力ウィンドウ（?output）も同じページ
  if (request.mode === 'navigate') event.respondWith(openPage(request));
  else if (FILES.includes(request.url)) event.respondWith(openFile(request));
});

async function openPage(request) {
  const cache = await caches.open(CACHE);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const fresh = await fetch(request, { signal: abort.signal });
    // サーバー側の障害の時は、保存した版があればそちらを出す
    if (fresh.status < 500) return fresh;
    return (await cache.match(PAGE, { ignoreVary: true })) ?? fresh;
  } catch (error) {
    const saved = await cache.match(PAGE, { ignoreVary: true });
    if (saved) return saved;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// サーバーが Vary: Origin を付けていても、ページの <script crossorigin> や AudioWorklet の読み込み
// （Origin 付き）で保存した版が使われるよう、Vary は見ない。ファイル名が中身ごとに変わるので取り違えはない
async function openFile(request) {
  return (await caches.match(request.url, { ignoreVary: true })) ?? fetch(request);
}
