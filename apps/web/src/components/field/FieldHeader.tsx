import type { ReactNode } from "react";

// Shared SAQEEL field-screen header — markup/geometry ported from the design's
// per-screen headers (SAQEEL Field My Tasks/Dashboard/… .dc.html): a sticky
// surface-primary bar with an optional leading control, title + subtitle, and a
// trailing controls cluster (language toggle, plus any extras).
// Consumes the SAQEEL DS tokens linked by (app)/field/layout.tsx.
//
// No theme control: the field channel is fixed dark (see ThemeScript), so there
// is nothing for one to switch. `themeLabels` is retained as an optional,
// unused prop purely so the 23 existing call sites keep compiling; it should be
// dropped in a follow-up sweep.
export default function FieldHeader({
  title, subtitle, leading, right, langHref, langLabel, themeLabels,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  right?: ReactNode;
  langHref: string;
  langLabel: string;
  /** @deprecated Unused — the field channel is fixed dark and renders no theme control. */
  themeLabels?: { toLight: string; toDark: string };
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
    </header>
  );
}
