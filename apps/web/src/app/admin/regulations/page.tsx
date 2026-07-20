import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import {
  NewRegulationForm,
  PublishRegulation,
  AddClauseForm,
  AddRegulationAttachment,
  DeactivateRegulation,
  EditRegulationDraft,
  RegulationRegister,
  type RegStrings,
  type RegRowLite,
} from "./Controls";

// SCR-ADM-010 (CD-005 Regulation Library) + SCR-ADM-011 (CD-006 Regulation Detail).
// The contract route /admin/regulations/:id is NOT implemented; the detail dossier is a
// LOGICAL MODE of this same route selected by the ?id= query param. No dedicated detail
// URL is created.
//
// Truth law: a failed read renders unavailable/unknown — never zero/healthy/complete.
// verified-zero (read succeeded, empty) and unavailable/unknown (read failed) stay
// DISTINCT. Publish is now the governed maker-checker path: created_by/approved_by are
// persisted and the DB constraint regulations_maker_checker rejects self-approval, while
// trg_guard_published_regulation locks a published/locked row against modification — both
// enforced at the database boundary. Validated publish, draft edit, effective date,
// attachment custody, deactivation, route guarding and object-scoped audit are wired to
// the completion migration. Version lineage and publish dependency validation are shown
// from the authoritative regulation, clause and item records.
export const dynamic = "force-dynamic";

type RawItem = { id: string; code: string | null };
type RawClause = {
  id: string;
  clause_ref: string | null;
  title: string | null;
  applicability: string | null;
  legal_source: string | null;
  inspection_items: RawItem[] | null;
};
type RawReg = {
  id: string;
  code: string;
  title: string;
  issuing_authority: string | null;
  status: string;
  created_at: string | null;
  effective_from: string | null;
  deactivated_at: string | null;
  effective_to: string | null;
  version_label: string;
  supersedes_id: string | null;
  deactivation_reason: string | null;
  created_by: string | null;
  approved_by: string | null;
  published_at: string | null;
  regulation_attachments: { id: string; file_name: string; storage_path: string; media_type: string | null; sha256: string | null; created_at: string }[] | null;
  regulation_clauses: RawClause[] | null;
};

// unknown ≠ zero: null counts mean the embedded read could not be resolved.
function footprint(reg: RawReg): { clauseCount: number | null; itemCount: number | null } {
  const clauses = reg.regulation_clauses;
  if (!Array.isArray(clauses)) return { clauseCount: null, itemCount: null };
  let items = 0;
  let unknown = false;
  for (const c of clauses) {
    if (Array.isArray(c.inspection_items)) items += c.inspection_items.length;
    else unknown = true;
  }
  return { clauseCount: clauses.length, itemCount: unknown ? null : items };
}

const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), tmpl);

