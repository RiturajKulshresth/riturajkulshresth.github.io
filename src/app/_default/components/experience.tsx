/**
 * Work history section (`id="work"`). Uses a semantic `<ol>` timeline;
 * entries with `current: true` get a "Now" badge.
 */
import { experience } from "@/lib/data";
import SectionHeader from "./section-header";

export default function Experience() {
  return (
    <section
      id="work"
      className="relative border-t border-[color:var(--color-border)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeader
          eyebrow="Work"
          title="Where I've been"
          description="A small set of teams, each one a step deeper into platforms, runtimes, and developer tools."
        />

        <ol className="mt-16 space-y-4">
          {experience.map((exp) => (
            <li
              key={`${exp.company}-${exp.period}`}
              className="group relative rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/30 p-6 transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elevated)]/60 md:p-8"
            >
              <div className="grid gap-6 md:grid-cols-[160px_1fr]">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-fg-subtle)]">
                    {exp.period}
                  </span>
                  {exp.current && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-success)]">
                      <span className="h-1 w-1 rounded-full bg-[color:var(--color-success)]" />
                      Now
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[color:var(--color-fg)] md:text-xl">
                    {exp.role}{" "}
                    <span className="text-[color:var(--color-fg-muted)]">
                      · {exp.company}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-[color:var(--color-fg-subtle)]">
                    {exp.location}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-fg-muted)]">
                    {exp.summary}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-fg-muted)]">
                    {exp.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-fg-subtle)]"
                        />
                        <span className="text-pretty">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
