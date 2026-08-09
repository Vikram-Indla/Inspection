import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { slaDeadline } from "./sla";
import type { LoadedQueue, QueueOption, QueueRow, SlaState, Translator } from "./types";

const TONE: Record<string, string> = { approved: "sq-lozenge--success", returned: "sq-lozenge--warning", rejected: "sq-lozenge--critical", under_review: "sq-lozenge--info", pending_review: "sq-lozenge--warning" };
const RISK_TONE: Record<string, string> = { low: "sq-lozenge--success", medium: "sq-lozenge--warning", high: "sq-lozenge--critical" };

export function buildQueueRows(loaded: LoadedQueue, t: Translator, locale: Locale): QueueRow[] {
  const now = Date.now();
  const criticalLabel = t("review.list.criticalBadge", "{n} critical");
  const fmt = (iso: string | null) => iso ? formatDateTime(iso, locale) : "—";
  return loaded.entries.map(({ review, readiness, readable }) => {
    const visit = review.inspections?.visits;
    const factory = visit?.factories;
    const submittedAt = review.submission_versions?.submitted_at ?? review.inspections?.submitted_at ?? null;
    const deadline = review.decided_at ? null : slaDeadline(submittedAt, loaded.reviewDays, loaded.workDays);
    const slaState: SlaState = !deadline ? "none" : now > deadline.getTime() ? "overdue" : "on_time";
    const criticalCount = (review.inspections?.violations ?? []).filter(item => item.violation_codes?.level === "L1").length;
    const riskBand = factory?.risk_band ?? null;
    return {
      id: review.id,
      href: review.inspections ? `/reviews/${review.inspections.id}` : "/reviews",
      factoryName: factory?.name ?? review.inspections?.id?.slice(0, 8) ?? "—",
      factoryCode: factory?.factory_code ?? "",
      inspectorName: visit?.assignments?.[0]?.profiles?.full_name ?? "",
      versionNumber: review.submission_versions?.version_number ?? null,
      submittedDisplay: fmt(submittedAt),
      status: review.status,
      statusLabel: t(`enum.${review.status}`, review.status.replace(/_/g, " ")),
      statusTone: TONE[review.status] ?? "",
      modeLabel: visit ? t(`enum.${visit.execution_mode}`, visit.execution_mode) : "—",
      typeLabel: visit ? t(`enum.${visit.visit_type}`, visit.visit_type) : "—",
      readiness,
      readable,
      unassigned: review.reviewer_id == null && !review.decided_at,
      slaState,
      slaLabel: slaState === "overdue" ? t("review.list.slaOverdue", "overdue") : t("review.list.slaOnTime", "on time"),
      slaTone: slaState === "overdue" ? "sq-lozenge--critical" : "sq-lozenge--success",
      riskBand,
      riskLabel: riskBand ? t(`enum.${riskBand}`, riskBand) : "",
      riskTone: riskBand ? RISK_TONE[riskBand] ?? "sq-lozenge--info" : "",
      criticalCount,
      criticalLabel: criticalLabel.replace("{n}", String(criticalCount)),
      priorityLabel: visit?.priority?.trim() ? t(`enum.priority.${visit.priority}`, visit.priority) : null,
    };
  });
}

export function buildStatusOptions(t: Translator): QueueOption[] {
  return [
    { value: "pending_review", label: t("review.list.status.submitted", "Submitted") },
    { value: "under_review", label: t("review.list.status.inReview", "In review") },
    { value: "returned", label: t("review.list.status.returned", "Returned") },
    { value: "approved", label: t("review.list.status.approved", "Approved") },
    { value: "rejected", label: t("review.list.status.rejected", "Rejected") },
  ];
}

export function buildRiskOptions(loaded: LoadedQueue, t: Translator): QueueOption[] {
  const values = [...new Set(
    loaded.entries
      .map(entry => entry.review.inspections?.visits?.factories?.risk_band ?? null)
      .filter((value): value is string => !!value),
  )].sort();
  return values.map(value => ({ value, label: t(`enum.${value}`, value) }));
}
