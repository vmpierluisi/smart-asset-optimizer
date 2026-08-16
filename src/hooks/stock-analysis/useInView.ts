import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element has ever scrolled into view.
 *
 * Used to gate a section's data query (`enabled`) so below-the-fold sections
 * don't fetch until the user actually reaches them — the mechanism that keeps
 * the page from firing every request at once. Once seen, it stays `true` so the
 * data isn't re-gated when the element scrolls back out.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: '200px' },
): { ref: React.RefObject<T>; hasBeenInView: boolean } {
  const ref = useRef<T>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (hasBeenInView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHasBeenInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setHasBeenInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasBeenInView, options]);

  return { ref, hasBeenInView };
}
