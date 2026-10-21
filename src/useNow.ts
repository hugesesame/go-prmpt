import { useEffect, useState } from 'react';
import type { LiveCountdown } from './types';

export function useNow(intervalMs: number, enabled = true) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);
  return now;
}

export function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString('ja-JP', { hour12: false });
}

/** カウントダウンの残り秒。0 を過ぎるとマイナス */
export function countdownRemaining(countdown: LiveCountdown, now: number) {
  return countdown.pausedRemaining ?? countdown.seconds - (now - countdown.startedAt) / 1000;
}

/** 残り時間は切り上げて表示し、0 を過ぎたら経過時間に - を付けて表示する（例 4:59、-0:12、1:00:00） */
export function formatCountdown(remaining: number) {
  const s = remaining >= 0 ? Math.ceil(remaining) : Math.floor(-remaining);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  const body = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  return remaining >= 0 ? body : `-${body}`;
}

export function formatRemaining(seconds: number) {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
