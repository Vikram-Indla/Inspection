import { notificationHref } from "@/lib/notification-read";

export type FieldNotificationRow = {
  id: string;
  event_key: string;
  payload: Record<string, unknown> | null;
  channel: string;
  delivery_state: string;
  read_at: string | null;
  created_at: string;
};

export type AssignmentNoticeKind =
  | "assigned"
  | "reassigned"
  | "released"
  | "cancelled"
  | "rescheduled"
  | "expired"
  | "other";

export function assignmentNoticeKind(row: Pick<FieldNotificationRow, "event_key" | "payload">): AssignmentNoticeKind {
  if (row.event_key === "visit_cancelled") return "cancelled";
  if (row.event_key === "visit_rescheduled" || row.event_key === "reschedule") return "rescheduled";
  if (row.event_key === "visit_expired") return "expired";
  if (row.event_key !== "assignment") return "other";
  if (row.payload?.released === true) return "released";
  if (row.payload?.reassigned === true) return "reassigned";
  return "assigned";
}

export function fieldNotificationHref(row: Pick<FieldNotificationRow, "id" | "event_key" | "payload">): string {
  // A released inspector is intentionally no longer guaranteed visit access.
  // Keep the notification available without routing into an RLS-scoped 404.
  if (assignmentNoticeKind(row) === "released") return `/field/notifications/${encodeURIComponent(row.id)}`;
  return notificationHref(row.event_key, row.payload, true)
    ?? `/field/notifications/${encodeURIComponent(row.id)}`;
}

export type FieldNotificationCache = {
  userId: string;
  cachedAt: string;
  rows: FieldNotificationRow[];
  visitNames: Record<string, string>;
};

export function fieldNotificationCacheKey(userId: string): string {
  return `mim-field-notifications-v1:${userId}`;
}

export function parseFieldNotificationCache(raw: string | null, userId: string): FieldNotificationCache | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<FieldNotificationCache>;
    if (value.userId !== userId || typeof value.cachedAt !== "string" || !Array.isArray(value.rows)) return null;
    if (!value.rows.every(row => row && typeof row.id === "string" && typeof row.event_key === "string")) return null;
    return {
      userId,
      cachedAt: value.cachedAt,
      rows: value.rows as FieldNotificationRow[],
      visitNames: value.visitNames && typeof value.visitNames === "object"
        ? value.visitNames as Record<string, string>
        : {},
    };
  } catch {
    return null;
  }
}
