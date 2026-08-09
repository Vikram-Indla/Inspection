import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { RegulationCatalogue, RegulationLibraryRow } from "./queries";
import { UNRECORDED_AUTHORITY, type RegulationScope } from "./params";

export type RegulationFootprint = number | "unknown";

export type RegulationRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly authority: string | null;
  readonly versionLabel: string;
  readonly status: string;
  readonly tone: StatusTone;
  readonly clauses: RegulationFootprint;
  readonly items: RegulationFootprint;
  readonly violations: RegulationFootprint;
  readonly publishedAt: string | null;
  readonly incomplete: boolean;
};

export type RegulationAuthority = {
  readonly key: string;
  readonly label: string | null;
  readonly count: number;
};

export type RegulationStatusCount = {
  readonly key: string;
  readonly count: number;
};

const TONES: Readonly<Record<string, StatusTone>> = {
  active: "success",
  scheduled: "warning",
  draft: "neutral",
  locked: "info",
  deactivated: "danger",
};

/**
 * A regulation's footprint is only ever a verified number or `unknown`. The
 * library view reports `verified_unknown` when it could not resolve the clause
 * payload, and a failed violation read leaves that count unknown for every row
 * — in neither case may the screen print a zero.
 */
function footprintOf(row: RegulationLibraryRow, catalogue: RegulationCatalogue) {
  const clauses = row.clauses;
  if (row.clauses_status === "verified_unknown" || !Array.isArray(clauses)) {
    return { clauses: "unknown" as const, items: "unknown" as const, violations: "unknown" as const };
  }

  let items = 0;
  let itemsUnknown = false;
  let violations = 0;
  for (const clause of clauses) {
    if (Array.isArray(clause.inspection_items)) items += clause.inspection_items.length;
    else itemsUnknown = true;
    violations += catalogue.violationsByClause.get(clause.id) ?? 0;
  }

  return {
    clauses: clauses.length,
    items: itemsUnknown ? ("unknown" as const) : items,
    violations: catalogue.violationsReadable ? violations : ("unknown" as const),
  };
}

export function toRegulationRow(row: RegulationLibraryRow, catalogue: RegulationCatalogue): RegulationRow {
  const footprint = footprintOf(row, catalogue);
  return {
    id: row.entity_id,
    code: row.code ?? "",
    title: row.title ?? "",
    authority: row.issuing_authority,
    versionLabel: row.version_label ?? "",
    status: row.operational_status,
    tone: TONES[row.operational_status] ?? "neutral",
    clauses: footprint.clauses,
    items: footprint.items,
    violations: footprint.violations,
    publishedAt: row.published_at ?? row.release_date,
    incomplete: row.operational_status !== "deactivated" && footprint.clauses === 0,
  };
}

export const authorityKeyOf = (row: RegulationRow) => row.authority?.trim() || UNRECORDED_AUTHORITY;

/**
 * Authorities come from the recorded text — there is no authority registry to
 * join against. A regulation with no recorded authority gets its own group
 * rather than being folded into a literal "Other", which is indistinguishable
 * from an authority actually named Other.
 */
export function authoritiesOf(rows: readonly RegulationRow[]): readonly RegulationAuthority[] {
  const groups = new Map<string, RegulationAuthority>();
  for (const row of rows) {
    const key = authorityKeyOf(row);
    groups.set(key, {
      key,
      label: key === UNRECORDED_AUTHORITY ? null : key,
      count: (groups.get(key)?.count ?? 0) + 1,
    });
  }
  return [...groups.values()].sort((a, b) =>
    a.label === null ? 1 : b.label === null ? -1 : a.label.localeCompare(b.label));
}

/**
 * The status chips are derived from what the library actually contains, not
 * from a fixed list — the view can emit `draft` and `locked` alongside the
 * three lifecycle states, and a chip for a state nothing is in is noise.
 */
export function statusCountsOf(rows: readonly RegulationRow[]): readonly RegulationStatusCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return [
    { key: "", count: rows.length },
    ...[...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => ({ key, count })),
  ];
}

export function filterRegulations(rows: readonly RegulationRow[], scope: RegulationScope): readonly RegulationRow[] {
  const needle = scope.search.toLowerCase();
  return rows.filter(row => {
    if (scope.status && row.status !== scope.status) return false;
    if (scope.authority && authorityKeyOf(row) !== scope.authority) return false;
    if (!needle) return true;
    return `${row.code} ${row.title} ${row.authority ?? ""}`.toLowerCase().includes(needle);
  });
}
