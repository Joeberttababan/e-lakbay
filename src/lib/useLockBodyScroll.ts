import { useEffect } from 'react';

/**
 * When `enabled` is true, prevent the document body from scrolling by
 * setting `overflow: hidden`. The previous value is restored on cleanup.
 *
 * This is intentionally minimal and can be safely called from any component
 * as long as it only depends on the `enabled` boolean. It mirrors the
 * pattern previously used in individual modal components throughout the
 * codebase.
 */
export function useLockBodyScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [enabled]);
}
