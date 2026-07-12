// Bottom tab bar for the inspector iPad channel (/field routes only).
// Rendered from field pages — NOT from Shell. Legacy Senaei DNA: fixed bar
// with a raised circular green FAB in the center that jumps to the next
// actionable visit startup. Labels arrive pre-translated from the server
// page (useT) so this stays a zero-dependency presentational component.
// All colors via var(--ax-*) tokens (GLOBAL COLOR LAW); layout uses logical
// properties so RTL comes free.

export type FieldTabsLabels = {
  dashboard: string;
  visits: string;
  virtual: string;
  signout: string;
  fab: string; // aria-label for the center FAB
};

const BAR_HEIGHT = 64;

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  minBlockSize: "var(--ax-control-height-field)",
  textDecoration: "none",
  font: "var(--ax-text-caption)",
  fontWeight: active ? 600 : 400,
  color: active ? "var(--ax-color-primary)" : "var(--ax-color-text-secondary)",
});

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// Simple stroke glyphs, single path each (no external icon deps).
const GLYPHS = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  visits: "M4 6h16M4 12h16M4 18h10",
  virtual: "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3",
  signout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9",
};

export default function FieldTabs({ active, fabHref, labels }: {
  active: "dashboard" | "visits";
  fabHref: string;
  labels: FieldTabsLabels;
}) {
  return (
    <nav aria-label={labels.dashboard}
      className="ax-surface"
      style={{
        position: "fixed",
        insetBlockEnd: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: "var(--ax-z-sticky)" as unknown as number,
        blockSize: BAR_HEIGHT,
        paddingBlockEnd: "env(safe-area-inset-bottom)",
        borderRadius: 0,
        borderBlockStart: "1px solid var(--ax-color-border)",
        display: "flex",
        alignItems: "stretch",
        boxShadow: "var(--ax-shadow-overlay)",
      }}>
      <a href="/field" style={tabStyle(active === "dashboard")}
        aria-current={active === "dashboard" ? "page" : undefined}>
        <Icon d={GLYPHS.dashboard} />{labels.dashboard}
      </a>
      <a href="/field#visits" style={tabStyle(active === "visits")}
        aria-current={active === "visits" ? "page" : undefined}>
        <Icon d={GLYPHS.visits} />{labels.visits}
      </a>
      {/* Raised center FAB — next actionable visit startup */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <a href={fabHref} aria-label={labels.fab}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            inlineSize: 56,
            blockSize: 56,
            marginBlockStart: -28,
            borderRadius: "var(--ax-radius-full)",
            background: "var(--ax-color-primary)",
            color: "var(--ax-color-inverse-text)",
            border: "4px solid var(--ax-color-surface)",
            boxShadow: "var(--ax-shadow-overlay)",
            textDecoration: "none",
            fontSize: 22,
            lineHeight: 1,
          }}>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <a href="/virtual" style={tabStyle(false)}>
        <Icon d={GLYPHS.virtual} />{labels.virtual}
      </a>
      <a href="/signout" style={tabStyle(false)}>
        <Icon d={GLYPHS.signout} />{labels.signout}
      </a>
    </nav>
  );
}
