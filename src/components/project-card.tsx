"use client";

import { useState } from "react";
import Image from "next/image";
import type { Project } from "@/lib/data";

export default function ProjectCard({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="card group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgb(167_139_250_/_0.12),transparent_55%),radial-gradient(circle_at_80%_80%,rgb(34_211_238_/_0.08),transparent_55%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-dots opacity-50"
        />

        {/* Project initial mark — always visible underneath */}
        <span
          aria-hidden
          className="absolute bottom-3 left-4 font-display text-5xl leading-none text-[color:var(--color-fg)] opacity-15"
        >
          {project.title.charAt(0)}
        </span>

        {/* Year badge */}
        <span className="absolute right-3 top-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)] backdrop-blur">
          {project.year}
        </span>

        {/* Hover-to-play preview — only mounts when hovered, never on touch devices */}
        {project.preview && hovered && (
          <Image
            src={project.preview}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            onLoad={() => setPreviewLoaded(true)}
            className={`object-cover transition-opacity duration-300 ${
              previewLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Gradient overlay at bottom for legibility when preview is visible */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[color:var(--color-bg-elevated)]/80 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-medium text-[color:var(--color-fg)]">{project.title}</h3>
        <p className="mt-1 text-xs text-[color:var(--color-accent)]">
          {project.subtitle}
        </p>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--color-fg-muted)] text-pretty">
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
          <svg
            className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-fg-subtle)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 9L9 3M9 3H4M9 3V8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
