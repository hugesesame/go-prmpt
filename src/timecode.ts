/** 29.97df はドロップフレーム。29.97 のノンドロップは扱わない */
export type FrameRate = '24' | '25' | '29.97df' | '30';

export const frameRates: FrameRate[] = ['24', '25', '29.97df', '30'];

export interface Timecode {
  h: number;
  m: number;
  s: number;
  f: number;
}

/** 1 秒あたりのフレーム番号の数（ラベル上の fps） */
export function nominalFps(rate: FrameRate) {
  return rate === '24' ? 24 : rate === '25' ? 25 : 30;
}

/** 実際に 1 秒間に進むフレーム数 */
export function realFps(rate: FrameRate) {
  return rate === '29.97df' ? 30000 / 1001 : nominalFps(rate);
}

/** 24 時間ぶんのフレーム数。これを超えたら 0 時に戻る */
function framesPerDay(rate: FrameRate) {
  return rate === '29.97df' ? 24 * 6 * 17982 : nominalFps(rate) * 86400;
}

/** タイムコードを 0:00:00:00 からのフレーム数にする */
export function tcToFrames(tc: Timecode, rate: FrameRate) {
  const minutes = tc.h * 60 + tc.m;
  const frames = (minutes * 60 + tc.s) * nominalFps(rate) + tc.f;
  // ドロップフレームは 10 の倍数以外の分の頭で 2 フレームずつ番号を飛ばす
  return rate === '29.97df' ? frames - 2 * (minutes - Math.floor(minutes / 10)) : frames;
}

/** 0:00:00:00 からのフレーム数をタイムコードにする（24 時間で一周する） */
export function framesToTc(frames: number, rate: FrameRate): Timecode {
  const day = framesPerDay(rate);
  let n = ((Math.floor(frames) % day) + day) % day;
  if (rate === '29.97df') {
    const tens = Math.floor(n / 17982);
    const rest = n % 17982;
    n += 18 * tens + (rest > 2 ? 2 * Math.floor((rest - 2) / 1798) : 0);
  }
  const fps = nominalFps(rate);
  return {
    h: Math.floor(n / (fps * 3600)),
    m: Math.floor(n / (fps * 60)) % 60,
    s: Math.floor(n / fps) % 60,
    f: n % fps,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 「01:02:15:12」 */
export function formatTc(tc: Timecode) {
  return `${pad(tc.h)}:${pad(tc.m)}:${pad(tc.s)}:${pad(tc.f)}`;
}

/**
 * 「01:02:15:12」「1:02:15:12」「01:02:15;12」「01:02:15」（フレームは 00）「01021512」を読む。
 * 空は null、読めなければ undefined。フレームはどの fps でも使える 0〜29 まで
 */
export function parseTc(text: string): Timecode | null | undefined {
  const value = text.trim();
  if (value === '') return null;
  const match =
    /^(\d{1,2}):(\d{2}):(\d{2})(?:[:;.](\d{2}))?$/.exec(value) ?? /^(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return undefined;
  const tc = { h: Number(match[1]), m: Number(match[2]), s: Number(match[3]), f: Number(match[4] ?? 0) };
  if (tc.h > 23 || tc.m > 59 || tc.s > 59 || tc.f > 29) return undefined;
  return tc;
}

/** 大小を比べるための数。fps に関係なくタイムコードの並び順になる */
export function tcKey(tc: Timecode) {
  return ((tc.h * 60 + tc.m) * 60 + tc.s) * 100 + tc.f;
}

/** tcKey をおおよその秒にする（飛んだかどうかの判定用） */
export function keySeconds(key: number) {
  return Math.floor(key / 100) + (key % 100) / 30;
}
