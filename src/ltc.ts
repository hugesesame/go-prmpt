import { framesToTc, realFps, type FrameRate, type Timecode } from './timecode';

// LTC（音声のタイムコード）。1 フレーム 80 ビットで、ビットの境目で必ず極性が変わり、
// 1 のビットはさらにビットの真ん中でも変わる（バイフェーズ）。ビットは下の桁から順に送る

/** フレームの終わりの同期ワード（64〜79 ビット目） */
const SYNC = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1];

/** 各桁の位置（ビット番号, 幅） */
const FIELDS = {
  frameUnits: [0, 4],
  frameTens: [8, 2],
  secUnits: [16, 4],
  secTens: [24, 3],
  minUnits: [32, 4],
  minTens: [40, 3],
  hourUnits: [48, 4],
  hourTens: [56, 2],
} as const;
const DROP_FRAME_BIT = 10;

function put(bits: Uint8Array, [at, width]: readonly [number, number], value: number) {
  for (let i = 0; i < width; i++) bits[at + i] = (value >> i) & 1;
}

function get(bits: ArrayLike<number>, [at, width]: readonly [number, number]) {
  let value = 0;
  for (let i = 0; i < width; i++) value |= bits[at + i] << i;
  return value;
}

/** 1 フレームぶんの 80 ビット */
export function ltcFrameBits(tc: Timecode, rate: FrameRate): Uint8Array {
  const bits = new Uint8Array(80);
  put(bits, FIELDS.frameUnits, tc.f % 10);
  put(bits, FIELDS.frameTens, Math.floor(tc.f / 10));
  put(bits, FIELDS.secUnits, tc.s % 10);
  put(bits, FIELDS.secTens, Math.floor(tc.s / 10));
  put(bits, FIELDS.minUnits, tc.m % 10);
  put(bits, FIELDS.minTens, Math.floor(tc.m / 10));
  put(bits, FIELDS.hourUnits, tc.h % 10);
  put(bits, FIELDS.hourTens, Math.floor(tc.h / 10));
  bits[DROP_FRAME_BIT] = rate === '29.97df' ? 1 : 0;
  SYNC.forEach((b, i) => (bits[64 + i] = b));
  // 極性補正ビット：1 の数を偶数にして、どのフレームも同じ極性から始まるようにする（25fps は 59、他は 27）
  const ones = bits.reduce((n, b) => n + b, 0);
  bits[rate === '25' ? 59 : 27] = ones % 2;
  return bits;
}

/** 80 ビット（同期ワードまでそろったもの）からタイムコードを読む。ありえない値なら null */
export function parseLtcBits(bits: ArrayLike<number>): { tc: Timecode; dropFrame: boolean } | null {
  const tc = {
    h: get(bits, FIELDS.hourTens) * 10 + get(bits, FIELDS.hourUnits),
    m: get(bits, FIELDS.minTens) * 10 + get(bits, FIELDS.minUnits),
    s: get(bits, FIELDS.secTens) * 10 + get(bits, FIELDS.secUnits),
    f: get(bits, FIELDS.frameTens) * 10 + get(bits, FIELDS.frameUnits),
  };
  if (tc.h > 23 || tc.m > 59 || tc.s > 59 || tc.f > 29) return null;
  return { tc, dropFrame: bits[DROP_FRAME_BIT] === 1 };
}

export interface LtcFrame {
  tc: Timecode;
  rate: FrameRate;
}

/**
 * 音声から LTC を読む。極性が変わる間隔を測り、ビット 1 つぶんなら 0、半分が 2 つ続けば 1 とする。
 * 同期ワードがそろったところでフレームを返す（そのフレームは送り終わった直後）。
 * 再生速度はほぼ等速（24〜30fps）を前提にする
 */
export class LtcReader {
  /** ビット 1 つぶんのサンプル数（受けながら合わせていく） */
  private bitLength: number;
  private readonly minBit: number;
  private readonly maxBit: number;
  private peak = 0;
  private level = 0;
  /** 最後に極性が変わったサンプル番号 */
  private lastEdge = -1;
  private halfPending = false;
  private sample = 0;
  private bits = new Uint8Array(80);
  private count = 0;
  /** 最後に同期ワードがそろったサンプル番号。途切れたら null */
  private lastSync: number | null = null;

  constructor(private sampleRate: number) {
    this.bitLength = sampleRate / (80 * 27);
    this.minBit = sampleRate / (80 * 33);
    this.maxBit = sampleRate / (80 * 21);
  }

  /** 信号が来ているか（雑音より大きい音があるか） */
  get hasSignal() {
    return this.peak > NOISE_FLOOR;
  }

