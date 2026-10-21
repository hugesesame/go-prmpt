# GO PRMPT

[English](README.md) | **日本語**

ライブやイベントのためのキュー式プロンプターです。Cue リストに並べた文言を、別ウィンドウ（出力ウィンドウ）に 1 つずつ出します。Space キーでの手動実行のほか、時刻やタイムコード（MTC / LTC）での自動実行もできます。

> [!IMPORTANT]
> **パソコンの Chrome 専用です。スマートフォンやタブレットでは使えません。** キーボード操作・別ウィンドウでの出力・Web MIDI やファイルの保存など Chrome の機能を使っているためです。

**アプリを開く：https://hugesesame.github.io/go-prmpt/**

<!-- TODO: add screenshots/main.png, then uncomment
![GO PRMPT](screenshots/main.png)
-->

## 主な機能

- ページに分けた Cue リスト。Space キーで GO、次に出る Cue を NEXT でプレビュー
- 16:9 の出力ウィンドウ（外部ディスプレイがあればそちらに開く）
- 出力に重ねるカウントダウンとメッセージ
- 時刻・タイムコードでの自動実行（MTC 受信・LTC 受信・内部生成と MTC / LTC 出力）
- CLEAR・BLACK OUT・BLINK、ディゾルブ／カット、色とアウトラインの設定
- 本番中に編集をロックする SHOW モード
- ショーファイルの保存と読み込み、CSV からの読み込み
- 英語・日本語の画面

## はじめ方

1. パソコンの Chrome でアプリを開きます。
2. ツールバーの「出力ウィンドウを開く」を押し、出力ウィンドウを表示したい画面に移します（`F` キーでフルスクリーン）。
3. 詳しい使い方は、`?` キーか左下の「ヘルプ」ボタンで見られます。

サンプルで試すときは、[`samples/sample-show.json`](samples/sample-show.json) をダウンロードし、「開く」で読み込んでください。

## データについて

ショーのデータはお使いのパソコンの中だけにあります。編集内容はブラウザに自動で保存され、「保存」で好きな場所にファイルとして残せます。サーバーには何も送りません。

## 開発

Node.js 20.19 以上（または 22.12 以上）が必要です。

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/ に出力
```

`main` に push すると、GitHub Actions がビルドして GitHub Pages に公開します。
