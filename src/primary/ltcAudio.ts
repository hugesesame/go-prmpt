import type { LtcTiming } from '../ltc';
import type { FrameRate, Timecode } from '../timecode';
import type { ReaderMessage } from './ltcWorklet';
import workletUrl from './ltcWorklet.ts?worker&url';

export interface AudioDevice {
  id: string;
  name: string;
}

/** idle: まだ許可を求めていない / pending: Chrome が確認を出している / denied: ブロックされている */
export type AudioStatus = 'idle' | 'pending' | 'denied' | 'ready';

export interface LtcAudioState {
  audio: AudioStatus;
  audioInputs: AudioDevice[];
  audioOutputs: AudioDevice[];
  /** 開いている入力のチャンネル数。開いていなければ null */
  ltcChannels: number | null;
  /** 入力のチャンネルに音が来ている */
  ltcSignal: boolean;
}

interface Callbacks {
  onState: (patch: Partial<LtcAudioState>) => void;
  onFrame: (tc: Timecode, rate: FrameRate) => void;
}

/** 生成の位置合わせ：performance.now() の perf にフレーム frame が始まる */
export interface LtcPlayback {
  frame: number;
  perf: number;
  rate: FrameRate;
}

type SinkContext = AudioContext & { setSinkId(id: string): Promise<void> };

/**
 * LTC の音声の入出力。マイク（オーディオ入力）の許可・機器の一覧・
 * AudioWorklet（ltcWorklet.ts）とのやり取りを受け持つ。読んだフレームは onFrame で知らせる
 */
export class LtcAudio {
  private inputCtx: AudioContext | null = null;
  private input: { deviceId: string; stream: MediaStream; node: AudioWorkletNode } | null = null;
  /** openInput が重なったとき、古い呼び出しの結果を捨てる */
  private inputToken = 0;

  private outputCtx: SinkContext | null = null;
  private writer: AudioWorkletNode | null = null;
  private outputToken = 0;
  private playback: LtcPlayback | null = null;

  constructor(private callbacks: Callbacks) {
    // ブラウザは操作されるまで音声を止めておくので、最初のクリックやキーで動かす
    window.addEventListener('pointerdown', this.resume, true);
    window.addEventListener('keydown', this.resume, true);
  }

  dispose() {
    window.removeEventListener('pointerdown', this.resume, true);
    window.removeEventListener('keydown', this.resume, true);
    navigator.mediaDevices.ondevicechange = null;
    this.closeInput();
    void this.setOutputDevice(null);
    void this.inputCtx?.close();
    this.inputCtx = null;
  }

