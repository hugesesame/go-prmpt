import { useState } from 'react';
import { formatTc, parseTc } from '../timecode';

interface Props {
  /** 「01:02:15:12」。null は未設定 */
  value: string | null;
  /** 空欄（null）にできる */
  allowEmpty: boolean;
  className: string;
  readOnly?: boolean;
  title: string;
  onCommit: (value: string | null) => void;
}

/**
 * タイムコードの入力欄。Enter か欄の外をクリックで確定し、読めない入力は元に戻す。
 * 確定した値が変わったら入力中の文字を差し替えるよう、呼び出す側で key={value} を付ける
 */
export function TcInput({ value, allowEmpty, className, readOnly, title, onCommit }: Props) {
  const [draft, setDraft] = useState(value ?? '');
  const commit = () => {
    const parsed = parseTc(draft);
    const next = parsed ? formatTc(parsed) : parsed;
    if (next === undefined || (next === null && !allowEmpty) || next === value) setDraft(value ?? '');
    else onCommit(next);
  };
  return (
    <input
      className={className}
      value={draft}
      placeholder="--:--:--:--"
      readOnly={readOnly}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
