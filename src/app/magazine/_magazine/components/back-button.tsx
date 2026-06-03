import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex items-center gap-2 rounded-sm border border-[#d6d2c4] bg-[#fbfaf7] px-3 py-1.5 font-serif text-xs tracking-wide text-[#2c2a29] shadow-sm transition hover:border-[#887050] hover:text-[#887050]"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Back to site</span>
    </Link>
  );
}
