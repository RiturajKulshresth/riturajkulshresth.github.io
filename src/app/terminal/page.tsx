"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

/**
 * The terminal app is entirely browser-driven (WebGL, Canvas 2D, Web Audio,
 * window/document access at module load and render time). The site builds as a
 * static export, so we mount it client-only via `ssr: false`: the module is
 * never imported during prerender, which means none of those browser APIs run
 * on the build server. This is the single client boundary for the whole
 * terminal tree, so the copied source files need no `"use client"` of their own.
 */
const TerminalApp = dynamic(() => import("./_terminal/App"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center font-mono text-sm tracking-widest text-[#00f3ff]">
      INITIALIZING QUANTUM TERMINAL...
    </div>
  ),
});

export default function TerminalPage() {
  return (
    <>
      <Link
        href="/"
        aria-label="Back to the main site"
        className="fixed left-4 top-4 z-[100] rounded border border-[#00f3ff]/30 bg-black/40 px-3 py-1.5 font-mono text-xs tracking-wide text-[#00f3ff] backdrop-blur transition hover:border-[#00f3ff]/70 hover:bg-black/70"
      >
        &larr; back to site
      </Link>
      <TerminalApp />
    </>
  );
}
