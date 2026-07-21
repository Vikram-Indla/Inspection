"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type Mvp3ActionState = { ok: boolean; message: string };

const id = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function requestErrorRetry(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const errorId = id(data, "errorId");
  if (!errorId) return { ok: false, message: "Missing error record." };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("mvp3_request_error_retry", { p_error_id: errorId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/operations");
  return { ok: true, message: "Retry requested. Delivery is not claimed until a receipt exists." };
}

export async function publishFeatureFlag(_: Mvp3ActionState, data: FormData): Promise<Mvp3ActionState> {
  const flagId = id(data, "flagId");
  if (!flagId) return { ok: false, message: "Missing feature flag." };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("mvp3_publish_feature_flag", { p_flag_id: flagId });
  if (error) return { ok: false, message: error.message };
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
  const sb = await supabaseServer();
  const { error } = await sb.rpc("mvp3_decide_access_review", {
    p_review_id: reviewId, p_decision: decision, p_reason: reason,
  });
  if (error) return { ok: false, message: error.message };
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
  const sb = await supabaseServer();
  const { error } = await sb.rpc("mvp3_issue_device_command", {
    p_device_id: deviceId, p_command: command, p_reason: reason,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/devices");
  return { ok: true, message: "Command queued. Completion awaits a genuine device acknowledgement." };
}
