/**
 * Navigation control for the vault. Returns to the main site home page.
 * Mirrors the back-button pattern the other standalone routes use instead of
 * mounting the full site navbar.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to main page"
      className="group fixed left-4 top-4 z-30 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] backdrop-blur-md transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)] md:left-8 md:top-6"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Back</span>
    </Link>
  );
}
