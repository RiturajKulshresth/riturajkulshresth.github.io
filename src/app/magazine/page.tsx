"use client";

/**
 * Magazine render mode entry. Dynamically imports the page-flip book with
 * `ssr: false` because StPageFlip needs browser layout and pointer events.
 */
import dynamic from "next/dynamic";
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
