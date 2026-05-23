import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import CursorGlow from "@/components/cursor-glow";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const SITE_URL = "https://riturajkulshresth.github.io";
const TITLE = "Rituraj Kulshresth · Software Engineer";
const DESCRIPTION =
  "Software engineer specialising in enterprise AI platforms. Designed and shipped three production agent and RAG platforms at Warner Bros. Discovery used by 11+ internal teams. IIT Jodhpur, B.Tech CSE.";

// Runs synchronously before paint to prevent flash-of-wrong-theme.
// Reads localStorage, falls back to system preference, sets data-theme + color-scheme.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "Rituraj Kulshresth · %s" },
  description: DESCRIPTION,
  applicationName: "Rituraj Kulshresth",
  authors: [{ name: "Rituraj Kulshresth", url: SITE_URL }],
  creator: "Rituraj Kulshresth",
  keywords: [
    "Rituraj Kulshresth",
    "Software Engineer",
    "AI Platforms",
    "AI Agents",
    "RAG",
    "LangGraph",
    "LangChain",
    "AWS Bedrock",
    "Warner Bros. Discovery",
    "IIT Jodhpur",
    "Next.js",
    "TypeScript",
    "Python",
    "FastAPI",
    "Portfolio",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Rituraj Kulshresth",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@BlehRituraj",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#16171a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
      // Opt in to Next 16's smooth-scroll-aware route transitions. Without
      // this, the `scroll-behavior: smooth` on <html> (set in globals.css)
      // causes route changes to animate between scroll positions, which
      // reads as jank; the attribute tells Next to suppress it for the
      // duration of a navigation while keeping it on for in-page anchors.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[color:var(--color-fg)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--color-bg)]"
        >
          Skip to content
        </a>
        <CursorGlow />
        {children}
      </body>
    </html>
  );
}
