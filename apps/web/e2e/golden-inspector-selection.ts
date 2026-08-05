export type ControlledInspectorCandidate<T> = {
  userId: string;
  value: T;
};

export type GoldenInspectorLeaseRow = {
  lease_id: string;
  inspector_id: string;
};

/** Resolve the exact controlled credential selected by the governed lease. */
export function selectLeasedControlledInspector<T>(
  candidates: ControlledInspectorCandidate<T>[],
  leaseRows: GoldenInspectorLeaseRow[],
): ControlledInspectorCandidate<T> & { leaseId: string } {
  const candidateIds = candidates.map(candidate => candidate.userId);
  if (!candidateIds.length || new Set(candidateIds).size !== candidateIds.length) {
    throw new Error("controlled Inspector candidates must be non-empty and unique");
  }
  if (leaseRows.length !== 1 || !leaseRows[0].lease_id || !leaseRows[0].inspector_id) {
    throw new Error("golden Inspector lease must resolve exactly one governed row");
  }
  const selected = candidates.find(candidate => candidate.userId === leaseRows[0].inspector_id);
  if (!selected) throw new Error("golden Inspector lease selected an uncontrolled identity");
  return { ...selected, leaseId: leaseRows[0].lease_id };
}

/** Pick the first configured credential present in the authoritative roster. */
export function selectAvailableControlledInspector<T>(
  candidates: ControlledInspectorCandidate<T>[],
  availableInspectorIds: string[],
): ControlledInspectorCandidate<T> {
  const candidateIds = candidates.map(candidate => candidate.userId);
  if (!candidateIds.length || new Set(candidateIds).size !== candidateIds.length) {
    throw new Error("controlled Inspector candidates must be non-empty and unique");
  }
  const available = new Set(availableInspectorIds);
  const selected = candidates.find(candidate => available.has(candidate.userId));
  if (!selected) throw new Error("authoritative roster has no available controlled Inspector");
  return selected;
}
