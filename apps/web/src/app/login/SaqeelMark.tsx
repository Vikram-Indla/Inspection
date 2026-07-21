// Canonical SAQEEL brand mark — hexagonal inspection seal with a verification
// check, per the copied SAQEEL design system (design_system_original/
// brand_reference/saqeel-inspection-seal.svg). Replaces the retired
// magenta-violet prism. One token colour (emerald action) drives both
// themes; the geometry never changes and the seal never mirrors in RTL.
export default function SaqeelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" role="img" aria-label="Saqeel">
      <path d="M20 7 L52 7 L68 36 L52 65 L20 65 L4 36 Z" fill="var(--ax-color-primary-hover)" />
      <path d="M24 37 l8 9 l17 -20" fill="none" stroke="var(--ax-color-inverse-text)"
        strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
