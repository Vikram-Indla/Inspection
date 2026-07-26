// TASK-IPAD-COMPLETED-HISTORY-001 · G2-P09 · SCR-IPAD-660
// Projection helpers for inspector-scoped, immutable submitted inspection history.
// These helpers never merge live draft rows into a submitted snapshot.

export type SubmittedSnapshot = {
  answers?: Record<string, string>;
  notes?: Record<string, string>;
  violations?: Array<{
    item?: string;
    code?: string;
    title?: string | null;
    level?: string | null;
  }>;
  evidence?: {
    total?: number;
    by_item?: Record<string, number>;
    manifest?: Array<{
      id?: string;
      type?: string;
      name?: string;
      captured_at?: string;
      sha256?: string;
    }>;
  };
};

export type CompletedHistoryRecord = {
  inspectionId: string;
  visitId: string;
  factoryName: string;
  factoryCode: string | null;
  visitType: string | null;
  status: string;
  versionId: string;
  versionNumber: number;
  submittedAt: string;
  submittedBy: string;
  snapshot: SubmittedSnapshot;
  acknowledgement: { name?: string; signed_at?: string; ts?: string } | null;
};

export function completionReference(record: Pick<CompletedHistoryRecord, "versionId" | "versionNumber">): string {
  return `SUB-${record.versionId.slice(0, 8).toUpperCase()}-V${record.versionNumber}`;
}

export function summarizeSnapshot(snapshot: SubmittedSnapshot) {
  const answers = Object.values(snapshot.answers ?? {});
  const nonCompliant = answers.filter(value => value === "non_compliant").length;
  const compliant = answers.filter(value => value === "compliant").length;
  const evidenceManifest = snapshot.evidence?.manifest ?? [];
  const evidenceCount = snapshot.evidence?.total
    ?? (evidenceManifest.length || Object.values(snapshot.evidence?.by_item ?? {}).reduce((sum, count) => sum + count, 0));
  return {
    answered: answers.length,
    compliant,
    nonCompliant,
    findings: snapshot.violations?.length ?? nonCompliant,
    evidence: evidenceCount,
  };
}

export function latestSubmittedVersions(records: CompletedHistoryRecord[]): CompletedHistoryRecord[] {
  const latest = new Map<string, CompletedHistoryRecord>();
  for (const record of records) {
    const current = latest.get(record.inspectionId);
    if (!current || record.versionNumber > current.versionNumber) latest.set(record.inspectionId, record);
  }
  return [...latest.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
