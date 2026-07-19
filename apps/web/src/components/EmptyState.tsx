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
};

export default function EmptyState({ glyph, title, body, inline }: EmptyStateProps) {
  return (
    <div className="ax-surface">
      <div className={inline ? "ax-state ax-state--inline" : "ax-state"}>
        <span className="ax-state__glyph" aria-hidden="true">{glyph}</span>
        <h4>{title}</h4>
        {body ? <p className="ax-caption">{body}</p> : null}
      </div>
    </div>
  );
}
