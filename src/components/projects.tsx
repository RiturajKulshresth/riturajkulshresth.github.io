import { projects } from "@/lib/data";
import SectionHeader from "./section-header";
import ProjectCard from "./project-card";

export default function Projects() {
  return (
    <section
      id="projects"
      className="relative border-t border-[color:var(--color-border)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Selected Work"
          title="Things I've built"
          description="A mix of research, side projects, and the kind of thing you build at 2am because you can't sleep until the kernel boots. Hover any card for a preview."
        />

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.title}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
