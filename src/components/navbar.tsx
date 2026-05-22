"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navItems, RESUME_PATH, routes } from "@/lib/data";
import ThemeToggle from "./theme-toggle";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  // Routes where the navbar overlays media/imagery and needs to always show a
  // backdrop for legibility (otherwise text disappears against bright pixels).
  const needsBackdrop = !isHome;
  // Overlay routes: the page is a full-bleed dark media surface (the photo
  // gallery), so the navbar must use fixed dark-glass styling regardless of
  // the user's light/dark preference - otherwise a light navbar sits over a
  // dark gallery and looks broken.
  const isOverlay = pathname?.startsWith("/photography") ?? false;

  const tones = isOverlay
    ? {
        header:
          "border-white/10 bg-black/45 backdrop-blur-xl supports-[backdrop-filter]:bg-black/35",
        headerTransparent: "border-transparent bg-transparent",
        brand: "text-white",
        navMuted: "text-white/55 hover:text-white",
        navActive: "text-white",
        navUnderline: "via-white/85",
        buttonGhost:
          "border-white/15 text-white/75 hover:border-white/40 hover:text-white",
        buttonPrimary: "bg-white text-black hover:bg-white/85",
        mobileBg: "border-white/10 bg-black/80 backdrop-blur-xl",
        mobileItem: "text-white/65 hover:bg-white/10 hover:text-white",
        mobileToggle:
          "border-white/15 text-white/70 hover:border-white/40 hover:text-white",
      }
    : {
        header:
          "border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] backdrop-blur-xl",
        headerTransparent: "border-transparent bg-transparent",
        brand: "text-[color:var(--color-fg)]",
        navMuted:
          "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
        navActive: "text-[color:var(--color-fg)]",
        navUnderline: "via-[color:var(--color-accent-strong)]",
        buttonGhost:
          "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]",
        buttonPrimary:
          "bg-[color:var(--color-fg)] text-[color:var(--color-bg)] hover:bg-[color:var(--color-fg-muted)]",
        mobileBg:
          "border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] backdrop-blur-xl",
        mobileItem:
          "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-hover)] hover:text-[color:var(--color-fg)]",
        mobileToggle:
          "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]",
      };

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("#top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only run the section observer when we're on the home page.
  useEffect(() => {
    if (!isHome) return;
    const sections = navItems
      .map((i) => document.querySelector(i.href))
      .filter((el): el is Element => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(`#${visible[0].target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome]);

  // Section anchors need a leading slash when not on the home page so they
  // navigate back to /#section instead of being interpreted as relative.
  const sectionHref = (anchor: string) => (isHome ? anchor : `/${anchor}`);
  const brandHref = isHome ? "#top" : "/";

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled || needsBackdrop ? tones.header : tones.headerTransparent
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={brandHref}
          className={clsx(
            "group flex items-center gap-2.5 text-sm font-medium tracking-tight",
            tones.brand
          )}
        >
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-success)] pulse-dot" />
          <span>Rituraj Kulshresth</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <ul className="flex items-center gap-1 text-sm">
            {navItems.map((item) => {
              const isActive = isHome && activeSection === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={sectionHref(item.href)}
                    className={clsx(
                      "relative rounded-md px-3 py-1.5 transition",
                      isActive ? tones.navActive : tones.navMuted
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className={clsx(
                          "absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent to-transparent",
                          tones.navUnderline
                        )}
                      />
                    )}
                  </a>
                </li>
              );
            })}
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className={clsx(
                      "relative rounded-md px-3 py-1.5 text-sm transition",
                      isActive ? tones.navActive : tones.navMuted
                    )}
                  >
                    {route.label}
                    {isActive && (
                      <span
                        className={clsx(
                          "absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent to-transparent",
                          tones.navUnderline
                        )}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="ml-3 flex items-center gap-2">
            <ThemeToggle variant={isOverlay ? "overlay" : "default"} />
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "rounded-md border px-3 py-1.5 text-sm transition",
                tones.buttonGhost
              )}
            >
              Résumé
            </a>
            <a
              href={sectionHref("#contact")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                tones.buttonPrimary
              )}
            >
              Get in touch
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle variant={isOverlay ? "overlay" : "default"} />
          <button
            type="button"
            className={clsx(
              "inline-flex items-center justify-center rounded-md border p-2 transition",
              tones.mobileToggle
            )}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 7h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          className={clsx(
            "border-t px-6 py-5 md:hidden",
            tones.mobileBg
          )}
        >
          <ul className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={sectionHref(item.href)}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block rounded-md px-3 py-2 transition",
                    tones.mobileItem
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block rounded-md px-3 py-2 transition",
                    tones.mobileItem
                  )}
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "rounded-md border px-3 py-2 text-center text-sm transition",
                tones.buttonGhost
              )}
            >
              Résumé
            </a>
            <a
              href={sectionHref("#contact")}
              onClick={() => setOpen(false)}
              className={clsx(
                "rounded-md px-3 py-2 text-center text-sm font-medium transition",
                tones.buttonPrimary
              )}
            >
              Get in touch
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
