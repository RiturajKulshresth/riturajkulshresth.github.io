"use client";

/**
 * Light/dark theme switch. Writes `data-theme` on `<html>` (read by
 * globals.css) and persists the choice in localStorage when available.
 */
import { useEffect, useState } from "react";
import clsx from "clsx";

type Theme = "light" | "dark";

function readInitial(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.dataset.theme;
  return attr === "light" ? "light" : "dark";
}

export default function ThemeToggle({
  className,
  variant = "default",
}: {
  className?: string;
  /**
   * `default` - uses CSS-variable theme tokens.
   * `overlay` - fixed dark-glass styling, for when the toggle sits on top of
   * media (e.g. the photography gallery) regardless of the user's theme.
   */
  variant?: "default" | "overlay";
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sync from the value set by the init script in <head>.
  useEffect(() => {
    setTheme(readInitial());
    setMounted(true);
  }, []);

  // Watch system preference, but only follow it when the user hasn't
  // made an explicit choice (no localStorage entry).
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("theme") !== null) return;
      const next: Theme = e.matches ? "light" : "dark";
      apply(next);
      setTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function apply(next: Theme) {
    // `data-theme` drives CSS variables; `colorScheme` hints native UI (scrollbars).
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage may be unavailable (private mode, etc.) */
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      onClick={toggle}
      className={clsx(
        "group relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition",
        variant === "overlay"
          ? "border-white/15 bg-white/[0.04] text-white/70 backdrop-blur-md hover:border-white/40 hover:text-white"
          : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]",
        // Avoid hydration-mismatch flicker before the client reads the actual theme.
        !mounted && "opacity-0",
        className
      )}
    >
      {/* Sun (shown in light theme) */}
      <svg
        className={clsx(
          "absolute h-4 w-4 transition-all duration-300",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>

      {/* Moon (shown in dark theme) */}
      <svg
        className={clsx(
          "absolute h-4 w-4 transition-all duration-300",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
