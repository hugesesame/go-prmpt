import { useEffect, useState } from 'react';

interface Range {
  min: number;
  max: number;
  default: number;
}

/** 列の幅。操作する人の好みなのでブラウザに覚える。範囲外の値は範囲に収める */
export function useColumnWidth(storageKey: string, range: Range) {
  const clamp = (w: number) => Math.round(Math.min(range.max, Math.max(range.min, w)));
  const [width, setWidth] = useState(() => clamp(Number(localStorage.getItem(storageKey)) || range.default));
  useEffect(() => localStorage.setItem(storageKey, String(width)), [storageKey, width]);
  return [width, (w: number) => setWidth(clamp(w))] as const;
}

interface Props {
  onResize: (width: number) => void;
  onReset: () => void;
  title: string;
}

/** 親の列の右端に置くつまみ。ドラッグで幅を変え、ダブルクリックで元の幅に戻す */
export function ColumnResizer({ onResize, onReset, title }: Props) {
  return (
    <div
      className="column-resizer"
      title={title}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        onResize(e.clientX - e.currentTarget.parentElement!.getBoundingClientRect().left);
      }}
      onDoubleClick={onReset}
    />
  );
}
