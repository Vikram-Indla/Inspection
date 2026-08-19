export type WorkflowTransition = {
  id?: string;
  from?: string;
  to?: string;
  actor?: string;
  guard?: string;
  terminal?: boolean;
  side_effects?: string[];
};

export const FALLBACK_STATES = ["planned", "acknowledged", "in_execution", "completed", "closed"] as const;

export const FALLBACK_TRANSITIONS: readonly WorkflowTransition[] = [
  { id: "STM-PLAN-002", from: "planned", to: "acknowledged", actor: "inspector" },
  { id: "STM-VIS-001", from: "acknowledged", to: "in_execution", actor: "inspector" },
  { id: "STM-VIS-002", from: "in_execution", to: "completed", actor: "inspector" },
  { id: "STM-VIS-003", from: "completed", to: "closed", actor: "planner" },
  { id: "republish", from: "any", to: "planned", actor: "planner" },
];

export const PLANNING_CAPABILITIES = [
  { capability: "planning.publish", key: "publish" },
  { capability: "planning.manage", key: "manage" },
  { capability: "planning.cancel", key: "cancel" },
  { capability: "planning.reassign", key: "reassign" },
  { capability: "planning.reschedule", key: "reschedule" },
] as const;