export default async function Regulations({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { t, locale } = await useT();
  const sb = await supabaseServer();

  const sp = await searchParams;
  const detailId = typeof sp.id === "string" ? sp.id : Array.isArray(sp.id) ? sp.id[0] : undefined;

  // Route layout restricts module visibility; writes remain independently RLS-gated.
  const { data: { user } } = await getServerUser();
  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRows ?? []).map(r => r.role_key));
  const isWriter = roles.has("compliance_admin") || roles.has("form_admin");
  const isReviewer = roles.has("reviewer");

  const { data: regsData, error: regsError } = await sb
    .from("regulations")
    .select(
      "id, code, title, issuing_authority, status, created_at, effective_from, effective_to, deactivated_at, version_label, supersedes_id, deactivation_reason, created_by, approved_by, published_at, regulation_attachments(id, file_name, storage_path, media_type, sha256, created_at), regulation_clauses(id, clause_ref, title, applicability, legal_source, inspection_items(id, code))",
    )
    .order("code");
  const rows = (regsData ?? []) as unknown as RawReg[];

  const strings: RegStrings = {
    code: t("admin.reg.form.code", "Code"),
    title: t("admin.reg.form.title", "Title"),
    issuingAuthority: t("admin.reg.form.issuingAuthority", "Issuing authority"),
    effectiveFrom: t("admin.reg.form.effectiveFrom", "Effective from"),
    versionLabel: t("admin.reg.form.versionLabel", "Version label"),
    deactivationReason: t("admin.reg.form.deactivationReason", "Deactivation reason"),
    titlePlaceholder: t("admin.reg.form.titlePlaceholder", "Regulation title"),
    creating: t("admin.reg.form.creating", "Creating…"),
    create: t("admin.reg.form.create", "Create draft regulation"),
    created: t("admin.reg.form.created", "Draft created"),
    clauseRef: t("admin.reg.clause.ref", "Clause §"),
    legalSource: t("admin.reg.clause.legalSource", "Legal source"),
    legalSourcePlaceholder: t("admin.reg.clause.legalSourcePlaceholder", "Royal Decree M/43 art. 12"),
    applicability: t("admin.reg.clause.applicability", "Applicability"),
    adding: t("admin.reg.clause.adding", "Adding…"),
    addClause: t("admin.reg.clause.add", "Add clause"),
    added: t("admin.reg.clause.added", "Clause added"),
    clauseNotAudited: t("admin.reg.clause.notAudited", "Clause changes are audit-tracked at the database (trg_audit_regulation_clauses), the same as regulation-row changes."),
    publishing: t("admin.reg.publishing", "Publishing…"),
    publish: t("admin.reg.publish", "Validate and publish"),
    saveDraft: t("admin.reg.edit.save", "Save draft"),
    savingDraft: t("admin.reg.edit.saving", "Saving…"),
    draftSaved: t("admin.reg.edit.saved", "Draft saved"),
    deactivate: t("admin.reg.deactivate", "Deactivate regulation"),
    deactivating: t("admin.reg.deactivating", "Deactivating…"),
    deactivated: t("admin.reg.deactivated", "Regulation deactivated"),
    attachmentName: t("admin.reg.attachment.name", "File name"),
    attachmentPath: t("admin.reg.attachment.path", "Governed storage path"),
    attachmentType: t("admin.reg.attachment.type", "Media type"),
    attachmentHash: t("admin.reg.attachment.hash", "SHA-256 (optional)"),
    addAttachment: t("admin.reg.attachment.add", "Add attachment metadata"),
    addingAttachment: t("admin.reg.attachment.adding", "Adding…"),
    attachmentAdded: t("admin.reg.attachment.added", "Attachment added"),
    searchPlaceholder: t("admin.reg.r1.search.placeholder", "Search code, title, authority…"),
    filterAll: t("admin.reg.r1.filter.all", "All {n}"),
    filterPublished: t("admin.reg.r1.filter.published", "Published {n}"),
    filterDraft: t("admin.reg.r1.filter.draft", "Draft {n}"),
    filterDeactivated: t("admin.reg.r1.filter.deactivated", "Deactivated {n}"),
    filterLegend: t("admin.reg.r1.filter.legend", "Filter by lifecycle"),
    statusPublished: t("admin.reg.r1.status.published", "Published"),
    statusDraft: t("admin.reg.r1.status.draft", "Draft"),
    statusDeactivated: t("admin.reg.r1.status.deactivated", "Deactivated"),
    openDossier: t("admin.reg.r1.openDossier", "Open dossier"),
    filteredEmptyTitle: t("admin.reg.r1.filteredEmpty.title", "No regulations match"),
    filteredEmptyBody: t("admin.reg.r1.filteredEmpty.body", "The register itself is not empty — clear the search or lifecycle filter."),
    createdAtLabel: t("admin.reg.r1.createdAt", "created"),
    railHeading: t("admin.reg.r1.rail.heading", "Impact footprint — from regulation to what actually gets inspected"),
    railRegulation: t("admin.reg.r1.rail.regulation", "REGULATION"),
    railClauses: t("admin.reg.r1.rail.clauses", "CLAUSES — read verified"),
    railClausesUnknown: t("admin.reg.r1.rail.clauses.unknown", "clause read failed — count unknown, not zero"),
    railClausesZero: t("admin.reg.r1.rail.clauses.zero", "no clauses (verified zero)"),
    railItems: t("admin.reg.r1.rail.items", "MAPPED ITEMS — read verified"),
    railItemsUnknown: t("admin.reg.r1.rail.items.unknown", "mapped-item read failed — impact unknown, not zero"),
    railItemsZero: t("admin.reg.r1.rail.items.zero", "no mapped items (verified zero)"),
    railBeyond: t("admin.reg.r1.rail.beyond", "BEYOND ITEMS"),
    railNotEvaluated: t("admin.reg.r1.rail.notEvaluated", "Not evaluated — no verified source"),
    invalidNoClauses: t("admin.reg.r1.invalid.noClauses", "draft with no clauses — incomplete; publishing it would be meaningless"),
  };

  const readAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  const readAtNode: ReactNode = (() => {
    const tmpl = t("admin.reg.r1.readAt", "read at {time} — not refreshed since; no staleness verdict exists, the age is shown");
    const [before, after] = tmpl.split("{time}");
    return (
      <>
        {before}
        <bdi dir="ltr" className="ax-numeric">{readAt}</bdi>
        {after ?? ""}
      </>
    );
  })();

  const title = t("admin.reg.r1.title", "Compliance Library — regulation register");
  const context = (
    <span className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
      <span className="ax-lozenge ax-lozenge--info">SCR-ADM-010/011</span>
      <a className="ax-link" href="/admin/compliance-requests">
        {t("admin.reg.requests", "Configuration Requests")}
      </a>
      <span role="status" aria-live="polite" className="ax-caption">{readAtNode}</span>
      {regsError ? (
        <span className="ax-lozenge ax-lozenge--warning"><span aria-hidden="true">⚠</span> {t("admin.reg.r1.degraded.chip", "register unavailable")}</span>
      ) : null}
    </span>
  );
  const libraryTabs = (
    <nav className="cmp-library-tabs" aria-label="Compliance Library">
      <a className="ax-btn ax-btn--prominent" href="/admin/regulations" aria-current="page">Regulations</a>
      <a className="ax-btn ax-btn--secondary ax-link" href="/admin/items">Inspection Items</a>
      {isWriter ? <a className="ax-btn ax-btn--secondary ax-link" href="/admin/compliance-requests/new">Create governed request</a> : null}
    </nav>
  );

  // ---- S05/S06 read-only disclosure inside the module route guard ----
  const readOnlyBanner = roleError ? (
    <div className="ax-banner ax-banner--warning" role="alert"><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div>
  ) : !isWriter ? (
    <div className="ax-banner" role="note">
      <strong><span aria-hidden="true">👁</span> {isReviewer
        ? t("admin.reg.r1.readonly.reviewer.title", "Reviewer — read-only")
        : t("admin.reg.r1.readonly.title", "Read-only for your role")}</strong>{" "}
      {t("admin.reg.r1.readonly.body", "You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. The route guard and database permissions are independent controls.")}
    </div>
  ) : null;

  // ---- S08 degraded / S09 recovery (register read failed — isolate; never zero) ----
  const degradedBanner = regsError ? (
    <div className="ax-banner ax-banner--warning" role="alert">
      <strong><span aria-hidden="true">⚠</span> {t("admin.reg.r1.degraded.title", "The regulation register couldn't be read.")}</strong>{" "}
      {t("admin.reg.r1.degraded.body", "Nothing is shown as zero — the count is unknown, not empty. Your session and navigation still work.")}
      {" "}
      <a className="ax-link" href={detailId ? `/admin/regulations?id=${encodeURIComponent(detailId)}` : "/admin/regulations"}>
        {t("admin.reg.r1.retry", "Retry read")}
      </a>
    </div>
  ) : null;

  // =========================================================================
  // DETAIL MODE (CD-006) — logical dossier for a single regulation via ?id=
  // =========================================================================
  if (detailId) {
    const reg = rows.find(r => r.id === detailId);
    const clauses = reg && Array.isArray(reg.regulation_clauses) ? reg.regulation_clauses : [];
    const unmappedClauses = clauses.filter(c => !Array.isArray(c.inspection_items) || c.inspection_items.length === 0).length;
    const attachments = reg && Array.isArray(reg.regulation_attachments) ? reg.regulation_attachments : [];
    const lineage = reg ? rows.filter(candidate => candidate.code === reg.code)
      .sort((a, b) => (a.effective_from ?? "").localeCompare(b.effective_from ?? "")) : [];
    const attachmentUrls: Record<string, string> = {};
    await Promise.all(attachments.map(async attachment => {
      const { data } = await sb.storage.from("regulation-documents").createSignedUrl(attachment.storage_path, 600);
      if (data?.signedUrl) attachmentUrls[attachment.id] = data.signedUrl;
    }));
    const { data: auditData, error: auditError } = reg && isWriter
      ? await sb.rpc("admin_configuration_audit", { p_object_type: "regulations", p_object_id: reg.id })
      : { data: null, error: null };
    const auditEvents = Array.isArray(auditData) ? auditData as Array<{
      id: number; actor: string | null; action: string; occurred_at: string;
    }> : [];

    return (
      <Shell current="/admin/regulations" title={title} context={context}>
        {degradedBanner}
        {readOnlyBanner}
        {libraryTabs}

        <p className="ax-caption" style={{ margin: 0 }}>
          <a className="ax-link" href="/admin/regulations">← {t("admin.reg.r1.backToRegister", "Back to register")}</a>
        </p>

        {regsError ? null : !reg ? (
          <EmptyState role="status" glyph="🔎" title={t("admin.reg.r1.detail.notFound.title", "Regulation not found")}
            body={t("admin.reg.r1.detail.notFound.body", "The read succeeded but no regulation has this identifier. It may have been removed.")} />
        ) : (
          <>
            {/* Dossier header */}
            <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-dossier-h">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: "var(--ax-space-050)" }}>
                  <h2 id="reg-dossier-h" style={{ margin: 0 }}>
                    <span className="ax-numeric"><bdi dir="ltr">{reg.code}</bdi></span> — {reg.title}
                  </h2>
                  <p className="ax-caption" style={{ margin: 0 }}>
                    {reg.issuing_authority || "—"}
                    {reg.created_at ? <> · {strings.createdAtLabel} <bdi dir="ltr" className="ax-numeric">{reg.created_at.slice(0, 10)}</bdi></> : null}
                    {reg.effective_from ? <> · {strings.effectiveFrom} <bdi dir="ltr" className="ax-numeric">{reg.effective_from.slice(0, 10)}</bdi></> : null}
                    <> · {strings.versionLabel} <bdi dir="ltr" className="ax-numeric">{reg.version_label}</bdi></>
                  </p>
                </div>
                <span className={`ax-lozenge ${reg.status === "published" ? "ax-lozenge--success" : reg.status === "deactivated" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>
                  <span aria-hidden="true">{reg.status === "published" ? "●" : reg.status === "deactivated" ? "✕" : "◌"}</span>{" "}
                  {reg.status === "published" ? strings.statusPublished : reg.status === "deactivated" ? t("admin.reg.status.deactivated", "Deactivated") : strings.statusDraft}
                </span>
              </div>
              <p className="ax-caption" style={{ margin: 0 }}>
                <span aria-hidden="true">ⓘ</span> {t("admin.reg.r1.detail.auditNote", "Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are audit-tracked too (trg_audit_regulation_clauses).")}
              </p>
            </section>

            <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-attachments-h">
              <h3 id="reg-attachments-h" style={{ margin: 0 }}>{t("admin.reg.attachments.heading", "Source attachments")}</h3>
              {attachments.length === 0 ? (
                <p className="ax-caption" role="status">{t("admin.reg.attachments.empty", "No attachment metadata recorded — verified zero.")}</p>
              ) : (
                <ul className="stack" style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)" }}>
                  {attachments.map(a => <li key={a.id}>
                    {attachmentUrls[a.id] ? <a className="ax-link" href={attachmentUrls[a.id]} target="_blank" rel="noreferrer"><strong>{a.file_name}</strong></a> : <strong>{a.file_name}</strong>}
                    {a.media_type ? ` · ${a.media_type}` : ""}{a.sha256 ? <> · <bdi dir="ltr" className="ax-numeric">SHA-256 {a.sha256.slice(0, 12)}…</bdi></> : null}
                  </li>)}
                </ul>
              )}
              {isWriter && reg.status === "draft" ? <AddRegulationAttachment regulationId={reg.id} strings={strings} /> : null}
              <p className="ax-caption" style={{ margin: 0 }}>{t("admin.reg.attachments.truth", "Files are uploaded to governed private storage, checksummed, and retrieved through short-lived signed links.")}</p>
            </section>

            {/* Clause navigator + clause→item dependency rail */}
            <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-clauses-h">
              <h3 id="reg-clauses-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.clauses.heading", "Clauses & mapped inspection items")}</h3>
              {clauses.length === 0 ? (
                // S03 EMPTY — no clauses: invite, never "complete/mapped"
                <div className="ax-state ax-state--inline" role="status">
                  <span className="ax-state__glyph" aria-hidden="true">📄</span>
                  <h4>{t("admin.reg.r1.detail.clauses.empty.title", "No clauses yet")}</h4>
                  <p className="ax-caption">{t("admin.reg.r1.detail.clauses.empty.body", "This regulation has no clauses. Add the first clause below — the read succeeded, it is genuinely empty.")}</p>
                </div>
              ) : (
                <div className="ax-tablewrap">
                  <table className="ax-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("admin.reg.r1.detail.col.clause", "Clause")}</th>
                        <th scope="col">{strings.title}</th>
                        <th scope="col">{strings.applicability}</th>
                        <th scope="col">{strings.legalSource}</th>
                        <th scope="col">{t("admin.reg.r1.detail.col.mappedItems", "Mapped items")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clauses.map(c => {
                        const items = Array.isArray(c.inspection_items) ? c.inspection_items : null;
                        return (
                          <tr key={c.id}>
                            <td className="ax-numeric"><strong><bdi dir="ltr">§{c.clause_ref ?? "—"}</bdi></strong></td>
                            <td>{c.title ?? "—"}</td>
                            <td className="ax-caption">{c.applicability ?? "—"}</td>
                            <td className="ax-caption">{c.legal_source ?? "—"}</td>
                            <td>
                              {items === null ? (
                                <span className="ax-lozenge ax-lozenge--warning"><span aria-hidden="true">⚠</span> {strings.railItemsUnknown}</span>
                              ) : items.length === 0 ? (
                                <span className="ax-caption"><span aria-hidden="true">○</span> {strings.railItemsZero}</span>
                              ) : (
                                items.map(i => (
                                  <span key={i.id} className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 6 }}>
                                    <bdi dir="ltr">{i.code}</bdi>
                                  </span>
                                ))
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="ax-caption" style={{ margin: 0 }}>
                <span aria-hidden="true">✓</span> {t("admin.reg.r1.detail.beyond", "Publish dependency gate is evaluated from the authoritative clause-to-item mappings shown above. Package versions freeze the referenced item snapshots at publication.")}
              </p>
            </section>

            {/* Writer actions — proven legs only */}
            {isWriter ? (
              <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-200)" }} aria-labelledby="reg-actions-h">
                <h3 id="reg-actions-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.actions.heading", "Author & publish")}</h3>

                {reg.status === "draft" ? <>
                  <EditRegulationDraft regulation={{ id: reg.id, title: reg.title, issuingAuthority: reg.issuing_authority, effectiveFrom: reg.effective_from }} strings={strings} />
                  <AddClauseForm regulationId={reg.id} strings={strings} />
                </> : null}

                {/* S04: the action performs the same mapped-clause validation shown here. */}
                {reg.status === "draft" ? (
                  <div className="stack" style={{ gap: "var(--ax-space-100)" }}>
                    <div className="row" style={{ gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap" }}>
                      <PublishRegulation regulationId={reg.id} strings={strings} />
                      <span className="ax-caption">{t("admin.reg.r1.detail.publish.direct", "Publish validates that at least one clause exists and every clause maps to an inspection item. Maker-checker rejects self-approval, and a successful transition is audited.")}</span>
                    </div>
                    <div className={`ax-banner ${unmappedClauses > 0 || clauses.length === 0 ? "ax-banner--warning" : ""}`} role={unmappedClauses > 0 || clauses.length === 0 ? "alert" : "status"}>
                      <strong><span aria-hidden="true">{unmappedClauses > 0 || clauses.length === 0 ? "⚠" : "✓"}</span> {t("admin.reg.r1.detail.validation.title", "Publish readiness")}</strong>{" "}
                      {clauses.length === 0
                        ? t("admin.reg.r1.detail.validation.noClauses", "Blocked: add at least one clause.")
                        : unmappedClauses > 0
                          ? fill(t("admin.reg.r1.detail.validation.unmapped", "Blocked: {n} clause(s) have no mapped inspection item."), { n: unmappedClauses })
                          : t("admin.reg.r1.detail.validation.ready", "Ready: every clause has at least one mapped inspection item.")}
                    </div>
                  </div>
                ) : reg.status === "published" ? (
                  <div className="ax-banner ax-banner--immutable" role="note">
                    <strong><span aria-hidden="true">🔒</span> {t("admin.reg.r1.detail.published.title", "Published — immutable at the database")}</strong>{" "}
                    {t("admin.reg.r1.detail.published.body", "Published regulation content is immutable at the database boundary. Create a draft with the same code and a new version label to publish a governed successor; the prior version is then deactivated and linked automatically.")}
                    <DeactivateRegulation regulationId={reg.id} strings={strings} />
                  </div>
                ) : <div className="ax-banner ax-banner--immutable" role="note"><strong><span aria-hidden="true">🔒</span> {t("admin.reg.deactivated.readonly", "Deactivated — read-only")}</strong></div>}
              </section>
            ) : null}

            <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-audit-h">
              <h3 id="reg-audit-h" style={{ margin: 0 }}>{t("admin.reg.audit.heading", "Configuration audit timeline")}</h3>
              {!isWriter ? <p className="ax-caption">{t("admin.reg.audit.readonly", "The scoped author timeline is available to configuration writers; this read-only persona is not granted that RPC.")}</p>
                : auditError ? <div className="ax-banner ax-banner--warning" role="alert">{t("admin.reg.audit.error", "The audit timeline is unavailable. Reload to retry; no empty-history claim is made.")}</div>
                : auditEvents.length === 0 ? <p className="ax-caption" role="status">{t("admin.reg.audit.empty", "No scoped audit events returned — verified zero.")}</p>
                : <ol className="stack" style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)" }}>{auditEvents.map(e => <li key={e.id}><strong>{e.action}</strong> · <bdi dir="ltr" className="ax-numeric">{e.occurred_at}</bdi>{e.actor ? <> · <bdi dir="ltr">{e.actor}</bdi></> : null}</li>)}</ol>}
            </section>

            <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-lineage-h">
              <h3 id="reg-lineage-h" style={{ margin: 0 }}>{t("admin.reg.lineage.heading", "Version lineage")}</h3>
              <ol className="stack" style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)" }}>
                {lineage.map(version => <li key={version.id}>
                  <a className="ax-link" href={`/admin/regulations?id=${encodeURIComponent(version.id)}`}><bdi dir="ltr" className="ax-numeric">{version.version_label}</bdi></a>
                  {" · "}{version.status}{version.effective_from ? <> · <bdi dir="ltr" className="ax-numeric">{version.effective_from.slice(0, 10)}</bdi></> : null}
                  {version.supersedes_id ? <> · {t("admin.reg.lineage.successor", "governed successor")}</> : null}
                  {version.deactivation_reason ? <div className="ax-caption">{version.deactivation_reason}</div> : null}
                </li>)}
              </ol>
            </section>
          </>
        )}
      </Shell>
    );
  }

  // =========================================================================
  // LIST MODE (CD-005) — dense register + Impact Footprint Rail
  // =========================================================================
  const lite: RegRowLite[] = rows.map(r => {
    const fp = footprint(r);
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      issuing_authority: r.issuing_authority,
      status: r.status,
      created_at: r.created_at,
      clauseCount: fp.clauseCount,
      itemCount: fp.itemCount,
    };
  });

  return (
    <Shell current="/admin/regulations" title={title} context={context}>
      {degradedBanner}
      {readOnlyBanner}
      {libraryTabs}

      {isWriter ? <div className="ax-banner ax-banner--warning" role="note"><strong>Legacy compatibility authoring.</strong>{" "}Direct regulation controls remain temporarily available for continuity. New or modified governed configuration should begin in a Compliance Configuration Request; this library remains the published source of truth.</div> : null}

      {isWriter ? <NewRegulationForm strings={strings} /> : null}

      {regsError ? null : rows.length === 0 ? (
        // S03 EMPTY — verified zero (read succeeded, genuinely no regulations)
        <EmptyState role="status" glyph="📜" title={t("admin.reg.r1.empty.title", "No regulations configured")}
          body={isWriter
            ? t("admin.reg.r1.empty.body.writer", "The read succeeded — the library is genuinely empty. Create the first regulation above (MVP1-M09-001: regulations are the parents of inspection items).")
            : t("admin.reg.r1.empty.body", "The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).")} />
      ) : (
        <RegulationRegister rows={lite} strings={strings} />
      )}
    </Shell>
  );
}
