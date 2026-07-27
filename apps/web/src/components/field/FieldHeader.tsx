import type { ReactNode } from "react";

// Shared SAQEEL execution content header — markup/geometry retained from the
// existing Field screens inside the canonical AppShell: a
// surface-primary bar with an optional leading control, title + subtitle, and a
// trailing controls cluster (language toggle, plus any extras).
// Consumes the SAQEEL DS tokens linked by (app)/field/layout.tsx.
//
// Theme and application navigation are owned by the parent AppShell. This
// route-level header intentionally contains no drawer or bottom-navigation
// trigger.
// Per-screen geometry overrides.
//
// The shared values below are an approximation: header geometry is NOT uniform
// across the PWA designs. "SAQEEL PWA-Field Visit Results.dc.html" draws
// padding:12px 18px, gap:12px and a 15px/600 title, while other pages differ.
// Editing the shared defaults to satisfy one design would silently shift every
// other field screen, so a screen that needs its own design's numbers passes
// them here instead. Omitting a prop keeps the existing shared value, which is
// why no current caller changes.
type HeaderGeometry = {
  /** Block padding; inline padding stays 18px across the designs checked. */
  paddingBlock?: number;
  gap?: number;
  titleSize?: number;
  titleWeight?: number;
};

export default function FieldHeader({
  title, subtitle, leading, right, langHref, langLabel, geometry,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  right?: ReactNode;
  langHref: string;
  langLabel: string;
  geometry?: HeaderGeometry;
}) {
  const paddingBlock = geometry?.paddingBlock ?? 14;
  const gap = geometry?.gap ?? 10;
  const titleSize = geometry?.titleSize ?? 16;
  const titleWeight = geometry?.titleWeight ?? 700;
  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap,
        padding: `${paddingBlock}px 18px`,
        paddingBlockStart: `max(${paddingBlock}px, env(safe-area-inset-top))`,
        background: "var(--surface-primary)", borderBlockEnd: "1px solid var(--border-subtle)",
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontWeight: titleWeight, fontSize: titleSize }}>{title}</div>
        {subtitle ? <div className="t-caption">{subtitle}</div> : null}
      </div>
      {right}
      <a
        href={langHref}
        style={{
          padding: "7px 13px",
          borderRadius: 999,
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-sunken)",
          font: "inherit",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          color: "var(--text-secondary)",
          textDecoration: "none",
        }}
      >
        {langLabel}
      </a>
    </header>
  );
}
