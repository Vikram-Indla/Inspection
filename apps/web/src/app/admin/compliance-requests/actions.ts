"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { insertNotification, type NotifyChannel } from "@/lib/notify";

export type CcrActionResult = { ok?: boolean; error?: string; requestId?: string };

const pathFor = (id?: string) => id ? `/admin/compliance-requests/${id}` : "/admin/compliance-requests";

function databaseMessage(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  const known: Array<[string, string]> = [
    ["CCR_NOT_AUTHORIZED", "Your role cannot perform this request action."],
    ["CCR_REVIEW_NOT_AUTHORIZED", "A Compliance reviewer role is required."],
    ["CCR_PUBLISH_NOT_AUTHORIZED", "A Compliance reviewer role is required to publish."],
    ["CCR_MAKER_CHECKER", "The request creator cannot review or publish their own request."],
    ["CCR_COMMENT_REQUIRED", "A comment is required for Return or Reject."],
    ["CCR_COMPONENT_REQUIRED", "Add at least one component before submitting."],
    ["CCR_DEPENDENCY_CYCLE", "That dependency would create a cycle."],
    ["CCR_DEPENDENCY_NOT_APPROVED", "Publication is blocked because a required parent is not approved."],
    ["CCR_ORPHAN_COMPONENT", "Publication is blocked because a component has no approved or existing parent version."],
    ["CCR_NOT_EDITABLE", "Only the current draft revision can be edited."],
    ["CCR_NOT_SUBMITTABLE", "This request is not in a submittable state."],
    ["CCR_REVISION_REQUIRES_RETURNED", "A new revision can be created only after Return."],
    ["CCR_PROPOSED_SNAPSHOT_REQUIRED", "Proposed values must be a JSON object."],
    ["CCR_MODIFY_TARGET_REQUIRED", "Modify requests require an existing target UUID."],
  ];
  return known.find(([key]) => message.includes(key))?.[1] ?? NEUTRAL_WRITE_ERROR;
}

function objectJson(raw: FormDataEntryValue | null, required: boolean): { value: Record<string, unknown> | null; error?: string } {
  const text = String(raw ?? "").trim();
  if (!text) return required ? { value: null, error: "A JSON object is required." } : { value: null };
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || Array.isArray(value) || typeof value !== "object") return { value: null, error: "The value must be a JSON object." };
    return { value: value as Record<string, unknown> };
  } catch {
    return { value: null, error: "Enter valid JSON." };
  }
}

async function deliverGovernedChannels(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  eventKey: string,
  recipients: string[],
  payload: Record<string, unknown>,
) {
  // The RPC has already persisted the guaranteed in-app event. Published
  // notification rules opt external channels into the existing provider,
  // preference and delivery-truth engine; failures never roll back the primary
  // governed transition.
  const { data: rules, error } = await sb.from("notification_rules")
    .select("channel").eq("event_key", eventKey).eq("status", "published");
  if (error) { logProviderError(`compliance request ${eventKey} rules`, error); return; }
  const channels = Array.from(new Set((rules ?? []).map(row => row.channel)))
    .filter((channel): channel is NotifyChannel => ["push", "sms", "email"].includes(channel));
  await Promise.all(recipients.flatMap(recipient => channels.map(channel => insertNotification(sb, {
    event_key: eventKey, recipient, channel, payload,
  }))));
}

async function notifyOwner(sb: Awaited<ReturnType<typeof supabaseServer>>, requestId: string, eventKey: string) {
  const { data } = await sb.from("compliance_configuration_requests")
    .select("owner_id,request_number,current_revision,status").eq("id", requestId).maybeSingle();
  if (data?.owner_id) await deliverGovernedChannels(sb, eventKey, [data.owner_id], {
    request_id: requestId, request_number: data.request_number, revision: data.current_revision, status: data.status,
  });
}

