/**
 * Shared section header used by every long-form section on the home page
 * (Experience, Projects, Skills, Accolades, Contact). The eyebrow is the
 * mono-cased category label; the title is the section's actual heading.
 */
export default function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl tracking-tight text-[color:var(--color-fg)] md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-fg-muted)] text-pretty">
          {description}
        </p>
      )}
    </div>
  );
}
