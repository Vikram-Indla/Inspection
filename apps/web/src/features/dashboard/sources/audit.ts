import type { AuditRow } from "@/app/(app)/dashboard/metrics";
import { readRows } from "@/lib/postgrest/read";
import type { Collected } from "./paginate";
import type { DashboardClient } from "./client-type";
import { auditRow } from "./shapes";

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
  fromIso: string | null,
  toIso: string | null,
): Promise<Collected<AuditRow>> {
  const ids = [...new Set(objectIds)];
  if (!ids.length) return { rows: [], failed: false, reason: null };
  // A null end is unbounded, so its predicate is omitted rather than widened to
  // some far-off date — an invented bound is a governed value from thin air.
  const responses = await Promise.all(chunk(ids).map(group => {
    const selected = sb.from("audit_events")
      .select("id, object_type, object_id, action, requirement_refs, occurred_at")
      .in("object_id", group);
    const lowerBounded = fromIso ? selected.gte("occurred_at", fromIso) : selected;
    const windowed = toIso ? lowerBounded.lte("occurred_at", toIso) : lowerBounded;
    return windowed
      .order("occurred_at", { ascending: false })
      .limit(TIMELINE_LIMIT);
  }));
  const results = responses.map(response => readRows(response, auditRow, "dashboard.audit_events"));
  if (results.some(result => result.failed)) return { rows: [], failed: true, reason: null };
  return {
    rows: results.flatMap(result => result.rows)
      .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
      .slice(0, TIMELINE_LIMIT),
    failed: false,
    reason: null,
  };
}
