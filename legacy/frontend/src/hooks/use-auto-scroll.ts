import { useEffect, useRef } from 'react';

export function useAutoScroll<T extends HTMLElement>(deps: unknown[] = []) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, deps);

  return scrollRef;
}
