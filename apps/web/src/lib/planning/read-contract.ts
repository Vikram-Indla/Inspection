import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanningReadSurface = "single" | "visit_detail";

export type PlanningPackageOption = {
  id: string;
  version_label: string;
  packages: { code: string; title: string };
};

export type PlanningInspectorOption = {
  user_id: string;
  full_name: string;
};

export type PlanningSingleReadData = {
  packages: PlanningPackageOption[];
  inspectors: PlanningInspectorOption[];
  virtual_eligible: boolean;
  can_submit_for_supervision: boolean;
};

export type PlanningReadFailureKind =
  | "authentication"
  | "denied"
  | "not_found"
  | "contract_gap";

export type PlanningReadFailure = {
  ok: false;
  kind: PlanningReadFailureKind;
  code: string;
  correlationId: string;
};

export type PlanningReadSuccess<T> = {
  ok: true;
  correlationId: string;
  data: T;
};

export type PlanningReadResult<T> = PlanningReadSuccess<T> | PlanningReadFailure;

type ContractPayload = {
  ok?: unknown;
  code?: unknown;
  correlation_id?: unknown;
  dependency?: unknown;
  sqlstate?: unknown;
  data?: unknown;
};

function failure(
  kind: PlanningReadFailureKind,
  code: string,
  correlationId: string = randomUUID(),
): PlanningReadFailure {
  return { ok: false, kind, code, correlationId };
}

export function planningAuthenticationFailure(): PlanningReadFailure {
  return failure("authentication", "PLN-READ-SESSION");
}

export function planningDependencyFailure(correlationId?: string): PlanningReadFailure {
  return failure("contract_gap", "PLN-READ-DEPENDENCY", correlationId);
}

/**
 * Canonical Planner read boundary.
 *
 * The RPC is SECURITY INVOKER, so the caller's table grants and RLS remain the
 * authority. This adapter validates the response shape, emits the raw provider
 * detail only to the server log with a correlation id, and returns stable safe
 * states to UI callers.
 */
export async function getPlanningReadContract<T>(
  sb: SupabaseClient,
  surface: PlanningReadSurface,
  visitId: string | null = null,
): Promise<PlanningReadResult<T>> {
  const correlationId = randomUUID();
  const { data, error } = await sb.rpc("planning_read_contract", {
    p_surface: surface,
    p_visit_id: visitId,
    p_correlation_id: correlationId,
  });

  if (error) {
    const code = error.code === "42501"
      ? "PLN-READ-GRANT"
      : error.code === "PGRST202" || error.code === "42883"
        ? "PLN-READ-CONTRACT-MISSING"
        : "PLN-READ-DEPENDENCY";
    console.error(
      `[planning.read:${correlationId}] ${surface} RPC failed`,
      { providerCode: error.code ?? null, message: error.message },
    );
    return failure("contract_gap", code, correlationId);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.error(`[planning.read:${correlationId}] ${surface} returned an invalid response shape`);
    return failure("contract_gap", "PLN-READ-CONTRACT-SHAPE", correlationId);
  }

  const payload = data as ContractPayload;
  const returnedCorrelation = typeof payload.correlation_id === "string"
    ? payload.correlation_id
    : correlationId;

  if (payload.ok === true && payload.data && typeof payload.data === "object") {
    return { ok: true, correlationId: returnedCorrelation, data: payload.data as T };
  }

  const code = typeof payload.code === "string" ? payload.code : "PLN-READ-CONTRACT-SHAPE";
  if (payload.dependency || payload.sqlstate) {
    console.error(
      `[planning.read:${returnedCorrelation}] ${surface} contract gap`,
      { code, dependency: payload.dependency ?? null, sqlstate: payload.sqlstate ?? null },
    );
  }
  if (code === "PLN-READ-AUTH-REQUIRED") {
    return failure("authentication", code, returnedCorrelation);
  }
  if (code === "PLN-READ-DENIED") {
    return failure("denied", code, returnedCorrelation);
  }
  if (code === "PLN-READ-NOT-AVAILABLE") {
    return failure("not_found", code, returnedCorrelation);
  }
  return failure("contract_gap", code, returnedCorrelation);
}
