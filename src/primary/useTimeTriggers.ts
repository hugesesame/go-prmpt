import { useEffect, useRef, type Dispatch } from 'react';
import type { Action } from '../state';
import type { Page } from '../types';

/** 予定の時刻からこれ以上遅れていたら実行しない（スリープ明けなどにまとめて出ないように） */
const LATE_LIMIT_MS = 5000;

/** その日の 0 時からの秒を、day と同じ日の時刻（ミリ秒）にする */
function timeOnDay(day: number, seconds: number) {
  const d = new Date(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, seconds).getTime();
}

/** 前回の確認（from）から今（to）までの間に時刻が来た Cue。時刻順、同じ時刻ならリストの順 */
function dueCues(pages: Page[], from: number, to: number) {
  const due: { pageId: string; cueId: string; at: number }[] = [];
  for (const page of pages) {
    if (!page.timeTriggers || page.triggerSource !== 'clock') continue;
    for (const cue of page.cues) {
      if (!cue.triggerEnabled || cue.triggerAt === null) continue;
      // 0 時をまたいだときのために、前回の確認の日と今日の両方で見る
      for (const at of new Set([timeOnDay(from, cue.triggerAt), timeOnDay(to, cue.triggerAt)])) {
        if (from < at && at <= to && to - at <= LATE_LIMIT_MS) due.push({ pageId: page.id, cueId: cue.id, at });
      }
    }
  }
  return due.sort((a, b) => a.at - b.at);
}

/**
 * 各 Cue に設定した時刻になったら実行する。ページをまたいで、モードに関係なく動く。
 * 開いた時点ですでに過ぎている時刻は実行しない
 */
export function useTimeTriggers(pages: Page[], dispatch: Dispatch<Action>) {
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  useEffect(() => {
    const worker = new Worker(new URL('./tickWorker.ts', import.meta.url), { type: 'module' });
    let last = Date.now();
    worker.onmessage = () => {
      const now = Date.now();
      // 同じ時刻の Cue が複数あると順に実行され、リストで後ろの Cue が残る
      for (const { pageId, cueId } of dueCues(pagesRef.current, last, now)) dispatch({ type: 'fireCue', pageId, cueId });
      last = now;
    };
    return () => worker.terminate();
  }, [dispatch]);
}
