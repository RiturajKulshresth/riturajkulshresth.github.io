"use client";

/**
 * Single project tile in the Projects grid. Whole card is one link; preview
 * images fade in after load (with a mount-time `complete` check for cache hits).
 */
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/data";
import { ArrowUpRight } from "./icons";

export default function ProjectCard({ project }: { project: Project }) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // SVGs and cached GIFs can finish loading before React attaches `onLoad`,
  // which would leave the image stuck at opacity-0. After mount, we check the
  // ref's `complete` flag to recover that case.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setPreviewLoaded(true);
    }
  }, []);

  const isExternalLink = Boolean(project.link);

  return (
    <a
      href={project.link ?? undefined}
      target={isExternalLink ? "_blank" : undefined}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      // Cards without a `link` still render but are not navigable.
      aria-disabled={!isExternalLink || undefined}
      className="card group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* Always-playing preview (GIF or static). Mounted eagerly so the
            animation runs as soon as the card is in view. */}
        {project.preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={project.preview}
            alt=""
            onLoad={() => setPreviewLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              previewLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Project initial mark, only shown when there is no preview so it
            doesn't clutter the playing GIF. */}
        {!project.preview && (
          <span
            aria-hidden
            className="absolute bottom-3 left-4 font-display text-5xl leading-none text-[color:var(--color-fg)] opacity-15"
          >
            {project.title.charAt(0)}
          </span>
        )}

        {/* Year badge, elevated above the preview so it stays legible. */}
        <span className="absolute right-3 top-3 z-10 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)] backdrop-blur">
          {project.year}
        </span>

        {/* Gradient overlay at bottom for legibility against the preview. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[color:var(--color-bg-elevated)]/80 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-medium text-[color:var(--color-fg)]">{project.title}</h3>
        <p className="mt-1 text-xs text-[color:var(--color-accent)]">
          {project.subtitle}
        </p>

        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-[color:var(--color-fg-muted)] text-pretty">
          {project.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-fg-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-fg-subtle)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]" />
        </div>
      </div>
    </a>
  );
}
