"use client";

/**
 * Custom cursor overlay for the Default render mode. See the block comment
 * below for the rAF loop, lerp speeds, and visibility rules.
 */
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
 *
 * The animation loop reads from a `trailers` array, so adding a third
 * trailing element (e.g. a slower outer halo) is just one more entry.
 */
export default function CursorGlow() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

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

    // Differential lerp:
    //   - Dot: high ease so it feels glued to the pointer (near-direct).
    //   - Ring: low ease so it drifts in and "catches up" to the dot, which
    //     visually decouples the two and reads as two separate elements.
    const trailers = [
      { el: dotEl, pos: { x: 0, y: 0 }, ease: 0.55 },
      { el: ringEl, pos: { x: 0, y: 0 }, ease: 0.14 },
    ];

    const target = { x: 0, y: 0 };
    let visible = false;
    let rafId: number | null = null;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        // Snap all trailers to the pointer on first move so they don't fly
        // in from (0, 0).
        for (const t of trailers) {
          t.pos.x = e.clientX;
          t.pos.y = e.clientY;
          t.el.style.opacity = "1";
        }
        visible = true;
      }
    };

    const onLeave = () => {
      visible = false;
      for (const t of trailers) t.el.style.opacity = "0";
    };

    const tick = () => {
      for (const t of trailers) {
        t.pos.x += (target.x - t.pos.x) * t.ease;
        t.pos.y += (target.y - t.pos.y) * t.ease;
        t.el.style.transform = `translate3d(${t.pos.x}px, ${t.pos.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
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
