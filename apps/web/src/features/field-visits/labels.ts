import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Messages } from "@/i18n/messages";
import type { VisitPriority } from "@/app/(app)/field/my-tasks/assignment-task-model";
import type { FieldVisit } from "./rows";

export type VisitsCopy = Messages["fieldVisits"];
export type VisitEnumCopy = Messages["visits"]["enum"];

export function enumLabel(enums: VisitEnumCopy, value: string | null, fallback: string): string {
  if (value === null || value === "") return fallback;
  const table: Readonly<Record<string, string>> = enums;
  return table[value] ?? value;
}

export function riskTone(priority: VisitPriority): StatusTone {
  switch (priority) {
    case "high": return "danger";
    case "medium": return "warning";
    case "low": return "success";
  }
}

export type VisitCta = { label: string; href: string | null };

export function visitCta(visit: FieldVisit, copy: VisitsCopy): VisitCta {
  const cta = copy.cta;
  if (visit.operationalState === "on_the_way") return { label: cta.directions, href: `/field/${visit.id}/travel` };
  if ((visit.operationalState === "arrived" || visit.operationalState === "executing") && visit.inspectionId) {
    return { label: cta.continue, href: `/field/inspection/${visit.inspectionId}` };
  }
  if (visit.operationalState === "submitted" && visit.inspectionId) {
    return { label: cta.results, href: `/field/inspection/${visit.inspectionId}/statement` };
  }
  if (visit.operationalState === "new" || visit.operationalState === "prepared") {
    return { label: cta.start, href: `/field/${visit.id}` };
  }
  return { label: cta.view, href: null };
}
