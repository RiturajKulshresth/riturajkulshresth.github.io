/**
 * Per-route layout for /magazine. Sets SEO metadata; the magazine component
 * owns its own full-screen chrome.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magazine",
  description:
    "An editorial magazine spread of Rituraj Kulshresth's portfolio, rendered as a page-turning monograph. An alternate visual of riturajkulshresth.github.io.",
};

export default function MagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
