"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";

export type OperationsResult = { ok?: boolean; error?: string; notice?: string };

type OpsRpc = "mvp3_request_error_retry" | "mvp3_publish_feature_flag";

function mapError(rpc: OpsRpc, error: { message?: string; code?: string }): string {
  logProviderError(`admin ${rpc}`, error);
  const message = String(error.message ?? "");
  if (error.code === "42501" || message.includes("not authorized")) return "not_authorized";
  if (message.includes("maker cannot approve own flag")) return "maker_checker";
  if (message.includes("flag is not a draft")) return "not_draft";
  if (message.includes("error is not retryable")) return "not_retryable";
  return "write_failed";
}

async function callRpc(rpc: OpsRpc, params: Record<string, string>): Promise<OperationsResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError || !user) return { error: "session_expired" };
  const { error } = await sb.rpc(rpc, params);
  if (error) return { error: mapError(rpc, error) };
  return { ok: true };
}

export async function requestRetry(_: OperationsResult, data: FormData): Promise<OperationsResult> {
  const errorId = String(data.get("errorId") ?? "").trim();
  if (!errorId) return { error: "missing_error" };
  const result = await callRpc("mvp3_request_error_retry", { p_error_id: errorId });
  if (result.error) return result;
  revalidatePath("/admin/operations");
  return { ok: true, notice: "retry_requested_ok" };
}

export async function publishFlag(_: OperationsResult, data: FormData): Promise<OperationsResult> {
  const flagId = String(data.get("flagId") ?? "").trim();
  if (!flagId) return { error: "missing_flag" };
  const result = await callRpc("mvp3_publish_feature_flag", { p_flag_id: flagId });
  if (result.error) return result;
  revalidatePath("/admin/operations");
  return { ok: true, notice: "flag_published_ok" };
}
