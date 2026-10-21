import { useEffect, useState, useSyncExternalStore, type Dispatch } from 'react';
import { defaultTimecode } from '../defaults';
import { fullFrame, MtcDecoder, quarterFrame } from '../mtc';
import type { Action } from '../state';
import { LtcAudio, type AudioDevice, type LtcAudioState } from './ltcAudio';
import { formatTc, framesToTc, keySeconds, parseTc, realFps, tcKey, tcToFrames, type FrameRate, type Timecode } from '../timecode';
import type { Page, TimecodeSettings } from '../types';

export interface MidiPort {
  id: string;
  name: string;
}

/** unsupported: ブラウザが Web MIDI に対応していない / idle: まだ許可を求めていない / denied: 許可されなかった */
export type MidiStatus = 'unsupported' | 'idle' | 'denied' | 'ready';

export type { AudioDevice };

export interface TimecodeSnapshot extends LtcAudioState {
  /** 今の位置（「01:02:15:12」）。まだ一度も届いていなければ null */
  tc: string | null;
  rate: FrameRate | null;
  /** 進んでいる（MTC・LTC を受信中・内部で生成中） */
  running: boolean;
  midi: MidiStatus;
  inputs: MidiPort[];
  outputs: MidiPort[];
  inputId: string | null;
  outputId: string | null;
  /** LTC を受けるオーディオ入力と、そのチャンネル（0 から） */
  ltcInputId: string | null;
  ltcChannel: number;
  /** LTC を出すオーディオ出力（内部生成のとき） */
  ltcOutputId: string | null;
}

// MIDI・オーディオ機器はパソコンごとに違うのでショーファイルではなくブラウザに覚える
const INPUT_KEY = 'prompter.midiIn';
const OUTPUT_KEY = 'prompter.midiOut';
const LTC_INPUT_KEY = 'prompter.ltcIn';
const LTC_CHANNEL_KEY = 'prompter.ltcInChannel';
const LTC_OUTPUT_KEY = 'prompter.ltcOut';
/** これ以上クォーターフレーム（LTC はフレーム）が来なければ止まったとみなす */
const MTC_TIMEOUT_MS = 200;
/** 生成中に LTC の位置合わせを送り直す間隔。音声と performance.now() の時計のずれを直す */
const LTC_RESYNC_MS = 1000;
/** 受信中にこれより先へ進んだら頭出しとみなし、間の Cue は実行しない */
const JUMP_SECONDS = 1;
/** 出力するクォーターフレームを先に予約しておく長さ。Worker の刻みより長くする */
const LOOKAHEAD_MS = 150;
/** 生成中は細かく刻んでフレームごとにトリガーを確認する */
const PLAYING_TICK_MS = 10;
const IDLE_TICK_MS = 100;

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // 覚えられなくても今の選択は使える
  }
}

/**
 * タイムコードの受信（MTC・LTC）・内部生成・MTC / LTC 出力と、TC ページの Cue の実行をまとめて受け持つ。
 * 1 秒に何十回も変わる位置を React の状態に入れると画面全体が描き直されるので、
 * 位置は subscribe した部品（表示や設定）だけが受け取る
 */
export class TimecodeEngine {
  private snapshot: TimecodeSnapshot;
  private listeners = new Set<() => void>();
  private settings: TimecodeSettings = { ...defaultTimecode };
  private pages: Page[] = [];
  private access: MIDIAccess | null = null;
  private worker: Worker | null = null;
  private started = false;

  // トリガー：前回確認した位置。inclusive のときはちょうどその位置の Cue も実行する（頭出しの直後）
  private last: number | null = null;
  private inclusive = false;

  // 受信
  private decoder = new MtcDecoder();
  private lastQuarterAt = 0;
  private ltc: LtcAudio | null = null;
  private lastLtcAt = 0;
  private lastLtcSync = 0;

  // 生成：再生中の位置は startFrame と再生を始めた時刻（startPerf）から計算する
  private playing = false;
  private startPerf = 0;
  private startFrame = 0;
  private pausedFrame = 0;
  /** 次に出力するクォーターフレームの通し番号（フレーム数 × 4 + 0〜3） */
  private nextQuarter = 0;

