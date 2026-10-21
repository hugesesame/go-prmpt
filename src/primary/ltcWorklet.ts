// 音声の処理スレッドで動く LTC の読み取りと生成。ページ側は ltcAudio.ts
import { LtcReader, LtcWriter, type LtcTiming } from '../ltc';
import type { FrameRate, Timecode } from '../timecode';

// AudioWorklet の中だけにあるもの（TypeScript の lib.dom には無い）
declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, processor: new (options: { processorOptions?: unknown }) => unknown): void;

export type ReaderMessage =
  | { type: 'frame'; tc: Timecode; rate: FrameRate }
  | { type: 'signal'; present: boolean };

/** 入力の 1 チャンネルから LTC を読み、フレームごとにページへ送る */
class ReaderProcessor extends AudioWorkletProcessor {
  private reader = new LtcReader(sampleRate);
  private channel: number;
  private signal = false;

  constructor(options: { processorOptions?: unknown }) {
    super();
    this.channel = (options.processorOptions as { channel: number }).channel;
    this.port.onmessage = (e: MessageEvent<{ channel: number }>) => (this.channel = e.data.channel);
  }

  process(inputs: Float32Array[][]) {
    const samples = inputs[0]?.[this.channel];
    if (samples) {
      for (const { tc, rate } of this.reader.process(samples)) this.post({ type: 'frame', tc, rate });
    }
    const present = !!samples && this.reader.hasSignal;
    if (present !== this.signal) {
      this.signal = present;
      this.post({ type: 'signal', present });
    }
    return true;
  }

  private post(message: ReaderMessage) {
    this.port.postMessage(message);
  }
}

/** 送られた位置合わせに従って LTC を出す。null が来たら無音 */
class WriterProcessor extends AudioWorkletProcessor {
  private writer = new LtcWriter(sampleRate);
  private timing: LtcTiming | null = null;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent<LtcTiming | null>) => (this.timing = e.data);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const [first, ...rest] = outputs[0];
    this.writer.fill(first, currentTime, this.timing);
    // 全部のチャンネルに同じ信号を出す
    for (const channel of rest) channel.set(first);
    return true;
  }
}

registerProcessor('ltc-reader', ReaderProcessor);
registerProcessor('ltc-writer', WriterProcessor);
