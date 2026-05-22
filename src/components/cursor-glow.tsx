"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A two-part custom cursor: a small filled dot that snaps to the pointer
 * with high agility, and a thin ring that trails behind it. The differential
 * lerp speeds make the two read as separate elements - the dot feels
 * direct-manipulation, the ring drifts in to settle around it.
 *
 *   - Position is updated imperatively via `transform` in a single
 *     `requestAnimationFrame` loop. We never touch React state during motion,
 *     so the rest of the tree never re-renders on cursor movement.
 *   - Colour comes from the theme-aware `--color-cursor-glow` CSS variable,
 *     so it picks up the active light / dark palette automatically.
 *   - Hidden on the /photography route (that page is already an immersive
 *     media surface and doesn't need extra chrome), on touch devices, and
 *     when the user prefers reduced motion.
 *   - z-index is below the navbar (50) and any modals/lightbox (100), so the
 *     reticle stays ambient under interactive chrome rather than tinting it.
 */
export default function CursorGlow() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  // Each element keeps its own current position so they can lerp at
  // independent speeds toward the same target.
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const visible = useRef(false);
  const rafId = useRef<number | null>(null);

  const isPhotography = pathname?.startsWith("/photography") ?? false;

  useEffect(() => {
    if (isPhotography) return;
    if (typeof window === "undefined") return;
    // No cursor on touch devices; no animation when reduced-motion is set.
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dotEl = dotRef.current;
    const ringEl = ringRef.current;
    if (!dotEl || !ringEl) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible.current) {
        // Snap both on first move so they don't fly in from (0, 0).
        dotPos.current.x = e.clientX;
        dotPos.current.y = e.clientY;
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
        visible.current = true;
        dotEl.style.opacity = "1";
        ringEl.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible.current = false;
      dotEl.style.opacity = "0";
      ringEl.style.opacity = "0";
    };

    // Differential lerp:
    //   - Dot: high ease so it feels glued to the pointer (near-direct).
    //   - Ring: low ease so it drifts in and "catches up" to the dot, which
    //     visually decouples the two and reads as two separate elements.
    const dotEase = 0.55;
    const ringEase = 0.14;

    const tick = () => {
      dotPos.current.x += (target.current.x - dotPos.current.x) * dotEase;
      dotPos.current.y += (target.current.y - dotPos.current.y) * dotEase;
      ringPos.current.x += (target.current.x - ringPos.current.x) * ringEase;
      ringPos.current.y += (target.current.y - ringPos.current.y) * ringEase;

      dotEl.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      ringEl.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;

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
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[40] h-5 w-5 rounded-full border opacity-0 will-change-transform"
        style={{
          borderColor: "var(--color-cursor-glow)",
          transition: "opacity 250ms ease-out",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[40] h-1 w-1 rounded-full opacity-0 will-change-transform"
        style={{
          backgroundColor: "var(--color-cursor-glow)",
          transition: "opacity 250ms ease-out",
        }}
      />
    </>
  );
}
