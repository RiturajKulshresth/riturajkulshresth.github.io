/**
 * "Recognition" section on the home page. Renders awards from `accolades` in
 * `@/lib/data` as a three-column card grid (`id="recognition"`).
 */
import { accolades } from "@/lib/data";
import SectionHeader from "./section-header";

export default function Accolades() {
  return (
    <section
      id="recognition"
      className="relative border-t border-[color:var(--color-border)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeader
          eyebrow="Recognition"
          title="Awards & accolades"
          description="A small set of awards I've picked up along the way - mostly for shipping platforms people actually use."
        />

        <ul className="mt-16 grid gap-4 md:grid-cols-3">
          {accolades.map((item) => (
            <li
              key={`${item.organisation}-${item.title}`}
              className="group flex flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/30 p-6 transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elevated)]/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
                  {item.period}
                </span>
                <svg
                  aria-hidden
                  className="h-4 w-4 text-[color:var(--color-accent)]/80 transition group-hover:text-[color:var(--color-accent)]"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M8 1.5l1.85 3.97L14 6.13l-3.05 2.95.78 4.42L8 11.34 4.27 13.5l.78-4.42L2 6.13l4.15-.66L8 1.5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-medium text-[color:var(--color-fg)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[color:var(--color-accent)]">
                  {item.organisation}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-[color:var(--color-fg-muted)] text-pretty">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
