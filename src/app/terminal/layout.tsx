import type { Metadata } from "next";
import "./terminal.css";

export const metadata: Metadata = {
  title: "Terminal",
  description:
    "A cyber-terminal HUD rendering of Rituraj Kulshresth's portfolio: WebGL shaders, procedural audio, and live telemetry. An alternate visual of the riturajkulshresth.github.io site.",
};

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="terminal-root scroller-cyan">{children}</div>;
}
