import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

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
  slaTone: StatusTone;
  slaState: SlaState;
  riskLabel: string;
  riskTone: StatusTone;
  riskBand: string | null;
  criticalCount: number;
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
  statusTone: StatusTone;
  modeLabel: string;
  typeLabel: string;
  readiness: Readiness;
  readable: boolean;
  unassigned: boolean;
};

export type QueueOption = { value: string; label: string };

/** The filter state the queue reads from `searchParams` (WEB-004 §1). */
export type QueueFilters = {
  query: string;
  status: string;
  risk: string;
  overdueOnly: boolean;
};

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
