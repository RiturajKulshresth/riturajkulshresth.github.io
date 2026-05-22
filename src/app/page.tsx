import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Experience from "@/components/experience";
import Projects from "@/components/projects";
import Skills from "@/components/skills";
import Accolades from "@/components/accolades";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
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
