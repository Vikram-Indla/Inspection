import type { ExpiryRuleRow, ExpiryScope } from "@/app/(app)/admin/planning/expiry/types";
import type { ExpiryCopy } from "./expiry-copy";

export function describeScope(scope: ExpiryScope | null, copy: ExpiryCopy): string {
  if (!scope) return copy.scope.allVisits;
  const parts = [
    scope.visit_type ? copy.visitType[scope.visit_type] ?? scope.visit_type : null,
    scope.execution_mode ? copy.executionMode[scope.execution_mode] ?? scope.execution_mode : null,
    scope.priority ? copy.priority[scope.priority] ?? scope.priority : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : copy.scope.allVisits;
}

export function describeNotify(row: ExpiryRuleRow, copy: ExpiryCopy): string {
  const parts = [
    row.notify_plan_creator ? copy.notify.planCreator : null,
    row.notify_inspector ? copy.notify.inspector : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : copy.notify.none;
}