  constructor(private fire: (pageId: string, cueId: string) => void) {
    this.snapshot = {
      tc: null,
      rate: null,
      running: false,
      midi: 'requestMIDIAccess' in navigator ? 'idle' : 'unsupported',
      inputs: [],
      outputs: [],
      inputId: readStored(INPUT_KEY),
      outputId: readStored(OUTPUT_KEY),
      audio: 'idle',
      audioInputs: [],
      audioOutputs: [],
      ltcChannels: null,
      ltcSignal: false,
      ltcInputId: readStored(LTC_INPUT_KEY),
      ltcChannel: Number(readStored(LTC_CHANNEL_KEY)) || 0,
      ltcOutputId: readStored(LTC_OUTPUT_KEY),
    };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  start() {
    this.started = true;
    this.worker = new Worker(new URL('./tickWorker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = () => this.tick();
    this.worker.postMessage(this.playing ? PLAYING_TICK_MS : IDLE_TICK_MS);
    this.bindInput();
    if (this.snapshot.midi === 'idle') void this.autoConnect();
    this.ltc = new LtcAudio({ onState: (patch) => this.publish(patch), onFrame: this.onLtcFrame });
    void this.ltc.autoConnect().then(() => this.bindAudio());
  }

  dispose() {
    this.started = false;
    this.worker?.terminate();
    this.worker = null;
    this.bindInput();
    this.ltc?.dispose();
    this.ltc = null;
  }

  setPages(pages: Page[]) {
    this.pages = pages;
  }

  configure(settings: TimecodeSettings) {
    const prev = this.settings;
    const position = prev.source === 'internal' ? framesToTc(this.generatorFrame(), prev.frameRate) : null;
    this.settings = settings;

    if (settings.source !== prev.source) {
      this.setPlaying(false);
      this.decoder.reset();
      this.last = null;
      this.inclusive = false;
      this.bindInput();
      this.bindAudio();
      if (settings.source === 'internal') {
        this.pausedFrame = this.startFrame = this.startPosition();
        this.locate(this.pausedFrame);
        this.publishGenerator();
      } else {
        this.publish({ tc: null, rate: null, running: false });
      }
      return;
    }
    if (settings.source !== 'internal' || !position) return;

    if (settings.frameRate !== prev.frameRate) {
      // 同じ位置（タイムコードの表記）のまま fps だけ変える
      this.moveGenerator(tcToFrames(position, settings.frameRate));
    } else if (settings.start !== prev.start && !this.playing && this.pausedFrame === tcToFrames(parseTc(prev.start)!, prev.frameRate)) {
      // 開始位置で止まっていたら新しい開始位置へ動かす
      this.moveGenerator(this.startPosition());
      this.locate(this.pausedFrame);
    }
  }

  setInput(id: string | null) {
    writeStored(INPUT_KEY, id);
    this.decoder.reset();
    this.publish({ inputId: id, tc: null, rate: null, running: false });
    this.bindInput();
  }

  setOutput(id: string | null) {
    writeStored(OUTPUT_KEY, id);
    this.publish({ outputId: id });
  }

  setLtcInput(id: string | null) {
    writeStored(LTC_INPUT_KEY, id);
    this.publish({ ltcInputId: id, tc: null, rate: null, running: false });
    this.bindAudio();
  }

  setLtcChannel(channel: number) {
    writeStored(LTC_CHANNEL_KEY, String(channel));
    this.publish({ ltcChannel: channel });
    this.bindAudio();
  }

  setLtcOutput(id: string | null) {
    writeStored(LTC_OUTPUT_KEY, id);
    this.publish({ ltcOutputId: id });
    this.bindAudio();
  }

  /** ブラウザにオーディオ入力（マイク）の使用許可を求める。機器の名前を出すのにも必要 */
  async connectAudio() {
    await this.ltc?.connect();
    this.bindAudio();
  }

  /** ブラウザに MIDI の使用許可を求める。MTC のフルフレームは SysEx なので SysEx も許可してもらう */
  async connectMidi() {
    if (!('requestMIDIAccess' in navigator)) return;
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: true });
    } catch {
      this.publish({ midi: 'denied' });
      return;
    }
    this.access.onstatechange = () => this.refreshPorts();
    this.publish({ midi: 'ready' });
    this.refreshPorts();
  }

  play() {
    if (this.settings.source !== 'internal' || this.playing) return;
    this.startFrame = this.pausedFrame;
    this.startPerf = performance.now();
    this.nextQuarter = this.startFrame * 4;
    this.setPlaying(true);
    this.tick();
  }

  /** その位置で止める。もう一度 play で続きから */
  stop() {
    if (!this.playing) return;
    this.pausedFrame = this.generatorFrame();
    this.setPlaying(false);
    this.publishGenerator();
    this.sendFullFrame();
  }

  /** 開始位置へ戻る。再生中ならそこから再生を続ける */
  rewind() {
    if (this.settings.source !== 'internal') return;
    this.moveGenerator(this.startPosition());
    this.locate(this.startPosition());
    this.sendFullFrame();
    if (this.playing) this.tick();
  }

