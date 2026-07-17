// MVP2-CD-031-M2-05 · TASK-MVP2-M2-05-AUDIT-REPLAY-001
// Stable client/server replay vocabulary. No missing event is synthesized.

export type ReplayStatus = "recorded" | "derived" | "partial" | "missing" | "needs_contract";

export type ExpectedAuditEvent = {
  requirementId: `MVP2-REQ-${string}`;
  acceptanceId: `MVP2-AC-${string}`;
  eventType: string;
  title: string;
  chapter: string;
  defaultStatus: ReplayStatus;
  aliases?: string[];
  requiredFields?: string[];
  ordinal?: number;
  required?: boolean;
  branchGroup?: string | null;
  branchMinimum?: number | null;
  mustFollowEventTypes?: string[];
  optionalPredecessorEventTypes?: string[];
};

export const MVP2_M2_05_EXPECTED_EVENTS: readonly ExpectedAuditEvent[] = [
  ["0137","VisitPlanCreated","Visit planned","Planning","recorded"],
  ["0138","PackageCompiled","Package compiled","Package","needs_contract"],
  ["0139","PackageDownloaded","iPad download","Package","missing"],
  ["0140","GeofenceCheckIn","Check-in","Field","partial",["GeoCheckIn"]],
  ["0141","AnswerSaved","Answer saved","Field","recorded"],
  ["0142","EvidenceCaptured","Evidence captured","Field","recorded"],
  ["0143","FindingCreated","Finding created","Field","recorded"],
  ["0144","SignatureRecorded","Signature or refusal","Closure","partial",["DigitalSignatureCaptured","SignatureRefused"]],
  ["0145","SyncCompleted","Sync completed","Sync","missing"],
  ["0146","ReviewDecisionRecorded","Review decision","Review","recorded"],
  ["0147","NoticeIssued","Enforcement issued","Enforcement","partial",["EnforcementIssued"]],
  ["0148","CorrectionOrObjectionEvent","Correction or objection closure","Closure","needs_contract"],
  ["0149","RegulationVersionPublished","Regulation version published","Configuration","recorded"],
  ["0150","TemplatePublished","Template published","Configuration","needs_contract"],
  ["0151","WorkflowActivated","Workflow activated","Configuration","needs_contract"],
  ["0152","RiskModelActivated","Risk model activated","Risk","needs_contract"],
  ["0153","RiskScoreCalculated","Risk score calculated","Risk","missing"],
  ["0154","VisitPlanCreated","Visit plan created","Planning","recorded"],
  ["0155","AssignmentAccepted","Assignment accepted","Planning","needs_contract"],
  ["0156","OfflinePackageLocked","Offline package locked","Package","partial"],
  ["0157","PackageDownloaded","Package downloaded","Package","missing"],
  ["0158","GeofenceCheckIn","Geofence check-in","Field","recorded"],
  ["0159","InspectionStarted","Inspection started","Field","recorded"],
  ["0160","FormAnswerChanged","Form answer changed","Field","recorded"],
  ["0161","EvidenceCaptured","Evidence captured detail","Field","recorded"],
  ["0162","FindingCreated","Finding created detail","Field","recorded"],
  ["0163","DigitalSignatureCaptured","Digital signature captured","Closure","needs_contract"],
  ["0164","SignatureRefused","Signature refused","Closure","needs_contract"],
  ["0165","InspectionSubmitted","Inspection submitted","Submission","recorded"],
  ["0166","SyncConflictResolved","Sync conflict resolved","Sync","missing"],
  ["0167","ReviewDecisionRecorded","Review decision recorded","Review","recorded"],
  ["0168","CommitteeDecisionRecorded","Committee decision recorded","Committee","needs_contract"],
  ["0169","CorrectionSubmitted","Correction submitted","Correction","needs_contract"],
  ["0170","ObjectionFiled","Objection filed","Objection","needs_contract"],
  ["0171","DashboardViewed","Dashboard viewed","Access","missing"],
  ["0172","AdminOverrideAttempted","Admin override attempted","Override","partial"],
].map(([id,eventType,title,chapter,defaultStatus,aliases]) => ({
  requirementId: `MVP2-REQ-${id}` as `MVP2-REQ-${string}`,
  acceptanceId: `MVP2-AC-${id}` as `MVP2-AC-${string}`,
  eventType: eventType as string,
  title: title as string,
  chapter: chapter as string,
  defaultStatus: defaultStatus as ReplayStatus,
  aliases: aliases as string[] | undefined,
}));

export type ReplayEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  recordedAt?: string;
  actor: string;
  aggregateType: string;
  aggregateId: string | null;
  correlationId: string | null;
  causationId?: string | null;
  beforeState: unknown;
  afterState: unknown;
  payload?: unknown;
  provenance: "semantic" | "generic";
  integrityStatus: string;
  chainStatus: string;
  ingestionStatus: string;
};

export function compareReplayEvents(a: ReplayEvent, b: ReplayEvent): number {
  const time = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
  return time || a.id.localeCompare(b.id);
}

export function replayAt(events: readonly ReplayEvent[], at: string | null): ReplayEvent[] {
  const boundary = at ? new Date(at).getTime() : Number.POSITIVE_INFINITY;
  return [...events].filter(event => new Date(event.occurredAt).getTime() <= boundary).sort(compareReplayEvents);
}

