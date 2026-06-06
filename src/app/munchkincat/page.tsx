"use client";

/**
 * Munchkin Cat render mode entry. Dynamically imports the canvas platformer with
 * `ssr: false` because the game loop, Web Audio, and touch pad need the browser.
 */
import dynamic from "next/dynamic";
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
