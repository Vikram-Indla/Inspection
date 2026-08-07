import type { AuditRow } from "@/app/(app)/dashboard/metrics";
import type { Collected, SourcePage } from "./paginate";
import type { DashboardClient } from "./client-type";

const CHUNK_SIZE = 80;
const TIMELINE_LIMIT = 12;

function chunk(ids: readonly string[]): string[][] {
  return Array.from(
    { length: Math.ceil(ids.length / CHUNK_SIZE) },
    (_, index) => ids.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );
}

export async function loadLatestAudit(
  sb: DashboardClient,
  objectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<Collected<AuditRow>> {
  const ids = [...new Set(objectIds)];
  if (!ids.length) return { rows: [], failed: false };
  const results = await Promise.all(chunk(ids).map(group => sb.from("audit_events")
    .select("id, object_type, object_id, action, requirement_refs, occurred_at")
    .in("object_id", group)
    .gte("occurred_at", fromIso)
    .lte("occurred_at", toIso)
    .order("occurred_at", { ascending: false })
    .limit(TIMELINE_LIMIT) as unknown as PromiseLike<SourcePage<AuditRow>>));
  if (results.some(result => result.error)) return { rows: [], failed: true };
  return {
    rows: results.flatMap(result => result.data ?? [])
      .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
      .slice(0, TIMELINE_LIMIT),
    failed: false,
  };
}
