/**
 * The list of collections beside a collection's page. Every collection is its
 * own static page, so these are plain links, and the page says which is
 * current.
 */
import Link from "next/link";
import clsx from "clsx";

export type CollectionLink = {
  slug: string;
  title: string;
  /** Already formatted for display, or empty. */
  date: string;
};

export default function CollectionNav({
  collections,
  current,
}: {
  collections: CollectionLink[];
  current: string;
}) {
  return (
    <nav aria-label="Collections">
      <ul className="flex flex-col gap-0.5">
        {collections.map((collection) => (
          <li key={collection.slug}>
            <Link
              href={`/collections/${collection.slug}/`}
              aria-current={collection.slug === current ? "page" : undefined}
              className={clsx(
                "block w-full rounded-md px-3 py-2 text-left text-sm transition",
                collection.slug === current
                  ? "bg-[color:var(--color-surface-hover)] font-medium text-[color:var(--color-fg)]"
                  : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-hover)] hover:text-[color:var(--color-fg)]"
              )}
            >
              <span className="block truncate">{collection.title}</span>
              {collection.date && (
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)]">
                  {collection.date}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
