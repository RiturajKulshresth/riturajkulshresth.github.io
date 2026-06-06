/**
 * Navigation control for the Munchkin Cat mode. Returns to the main site home page.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-[#241710] px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300 transition hover:border-amber-400 hover:text-amber-100"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Exit</span>
    </Link>
  );
}
