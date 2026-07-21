export const RULE_TYPES = [
  "no_acknowledgement",
  "no_execution_date",
  "no_execution_start",
  "not_completed_at_window_end",
] as const;

export type ExpiryRuleType = (typeof RULE_TYPES)[number];

export interface ExpiryScope {
  visit_type?: "periodic" | "follow_up" | "complaint";
  execution_mode?: "physical" | "virtual" | "administrative";
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface ExpiryRuleRow {
  id: string;
  rule_type: string;
  enabled: boolean;
  scope: ExpiryScope | null;
  offset_minutes: number;
  reason: string;
  notify_plan_creator: boolean;
  notify_inspector: boolean;
  version: number;
  effective_from: string;
  effective_to: string | null;
}
