"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type DashConfigActionResult = { ok?: boolean; error?: string; id?: string };

const PATH = "/admin/dashboard-config";

function databaseMessage(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  const known: Array<[string, string]> = [
    ["DASH_NOT_AUTHORIZED", "Your role cannot draft dashboard configuration."],
    ["DASH_REVIEW_NOT_AUTHORIZED", "A reviewer role is required."],
    ["DASH_PUBLISH_NOT_AUTHORIZED", "A reviewer role is required to publish."],
    ["DASH_MAKER_CHECKER", "The draft owner cannot review or publish their own configuration."],
    ["DASH_COMMENT_REQUIRED", "A reason is required to return a draft."],
    ["DASH_PAYLOAD_REQUIRED", "The configuration payload must be a JSON object."],
    ["DASH_NOT_EDITABLE", "Only draft or returned configuration can be edited."],
    ["DASH_NOT_SUBMITTABLE", "This configuration is not in a submittable state."],
    ["DASH_NOT_PUBLISHABLE", "Only a pending-review configuration can be published."],
    ["DASH_NOT_RETURNABLE", "Only a pending-review configuration can be returned."],
    ["DASH_NOT_FOUND", "That configuration draft no longer exists."],
    ["DASH_CONFIG_APPEND_ONLY", "Published configuration versions are immutable."],
  ];
  return known.find(([key]) => message.includes(key))?.[1] ?? NEUTRAL_WRITE_ERROR;
}

function parseObject(raw: FormDataEntryValue | null): { value: Record<string, unknown> | null; error?: string } {
  const text = String(raw ?? "").trim();
  if (!text) return { value: {} };
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return { value: null, error: "The payload must be a JSON object." };
    return { value: parsed as Record<string, unknown> };
  } catch {
    return { value: null, error: "The payload is not valid JSON." };
  }
}

export async function createConfigDraft(_state: DashConfigActionResult, formData: FormData): Promise<DashConfigActionResult> {
  const configKey = String(formData.get("config_key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!configKey) return { error: "Select a configuration domain." };
  if (!title) return { error: "A title is required." };
  const payload = parseObject(formData.get("payload"));
  if (payload.error) return { error: payload.error };
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("dash_create_config_draft", {
    p_config_key: configKey,
    p_title: title,
    p_payload: payload.value,
  });
  if (error) {
    logProviderError("dash_create_config_draft", error);
    return { error: databaseMessage(error) };
  }
  revalidatePath(PATH);
  return { ok: true, id: (data as string | null) ?? undefined };
}

export async function submitConfigDraft(_state: DashConfigActionResult, formData: FormData): Promise<DashConfigActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing draft id." };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("dash_submit_config", { p_id: id });
  if (error) {
    logProviderError("dash_submit_config", error);
    return { error: databaseMessage(error) };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function returnConfigDraft(_state: DashConfigActionResult, formData: FormData): Promise<DashConfigActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) return { error: "Missing draft id." };
  if (!reason) return { error: "A reason is required to return." };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("dash_return_config", { p_id: id, p_reason: reason });
  if (error) {
    logProviderError("dash_return_config", error);
    return { error: databaseMessage(error) };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function publishConfigDraft(_state: DashConfigActionResult, formData: FormData): Promise<DashConfigActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing draft id." };
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("dash_publish_config", { p_id: id });
  if (error) {
    logProviderError("dash_publish_config", error);
    return { error: databaseMessage(error) };
  }
  revalidatePath(PATH);
  return { ok: true, id: (data as string | null) ?? undefined };
}