  private publish(patch: Partial<TimecodeSnapshot>) {
    const changed = (Object.keys(patch) as (keyof TimecodeSnapshot)[]).some((k) => this.snapshot[k] !== patch[k]);
    if (!changed) return;
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private tick() {
    const now = performance.now();
    if (this.settings.source === 'mtc' && this.snapshot.running && now - this.lastQuarterAt > MTC_TIMEOUT_MS) {
      this.publish({ running: false });
    }
    if (this.settings.source === 'ltc' && this.snapshot.running && now - this.lastLtcAt > MTC_TIMEOUT_MS) {
      this.publish({ running: false });
    }
    if (this.settings.source === 'internal' && this.playing) {
      const frame = this.generatorFrame(now);
      this.publishGenerator(frame);
      this.advance(tcKey(framesToTc(frame, this.settings.frameRate)), false);
      this.scheduleOutput(now);
      if (now - this.lastLtcSync > LTC_RESYNC_MS) this.syncLtcOutput();
    }
  }

  // ---------- トリガー ----------

  /** 頭出し。次に進んだとき、ちょうどこの位置の Cue も実行する */
  private locate(frameOrKey: number, isKey = false) {
    this.last = isKey ? frameOrKey : tcKey(framesToTc(frameOrKey, this.settings.frameRate));
    this.inclusive = true;
  }

  /**
   * 前回の位置から今の位置までに来た Cue を実行する。
   * 戻ったとき・受信中に大きく飛んだとき（頭出し）は実行しない
   */
  private advance(key: number, detectJump: boolean) {
    const { last, inclusive } = this;
    if (last === key && !inclusive) return;
    this.last = key;
    this.inclusive = false;
    if (last === null || key < last) return;
    if (detectJump && keySeconds(key) - keySeconds(last) > JUMP_SECONDS) return;

    const due: { pageId: string; cueId: string; at: number }[] = [];
    for (const page of this.pages) {
      if (!page.timeTriggers || page.triggerSource !== 'tc') continue;
      for (const cue of page.cues) {
        const tc = cue.triggerEnabled && cue.tcAt ? parseTc(cue.tcAt) : null;
        if (!tc) continue;
        const at = tcKey(tc);
        if ((inclusive ? at >= last : at > last) && at <= key) due.push({ pageId: page.id, cueId: cue.id, at });
      }
    }
    // 同じ位置の Cue は順に実行され、リストで後ろの Cue が残る
    due.sort((a, b) => a.at - b.at).forEach(({ pageId, cueId }) => this.fire(pageId, cueId));
  }

  // ---------- 受信 ----------

  private onMidiMessage = (e: MIDIMessageEvent) => {
    if (this.settings.source !== 'mtc' || !e.data) return;
    if (e.data[0] === 0xf1) this.lastQuarterAt = performance.now();
    const event = this.decoder.feed(e.data);
    if (!event) return;
    const key = tcKey(event.tc);
    if (event.kind === 'locate') {
      this.locate(key, true);
      this.publish({ tc: formatTc(event.tc), rate: event.rate, running: false });
      return;
    }
    this.publish({ tc: formatTc(event.tc), rate: event.rate, running: true });
    this.advance(key, true);
  };

  private async autoConnect() {
    try {
      // 一度許可されていれば聞かれずにつながる。まだなら「MIDI に接続」を押してもらう
      const status = await navigator.permissions.query({ name: 'midi', sysex: true } as PermissionDescriptor);
      if (status.state === 'granted') await this.connectMidi();
    } catch {
      // 調べられないときは手動で接続してもらう
    }
  }

  private refreshPorts() {
    if (!this.access) return;
    const list = (ports: MIDIInputMap | MIDIOutputMap) =>
      [...ports.values()].map((p) => ({ id: p.id, name: p.name ?? p.id }));
    this.publish({ inputs: list(this.access.inputs), outputs: list(this.access.outputs) });
    this.bindInput();
  }

  private bindInput() {
    if (!this.access) return;
    const listening = this.started && this.settings.source === 'mtc';
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = listening && input.id === this.snapshot.inputId ? this.onMidiMessage : null;
    }
  }

  // ---------- LTC ----------

  /** 届いたフレームは送り終わった直後なので、今の位置はその次のフレーム。止まっていた後の最初のフレームは頭出しとして扱う */
  private onLtcFrame = (tc: Timecode, rate: FrameRate) => {
    if (this.settings.source !== 'ltc') return;
    this.lastLtcAt = performance.now();
    const now = framesToTc(tcToFrames(tc, rate) + 1, rate);
    const key = tcKey(now);
    const resumed = !this.snapshot.running;
    this.publish({ tc: formatTc(now), rate, running: true });
    if (resumed) this.locate(key, true);
    else this.advance(key, true);
  };

