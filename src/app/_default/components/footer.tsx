/**
 * Site footer. Social icon buttons reuse `socialLinks` from `@/lib/data`;
 * `iconMap` resolves each link's `icon` string to a react-icons component.
 */
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { GrInstagram } from "react-icons/gr";
import { socialLinks } from "@/lib/data";

const iconMap = {
  linkedin: FaLinkedinIn,
  github: FaGithub,
  instagram: GrInstagram,
  twitter: FaXTwitter,
} as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--color-border)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
            © {year} Rituraj Kulshresth
          </p>
          <p className="text-xs text-[color:var(--color-fg-subtle)]">
            Built with Next.js, Tailwind, and good intentions.
          </p>
        </div>

        <div className="flex items-center gap-1">
          {socialLinks.map((link) => {
            const Icon = iconMap[link.icon as keyof typeof iconMap];
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="rounded-md p-2.5 text-[color:var(--color-fg-muted)] transition hover:bg-[color:var(--color-surface-hover)] hover:text-[color:var(--color-fg)]"
              >
                <Icon size={16} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
