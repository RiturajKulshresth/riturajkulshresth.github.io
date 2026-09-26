/**
 * §07 - TRIM.
 *
 * One 88px ruled band, three ranged groups on a single baseline. No columns of
 * link lists, no headings, no repeated blocks. It is static in every condition,
 * every theme and every viewport: the document stops moving before it ends.
 *
 * The control strip is built from the six ACTUAL palette tokens, so the one
 * artefact that claims to declare the page's palette declares the real one.
 *
 * The mode index is rendered from `renderModes` and `routes` in `@/lib/data`
 * rather than hardcoded, so it cannot go stale when a mode is added. The
 * current entry is marked with `aria-current` as well as accent ink.
 */
import Link from "next/link";
import { renderModes, routes } from "@/lib/data";
import { EDITION } from "../data";

/** The six tokens the route actually paints with. */
const CONTROL_STRIP = [
  "--clp-ink",
  "--clp-ink-muted",
  "--clp-ink-subtle",
  "--clp-rule-strong",
  "--clp-paper-2",
  "--clp-accent",
];

const THIS_ROUTE = "/colophon";

export default function Trim() {
  const entries = [...renderModes, ...routes];

  return (
    <footer
      id="trim"
      className="clp-trim"
      data-clp-clause="trim"
      data-clp-label="TRIM"
    >
      <h2 className="clp-sr-only">Trim</h2>

      <p className="clp-meta" style={{ margin: 0 }}>
        Rituraj Kulshresth · ED. {EDITION}
      </p>

      <div className="clp-strip">
        <span className="clp-meta">Control strip</span>
        <span className="clp-chips" aria-hidden="true">
          {CONTROL_STRIP.map((token) => (
            <span
              key={token}
              className="clp-chip"
              style={{ background: `var(${token})` }}
            />
          ))}
        </span>
      </div>

      <nav className="clp-modes clp-meta" aria-label="Render modes">
        <span>Render modes</span>
        {entries.map((entry) => (
          <span key={entry.href}>
            <span className="clp-sep" aria-hidden="true">
              {" · "}
            </span>
            {entry.href === THIS_ROUTE ? (
              // The current entry is not a link, so it cannot be a no-op
              // target, and its state is not carried by hue alone.
              <span aria-current="page">{entry.label.toUpperCase()}</span>
            ) : (
              <Link href={entry.href}>{entry.label.toUpperCase()}</Link>
            )}
          </span>
        ))}
      </nav>
    </footer>
  );
}
