"use server";

import { revalidatePath } from "next/cache";
import { getMessages, type Messages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { insertNotification, type NotifyChannel } from "@/lib/notify";
import { supabaseServer } from "@/lib/supabase-server";

export type CcrActionResult = { ok?: boolean; error?: string; requestId?: string };

type CcrMessages = Messages["adminComplianceRequests"]["actions"];

const pathFor = (id?: string) => id ? `/admin/compliance-requests/${id}` : "/admin/compliance-requests";

async function messages(): Promise<CcrMessages> {
  return getMessages(await getLocale()).adminComplianceRequests.actions;
}

function databaseMessage(error: { message?: string } | null, m: CcrMessages): string {
  const message = error?.message ?? "";
  const known: Array<[string, string]> = [
    ["CCR_NOT_AUTHORIZED", m.notAuthorized],
    ["CCR_REVIEW_NOT_AUTHORIZED", m.reviewNotAuthorized],
    ["CCR_PUBLISH_NOT_AUTHORIZED", m.publishNotAuthorized],
    ["CCR_MAKER_CHECKER", m.makerChecker],
    ["CCR_COMMENT_REQUIRED", m.commentRequired],
    ["CCR_COMPONENT_REQUIRED", m.componentRequired],
    ["CCR_DEPENDENCY_CYCLE", m.dependencyCycle],
    ["CCR_DEPENDENCY_NOT_APPROVED", m.dependencyNotApproved],
    ["CCR_ORPHAN_COMPONENT", m.orphanComponent],
    ["CCR_NOT_EDITABLE", m.notEditable],
    ["CCR_NOT_SUBMITTABLE", m.notSubmittable],
    ["CCR_REVISION_REQUIRES_RETURNED", m.revisionRequiresReturned],
    ["CCR_PROPOSED_SNAPSHOT_REQUIRED", m.proposedSnapshotRequired],
    ["CCR_MODIFY_TARGET_REQUIRED", m.modifyTargetRequired],
  ];
  return known.find(([key]) => message.includes(key))?.[1] ?? NEUTRAL_WRITE_ERROR;
}

function objectJson(raw: FormDataEntryValue | null, required: boolean, m: CcrMessages): { value: Record<string, unknown> | null; error?: string } {
  const text = String(raw ?? "").trim();
  if (!text) return required ? { value: null, error: m.jsonRequired } : { value: null };
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || Array.isArray(value) || typeof value !== "object") return { value: null, error: m.jsonNotObject };
    return { value: value as Record<string, unknown> };
  } catch {
    return { value: null, error: m.jsonInvalid };
  }
}

async function deliverGovernedChannels(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  eventKey: string,
  recipients: string[],
  payload: Record<string, unknown>,
) {
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
    sb.from("user_roles").select("user_id").in("role_key", ["supervisor", "admin"]),
    sb.from("compliance_configuration_requests").select("owner_id,request_number,current_revision,status").eq("id", requestId).maybeSingle(),
  ]);
  const recipients = Array.from(new Set((roles ?? []).map(row => row.user_id)))
    .filter(recipient => recipient !== request?.owner_id);
  if (recipients.length && request) await deliverGovernedChannels(sb, "compliance_request_submitted", recipients, {
    request_id: requestId, request_number: request.request_number, revision: request.current_revision, status: request.status,
  });
}

async function rpc(name: string, args: Record<string, unknown>, m: CcrMessages, requestId?: string): Promise<CcrActionResult> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    logProviderError(`compliance request ${name}`, error);
    return { error: databaseMessage(error, m) };
  }
  revalidatePath(pathFor(requestId));
  revalidatePath("/admin/compliance-requests");
  revalidatePath("/admin/compliance-approvals");
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
  const m = await messages();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestType = String(formData.get("request_type") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();
  if (!title) return { error: m.titleRequired };
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("create_compliance_request", {
    p_title: title, p_description: description, p_request_type: requestType, p_comments: comments,
  });
  if (error || typeof data !== "string") {
    if (error) logProviderError("compliance request create", error);
    return { error: databaseMessage(error, m) };
  }
  revalidatePath("/admin/compliance-requests");
  return { ok: true, requestId: data };
}

export async function updateComplianceRequestDraft(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("update_compliance_request_draft", {
    p_request: requestId,
    p_title: String(formData.get("title") ?? "").trim(),
    p_description: String(formData.get("description") ?? "").trim(),
    p_comments: String(formData.get("comments") ?? "").trim(),
  }, m, requestId);
}

export async function addComplianceRequestComponent(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  const current = objectJson(formData.get("current_snapshot"), false, m);
  const proposed = objectJson(formData.get("proposed_snapshot"), true, m);
  if (current.error || proposed.error) return { error: current.error ?? proposed.error };
  const target = String(formData.get("target_entity_id") ?? "").trim();
  return rpc("add_compliance_request_component", {
    p_request: requestId,
    p_entity_kind: String(formData.get("entity_kind") ?? ""),
    p_target_entity_id: target || null,
    p_current_snapshot: current.value,
    p_proposed_snapshot: proposed.value,
    p_comments: String(formData.get("component_comments") ?? "").trim(),
  }, m, requestId);
}

export async function addComplianceRequestDependency(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("add_compliance_request_dependency", {
    p_request: requestId,
    p_parent: String(formData.get("parent_component_id") ?? ""),
    p_child: String(formData.get("child_component_id") ?? ""),
  }, m, requestId);
}

export async function submitComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("submit_compliance_request", { p_request: requestId }, m, requestId);
}

export async function reviseComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("revise_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, m, requestId);
}

export async function decideComplianceRequestComponent(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("decide_compliance_request_component", {
    p_component: String(formData.get("component_id") ?? ""),
    p_decision: String(formData.get("decision") ?? ""),
    p_comments: String(formData.get("comments") ?? "").trim(),
  }, m, requestId);
}

export async function returnComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("return_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, m, requestId);
}

export async function rejectComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("reject_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, m, requestId);
}

export async function cancelComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("cancel_compliance_request", { p_request: requestId, p_comments: String(formData.get("comments") ?? "").trim() }, m, requestId);
}

export async function publishComplianceRequest(_: CcrActionResult, formData: FormData): Promise<CcrActionResult> {
  const m = await messages();
  const requestId = String(formData.get("request_id") ?? "");
  return rpc("publish_compliance_request", { p_request: requestId }, m, requestId);
}
