/**
 * Shared React hooks used across render modes (scroll locking, etc.).
 */
import { useEffect, useState } from "react";

/**
 * Reports whether the current device is a phone-class device. Used to drop the
 * heaviest GPU work (e.g. the terminal's WebGL shader) on mobile, where it can
 * exhaust memory and crash the tab. Treats both a narrow viewport and a coarse
 * pointer (touch) as mobile so phones are caught in either orientation.
 *
 * SSR-safe: returns `false` until mounted, then resolves from `matchMedia` and
 * stays in sync with viewport / orientation changes.
 */
export function useIsMobile(query = "(max-width: 768px), (pointer: coarse)") {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}

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
