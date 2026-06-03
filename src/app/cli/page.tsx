"use client";

import dynamic from "next/dynamic";

/**
 * The CLI is fully browser-driven (keyboard input, optional canvas rain). The
 * site is a static export, so we mount it client-only via `ssr: false`: the
 * module never runs during prerender. This is the single client boundary for
 * the cli tree, so the component itself needs no `"use client"` of its own.
 */
const Cli = dynamic(() => import("./_cli/components/cli"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1c] font-mono text-sm tracking-widest text-zinc-400">
      booting cli...
    </div>
  ),
});

export default function CliPage() {
  return <Cli />;
}
