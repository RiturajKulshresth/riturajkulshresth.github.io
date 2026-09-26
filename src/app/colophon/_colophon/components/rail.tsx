/**
 * §00's persistent chrome: the clause rail.
 *
 * A fixed left-edge instrument panel carrying three things top to bottom - the
 * running head naming the live clause, the §00-§07 clause index, and the
 * register readout. `PressEngine` updates all three imperatively by data
 * attribute, so scrolling never re-renders this tree.
 *
 * The current clause is marked three ways at once: `aria-current`, a `▸` glyph,
 * and accent ink. No state anywhere in this route is signalled by hue alone.
 */
import { clauses } from "../data";

export default function Rail() {
  return (
    <nav className="clp-rail" aria-label="Document clauses">
      {/* Seeded with the first clause so the rail is correct before hydration. */}
      <span className="clp-runhead clp-meta" data-clp-runhead>
        {clauses[0].label}
      </span>

      <ol className="clp-rail-list">
        {clauses.map((clause, i) => (
          <li key={clause.id}>
            <a
              href={`#${clause.id}`}
              className="clp-rail-item clp-meta"
              data-clp-rail-item={clause.id}
              aria-current={i === 0 ? "location" : undefined}
            >
              <span className="clp-rail-mark" aria-hidden="true">
                ▸
              </span>
              {clause.key}
              {/* The rail reads as "00" visually; assistive tech gets the name. */}
              <span className="clp-sr-only">{` ${clause.label}`}</span>
            </a>
          </li>
        ))}
      </ol>

      {/* The one number in the document that measures something, because it
          measures itself: the live offset of the register ghost, in px.
          aria-hidden because it reports a purely decorative value and a
          live-updating figure would be noise in a screen reader. */}
      <div className="clp-readout" aria-hidden="true">
        <span>REG</span>
        <span data-clp-readout-x>0.0</span>
        <span data-clp-readout-y>0.0</span>
        <span>PX</span>
      </div>
    </nav>
  );
}
