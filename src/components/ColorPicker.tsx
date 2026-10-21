import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { hexToHsv, hsvToHex, isHex, type Hsv } from '../color';
import { useLang } from '../i18n';

const WHEEL_SIZE = 180;
const POPOVER_WIDTH = 220;
const presets = ['#ffffff', '#000000', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#0a84ff', '#bf5af2'];

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

/** 長方形のスウォッチ。クリックでカラーホイールのポップオーバーを開く */
export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const swatchRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={swatchRef}
        className="color-swatch"
        style={{ background: value }}
        aria-label={value}
        onClick={() => setOpen((o) => !o)}
      />
      {/* スウォッチは <label> の中にあり、その中をクリックするとスウォッチも押されてしまうので body に出す */}
      {open &&
        swatchRef.current &&
        createPortal(
          <Popover anchor={swatchRef.current} value={value} onChange={onChange} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}

interface PopoverProps extends Props {
  anchor: HTMLElement;
  onClose: () => void;
}

function Popover({ anchor, value, onChange, onClose }: PopoverProps) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  // 彩度や明るさが 0 になっても色相を失わないよう、HSV を自前で持つ
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  useEffect(() => {
    if (hsvToHex(hsv) !== value) setHsv(hexToHsv(value));
    // 外から値が変わったときだけ合わせる
  }, [value]);

  const update = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  // 右パネルはスクロールで切れるので、画面に固定して表示する
  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect();
    const height = ref.current?.offsetHeight ?? 0;
    const below = rect.bottom + 6;
    setPosition({
      left: Math.max(8, Math.min(rect.left, innerWidth - POPOVER_WIDTH - 8)),
      top: below + height > innerHeight - 8 ? Math.max(8, rect.top - height - 6) : below,
    });
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (e: globalThis.PointerEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    // Esc で閉じる。メイン画面のショートカットには渡さない
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    const onScroll = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [anchor, onClose]);

  const hex = hsvToHex(hsv);

  return (
    <div ref={ref} className="color-popover" style={{ ...position, width: POPOVER_WIDTH }}>
      <Wheel hsv={hsv} onChange={update} />
      <label className="color-brightness">
        <span>{t('brightness')}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(hsv.v * 100)}
          style={{ background: `linear-gradient(to right, #000, ${hsvToHex({ ...hsv, v: 1 })})` }}
          onChange={(e) => update({ ...hsv, v: Number(e.target.value) / 100 })}
        />
      </label>
      <div className="color-presets">
        {presets.map((p) => (
          <button
            key={p}
            className={p === hex ? 'active' : ''}
            style={{ background: p }}
            aria-label={p}
            onClick={() => update(hexToHsv(p))}
          />
        ))}
      </div>
      {/* 色が変わるたびに作り直して、入力途中の文字を最新の値に置き換える */}
      <HexInput key={hex} value={hex} onCommit={(v) => update(hexToHsv(v))} />
    </div>
  );
}

function Wheel({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scale = devicePixelRatio;
    canvas.width = canvas.height = WHEEL_SIZE * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    const c = WHEEL_SIZE / 2;

    // 色相は右（0°）から時計回り。中心に向かって白くなる＝彩度
    const hue = ctx.createConicGradient(0, c, c);
    ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'].forEach((color, i) => hue.addColorStop(i / 6, color));
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fillStyle = hue;
    ctx.fill();

    const white = ctx.createRadialGradient(c, c, 0, c, c, c);
    white.addColorStop(0, '#fff');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fill();
  }, []);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const s = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    // 黒（明るさ 0）のままだとホイールを触っても色が出ないので、明るさを上げる
    onChange({ h, s, v: hsv.v === 0 ? 1 : hsv.v });
  };

  const angle = (hsv.h * Math.PI) / 180;
  const r = (WHEEL_SIZE / 2) * hsv.s;

  return (
    <div
      className="color-wheel"
      style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
      }}
    >
      <canvas ref={canvasRef} style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }} />
      {/* 明るさは黒を重ねて表現する */}
      <div className="color-wheel-shade" style={{ opacity: 1 - hsv.v }} />
      <div
        className="color-wheel-marker"
        style={{
          left: WHEEL_SIZE / 2 + r * Math.cos(angle),
          top: WHEEL_SIZE / 2 + r * Math.sin(angle),
          background: hsvToHex(hsv),
        }}
      />
    </div>
  );
}

function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const v = (draft.startsWith('#') ? draft : `#${draft}`).toLowerCase();
    if (isHex(v)) onCommit(v);
    else setDraft(value);
  };

  return (
    <input
      className="color-hex"
      value={draft}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
