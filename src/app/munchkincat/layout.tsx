import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Munchkin Cat",
  description:
    "A playable side-scrolling game rendering of Rituraj Kulshresth's portfolio: jetpack through stations to explore the work. An alternate visual of riturajkulshresth.github.io.",
};

export default function MunchkinCatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
