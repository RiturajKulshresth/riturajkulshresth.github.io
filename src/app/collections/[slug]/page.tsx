/**
 * One page per collection, all generated at build time: the nav to the other
 * collections beside this one's reading pane. The static export can't render a
 * slug it didn't generate, hence `dynamicParams = false`.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionNav from "../_collections/components/collection-nav";
import CollectionView from "../_collections/components/collection-view";
import { collections, formatDate, getCollection } from "../_collections/collections";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return collections.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: getCollection(slug)?.title };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const links = collections.map((c) => ({ slug: c.slug, title: c.title, date: formatDate(c.date) }));

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
      <CollectionNav collections={links} current={slug} />
      <main id="main" className="min-w-0">
        <CollectionView html={collection.html} />
      </main>
    </div>
  );
}
