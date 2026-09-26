/**
 * §05 - CITATIONS.
 *
 * Recognition set as a bibliography, not a trophy shelf - deliberately
 * off-balance and deliberately small. Content sits in columns 8-12; columns 1-7
 * hold only the numeral and a rotated label. Three hanging-indent records in a
 * narrow right-hand column can never read as three equal cards: they are one
 * list with one left edge, and the seven empty columns beside them are the
 * section's actual subject.
 *
 * The numeral carries the second of the route's three register ghosts, so it
 * slips and settles with the rest of the sheet rather than independently.
 */
import { accolades } from "@/lib/data";

export default function Citations() {
  return (
    <section
      id="citations"
      className="clp-section clp-grid"
      data-clp-clause="citations"
      data-clp-label="CITATIONS"
    >
      <div className="clp-c-1-7">
        <span className="clp-cit-num clp-reg">
          <span className="clp-reg-ink">03</span>
          <span className="clp-reg-ghost" aria-hidden="true" data-clp-ghost>
            03
          </span>
        </span>
        <h2 className="clp-cit-label clp-meta-lg">Citations</h2>
      </div>

      <ol className="clp-c-8-12 clp-cit-list">
        {accolades.map((item, i) => (
          <li
            className="clp-cit clp-reveal"
            key={`${item.organisation}-${item.title}`}
            style={{ "--clp-i": i } as React.CSSProperties}
          >
            <span className="clp-cit-key clp-meta" aria-hidden="true">
              [{i + 1}]
            </span>
            <h3 className="clp-cit-title clp-display-2">{item.title}</h3>
            <p className="clp-cit-meta clp-meta">
              {item.organisation} — {item.period}
            </p>
            <p className="clp-prose clp-cit-desc">{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
