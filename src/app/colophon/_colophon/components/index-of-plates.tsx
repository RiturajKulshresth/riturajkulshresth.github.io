"use client";

/**
 * §03 - INDEX OF PLATES.
 *
 * The spine of the document, and the only section allowed to start at column 1.
 *
 * THE KEY STRUCTURAL DECISION: the media is not in the row. It lives in a fixed
 * frame outside the list, so no bounded object ever contains an image and a
 * title together - which is precisely what would make 13 rows read as 13 cards.
 * A row owns a baseline and a hairline, and it is 72px tall permanently, in
 * every state. There is no hover expansion: animating track sizing would mean
 * layout work per frame for every row below, it would break the route's
 * hover-is-ink law, it would destroy the cross-section hairline register the
 * moment a cursor landed, and it would oscillate - hovering a row pushes the
 * next one under the cursor, which collapses the first, which pulls the next
 * back.
 *
 * SIX OF THE THIRTEEN PLATES ARE TYPOGRAPHIC. Three projects share wbd.png and
 * a fourth uses deloitte.png; in greyscale those four are nearly
 * indistinguishable, and they are exactly the first rows a visitor touches.
 * Logos are never plates - see `../data.ts`. Those rows, plus the two projects
 * with no asset at all, set their own tags as a mono type block inside the same
 * hairline frame. Which means the most important work on the page gets a
 * typographic plate rather than a logo: the honest answer for platform work
 * that cannot be screenshotted.
 */

import { useEffect, useRef, useState } from "react";
import { GITHUB_URL } from "@/lib/data";
import { plates } from "../data";

export default function IndexOfPlates() {
  /** Which row owns the plate. Defaults to the first, so the frame is never
      empty and the mechanism announces itself before you interact. */
  const [active, setActive] = useState(0);
  /**
   * Media sources are withheld until a row is first activated, so landing on
   * the page never fetches the heavy preview assets. Mirrors the existing
   * lazy-preview pattern in `_default/components/project-card.tsx`.
   */
  const [summoned, setSummoned] = useState<number[]>([0]);
  const sectionRef = useRef<HTMLElement | null>(null);

  /* The fixed plate only exists while the index is on screen; otherwise it
     would hang in the viewport over §02 and §04. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.classList.toggle("clp-index-inview", e.isIntersecting);
        }
      },
      { rootMargin: "-10% 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const activate = (i: number) => {
    setActive(i);
    setSummoned((prev) => (prev.includes(i) ? prev : [...prev, i]));
  };

  return (
    <section
      id="index"
      ref={sectionRef}
      className="clp-section clp-index"
      data-clp-clause="index"
      data-clp-label="INDEX OF PLATES"
    >
      <div className="clp-grid">
        <div className="clp-c-full clp-index-head">
          <h2 className="clp-display-2">Index of plates</h2>
          {/* An index that declares its own sort order is the genre. One that
              does not is a card grid with numbers on it. */}
          <p className="clp-sort clp-meta-lg">
            Ordered by year of last impression, descending
          </p>
        </div>

        <ol className="clp-c-1-6 clp-plates">
          {plates.map((plate, i) => {
            const detailId = `clp-plate-detail-${i}`;
            const href = plate.project.link ?? GITHUB_URL;
            return (
              <li
                key={plate.project.title}
                className="clp-plate-row clp-reveal"
                style={{ "--clp-i": i } as React.CSSProperties}
                onMouseEnter={() => activate(i)}
              >
                <div className="clp-plate-line">
                  {/* A styled CSS counter, so the semantics match the fiction. */}
                  <span className="clp-plate-num" aria-hidden="true" />

                  <h3 className="clp-plate-title clp-display-2">
                    {/* The anchor wraps ONLY the title, so the link's
                        accessible name is three words rather than the 600-odd
                        characters of the description. The description is
                        associated through aria-describedby instead. */}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-describedby={detailId}
                      onFocus={() => activate(i)}
                    >
                      {plate.project.title}
                    </a>
                  </h3>

                  <span className="clp-leader" aria-hidden="true" />
                  {/* One four-digit tabular numeral. Thirteen of these hold a
                      single right edge in strict descending order, which the
                      raw "2026 - present" / "2022 - 2024" strings never could;
                      the full period moves into the plate metadata below. */}
                  <span className="clp-plate-year">{plate.year}</span>
                  <span className="clp-plate-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>

                {/* ALWAYS in the DOM and always in the accessibility tree.
                    Above the kinetic gate CSS lifts this into the plate column
                    and hides it with opacity alone; below the gate it stays
                    right here, static and always visible. One markup, two
                    placements, no `display: none`, no invisible tabbable
                    descendants, and find-in-page works in both. */}
                <div
                  id={detailId}
                  className={`clp-detail${
                    active === i ? " clp-detail-on" : ""
                  }`}
                >
                  <p className="clp-detail-sub clp-meta">
                    {plate.project.subtitle}
                  </p>
                  <p className="clp-prose clp-detail-desc">
                    {plate.project.description}
                  </p>
                  <p className="clp-detail-foot clp-meta">
                    <span>{plate.project.year}</span>
                    <span>{plate.project.tags.join(" · ")}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The plate itself: one frame, outside the list, aria-hidden because
          every word in it is already in the row's detail block. */}
      <div className="clp-plate-frame" aria-hidden="true">
        {plates.map((plate, i) =>
          plate.kind === "media" ? (
            <div
              key={plate.project.title}
              className={`clp-plate-media${
                active === i ? " clp-plate-media-on" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={summoned.includes(i) ? plate.project.preview : undefined}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div
              key={plate.project.title}
              className={`clp-plate-typo${
                active === i ? " clp-plate-typo-on" : ""
              }`}
            >
              {plate.project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
