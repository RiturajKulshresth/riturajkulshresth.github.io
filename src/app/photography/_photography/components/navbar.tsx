"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Monitor,
  Newspaper,
  BookOpen,
  Camera,
  Gamepad2,
  Terminal as TerminalIcon,
  Eye,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { navItems, RESUME_PATH, routes, renderModes } from "@/lib/data";
import ThemeToggle from "./theme-toggle";
import { MenuBars, XClose } from "./icons";

/**
 * All class strings below reference CSS variables defined under
 * `header { ... }` in globals.css. On the /photography route the header
 * gets `data-nav-overlay="true"`, which overrides those variables for the
 * header subtree only - one declarative swap instead of a JS-side ternary
 * forking every class string. Define-once-use-everywhere.
 */
const HEADER_SURFACE =
  "border-[color:var(--color-border)] bg-[color:var(--color-nav-bg)] backdrop-blur-xl";
const HEADER_TRANSPARENT = "border-transparent bg-transparent";
const BRAND = "text-[color:var(--color-fg)]";
const NAV_LINK =
  "text-[color:var(--color-nav-link-muted)] hover:text-[color:var(--color-fg)]";
const NAV_LINK_ACTIVE = "text-[color:var(--color-fg)]";
const NAV_UNDERLINE =
  "absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[color:var(--color-nav-underline)] to-transparent";
const BUTTON_GHOST =
  "border-[color:var(--color-border)] text-[color:var(--color-nav-ghost-text)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]";
const BUTTON_PRIMARY =
  "bg-[color:var(--color-fg)] text-[color:var(--color-bg)] hover:bg-[color:var(--color-nav-primary-bg-hover)]";
const MOBILE_SURFACE =
  "border-[color:var(--color-border)] bg-[color:var(--color-nav-mobile-bg)] backdrop-blur-xl";
const MOBILE_ITEM =
  "text-[color:var(--color-nav-mobile-link)] hover:bg-[color:var(--color-surface-hover)] hover:text-[color:var(--color-fg)]";
// Note: the original default-mode mobileToggle had no hover state while the
// overlay variant did; the unified rule below adds the same hover to both,
// which matches the ghost button's interaction model (consistent affordance).
const MOBILE_TOGGLE =
  "border-[color:var(--color-border)] text-[color:var(--color-nav-mobile-toggle)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]";

// Icon + bespoke themed effect class per portal route. The effect classes
// live in globals.css and mirror the Terminal (.nav-glitch) and Photography
// (.nav-photo) treatments. `Eye` is the fallback icon.
const routeIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/windows95": Monitor,
  "/cli": TerminalIcon,
  "/editorial": Newspaper,
  "/magazine": BookOpen,
  "/munchkincat": Gamepad2,
  "/photography": Camera,
  "/terminal": TerminalIcon,
};

