import { useEffect, useState } from 'react';
import { uid } from '../defaults';

type PresenceMessage = { type: 'join' | 'here' | 'leave'; id: string };

/**
 * 同じショーを開いているプライマリー画面が他のタブにもあるかを調べる。
 * 自動保存（localStorage）は 1 つしかないので、複数のタブで編集すると互いに上書きしてしまう。
 */
export function useOtherPrimaryTabs() {
  const [others, setOthers] = useState<string[]>([]);

  useEffect(() => {
    const id = uid();
    const channel = new BroadcastChannel('prompter-primary');
    const post = (type: PresenceMessage['type']) => channel.postMessage({ type, id } satisfies PresenceMessage);

    channel.onmessage = (e: MessageEvent<PresenceMessage>) => {
      const { type, id: from } = e.data;
      if (type === 'leave') {
        setOthers((prev) => prev.filter((o) => o !== from));
        return;
      }
      setOthers((prev) => (prev.includes(from) ? prev : [...prev, from]));
      // 後から開いたタブに自分の存在を知らせる
      if (type === 'join') post('here');
    };

    const leave = () => post('leave');
    window.addEventListener('pagehide', leave);
    post('join');
    return () => {
      leave();
      window.removeEventListener('pagehide', leave);
      channel.close();
    };
  }, []);

  return others.length;
}
