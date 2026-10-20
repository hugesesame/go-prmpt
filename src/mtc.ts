import { framesToTc, tcToFrames, type FrameRate, type Timecode } from './timecode';

/** MTC の fps の番号（クォーターフレームの 7 番目とフルフレームに入る） */
const rateCodes: FrameRate[] = ['24', '25', '29.97df', '30'];

/** クォーターフレーム 1 つ（F1 xx）。piece は 0〜7、tc はその 8 つ組の最初のフレーム */
export function quarterFrame(piece: number, tc: Timecode, rate: FrameRate): number[] {
  const values = [
    tc.f & 0x0f,
    tc.f >> 4,
    tc.s & 0x0f,
    tc.s >> 4,
    tc.m & 0x0f,
    tc.m >> 4,
    tc.h & 0x0f,
    (rateCodes.indexOf(rate) << 1) | (tc.h >> 4),
  ];
  return [0xf1, (piece << 4) | values[piece]];
}

/** フルフレーム（位置を一度に知らせる SysEx）。停止や頭出しのときに送る */
export function fullFrame(tc: Timecode, rate: FrameRate): number[] {
  return [0xf0, 0x7f, 0x7f, 0x01, 0x01, (rateCodes.indexOf(rate) << 5) | tc.h, tc.m, tc.s, tc.f, 0xf7];
}

export type MtcEvent =
  /** 再生中の今の位置 */
  | { kind: 'position'; tc: Timecode; rate: FrameRate }
  /** フルフレームで知らされた位置（頭出し・停止） */
  | { kind: 'locate'; tc: Timecode; rate: FrameRate };

/**
 * 受け取った MIDI メッセージから位置を読む。
 * 8 つのクォーターフレームで 1 つのタイムコードになり、届いた時点で 2 フレーム進んでいるので足す。
 * 8 つ組の途中（piece 3）でも 1 フレーム進めて知らせ、表示とトリガーをフレームごとに進める
 */
export class MtcDecoder {
  private nibbles: number[] = [];
  /** 次に来るはずの piece。順番が崩れたら 0 から集め直す */
  private expected = 0;
  /** 最後にそろった 8 つ組の最初のフレーム */
  private cycle: { frames: number; rate: FrameRate } | null = null;

  feed(data: Uint8Array): MtcEvent | null {
    if (data[0] === 0xf1 && data.length >= 2) return this.quarter(data[1] >> 4, data[1] & 0x0f);
    if (data.length >= 10 && data[0] === 0xf0 && data[1] === 0x7f && data[3] === 0x01 && data[4] === 0x01) {
      const rate = rateCodes[(data[5] >> 5) & 0x03];
      const tc = { h: data[5] & 0x1f, m: data[6], s: data[7], f: data[8] };
      this.reset();
      return { kind: 'locate', tc, rate };
    }
    return null;
  }

  reset() {
    this.nibbles = [];
    this.expected = 0;
    this.cycle = null;
  }

  private quarter(piece: number, value: number): MtcEvent | null {
    if (piece !== this.expected) {
      this.nibbles = [];
      this.expected = 0;
      if (piece !== 0) return null;
    }
    this.nibbles[piece] = value;
    this.expected = (piece + 1) % 8;

    if (piece === 3 && this.cycle) {
      const { frames, rate } = this.cycle;
      return { kind: 'position', tc: framesToTc(frames + 3, rate), rate };
    }
    if (piece !== 7) return null;
    const [f0, f1, s0, s1, m0, m1, h0, last] = this.nibbles;
    const rate = rateCodes[(last >> 1) & 0x03];
    const tc = { h: h0 | ((last & 0x01) << 4), m: m0 | (m1 << 4), s: s0 | (s1 << 4), f: f0 | (f1 << 4) };
    const frames = tcToFrames(tc, rate);
    this.cycle = { frames, rate };
    return { kind: 'position', tc: framesToTc(frames + 2, rate), rate };
  }
}
