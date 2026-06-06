"use client";

/**
 * Windows 95 render mode entry. Dynamically imports the desktop with `ssr: false`
 * because window drag/resize, boot animation, and Minesweeper need browser APIs.
 */
import dynamic from "next/dynamic";
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
