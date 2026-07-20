// CD-021 (SCR-WEB-110) — eligibility ledger strip (design frame 1a).
// The signature of the Targeting Lens: denominator + eligible + excluded shown
// together so a planner always sees what the criteria kept, dropped, and out of
// how many — never a bare result count. Server-rendered; pure counts (no AI,
// no inference). Freshness is the real factories.source_synced_at (FND-013):
// we show the actual oldest sync time and how many rows are missing it. We do
// NOT classify "stale" — no governed staleness threshold exists in
// engine_settings, and inventing one is prohibited.

export type LedgerStrings = {
  heading: string;
  denominator: string;
  eligible: string;
  excluded: string;
  freshness: string;
  freshnessNever: string;   // "no sync timestamp"
  freshnessMissing: string; // "{n} missing sync"
  focusContribution: string; // "{n} from focused condition" (reserved for criteria focus)
};

export default function EligibilityLedger({
  denominator, eligible, oldestSyncedAt, missingSync, strings, focusedCount, focusedLabel,
}: {
  denominator: number;
  eligible: number;
  oldestSyncedAt: string | null;
  missingSync: number;
  strings: LedgerStrings;
  focusedCount?: number | null;
  focusedLabel?: string | null;
}) {
  const excluded = Math.max(0, denominator - eligible);
  // Factual relative age — no threshold styling.
  const freshnessLabel = oldestSyncedAt
    ? new Date(oldestSyncedAt).toISOString().slice(0, 16).replace("T", " ")
    : strings.freshnessNever;

  return (
    <section className="ax-surface" aria-label={strings.heading}
      style={{ padding: "var(--ax-space-300)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-400)", alignItems: "flex-end" }}>
      <div>
        <span className="t-caption">{strings.denominator}</span>
        <div className="numeric" aria-live="polite"><strong style={{ font: "var(--ax-text-title)" }}>{denominator}</strong></div>
      </div>
      <div>
        <span className="t-caption">{strings.eligible}</span>
        <div className="numeric" aria-live="polite">
          <span className="badge badge-compliant">✓ {eligible}</span>
        </div>
      </div>
      <div>
        <span className="t-caption">{strings.excluded}</span>
        <div className="numeric" aria-live="polite">
          <span className="badge badge-info">− {excluded}</span>
        </div>
      </div>
      {focusedCount != null && (
        <div role="status" aria-live="polite">
          <span className="t-caption">{focusedLabel}</span>
          <div className="numeric"><span className="badge badge-info">{strings.focusContribution.replace("{n}", String(focusedCount))}</span></div>
        </div>
      )}
      <div style={{ marginInlineStart: "auto" }}>
        <span className="t-caption">{strings.freshness}</span>
        <div className="ax-freshness numeric">
          <bdi>{freshnessLabel}</bdi>
          {missingSync > 0 && (
            <> · <span className="badge badge-warning">⚠ {strings.freshnessMissing.replace("{n}", String(missingSync))}</span></>
          )}
        </div>
      </div>
    </section>
  );
}
