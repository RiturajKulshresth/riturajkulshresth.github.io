"use client";

import dynamic from "next/dynamic";

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
  return <TerminalApp />;
}
