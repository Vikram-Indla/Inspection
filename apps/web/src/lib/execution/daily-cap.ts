// TASK-EXECUTION-MODULE-001 · Phase 1 shared contracts
// SAQEEL-EXE-CANONICAL-PLAN v1.0 — one shared daily-cap service (D-001).
//
// The canonical calculation lives in the `inspector_daily_capacity` RPC so
// Planning publish and Pre-Execution enforce the SAME server-side number
// (wired in later phases). This module is only the typed client. The cap is
// business-supplied (default 10) and Admin-configurable via
// engine_settings.execution.daily_visit_cap — never hard-code a policy value
// at a call site.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Business-supplied default when engine_settings.execution is absent. */
export const DAILY_CAP_DEFAULT = 10;

export type InspectorDailyCapacity = {
  cap: number;       // configured maximum (engine_settings.execution.daily_visit_cap)
  used: number;      // scheduled, non-cancelled, non-completed visits for the date
  remaining: number; // max(cap - used, 0)
  allowed: boolean;  // used < cap
};

/**
 * Read the caller-visible daily capacity for an inspector on an Execution
 * Date (YYYY-MM-DD). The RPC itself enforces authorization: the caller must
 * be a planner, ops, or the inspector themself — anything else raises
 * insufficient_privilege and surfaces here as an error result.
 */
export async function getInspectorDailyCapacity(
  sb: SupabaseClient,
  inspectorId: string,
  date: string,
): Promise<{ capacity?: InspectorDailyCapacity; error?: string }> {
  const { data, error } = await sb.rpc("inspector_daily_capacity", {
    p_inspector: inspectorId,
    p_date: date,
  });
  if (error) {
    console.error("[inspector_daily_capacity]", error);
    return { error: error.message };
  }
  const row = (data ?? {}) as Partial<InspectorDailyCapacity>;
  return {
    capacity: {
      cap: typeof row.cap === "number" ? row.cap : DAILY_CAP_DEFAULT,
      used: typeof row.used === "number" ? row.used : 0,
      remaining: typeof row.remaining === "number" ? row.remaining : DAILY_CAP_DEFAULT,
      allowed: row.allowed === true,
    },
  };
}
