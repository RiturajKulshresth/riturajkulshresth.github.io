/**
 * §06 - COLOPHON.
 *
 * The closer, and a literal colophon - which is why this direction is called
 * what it is. A colophon is the closing statement of who set the work, and it
 * is exactly where a restricted appendix belongs, so /vault is hidden here by
 * being *contextually correct* rather than by being visually suppressed.
 *
 * Contact is a ruled table of leader rows: the single most un-card-like object
 * in typography. There is no "Let's build something", no headline question, no
 * centred call to action, no button, and no social icons - the four social
 * links are four mono words in one ruled row.
 *
 * END carries the third and last register ghost, and the word END is the serif
 * italic's second and final use in the document.
 */
import Link from "next/link";
import { profile, socialLinks, RESUME_PATH } from "@/lib/data";
import { COORDINATES } from "../data";

export default function ColophonClose() {
  return (
    <section
      id="colophon"
      className="clp-section clp-grid"
      data-clp-clause="colophon"
      data-clp-label="COLOPHON"
    >
      <div className="clp-c-1-7">
        <h2 className="clp-end clp-display-1">
          <em>
            <span className="clp-reg">
              <span className="clp-reg-ink">End</span>
              <span className="clp-reg-ghost" aria-hidden="true" data-clp-ghost>
                End
              </span>
            </span>
          </em>{" "}
          of document
        </h2>

        <p className="clp-colo-para clp-meta">
          Set in Instrument Serif, Geist and Geist Mono. Composed in{" "}
          {profile.location.split(",")[0]}, {COORDINATES}. Two inks, printed
          slightly out of register.
        </p>
      </div>

      <dl className="clp-c-8-12 clp-corr clp-meta">
        <div className="clp-crow">
          <dt className="clp-ckey">
            <span className="clp-clabel">Email</span>
            <span className="clp-leader" aria-hidden="true" />
          </dt>
          <dd className="clp-cval">
            <a className="clp-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </dd>
        </div>

        <div className="clp-crow">
          <dt className="clp-ckey">
            <span className="clp-clabel">Tel</span>
            <span className="clp-leader" aria-hidden="true" />
          </dt>
          <dd className="clp-cval">
            <a
              className="clp-link"
              // Spaces stripped so `tel:` parses on mobile.
              href={`tel:${profile.phone.replace(/\s/g, "")}`}
            >
              {profile.phone}
            </a>
          </dd>
        </div>

        <div className="clp-crow">
          <dt className="clp-ckey">
            <span className="clp-clabel">Resume</span>
            <span className="clp-leader" aria-hidden="true" />
          </dt>
          <dd className="clp-cval">
            <a
              className="clp-link"
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
            >
              PDF ↗
            </a>
          </dd>
        </div>

        <div className="clp-crow">
          <dt className="clp-ckey">
            <span className="clp-clabel">Distribution</span>
            <span className="clp-leader" aria-hidden="true" />
          </dt>
          <dd className="clp-cval">
            <span className="clp-social">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  className="clp-link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label.toUpperCase()}
                </a>
              ))}
            </span>
          </dd>
        </div>

        <div className="clp-crow">
          <dt className="clp-ckey">
            <span className="clp-clabel">Appendix A</span>
            <span className="clp-leader" aria-hidden="true" />
          </dt>
          <dd className="clp-cval">
            <Link className="clp-link" href="/vault">
              Restricted ↗
            </Link>
          </dd>
        </div>
      </dl>
    </section>
  );
}
