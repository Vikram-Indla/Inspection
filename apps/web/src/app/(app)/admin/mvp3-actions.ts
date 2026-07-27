"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type Mvp3ActionState = { ok: boolean; message: string };

const id = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

type Mvp3Rpc =
  | "mvp3_request_error_retry"
  | "mvp3_publish_feature_flag"
  | "mvp3_decide_access_review"
  | "mvp3_issue_device_command";

function mapMvp3Error(rpc: Mvp3Rpc, error: { message?: string; code?: string }): string {
  logProviderError(`admin ${rpc}`, error);
  const message = String(error.message ?? "");
  if (error.code === "42501" || message.includes("not authorized")) {
    return "You do not have permission to perform this action.";
  }
  if (message.includes("maker cannot approve own flag")) {
    return "A different security administrator must publish this feature flag.";
  }
  if (message.includes("flag is not a draft")) {
    return "The feature flag changed or is no longer a draft. Reload and try again.";
  }
  if (message.includes("error is not retryable")) {
    return "This error changed or is no longer retryable. Reload and try again.";
  }
  if (message.includes("subject cannot review own access")) {
    return "You cannot decide your own access review. Another security administrator must decide it.";
  }
  if (message.includes("review is not open")) {
    return "The access review changed or is no longer open. Reload and try again.";
  }
  if (message.includes("device not found")) {
    return "The device no longer exists or is outside your scope.";
  }
  if (message.includes("invalid decision or reason") || message.includes("invalid command or reason")) {
    return "The requested action or reason is invalid. Nothing was changed.";
  }
  return NEUTRAL_WRITE_ERROR;
}

async function callMvp3Rpc(
  rpc: Mvp3Rpc,
  params: Record<string, string>,
): Promise<Mvp3ActionState> {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError || !user) return { ok: false, message: "Your session has ended. Sign in again." };
  const { error } = await sb.rpc(rpc, params);
  if (error) return { ok: false, message: mapMvp3Error(rpc, error) };
  return { ok: true, message: "" };
}

export async function requestErrorRetry(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const errorId = id(data, "errorId");
  if (!errorId) return { ok: false, message: "Missing error record." };
  const result = await callMvp3Rpc("mvp3_request_error_retry", { p_error_id: errorId });
  if (!result.ok) return result;
  revalidatePath("/admin/operations");
  return { ok: true, message: "Retry requested. Delivery is not claimed until a receipt exists." };
}

export async function publishFeatureFlag(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const flagId = id(data, "flagId");
  if (!flagId) return { ok: false, message: "Missing feature flag." };
  const result = await callMvp3Rpc("mvp3_publish_feature_flag", { p_flag_id: flagId });
  if (!result.ok) return result;
  revalidatePath("/admin/operations");
  return { ok: true, message: "Feature flag published by an independent approver." };
}

export async function decideAccessReview(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const reviewId = id(data, "reviewId");
  const decision = id(data, "decision");
  const reason = id(data, "reason");
  if (!reviewId || !["retain", "revoke"].includes(decision) || reason.length < 8) {
    return { ok: false, message: "Select a decision and provide a meaningful reason." };
  }
  const result = await callMvp3Rpc("mvp3_decide_access_review", {
    p_review_id: reviewId, p_decision: decision, p_reason: reason,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/security-access");
  return { ok: true, message: "Access review decision recorded with actor and timestamp." };
}

export async function issueDeviceCommand(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const deviceId = id(data, "deviceId");
  const command = id(data, "command");
  const reason = id(data, "reason");
  if (!deviceId || !["suspend", "resume", "remote_wipe", "expire_packages"].includes(command) || reason.length < 8) {
    return { ok: false, message: "Select a governed command and provide a meaningful reason." };
  }
  const result = await callMvp3Rpc("mvp3_issue_device_command", {
    p_device_id: deviceId, p_command: command, p_reason: reason,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/devices");
  return { ok: true, message: "Command queued. Completion awaits a genuine device acknowledgement." };
}
