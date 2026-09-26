/**
 * §00 - MASTHEAD.
 *
 * One flush-left type block, one ruled table, and a void in columns 8-12.
 * There is no hero container and no second column, which is the whole point:
 * the forbidden status pill, gradient tagline and editor-window mockup have no
 * structural place to exist here.
 *
 * The h1 is the document's LCP element and never animates opacity or transform
 * - partly because a printed sheet is already printed when you arrive, and
 * partly because an animated ancestor would form an isolation group and break
 * the register ghost's blend.
 */
import { profile, experience } from "@/lib/data";
import { COORDINATES, EDITION, counts } from "../data";

/**
 * The manifest. Every value is read from `@/lib/data` rather than retyped, so
 * the masthead cannot disagree with the rest of the document. STATUS is a
 * ruled table row in 11px mono - not a pill, and there is no dot of any kind.
 */
const manifest: { key: string; value: string }[] = [
  { key: "ROLE", value: profile.role.replace(" · ", ", ").toUpperCase() },
  { key: "ORG", value: experience[0].company.toUpperCase() },
  { key: "LOC", value: COORDINATES },
  { key: "STATUS", value: profile.status.toUpperCase() },
  { key: "CORR", value: `${profile.email}, ${profile.phone}` },
];

export default function Masthead() {
  const sheetLine = [
    `ED. ${EDITION}`,
    `${counts.plates} PLATES`,
    `${counts.posts} POSTS`,
    `${counts.citations} CITATIONS`,
    `${counts.items} ITEMS`,
    "SET IN INSTRUMENT SERIF & GEIST",
  ].join(" · ");

  return (
    <section
      id="masthead"
      className="clp-masthead clp-grid"
      data-clp-clause="masthead"
      data-clp-label="MASTHEAD"
    >
      {/* THE GHOST'S BLEND PARENT. See colophon.css - this element paints the
          paper the ghost multiplies against, and isolates the blend. */}
      <div className="clp-c-full clp-masthead-wrap">
        <h1 className="clp-name">
          {/* The break is hardcoded as two block spans. Leaving it to
              `text-wrap: balance` would let the Instrument Serif swap re-break
              the largest element on the page and pay a large CLS. */}
          <span className="clp-nline">Rituraj</span>
          <span className="clp-nline clp-nline-2">Kulshresth</span>
        </h1>
        {/* The second plate, printed slightly out of register. One node for
            both lines, so the route holds to exactly three ghosts. */}
        <span className="clp-nghost" aria-hidden="true" data-clp-ghost>
          <span className="clp-nline">Rituraj</span>
          <span className="clp-nline clp-nline-2">Kulshresth</span>
        </span>
      </div>

      {/* Revealed as a group: the five rows are one ruled table, so they ink
          together on their stagger rather than each waiting for its own
          intersection. */}
      <dl className="clp-c-1-7 clp-manifest clp-meta" data-clp-reveal-group>
        {manifest.map((row, i) => (
          <div
            className="clp-mrow clp-reveal"
            key={row.key}
            style={{ "--clp-i": i } as React.CSSProperties}
          >
            <dt className="clp-mkey">
              <span className="clp-mlabel">{row.key}</span>
              <span className="clp-leader" aria-hidden="true" />
            </dt>
            <dd className="clp-mval">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="clp-c-full clp-sheetline clp-meta">{sheetLine}</p>
    </section>
  );
}
