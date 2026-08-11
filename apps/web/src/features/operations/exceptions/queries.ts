import type { Shape } from "@/lib/postgrest/shape";
import { readRows } from "@/lib/postgrest/read";
import { supabaseServer } from "@/lib/supabase-server";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import type { ExceptionSource } from "@/lib/operations/exceptions";

const MODES = ["off", "on"] as const;

type CaseRow = { id: string; status: string; opened_at: string };
type RiskExceptionRow = { id: string; status: string; created_at: string };

const caseRow: Shape<CaseRow> = f => ({
  id: f.text("id"),
  status: f.text("status"),
  opened_at: f.text("opened_at"),
});

const riskExceptionRow: Shape<RiskExceptionRow> = f => ({
  id: f.text("id"),
  status: f.text("status"),
  created_at: f.text("created_at"),
});

export type ExceptionBoardResult =
  | { kind: "disabled" }
  | { kind: "ready"; sources: ExceptionSource[]; degraded: boolean };

export async function loadExceptionBoard(): Promise<ExceptionBoardResult> {
  if (resolveFeatureFlag(process.env.FEATURE_EXCEPTION_BOARD, MODES, "on") !== "on") {
    return { kind: "disabled" };
  }
  const sb = await supabaseServer();
  const [cases, riskExceptions] = await Promise.all([
    sb.from("cases").select("id, status, opened_at").in("status", ["open", "in_progress"])
      .then(response => readRows(response, caseRow, "operations.exceptions.cases")),
    sb.from("risk_exceptions").select("id, status, created_at").eq("status", "open")
      .then(response => readRows(response, riskExceptionRow, "operations.exceptions.risk_exceptions")),
  ]);
  const sources: ExceptionSource[] = [
    ...cases.rows.map(row => ({
      id: `case:${row.id}`, category: "correction_overdue" as const,
      branch: null, ref: row.id, occurredAt: row.opened_at,
    })),
    ...riskExceptions.rows.map(row => ({
      id: `rex:${row.id}`, category: "review_overdue" as const,
      branch: null, ref: row.id, occurredAt: row.created_at,
    })),
  ];
  return { kind: "ready", sources, degraded: cases.failed || riskExceptions.failed };
}
