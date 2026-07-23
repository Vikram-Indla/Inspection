import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// Shared SAQEEL field-screen header — markup/geometry ported from the design's
// per-screen headers (SAQEEL Field My Tasks/Dashboard/… .dc.html): a sticky
// surface-primary bar with an optional leading control, title + subtitle, and a
// trailing controls cluster (language toggle + theme toggle, plus any extras).
// Consumes the SAQEEL DS tokens linked by (app)/field/layout.tsx.
export default function FieldHeader({
  title, subtitle, leading, right, langHref, langLabel, themeLabels,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  right?: ReactNode;
  langHref: string;
  langLabel: string;
  themeLabels: { toLight: string; toDark: string };
}) {
  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 18px", paddingBlockStart: "max(12px, env(safe-area-inset-top))",
        background: "var(--surface-primary)", borderBlockEnd: "1px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 20,
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
        {subtitle ? <div className="t-caption">{subtitle}</div> : null}
      </div>
      {right}
      <a href={langHref} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>{langLabel}</a>
      <ThemeToggle className="btn btn-icon btn-ghost" labels={themeLabels} />
    </header>
  );
}
