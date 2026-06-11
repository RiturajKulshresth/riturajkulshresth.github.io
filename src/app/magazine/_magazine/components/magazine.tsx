/**
 * Magazine render mode. Portfolio sections are bound into a react-pageflip book
 * with responsive sizing, per-page auto-fit scaling, and chapter jumps from the
 * contents page.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { BookOpen, ArrowLeft, ArrowRight, Mail, ExternalLink } from "lucide-react";
import {
  profile,
  experience,
  projects,
  skillGroups,
  accolades,
  socialLinks,
  RESUME_PATH,
} from "@/lib/data";
import BackButton from "./back-button";

const Book = HTMLFlipBook as any;

// Pages are authored at a fixed "design" size and then uniformly transform-
// scaled to the book's live dimensions, so type and spacing grow/shrink with
// the magazine instead of staying at fixed pixel sizes. Design ratio matches
// PAGE_RATIO (w/h = 0.66).
// Larger design canvas = fixed-size type occupies a smaller fraction of the
// page, i.e. a smaller overall font size once scaled to the live book.
const DESIGN_W = 540;
const DESIGN_H = Math.round(DESIGN_W / 0.66);
const ScaleCtx = React.createContext<{ scale: number; w: number; h: number }>({
  scale: 1,
  w: DESIGN_W,
  h: DESIGN_H,
});

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="block font-sans text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#887050]">
    {children}
  </span>
);

// Every leaf of the book is a forwardRef page so StPageFlip can mount it.
const Page = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; hard?: boolean; folio?: string }
>(({ children, hard, folio }, ref) => {
  const { scale, w, h } = React.useContext(ScaleCtx);
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Per-page auto-fit: if the content is taller than the page body, shrink it
  // to fit so a magazine page NEVER shows a scrollbar.
  const [fit, setFit] = useState(1);

  React.useLayoutEffect(() => {
    if (hard) return;
    const measure = () => {
      const wrap = wrapRef.current;
      const content = contentRef.current;
      if (!wrap || !content) return;
      const avail = wrap.clientHeight;
      // Natural (unscaled) content height; transforms don't affect layout box.
      const natural = content.scrollHeight;
      const next =
        natural > avail && natural > 0 ? Math.max(0.45, avail / natural) : 1;
      setFit((prev) => (Math.abs(prev - next) < 0.005 ? prev : next));
    };
    measure();
    // Re-measure once fonts/images have settled.
    const t = setTimeout(measure, 250);
    return () => clearTimeout(t);
  }, [children, hard, w, h]);

  return (
    <div
      ref={ref}
      data-density={hard ? "hard" : "soft"}
      className={
        hard
          ? "h-full w-full overflow-hidden bg-[#2c2a29] text-[#f3efe6]"
          : "h-full w-full overflow-hidden bg-[#fbfaf7] shadow-[inset_0_0_50px_rgba(44,42,41,0.05)]"
      }
    >
      {/* Fixed-design canvas, scaled to fill the live page so all type scales. */}
      <div
        className="flex flex-col"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {hard ? (
          <div className="flex flex-grow flex-col items-center justify-center p-8 text-center">
            {children}
          </div>
        ) : (
          <>
            <div
              ref={wrapRef}
              className="flex-grow select-text overflow-hidden px-7 py-8"
            >
              <div
                ref={contentRef}
                style={{ transform: `scale(${fit})`, transformOrigin: "top center" }}
              >
                {children}
              </div>
            </div>
            {folio && (
              <div className="shrink-0 border-t border-[#e8e4d5] px-7 py-2 text-center font-serif text-[9px] italic tracking-wider text-zinc-400">
                {folio}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
Page.displayName = "Page";

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Single-leaf aspect ratio (page width / page height). Portrait, like a real
// monograph page.
const PAGE_RATIO = 0.66;

export default function Magazine() {
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const pageRef = useRef(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  // Page dimensions are derived from the live stage size rather than hard-coded,
  // so the book is genuinely responsive instead of locked to the prop values
  // StPageFlip captures on mount.
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Measure the stage and compute a page size that fits within BOTH the
  // available width and height. Fitting height too is what stops the spread
  // from overflowing past the footer (the failure mode of plain "stretch").
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      // Leave a little headroom so the book (and its drop shadow) can never
      // reach the masthead / controls edges and appear clipped behind them.
      const availW = el.clientWidth - 16;
      const availH = el.clientHeight - 16;
      if (availW <= 0 || availH <= 0) return;
      let ph = Math.min(availH, 900);
      let pw = ph * PAGE_RATIO;
      // A single page must never be wider than the stage (portrait / mobile).
      // The library only shows a 2-page spread when 2*pw <= availW, so this
      // single-page clamp keeps both orientations inside the stage on every axis.
      if (pw > availW) {
        pw = availW;
        ph = pw / PAGE_RATIO;
      }
      // Snap to 4px steps so tiny scroll-driven changes don't thrash re-inits.
      const w = Math.max(240, Math.round(pw / 4) * 4);
      const h = Math.max(340, Math.round(ph / 4) * 4);
      setDims((d) => (d.w === w && d.h === h ? d : { w, h }));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // After every (re)mount at a new size, read the page count and restore the
  // page the reader was on (jump, no animation).
  useEffect(() => {
    if (!dims.w) return;
    const t = setTimeout(() => {
      try {
        const pf = bookRef.current?.pageFlip?.();
        const count = pf?.getPageCount?.();
        if (count) setTotal(count);
        if (pageRef.current > 0 && pf?.turnToPage) {
          pf.turnToPage(Math.min(pageRef.current, (count ?? 1) - 1));
        }
      } catch {
        /* not mounted yet */
      }
    }, 120);
    return () => clearTimeout(t);
  }, [dims.w, dims.h]);

  const flipTo = (n: number) => bookRef.current?.pageFlip?.()?.flip?.(n);
  const next = () => bookRef.current?.pageFlip?.()?.flipNext?.();
  const prev = () => bookRef.current?.pageFlip?.()?.flipPrev?.();

  // ── Assemble the running order of leaves, tracking chapter start indices so
  // the contents page can jump straight to them. ──
  const worksPages = chunk(projects, 3);
  const idx = { cover: 0, contents: 1, bio: 2, career: 3 };
  const careerPages = 3; // WBD, Deloitte, early roles + study
  const worksStart = idx.career + careerPages;
  const skillsStart = worksStart + worksPages.length;
  const recogStart = skillsStart + 1;

  return (
    <div className="relative flex h-screen min-h-screen w-full select-none flex-col overflow-hidden bg-[#efe9dc] font-sans text-[#2c2a29]">
      <div className="pointer-events-none absolute -left-24 top-12 h-96 w-96 rounded-full bg-[#e2d9c2] blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-[#e8dfc9] blur-[120px]" />

      {/* Masthead */}
      <div className="z-10 flex select-none items-center justify-between gap-4 border-b border-[#dddad0] bg-[#fbfaf7]/85 px-6 pb-4 pt-5 backdrop-blur-sm md:px-14">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="hidden items-center gap-2.5 sm:flex">
            <BookOpen className="h-5 w-5 text-[#887050]" />
            <div>
              <h1 className="font-display text-sm font-black uppercase tracking-[0.18em] text-[#2c2a29]">
                The Portfolio Monograph
              </h1>
              <p className="font-sans text-[9px] tracking-wide text-zinc-500">
                Edition 2026 // {profile.role}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 font-serif text-xs text-zinc-600">
          <span className="whitespace-nowrap">
            Page {page + 1}
            {total ? ` of ${total}` : ""}
          </span>
          <div className="relative hidden h-[2px] w-16 overflow-hidden bg-[#e1ddcf] sm:block md:w-28">
            <div
              className="absolute left-0 top-0 h-full bg-[#887050] transition-all duration-500"
              style={{ width: total ? `${((page + 1) / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Flip book (page size derived from this stage's live dimensions) */}
      <main
        ref={stageRef}
        className="relative z-10 flex flex-grow items-center justify-center overflow-hidden p-3 md:p-5"
      >
        {dims.w > 0 && (
        <ScaleCtx.Provider value={{ scale: dims.w / DESIGN_W, w: DESIGN_W, h: DESIGN_H }}>
        <Book
          key={`${dims.w}x${dims.h}`}
          ref={bookRef}
          className="magazine-book"
          style={{}}
          width={dims.w}
          height={dims.h}
          size="fixed"
          drawShadow
          flippingTime={750}
          usePortrait
          maxShadowOpacity={0.5}
          showCover
          mobileScrollSupport
          useMouseEvents
          showPageCorners
          onFlip={(e: any) => {
            pageRef.current = e.data;
            setPage(e.data);
          }}
        >
          {/* 0 · Front cover */}
          <Page hard>
            <Eyebrow>An Interactive Monograph</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-none tracking-tight md:text-5xl">
              {profile.name}
            </h2>
            <p className="mt-3 font-serif text-sm italic text-[#cbbf9f]">{profile.role}</p>
            <div className="my-7 h-px w-24 bg-[#5a564f]" />
            <p className="max-w-[16rem] font-sans text-[11px] leading-relaxed text-[#d8d2c4]">
              A page-turning edition of the portfolio. Drag a corner or use the
              controls to read.
            </p>
            <p className="mt-8 font-sans text-[9px] uppercase tracking-[0.3em] text-[#a59c88]">
              Edition 2026
            </p>
          </Page>

          {/* 1 · Contents */}
          <Page folio="Contents">
            <Eyebrow>Volume Contents</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-bold text-[#111]">Inside this issue</h3>
            <div className="mt-6 space-y-1 font-serif">
              {[
                { label: "I. Biography", to: idx.bio },
                { label: "II. Career & Highlights", to: idx.career },
                { label: "III. Selected Works", to: worksStart },
                { label: "IV. Disciplines", to: skillsStart },
                { label: "V. Recognition & Contact", to: recogStart },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => flipTo(c.to)}
                  className="flex w-full items-center justify-between border-b border-[#e8e4d5] py-3 text-left text-sm transition hover:text-[#887050]"
                >
                  <span>{c.label}</span>
                  <span className="font-sans text-xs italic text-zinc-400">
                    p. {c.to + 1}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-8 max-w-sm font-sans text-[11px] leading-relaxed text-zinc-400">
              Set in Instrument Serif and Geist. Tap a chapter to turn straight
              to it.
            </p>
          </Page>

          {/* 2 · Biography */}
          <Page folio="I · Biography">
            <Eyebrow>Section I // Biography</Eyebrow>
            <h3 className="mt-3 font-display text-3xl font-bold text-[#111]">The Engineer</h3>
            <p className="mt-5 font-serif text-sm leading-relaxed text-zinc-700">
              <span className="float-left pr-2.5 font-display text-5xl leading-none text-[#887050]">
                {profile.bio.charAt(0)}
              </span>
              {profile.bio.slice(1)}
            </p>
            <div className="mt-6 border-t border-[#e8e4d5] pt-4">
              <span className="block font-sans text-[10px] uppercase tracking-widest text-zinc-400">
                Currently
              </span>
              <p className="font-serif text-sm text-[#2c2a29]">
                {profile.role}, {experience[0].company}
              </p>
            </div>
            <div className="mt-4 font-serif text-xs italic text-zinc-500">{profile.status}.</div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e8e4d5] pt-4 font-sans text-[11px] text-zinc-600">
              <p>
                <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Based in</span>
                {profile.location}
              </p>
              <p>
                <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Email</span>
                {profile.email}
              </p>
            </div>
          </Page>

          {/* 3..5 · Career, one company per page with full highlights */}
          {[experience[0], experience[1], null].map((_, i) => {
            // Page 3: WBD; Page 4: Deloitte; Page 5: Oyo + IIT.
            if (i < 2) {
              const job = experience[i];
              if (!job) return null;
              return (
                <Page key={`career-${i}`} folio={`II · Career (${i + 1})`}>
                  <Eyebrow>Section II // Career</Eyebrow>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold text-[#111]">{job.company}</h3>
                    <span className="shrink-0 font-sans text-[10px] uppercase tracking-wider text-zinc-400">
                      {job.period}
                    </span>
                  </div>
                  <p className="font-sans text-xs font-semibold text-[#887050]">{job.role}</p>
                  <p className="mt-2 font-sans text-[11.5px] leading-relaxed text-zinc-600">
                    {job.summary}
                  </p>
                  <ul className="mt-3 space-y-2 border-t border-[#e8e4d5] pt-3">
                    {job.highlights.map((h, j) => (
                      <li key={j} className="flex gap-2 font-sans text-[11px] leading-relaxed text-zinc-700">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#887050]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </Page>
              );
            }
            const early = experience.slice(2);
            return (
              <Page key="career-early" folio="II · Early & Study">
                <Eyebrow>Section II // Early Roles & Study</Eyebrow>
                <div className="mt-4 space-y-5">
                  {early.map((job) => (
                    <div key={job.company} className="border-b border-[#e8e4d5] pb-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="font-serif text-base font-semibold text-[#111]">{job.company}</h4>
                        <span className="shrink-0 font-sans text-[10px] uppercase tracking-wider text-zinc-400">
                          {job.period}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] font-semibold text-[#887050]">{job.role}</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {job.highlights.map((h, j) => (
                          <li key={j} className="flex gap-2 font-sans text-[10.5px] leading-relaxed text-zinc-700">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#887050]" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Page>
            );
          })}

          {/* Works, 3 projects per page */}
          {worksPages.map((group, gi) => (
            <Page key={`works-${gi}`} folio={`III · Selected Works (${gi + 1})`}>
              <Eyebrow>Section III // Portfolio</Eyebrow>
              <h3 className="mt-3 font-display text-2xl font-bold text-[#111]">
                {gi === 0 ? "Selected Works" : "Selected Works, cont."}
              </h3>
              <div className="mt-5 space-y-5">
                {group.map((p) => (
                  <div key={p.title} className="border-b border-[#e8e4d5] pb-4">
                    <div className="mb-0.5 flex items-baseline justify-between gap-3">
                      <span className="font-serif text-base font-extrabold text-[#111]">{p.title}</span>
                      <span className="shrink-0 font-sans text-[10px] italic text-zinc-400">{p.year}</span>
                    </div>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-[#887050]">
                      {p.subtitle}
                    </p>
                    <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-zinc-600">
                      {p.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="rounded-sm bg-[#f2efe6] px-1.5 py-0.5 font-sans text-[8.5px] font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider text-[#887050] hover:underline"
                      >
                        open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Page>
          ))}

          {/* Disciplines */}
          <Page folio="IV · Disciplines">
            <Eyebrow>Section IV // Disciplines</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-bold text-[#111]">Tools of the Trade</h3>
            <div className="mt-5 space-y-4">
              {skillGroups.map((group) => (
                <div key={group.title}>
                  <span className="block border-b border-[#ddd9cb] pb-1 font-sans text-[11px] font-bold uppercase tracking-wider text-[#887050]">
                    {group.title}
                  </span>
                  <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-zinc-700">
                    {group.items.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Page>

          {/* Recognition & Contact */}
          <Page folio="V · Recognition & Contact">
            <Eyebrow>Recognition</Eyebrow>
            <div className="mt-4 space-y-3">
              {accolades.map((a) => (
                <div key={a.title} className="border-b border-[#e8e4d5] pb-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-sm font-semibold text-[#111]">{a.title}</span>
                    <span className="shrink-0 font-sans text-[10px] italic text-zinc-400">{a.period}</span>
                  </div>
                  <p className="font-sans text-[11px] text-zinc-600">{a.organisation}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-3">
              <Eyebrow>Correspondence</Eyebrow>
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-2 font-serif text-sm text-[#2c2a29] transition hover:text-[#887050]"
              >
                <Mail className="h-4 w-4" /> {profile.email}
              </a>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-sans text-[11px] uppercase tracking-wider text-zinc-500 transition hover:text-[#887050]"
                  >
                    {s.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
              <a
                href={RESUME_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-sm bg-[#887050] px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-[#725e43]"
              >
                Download Resume
              </a>
            </div>
          </Page>

          {/* Back cover */}
          <Page hard>
            <div className="my-6 h-px w-24 bg-[#5a564f]" />
            <p className="font-display text-2xl italic text-[#f3efe6]">Fin.</p>
            <p className="mt-3 max-w-[16rem] font-sans text-[11px] leading-relaxed text-[#d8d2c4]">
              Thank you for reading. The living portfolio continues on the web.
            </p>
            <p className="mt-6 font-sans text-[9px] uppercase tracking-[0.3em] text-[#a59c88]">
              {profile.name}
            </p>
          </Page>
        </Book>
        </ScaleCtx.Provider>
        )}
      </main>

      {/* Page-turn controls */}
      <div className="z-10 flex select-none items-center justify-between border-t border-[#e8e4d5] bg-[#fbfaf7]/85 px-6 py-4 backdrop-blur-sm md:px-14">
        <button
          onClick={prev}
          disabled={page === 0}
          className={`flex items-center gap-2 rounded-md border border-[#dddad0] px-3 py-2 font-sans text-xs font-bold transition ${
            page === 0
              ? "cursor-not-allowed opacity-30"
              : "cursor-pointer bg-[#fbfaf7] hover:bg-[#f3efe6] hover:text-[#887050]"
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        <div className="hidden font-serif text-[10px] tracking-wider text-zinc-400 sm:block">
          Drag a page corner, or use these controls
        </div>

        <button
          onClick={next}
          disabled={total > 0 && page >= total - 1}
          className={`flex items-center gap-2 rounded-md border border-[#dddad0] px-3 py-2 font-sans text-xs font-bold transition ${
            total > 0 && page >= total - 1
              ? "cursor-not-allowed opacity-30"
              : "cursor-pointer bg-[#fbfaf7] hover:bg-[#f3efe6] hover:text-[#887050]"
          }`}
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
