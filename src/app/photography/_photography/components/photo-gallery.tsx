"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import clsx from "clsx";
import type { Photo } from "@/lib/photography";
import { useLockBodyScroll } from "@/lib/hooks";
import PhotoLightbox from "./photo-lightbox";
import { ChevronLeft, ChevronRight } from "./icons";

/**
 * Infinite-cycle drag-to-pan gallery.
 *
 *   - The photo list is rendered three times. The middle copy is the "real"
 *     one; the left + right copies provide seamless overflow content.
 *   - Track position is pixel-based: `translate3d(x px, -50%, 0)`. No
 *     percentage or viewport math, so the drag is bounded only by intent -
 *     every image can be brought to the centre regardless of viewport size.
 *   - When `x` drifts more than half a list-length from its initial value,
 *     it's silently shifted by one full list-length. Because the three
 *     copies are identical, the wrap is invisible to the user - the carousel
 *     feels endless.
 *   - Parallax is computed per image from its actual screen position
 *     (0% when the image's centre is at the left edge → 100% at the right
 *     edge), so the depth effect is purely a function of where the image
 *     sits on screen, not of any global drag percentage.
 *   - Inputs supported: mouse drag, touch drag, two-finger trackpad scroll,
 *     mouse wheel, and arrow-key step. All of them feed the same `applyX`
 *     pipeline, so wrapping, parallax, and the centred-index search behave
 *     identically regardless of how the user drives the carousel.
 */
