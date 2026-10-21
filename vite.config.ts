import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ビルド結果のファイル一覧を埋め込んだ dist/sw.js を作る（元は src/sw.js）。
 * 一覧が変われば版も変わるので、公開し直すと新しい版に入れ替わる
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((file) => file !== 'index.html')
        .sort();
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      const source = readFileSync('src/sw.js', 'utf8')
        .replaceAll('__VERSION__', version)
        .replaceAll('__FILES__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// base を相対パスにして Vercel / GitHub Pages のどちらでも動くようにする
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
});
