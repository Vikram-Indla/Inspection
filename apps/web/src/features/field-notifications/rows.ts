import type { FieldNotificationRow } from "@/lib/field-notifications";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function unwrap(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

export function notificationVisitIds(rows: readonly FieldNotificationRow[]): string[] {
  return Array.from(new Set(rows
    .map(row => (typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null))
    .filter((id): id is string => id !== null)));
}

export function toVisitNames(value: unknown): Record<string, string> {
  const names: Record<string, string> = {};
  if (!Array.isArray(value)) return names;
  for (const row of value) {
    if (!isRecord(row)) continue;
    const id = asString(row.id);
    const factory = unwrap(row.factories);
    const name = isRecord(factory) ? asString(factory.name) : null;
    if (id !== null && name !== null) names[id] = name;
  }
  return names;
}