const navEffect: Record<string, string> = {
  "/editorial": "nav-editorial",
  "/photography": "nav-photo",
  "/terminal": "nav-glitch",
  "/windows95": "nav-win95",
  "/cli": "nav-cli",
  "/magazine": "nav-magazine",
  "/munchkincat": "nav-arcade",
};

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  // Non-home routes need the navbar's solid surface even at scrollY=0 so
  // text stays legible over media/imagery beneath it.
  const needsBackdrop = !isHome;
  // Overlay routes (currently just /photography) get the fixed dark-glass
  // styling via the data-nav-overlay attribute on <header> below.
  const isOverlay = pathname?.startsWith("/photography") ?? false;

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("#top");
  const [modesOpen, setModesOpen] = useState(false);
  const modesRef = useRef<HTMLLIElement>(null);

  // Close the desktop "Render Modes" dropdown on outside click.
  useEffect(() => {
    if (!modesOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (modesRef.current && !modesRef.current.contains(e.target as Node)) {
        setModesOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [modesOpen]);

  // Close both menus whenever the route changes.
  useEffect(() => {
    setModesOpen(false);
    setOpen(false);
  }, [pathname]);

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
  const isRenderModeActive = renderModes.some(
    (m) => m.href !== "/" && m.href === pathname
  );

  return (
    <header
      data-nav-overlay={isOverlay ? "true" : undefined}
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled || needsBackdrop ? HEADER_SURFACE : HEADER_TRANSPARENT
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={brandHref}
          className={clsx(
            "group flex items-center gap-2.5 text-sm font-medium tracking-tight",
            BRAND
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
                      isActive ? NAV_LINK_ACTIVE : NAV_LINK
                    )}
                  >
                    {item.label}
                    {isActive && <span className={NAV_UNDERLINE} />}
                  </a>
                </li>
              );
            })}
            {routes.map((route) => {
              const isActive = pathname === route.href;
              const effect = navEffect[route.href];
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    data-text={effect === "nav-glitch" ? route.label : undefined}
                    className={clsx(
                      "relative rounded-md px-3 py-1.5 text-sm transition",
                      effect,
                      isActive ? NAV_LINK_ACTIVE : NAV_LINK
                    )}
                  >
                    {route.label}
                    {isActive && <span className={NAV_UNDERLINE} />}
                  </Link>
                </li>
              );
            })}
            <li ref={modesRef} className="relative">
              <button
                type="button"
                onClick={() => setModesOpen((v) => !v)}
                aria-expanded={modesOpen}
                aria-haspopup="menu"
                className={clsx(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition",
                  modesOpen || isRenderModeActive ? NAV_LINK_ACTIVE : NAV_LINK
                )}
              >
                <span>Render Modes</span>
                <ChevronDown
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    modesOpen && "rotate-180"
                  )}
                />
              </button>
              {modesOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-nav-bg)] p-1.5 shadow-card backdrop-blur-xl"
                >
                  {renderModes.map((mode) => {
                    const isActive = pathname === mode.href;
                    const Icon = routeIcons[mode.href] || Eye;
                    const effect = navEffect[mode.href];
                    return (
                      <Link
                        key={mode.href}
                        href={mode.href}
                        role="menuitem"
                        onClick={() => setModesOpen(false)}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                          isActive
                            ? "bg-[color:var(--color-surface-hover)] text-[color:var(--color-fg)] font-semibold"
                            : MOBILE_ITEM
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span
                          className={effect}
                          data-text={
                            effect === "nav-glitch" ? mode.label : undefined
                          }
                        >
                          {mode.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          </ul>
          <div className="ml-3 flex items-center gap-2">
            <ThemeToggle variant={isOverlay ? "overlay" : "default"} />
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "rounded-md border px-3 py-1.5 text-sm transition",
                BUTTON_GHOST
              )}
            >
              Résumé
            </a>
            <a
              href={sectionHref("#contact")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                BUTTON_PRIMARY
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
              MOBILE_TOGGLE
            )}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <XClose className="h-4 w-4" />
            ) : (
              <MenuBars className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className={clsx("border-t px-6 py-5 md:hidden", MOBILE_SURFACE)}>
          <ul className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={sectionHref(item.href)}
                  onClick={() => setOpen(false)}
                  className={clsx("block rounded-md px-3 py-2 transition", MOBILE_ITEM)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {routes.map((route) => {
              const isActive = pathname === route.href;
              const Icon = routeIcons[route.href] || Eye;
              const effect = navEffect[route.href];
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                      isActive
                        ? "bg-[color:var(--color-surface-hover)] text-[color:var(--color-fg)] font-semibold"
                        : MOBILE_ITEM
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span
                      className={effect}
                      data-text={effect === "nav-glitch" ? route.label : undefined}
                    >
                      {route.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-[color:var(--color-border)] pt-2 font-sans">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-[color:var(--color-fg-subtle)] uppercase">
                Render Modes
              </div>
              <ul className="mt-1 flex flex-col gap-0.5 pl-2">
                {renderModes.map((mode) => {
                  const isActive = pathname === mode.href;
                  const Icon = routeIcons[mode.href] || Eye;
                  const effect = navEffect[mode.href];
                  return (
                    <li key={mode.href}>
                      <Link
                        href={mode.href}
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                          isActive
                            ? "bg-[color:var(--color-surface-hover)] text-[color:var(--color-fg)] font-semibold"
                            : MOBILE_ITEM
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span
                          className={effect}
                          data-text={
                            effect === "nav-glitch" ? mode.label : undefined
                          }
                        >
                          {mode.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "rounded-md border px-3 py-2 text-center text-sm transition",
                BUTTON_GHOST
              )}
            >
              Résumé
            </a>
            <a
              href={sectionHref("#contact")}
              onClick={() => setOpen(false)}
              className={clsx(
                "rounded-md px-3 py-2 text-center text-sm font-medium transition",
                BUTTON_PRIMARY
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
