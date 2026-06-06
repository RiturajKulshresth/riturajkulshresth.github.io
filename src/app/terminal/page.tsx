"use client";

import dynamic from "next/dynamic";

/**
 * /terminal route entry. Mounts the AEGIS shell client-only via next/dynamic
 * with ssr: false so WebGL, canvas, and Web Audio never run during static export
 * prerender. This page is the sole client boundary for the terminal subtree.
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
