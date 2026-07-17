import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";
import { NewRegulationForm, PublishRegulation, AddClauseForm, type RegStrings } from "./Controls";
import RegulationDetail from "./RegulationDetail";

export const dynamic = "force-dynamic";

export default async function Regulations({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const regulationId = typeof sp.regulation === "string" ? sp.regulation : "";
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
  const detailStrings = {
    ...strings,
    backToList: t("admin.reg.detail.back", "← Back to regulation library"),
    notFoundTitle: t("admin.reg.detail.notFound.title", "Regulation not found"),
    notFoundBody: t("admin.reg.detail.notFound.body", "It may have been removed, or the link is wrong."),
    degradedTitle: t("admin.reg.detail.degraded.title", "Couldn’t load this regulation."),
    degradedBody: t("admin.reg.detail.degraded.body", "Try again."),
    metaCreated: t("admin.reg.detail.meta.created", "Created"),
    metaCreatedBy: t("admin.reg.detail.meta.createdBy", "Created by"),
    metaApprovedBy: t("admin.reg.detail.meta.approvedBy", "Approved by"),
    metaPublishedAt: t("admin.reg.detail.meta.publishedAt", "Published"),
    unknownActor: t("admin.reg.detail.meta.unknownActor", "unavailable"),
    neverApproved: t("admin.reg.detail.meta.neverApproved", "not yet approved"),
    unmappedBanner: t("admin.reg.detail.unmappedBanner", "{n} clause(s) have no inspection-item mapping — publish is blocked until every clause has a consumer."),
    publishedImmutable: t("admin.reg.detail.publishedImmutable", "Published — immutable at the database boundary. Further changes require a governed successor draft (not yet built; no lineage model authorized)."),
    clauseNav: t("admin.reg.detail.clauseNav", "Clause navigator"),
    dependencyRail: t("admin.reg.detail.dependencyRail", "Mapped inspection items"),
    mappedCount: t("admin.reg.detail.mappedCount", "{n} item(s)"),
    unmappedTag: t("admin.reg.detail.unmappedTag", "unmapped"),
    auditTitle: t("admin.reg.detail.audit.title", "Audit timeline"),
    auditBody: t("admin.reg.detail.audit.body", "Not available here — compliance_admin/form_admin roles have no audit_events read grant (RLS). This is a disclosure, not a working control."),
    routeGuardTitle: t("admin.reg.detail.routeGuard.title", "Access control"),
    routeGuardBody: t("admin.reg.detail.routeGuard.body", "No admin route guard is proven. Navigation visibility is not authorization (owner: platform)."),
    lineageTitle: t("admin.reg.detail.lineage.title", "Version compare / lineage"),
    lineageBody: t("admin.reg.detail.lineage.body", "Not evaluated — no successor-version model is authorized for regulations yet."),
    dependencyEngineTitle: t("admin.reg.detail.depEngine.title", "Dependency engine"),
    dependencyEngineBody: t("admin.reg.detail.depEngine.body", "Not evaluated — clause→item mapping above is read directly from the schema, not a dependency engine."),
  };
  return (
    <Shell current="/admin" title={t("admin.reg.title", "Regulation library")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-010/011</span>}>
      {regulationId ? (
        <RegulationDetail regulationId={regulationId} strings={detailStrings} t={t} />
      ) : (
        <>
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
                <h3><a className="ax-link" href={`/admin/regulations?regulation=${r.id}`}>{r.code} — {r.title}</a></h3>
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
        </>
      )}
    </Shell>
  );
}
