import { useEffect } from "react";

type LockOptions = {
  /**
   * Also lock `html.overflow`. Needed for components that own the entire
   * viewport (e.g. a fullscreen media surface), because on iOS Safari
   * `100vh` doesn't subtract the address bar and the document can scroll
   * even when `body.overflow` is locked.
   */
  lockHtml?: boolean;
  /**
   * Set `body.overscroll-behavior: none` to suppress iOS rubber-band bounce
   * at the document edges. Useful when the locked component has its own
   * scrollable / draggable surface that shouldn't trigger page-level pull.
   */
  suppressOverscroll?: boolean;
};

/**
 * Locks document scrolling for the lifetime of the calling component.
 * Captures and restores the previous inline-style values so nested locks
 * (e.g. a modal opened inside an already-locked fullscreen surface) cleanly
 * pop the stack without permanently clobbering the page's scroll state.
 *
 * Pass no options for the common modal/lightbox case (lock body only).
 * Pass `{ lockHtml: true, suppressOverscroll: true }` for fullscreen
 * components on iOS.
 */
export function useLockBodyScroll(options: LockOptions = {}) {
  const { lockHtml = false, suppressOverscroll = false } = options;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = lockHtml ? html.style.overflow : "";
    const prevBodyOverscroll = suppressOverscroll
      ? body.style.overscrollBehavior
      : "";

    body.style.overflow = "hidden";
    if (lockHtml) html.style.overflow = "hidden";
    if (suppressOverscroll) body.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = prevBodyOverflow;
      if (lockHtml) html.style.overflow = prevHtmlOverflow;
      if (suppressOverscroll) body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [lockHtml, suppressOverscroll]);
}
