import { useEffect, useRef } from 'react';

/**
 * Pin the scroll position of a ref'd element to the bottom whenever the
 * `trigger` value changes. Caller chooses what to use as the trigger
 * (e.g. `messages.length` or a composite string); the dep array stays a
 * literal so biome's exhaustive-deps rule is happy.
 */
export function useAutoScroll<T extends HTMLElement>(trigger: unknown) {
  const scrollRef = useRef<T>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `trigger` is the dep by design
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [trigger]);

  return scrollRef;
}
