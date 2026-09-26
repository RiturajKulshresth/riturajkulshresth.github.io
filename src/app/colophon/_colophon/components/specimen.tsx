/**
 * §04 - SPECIMEN.
 *
 * The document's second gathering, on the other paper. There are no group
 * containers at all: four columns of one table divided by three vertical
 * rules, exactly as a printed specimen sheet divides faces.
 *
 * Above the kinetic gate the section pins for 460vh and pans a 200vw track, so
 * the four groups arrive as four immense column stacks. Below it the pin
 * releases and the same markup stacks as four plain ruled tables - no
 * horizontal scroll ever exists on touch, and find-in-page works fully. Both
 * layouts are in the server-rendered HTML and switched purely by CSS.
 *
 * THE RUBRIC IS ON THE STRUCTURE, NOT THE ITEMS. An earlier draft inked eight
 * items red to mean "load-bearing in production" - colour carrying meaning
 * alone, which is a WCAG 1.4.1 failure and, worse, exactly the job an
 * AI-default page gives its accent. Red now marks the column indices and the
 * column rules, visible without a legend. The load-bearing claim is carried by
 * a hanging dagger plus a real <strong> plus a screen-reader phrase.
 */
import { skillGroups } from "@/lib/data";
import { LOAD_BEARING } from "../data";

export default function Specimen() {
  return (
    <section
      id="specimen"
      className="clp-section clp-specimen"
      data-clp-clause="specimen"
      data-clp-label="SPECIMEN"
    >
      <div className="clp-grid">
        <h2 className="clp-c-full clp-meta" style={{ color: "var(--clp-ink-subtle)" }}>
          Specimen of the hand
        </h2>
      </div>

      <div className="clp-spec-pin" data-clp-pin>
        <div className="clp-spec-stick">
          <div className="clp-spec-track" data-clp-track>
            {skillGroups.map((group) => (
              <div
                key={group.title}
                className="clp-spec-col"
                data-clp-spec-col
              >
                <h3 className="clp-spec-title clp-meta-lg">{group.title}</h3>

                <ol className="clp-spec-items">
                  {group.items.map((item, i) => {
                    const loadBearing = LOAD_BEARING.has(item);
                    return (
                      <li className="clp-spec-item" key={item}>
                        <span className="clp-spec-idx" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {loadBearing ? (
                          <strong>
                            <span className="clp-dagger" aria-hidden="true">
                              †
                            </span>
                            {item}
                            <span className="clp-sr-only">
                              , load-bearing in production
                            </span>
                          </strong>
                        ) : (
                          item
                        )}
                      </li>
                    );
                  })}
                </ol>

                <p className="clp-spec-desc clp-meta">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="clp-grid">
        {/* The section's only editorial voice, and it explains a mark rather
            than apologising for a hue. */}
        <p className="clp-c-full clp-spec-note clp-meta">
          † Items daggered are load-bearing in production today
        </p>
      </div>
    </section>
  );
}
