/**
 * Shared empty-state block. Extracted from the ax-surface > ax-state markup
 * hand-copied across tasks/page.tsx, factories/page.tsx, virtual/page.tsx, etc.
 * Pure presentational — callers still own their own t() calls and pass
 * already-resolved strings, matching the existing server-component convention.
 */
type EmptyStateProps = {
  /** V2: pass an SVG <Icon> from @/app/icons, e.g. icon={<IconFolder />}. */
  icon?: React.ReactNode;
  /** @deprecated pass `icon` (an SVG Icon) instead — a raw glyph string is
   *  the V1 emoji-as-icon pattern (Saqeel V5.1 guardrail). Kept optional so
   *  call sites can migrate incrementally; still renders if `icon` is absent. */
  glyph?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  inline?: boolean;
  bare?: boolean;               // skip the outer ax-surface wrapper — caller already provides one
  children?: React.ReactNode;   // extra content after the body (e.g. a CTA link)
  role?: string;                // e.g. "status" for a live-region announcement (WCAG)
  ariaBusy?: boolean;           // used on loading (not just empty) variants of this same markup
};

export default function EmptyState({ icon, glyph, title, body, inline, bare, children, role, ariaBusy }: EmptyStateProps) {
  const inner = (
    <div className={inline ? "ax-state ax-state--inline" : "ax-state"} role={role} aria-busy={ariaBusy}>
      <span className="ax-state__glyph" aria-hidden="true">{icon ?? glyph}</span>
      <h4>{title}</h4>
      {body ? <p className="t-caption">{body}</p> : null}
      {children}
    </div>
  );
  return bare ? inner : <div className="panel">{inner}</div>;
}
