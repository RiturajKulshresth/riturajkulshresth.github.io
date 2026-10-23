/**
 * The collections, built from `content/collections/` into `collections.json`
 * by `npm run collections` (scripts/build-collections.mjs), which runs before
 * every dev server and build. Read on the server only: each page hands its one
 * collection to the client, so the HTML of the others never ships with it.
 */
import data from "./collections.json";

export type Collection = {
  slug: string;
  title: string;
  date: string;
  /** Pre-rendered by `marked` at build time, so no parser ships to the client. */
  html: string;
  /** The collection's tile on the index: a few photos and a count per chapter. */
  preview: string;
};

/** In display order. */
export const collections: Collection[] = data.collections;

export function getCollection(slug: string): Collection | undefined {
  return collections.find((collection) => collection.slug === slug);
}

// A fixed locale and zone, so the date rendered at build time is the same one
// the browser renders when it hydrates.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** A frontmatter date for display, or "" when there is none. */
export function formatDate(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMAT.format(parsed);
}
