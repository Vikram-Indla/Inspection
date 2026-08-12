import type { CancelFormStrings } from "./cancel-form";
import type { ReassignFormStrings } from "./reassign-form";
import type { RepackageFormStrings } from "./repackage-form";
import type { RescheduleFormStrings } from "./reschedule-form";
import type { ReturnFormStrings } from "./return-form";
import type { TransitionIdentity } from "./transition-fields";
import type { VisitTypeFormStrings } from "./visit-type-form";

export type VisitActionsStrings = {
  heading: string;
  hint: string;
  cutoffTitle: string;
  cutoffBody: string;
  zoneAvailable: string;
  zoneBlocked: string;
  zoneUnavailable: string;
  scheduleLockedActions: string;
  scheduleLockedWhy: string;
  reassignLockedWhy: string;
  noneAvailable: string;
  republishBtn: string;
  duplicateBtn: string;
  duplicateWhy: string;
  finalState: string;
  returnForm: ReturnFormStrings;
  reassignForm: ReassignFormStrings;
  visitTypeForm: VisitTypeFormStrings;
  rescheduleForm: RescheduleFormStrings;
  cancelForm: CancelFormStrings;
  repackageForm: RepackageFormStrings;
};

export type TransitionKey =
  | "return" | "republish" | "reassign" | "metadata"
  | "reschedule" | "cancel" | "repackage" | "duplicate";

const TRANSITIONS: readonly TransitionKey[] = [
  "return", "republish", "reassign", "metadata",
  "reschedule", "cancel", "repackage", "duplicate",
];

export function mintIdentityPerTransition(): Record<TransitionKey, TransitionIdentity> {
  const entries = TRANSITIONS.map(key => [key, {
    idempotencyKey: `visit.${key}.${crypto.randomUUID()}`,
    correlationId: crypto.randomUUID(),
  }] as const);
  return Object.fromEntries(entries) as Record<TransitionKey, TransitionIdentity>;
}
