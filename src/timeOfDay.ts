const pad = (n: number) => String(n).padStart(2, '0');

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
