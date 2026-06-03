/**
 * Hand-drawn pixel-style icons in the Windows 95 16-colour palette. Each uses
 * `shapeRendering="crispEdges"` and integer coords so it reads as period
 * pixel art rather than a smooth modern glyph. Sized via the `className`.
 */
type IconProps = { className?: string };

const base = (className?: string) => ({
  viewBox: "0 0 32 32",
  shapeRendering: "crispEdges" as const,
  className,
  xmlns: "http://www.w3.org/2000/svg",
});

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 8h9l3 3h14v15H3z" fill="#e0b000" />
      <path d="M3 8h9l3 3h14v3H3z" fill="#fff04a" />
      <path d="M3 13h26v13H3z" fill="#ffd633" />
      <path d="M3 24h26v2H3z" fill="#b58600" />
      <path d="M3 8h9l3 3h14v15H3z" fill="none" stroke="#7a5c00" strokeWidth="1" />
    </svg>
  );
}

export function DocIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M7 3h13l5 5v21H7z" fill="#ffffff" stroke="#000" strokeWidth="1" />
      <path d="M20 3v5h5" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="10" y="12" width="12" height="1.5" fill="#1d4ed8" />
      <rect x="10" y="16" width="12" height="1.5" fill="#808080" />
      <rect x="10" y="20" width="9" height="1.5" fill="#808080" />
      <rect x="10" y="24" width="12" height="1.5" fill="#808080" />
    </svg>
  );
}

export function ComputerIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="4" width="24" height="17" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="6" y="6" width="20" height="13" fill="#1a8cff" />
      <rect x="7" y="7" width="8" height="5" fill="#5fb3ff" />
      <rect x="10" y="21" width="12" height="3" fill="#a0a0a0" stroke="#000" strokeWidth="1" />
      <rect x="6" y="24" width="20" height="5" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="9" y="26" width="14" height="1.5" fill="#808080" />
      <rect x="22" y="25.5" width="2" height="2.5" fill="#2ecc40" />
    </svg>
  );
}

export function FloppyIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 4h20l4 4v20H4z" fill="#2b3a8c" stroke="#000" strokeWidth="1" />
      <rect x="9" y="4" width="11" height="9" fill="#c0c0c0" />
      <rect x="15" y="5" width="3" height="7" fill="#1a1a1a" />
      <rect x="8" y="16" width="16" height="11" fill="#d4d4d4" stroke="#000" strokeWidth="1" />
      <rect x="10" y="18" width="9" height="1.5" fill="#555" />
      <rect x="10" y="21" width="9" height="1.5" fill="#555" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="7" width="26" height="18" fill="#ffffff" stroke="#000" strokeWidth="1" />
      <path d="M3 7l13 10L29 7" fill="none" stroke="#000" strokeWidth="1.5" />
      <path d="M3 7h26v3l-13 9L3 10z" fill="#e8eef7" />
    </svg>
  );
}

export function MineIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="15" cy="18" r="9" fill="#1a1a1a" />
      <rect x="14" y="3" width="2" height="8" fill="#1a1a1a" />
      <rect x="11" y="3" width="8" height="2" fill="#1a1a1a" />
      <rect x="20" y="8" width="3" height="3" fill="#e02020" />
      <rect x="11" y="14" width="3" height="3" fill="#fff" opacity="0.8" />
    </svg>
  );
}

export function RecycleIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M7 9h18l-2 19H9z" fill="#9aa3ad" stroke="#000" strokeWidth="1" />
      <rect x="5" y="6" width="22" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="13" y="3" width="6" height="3" fill="#808080" stroke="#000" strokeWidth="1" />
      <rect x="12" y="12" width="2" height="13" fill="#5b6b8c" />
      <rect x="17" y="12" width="2" height="13" fill="#5b6b8c" />
      <path d="M16 14l2 3h-4z" fill="#2ecc40" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="16" cy="16" r="12" fill="#1a8cff" stroke="#000" strokeWidth="1" />
      <path d="M4 16h24M16 4v24" stroke="#bfe0ff" strokeWidth="1" />
      <path d="M16 4c5 4 5 20 0 24M16 4c-5 4-5 20 0 24" fill="none" stroke="#bfe0ff" strokeWidth="1" />
      <path d="M6 11h20M6 21h20" stroke="#bfe0ff" strokeWidth="1" />
      <path d="M8 9l3 3-2 4 3 2-1 4" fill="#2e7d32" opacity="0.85" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="11" y="6" width="10" height="4" fill="none" stroke="#5a3a16" strokeWidth="2" />
      <rect x="4" y="10" width="24" height="17" fill="#8a5a2b" stroke="#000" strokeWidth="1" />
      <rect x="4" y="16" width="24" height="3" fill="#5a3a16" />
      <rect x="14" y="16" width="4" height="3" fill="#d4a464" />
    </svg>
  );
}

export function ChipIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="8" y="8" width="16" height="16" fill="#1a1a1a" stroke="#000" strokeWidth="1" />
      <rect x="11" y="11" width="10" height="10" fill="#2ecc40" />
      <rect x="13" y="13" width="6" height="6" fill="#0a5a1a" />
      {[10, 14, 18].map((y) => (
        <g key={y}>
          <rect x="4" y={y} width="4" height="2" fill="#c0c0c0" />
          <rect x="24" y={y} width="4" height="2" fill="#c0c0c0" />
        </g>
      ))}
      {[10, 14, 18].map((x) => (
        <g key={x}>
          <rect x={x} y="4" width="2" height="4" fill="#c0c0c0" />
          <rect x={x} y="24" width="2" height="4" fill="#c0c0c0" />
        </g>
      ))}
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="6" y="6" width="9" height="9" fill="#e02020" />
      <rect x="17" y="6" width="9" height="9" fill="#2ecc40" />
      <rect x="6" y="17" width="9" height="9" fill="#1a8cff" />
      <rect x="17" y="17" width="9" height="9" fill="#eab308" />
    </svg>
  );
}
