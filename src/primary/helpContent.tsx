import type { ReactNode } from 'react';
import type { Lang } from '../i18n';

// ヘルプ（取扱説明書）の本文。画面の文言（i18n.tsx）に合わせて書く。機能を変えたらここも直す

export interface HelpSection {
  id: string;
  title: string;
  body: ReactNode;
}

const ja: HelpSection[] = [
  {
    id: 'intro',
    title: 'はじめに',
    body: (
      <>
        <p>GO PRMPT（ゴー・プロンプト）は、Cue リストに並べた文言を、別ウィンドウ（出力ウィンドウ）に順番に出すアプリです。Chrome で使います。</p>
        <h4>画面の構成</h4>
        <ul>
          <li><b>左</b>：GO・CLEAR・BLACK OUT・BLINK の操作ボタンと、ページの一覧（右端の境目をドラッグで幅を変えられます。ダブルクリックで元の幅に戻ります）</li>
          <li><b>中央</b>：今のページの Cue リストと、その下にカウントダウン・メッセージのリスト（境目はドラッグで高さを変えられます）</li>
          <li><b>右</b>：出力のプレビュー（PROGRAM＝今出ているもの、NEXT＝次に出るもの）と、出力・タイムコードの設定</li>
        </ul>
        <h4>出力ウィンドウ</h4>
        <ul>
          <li>ツールバーの「出力ウィンドウを開く」で開きます。外部ディスプレイがあればそちらに開きます（初回に「画面の配置」の許可を聞かれたら「許可」）。</li>
          <li>出力ウィンドウは <kbd>F</kbd> かダブルクリックでフルスクリーンになります。マウスを動かさないとカーソルとボタンは隠れます。</li>
          <li>出力は常に 16:9 で、PROGRAM のプレビューと同じ見た目になります。</li>
        </ul>
        <h4>保存について</h4>
        <ul>
          <li>編集した内容はブラウザに自動で保存され、開き直すと続きから使えます。ファイルに残すときは「保存」してください。</li>
          <li>同じアプリを複数のタブで開くと黄色い警告が出ます。お互いの編集を上書きしてしまうので、1 つだけ残して閉じてください。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'basics',
    title: '基本の操作',
    body: (
      <>
        <ul>
          <li><b>GO（<kbd>Space</kbd>）</b>：選択中の Cue を出力に出し、選択を次の Cue に進めます。実行中の Cue は緑、選択中の Cue は青で表示されます。</li>
          <li><b>Cue の選択</b>：クリックか <kbd>↑</kbd> <kbd>↓</kbd>。</li>
          <li><b>CLEAR（<kbd>C</kbd>）</b>：出力の文言を消します。</li>
          <li><b>BLACK OUT（<kbd>Z</kbd>）</b>：出力を真っ暗にします（カウントダウン・メッセージも隠れます）。もう一度押すと戻ります。</li>
          <li><b>BLINK（<kbd>B</kbd>）</b>：出力の文言を点滅させます。もう一度押すと止まります。</li>
        </ul>
        <h4>NEXT プレビュー</h4>
        <ul>
          <li>右の NEXT に、次の GO で出る Cue が今の色・サイズで表示されます。帯をクリックすると開閉し、閉じているときは帯に文言が出ます。</li>
          <li>NEXT をダブルクリックすると、その場で文言を編集できます（PROGRAM モードのみ）。</li>
        </ul>
        <h4>オートフォロー</h4>
        <p>Cue リスト右上の「オートフォロー」がオンのとき、GO するたびに実行した Cue が一番上、次の Cue が 2 段目に来るようにスクロールします。</p>
      </>
    ),
  },
  {
    id: 'cues',
    title: 'Cue の編集',
    body: (
      <>
        <ul>
          <li><b>追加</b>：「＋ Cue」。追加した Cue はすぐ編集できる状態になります。</li>
          <li><b>文言の編集</b>：Cue をダブルクリック。<kbd>Enter</kbd> で確定、<kbd>Shift</kbd>+<kbd>Enter</kbd> で改行、<kbd>Esc</kbd> で取り消し。</li>
          <li><b>改行</b>：出力では自動で折り返さないので、改行は自分で入れます。リストでは改行が「↵」で表示されます。</li>
          <li><b>並べ替え</b>：左端の ⋮⋮ をドラッグ。</li>
          <li><b>文字サイズ</b>：行の S / M / L、または右の「Cue サイズ」スライダー（選択中の Cue に効きます）。</li>
          <li><b>削除</b>：行の右端の ×。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'pages',
    title: 'ページ',
    body: (
      <>
        <p>Cue リストはページごとに分けられます。たとえば 1 曲 1 ページにすると、本番中に探しやすくなります。</p>
        <ul>
          <li><b>追加</b>：ページ一覧の「＋ ページ」。名前は Cue リストの上の欄で変えられます。</li>
          <li><b>切り替え</b>：クリックか <kbd>←</kbd> <kbd>→</kbd>。ページにマウスを重ねると、名前と Cue の数が出ます。</li>
          <li><b>並べ替え</b>：ドラッグ。<b>削除</b>は ×（Cue があるときは確認が出ます）。</li>
          <li><b>最後の Cue の後</b>：ページの最後の Cue を GO した後、「停止」「次のページ」「ページへ移動」（ページを指定）から選べます。自動で進むページには一覧に → や ↪ が付きます。</li>
          <li><b>CLK / TC</b>：このページの Cue を時計の時刻（CLK）とタイムコード（TC）のどちらで自動実行するか（「時刻・TC トリガー」参照）。</li>
          <li><b>ON / OFF</b>：このページの時刻・TC トリガーをまとめてオン／オフします。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'overlays',
    title: 'カウントダウン・メッセージ',
    body: (
      <>
        <p>Cue とは別に、出力の上に重ねて出せます。リストはショー全体で 1 つです。GO とは関係なく出し入れできます。</p>
        <h4>カウントダウン（画面の上）</h4>
        <ul>
          <li>行の <b>LEN / TIME</b> で数え方を選びます。<b>LEN</b> は長さ（「5:00」など）、<b>TIME</b> は終わる時刻（「19:00」など、24 時間表記）まで数えます。</li>
          <li>「▶ START」で出して数え始めます。「■ STOP」で消えます。</li>
          <li>LEN のときは、⏸ で一時停止、もう一度押すと再開します。↺ で最初の時間に戻して一時停止します（▶ で数え始めます）。TIME のときは時計を止められないので、⏸ と ↺ は使えません。</li>
          <li>TIME で、START したときにもう過ぎている時刻なら、過ぎた分を赤で数えます。日付をまたぐ時刻（23:50 に「0:10」など）は翌日として数えます。</li>
          <li>0 を過ぎると赤くなり、「-0:12」のように経過時間を数えます。</li>
        </ul>
        <h4>メッセージ（画面の下）</h4>
        <ul>
          <li>文言を入れて「▶ ON」で出し、「■ OFF」で消します。緊急の連絡や進行の伝達に使えます。</li>
          <li>BLINK で点滅させられます（出している間に押すとすぐ反映）。</li>
        </ul>
        <h4>共通</h4>
        <ul>
          <li>カウントダウンとメッセージは 1 つずつ出せます。別のものを出すと入れ替わります。</li>
          <li>スライダーで文字の大きさを変えられます。BLACK OUT で一緒に隠れ、BLINK（メイン）では点滅しません。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'triggers',
    title: '時刻・TC トリガー',
    body: (
      <>
        <p>Cue に時刻やタイムコードを入れておくと、その時に自動で GO と同じように実行されます。開いていないページの Cue も実行され、ページの表示もそこへ移ります。</p>
        <h4>時刻（CLK のページ）</h4>
        <ul>
          <li>「時刻」の欄に 24 時間表記で入れます。「14:30」「14:30:00」「143000」のどれでも読めます。空欄なら自動実行しません。</li>
          <li>過ぎた時刻は飛ばします（開いた時点で過ぎている Cue は実行しません）。</li>
        </ul>
        <h4>タイムコード（TC のページ）</h4>
        <ul>
          <li>ページを TC にすると「時刻」の欄が「TC」になり、「01:02:15:12」のように入れます。</li>
          <li>タイムコードが進んでいる間に、その位置を通った Cue を実行します。頭出しで飛ばした位置の Cue は実行しません。頭出しした位置ちょうどの Cue は実行します。</li>
          <li>タイムコードの受け方・作り方は「タイムコード」を見てください。</li>
        </ul>
        <h4>オン／オフ</h4>
        <ul>
          <li>Cue ごとの ON / OFF と、ページごとの ON / OFF があります。どちらも自動実行だけに効き、<kbd>Space</kbd> の GO はいつでも使えます。</li>
          <li>同じ時刻に複数の Cue があるときは、リストで後ろの Cue が残ります。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'timecode',
    title: 'タイムコード',
    body: (
      <>
        <p>右の「タイムコード」で選びます。今の位置はヘッダーの時計の横に出ます（進んでいる間は緑）。</p>
        <h4>MTC 受信</h4>
        <ul>
          <li>「MIDI に接続」を押し、Chrome の確認で許可してから「MTC 入力」で機器を選びます。</li>
        </ul>
        <h4>LTC 受信</h4>
        <ul>
          <li>「オーディオに接続」を押し、Chrome の確認で「許可する」を選びます（機器の名前を出すのにも必要です）。</li>
          <li>「LTC 入力」でオーディオ機器を、「チャンネル」で LTC が来ているチャンネルを選びます。</li>
          <li>「信号」の欄で状態が分かります：信号なし／音はあるが LTC を読めない／LTC 受信中。</li>
        </ul>
        <h4>内部生成</h4>
        <ul>
          <li>アプリの中でタイムコードを作ります。fps と開始位置を決め、▶ PLAY / ■ STOP / ⏮（開始位置に戻る）で操作します。ヘッダーの小さなボタンでも同じことができます。</li>
          <li>「MTC 出力」で MIDI 機器に、「LTC 出力」でオーディオ機器に、作ったタイムコードを送れます。</li>
        </ul>
        <p>MIDI・オーディオ機器の選択はこのパソコンのブラウザに覚えます（ショーファイルには入りません）。</p>
      </>
    ),
  },
  {
    id: 'output',
    title: '出力の設定',
    body: (
      <ul>
        <li><b>カラー</b>：背景・文字・アウトラインの色。色の四角をクリックするとカラーホイールが開きます。アウトラインは ON / OFF もできます。</li>
        <li><b>文字</b>：選択中の Cue のサイズと、アウトラインの太さ。</li>
        <li><b>トランジション</b>：Cue が切り替わるときの見せ方。ディゾルブ（時間を指定）かカット。</li>
      </ul>
    ),
  },
  {
    id: 'modes',
    title: 'PROGRAM／SHOW モード',
    body: (
      <>
        <p>ツールバーの PROGRAM / SHOW で切り替えます。SHOW は本番用で、うっかり編集しないようにロックします（ツールバーの下に赤い線が出ます）。</p>
        <ul>
          <li><b>SHOW でロックされるもの</b>：Cue・ページ・カウントダウン・メッセージの編集、出力とタイムコードの設定、新規・開く、ショー名。</li>
          <li><b>SHOW でも使えるもの</b>：GO・CLEAR・BLACK OUT・BLINK、Cue とページの選択、トリガーの ON / OFF、カウントダウン・メッセージの出し入れ・一時停止・リセット・BLINK、内部生成の PLAY / STOP / ⏮、保存。</li>
        </ul>
      </>
    ),
  },
  {
    id: 'files',
    title: 'ファイル・CSV',
    body: (
      <>
        <h4>保存と読み込み</h4>
        <ul>
          <li>「保存」（<kbd>⌘</kbd>+<kbd>S</kbd>）で好きな場所にショーファイルを保存します。2 回目からは同じファイルに上書きします。「別名で保存」（<kbd>⇧</kbd>+<kbd>⌘</kbd>+<kbd>S</kbd>）で別のファイルにできます。</li>
          <li>「開く」（<kbd>⌘</kbd>+<kbd>O</kbd>）で保存したファイルを読み込みます。</li>
        </ul>
        <h4>CSV の読み込み</h4>
        <p>ページ一覧の「CSV」で、表計算ソフトで作った CSV を<b>新しいページ</b>として読み込みます（今あるページは変わりません）。読み込む前に確認が出ます。</p>
        <table className="help-table">
          <thead>
            <tr>
              <th>列</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>text</code>（テキスト）</td>
              <td>文言（必須）。セル内の改行はそのまま改行になります</td>
            </tr>
            <tr>
              <td><code>time</code>（時刻）</td>
              <td>時刻「14:30:00」か、タイムコード「01:02:15:12」</td>
            </tr>
            <tr>
              <td><code>page</code>（ページ）</td>
              <td>ページ名。同じ名前の行は 1 つのページに。空欄は上の行と同じページ</td>
            </tr>
            <tr>
              <td><code>size</code>（サイズ）</td>
              <td>S / M / L か数字（5〜40）。空欄は M</td>
            </tr>
            <tr>
              <td><code>trigger</code>（トリガー）</td>
              <td>ON / OFF。空欄は ON</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>1 行目が見出し（英語でも日本語でも可）。見出しが無いときは上の表の順の列とみなします。text 以外は省略できます。</li>
          <li>page の列が無いときは、ファイル名のページになります。今あるページと名前が同じなら「名前 (2)」になります。</li>
          <li>タイムコードだけのページは TC のページになります。文字コードは UTF-8 でも Shift_JIS でも読めます。</li>
        </ul>
        <pre className="help-example">{`text,time,page,size
開演します,19:00:00,オープニング,L
ようこそ,,オープニング,M`}</pre>
      </>
    ),
  },
  {
    id: 'shortcuts',
    title: 'ショートカット',
    body: (
      <>
        <table className="help-table">
          <tbody>
            {[
              ['Space', 'GO'],
              ['↑ / ↓', 'Cue の選択'],
              ['← / →', 'ページの切り替え'],
              ['C', 'CLEAR'],
              ['Z', 'BLACK OUT'],
              ['B', 'BLINK'],
              ['F', 'フルスクリーン（出力ウィンドウでも使えます）'],
              ['?', 'このヘルプ'],
              ['⌘S / ⇧⌘S', '保存 / 別名で保存'],
              ['⌘O', '開く'],
              ['Cue をダブルクリック', '文言の編集'],
              ['余白をダブルクリック', 'フルスクリーン'],
            ].map(([key, action]) => (
              <tr key={key}>
                <td><kbd>{key}</kbd></td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>文字を入力している欄では、Space などのショートカットは効きません。</p>
      </>
    ),
  },
];

const en: HelpSection[] = [
  {
    id: 'intro',
    title: 'Getting started',
    body: (
      <>
        <p>GO PRMPT (pronounced "Go Prompt") shows the lines in your cue list, one after another, in a separate output window. Use it in Chrome.</p>
        <h4>Screen layout</h4>
        <ul>
          <li><b>Left</b>: the GO, CLEAR, BLACK OUT and BLINK buttons, and the page list (drag its right edge to resize; double-click to reset)</li>
          <li><b>Center</b>: the cue list of the current page, with the countdown and message list below it (drag the divider to resize)</li>
          <li><b>Right</b>: output previews (PROGRAM = on air now, NEXT = runs on the next GO) and the output and timecode settings</li>
        </ul>
        <h4>Output window</h4>
        <ul>
          <li>Open it with "Open Output" in the toolbar. It opens on an external display if there is one (allow "Window management" when Chrome asks the first time).</li>
          <li>Press <kbd>F</kbd> or double-click the output window for fullscreen. The cursor and button hide when the mouse is still.</li>
          <li>The output is always 16:9 and looks exactly like the PROGRAM preview.</li>
        </ul>
        <h4>Saving</h4>
        <ul>
          <li>Your edits are saved in the browser automatically and are still there when you reopen the app. Use "Save" to keep a file.</li>
          <li>If the app is open in more than one tab, a yellow warning appears. The tabs overwrite each other's edits, so close all but one.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'basics',
    title: 'Basic operation',
    body: (
      <>
        <ul>
          <li><b>GO (<kbd>Space</kbd>)</b>: shows the selected cue on the output and selects the next cue. The live cue is green; the selected cue is blue.</li>
          <li><b>Select a cue</b>: click it, or use <kbd>↑</kbd> <kbd>↓</kbd>.</li>
          <li><b>CLEAR (<kbd>C</kbd>)</b>: clears the text from the output.</li>
          <li><b>BLACK OUT (<kbd>Z</kbd>)</b>: turns the output black (the countdown and message are hidden too). Press again to return.</li>
          <li><b>BLINK (<kbd>B</kbd>)</b>: makes the output text blink. Press again to stop.</li>
        </ul>
        <h4>NEXT preview</h4>
        <ul>
          <li>NEXT on the right shows the cue that runs on the next GO, with the current colors and size. Click its bar to show or hide it; when hidden, the bar shows the text.</li>
          <li>Double-click NEXT to edit the text in place (PROGRAM mode only).</li>
        </ul>
        <h4>Auto Follow</h4>
        <p>When "Auto Follow" (top right of the cue list) is on, each GO scrolls the list so the live cue is the top row and the next cue is the second.</p>
      </>
    ),
  },
  {
    id: 'cues',
    title: 'Editing cues',
    body: (
      <ul>
        <li><b>Add</b>: "+ Cue". The new cue opens for editing right away.</li>
        <li><b>Edit text</b>: double-click a cue. <kbd>Enter</kbd> to finish, <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line, <kbd>Esc</kbd> to cancel.</li>
        <li><b>Line breaks</b>: the output never wraps text, so add line breaks yourself. The list shows them as "↵".</li>
        <li><b>Reorder</b>: drag the ⋮⋮ handle on the left.</li>
        <li><b>Text size</b>: S / M / L on the row, or the "Cue size" slider on the right (applies to the selected cue).</li>
        <li><b>Delete</b>: the × at the right end of the row.</li>
      </ul>
    ),
  },
  {
    id: 'pages',
    title: 'Pages',
    body: (
      <>
        <p>Split your cues into pages. For example, one page per song makes cues easy to find during the show.</p>
        <ul>
          <li><b>Add</b>: "+ Page" in the page list. Rename it in the field above the cue list.</li>
          <li><b>Switch</b>: click a page, or use <kbd>←</kbd> <kbd>→</kbd>. Hover over a page to see its full name and number of cues.</li>
          <li><b>Reorder</b>: drag. <b>Delete</b>: × (asks first if the page has cues).</li>
          <li><b>After last cue</b>: what happens after GO on the last cue of the page: Stop, Next page, or Go to page. Pages that move on automatically show → or ↪ in the list.</li>
          <li><b>CLK / TC</b>: whether this page's cues run automatically by the clock (CLK) or by timecode (TC). See "Time and TC triggers".</li>
          <li><b>ON / OFF</b>: turns all time or TC triggers on this page on or off.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'overlays',
    title: 'Countdown and messages',
    body: (
      <>
        <p>These sit on top of the output, separate from cues. There is one list for the whole show, and you show or hide them independently of GO.</p>
        <h4>Countdown (top of the screen)</h4>
        <ul>
          <li>Choose how it counts with <b>LEN / TIME</b> on the row: <b>LEN</b> counts down a length (such as "5:00"), <b>TIME</b> counts down to a time of day (such as "19:00", 24-hour).</li>
          <li>Press "▶ START" to show it and start counting. "■ STOP" hides it.</li>
          <li>With LEN, ⏸ pauses; press again to resume. ↺ goes back to the full time and pauses (press ▶ to start). With TIME the clock cannot be stopped, so ⏸ and ↺ are not available.</li>
          <li>With TIME, if the time has already passed when you press START, it counts the time over in red. A time across midnight (such as "0:10" at 23:50) counts to the next day.</li>
          <li>After 0 it turns red and counts the time over, such as "-0:12".</li>
        </ul>
        <h4>Message (bottom of the screen)</h4>
        <ul>
          <li>Enter the text and press "▶ ON" to show it, "■ OFF" to hide it. Useful for urgent notes or cues to the performer.</li>
          <li>BLINK makes it blink (takes effect immediately while shown).</li>
        </ul>
        <h4>Both</h4>
        <ul>
          <li>One countdown and one message can be shown at a time. Showing another one replaces it.</li>
          <li>The slider sets the text size. BLACK OUT hides them; the main BLINK does not make them blink.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'triggers',
    title: 'Time and TC triggers',
    body: (
      <>
        <p>Give a cue a time or a timecode and it runs automatically, just like a GO. Cues on pages you are not viewing run too, and the view jumps to that page.</p>
        <h4>Time (CLK pages)</h4>
        <ul>
          <li>Enter a 24-hour time in the "Time" column: "14:30", "14:30:00" and "143000" all work. Leave it empty for no trigger.</li>
          <li>Times that have passed are skipped (nothing that is already past runs when you open the show).</li>
        </ul>
        <h4>Timecode (TC pages)</h4>
        <ul>
          <li>Switch the page to TC and the "Time" column becomes "TC". Enter positions such as "01:02:15:12".</li>
          <li>While timecode is running, cues run as the timecode passes them. Positions skipped by a locate do not run; a cue exactly at the located position does.</li>
          <li>See "Timecode" for how to receive or generate timecode.</li>
        </ul>
        <h4>On / off</h4>
        <ul>
          <li>Each cue and each page has ON / OFF. Both affect only automatic triggers; <kbd>Space</kbd> GO always works.</li>
          <li>When several cues share a time, the one later in the list stays on the output.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'timecode',
    title: 'Timecode',
    body: (
      <>
        <p>Choose a source under "Timecode" on the right. The current position appears next to the clock in the header (green while running).</p>
        <h4>MTC In</h4>
        <ul>
          <li>Press "Connect MIDI", allow it in Chrome, then choose the device under "MTC In".</li>
        </ul>
        <h4>LTC In</h4>
        <ul>
          <li>Press "Connect audio" and choose "Allow" in Chrome (also needed to list audio devices by name).</li>
          <li>Choose the audio device under "LTC In" and the channel that carries LTC under "Channel".</li>
          <li>"Signal" shows the status: No signal / Signal present, no LTC / Receiving LTC.</li>
        </ul>
        <h4>Internal</h4>
        <ul>
          <li>Generates timecode inside the app. Set the fps and start position, then use ▶ PLAY / ■ STOP / ⏮ (back to start). The small buttons in the header do the same.</li>
          <li>Send it to a MIDI device with "MTC Out" and to an audio device with "LTC Out".</li>
        </ul>
        <p>MIDI and audio device choices are remembered by this computer's browser (not saved in the show file).</p>
      </>
    ),
  },
  {
    id: 'output',
    title: 'Output settings',
    body: (
      <ul>
        <li><b>Colors</b>: background, text and outline. Click a swatch to open the color wheel. The outline can also be turned ON / OFF.</li>
        <li><b>Typography</b>: the size of the selected cue and the outline width.</li>
        <li><b>Transition</b>: how cues change: dissolve (with a time) or cut.</li>
      </ul>
    ),
  },
  {
    id: 'modes',
    title: 'PROGRAM / SHOW mode',
    body: (
      <>
        <p>Switch with PROGRAM / SHOW in the toolbar. SHOW is for the performance and locks editing so nothing changes by accident (a red line appears under the toolbar).</p>
        <ul>
          <li><b>Locked in SHOW</b>: editing cues, pages, countdowns and messages; output and timecode settings; New and Open; the show name.</li>
          <li><b>Still available in SHOW</b>: GO, CLEAR, BLACK OUT, BLINK; selecting cues and pages; trigger ON / OFF; showing, hiding, pausing and resetting countdowns and messages, message BLINK; internal PLAY / STOP / ⏮; Save.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'files',
    title: 'Files and CSV',
    body: (
      <>
        <h4>Save and open</h4>
        <ul>
          <li>"Save" (<kbd>⌘</kbd>+<kbd>S</kbd>) saves the show file anywhere you like; after that it overwrites the same file. "Save As" (<kbd>⇧</kbd>+<kbd>⌘</kbd>+<kbd>S</kbd>) saves to a new file.</li>
          <li>"Open" (<kbd>⌘</kbd>+<kbd>O</kbd>) loads a saved file.</li>
        </ul>
        <h4>CSV import</h4>
        <p>"CSV" in the page list imports a spreadsheet CSV as <b>new pages</b> (existing pages are not changed). You see a summary before anything is imported.</p>
        <table className="help-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>text</code></td>
              <td>The text (required). Line breaks inside a cell stay as line breaks</td>
            </tr>
            <tr>
              <td><code>time</code></td>
              <td>A time "14:30:00" or a timecode "01:02:15:12"</td>
            </tr>
            <tr>
              <td><code>page</code></td>
              <td>Page name. Rows with the same name go to one page; an empty cell means the same page as the row above</td>
            </tr>
            <tr>
              <td><code>size</code></td>
              <td>S / M / L or a number (5–40). Empty means M</td>
            </tr>
            <tr>
              <td><code>trigger</code></td>
              <td>ON / OFF. Empty means ON</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>The first row is the header (English or Japanese names). Without a header, the columns are read in the order above. Only text is required.</li>
          <li>Without a page column, the page is named after the file. A name that already exists becomes "Name (2)".</li>
          <li>A page with only timecodes becomes a TC page. Files can be UTF-8 or Shift_JIS.</li>
        </ul>
        <pre className="help-example">{`text,time,page,size
Doors open,19:00:00,Opening,L
Welcome,,Opening,M`}</pre>
      </>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    body: (
      <>
        <table className="help-table">
          <tbody>
            {[
              ['Space', 'GO'],
              ['↑ / ↓', 'Select cue'],
              ['← / →', 'Switch page'],
              ['C', 'CLEAR'],
              ['Z', 'BLACK OUT'],
              ['B', 'BLINK'],
              ['F', 'Fullscreen (works in the output window too)'],
              ['?', 'This help'],
              ['⌘S / ⇧⌘S', 'Save / Save As'],
              ['⌘O', 'Open'],
              ['Double-click cue', 'Edit text'],
              ['Double-click background', 'Fullscreen'],
            ].map(([key, action]) => (
              <tr key={key}>
                <td><kbd>{key}</kbd></td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Shortcuts such as Space do not work while you are typing in a field.</p>
      </>
    ),
  },
];

export const helpSections: Record<Lang, HelpSection[]> = { ja, en };
