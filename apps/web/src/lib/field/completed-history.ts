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

// PostgREST embeds a nested relation as an array, a single object, or null/undefined
// depending on how it infers the FK cardinality for a given query shape (INSP-699:
// /field/completed crashed with "flatMap is not a function" because assignments →
// visits → inspections returned a bare object, not an array, whenever a visit had
// exactly one inspection). Normalize to an array without hiding genuinely invalid
// data: anything that isn't an array, a plain object, null, or undefined is a real
// shape violation and gets logged so it surfaces instead of silently vanishing.
export function normalizeEmbedded<T>(value: unknown, context: string): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object") return [value as T];
  console.error(`[completed-history] unexpected embedded shape for ${context}:`, typeof value, value);
  return [];
}

export function latestSubmittedVersions(records: CompletedHistoryRecord[]): CompletedHistoryRecord[] {
  const latest = new Map<string, CompletedHistoryRecord>();
  for (const record of records) {
    const current = latest.get(record.inspectionId);
    if (!current || record.versionNumber > current.versionNumber) latest.set(record.inspectionId, record);
  }
  return [...latest.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
