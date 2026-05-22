"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A soft violet halo that follows the mouse with a gentle lerp.
 *
 *   - Position is updated imperatively via `transform` in a single
 *     `requestAnimationFrame` loop. We never touch React state during motion,
 *     so the rest of the tree never re-renders on cursor movement.
 *   - Colour comes from the theme-aware `--color-cursor-glow` CSS variable,
 *     so it picks up the active light / dark palette automatically.
 *   - Hidden on the /photography route (that page is already an immersive
 *     media surface and doesn't need an extra glow), on touch devices, and
 *     when the user prefers reduced motion.
 *   - z-index is below the navbar (50) and any modals/lightbox (100), so the
 *     glow stays ambient under interactive chrome rather than tinting it.
 */
export default function CursorGlow() {
  const pathname = usePathname();
  const glowRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const visible = useRef(false);
  const rafId = useRef<number | null>(null);

  const isPhotography = pathname?.startsWith("/photography") ?? false;

  useEffect(() => {
    if (isPhotography) return;
    if (typeof window === "undefined") return;
    // No cursor on touch devices; no animation when reduced-motion is set.
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible.current) {
        // Snap on first move so the glow doesn't fly in from (0, 0).
        current.current.x = e.clientX;
        current.current.y = e.clientY;
        visible.current = true;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible.current = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      // Soft trailing lerp — small enough to feel premium, large enough not to lag.
      const ease = 0.18;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [isPhotography]);

  if (isPhotography) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[40] h-[64px] w-[64px] rounded-full opacity-0 will-change-transform"
      style={{
        background:
          "radial-gradient(circle, var(--color-cursor-glow) 0%, color-mix(in oklab, var(--color-cursor-glow) 55%, transparent) 30%, transparent 75%)",
        transition: "opacity 250ms ease-out",
      }}
    />
  );
}
