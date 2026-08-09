import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type {
  ApprovalComponentRow, ApprovalDependencyRow, ApprovalRequestRow,
} from "./queries";
import { APPROVAL_STEPS, type ApprovalStep } from "./params";

export const DECIDED_STATUSES = new Set(["approved", "rejected", "auto_rejected", "published"]);

const REQUEST_TONES: Readonly<Record<string, StatusTone>> = {
  pending_review: "warning",
  partially_approved: "info",
  approved: "success",
  published: "success",
  returned: "warning",
  rejected: "danger",
  cancelled: "neutral",
};

const COMPONENT_TONES: Readonly<Record<string, StatusTone>> = {
  approved: "success",
  published: "success",
  rejected: "danger",
  auto_rejected: "danger",
  returned: "warning",
  pending_review: "warning",
  draft: "neutral",
};

export const requestTone = (status: string): StatusTone => REQUEST_TONES[status] ?? "neutral";
export const componentTone = (status: string): StatusTone => COMPONENT_TONES[status] ?? "neutral";

export type ChangeKind = "created" | "modified";

/**
 * A component either creates an entity or amends one. There is no third kind:
 * `request_type` is constrained to `create | modify`, so the vendor mock's
 * "Deleted" change has no source in this schema and no row can carry it.
 */
export const changeKindOf = (component: ApprovalComponentRow): ChangeKind =>
  component.target_entity_id ? "modified" : "created";

export type FieldDiff = {
  readonly field: string;
  readonly current: unknown;
  readonly proposed: unknown;
  readonly changed: boolean;
};

export function fieldDiffs(component: ApprovalComponentRow): readonly FieldDiff[] {
  const current = component.current_value_snapshot ?? {};
  const proposed = component.proposed_value_snapshot ?? {};
  return [...new Set([...Object.keys(current), ...Object.keys(proposed)])]
    .sort()
    .map(field => ({
      field,
      current: current[field],
      proposed: proposed[field],
      changed: JSON.stringify(current[field]) !== JSON.stringify(proposed[field]),
    }));
}

export type GroupBreakdown = {
  readonly total: number;
  readonly decided: number;
  readonly approved: number;
  readonly rejected: number;
  readonly pending: number;
};

export function breakdownOf(components: readonly ApprovalComponentRow[]): GroupBreakdown {
  const count = (predicate: (row: ApprovalComponentRow) => boolean) => components.filter(predicate).length;
  return {
    total: components.length,
    decided: count(row => DECIDED_STATUSES.has(row.component_status)),
    approved: count(row => row.component_status === "approved" || row.component_status === "published"),
    rejected: count(row => row.component_status === "rejected" || row.component_status === "auto_rejected"),
    pending: count(row => !DECIDED_STATUSES.has(row.component_status)),
  };
}

export const componentsOf = (
  components: readonly ApprovalComponentRow[],
  request: ApprovalRequestRow,
): readonly ApprovalComponentRow[] =>
  components.filter(row => row.request_id === request.id && row.revision_number === request.current_revision);

export const componentsForStep = (
  components: readonly ApprovalComponentRow[],
  step: ApprovalStep,
): readonly ApprovalComponentRow[] =>
  step === "overview" || step === "summary" ? components : components.filter(row => row.entity_kind === step);

export type StepState = {
  readonly step: ApprovalStep;
  readonly breakdown: GroupBreakdown;
  readonly settled: boolean;
};

export function stepStates(components: readonly ApprovalComponentRow[]): readonly StepState[] {
  return APPROVAL_STEPS.map(step => {
    const scoped = componentsForStep(components, step);
    const breakdown = breakdownOf(scoped);
    return { step, breakdown, settled: breakdown.pending === 0 };
  });
}

export type PackageSummary = {
  readonly total: number;
  readonly created: number;
  readonly modified: number;
  readonly byKind: ReadonlyMap<string, number>;
};

export function packageSummary(components: readonly ApprovalComponentRow[]): PackageSummary {
  const byKind = new Map<string, number>();
  for (const component of components) {
    byKind.set(component.entity_kind, (byKind.get(component.entity_kind) ?? 0) + 1);
  }
  return {
    total: components.length,
    created: components.filter(row => changeKindOf(row) === "created").length,
    modified: components.filter(row => changeKindOf(row) === "modified").length,
    byKind,
  };
}

/**
 * Rejecting a component recursively auto-rejects everything that depends on it
 * (`decide_compliance_request_component`). The reviewer is told the count
 * before they commit, because the database will not ask again.
 */
export function dependentCount(
  componentId: string,
  dependencies: readonly ApprovalDependencyRow[],
  components: readonly ApprovalComponentRow[],
): number {
  const pending = new Set(
    components.filter(row => !DECIDED_STATUSES.has(row.component_status)).map(row => row.id),
  );
  const seen = new Set<string>();
  const queue = [componentId];
  while (queue.length) {
    const parent = queue.shift() ?? "";
    for (const edge of dependencies) {
      if (edge.parent_component_id !== parent || seen.has(edge.child_component_id)) continue;
      seen.add(edge.child_component_id);
      queue.push(edge.child_component_id);
    }
  }
  return [...seen].filter(id => pending.has(id)).length;
}

export const parentsOf = (
  componentId: string,
  dependencies: readonly ApprovalDependencyRow[],
  components: readonly ApprovalComponentRow[],
): readonly ApprovalComponentRow[] => {
  const parentIds = new Set(
    dependencies.filter(edge => edge.child_component_id === componentId).map(edge => edge.parent_component_id),
  );
  return components.filter(row => parentIds.has(row.id));
};

export const missingCommentCount = (components: readonly ApprovalComponentRow[]): number =>
  components.filter(row =>
    (row.component_status === "rejected" || row.component_status === "returned")
    && !row.decision_comments?.trim()).length;
