const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 0 時からの秒が指す、now に一番近い時刻（エポックミリ秒）。前後 12 時間以内で選ぶので、
 * 少し過ぎた時刻は過ぎたまま（過ぎた分を数える）、日付をまたぐ時刻（23:50 に 0:10、0:05 に 23:55）は隣の日になる
 */
export function nearestTimeOfDay(seconds: number, now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const today = d.getTime() + seconds * 1000;
  const day = 24 * 3600 * 1000;
  if (now - today > day / 2) return today + day;
  if (today - now > day / 2) return today - day;
  return today;
}

/** 0 時からの秒を「14:30:00」にする */
export function formatTimeOfDay(seconds: number) {
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
}

/** 「14:30」「14:30:05」「1430」「143005」を 0 時からの秒にする。空は null、読めなければ undefined */
export function parseTimeOfDay(text: string): number | null | undefined {
  const value = text.trim();
  if (value === '') return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value) ?? /^(\d{2})(\d{2})(\d{2})?$/.exec(value);
  if (!match) return undefined;
  const [h, m, s] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  if (h > 23 || m > 59 || s > 59) return undefined;
  return h * 3600 + m * 60 + s;
}
