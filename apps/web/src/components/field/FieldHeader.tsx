import type { ReactNode } from "react";

// Shared SAQEEL field-screen header — markup/geometry ported from the design's
// per-screen headers (SAQEEL Field My Tasks/Dashboard/… .dc.html): a
// surface-primary bar with an optional leading control, title + subtitle, and a
// trailing controls cluster (language toggle, plus any extras).
// Consumes the SAQEEL DS tokens linked by (app)/field/layout.tsx.
//
// No theme control: the field channel is fixed dark (see ThemeScript), so
// there is nothing for one to switch.
export default function FieldHeader({
  title, subtitle, leading, right, langHref, langLabel,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  right?: ReactNode;
  langHref: string;
  langLabel: string;
}) {
  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 18px", paddingBlockStart: "max(14px, env(safe-area-inset-top))",
        background: "var(--surface-primary)", borderBlockEnd: "1px solid var(--border-subtle)",
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
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
