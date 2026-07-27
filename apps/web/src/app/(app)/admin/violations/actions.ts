"use server";

import { supabaseServer } from "@/lib/supabase-server";

export type VioResult = { error?: "ccr_required"; ok?: boolean };
export type ViolationUsage = { item_count: number; runtime_count: number };

const CCR_REQUIRED = "ccr_required" as const;

export async function getViolationUsage(codeValue: string): Promise<ViolationUsage | null> {
  if (!codeValue) return null;
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("violation_code_usage", { p_code: codeValue });
  if (error || !data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  return {
    item_count: Number(row.item_count ?? 0),
    runtime_count: Number(row.runtime_count ?? 0),
  };
}

// Compliance.docx requires every violation/penalty create or modify operation
// to use the governed Compliance Configuration Request lifecycle. Direct
// activation/deactivation also needs an atomic dependency cascade. These
// server-side guards remain authoritative even if a stale client exposes an
// old form.
export async function createViolationCode(_: VioResult, _formData: FormData): Promise<VioResult> {
  return { error: CCR_REQUIRED };
}

export async function deactivateViolationCode(_: VioResult, _formData: FormData): Promise<VioResult> {
  return { error: CCR_REQUIRED };
}

export async function publishViolationCode(_: VioResult, _formData: FormData): Promise<VioResult> {
  return { error: CCR_REQUIRED };
}

export async function createPenaltyMapping(_: VioResult, _formData: FormData): Promise<VioResult> {
  return { error: CCR_REQUIRED };
}

export async function publishPenaltyMapping(_: VioResult, _formData: FormData): Promise<VioResult> {
  return { error: CCR_REQUIRED };
}
