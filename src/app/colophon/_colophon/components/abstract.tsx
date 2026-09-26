/**
 * §01 - ABSTRACT.
 *
 * The largest void in the document, placed immediately after the loudest
 * moment. The heading is a hung 11px mono label in columns 1-5; the content
 * occupies 6-11; columns 1-5 hold nothing else. The negative space is the
 * composition, so there is no container, no background, and nothing to the
 * left of column 6.
 *
 * This is the only place in the route where the serif is used for reading
 * rather than for display.
 */
import { profile } from "@/lib/data";

/** The bio's opening words, set as a raised opening on their own line. */
const RAISED_WORDS = 3;

const words = profile.bio.split(" ");
const opening = words.slice(0, RAISED_WORDS).join(" ");
const remainder = words.slice(RAISED_WORDS).join(" ");

const KEYWORDS = [
  "AGENT PLATFORMS",
  "RETRIEVAL",
  "AUTHENTICATION",
  "EVALUATION",
];

export default function Abstract() {
  return (
    <section
      id="abstract"
      className="clp-section clp-grid"
      data-clp-clause="abstract"
      data-clp-label="ABSTRACT"
    >
      <h2 className="clp-c-1-5 clp-meta" style={{ color: "var(--clp-ink-subtle)" }}>
        Abstract
      </h2>

      <div className="clp-c-6-11 clp-reveal">
        <p className="clp-lede">
          {/* A real editorial raised opening - deliberately NOT
              `font-variant-caps`, since Instrument Serif ships no smcp and
              synthesised small caps in a high-contrast display serif look like
              a rendering bug. */}
          <span className="clp-raised">{opening}</span>
          {remainder}
        </p>

        <p className="clp-keywords clp-meta">
          <span className="clp-mlabel">Keywords</span>
          {KEYWORDS.join(" / ")}
        </p>
      </div>
    </section>
  );
}