  process(samples: Float32Array): LtcFrame[] {
    const frames: LtcFrame[] = [];
    // ピークは 0.1 秒ほどで半分になるように下げていく
    const decay = Math.pow(0.5, 1 / (this.sampleRate * 0.1));
    for (let i = 0; i < samples.length; i++, this.sample++) {
      const x = samples[i];
      this.peak = Math.max(Math.abs(x), this.peak * decay);
      if (this.peak < NOISE_FLOOR) continue;
      // ヒステリシスを付けて雑音で極性を取り違えないようにする
      const threshold = this.peak * 0.3;
      const next = x > threshold ? 1 : x < -threshold ? -1 : this.level;
      if (next === this.level) continue;
      this.level = next;
      const frame = this.edge(this.sample);
      if (frame) frames.push(frame);
    }
    return frames;
  }

  private edge(at: number): LtcFrame | null {
    const interval = at - this.lastEdge;
    this.lastEdge = at;
    if (interval > this.bitLength * 1.6) {
      // 途切れた。ビットを集め直す
      this.halfPending = false;
      this.count = 0;
      this.lastSync = null;
      return null;
    }
    if (interval > this.bitLength * 0.75) {
      this.halfPending = false;
      this.adapt(interval);
      return this.push(0);
    }
    if (!this.halfPending) {
      this.halfPending = true;
      return null;
    }
    this.halfPending = false;
    this.adapt(interval * 2);
    return this.push(1);
  }

  private adapt(measured: number) {
    this.bitLength = Math.min(this.maxBit, Math.max(this.minBit, this.bitLength * 0.95 + measured * 0.05));
  }

  private push(bit: number): LtcFrame | null {
    this.bits.copyWithin(0, 1);
    this.bits[79] = bit;
    this.count = Math.min(80, this.count + 1);
    if (this.count < 80) return null;
    if (SYNC.some((b, i) => this.bits[64 + i] !== b)) {
      // 80 ビット来ても同期ワードが無い。前の同期ワードとはつながっていない
      this.lastSync = null;
      return null;
    }
    // 前の同期ワードからちょうど 80 ビット（途切れずに続いたフレーム）のときだけ返す。
    // 1 フレームの長さから fps が正確に分かる
    const previous = this.lastSync;
    this.lastSync = this.sample;
    this.count = 0;
    const parsed = parseLtcBits(this.bits);
    if (!parsed || previous === null) return null;
    return { tc: parsed.tc, rate: guessRate(parsed.tc, parsed.dropFrame, this.sampleRate / (this.sample - previous)) };
  }
}

/** LTC には fps が入っていないので、ドロップフレームの印と 1 フレームの長さから決める */
function guessRate(tc: Timecode, dropFrame: boolean, fps: number): FrameRate {
  if (dropFrame) return '29.97df';
  if (tc.f >= 25 || fps > 27.5) return '30';
  if (tc.f >= 24 || fps > 24.5) return '25';
  return '24';
}

/** これより小さい音は信号とみなさない */
const NOISE_FLOOR = 0.01;

/** 生成の位置合わせ：音声の時刻 time にフレーム frame が始まる */
export interface LtcTiming {
  frame: number;
  time: number;
  rate: FrameRate;
}

/**
 * LTC の音声を作る。音声の時刻からフレームとビットの位置を計算するので、
 * 位置合わせ（timing）を送り直せば、そこからずれを直したり頭出ししたりできる
 */
export class LtcWriter {
  private level = AMPLITUDE;
  /** 前のサンプルのフレーム × 80 + ビット番号 */
  private lastBit = -1;
  private lastHalf = 0;
  private cache: { frame: number; rate: FrameRate; bits: Uint8Array } | null = null;

  constructor(private sampleRate: number) {}

  /** time は out[0] の音声の時刻（秒）。timing が null なら無音 */
  fill(out: Float32Array, time: number, timing: LtcTiming | null) {
    if (!timing) {
      out.fill(0);
      this.lastBit = -1;
      return;
    }
    const fps = realFps(timing.rate);
    for (let i = 0; i < out.length; i++) {
      const position = (time + i / this.sampleRate - timing.time) * fps;
      if (position < 0) {
        out[i] = 0;
        this.lastBit = -1;
        continue;
      }
      const whole = Math.floor(position);
      const frame = timing.frame + whole;
      const bitPosition = (position - whole) * 80;
      const bit = Math.floor(bitPosition);
      const half = bitPosition - bit >= 0.5 ? 1 : 0;
      const key = frame * 80 + bit;
      if (key !== this.lastBit) {
        this.level = -this.level;
      } else if (half !== this.lastHalf && half === 1 && this.frameBits(frame, timing.rate)[bit] === 1) {
        this.level = -this.level;
      }
      this.lastBit = key;
      this.lastHalf = half;
      out[i] = this.level;
    }
  }

  private frameBits(frame: number, rate: FrameRate) {
    if (this.cache?.frame !== frame || this.cache.rate !== rate) {
      this.cache = { frame, rate, bits: ltcFrameBits(framesToTc(frame, rate), rate) };
    }
    return this.cache.bits;
  }
}

/** 出力の大きさ（-6 dBFS） */
const AMPLITUDE = 0.5;
