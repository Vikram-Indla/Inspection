// SAQEEL Field — segment-wide loading fallback. Chrome-less (the field layout
// owns the header/nav per screen), so this is a neutral centered indicator on
// the DS canvas rather than the old global Shell + "Field dashboard" heading,
// which flashed the wrong title on every field navigation.
export default function Loading() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        placeItems: "center",
        background: "var(--surface-canvas)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
        <span aria-hidden="true" style={{ fontSize: 24, letterSpacing: 4, lineHeight: 1 }}>•••</span>
        <span className="t-caption" role="status">Loading…</span>
      </div>
    </div>
  );
}
