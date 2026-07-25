import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import TemplateRegistry, { type TemplateRow, type TemplateStrings } from "../packages/TemplateRegistry";

export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["compliance_admin", "form_admin"]);

export default async function Templates() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const { data: templates, error } = await sb
    .from("configuration_templates")
    .select("id, template_key, template_type, version_label, title_en, title_ar, schema, status, effective_from")
    .order("template_key");

  if (error) logProviderError("admin templates read", error);

  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRead.data ?? []).map(r => r.role_key));
  const canWrite = !roleRead.error && [...roles].some(role => WRITER_ROLES.has(role));

  const templateStrings: TemplateStrings = {
    heading: t("admin.template.heading", "Governed template registry"),
    intro: t("admin.template.intro", "Create versioned bilingual form, report, action-form, or penalty templates. Published versions are immutable and can be referenced by package action forms and penalty mappings."),
    key: t("admin.template.key", "Template key"),
    type: t("admin.template.type", "Type"),
    version: t("admin.template.version", "Version"),
    effectiveFrom: t("admin.template.effectiveFrom", "Effective from"),
    titleEn: t("admin.template.titleEn", "English title"),
    titleAr: t("admin.template.titleAr", "Arabic title"),
    schema: t("admin.template.schema", "Schema (JSON object)"),
    create: t("admin.template.create", "Create draft template version"),
    creating: t("admin.template.creating", "Creating…"),
    save: t("admin.template.save", "Save draft"),
    saving: t("admin.template.saving", "Saving…"),
    publish: t("admin.template.publish", "Approve & publish"),
    publishing: t("admin.template.publishing", "Publishing…"),
    effectiveTo: t("admin.template.effectiveTo", "Effective to"),
    reason: t("admin.template.reason", "Reason"),
    deactivate: t("admin.template.deactivate", "Deactivate"),
    deactivating: t("admin.template.deactivating", "Deactivating…"),
    historical: t("admin.template.historical", "Immutable historical template version."),
    saved: t("admin.template.saved", "Saved"),
    typeForm: t("admin.template.type.form", "Form"),
    typeReport: t("admin.template.type.report", "Report"),
    typeActionForm: t("admin.template.type.actionForm", "Action form"),
    typePenalty: t("admin.template.type.penalty", "Penalty"),
  };

  return (
    <Shell
      current="/admin/templates"
      title={t("admin.templates.title", "Template registry")}
      context={
        <span className="badge badge-info">M09-006/008/009 · ENG-04</span>
      }
    >
      {error && (
        <div className="sq-banner sq-banner--critical" role="alert">
          <div>
            <strong>{t("admin.templates.error.title", "Couldn’t load the template registry.")}</strong>{" "}
            {t("admin.templates.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            <a className="sq-link" href="/admin/templates">
              {t("admin.templates.retry", "Reload to try again")}
            </a>
          </div>
        </div>
      )}

      {!error && canWrite && (
        <TemplateRegistry
          templates={(templates ?? []) as unknown as TemplateRow[]}
          strings={templateStrings}
        />
      )}

      {!error && !canWrite && (
        <div className="sq-banner" role="note">
          <strong>{t("admin.templates.readonly.title", "Read-only template access")}</strong>{" "}
          {t("admin.templates.readonly.body", "Creating or changing templates requires compliance_admin or form_admin." )}
        </div>
      )}

      {!error && (templates ?? []).length === 0 && (
        <div className="panel sq-state">
          <span className="sq-state__glyph" aria-hidden="true">▦</span>
          <h3>{t("admin.templates.empty.title", "No templates configured")}</h3>
          <p className="t-caption">
            {t("admin.templates.empty.body", "Templates are versioned bilingual schema objects referenced by packages and action forms.")}
          </p>
        </div>
      )}
    </Shell>
  );
}
