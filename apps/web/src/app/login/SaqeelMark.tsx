// Saqeel logomark — precision compass + inspection crosshair + beacon.
// Deep-emerald four-point star inside a ticked bezel ring, with a cyan
// inspection beacon at the centre. Theme-adaptive through tokens only
// (GLOBAL COLOR LAW): star = primary emerald, ring = current brand ink,
// beacon = info cyan. Replaces the retired magenta prism (brand v2).
export default function SaqeelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Saqeel"
      fill="none" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <radialGradient id="saqeel-beacon" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--ax-color-info)" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="var(--ax-color-info)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--ax-color-info)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ticked bezel ring */}
      <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="2.2"
        strokeDasharray="0.6 5.2" opacity="0.9" />

      {/* four-point compass star (N–S–E–W), deep emerald */}
      <path d="M24 2.5 L28 22 L24 26 L20 22 Z" fill="var(--ax-color-primary)" />
      <path d="M24 45.5 L20 26 L24 22 L28 26 Z" fill="var(--ax-color-primary-hover)" />
      <path d="M2.5 24 L22 20 L26 24 L22 28 Z" fill="var(--ax-color-primary-hover)" />
      <path d="M45.5 24 L26 28 L22 24 L26 20 Z" fill="var(--ax-color-primary)" />

      {/* inspection beacon: cyan glow + core + crosshair ticks */}
      <circle cx="24" cy="24" r="9" fill="url(#saqeel-beacon)" />
      <circle cx="24" cy="24" r="4.4" fill="none" stroke="var(--ax-color-info)" strokeWidth="1.6" />
      <path d="M24 15.5 v3.4 M24 29.1 v3.4 M15.5 24 h3.4 M29.1 24 h3.4"
        stroke="var(--ax-color-info)" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="1.7" fill="currentColor" />
    </svg>
  );
}
