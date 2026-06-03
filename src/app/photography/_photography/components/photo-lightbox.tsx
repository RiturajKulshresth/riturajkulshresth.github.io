"use client";

import { useEffect, useState } from "react";
import type { Photo } from "@/lib/photography";
import { useLockBodyScroll } from "@/lib/hooks";
import { ChevronLeft, ChevronRight, XClose } from "./icons";

export default function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const photo = photos[index];

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        onIndexChange((index + 1) % photos.length);
      }
      if (e.key === "ArrowLeft") {
        onIndexChange((index - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, onIndexChange, photos.length]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl"
    >
      {/* Close button */}
      <button
        type="button"
        aria-label="Close (Esc)"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur transition hover:border-white/30 hover:bg-black/60 md:right-6 md:top-6"
      >
        <XClose className="h-4 w-4" />
      </button>

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous photo"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index - 1 + photos.length) % photos.length);
        }}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2.5 text-white/90 backdrop-blur transition hover:border-white/30 hover:bg-black/60 md:left-6"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index + 1) % photos.length);
        }}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2.5 text-white/90 backdrop-blur transition hover:border-white/30 hover:bg-black/60 md:right-6"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[88vh] max-w-[90vw] items-center justify-center"
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.full}
          alt={photo.title}
          onLoad={() => setLoaded(true)}
          className={`block max-h-[88vh] max-w-[90vw] rounded-md object-contain shadow-[0_50px_140px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.18),0_0_60px_-15px_rgba(255,255,255,0.18)] ring-1 ring-white/15 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
        {photo.title}{" "}
        <span className="text-white/40">
          · {index + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}
