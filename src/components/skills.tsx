import { skillGroups } from "@/lib/data";
import { SectionHeader } from "./experience";

export default function Skills() {
  return (
    <section
      id="skills"
      className="relative border-t border-[color:var(--color-border)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Toolkit"
          title="What I reach for"
          description="The tools I've shipped real things with, grouped by where they live in the stack."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-5 bg-[color:var(--color-bg)] p-6 transition hover:bg-[color:var(--color-bg-elevated)]/60 md:p-7"
            >
              <div>
                <h3 className="text-sm font-medium text-[color:var(--color-fg)]">{group.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-fg-subtle)] text-pretty">
                  {group.description}
                </p>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-2.5 py-1 font-mono text-[11px] text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-accent)]/40 hover:text-[color:var(--color-fg)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
