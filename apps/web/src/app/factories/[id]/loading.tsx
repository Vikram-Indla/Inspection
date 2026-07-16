// CD-031 / SCR-WEB-400 — loading state for the Factory 360 dossier.
export default function Loading() {
  return (
    <div style={{ padding: "var(--ax-space-400)" }} role="status" aria-live="polite" aria-busy="true" aria-label="Loading factory dossier">
      <div className="ax-skeleton" style={{ blockSize: 28, inlineSize: "40%", marginBlockEnd: "var(--ax-space-200)" }} />
      <div className="cd-w3">
        <div style={{ display: "grid", gap: "var(--ax-space-200)" }}>
          <div className="ax-skeleton" style={{ blockSize: 110 }} />
          <div className="ax-skeleton" style={{ blockSize: 90 }} />
          <div className="ax-skeleton" style={{ blockSize: 140 }} />
        </div>
        <div style={{ display: "grid", gap: "var(--ax-space-200)" }}>
          <div className="ax-skeleton" style={{ blockSize: 48 }} />
          <div className="ax-skeleton" style={{ blockSize: 220 }} />
          <div className="ax-skeleton" style={{ blockSize: 180 }} />
        </div>
      </div>
    </div>
  );
}
