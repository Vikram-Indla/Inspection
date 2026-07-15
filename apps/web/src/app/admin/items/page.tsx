import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";
import { NewItemForm, ToggleActive, type ClauseOption, type ItemStrings } from "./Controls";

export const dynamic = "force-dynamic";

export default async function Items() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: items, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("inspection_items")
      .select("id, code, title, active, score_weight, response_model, evidence_rule, regulation_clauses(clause_ref, regulations(code))")
      .order("code"),
    sb.from("regulation_clauses")
      .select("id, clause_ref, title, regulations(code)")
      .order("clause_ref"),
  ]);
  const clauseOptions: ClauseOption[] = (clauses ?? []).map(c => {
    const reg = c.regulations as unknown as { code: string } | null;
    return { id: c.id, label: `${reg?.code ?? "?"} §${c.clause_ref} — ${c.title ?? ""}` };
  });
  if (error) logConfigurationReadFailure("read inspection items", error);
  if (clauseError) logConfigurationReadFailure("read regulation clauses for items", clauseError);
  const strings: ItemStrings = {
    code: t("admin.items.form.code", "Code"),
    title: t("admin.items.form.title", "Title"),
    titlePlaceholder: t("admin.items.form.titlePlaceholder", "Inspection item title"),
    clause: t("admin.items.form.clause", "Clause (M09-002)"),
    selectClause: t("admin.items.form.selectClause", "Select clause…"),
    weight: t("admin.items.form.weight", "Weight"),
    responseModel: t("admin.items.form.responseModel", "Response model (M09-019)"),
    responseTriState: `${t("enum.compliant", "compliant")} / ${t("enum.non_compliant", "non compliant")} / ${t("enum.na", "na")}`,
    responseBinary: `${t("enum.compliant", "compliant")} / ${t("enum.non_compliant", "non compliant")}`,
    responseValueDate: t("enum.value_date", "value date"),
    evidenceRule: t("admin.items.form.evidenceRule", "Evidence rule (M09-005)"),
    evidenceNone: t("admin.items.form.evidenceNone", "No base evidence rule"),
    evidencePhotoNc: t("admin.items.form.evidencePhotoNc", "Photo mandatory on non-compliant"),
    guidance: t("admin.items.form.guidance", "Guidance (EN)"),
    guidancePlaceholder: t("admin.items.form.guidancePlaceholder", "What the inspector verifies"),
    creating: t("admin.items.form.creating", "Creating…"),
    create: t("admin.items.form.create", "Create item"),
    created: t("admin.items.form.created", "created"),
    saving: t("admin.items.toggle.saving", "Saving…"),
    deactivate: t("admin.items.toggle.deactivate", "Deactivate"),
    reactivate: t("admin.items.toggle.reactivate", "Reactivate"),
  };
  return (
    <Shell current="/admin" title={t("admin.items.title", "Inspection Item Catalogue")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-020 · ENG-01</span>}>
      {(error || clauseError) && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>{t("admin.items.error.title", "Couldn’t load the item catalogue.")}</strong> {t("admin.items.error.retry", "Try again.")}
        </div></div>
      )}
      <NewItemForm clauses={clauseOptions} strings={strings} />
      {!error && (items ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🧾</span><h4>{t("admin.items.empty.title", "No inspection items configured")}</h4>
          <p className="ax-caption">{t("admin.items.empty.body", "Items belong to regulation clauses and are reused across packages (M09-002).")}</p>
        </div></div>
      )}
      {(items ?? []).length > 0 && (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>{t("admin.items.table.code", "Code")}</th><th>{t("admin.items.table.title", "Title")}</th><th>{t("admin.items.table.clause", "Clause")}</th><th>{t("admin.items.table.semantics", "Runtime semantics")}</th><th className="ax-td-num">{t("admin.items.table.weight", "Weight")}</th><th>{t("admin.items.table.status", "Status")}</th><th /></tr></thead>
          <tbody>
            {(items ?? []).map(i => {
              const rc = i.regulation_clauses as unknown as { clause_ref: string; regulations: { code: string } } | null;
              const rm = i.response_model as { responses?: string[]; mapping?: Record<string, { violation?: string }>; conditional?: object };
              return (
                <tr key={i.id}>
                  <td className="ax-numeric"><strong>{i.code}</strong></td>
                  <td>{i.title}</td>
                  <td className="ax-numeric">{rc ? `${rc.regulations.code} §${rc.clause_ref}` : "—"}</td>
                  <td className="ax-caption">
                    {(rm.responses ?? []).map(r => t(`enum.${r}`, r.replace(/_/g, " "))).join(" / ")}
                    {rm.mapping?.non_compliant?.violation && ` · ${t("admin.items.ncArrow", "NC→")}${rm.mapping.non_compliant.violation}`}
                    {rm.conditional && ` · ${t("admin.items.conditional", "conditional")}`}
                    {i.evidence_rule != null && ` · ${t("admin.items.evidenceRule", "evidence rule")}`}
                  </td>
                  <td className="ax-td-num ax-numeric">{i.score_weight ?? "—"}</td>
                  <td><span className={`ax-lozenge ${i.active ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{i.active ? t("enum.active", "active") : t("enum.deactivated", "deactivated")}</span></td>
                  <td><ToggleActive itemId={i.id} active={i.active} strings={strings} /></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
      <p className="ax-caption">{t("admin.items.footer", "Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014). Writes require compliance_admin/form_admin — RLS is the authority.")}</p>
    </Shell>
  );
}
