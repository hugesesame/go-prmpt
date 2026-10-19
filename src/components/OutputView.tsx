import { useEffect, useState, type CSSProperties } from 'react';
import type { LiveCountdown, LiveCue, OutputSettings, OutputState } from '../types';
import { formatCountdown, useNow } from '../useNow';
// 保留中: Sec / CD（docs/ideas.md 参照）
// import { formatRemaining } from '../useNow';（useNow は上で import 済み）

interface Layer {
  id: string;
  live: LiveCue | null;
  leaving: boolean;
}

/**
 * セカンダリー画面の中身。サイズは container query 単位（cqh）で指定しているので、
 * プライマリーのプレビューでも出力ウィンドウでも同じ見た目になる。
 */
export function OutputView({ state }: { state: OutputState }) {
  const { settings, live, countdown, message, blackout, blink } = state;
  const fadeMs = settings.transition === 'dissolve' ? settings.transitionMs : 0;
  const layerId = live?.key ?? 'empty';

  const [layers, setLayers] = useState<Layer[]>([{ id: layerId, live, leaving: false }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev.at(-1)?.id === layerId) return prev;
      if (fadeMs === 0) return [{ id: layerId, live, leaving: false }];
      return [
        ...prev.filter((l) => !l.leaving).map((l) => ({ ...l, leaving: true })),
        { id: layerId, live, leaving: false },
      ];
    });
    // live の中身は key と一緒にしか変わらないので key だけを見る
  }, [layerId]);

  useEffect(() => {
    if (!layers.some((l) => l.leaving)) return;
    const timer = setTimeout(() => setLayers((prev) => prev.filter((l) => !l.leaving)), fadeMs);
    return () => clearTimeout(timer);
  }, [layers, fadeMs]);

  return (
    <div className="output-root" style={{ background: settings.background }}>
      <div className={blink ? 'output-layers blink' : 'output-layers'}>
        {layers.map((layer) => (
          <LiveLayer
            key={layer.id}
            // 表示中のレイヤーは最新の内容（出力中に変えたサイズなど）で描く。消えていくレイヤーは当時のまま
            layer={layer.id === layerId && !layer.leaving ? { ...layer, live } : layer}
            settings={settings}
            fadeMs={fadeMs}
          />
        ))}
      </div>
      {countdown && <CountdownOverlay countdown={countdown} color={settings.textColor} />}
      {message && (
        <div
          className={message.blink ? 'overlay-message blink' : 'overlay-message'}
          style={{ color: settings.textColor, fontSize: `${message.size}cqh` }}
        >
          {message.text}
        </div>
      )}
      {/* 暗転はカウントダウンとメッセージも一緒に隠す */}
      <div
        className="output-blackout"
        style={{ opacity: blackout ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
      />
    </div>
  );
}

/** 画面上部のカウントダウン。0 を過ぎたら赤くして経過時間を数える */
function CountdownOverlay({ countdown, color }: { countdown: LiveCountdown; color: string }) {
  const now = useNow(100);
  const remaining = countdown.seconds - (now - countdown.startedAt) / 1000;
  return (
    <div
      className={remaining < 0 ? 'overlay-countdown over' : 'overlay-countdown'}
      style={{ color: remaining < 0 ? undefined : color, fontSize: `${countdown.size}cqh` }}
    >
      {formatCountdown(remaining)}
    </div>
  );
}

function LiveLayer({ layer, settings, fadeMs }: { layer: Layer; settings: OutputSettings; fadeMs: number }) {
  const { live } = layer;
  // 保留中: Sec / CD（docs/ideas.md 参照）
  // const showCountdown = !!live && live.duration > 0 && live.countdown;
  // const now = useNow(100, showCountdown);

  const textStyle: CSSProperties = {
    color: settings.textColor,
    fontSize: live ? `${live.fontSize}cqh` : undefined,
    WebkitTextStroke:
      settings.outlineEnabled && settings.outlineWidth > 0
        ? `${settings.outlineWidth * 0.1}cqh ${settings.outlineColor}`
        : undefined,
  };

  return (
    <div
      className={layer.leaving ? 'output-layer leaving' : 'output-layer'}
      style={{ animationDuration: `${fadeMs}ms` }}
    >
      {live && (
        <div className="output-text" style={textStyle}>
          {live.text}
        </div>
      )}
      {/* 保留中: Sec / CD（docs/ideas.md 参照）
      {showCountdown && (
        <span className="output-countdown" style={{ color: settings.textColor }}>
          {formatRemaining(Math.max(0, live.duration - (now - live.startedAt) / 1000))}
        </span>
      )}
      */}
    </div>
  );
}
