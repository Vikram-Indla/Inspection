// CD-021 (SCR-WEB-110) — eligibility ledger strip (design frame 1a).
// The signature of the Targeting Lens: denominator + eligible + excluded shown
// together so a planner always sees what the criteria kept, dropped, and out of
// how many — never a bare result count. Server-rendered; pure counts (no AI,
// no inference). Freshness is the real factories.source_synced_at (FND-013):
// we show the actual oldest sync time and how many rows are missing it. We do
// NOT classify "stale" — no governed staleness threshold exists in
// engine_settings, and inventing one is prohibited.
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

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
  denominator, eligible, oldestSyncedAt, missingSync, strings, focusedCount, focusedLabel, locale,
}: {
  denominator: number;
  eligible: number;
  oldestSyncedAt: string | null;
  missingSync: number;
  strings: LedgerStrings;
  locale: Locale;
  focusedCount?: number | null;
  focusedLabel?: string | null;
}) {
  const excluded = Math.max(0, denominator - eligible);
  // Factual relative age — no threshold styling.
  const freshnessLabel = oldestSyncedAt
    ? formatDateTime(oldestSyncedAt, locale === "ar" ? "ar" : "en")
    : strings.freshnessNever;

  return (
    <section className="metric-strip" aria-label={strings.heading}>
      <div className="sq-kpi">
        <span className="kpi-label">{strings.denominator}</span>
        <strong className="kpi-value numeric" aria-live="polite">{denominator}</strong>
      </div>
      <div className="sq-kpi">
        <span className="kpi-label">{strings.eligible}</span>
        <div className="numeric" aria-live="polite">
          <span className="badge badge-compliant">✓ {eligible}</span>
        </div>
      </div>
      <div className="sq-kpi">
        <span className="kpi-label">{strings.excluded}</span>
        <div className="numeric" aria-live="polite">
          <span className="badge badge-info">− {excluded}</span>
        </div>
      </div>
      {focusedCount != null && (
        <div className="sq-kpi" role="status" aria-live="polite">
          <span className="kpi-label">{focusedLabel}</span>
          <div className="numeric"><span className="badge badge-info">{strings.focusContribution.replace("{n}", String(focusedCount))}</span></div>
        </div>
      )}
      <div className="sq-kpi">
        <span className="kpi-label">{strings.freshness}</span>
        <div className="sq-freshness numeric">
          <bdi>{freshnessLabel}</bdi>
          {missingSync > 0 && (
            <> · <span className="badge badge-warning">⚠ {strings.freshnessMissing.replace("{n}", String(missingSync))}</span></>
          )}
        </div>
      </div>
    </section>
  );
}
