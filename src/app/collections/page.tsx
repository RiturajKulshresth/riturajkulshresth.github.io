/**
 * The collections index: a tile per collection, each one link to its page. The
 * tile's photos and chapter counts are pre-rendered by the build script.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { collections, formatDate } from "./_collections/collections";

export default function CollectionsPage() {
  if (collections.length === 0) {
    return (
      <main id="main">
        <p className="text-sm text-[color:var(--color-fg-subtle)]">Nothing here yet.</p>
      </main>
    );
  }

  return (
    <main id="main">
      <ul className="grid gap-5 sm:grid-cols-2">
        {collections.map(({ slug, title, date, preview }) => (
          <li key={slug}>
            <Link
              href={`/collections/${slug}/`}
              className="collection-tile group flex h-full flex-col gap-5 rounded-[0.875rem] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-medium tracking-tight text-[color:var(--color-fg)]">
                    {title}
                  </h2>
                  {date && (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)]">
                      {formatDate(date)}
                    </p>
                  )}
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-fg-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]" />
              </div>
              {/* Ours, rendered at build time from the committed markdown. */}
              <div className="collection-preview" dangerouslySetInnerHTML={{ __html: preview }} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
