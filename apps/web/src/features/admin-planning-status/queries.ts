import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { FALLBACK_STATES, FALLBACK_TRANSITIONS, type WorkflowTransition } from "./data";

type WorkflowPayload = {
  object?: string;
  states?: string[];
  transitions?: WorkflowTransition[];
};

export type PlanningStatusData = {
  states: readonly string[];
  transitions: readonly WorkflowTransition[];
  isFallback: boolean;
  readFailed: boolean;
  versionLabel: string | null;
  effectiveFrom: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asPayload(value: unknown): WorkflowPayload | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.states) || !Array.isArray(value.transitions)) return null;
  return value as WorkflowPayload;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function loadPlanningStatus(): Promise<PlanningStatusData> {
  const sb = await supabaseServer();

  const { data, error } = await sb
    .from("config_versions")
    .select("id, version_label, status, effective_from, payload")
    .eq("engine", "workflow")
    .eq("status", "published")
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) logProviderError("admin planning status read", error);

  const row = isRecord(data) ? data : null;
  const payload = asPayload(row?.payload);

  return {
    states: payload?.states ?? [...FALLBACK_STATES],
    transitions: payload?.transitions ?? FALLBACK_TRANSITIONS,
    isFallback: payload === null,
    readFailed: Boolean(error),
    versionLabel: row ? asString(row.version_label) : null,
    effectiveFrom: row ? asString(row.effective_from) : null,
  };
}
