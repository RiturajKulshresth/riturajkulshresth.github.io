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
};

/** In display order. /collections opens on the first. */
export const collections: Collection[] = data.collections;

export function getCollection(slug: string): Collection | undefined {
  return collections.find((collection) => collection.slug === slug);
}
