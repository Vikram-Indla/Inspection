import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { DECIDED_STATUSES, type ApprovalStep, type ComponentRow } from "./types";

const STATUS_TONES: Readonly<Record<string, StatusTone>> = {
  active: "success",
  operational: "success",
  published: "success",
  approved: "success",
  compliant: "success",
  draft: "pending",
  pending: "pending",
  pending_review: "pending",
  partially_approved: "info",
  returned: "warning",
  suspended: "warning",
  retired: "warning",
  inactive: "warning",
  rejected: "danger",
  auto_rejected: "danger",
};

export function statusTone(value: string): StatusTone {
  return STATUS_TONES[value.trim().toLowerCase()] ?? "neutral";
}

export function violationLevelTone(level: string): StatusTone {
  if (level === "L1") return "danger";
  if (level === "L2") return "warning";
  return "info";
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export type FieldComparison = {
  readonly field: string;
  readonly current: string;
  readonly proposed: string;
  readonly changed: boolean;
};

export function changedFields(component: ComponentRow): readonly FieldComparison[] {
  const current = component.current_value_snapshot ?? {};
  const proposed = component.proposed_value_snapshot ?? {};
  return Array.from(new Set([...Object.keys(current), ...Object.keys(proposed)])).map(field => ({
    field,
    current: displayValue(current[field]),
    proposed: displayValue(proposed[field]),
    changed: JSON.stringify(current[field]) !== JSON.stringify(proposed[field]),
  }));
}

export function changeKind(component: ComponentRow): "created" | "modified" {
  return component.target_entity_id ? "modified" : "created";
}

export function objectName(component: ComponentRow): string | null {
  const proposed = component.proposed_value_snapshot ?? {};
  const candidate = proposed.title ?? proposed.name ?? null;
  return typeof candidate === "string" && candidate ? candidate : null;
}

export function stepComponents(components: readonly ComponentRow[], step: ApprovalStep): readonly ComponentRow[] {
  if (step === "overview" || step === "summary") return components;
  return components.filter(component => component.entity_kind === step);
}

export type GroupBreakdown = {
  readonly total: number;
  readonly decided: number;
  readonly approved: number;
  readonly rejected: number;
  readonly pending: number;
};

export function groupBreakdown(components: readonly ComponentRow[]): GroupBreakdown {
  const approved = components.filter(component =>
    component.component_status === "approved" || component.component_status === "published").length;
  const rejected = components.filter(component =>
    component.component_status === "rejected" || component.component_status === "auto_rejected").length;
  const decided = components.filter(component => DECIDED_STATUSES.has(component.component_status)).length;
  return {
    total: components.length,
    decided,
    approved,
    rejected,
    pending: components.length - decided,
  };
}
