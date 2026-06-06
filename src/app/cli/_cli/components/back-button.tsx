/**
 * Navigation control for the CLI mode. Links back to the main site home page.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex items-center gap-1.5 rounded border border-zinc-700 px-2.5 py-1 font-mono text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-100"
      style={{ fontFamily: "var(--font-roboto-mono), ui-monospace, monospace" }}
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>cd ~/</span>
    </Link>
  );
}
