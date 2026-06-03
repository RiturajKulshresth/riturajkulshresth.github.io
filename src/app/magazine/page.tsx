"use client";

import dynamic from "next/dynamic";

/**
 * The magazine spread is an interactive, animated client view (3D page flips,
 * pointer-driven turns). The site is a static export, so we mount it
 * client-only via `ssr: false`. This is the single client boundary for the
 * magazine tree, so the component itself needs no `"use client"` of its own.
 */
const Magazine = dynamic(() => import("./_magazine/components/magazine"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#f3efe6] font-serif text-sm tracking-widest text-[#2c2a29]">
      Opening the monograph...
    </div>
  ),
});

export default function MagazinePage() {
  return <Magazine />;
}
