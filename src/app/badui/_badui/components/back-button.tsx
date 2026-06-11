/**
 * Navigation control for the Bad UI mode. Despite the surrounding hostility,
 * this is the one honest, reliable element: a plain link straight back home,
 * so no visitor can ever get trapped in the cursed mode.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex items-center gap-1.5 border-2 border-black bg-lime-300 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:bg-lime-200"
      style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Escape</span>
    </Link>
  );
}
