"use client";

/**
 * Bad UI render mode entry. Dynamically imported with `ssr: false` because the
 * cursed experience relies on browser APIs (timers, pointer tracking, the
 * cursor comet, and `prefers-reduced-motion` detection).
 */
import dynamic from "next/dynamic";
const BadUI = dynamic(() => import("./_badui/components/badui"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#008080] font-mono text-sm tracking-widest text-yellow-300">
      summoning bad decisions...
    </div>
  ),
});

export default function BadUIPage() {
  return <BadUI />;
}
