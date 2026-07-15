import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";
import { NewRegulationForm, PublishRegulation, AddClauseForm, type RegStrings } from "./Controls";

export const dynamic = "force-dynamic";

export default async function Regulations() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: regs, error } = await sb.from("regulations")
    .select("id, code, title, issuing_authority, status, regulation_clauses(id, clause_ref, title, inspection_items(id, code))")
    .order("code");
  if (error) logConfigurationReadFailure("read regulations", error);
  const strings: RegStrings = {
    code: t("admin.reg.form.code", "Code"),
    title: t("admin.reg.form.title", "Title"),
    issuingAuthority: t("admin.reg.form.issuingAuthority", "Issuing authority"),
    titlePlaceholder: t("admin.reg.form.titlePlaceholder", "Regulation title"),
    creating: t("admin.reg.form.creating", "Creating…"),
    create: t("admin.reg.form.create", "Create regulation (draft)"),
    created: t("admin.reg.form.created", "created"),
    clauseRef: t("admin.reg.clause.ref", "Clause §"),
    legalSource: t("admin.reg.clause.legalSource", "Legal source"),
    legalSourcePlaceholder: t("admin.reg.clause.legalSourcePlaceholder", "Royal Decree M/43 art. 12"),
    adding: t("admin.reg.clause.adding", "Adding…"),
    addClause: t("admin.reg.clause.add", "Add clause"),
    added: t("admin.reg.clause.added", "added"),
    publishing: t("admin.reg.publishing", "Publishing…"),
    publish: t("admin.reg.publish", "Publish"),
  };
  return (
    <Shell current="/admin" title={t("admin.reg.title", "Regulation library")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-010/011</span>}>
      <NewRegulationForm strings={strings} />
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div>
        <strong>{t("admin.reg.error.title", "Couldn’t load regulations.")}</strong> {t("admin.reg.error.retry", "Try again.")}
      </div></div>}
      {!error && (regs ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">📜</span><h4>{t("admin.reg.empty.title", "No regulations configured")}</h4>
          <p className="ax-caption">{t("admin.reg.empty.body", "Regulations are the parents of inspection items (MVP1-M09-001).")}</p>
        </div></div>
      )}
      {(regs ?? []).map(r => (
        <div key={r.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{r.code} — {r.title}</h3>
            <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
              <span className={`ax-lozenge ${r.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${r.status}`, String(r.status).replace(/_/g, " "))}</span>
              {r.status === "draft" && <PublishRegulation regulationId={r.id} strings={strings} />}
            </div>
          </div>
          <p className="ax-caption">{r.issuing_authority}</p>
          <div className="ax-tablewrap" style={{ marginBlockStart: "var(--ax-space-200)" }}><table className="ax-table">
            <thead><tr><th>{t("admin.reg.table.clause", "Clause")}</th><th>{t("admin.reg.table.title", "Title")}</th><th>{t("admin.reg.table.mappedItems", "Mapped items")}</th></tr></thead>
            <tbody>
              {(r.regulation_clauses ?? []).map(c => (
                <tr key={c.id}>
                  <td className="ax-numeric"><strong>§{c.clause_ref}</strong></td>
                  <td>{c.title}</td>
                  <td>{(c.inspection_items ?? []).map(i => <span key={i.id} className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 6 }}>{i.code}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <AddClauseForm regulationId={r.id} strings={strings} />
        </div>
      ))}
    </Shell>
  );
}
