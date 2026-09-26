/**
 * §02 - POSTS.
 *
 * Four full-bleed ruled bands. An entry has no border, no background, no
 * radius and no padding box: its extent is a top hairline and a sticky date,
 * and its left and right edges are the page's own edges. So four posts read as
 * four ruled passages of one document rather than as four objects.
 *
 * The 19 highlight clauses - several over 300 characters - are the real work
 * here. Each is a numbered sub-clause with its key hanging in the left margin,
 * nothing truncated and nothing behind a read-more.
 */
import { experience } from "@/lib/data";
import { clauseCount, periodLines } from "../data";

export default function Posts() {
  return (
    <section
      id="posts"
      className="clp-section"
      data-clp-clause="posts"
      data-clp-label="POSTS"
    >
      <div className="clp-grid">
        <h2 className="clp-c-full clp-meta" style={{ color: "var(--clp-ink-subtle)" }}>
          Posts
        </h2>
      </div>

      {experience.map((post, postIndex) => {
        const [from, to] = periodLines(post.period);
        return (
          <article
            key={`${post.company}-${post.period}`}
            className="clp-post clp-grid"
            data-clp-post
          >
            <div className="clp-c-1-2 clp-period clp-meta">
              <span>{from}</span>
              {to && <span className="clp-period-b">{to}</span>}
            </div>

            <div className="clp-c-3-9">
              <h3 className="clp-company clp-display-2">
                {/* The serif italic marks the current employer - one of its
                    only two uses in the entire document. */}
                {post.current ? <em>{post.company}</em> : post.company}
              </h3>

              <p className="clp-post-meta clp-meta">
                {post.role.replace(" · ", ", ")} — {post.location}
              </p>

              <p className="clp-prose clp-post-summary">{post.summary}</p>

              <ol className="clp-clauses">
                {post.highlights.map((highlight, i) => (
                  <li className="clp-clause" key={highlight.slice(0, 48)}>
                    {/* Hanging sub-clause keys: 2.1.1, 2.1.2 ... The numeral is
                        rubric ink because it is structure, not emphasis. */}
                    <span className="clp-clause-key clp-meta" aria-hidden="true">
                      {`2.${postIndex + 1}.${i + 1}`}
                    </span>
                    <p className="clp-prose">{highlight}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Derived, not asserted. */}
            <p className="clp-c-12 clp-count clp-meta">
              {clauseCount(post.highlights.length)}
            </p>
          </article>
        );
      })}
    </section>
  );
}