  /** オーディオ入力の使用を許可してもらう。許可されると機器の名前が分かる */
  async connect() {
    this.callbacks.onState({ audio: 'pending' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // 確認を閉じただけならもう一度押せるようにする。ブロックされたときだけ設定の案内を出す
      this.callbacks.onState({ audio: (await microphonePermission()) === 'denied' ? 'denied' : 'idle' });
      return;
    }
    await this.ready();
  }

  /** 一度許可されていれば聞かれずにつながる */
  async autoConnect() {
    if ((await microphonePermission()) === 'granted') await this.ready();
  }

  /** 入力機器の channel（0 から）で LTC を読む。同じ機器ならチャンネルだけ切り替える */
  async openInput(deviceId: string, channel: number) {
    if (this.input?.deviceId === deviceId) {
      this.input.node.port.postMessage({ channel });
      return;
    }
    this.closeInput();
    const token = ++this.inputToken;
    try {
      const ctx = (this.inputCtx ??= new AudioContext({ latencyHint: 'interactive' }));
      await loadWorklet(ctx);
      // 音声の加工はすべて切る。LTC の波形が崩れると読めない
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 32 },
        },
      });
      if (token !== this.inputToken) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const channels = stream.getAudioTracks()[0]?.getSettings().channelCount ?? 1;
      // discrete にして、チャンネルを混ぜずにそのまま受け取る
      const node = new AudioWorkletNode(ctx, 'ltc-reader', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: channels,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete',
        processorOptions: { channel },
      });
      node.port.onmessage = (e: MessageEvent<ReaderMessage>) => {
        if (e.data.type === 'frame') this.callbacks.onFrame(e.data.tc, e.data.rate);
        else this.callbacks.onState({ ltcSignal: e.data.present });
      };
      ctx.createMediaStreamSource(stream).connect(node);
      // 出力は無音。つないでおかないと処理されない
      node.connect(ctx.destination);
      this.input = { deviceId, stream, node };
      this.callbacks.onState({ ltcChannels: channels });
      void ctx.resume();
    } catch {
      // 機器が外れている・使えない。一覧で「（未接続）」と分かる
      if (token === this.inputToken) this.callbacks.onState({ ltcChannels: null, ltcSignal: false });
    }
  }

  closeInput() {
    this.inputToken++;
    if (!this.input) return;
    this.input.stream.getTracks().forEach((t) => t.stop());
    this.input.node.port.onmessage = null;
    this.input.node.disconnect();
    this.input = null;
    this.callbacks.onState({ ltcChannels: null, ltcSignal: false });
  }

  /** LTC を出す機器。null なら出さない */
  async setOutputDevice(deviceId: string | null) {
    const token = ++this.outputToken;
    if (deviceId === null) {
      this.writer?.disconnect();
      this.writer = null;
      void this.outputCtx?.close();
      this.outputCtx = null;
      return;
    }
    try {
      const ctx = (this.outputCtx ??= new AudioContext({ latencyHint: 'interactive' }) as SinkContext);
      // 「既定」は空文字で指定する
      await ctx.setSinkId(deviceId === 'default' ? '' : deviceId);
      if (!this.writer) {
        await loadWorklet(ctx);
        if (token !== this.outputToken) return;
        this.writer = new AudioWorkletNode(ctx, 'ltc-writer', { numberOfInputs: 0, outputChannelCount: [2] });
        this.writer.connect(ctx.destination);
      }
      void ctx.resume();
      this.sendTiming();
    } catch {
      // 機器が外れている。一覧で「（未接続）」と分かる
    }
  }

  /** 生成の位置合わせを送る。null で止める。時計のずれを直すため、再生中は時々送り直す */
  setPlayback(playback: LtcPlayback | null) {
    this.playback = playback;
    this.sendTiming();
  }

  private sendTiming() {
    const ctx = this.outputCtx;
    if (!ctx || !this.writer) return;
    let timing: LtcTiming | null = null;
    if (this.playback) {
      const { frame, perf, rate } = this.playback;
      // performance.now() の時刻を、スピーカーから実際に出る音声の時刻に直す
      const stamp = ctx.getOutputTimestamp();
      const time =
        stamp.performanceTime && stamp.contextTime !== undefined
          ? stamp.contextTime + (perf - stamp.performanceTime) / 1000
          : ctx.currentTime + (perf - performance.now()) / 1000;
      timing = { frame, time, rate };
    }
    this.writer.port.postMessage(timing);
  }

  private async ready() {
    this.callbacks.onState({ audio: 'ready' });
    navigator.mediaDevices.ondevicechange = () => void this.refreshDevices();
    await this.refreshDevices();
  }

  private async refreshDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const list = (kind: MediaDeviceKind) =>
      devices.filter((d) => d.kind === kind && d.deviceId).map((d) => ({ id: d.deviceId, name: d.label || d.deviceId }));
    this.callbacks.onState({ audioInputs: list('audioinput'), audioOutputs: list('audiooutput') });
  }

  private resume = () => {
    if (this.inputCtx?.state === 'suspended') void this.inputCtx.resume();
    if (this.outputCtx?.state === 'suspended') {
      void this.outputCtx.resume().then(() => this.sendTiming());
    }
  };
}

/** マイクの許可の状態。調べられないときは null（手動で接続してもらう） */
async function microphonePermission() {
  try {
    return (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state;
  } catch {
    return null;
  }
}

const loaded = new WeakMap<BaseAudioContext, Promise<void>>();

function loadWorklet(ctx: BaseAudioContext) {
  let promise = loaded.get(ctx);
  if (!promise) {
    promise = ctx.audioWorklet.addModule(workletUrl);
    loaded.set(ctx, promise);
  }
  return promise;
}
