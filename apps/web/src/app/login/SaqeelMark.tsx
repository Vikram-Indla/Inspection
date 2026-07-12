// Saqeel logomark — a polished (صقيل) facet/gem, echoing the favicon. Uses
// currentColor so it inherits the brand-panel text colour in either theme.
export default function SaqeelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Saqeel" fill="none"
      stroke="currentColor" strokeLinejoin="round">
      <path d="M24 5 L40 18 L24 43 L8 18 Z" strokeWidth="2.4" />
      <path d="M8 18 H40 M24 5 L17 18 L24 43 M24 5 L31 18 L24 43" strokeWidth="1.3" opacity="0.5" />
    </svg>
  );
}
