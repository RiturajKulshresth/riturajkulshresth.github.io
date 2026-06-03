"use client";

import dynamic from "next/dynamic";

/**
 * The desktop is fully browser-driven (drag/resize via window events, live
 * clock, local game state). The site is a static export, so we mount it
 * client-only via `ssr: false`. This is the single client boundary for the
 * windows95 tree, so the component itself needs no `"use client"` of its own.
 */
const Windows95 = dynamic(() => import("./_windows95/components/windows95"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black font-mono text-sm tracking-widest text-[#00ff00]">
      Starting MS-DOS...
    </div>
  ),
});

export default function Windows95Page() {
  return <Windows95 />;
}
