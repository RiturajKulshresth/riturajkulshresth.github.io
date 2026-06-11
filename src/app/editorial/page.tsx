"use client";

/**
 * Swiss editorial render mode. Presents the portfolio as a print-grid layout with
 * a custom cursor ring, hover-reveal project previews, and an infinite filmstrip.
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight, ArrowUpRight, Plus, ScanLine, LayoutGrid, Briefcase, Hexagon
} from "lucide-react";
import { profile, projects, experience, skillGroups } from "@/lib/data";
import BackButton from "./_editorial/components/back-button";

export default function EditorialSwiss() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // States
  const [hoveredProjectIdx, setHoveredProjectIdx] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorHoveringHeader, setCursorHoveringHeader] = useState(false);
  // When the visitor prefers reduced motion, fall back to the real system cursor
  // instead of hiding it behind a lagging custom ring follower.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Mouse coordinates relative to the container (not the viewport) for the ring follower.
  // The page uses `cursor-none`, so this ring is the only visible pointer on desktop.
  useEffect(() => {
    const handleMousePosition = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMousePosition);
    return () => container?.removeEventListener("mousemove", handleMousePosition);
  }, []);

  // The filmstrip renders the project deck three times. We park the scroll
  // position in the middle copy and, whenever the user nears either edge, jump
  // by exactly one set so the strip loops forever without a visible seam.
  const tripled = [...projects, ...projects, ...projects];

  useEffect(() => {
    const el = filmstripRef.current;
    if (!el) return;
    const oneSet = el.scrollWidth / 3;
    el.scrollLeft = oneSet;
  }, []);

  const handleLoop = useCallback(() => {
    const el = filmstripRef.current;
    if (!el) return;
    const oneSet = el.scrollWidth / 3;
    if (el.scrollLeft <= oneSet * 0.2) {
      el.scrollLeft += oneSet;
    } else if (el.scrollLeft >= oneSet * 1.8) {
      el.scrollLeft -= oneSet;
    }
  }, []);

  const handleScrollFilmstrip = (direction: "left" | "right") => {
    if (!filmstripRef.current) return;
    const scrollAmount = 336; // one card (w-80) + gap
    filmstripRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[640px] bg-[#f5f5f0] text-[#1c1c1a] font-sans p-6 md:p-10 border-4 border-neutral-900 shadow-3xl overflow-hidden flex flex-col justify-between group/swiss selection:bg-neutral-900 selection:text-white ${
        reducedMotion ? "" : "cursor-none"
      }`}
    >

      {/* 1. CUSTOM CURSOR FOLLOWER RING (skipped under reduced motion) */}
      {!reducedMotion && (
        <div
          className="hidden md:block absolute rounded-full border border-neutral-950 pointer-events-none z-40 transition-all duration-150 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: cursorHoveringHeader ? "60px" : "32px",
            height: cursorHoveringHeader ? "60px" : "32px",
            backgroundColor: cursorHoveringHeader ? "rgba(28,28,26,0.08)" : "transparent",
            borderColor: cursorHoveringHeader ? "#ef4444" : "#1c1c1a"
          }}
        />
      )}

      {/* 2. GIANT HOVER BACKGROUND PREVIEW (BLEND MODE OVERLAY) */}
      <div className="absolute inset-0 pointer-events-none z-10 transition-all duration-700">
        {projects.map((proj, idx) =>
          proj.preview ? (
            <div
              key={proj.title}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out"
              style={{
                // Only the hovered project's GIF gets a `url(...)`, so the heavy
                // previews are fetched on first hover instead of on page load.
                backgroundImage:
                  hoveredProjectIdx === idx ? `url(${proj.preview})` : undefined,
                opacity: hoveredProjectIdx === idx ? 0.085 : 0,
                filter: "grayscale(100%)",
                mixBlendMode: "multiply"
              }}
            />
          ) : null
        )}
        {/* Subtle swiss red background gradient accent */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-[#ff3b30]/5 rounded-full blur-3xl" />
      </div>

      {/* SWISS HEADER - GEOMETRIC PRINT GRID STYLE */}
      <div className="border-b-2 border-neutral-950 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <BackButton />
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#ff3b30] font-bold">
              <ScanLine className="w-3.5 h-3.5 animate-pulse" />
              <span>SWISS GRAPHIC LAYOUT NO. 04</span>
            </div>
          </div>
          <h1
            onMouseEnter={() => setCursorHoveringHeader(true)}
            onMouseLeave={() => setCursorHoveringHeader(false)}
            className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none"
          >
            {profile.name}
          </h1>
        </div>
        <div className="text-right font-mono text-[10px] space-y-0.5 text-neutral-600">
          <p>EST: 1996 • BUILD: REACT_A18</p>
          <p>GEO: {profile.location}</p>
        </div>
      </div>

      {/* CONTENT DIVISION: GIANT TYPOGRAPHY INDEX (LEFT) + INFO BLOCK (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 z-20">

        {/* Left Side: Giant Project Index list (links open the project) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-bold">PROJECT CATALOGUE // CLICK A TITLE TO OPEN</span>
          <div className="divide-y divide-neutral-950/20">
            {projects.map((proj, idx) => {
              const Row = (
                <>
                  <div className="flex items-baseline gap-4 select-none">
                    <span className="font-mono text-xs text-neutral-400 font-bold">[{String(idx + 1).padStart(2, "0")}]</span>
                    <h3 className="text-2xl md:text-3.5xl font-extrabold tracking-tighter uppercase group-hover/item:translate-x-2 transition duration-300 text-neutral-900 group-hover/item:text-[#ff3b30]">
                      {proj.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="opacity-0 group-hover/item:opacity-100 transition font-mono text-[10px] uppercase text-neutral-500">
                      {proj.subtitle}
                    </span>
                    <div className="p-1 px-1.5 border border-transparent rounded-full group-hover/item:border-neutral-950 group-hover/item:rotate-45 transition duration-300">
                      <ArrowUpRight className="w-5 h-5 text-neutral-900" />
                    </div>
                  </div>
                </>
              );
              const rowClass =
                "py-4.5 flex justify-between items-center group/item transition duration-300 relative overflow-hidden";
              const onEnter = () => {
                setHoveredProjectIdx(idx);
                setCursorHoveringHeader(true);
              };
              const onLeave = () => {
                setHoveredProjectIdx(null);
                setCursorHoveringHeader(false);
              };
              return proj.link ? (
                <a
                  key={proj.title}
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  className={rowClass}
                >
                  {Row}
                </a>
              ) : (
                <div key={proj.title} onMouseEnter={onEnter} onMouseLeave={onLeave} className={rowClass}>
                  {Row}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Editorial bio and static grid details */}
        <div className="lg:col-span-5 flex flex-col justify-between border-l-0 lg:border-l-2 lg:border-neutral-950 lg:pl-8 space-y-6">
          <div className="space-y-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[#ff3b30] font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Statement Bios</span>
            </span>
            <p className="text-xl font-bold tracking-tight text-neutral-900 leading-snug">
              &ldquo;Design should not merely decorate the surface, it should expose the machine mechanics underneath.&rdquo;
            </p>
            <p className="text-xs text-neutral-600 font-sans leading-relaxed">
              {profile.bio}
            </p>
          </div>

          <div id="swiss-accolades-grid" className="border-t-2 border-neutral-950 pt-4 space-y-3 font-mono text-[10px]">
            <span className="block uppercase font-bold text-neutral-800">SYSTEM MILESTONES REGISTER:</span>
            {projects.slice(0, 2).map((project, i) => (
              <div
                key={project.title}
                className={
                  i === 0
                    ? "grid grid-cols-2 gap-3 pb-2 border-b border-neutral-300"
                    : "grid grid-cols-2 gap-3"
                }
              >
                <p className="font-semibold">{project.title}</p>
                <p className="text-neutral-500">{project.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SWISS SECTION 2.5: EXPERIENCE LEDGER + SKILLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 z-20">
        {/* Experience ledger */}
        <div className="lg:col-span-7 border-t-2 border-neutral-950 pt-5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1.5 mb-4">
            <Briefcase className="w-4 h-4 text-neutral-800" />
            <span>Career Ledger // Chronological</span>
          </span>
          <div className="divide-y divide-neutral-950/15">
            {experience.map((job, idx) => (
              <div key={`${job.company}-${job.period}`} className="py-3.5 grid grid-cols-12 gap-3 items-baseline">
                <span className="col-span-2 font-mono text-[10px] text-neutral-400 font-bold">
                  [{String(idx + 1).padStart(2, "0")}]
                </span>
                <div className="col-span-10 sm:col-span-7">
                  <h4 className="font-extrabold uppercase tracking-tight text-neutral-900 text-sm">
                    {job.company}
                  </h4>
                  <p className="font-mono text-[10.5px] text-[#ff3b30] uppercase tracking-wide">
                    {job.role}
                  </p>
                  {job.highlights[0] && (
                    <p className="mt-1 text-[10.5px] text-neutral-500 font-sans leading-relaxed line-clamp-2">
                      {job.highlights[0]}
                    </p>
                  )}
                </div>
                <span className="col-span-12 sm:col-span-3 font-mono text-[10px] text-neutral-500 sm:text-right">
                  {job.period}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills grid */}
        <div className="lg:col-span-5 border-t-2 border-neutral-950 pt-5 lg:border-l-2 lg:border-neutral-950 lg:pl-8 lg:border-t-2">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1.5 mb-4">
            <Hexagon className="w-4 h-4 text-neutral-800" />
            <span>Type Specimens // Toolset</span>
          </span>
          <div className="space-y-4">
            {skillGroups.map((g) => (
              <div key={g.title}>
                <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-300 pb-1 mb-1.5">
                  {g.title}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="font-mono text-[10px] px-1.5 py-0.5 border border-neutral-400 text-neutral-700 uppercase tracking-wide"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SWISS SECTION 3: FILMSTRIP SCROLL PANEL (CYCLIC) */}
      <div className="mt-4 border-t-2 border-neutral-950 pt-5 z-20">
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1">
            <LayoutGrid className="w-4 h-4 text-neutral-800" />
            <span>Infinite Filmstrip // Panel Deck</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleScrollFilmstrip("left")}
              className="p-1.5 border border-neutral-950 rounded hover:bg-neutral-950 hover:text-white transition cursor-pointer"
              title="Slide Left"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => handleScrollFilmstrip("right")}
              className="p-1.5 border border-neutral-950 rounded hover:bg-neutral-950 hover:text-white transition cursor-pointer"
              title="Slide Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filmstrip container, looped on scroll */}
        <div
          ref={filmstripRef}
          onScroll={handleLoop}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300"
          style={{ scrollbarWidth: "thin" }}
        >
          {tripled.map((proj, i) => {
            const Card = (
              <>
                <div className="aspect-[16/10] bg-neutral-200 overflow-hidden relative mb-3 flex items-center justify-center">
                  <span className="absolute font-black text-4xl text-neutral-400 uppercase tracking-tighter select-none">
                    {proj.title.slice(0, 2)}
                  </span>
                  {proj.preview && (
                    <img
                      src={proj.preview}
                      alt={proj.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="relative w-full h-full object-cover filter grayscale"
                    />
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wide text-neutral-900">{proj.title}</span>
                  <span className="text-[10px] text-neutral-400 font-bold">[{proj.year}]</span>
                </div>
                <p className="text-[10.5px] font-sans text-neutral-600 leading-relaxed mt-1.5 line-clamp-2 min-h-[2.5rem]">
                  {proj.description}
                </p>
                <div className="flex gap-1 flex-wrap mt-2 pt-2 border-t border-neutral-200">
                  {proj.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[8.5px] font-bold px-1.5 py-0.5 bg-neutral-100 uppercase rounded text-neutral-500">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            );
            const cardClass =
              "flex-shrink-0 w-80 bg-white border-2 border-neutral-950 p-4 hover:shadow-[6px_6px_0px_#1c1c1a] transition-all duration-300 font-mono";
            return proj.link ? (
              <a
                key={`${proj.title}-${i}`}
                href={proj.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {Card}
              </a>
            ) : (
              <div key={`${proj.title}-${i}`} className={cardClass}>
                {Card}
              </div>
            );
          })}
        </div>
      </div>

      {/* SWISS FOOTER STAGE */}
      <div className="mt-6 border-t border-neutral-950/20 pt-3 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-neutral-500 z-20">
        <span>SWISS LAYOUT GRID VER 4.88 • DECCAN COORD SETS</span>
        <span className="mt-1 md:mt-0 uppercase">Click any title or panel to open the project</span>
      </div>

    </div>
  );
}
