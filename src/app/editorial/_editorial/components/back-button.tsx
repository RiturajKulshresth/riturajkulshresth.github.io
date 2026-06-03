import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex items-center gap-2 border-2 border-neutral-900 bg-[#f5f5f0] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Index</span>
    </Link>
  );
}
