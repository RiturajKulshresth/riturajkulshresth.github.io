/**
 * Per-route layout for /cli. Sets SEO metadata and loads Roboto + Roboto Mono
 * as CSS variables for the terminal UI.
 */
import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CLI",
  description:
    "A command-line rendering of Rituraj Kulshresth's portfolio: type commands to explore the work. An alternate visual of riturajkulshresth.github.io.",
};

export default function CliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${roboto.variable} ${robotoMono.variable}`}>{children}</div>
  );
}
