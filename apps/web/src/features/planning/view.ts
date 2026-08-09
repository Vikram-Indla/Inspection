import type { Locale } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { PlanningVisitRow } from "@/lib/planning/visit-list";
import type { PlanningLookupOption } from "./queries";

export type PlanningVisitView = {
  id: string;
  reference: string;
  factory: string;
  cr: string;
  license: string;
  authority: string;
  visitType: string;
  window: string;
  inspector: string;
  risk: string;
  priority: string;
  aiScore: string;
  statusLabel: string;
  statusTone: StatusTone;
  lastUpdated: string;
  created: string;
  visitHref: string;
};

export type PlanningViewLabels = {
  tabs: Record<string, string>;
  empty: string;
  referenceUnavailable: string;
};

const STATUS_TONES: Readonly<Record<string, StatusTone>> = {
  draft: "neutral",
  validated: "neutral",
  pending_supervision: "pending",
  published: "success",
  returned: "warning",
  cancelled: "danger",
  expired: "neutral",
};

const lookupLabel = (options: PlanningLookupOption[], key: string, locale: Locale): string | null => {
  const match = options.find(option => option.key === key);
  if (!match) return null;
  return locale === "ar" ? (match.labelAr ?? match.labelEn) : match.labelEn;
};

export function buildPlanningVisitViews(
  rows: PlanningVisitRow[],
  lastUpdates: Record<string, string>,
  locale: Locale,
  labels: PlanningViewLabels,
  visitTypes: PlanningLookupOption[],
  priorities: PlanningLookupOption[],
): PlanningVisitView[] {
  const dash = labels.empty;
  const text = (value: string | null) => (value && value.length > 0 ? value : dash);
  return rows.map(row => {
    const statusKey = row.planningStatus === "validated" ? "draft" : row.planningStatus;
    return {
      id: row.id,
      reference: row.visitReference ?? labels.referenceUnavailable,
      factory: text(row.factoryName),
      cr: text(row.crNumber),
      license: text(row.licenseNumber),
      authority: dash,
      visitType: lookupLabel(visitTypes, row.visitType, locale) ?? row.visitType,
      window: `${formatDate(row.windowStart, locale)} – ${formatDate(row.windowEnd, locale)}`,
      inspector: text(row.inspectorName),
      risk: dash,
      priority: row.priority ? (lookupLabel(priorities, row.priority, locale) ?? row.priority) : dash,
      aiScore: dash,
      statusLabel: labels.tabs[statusKey] ?? statusKey,
      statusTone: STATUS_TONES[row.planningStatus] ?? "pending",
      lastUpdated: lastUpdates[row.id] ? formatDateTime(lastUpdates[row.id], locale) : dash,
      created: formatDateTime(row.createdAt, locale),
      visitHref: `/visits/${row.id}`,
    };
  });
}
