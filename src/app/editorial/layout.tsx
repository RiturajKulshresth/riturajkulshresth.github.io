import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial",
  description:
    "A Swiss editorial print-grid rendering of Rituraj Kulshresth's portfolio. An alternate visual of riturajkulshresth.github.io.",
};

export default function EditorialLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="min-h-screen bg-[#e9e9e3] px-3 py-6 sm:px-6">
      {children}
    </main>
  );
}