export function eventMatchesExpected(event: ReplayEvent, expected: ExpectedAuditEvent): boolean {
  if (event.provenance !== "semantic" || !["recorded", "mapped"].includes(event.ingestionStatus)) return false;
  if (event.integrityStatus === "mismatch" || event.chainStatus === "broken") return false;
  const typeMatches = event.eventType === expected.eventType || Boolean(expected.aliases?.includes(event.eventType));
  if (!typeMatches) return false;
  const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
    ? event.payload as Record<string, unknown> : {};
  return (expected.requiredFields ?? []).every(field => field in payload && payload[field] !== null && payload[field] !== "");
}

export function completenessFor(events: readonly ReplayEvent[], expected = MVP2_M2_05_EXPECTED_EVENTS) {
  const ordered = [...expected].sort((a,b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  const rows = ordered.map(item => {
    const predecessorCandidates = (predecessor: string) => {
      const definition = ordered.find(row => row.eventType === predecessor);
      return events.filter(candidate => definition ? eventMatchesExpected(candidate,definition) : false);
    };
    const matchedEvent = events.find(event => eventMatchesExpected(event, item)
      && (item.mustFollowEventTypes ?? []).every(predecessor => predecessorCandidates(predecessor).some(candidate => compareReplayEvents(candidate,event) <= 0))
      && (item.optionalPredecessorEventTypes ?? []).every(predecessor => {
        const candidates = predecessorCandidates(predecessor);
        return candidates.length === 0 || candidates.some(candidate => compareReplayEvents(candidate,event) <= 0);
      }));
    return { ...item, found: Boolean(matchedEvent), matchedEventId: matchedEvent?.id ?? null };
  });
  const requiredRows = rows.filter(row => row.required !== false);
  const requiredWithoutBranches = requiredRows.filter(row => !row.branchGroup);
  const branchGroups = new Map<string, typeof rows>();
  for (const row of requiredRows.filter(row => row.branchGroup)) {
    const group = branchGroups.get(row.branchGroup!) ?? [];
    group.push(row); branchGroups.set(row.branchGroup!, group);
  }
  const branchExpected = [...branchGroups.values()].reduce((sum, group) => sum + Math.max(1, group[0].branchMinimum ?? 1), 0);
  const branchFound = [...branchGroups.values()].reduce((sum, group) => sum + Math.min(group.filter(row => row.found).length, Math.max(1, group[0].branchMinimum ?? 1)), 0);
  return {
    rows,
    found: requiredWithoutBranches.filter(row => row.found).length + branchFound,
    expected: requiredWithoutBranches.length + branchExpected,
  };
}

export type ReconstructedAggregate = {
  key: string; aggregateType: string; aggregateId: string | null; state: unknown;
  lastEventId: string; lastOccurredAt: string; eventIds: string[]; deleted: boolean; conflicts: string[];
};

export function reconstructAt(events: readonly ReplayEvent[], at: string | null): ReconstructedAggregate[] {
  const states = new Map<string, ReconstructedAggregate>();
  const bounded = replayAt(events, at);
  const eventById = new Map(bounded.map(event => [event.id,event]));
  for (const event of bounded) {
    if (event.provenance !== "semantic") continue;
    const key = `${event.aggregateType}:${event.aggregateId ?? "unidentified"}`;
    const prior = states.get(key);
    const sameMomentConflict = prior?.lastOccurredAt === event.occurredAt && JSON.stringify(prior.state) !== JSON.stringify(event.afterState);
    const staleBefore = Boolean(prior && event.beforeState != null && JSON.stringify(prior.state) !== JSON.stringify(event.beforeState));
    const cause = event.causationId ? eventById.get(event.causationId) : null;
    const causalConflict = Boolean(event.causationId && (!cause || compareReplayEvents(cause,event) > 0 || cause.correlationId !== event.correlationId));
    states.set(key, {
      key, aggregateType: event.aggregateType, aggregateId: event.aggregateId,
      state: event.afterState ?? null, lastEventId: event.id, lastOccurredAt: event.occurredAt,
      eventIds: [...(prior?.eventIds ?? []), event.id], deleted: event.afterState == null && event.beforeState != null,
      conflicts: [...(prior?.conflicts ?? []), ...(sameMomentConflict ? [`same-time:${prior!.lastEventId}:${event.id}`] : []),
        ...(staleBefore ? [`stale-before:${prior!.lastEventId}:${event.id}`] : []), ...(causalConflict ? [`causation:${event.causationId}:${event.id}`] : [])],
    });
  }
  return [...states.values()].sort((a,b) => a.key.localeCompare(b.key));
}

export function compareReconstructions(before: readonly ReconstructedAggregate[], after: readonly ReconstructedAggregate[]) {
  const keys = new Set([...before.map(row => row.key), ...after.map(row => row.key)]);
  return [...keys].sort().map(key => {
    const left = before.find(row => row.key === key) ?? null;
    const right = after.find(row => row.key === key) ?? null;
    return { key, before: left, after: right, changed: JSON.stringify(left?.state) !== JSON.stringify(right?.state) };
  });
}

export function neutralAuditError(): string {
  return "Audit replay is temporarily unavailable. Recorded source data was not changed. Try again.";
}
