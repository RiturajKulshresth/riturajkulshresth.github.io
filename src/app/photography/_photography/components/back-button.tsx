import Link from "next/link";
import { ChevronLeft } from "./icons";

/**
 * Minimal "back to main page" control for the immersive gallery.
 *
 * Mirrors the back-button pattern used by the other render-mode routes
 * (editorial, magazine, cli, ...) instead of mounting the full site navbar.
 * Styling matches the gallery's cinematic glass pills (the counter + caption
 * rails) so it reads as part of the photography surface, not the home chrome.
 * Positioned to align vertically with the frame counter on the opposite side.
 */
export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to main page"
      title="Back to main page"
      className="group fixed left-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.12] hover:text-white sm:px-3.5 sm:py-1.5 md:left-8 md:top-6"
    >
      <ChevronLeft
        className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
        strokeWidth="1.75"
      />
      <span className="hidden sm:inline">Back to main page</span>
    </Link>
  );
}
