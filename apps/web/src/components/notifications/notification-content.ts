import { fill } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import type { NotificationRecord, VisitContext } from "./notification-feed";

export type NotificationContent = {
  subject: string | null;
  meta: string | null;
  detail: string | null;
};

type ContextLabels = { reason: string; decision: string };

function payloadString(payload: Record<string, unknown> | null, key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value ? value : null;
}

export function eventLabel(labels: Readonly<Record<string, string>>, eventKey: string): string {
  return labels[eventKey] ?? humaniseEnum(eventKey);
}

export function notificationContent(
  row: NotificationRecord,
  contexts: Readonly<Record<string, VisitContext>>,
  labels: ContextLabels,
): NotificationContent {
  const visitId = payloadString(row.payload, "visit_id");
  const context = visitId ? contexts[visitId] : undefined;
  const reason = payloadString(row.payload, "reason");
  const decision = payloadString(row.payload, "decision");
  const detail = reason
    ? fill(labels.reason, { value: reason })
    : decision
      ? fill(labels.decision, { value: decision })
      : null;

  if (context) {
    return {
      subject: context.factory,
      meta: [context.region, context.reference].filter(Boolean).join(" · ") || null,
      detail,
    };
  }
  return { subject: payloadString(row.payload, "factory"), meta: null, detail };
}
