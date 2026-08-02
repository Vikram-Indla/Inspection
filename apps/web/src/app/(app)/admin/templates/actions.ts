"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { requireConfigurationWriter } from "@/lib/admin-configuration";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type TemplateResult = { ok?: boolean; error?: string };
const TYPES = new Set(["form", "report", "action_form", "penalty"]);

function revalidateTemplateConfiguration() {
  revalidatePath("/admin/templates");
  revalidatePath("/admin/packages");
}

// M09-006/008/009 — frontend-independent Template Builder contract. The schema
// is persisted as a governed version and packages reference its immutable UUID.
export async function createTemplateVersion(_: TemplateResult, formData: FormData): Promise<TemplateResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const template_key = String(formData.get("template_key") ?? "").trim();
  const template_type = String(formData.get("template_type") ?? "").trim();
  const version_label = String(formData.get("version_label") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  let schema: unknown;
  try { schema = JSON.parse(String(formData.get("schema") ?? "")); }
  catch { return { error: "Template schema must be valid JSON." }; }
  if (!template_key || !version_label || !title_en || !title_ar) return { error: "Key, version, and English/Arabic titles are required." };
  if (!TYPES.has(template_type)) return { error: "Pick a supported template type." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) return { error: "A valid effective-from date is required." };
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return { error: "Template schema must be an object." };
  const { error } = await sb.from("configuration_templates").insert({
    template_key, template_type, version_label, title_en, title_ar, effective_from,
    schema, status: "draft", created_by: gate.userId,
  });
  if (error) { logProviderError("admin template create", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidateTemplateConfiguration();
  return { ok: true };
}

export async function updateTemplateDraft(_: TemplateResult, formData: FormData): Promise<TemplateResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("template_id") ?? "");
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_ar = String(formData.get("title_ar") ?? "").trim();
  let schema: unknown;
  try { schema = JSON.parse(String(formData.get("schema") ?? "")); }
  catch { return { error: "Template schema must be valid JSON." }; }
  if (!id || !title_en || !title_ar || !schema || typeof schema !== "object" || Array.isArray(schema)) return { error: "Template, bilingual titles, and object schema are required." };
  const { data, error } = await sb.from("configuration_templates").update({ title_en, title_ar, schema })
    .eq("id", id).eq("status", "draft").select("id");
  if (error) { logProviderError("admin template update", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "Only draft template versions are editable." };
  revalidateTemplateConfiguration();
  return { ok: true };
}

export async function publishTemplateVersion(_: TemplateResult, formData: FormData): Promise<TemplateResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("template_id") ?? "");
  if (!id) return { error: "Missing template draft." };
  const { error } = await sb.rpc("publish_configuration_template", { p_template_id: id });
  if (error) {
    logProviderError("admin template publish", error);
    const message = String(error.message ?? "");
    if (message.includes("maker-checker")) return { error: "A different configuration writer must approve this draft." };
    if (message.includes("successor effective date")) return { error: "The successor effective date must follow the active version." };
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidateTemplateConfiguration();
  return { ok: true };
}

export async function deactivateTemplateVersion(_: TemplateResult, formData: FormData): Promise<TemplateResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const id = String(formData.get("template_id") ?? "");
  const effective_to = String(formData.get("effective_to") ?? "").trim();
  const deactivation_reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(effective_to) || !deactivation_reason) return { error: "Template, valid effective-to date, and deactivation reason are required." };
  const { data, error } = await sb.from("configuration_templates").update({ status: "deactivated", effective_to, deactivation_reason })
    .eq("id", id).in("status", ["published", "locked"]).select("id");
  if (error) { logProviderError("admin template deactivate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "Only a governed active template can be deactivated." };
  revalidateTemplateConfiguration();
  return { ok: true };
}
