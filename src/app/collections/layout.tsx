/**
 * Shell for the collections routes: header, collection list and reading pane.
 *
 * The collections are public but unlisted. They are deliberately absent from
 * `src/app/sitemap.ts`, and the noindex below covers every collections page,
 * so the routes are not advertised to crawlers.
 */
import type { Metadata } from "next";
import { Archive } from "lucide-react";
import BackButton from "./_collections/components/back-button";
import CollectionNav from "./_collections/components/collection-nav";
import ThemeSwitch from "./_collections/components/theme-switch";
import { collections } from "./_collections/collections";
import "./_collections/collections.css";

export const metadata: Metadata = {
  // Repeats the root layout's template, which a title set here would
  // otherwise cut off from the collection pages.
  title: { default: "Collections", template: "Rituraj Kulshresth · %s" },
  description: "Things I collect.",
  robots: { index: false, follow: false, nocache: true },
};

// A fixed locale and zone, so the date rendered at build time is the same one
// the browser renders when it hydrates.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMAT.format(parsed);
}

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  const links = collections.map(({ slug, title, date }) => ({ slug, title, date: formatDate(date) }));

  // Top padding clears the fixed back button.
  return (
    <div className="collections-root">
      <BackButton />
      <ThemeSwitch />
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-24">
        <div className="mb-8 border-b border-[color:var(--color-border)] pb-5">
          <h1 className="flex items-center gap-2 text-lg font-medium tracking-tight text-[color:var(--color-fg)]">
            <Archive className="h-4 w-4 text-[color:var(--color-accent-strong)]" />
            Collections
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
          <CollectionNav collections={links} />
          <main id="main" className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
