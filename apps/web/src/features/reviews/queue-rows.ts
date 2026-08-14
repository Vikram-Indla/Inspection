import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { slaDeadline } from "./sla";
import type { ReviewsStrings } from "./strings";
import type { LoadedQueue, QueueOption, QueueRow, ReadinessFact, SlaState } from "./types";

const STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  approved: "success",
  returned: "warning",
  rejected: "danger",
  under_review: "info",
  pending_review: "warning",
};

const RISK_TONE: Readonly<Record<string, StatusTone>> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const STATUS_KEY: Readonly<Record<string, keyof ReviewsStrings["status"]>> = {
  pending_review: "submitted",
  under_review: "inReview",
  returned: "returned",
  approved: "approved",
  rejected: "rejected",
};

export function readinessLabel(fact: ReadinessFact, strings: ReviewsStrings): string {
  return strings.readiness[fact];
}

export function readinessTone(fact: ReadinessFact): StatusTone {
  if (fact === "present" || fact === "verified") return "success";
  if (fact === "updated") return "info";
  if (fact === "missing") return "danger";
  return "neutral";
}

export function buildQueueRows(loaded: LoadedQueue, strings: ReviewsStrings, locale: Locale): QueueRow[] {
  const now = Date.now();
  const absent = "—";
  return loaded.entries.map(({ review, readiness, readable }) => {
    const visit = review.inspections?.visits;
    const factory = visit?.factories;
    const submittedAt = review.submission_versions?.submitted_at ?? review.inspections?.submitted_at ?? null;
    const deadline = review.decided_at ? null : slaDeadline(submittedAt, loaded.reviewDays, loaded.workDays);
    const slaState: SlaState = !deadline ? "none" : now > deadline.getTime() ? "overdue" : "on_time";
    const riskBand = factory?.risk_band ?? null;
    const statusKey = STATUS_KEY[review.status];
    return {
      id: review.id,
      href: review.inspections ? `/reviews/${review.inspections.id}` : "/reviews",
      factoryName: factory?.name ?? review.inspections?.id?.slice(0, 8) ?? absent,
      factoryCode: factory?.factory_code ?? "",
      inspectorName: visit?.assignments?.[0]?.profiles?.full_name ?? "",
      versionNumber: review.submission_versions?.version_number ?? null,
      submittedDisplay: submittedAt ? formatDateTime(submittedAt, locale) : absent,
      status: review.status,
      statusLabel: statusKey ? strings.status[statusKey] : review.status,
      statusTone: STATUS_TONE[review.status] ?? "neutral",
      modeLabel: visit?.execution_mode ?? absent,
      typeLabel: visit?.visit_type ?? absent,
      readiness,
      readable,
      unassigned: review.reviewer_id == null && !review.decided_at,
      slaState,
      slaLabel: slaState === "overdue" ? strings.readiness.slaOverdue : strings.readiness.slaOnTime,
      slaTone: slaState === "overdue" ? "danger" : "success",
      riskBand,
      riskLabel: riskBand ? riskBand : strings.readiness.unavailable,
      riskTone: riskBand ? RISK_TONE[riskBand] ?? "info" : "neutral",
      criticalCount: (review.inspections?.violations ?? []).filter(item => item.violation_codes?.level === "L1").length,
      priorityLabel: visit?.priority?.trim() || null,
    };
  });
}

export function buildStatusOptions(strings: ReviewsStrings): QueueOption[] {
  return [
    { value: "pending_review", label: strings.status.submitted },
    { value: "under_review", label: strings.status.inReview },
    { value: "returned", label: strings.status.returned },
    { value: "approved", label: strings.status.approved },
    { value: "rejected", label: strings.status.rejected },
  ];
}

export function buildRiskOptions(loaded: LoadedQueue): QueueOption[] {
  return [...new Set(
    loaded.entries
      .map(entry => entry.review.inspections?.visits?.factories?.risk_band ?? null)
      .filter((value): value is string => !!value),
  )].sort().map(value => ({ value, label: value }));
}
