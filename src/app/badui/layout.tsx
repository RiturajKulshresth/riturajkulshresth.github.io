/**
 * Per-route layout for /badui. Sets SEO metadata; the cursed page owns its own
 * full-screen chrome.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bad UI",
  description:
    "A deliberately cursed, dark-pattern rendering of Rituraj Kulshresth's portfolio: cookie walls, impossible captchas, running buttons, and Comic Sans, in homage to r/badUIbattles. An alternate visual of riturajkulshresth.github.io.",
};

export default function BadUILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
