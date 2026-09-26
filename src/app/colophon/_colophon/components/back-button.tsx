/**
 * Navigation control for the Colophon mode. Returns to the main site home page.
 * Set in the route's own mono voice with a square border and no radius, like
 * every other frame in the document.
 */
import Link from "next/link";

export default function BackButton() {
  return (
    <Link href="/" aria-label="Back to home" className="clp-back clp-meta">
      <span aria-hidden="true">←</span>
      <span>Back to site</span>
    </Link>
  );
}
