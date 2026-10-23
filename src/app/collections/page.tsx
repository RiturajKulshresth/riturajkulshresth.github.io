/**
 * The collections front page. It opens on the first collection, so a bare
 * /collections link lands on something to read; that collection also has its
 * own page under [slug].
 */
import CollectionView from "./_collections/components/collection-view";
import { collections } from "./_collections/collections";

export default function CollectionsPage() {
  const first = collections[0];
  if (!first) {
    return <p className="text-sm text-[color:var(--color-fg-subtle)]">Nothing here yet.</p>;
  }
  return <CollectionView html={first.html} />;
}
