import { SkeletonBlock } from "@/components/Skeleton";

// CD-031 / SCR-WEB-400 — loading state for the Factory 360 dossier.
export default function Loading() {
  return (
    <div style={{ padding: "var(--space-8)" }} role="status" aria-live="polite" aria-busy="true" aria-label="Loading factory profile">
      <SkeletonBlock blockSize={28} inlineSize="40%" style={{ marginBlockEnd: "var(--space-4)" }} />
      <div className="cd-w3">
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <SkeletonBlock blockSize={110} />
          <SkeletonBlock blockSize={90} />
          <SkeletonBlock blockSize={140} />
        </div>
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <SkeletonBlock blockSize={48} />
          <SkeletonBlock blockSize={220} />
          <SkeletonBlock blockSize={180} />
        </div>
      </div>
    </div>
  );
}