const COPIES = 3;

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const stateRef = useRef({
    mouseDownAt: 0,
    prevX: 0,
    x: 0,
    initialX: 0,
    listWidth: 0,
    unitWidth: 0,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragMovedRef = useRef(false);
  const animRafRef = useRef<number | null>(null);

  const N = photos.length;
  const MIDDLE_START = Math.floor(COPIES / 2) * N;

  const loopedPhotos = useMemo(
    () => Array.from({ length: COPIES }, () => photos).flat(),
    [photos]
  );

  /**
   * Single pass over every rendered image that does three jobs at once:
   *   (1) writes `object-position` so each image's parallax tracks its
   *       on-screen location,
   *   (2) finds the image nearest the viewport centre (iterating ALL copies
   *       because the silent wrap means the centred image can belong to the
   *       left or right copy; `i % N` recovers the real photo index), and
   *   (3) returns the x offset that would perfectly centre that image.
   *
   * Combining the three uses of `img.offsetLeft + img.offsetWidth / 2 + x`
   * into one walk halves DOM reads per frame and keeps the snap-x derivation
   * trivially consistent with the currentIndex it just set.
   *
   * `setCurrentIndex` with an unchanged value bails out at React's
   * `Object.is` check, so this is safe to call from every input pipeline.
   */
  const recompute = useCallback(() => {
    const vw = window.innerWidth;
    const x = stateRef.current.x;
    let closestI = 0;
    let closestImg: HTMLImageElement | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < imageRefs.current.length; i++) {
      const img = imageRefs.current[i];
      if (!img) continue;
      const screenCenter = img.offsetLeft + img.offsetWidth / 2 + x;
      const pct = Math.max(0, Math.min(100, (screenCenter / vw) * 100));
      img.style.objectPosition = `${pct}% center`;
      const d = Math.abs(screenCenter - vw / 2);
      if (d < minDistance) {
        minDistance = d;
        closestI = ((i % N) + N) % N;
        closestImg = img;
      }
    }
    setCurrentIndex(closestI);

    // x that would perfectly centre the closest image:
    //   img.screenCenter = img.offsetLeft + img.offsetWidth/2 + x = vw/2
    //   ⇒ snapX = vw/2 − img.offsetWidth/2 − img.offsetLeft
    return closestImg
      ? vw / 2 - closestImg.offsetWidth / 2 - closestImg.offsetLeft
      : x;
  }, [N]);

  /** Write `x` to the track, wrapping it back to the middle copy if it's drifted too far. */
  const applyX = useCallback(
    (rawX: number) => {
      const track = trackRef.current;
      if (!track) return;

      let x = rawX;
      const { initialX, listWidth } = stateRef.current;
      if (listWidth > 0) {
        // Wrap into [initialX - listWidth/2, initialX + listWidth/2].
        // Each wrap also shifts prevX in lockstep so the in-flight drag
        // continues smoothly from the new reference.
        while (x - initialX > listWidth / 2) {
          x -= listWidth;
          stateRef.current.prevX -= listWidth;
        }
        while (x - initialX < -listWidth / 2) {
          x += listWidth;
          stateRef.current.prevX += listWidth;
        }
      }

      stateRef.current.x = x;
      track.style.transform = `translate3d(${x}px, -50%, 0)`;
      recompute();
    },
    [recompute]
  );

  /** Measure the track + images, set the initial centered position. */
  const initialise = useCallback(() => {
    const track = trackRef.current;
    const firstImg = imageRefs.current[MIDDLE_START];
    const lastImg = imageRefs.current[MIDDLE_START + N - 1];
    if (!track || !firstImg || !lastImg) return;
    if (!firstImg.offsetWidth) return; // layout not ready yet

    const halfViewport = window.innerWidth / 2;
    const firstCenter = firstImg.offsetLeft + firstImg.offsetWidth / 2;
    const initialX = halfViewport - firstCenter;

    const lastCenter = lastImg.offsetLeft + lastImg.offsetWidth / 2;
    const unitWidth =
      N > 1 ? (lastCenter - firstCenter) / (N - 1) : firstImg.offsetWidth;
    const listWidth = unitWidth * N;

    stateRef.current.initialX = initialX;
    stateRef.current.unitWidth = unitWidth;
    stateRef.current.listWidth = listWidth;
    stateRef.current.prevX = initialX;
    applyX(initialX);
  }, [MIDDLE_START, N, applyX]);

  // Mount: initialise once the layout exists. Re-initialise on resize.
  useEffect(() => {
    const raf = requestAnimationFrame(() => initialise());

    const onResize = () => initialise();
    window.addEventListener("resize", onResize);

    // Some images may not be loaded yet on first mount; re-measure when they are.
    const loadHandlers: Array<{ img: HTMLImageElement; handler: () => void }> = [];
    for (const img of imageRefs.current) {
      if (!img || img.complete) continue;
      const handler = () => initialise();
      img.addEventListener("load", handler, { once: true });
      loadHandlers.push({ img, handler });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      loadHandlers.forEach(({ img, handler }) =>
        img.removeEventListener("load", handler)
      );
    };
  }, [initialise]);

  const handleOnDown = useCallback(
    (clientX: number) => {
      if (lightboxOpen) return;
      stateRef.current.mouseDownAt = clientX;
      stateRef.current.prevX = stateRef.current.x;
      dragMovedRef.current = false;
      setIsDragging(true);
    },
    [lightboxOpen]
  );

  const handleOnUp = useCallback(() => {
    if (stateRef.current.mouseDownAt === 0) return;
    stateRef.current.mouseDownAt = 0;
    stateRef.current.prevX = stateRef.current.x;
    setIsDragging(false);
  }, []);

  const handleOnMove = useCallback(
    (clientX: number) => {
      if (lightboxOpen) return;
      if (stateRef.current.mouseDownAt === 0) return;
      const dragDelta = clientX - stateRef.current.mouseDownAt;
      if (Math.abs(dragDelta) > 4) dragMovedRef.current = true;
      applyX(stateRef.current.prevX + dragDelta);
    },
    [lightboxOpen, applyX]
  );

  // Global mouse + touch listeners.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => handleOnDown(e.clientX);
    const onMouseUp = () => handleOnUp();
    const onMouseMove = (e: MouseEvent) => handleOnMove(e.clientX);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) handleOnDown(t.clientX);
    };
    const onTouchEnd = () => handleOnUp();
    const onTouchMove = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) handleOnMove(t.clientX);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [handleOnDown, handleOnUp, handleOnMove]);

  /**
   * Manually tween x to a target using requestAnimationFrame.
   * We can't use a CSS transition + applyX because applyX silently wraps
   * targetX into the middle copy's range - when targetX is on the far side
   * of the wrap boundary, that produces a long-path animation in the wrong
   * direction. Driving the transform ourselves lets the visible motion
   * always take the short path; the wrap is applied invisibly afterwards
   * because the rendered copies are identical.
   */
  const animateTo = useCallback(
    (targetX: number, duration = 360) => {
      const track = trackRef.current;
      if (!track) return;
      if (animRafRef.current !== null) {
        cancelAnimationFrame(animRafRef.current);
      }
      const startX = stateRef.current.x;
      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const x = startX + (targetX - startX) * eased;

        stateRef.current.x = x;
        track.style.transform = `translate3d(${x}px, -50%, 0)`;
        // Same single-pass parallax + centred-index update as a drag frame.
        // We can't reuse applyX here because it silently wraps x mid-tween,
        // which would jump the visible motion onto the wrong side of the
        // wrap boundary; the wrap is applied invisibly after the tween ends.
        recompute();

        if (t < 1) {
          animRafRef.current = requestAnimationFrame(step);
        } else {
          animRafRef.current = null;
          stateRef.current.prevX = stateRef.current.x;
          // Silent wrap: copies are identical so this is invisible.
          applyX(stateRef.current.x);
        }
      };
      animRafRef.current = requestAnimationFrame(step);
    },
    [applyX, recompute]
  );

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (lightboxOpen) return;


      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const raw = absX > absY ? e.deltaX : e.deltaY;
      if (raw === 0) return;

      let scale = 1;
      if (e.deltaMode === 1) scale = 16;
      else if (e.deltaMode === 2) scale = window.innerHeight;

      const isMouseWheel = e.deltaMode !== 0 || Math.abs(raw) >= 30;
      const SENSITIVITY = isMouseWheel ? 0.35 : 2;

      e.preventDefault();

      if (animRafRef.current !== null) {
        cancelAnimationFrame(animRafRef.current);
        animRafRef.current = null;
      }

      applyX(stateRef.current.x - raw * scale * SENSITIVITY);
      stateRef.current.prevX = stateRef.current.x;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [lightboxOpen, applyX]);

  // Arrow-key nav.
  useEffect(() => {
    if (lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (!stateRef.current.unitWidth) return;

      // If the user just dragged and left the focused image off-centre, the
      // first arrow press should snap it into the centre (not step past it).
      // Once centred, subsequent presses advance/retreat by one image.
      // `recompute()` returns the snap-x for the closest image as a side
      // effect of its single-pass walk - we already pay for that walk on
      // every drag frame, so reusing it here is essentially free.
      const snapX = recompute();
      if (Math.abs(stateRef.current.x - snapX) > 2) {
        animateTo(snapX);
        return;
      }

      // ArrowRight pans the track left → advances to the next image.
      const direction = e.key === "ArrowRight" ? -1 : 1;
      const targetX = stateRef.current.x + direction * stateRef.current.unitWidth;
      animateTo(targetX);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, animateTo, recompute]);

  // Cancel any in-flight RAF tween on unmount.
  useEffect(() => {
    return () => {
      if (animRafRef.current !== null) cancelAnimationFrame(animRafRef.current);
    };
  }, []);

  // Fullscreen gallery: lock html + body overflow and suppress iOS
  // rubber-band so the page can't scroll out from under the viewport-sized
  // surface. Paired with `h-[100dvh]` on the root below.
  useLockBodyScroll({ lockHtml: true, suppressOverscroll: true });

  const openAt = (loopedIndex: number) => {
    if (dragMovedRef.current) return;
    const realIndex = ((loopedIndex % N) + N) % N;
    setCurrentIndex(realIndex);
    setLightboxOpen(true);
  };

  const backdrop = photos[currentIndex]?.small ?? "";
  const currentTitle = photos[currentIndex]?.title ?? "";
  const indexLabel = String(currentIndex + 1).padStart(2, "0");
  const totalLabel = String(photos.length).padStart(2, "0");

  return (
    <>
      <div className="relative h-[100dvh] w-screen overflow-hidden bg-black text-white">
        {/* Blurred backdrop tracks the focused photo */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-[background-image] duration-700"
          style={{
            backgroundImage: `url(${backdrop})`,
            filter: "brightness(40%) saturate(120%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/30 backdrop-blur-[44px]" />
        {/* Subtle vignette for cinematic depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Top + bottom scrims for navbar / caption legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-black/75 via-black/35 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        />

        {/* Counter pill - fixed in the upper right, doesn't drag with the track */}
        <div className="pointer-events-none absolute right-4 top-4 z-20 md:right-8 md:top-6">
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
            <span className="font-mono text-[11px] tracking-[0.22em] text-white/90">
              {indexLabel}
              <span className="mx-1.5 text-white/30">/</span>
              <span className="text-white/50">{totalLabel}</span>
            </span>
          </div>
        </div>

        {/* Drag-hint chevrons - pulse softly to telegraph the affordance */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-white/40 md:left-6"
        >
          <ChevronLeft className="h-5 w-5 animate-pulse" strokeWidth="1.5" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 text-white/40 md:right-6"
        >
          <ChevronRight className="h-5 w-5 animate-pulse" strokeWidth="1.5" />
        </div>

        {/* Infinite track. No padding needed - left + right copies fill the slack. */}
        <div
          ref={trackRef}
          className="absolute left-0 top-1/2 z-10 flex select-none gap-[4vmin]"
          style={{
            transform: "translate3d(0px, -50%, 0)",
            willChange: "transform",
          }}
        >
          {loopedPhotos.map((photo, index) => {
            const isActive = index % N === currentIndex;
            return (
              <button
                key={`${photo.id}-${index}`}
                type="button"
                aria-label={`Open ${photo.title}`}
                onClick={() => openAt(index)}
                className={clsx(
                  "block shrink-0 overflow-hidden rounded-md transition-[box-shadow,opacity,filter] duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  isActive
                    ? "opacity-100 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] ring-2 ring-white/55"
                    : "opacity-70 shadow-[0_25px_70px_-30px_rgba(0,0,0,0.85)]"
                )}
                style={{ cursor: isDragging ? "grabbing" : "zoom-in" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={(el) => {
                    imageRefs.current[index] = el;
                  }}
                  src={photo.regular}
                  alt={photo.title}
                  draggable={false}
                  className="block h-[56vmin] w-[40vmin] object-cover"
                  style={{ objectPosition: "50% center" }}
                  // Eager on every copy. We render 3×N elements but they share
                  // only N unique URLs, so the browser dedupes to N fetches -
                  // worth it to make rapid keyboard navigation feel instant.
                  loading="eager"
                  decoding="async"
                  fetchPriority={isActive ? "high" : "auto"}
                />
              </button>
            );
          })}
        </div>

        {/* Centered title caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex flex-col items-center gap-1.5 px-6 text-center text-white">
          <p
            className="text-2xl italic leading-tight tracking-tight text-white/95 md:text-3xl"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            {currentTitle}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
            Frame {indexLabel} of {totalLabel}
          </p>
        </div>

        {/* Bottom rail - credit on the left, interaction hint on the right */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center justify-between gap-2 px-5 text-[10px] uppercase tracking-[0.22em] text-white/45 sm:flex-row sm:px-8">
          <p className="font-mono">
            <span className="text-white/30">©</span> Rituraj Kulshresth
            <span className="mx-1.5 text-white/20">-</span>
            all photographs are my own work
          </p>
          <p className="hidden font-mono sm:block">
            Drag or scroll <span className="text-white/25">·</span> click to
            enlarge <span className="text-white/25">·</span> ← → to step
          </p>
        </div>
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          photos={photos}
          index={currentIndex}
          onIndexChange={setCurrentIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
