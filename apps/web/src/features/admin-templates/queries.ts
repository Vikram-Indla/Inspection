import type { TemplateRow } from "@/app/(app)/admin/packages/TemplateRegistry";
import { logProviderError } from "@/lib/neutral-error";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

const WRITER_ROLES = new Set(["admin"]);

export type TemplatesData =
  | { readonly state: "error" }
  | { readonly state: "ready"; readonly rows: readonly TemplateRow[]; readonly canWrite: boolean };

export async function loadTemplates(): Promise<TemplatesData> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const { data, error } = await sb
    .from("configuration_templates")
    .select("id, template_key, template_type, version_label, title_en, title_ar, schema, status, effective_from")
    .order("template_key");

  if (error) {
    logProviderError("admin templates read", error);
    return { state: "error" };
  }

  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const canWrite = !roleRead.error && [...roles].some(role => WRITER_ROLES.has(role));

  const rows: readonly TemplateRow[] = (data ?? []).map(row => ({
    id: row.id,
    template_key: row.template_key,
    template_type: row.template_type,
    version_label: row.version_label,
    title_en: row.title_en,
    title_ar: row.title_ar,
    schema: row.schema,
    status: row.status,
    effective_from: row.effective_from,
  }));

  return { state: "ready", rows, canWrite };
}
