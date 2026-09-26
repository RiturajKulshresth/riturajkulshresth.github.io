/**
 * Colophon render mode.
 *
 * The portfolio set as the one artefact this engineer actually authors for a
 * living: a numbered technical specification with a colophon. Black ink carries
 * every word, a single rubric red carries only structure, and the whole sheet
 * is very slightly loose on the press.
 *
 * Unlike the other interactive render modes this route is a SERVER component
 * and is fully prerendered. There is no `next/dynamic({ ssr: false })` wrapper,
 * because the 17vw masthead is the LCP element and must be in the static HTML -
 * and because every layout branch (§03's two detail placements, §04's pinned
 * and stacked forms) is switched by media query rather than by JS. The only
 * client code is `PressEngine`, which starts behaviours and never touches
 * layout.
 */
import type { Metadata } from "next";
import "./_colophon/colophon.css";

import PressEngine from "./_colophon/components/press-engine";
import Rail from "./_colophon/components/rail";
import BackButton from "./_colophon/components/back-button";
import Masthead from "./_colophon/components/masthead";
import Abstract from "./_colophon/components/abstract";
import Posts from "./_colophon/components/posts";
import IndexOfPlates from "./_colophon/components/index-of-plates";
import Specimen from "./_colophon/components/specimen";
import Citations from "./_colophon/components/citations";
import ColophonClose from "./_colophon/components/colophon-close";
import Trim from "./_colophon/components/trim";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "Rituraj Kulshresth's portfolio set as a numbered technical specification: rubricated clause numbers, an index of plates, a specimen sheet, and a colophon. An alternate visual of riturajkulshresth.github.io.",
};

/**
 * Recovery for a kinetic-tier device where JS fails after the CSS has already
 * hidden the reveal elements. The pre-reveal state is declared behind the
 * kinetic gate in colophon.css, so this override only ever needs to fire there.
 */
const NOSCRIPT_REVEAL = `.clp-reveal{opacity:1!important;transform:none!important}`;

export default function ColophonPage() {
  return (
    <div className="clp-root">
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: NOSCRIPT_REVEAL }} />
      </noscript>

      {/* The default Navbar is not used on this route, so it ships its own
          skip link to its own <main>. */}
      <a href="#main" className="clp-skip">
        Skip to document
      </a>

      <PressEngine />
      <Rail />
      <BackButton />

      <main id="main">
        <div className="clp-crop clp-crop-top" aria-hidden="true" />

        <Masthead />
        <Abstract />
        <Posts />
        <IndexOfPlates />
        <Specimen />
        <Citations />
        <ColophonClose />
      </main>

      <Trim />
      <div className="clp-crop clp-crop-bottom" aria-hidden="true" />
    </div>
  );
}
