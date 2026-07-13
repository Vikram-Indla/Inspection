// Saqeel logomark — the same magenta-violet polished prism used by the favicon.
export default function SaqeelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Saqeel" strokeLinejoin="round">
      <defs>
        <linearGradient id="saqeel-mark-prism" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ax-color-primary-hover)" />
          <stop offset="0.52" stopColor="var(--ax-color-prism-magenta)" />
          <stop offset="1" stopColor="var(--ax-color-primary)" />
        </linearGradient>
      </defs>
      <path d="M24 5 L40 18 L24 43 L8 18 Z" fill="url(#saqeel-mark-prism)" />
      <path d="M8 18 H40 M24 5 L17 18 L24 43 M24 5 L31 18 L24 43"
        fill="none" stroke="var(--ax-color-atlas-text)" strokeWidth="1.4" opacity="0.68" />
    </svg>
  );
}
