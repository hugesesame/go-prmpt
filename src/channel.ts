import type { OutputState } from './types';

/** プライマリーとセカンダリー（出力ウィンドウ）間の通信 */
export type ChannelMessage = { type: 'state'; state: OutputState } | { type: 'hello' };

export const openChannel = () => new BroadcastChannel('prompter-output');

/** 外部ディスプレイがあればそこに出力ウィンドウを開く */
export async function openOutputWindow() {
  let features = 'popup,width=1280,height=720';
  try {
    const details = await window.getScreenDetails?.();
    const other = details?.screens.find((s) => s !== details.currentScreen);
    if (other) {
      features = `popup,left=${other.availLeft},top=${other.availTop},width=${other.availWidth},height=${other.availHeight}`;
    }
  } catch {
    // 権限が拒否された場合は通常のウィンドウで開く
  }
  window.open(`${location.pathname}?output`, 'prompter-output', features);
}
