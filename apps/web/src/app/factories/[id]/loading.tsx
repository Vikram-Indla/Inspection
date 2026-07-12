// SB11 / M07 — loading state for the Factory 360 dossier.
export default function Loading() {
  return (
    <div style={{ padding: "var(--ax-space-400)", display: "grid", gap: "var(--ax-space-200)" }} aria-busy="true" aria-label="Loading factory dossier">
      <div className="ax-skeleton" style={{ blockSize: 28, inlineSize: "40%" }} />
      <div className="ax-skeleton" style={{ blockSize: 120 }} />
      <div className="ax-skeleton" style={{ blockSize: 180 }} />
      <div className="ax-skeleton" style={{ blockSize: 180 }} />
    </div>
  );
}
