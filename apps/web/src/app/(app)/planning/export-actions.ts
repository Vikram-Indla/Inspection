"use server";
// PLN-REQ-017 — Planning CSV export. Capability-gated (planning.export) and
// backed by the SAME canonical query as the on-screen list, so the export is
// exactly the authorized filtered result set (capped at 5000 rows). Columns
// without a backing field (CR Name, Plant Number — the factories table only
// carries license_number at plant level) export as EMPTY CELLS; no value is
// ever fabricated. Errors return neutral codes — provider text stays
// server-side (parity with the CD-026 outcome-ledger rule).

import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { queryPlanningVisits, fetchLastUpdates, type PlanningListParams, type PlanningVisitRow } from "@/lib/planning/visit-list";

const PLANNING_EXPORT_CAP = 5000;

const HEADERS = [
  "Visit Reference", "Planning Type", "Planning Status", "Operational State",
  "Visit Type", "Visit Mode", "Priority", "CR Number", "CR Name",
  "Licence Number", "Plant Number", "Factory Name", "Region", "City",
  "Assigned Inspector", "Visit Window Start", "Visit Window End",
  "Execution Date", "Report Packages", "Created By", "Created Date",
  "Source Channel", "Return Status", "Bulk Plan Reference", "Last Update",
] as const;

export type PlanningExportResult =
  | { ok: true; filename: string; csv: string; rowCount: number; capped: boolean }
  | { ok: false; error: "unauthorized" | "unavailable" };

const BOM = "﻿";
const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
const cell = (v: string | null | undefined) => v ?? "";

function toCsvRow(row: PlanningVisitRow, lastUpdate: string | undefined): string[] {
  return [
    cell(row.visitReference ?? row.id),
    row.method,
    row.planningStatus,
    row.operationalState.replace(/_/g, " "),
    row.visitType,
    row.executionMode,
    cell(row.priority),
    cell(row.crNumber),
    "",                              // CR Name — no backing field in the schema
    cell(row.licenseNumber),
    "",                              // Plant Number — no backing field in the schema
    cell(row.factoryName),
    cell(row.region),
    cell(row.city),
    cell(row.inspectorName),
    row.windowStart,
    row.windowEnd,
    cell(row.executionDate),
    row.packageTitles.join("; "),
    cell(row.createdBy),
    row.createdAt,
    cell(row.sourceChannel),
    cell(row.returnReason ?? (row.planningStatus === "returned" ? "returned" : null)),
    row.method === "bulk" ? cell(row.planReference) : "",
    cell(lastUpdate),
  ];
}

export async function exportPlanningVisitsCsv(params: PlanningListParams): Promise<PlanningExportResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: allowed, error: capError } = await sb.rpc("has_planning_capability", { p_capability: "planning.export" });
  if (capError) {
    console.error("[planning.export] capability check failed:", capError.message);
    return { ok: false, error: "unavailable" };
  }
  if (allowed !== true) return { ok: false, error: "unauthorized" };

  const result = await queryPlanningVisits(sb, { ...params, page: 1, pageSize: PLANNING_EXPORT_CAP });
  if (!result.ok) return { ok: false, error: "unavailable" };

  const lastUpdates = await fetchLastUpdates(sb, result.rows.map(r => r.id));
  const lines = [
    HEADERS.map(esc).join(","),
    ...result.rows.map(row => toCsvRow(row, lastUpdates[row.id]).map(esc).join(",")),
  ];
  // BOM keeps Arabic factory/inspector names intact in Excel; CRLF for Excel parity.
  const csv = BOM + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    filename: `planning-visits-${stamp}.csv`,
    csv,
    rowCount: result.rows.length,
    capped: result.total > result.rows.length,
  };
}