  /** 設定に合わせて LTC の入力を開き、出力先を決める */
  private bindAudio() {
    const ltc = this.ltc;
    if (!ltc || this.snapshot.audio !== 'ready') return;
    const { ltcInputId, ltcChannel, ltcOutputId } = this.snapshot;
    if (this.started && this.settings.source === 'ltc' && ltcInputId) void ltc.openInput(ltcInputId, ltcChannel);
    else ltc.closeInput();
    void ltc.setOutputDevice(this.settings.source === 'internal' ? ltcOutputId : null).then(() => this.syncLtcOutput());
  }

  /** 生成の今の位置合わせを LTC の出力に送る（止まっていれば無音） */
  private syncLtcOutput() {
    this.lastLtcSync = performance.now();
    this.ltc?.setPlayback(this.playing ? { frame: this.startFrame, perf: this.startPerf, rate: this.settings.frameRate } : null);
  }

  // ---------- 生成・出力 ----------

  private startPosition() {
    return tcToFrames(parseTc(this.settings.start) ?? parseTc(defaultTimecode.start)!, this.settings.frameRate);
  }

  private generatorFrame(now = performance.now()) {
    if (!this.playing) return this.pausedFrame;
    return this.startFrame + Math.floor(((now - this.startPerf) * realFps(this.settings.frameRate)) / 1000);
  }

  private setPlaying(playing: boolean) {
    this.playing = playing;
    this.worker?.postMessage(playing ? PLAYING_TICK_MS : IDLE_TICK_MS);
    this.syncLtcOutput();
  }

  /** 生成の位置を動かす。再生中ならその位置から再生を続ける */
  private moveGenerator(frame: number) {
    if (this.playing) {
      this.startFrame = frame;
      this.startPerf = performance.now();
      this.nextQuarter = frame * 4;
      this.syncLtcOutput();
    } else {
      this.pausedFrame = frame;
    }
    this.publishGenerator();
  }

  private publishGenerator(frame = this.generatorFrame()) {
    const rate = this.settings.frameRate;
    this.publish({ tc: formatTc(framesToTc(frame, rate)), rate, running: this.playing });
  }

  private output() {
    const id = this.snapshot.outputId;
    return (id && this.access?.outputs.get(id)) || null;
  }

  /** これから LOOKAHEAD_MS の間に出すクォーターフレームを、送る時刻を指定して予約する */
  private scheduleOutput(now: number) {
    const out = this.output();
    if (!out) return;
    const rate = this.settings.frameRate;
    const msPerQuarter = 1000 / realFps(rate) / 4;
    const quarterAt = (q: number) => this.startPerf + (q - this.startFrame * 4) * msPerQuarter;
    // 出力先を途中で選んだときなどに、過ぎた分をまとめて送らない
    const current = this.startFrame * 4 + Math.floor((now - this.startPerf) / msPerQuarter);
    if (this.nextQuarter < current) this.nextQuarter = current;

    while (quarterAt(this.nextQuarter) <= now + LOOKAHEAD_MS) {
      const piece = this.nextQuarter % 8;
      // 8 つ組は偶数フレームから始まり、その最初のフレームのタイムコードを送る
      const tc = framesToTc((this.nextQuarter - piece) / 4, rate);
      try {
        out.send(quarterFrame(piece, tc, rate), quarterAt(this.nextQuarter));
      } catch {
        return;
      }
      this.nextQuarter++;
    }
  }

  private sendFullFrame() {
    try {
      this.output()?.send(fullFrame(framesToTc(this.generatorFrame(), this.settings.frameRate), this.settings.frameRate));
    } catch {
      // 外れた機器には送れなくてよい
    }
  }
}

/** PrimaryApp で 1 つだけ作る。ページとタイムコードの設定の変更を渡し続ける */
export function useTimecodeEngine(pages: Page[], settings: TimecodeSettings, dispatch: Dispatch<Action>) {
  const [engine] = useState(() => new TimecodeEngine((pageId, cueId) => dispatch({ type: 'fireCue', pageId, cueId })));
  useEffect(() => {
    engine.start();
    return () => engine.dispose();
  }, [engine]);
  useEffect(() => engine.setPages(pages), [engine, pages]);
  useEffect(() => engine.configure(settings), [engine, settings]);
  return engine;
}

export function useTimecode(engine: TimecodeEngine) {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}
