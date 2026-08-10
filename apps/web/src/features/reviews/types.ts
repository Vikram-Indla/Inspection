export type ReadinessFact = "present" | "missing" | "verified" | "updated" | "unavailable";

export type Readiness = {
  checklist: ReadinessFact;
  evidence: ReadinessFact;
  ack: ReadinessFact;
  factory: ReadinessFact;
};

export type SlaState = "on_time" | "overdue" | "none";

export type QueueBadges = {
  slaLabel: string;
  slaTone: string;
  slaState: SlaState;
  riskLabel: string;
  riskTone: string;
  riskBand: string | null;
  criticalCount: number;
  criticalLabel: string;
  priorityLabel: string | null;
};

export type QueueRow = QueueBadges & {
  id: string;
  href: string;
  factoryName: string;
  factoryCode: string;
  inspectorName: string;
  versionNumber: number | null;
  submittedDisplay: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  modeLabel: string;
  typeLabel: string;
  readiness: Readiness;
  readable: boolean;
  unassigned: boolean;
};

export type FingerprintStrings = {
  sla: string;
  slaOverdue: string;
  slaOnTime: string;
  slaUnavailable: string;
  risk: string;
  critical: string;
  priority: string;
  checklist: string;
  evidence: string;
  ack: string;
  factory: string;
  present: string;
  missing: string;
  verified: string;
  updated: string;
  unavailable: string;
  readyBlockTag: string;
  noEvidenceTitle: string;
  noEvidenceBody: string;
  unassignedTitle: string;
  unassignedBlocked: string;
};

export type ReviewQueueStrings = {
  searchPlaceholder: string;
  searchAria: string;
  allStatuses: string;
  allRisks: string;
  overdueOnly: string;
  clearFilters: string;
  showing: string;
  noMatch: string;
  noMatchBody: string;
  colFactory: string;
  colInspector: string;
  colTypeMode: string;
  colVersion: string;
  colFingerprint: string;
  colStatus: string;
  colOpen: string;
  open: string;
  openHint: string;
  fpTitle: string;
  fpHint: string;
  fp: FingerprintStrings;
};

export type QueueOption = { value: string; label: string };

export type SubmissionVersion = {
  version_number: number;
  submitted_at: string;
  acknowledgement: unknown;
  snapshot: { answers?: Record<string, string> } | null;
};

export type JoinedVisit = {
  visit_type: string;
  execution_mode: string;
  priority: string | null;
  factories: { name: string; factory_code: string; risk_band: string | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

export type JoinedReview = {
  id: string;
  status: string;
  decided_at: string | null;
  reviewer_id: string | null;
  submission_versions: SubmissionVersion | null;
  inspections: {
    id: string;
    status: string;
    submitted_at: string | null;
    visits: JoinedVisit | null;
    violations: { violation_codes: { level: string } | null }[] | null;
    evidence: { id: string }[] | null;
  } | null;
};

export type QueueEntry = {
  review: JoinedReview;
  readiness: Readiness;
  readable: boolean;
};

export type LoadedQueue = {
  entries: QueueEntry[];
  reviewDays: number | null;
  workDays: Set<number>;
  degraded: boolean;
};

export type { Translator } from "@/lib/i18n";
