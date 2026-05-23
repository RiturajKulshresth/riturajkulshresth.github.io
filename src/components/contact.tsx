import { profile, socialLinks } from "@/lib/data";
import { SectionHeader } from "./experience";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-[color:var(--color-border)] py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      <div className="relative mx-auto max-w-4xl px-6">
        <SectionHeader
          eyebrow="Contact"
          title="Let's build something."
          description="The fastest way to reach me is email. I usually reply within a day or two."
        />

        <div className="mt-12 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/40 p-6 backdrop-blur sm:p-8">
            <a
              href={`mailto:${profile.email}`}
              className="group flex max-w-full flex-wrap items-baseline gap-2 font-display text-2xl italic text-[color:var(--color-fg)] sm:text-3xl md:text-4xl"
            >
              <span className="link-underline break-all">{profile.email}</span>
              <svg
                className="h-5 w-5 self-center text-[color:var(--color-fg-subtle)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M3 9L9 3M9 3H4M9 3V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-fg-subtle)]">
                  Location
                </dt>
                <dd className="mt-1.5 text-[color:var(--color-fg)]">
                  {profile.location}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-fg-subtle)]">
                  Phone
                </dt>
                <dd className="mt-1.5 text-[color:var(--color-fg)]">
                  <a
                    href={`tel:${profile.phone.replace(/\s/g, "")}`}
                    className="link-underline"
                  >
                    {profile.phone}
                  </a>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-fg-subtle)]">
                  Availability
                </dt>
                <dd className="mt-1.5 text-[color:var(--color-fg-muted)]">
                  {profile.status} - interesting work in systems, AI platforms,
                  and full-stack product.
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/40 p-6 backdrop-blur sm:p-8">
            <div>
              <h3 className="text-base font-medium text-[color:var(--color-fg)]">Elsewhere</h3>
              <p className="mt-2 text-sm text-[color:var(--color-fg-muted)] text-pretty">
                Find me writing code, posting photos, or arguing about
                operating systems.
              </p>
            </div>
            <ul className="space-y-1">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition hover:bg-[color:var(--color-surface-hover)]"
                  >
                    <span className="text-[color:var(--color-fg)]">
                      {link.label}
                    </span>
                    <svg
                      className="h-3.5 w-3.5 text-[color:var(--color-fg-subtle)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M3 9L9 3M9 3H4M9 3V8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


