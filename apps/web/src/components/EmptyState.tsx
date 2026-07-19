/**
 * Shared empty-state block. Extracted from the ax-surface > ax-state markup
 * hand-copied across tasks/page.tsx, factories/page.tsx, virtual/page.tsx, etc.
 * Pure presentational — callers still own their own t() calls and pass
 * already-resolved strings, matching the existing server-component convention.
 */
type EmptyStateProps = {
  glyph: string;
  title: string;
  body?: string;
  inline?: boolean;
  bare?: boolean;               // skip the outer ax-surface wrapper — caller already provides one
  children?: React.ReactNode;   // extra content after the body (e.g. a CTA link)
  role?: string;                // e.g. "status" for a live-region announcement (WCAG)
};

export default function EmptyState({ glyph, title, body, inline, bare, children, role }: EmptyStateProps) {
  const inner = (
    <div className={inline ? "ax-state ax-state--inline" : "ax-state"} role={role}>
      <span className="ax-state__glyph" aria-hidden="true">{glyph}</span>
      <h4>{title}</h4>
      {body ? <p className="ax-caption">{body}</p> : null}
      {children}
    </div>
  );
  return bare ? inner : <div className="ax-surface">{inner}</div>;
}
