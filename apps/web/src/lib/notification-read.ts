// PLAN v7 item 2 · MVP1-M03-001 · AC-0099
// Shared notification read-receipt semantics. `read_at` is authoritative;
// queued rows also retain the legacy delivery_state transition so the field
// inbox and platform bell remain compatible.

export type NotificationReadPatch = {
  read_at: string;
  delivery_state?: "read";
};

export function notificationReadPatch(deliveryState: string, readAt: string): NotificationReadPatch {
  const patch: NotificationReadPatch = { read_at: readAt };
  if (deliveryState === "queued") patch.delivery_state = "read";
  return patch;
}

export function isNotificationUnread(row: { read_at: string | null; delivery_state: string }): boolean {
  return !row.read_at && row.delivery_state !== "read" && row.delivery_state !== "handled";
}

export type NotificationPayloadEntry = { key: string; value: string };

function safePayloadValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "undefined") return "undefined";

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return "[unavailable]";
  }
}

// Notification payloads have event-specific shapes. Render only the keys that
// the stored JSON object actually contains; scalar/array/null payloads are
// treated as malformed and let the route show its explicit empty fallback.
export function notificationPayloadEntries(payload: unknown): NotificationPayloadEntry[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  return Object.entries(payload as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: safePayloadValue(value),
  }));
}
