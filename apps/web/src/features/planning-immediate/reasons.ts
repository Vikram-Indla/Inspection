import type { ImmediateMessages } from "./strings";

export const OTHER_URGENCY_REASON = "Other";

const RECORDED_REASONS = [
  "Complaint received",
  "Incident / accident report",
  "Referral from authority",
  OTHER_URGENCY_REASON,
] as const;

export type UrgencyReason = (typeof RECORDED_REASONS)[number];

export type UrgencyReasonOption = {
  readonly value: UrgencyReason;
  readonly label: string;
};

export function urgencyReasonOptions(messages: ImmediateMessages): readonly UrgencyReasonOption[] {
  const { reason } = messages;
  const labels: Readonly<Record<UrgencyReason, string>> = {
    "Complaint received": reason.complaint,
    "Incident / accident report": reason.incident,
    "Referral from authority": reason.referral,
    Other: reason.other,
  };
  return RECORDED_REASONS.map(value => ({ value, label: labels[value] }));
}

export function urgencyReasonLabel(value: string, messages: ImmediateMessages): string {
  return urgencyReasonOptions(messages).find(option => option.value === value)?.label ?? value;
}

export function urgencyReasonSatisfied(value: string, notes: string): boolean {
  return value !== "" && (value !== OTHER_URGENCY_REASON || notes.trim() !== "");
}
