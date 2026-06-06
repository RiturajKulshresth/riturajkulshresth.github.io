/**
 * Per-route layout for /windows95. Sets SEO metadata; the desktop component
 * fills the viewport on its own.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Windows 95",
  description:
    "A Windows 95 desktop rendering of Rituraj Kulshresth's portfolio: draggable windows, a working Start menu, and Minesweeper. An alternate visual of riturajkulshresth.github.io.",
};

export default function Windows95Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
