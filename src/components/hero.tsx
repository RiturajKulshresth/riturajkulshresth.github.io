import Image from "next/image";
import Link from "next/link";
import { profile, RESUME_PATH } from "@/lib/data";

const floatingTags = [
  { label: "TypeScript", className: "top-6 -left-3 md:-left-6", delay: "200ms" },
  { label: "Python", className: "top-1/3 -right-3 md:-right-6", delay: "320ms" },
  { label: "Next.js", className: "bottom-12 -left-5 md:-left-10", delay: "440ms" },
  { label: "FastAPI", className: "-bottom-3 right-6 md:right-12", delay: "560ms" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 glow opacity-90" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Left — typography */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/40 px-3 py-1 text-xs text-[color:var(--color-fg-muted)] backdrop-blur fade-up">
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)] pulse-dot" />
            {profile.status}
          </div>

          <h1
            className="mt-7 text-balance text-[44px] leading-[1.05] tracking-tight md:text-6xl fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <span className="text-gradient">Hi, I&apos;m Rituraj.</span>
            <br />
            <span className="font-display italic text-gradient-accent">
              I build systems that scale.
            </span>
          </h1>

          <p
            className="mt-7 max-w-xl text-[17px] leading-relaxed text-[color:var(--color-fg-muted)] text-pretty fade-up"
            style={{ animationDelay: "180ms" }}
          >
            Software engineer based in {profile.location.split(",")[0]}.{" "}
            {profile.bio}
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-3 fade-up"
            style={{ animationDelay: "260ms" }}
          >
            <Link
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-fg-muted)]"
            >
              Get in touch
              <svg
                className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-fg)] transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-hover)]"
            >
              View projects
            </Link>
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v9m0 0l-3-3m3 3l3-3M3 14h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Résumé
            </a>
          </div>

          <dl
            className="mt-12 grid max-w-md grid-cols-3 gap-x-6 gap-y-4 border-t border-[color:var(--color-border)] pt-7 fade-up"
            style={{ animationDelay: "360ms" }}
          >
            {[
              { label: "Focus", value: "Systems & AI" },
              { label: "Currently", value: "WBD" },
              { label: "Education", value: "IIT Jodhpur" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-[color:var(--color-fg)]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — illustration "stage" */}
        <div
          className="relative mx-auto w-full max-w-md fade-up lg:mx-0 lg:ml-auto"
          style={{ animationDelay: "120ms" }}
        >
          {/* Soft accent halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-[color:var(--color-accent-glow)] via-transparent to-cyan-500/10 blur-2xl"
          />

          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]/60 shadow-[var(--shadow-card)] backdrop-blur">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--traffic-red)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--traffic-amber)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--traffic-green)]" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)]">
                ~/rituraj
              </span>
            </div>

            {/* Illustration */}
            <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgb(167_139_250_/_0.12),transparent_55%),radial-gradient(circle_at_80%_80%,rgb(34_211_238_/_0.08),transparent_55%)] p-6">
              <Image
                src="/images/coding.svg"
                alt="Developer at work illustration"
                width={480}
                height={480}
                priority
                className="relative z-10 h-full w-full object-contain"
              />
              {/* Subtle inner grid */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-dots opacity-30"
              />
            </div>

            {/* Caption strip */}
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-4 py-2.5">
              <span className="font-mono text-[10px] text-[color:var(--color-fg-subtle)]">
                <span className="text-[color:var(--color-accent)]">●</span>{" "}
                building.tsx
              </span>
              <span className="font-mono text-[10px] text-[color:var(--color-fg-subtle)]">
                UTF-8 · LF
              </span>
            </div>
          </div>

          {/* Floating tech tag pills */}
          {floatingTags.map((tag) => (
            <span
              key={tag.label}
              className={`absolute hidden rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-bg-overlay)] px-3 py-1 font-mono text-[11px] text-[color:var(--color-fg)] shadow-[var(--shadow-card)] backdrop-blur fade-up sm:inline-flex ${tag.className}`}
              style={{ animationDelay: tag.delay }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
