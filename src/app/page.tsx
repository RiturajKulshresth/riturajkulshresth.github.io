/**
 * Home page (the "Default" render mode). Composes the single-page portfolio
 * from `_default/components/` sections in scroll order. CursorGlow and Navbar
 * sit outside `<main id="main">` because they are fixed chrome, not content.
 */
import CursorGlow from "./_default/components/cursor-glow";
import Navbar from "./_default/components/navbar";
import Hero from "./_default/components/hero";
import Experience from "./_default/components/experience";
import Projects from "./_default/components/projects";
import Skills from "./_default/components/skills";
import Accolades from "./_default/components/accolades";
import Contact from "./_default/components/contact";
import Footer from "./_default/components/footer";

export default function Home() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      <main id="main" className="min-h-screen">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Accolades />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