async function notifyReviewers(sb: Awaited<ReturnType<typeof supabaseServer>>, requestId: string) {
  const [{ data: roles }, { data: request }] = await Promise.all([
    sb.from("user_roles").select("user_id").in("role_key", ["reviewer", "compliance_admin"]),
    sb.from("compliance_configuration_requests").select("owner_id,request_number,current_revision,status").eq("id", requestId).maybeSingle(),
  ]);
  const recipients = Array.from(new Set((roles ?? []).map(row => row.user_id)))
    .filter(recipient => recipient !== request?.owner_id);
  if (recipients.length && request) await deliverGovernedChannels(sb, "compliance_request_submitted", recipients, {
    request_id: requestId, request_number: request.request_number, revision: request.current_revision, status: request.status,
  });
}

async function rpc(name: string, args: Record<string, unknown>, requestId?: string): Promise<CcrActionResult> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    logProviderError(`compliance request ${name}`, error);
    return { error: databaseMessage(error) };
  }
  revalidatePath(pathFor(requestId));
  revalidatePath("/admin/compliance-requests");
  if (requestId) {
    if (name === "submit_compliance_request") await notifyReviewers(sb, requestId);
    if (name === "return_compliance_request") await notifyOwner(sb, requestId, "compliance_request_returned");
    if (name === "reject_compliance_request") await notifyOwner(sb, requestId, "compliance_request_rejected");
    if (name === "publish_compliance_request") await notifyOwner(sb, requestId, "compliance_request_published");
    if (name === "decide_compliance_request_component" && ["approved", "partially_approved", "rejected"].includes(String(data)))
      await notifyOwner(sb, requestId, `compliance_request_${String(data)}`);
  }
  return { ok: true };
}

export async function createComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestType = String(formData.get("request_type") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("create_compliance_request", {
    p_title: title, p_description: description, p_request_type: requestType, p_comments: comments,
  });
  if (error || typeof data !== "string") {
    if (error) logProviderError("compliance request create", error);
    return { error: databaseMessage(error) };
  }
  revalidatePath("/admin/compliance-requests");
  return { ok: true, requestId: data };
}

export async function updateComplianceRequestDraft(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("update_compliance_request_draft", {
    p_request: requestId,
    p_title: String(formData.get("title") ?? "").trim(),
    p_description: String(formData.get("description") ?? "").trim(),
    p_comments: String(formData.get("comments") ?? "").trim(),
  }, requestId);
}

export async function addComplianceRequestComponent(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  const current = objectJson(formData.get("current_snapshot"), false);
  const proposed = objectJson(formData.get("proposed_snapshot"), true);
  if (current.error || proposed.error) return { error: current.error ?? proposed.error };
  const target = String(formData.get("target_entity_id") ?? "").trim();
  return rpc("add_compliance_request_component", {
    p_request: requestId,
    p_entity_kind: String(formData.get("entity_kind") ?? ""),
    p_target_entity_id: target || null,
    p_current_snapshot: current.value,
    p_proposed_snapshot: proposed.value,
    p_comments: String(formData.get("component_comments") ?? "").trim(),
  }, requestId);
}

export async function addComplianceRequestDependency(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("add_compliance_request_dependency", {
    p_request: requestId,
    p_parent: String(formData.get("parent_component_id") ?? ""),
    p_child: String(formData.get("child_component_id") ?? ""),
  }, requestId);
}

export async function submitComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("submit_compliance_request", { p_request: requestId }, requestId);
}

export async function reviseComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("revise_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, requestId);
}

export async function decideComplianceRequestComponent(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("decide_compliance_request_component", {
    p_component: String(formData.get("component_id") ?? ""),
    p_decision: String(formData.get("decision") ?? ""),
    p_comments: String(formData.get("comments") ?? "").trim(),
  }, requestId);
}

export async function returnComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("return_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, requestId);
}

export async function rejectComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("reject_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, requestId);
}

export async function cancelComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("cancel_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, requestId);
}

export async function publishComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("publish_compliance_request", { p_request: requestId }, requestId);
}
