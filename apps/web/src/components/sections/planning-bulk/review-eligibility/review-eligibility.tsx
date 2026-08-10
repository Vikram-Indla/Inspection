import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./review-eligibility.module.css";

export type EligibilityCounts = {
  total: number;
  eligible: number;
  ineligible: number;
  toCreate: number;
  missingLocation: number;
  activeConflicts: number;
  manualOverrideRequired: number;
};

export type EligibilityStrings = {
  eligH: string; eligTotal: string; eligEligible: string; eligIneligible: string;
  eligToCreate: string; eligMissingLoc: string; eligConflicts: string;
  eligManualOverride: string; loadingNote: string;
};

export default function ReviewEligibility({ counts, strings }: {
  counts: EligibilityCounts | null;
  strings: EligibilityStrings;
}) {
  const cells: readonly (readonly [string, number, boolean])[] = counts === null ? [] : [
    [strings.eligTotal, counts.total, false],
    [strings.eligEligible, counts.eligible, true],
    [strings.eligIneligible, counts.ineligible, false],
    [strings.eligToCreate, counts.toCreate, false],
    [strings.eligMissingLoc, counts.missingLocation, false],
    [strings.eligConflicts, counts.activeConflicts, false],
    [strings.eligManualOverride, counts.manualOverrideRequired, false],
  ];

  return (
    <Card as="section">
      <CardHeader title={strings.eligH} />
      <CardBody gap="tight">
        {counts === null ? <p className={styles.note} role="status">{strings.loadingNote}</p> : (
          <div className={styles.grid}>
            {cells.map(([label, value, isEligible]) => (
              <span className={styles.cell} key={label}>
                <span className={styles.label}>{label}</span>
                {isEligible
                  ? <StatusPill tone="success">{String(value)}</StatusPill>
                  : <span className={styles.value}>{value}</span>}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
