import { supabaseServer } from "@/lib/supabase-server";
import { readRows } from "@/lib/postgrest/read";
import { regulationLibraryRow } from "./shapes";

export type RegulationClause = {
  readonly id: string;
  readonly clause_ref: string | null;
  readonly title: string | null;
  readonly inspection_items: readonly { readonly id: string; readonly code: string | null }[] | null;
};

export type RegulationLibraryRow = {
  readonly entity_id: string;
  readonly code: string | null;
  readonly title: string | null;
  readonly issuing_authority: string | null;
  readonly version_label: string | null;
  readonly operational_status: string;
  readonly release_date: string | null;
  readonly published_at: string | null;
  readonly clauses: readonly RegulationClause[] | null;
  readonly clauses_status: "verified" | "verified_unknown";
};

export type RegulationCatalogue = {
  readonly rows: readonly RegulationLibraryRow[];
  readonly violationsByClause: ReadonlyMap<string, number>;
  readonly libraryReadable: boolean;
  readonly violationsReadable: boolean;
};

const LIBRARY_COLUMNS =
  "entity_id,code,title,issuing_authority,version_label,operational_status,release_date,published_at,clauses,clauses_status";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function countByClause(data: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  if (!Array.isArray(data)) return counts;
  for (const row of data) {
    if (!isRecord(row)) continue;
    const clauseId = row.clause_id;
    if (typeof clauseId !== "string") continue;
    counts.set(clauseId, (counts.get(clauseId) ?? 0) + 1);
  }
  return counts;
}

/**
 * The governed catalogue plus the violation footprint hanging off it.
 *
 * `violation_codes` attaches to a **clause**, not to a regulation, so the count
 * is assembled here rather than embedded — the library view is a union over two
 * sources and cannot carry the join.
 *
 * Each read reports its own success. A denied or failed read leaves its count
 * unknown, never zero: this screen's whole contract is that verified-zero and
 * unavailable stay distinct.
 */
export async function queryRegulationCatalogue(): Promise<RegulationCatalogue> {
  const sb = await supabaseServer();
  const [library, violations] = await Promise.all([
    sb.from("compliance_regulation_library").select(LIBRARY_COLUMNS).order("code"),
    sb.from("violation_codes").select("id, clause_id").not("clause_id", "is", null),
  ]);

  const libraryRead = readRows(library, regulationLibraryRow, "regulations.library");
  if (violations.error) console.error(`[regulations.catalogue] violation read failed: ${violations.error.message}`);

  return {
    rows: libraryRead.rows,
    violationsByClause: countByClause(violations.data),
    libraryReadable: !libraryRead.failed,
    violationsReadable: !violations.error,
  };
}
