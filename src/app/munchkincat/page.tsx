"use client";

import dynamic from "next/dynamic";

/**
 * The game is entirely browser-driven (canvas render loop, keyboard input,
 * Web Audio). The site is a static export, so we mount it client-only via
 * `ssr: false`: the module never runs during prerender. This is the single
 * client boundary for the munchkincat tree, so the component itself needs no
 * `"use client"` of its own.
 */
const MunchkinCat = dynamic(
  () => import("./_munchkincat/components/munchkin-cat"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#04020a] font-mono text-sm tracking-widest text-cyan-400">
        loading mission...
      </div>
    ),
  }
);

export default function MunchkinCatPage() {
  return <MunchkinCat />;
}
