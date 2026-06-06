"use client";

/**
 * CLI render mode entry. Dynamically imports the shell with `ssr: false` because
 * the static export cannot prerender keyboard input or the Matrix canvas.
 */
import dynamic from "next/dynamic";
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
