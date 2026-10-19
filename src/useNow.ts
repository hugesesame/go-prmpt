import { useEffect, useState } from 'react';

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

export function formatRemaining(seconds: number) {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
