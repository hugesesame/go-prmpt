import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  top: ReactNode;
  bottom: ReactNode;
  /** 下側の高さを覚えておく localStorage のキー */
  storageKey: string;
  defaultBottom: number;
  /** 上側にできるだけ残す高さ。画面が低いときは下側の最小値を優先する */
  minTop: number;
  minBottom: number;
  title: string;
}

/** 上下 2 つの領域を、境目のドラッグで高さを変えられるように並べる */
export function VerticalSplit({ top, bottom, storageKey, defaultBottom, minTop, minBottom, title }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(() => Number(localStorage.getItem(storageKey)) || defaultBottom);
  // ウィンドウを縮めたときも上側を潰さないよう、表示する高さは毎回ここで収める
  const [rootHeight, setRootHeight] = useState<number | null>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const observer = new ResizeObserver(() => setRootHeight(root.clientHeight));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const clamp = (h: number) => (rootHeight === null ? h : Math.max(minBottom, Math.min(h, rootHeight - minTop)));

  useEffect(() => localStorage.setItem(storageKey, String(height)), [storageKey, height]);

  return (
    <div className="vsplit" ref={rootRef}>
      <div className="vsplit-top">{top}</div>
      <div
        className="vsplit-handle"
        title={title}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setHeight(clamp(rootRef.current!.getBoundingClientRect().bottom - e.clientY));
        }}
      />
      <div className="vsplit-bottom" style={{ height: clamp(height) }}>
        {bottom}
      </div>
    </div>
  );
}
