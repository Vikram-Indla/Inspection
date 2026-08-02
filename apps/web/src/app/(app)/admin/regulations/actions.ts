"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type RegResult = { error?: string; ok?: boolean };
export type RegulationLifecycleResult = RegResult & {
  errorCode?: "missing_reference" | "reason_required" | "denied" | "not_found" | "provider";
  operationalStatus?: string;
  idempotent?: boolean;
  cascaded?: { inspection_items: number; violations: number; penalties: number };
  childrenReactivated?: boolean;
};

async function regulationLifecycle(
  operation: "activate_regulation" | "deactivate_regulation",
  formData: FormData,
): Promise<RegulationLifecycleResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { errorCode: "denied" };
  const sb = await supabaseServer();
  const id = String(formData.get("entity_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) return { errorCode: "missing_reference" };
  if (!reason) return { errorCode: "reason_required" };
  const { data, error } = await sb.rpc(operation, {
    p_entity_id: id,
    p_reason: reason,
  });
  if (error) {
    logProviderError(`admin regulation ${operation}`, error);
    const message = String(error.message ?? "");
    if (message.includes("REGULATION-LIFECYCLE-DENIED")) return { errorCode: "denied" };
    if (message.includes("REGULATION-LIFECYCLE-REASON")) return { errorCode: "reason_required" };
    if (message.includes("REGULATION-LIFECYCLE-NOT-FOUND")) return { errorCode: "not_found" };
    return { error: NEUTRAL_WRITE_ERROR, errorCode: "provider" };
  }
  revalidatePath("/admin/regulations");
  revalidatePath("/admin/items");
  revalidatePath("/admin/packages");
  const result = (data ?? {}) as {
    operational_status?: string;
    idempotent?: boolean;
    cascaded?: { inspection_items?: number; violations?: number; penalties?: number };
    children_reactivated?: boolean;
  };
  return {
    ok: true,
    operationalStatus: result.operational_status,
    idempotent: result.idempotent === true,
    cascaded: {
      inspection_items: result.cascaded?.inspection_items ?? 0,
      violations: result.cascaded?.violations ?? 0,
      penalties: result.cascaded?.penalties ?? 0,
    },
    childrenReactivated: result.children_reactivated === true,
  };
}

export async function activateRegulation(_: RegulationLifecycleResult, formData: FormData): Promise<RegulationLifecycleResult> {
  return regulationLifecycle("activate_regulation", formData);
}

export async function deactivateRegulation(_: RegulationLifecycleResult, formData: FormData): Promise<RegulationLifecycleResult> {
  return regulationLifecycle("deactivate_regulation", formData);
}
