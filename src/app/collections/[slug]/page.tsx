/**
 * One page per collection, all generated at build time. The static export
 * can't render a slug it didn't generate, hence `dynamicParams = false`.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "../_collections/components/collection-view";
import { collections, getCollection } from "../_collections/collections";

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
  return <CollectionView html={collection.html} />;
}
