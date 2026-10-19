import { useEffect, useState, type CSSProperties } from 'react';
import type { LiveCue, OutputSettings, OutputState } from '../types';
import { formatRemaining, useNow } from '../useNow';

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
  const { settings, live, blackout, blink } = state;
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
      <div
        className="output-blackout"
        style={{ opacity: blackout ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
      />
    </div>
  );
}

function LiveLayer({ layer, settings, fadeMs }: { layer: Layer; settings: OutputSettings; fadeMs: number }) {
  const { live } = layer;
  const showCountdown = !!live && live.duration > 0 && live.countdown;
  const now = useNow(100, showCountdown);

  const textStyle: CSSProperties = {
    color: settings.textColor,
    fontSize: live ? `${live.fontSize}cqh` : undefined,
    WebkitTextStroke:
      settings.outlineWidth > 0 ? `${settings.outlineWidth * 0.1}cqh ${settings.outlineColor}` : undefined,
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
      {showCountdown && (
        <span className="output-countdown" style={{ color: settings.textColor }}>
          {formatRemaining(Math.max(0, live.duration - (now - live.startedAt) / 1000))}
        </span>
      )}
    </div>
  );
}
