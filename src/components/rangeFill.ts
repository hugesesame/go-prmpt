import type { CSSProperties } from 'react';

/** スライダーの値までを塗るための割合を CSS 変数 --fill で渡す（styles.css の range 指定と対） */
export function rangeFill(value: number, min: number, max: number): CSSProperties {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  return { '--fill': `${Math.min(1, Math.max(0, ratio)) * 100}%` } as CSSProperties;
}
