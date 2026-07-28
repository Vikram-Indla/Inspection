import type { ReactNode } from "react";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import {
  RegulationLifecycleControl,
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
  target_legacy_id: string | null;
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
  clauses_status: "verified" | "verified_unknown";
  attachments_status: "verified" | "verified_unknown";
  regulation_attachments: { id: string; file_name: string; storage_path: string; media_type: string | null; sha256: string | null; created_at: string }[] | null;
  regulation_clauses: RawClause[] | null;
};
type LibraryRow = {
  entity_id: string;
  target_legacy_id: string | null;
  code: string | null;
  title: string | null;
  issuing_authority: string | null;
  version_label: string | null;
  created_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  operational_status: string;
  release_date: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  published_at: string | null;
  clauses: RawClause[] | null;
  clauses_status: "verified" | "verified_unknown";
  attachments: RawReg["regulation_attachments"];
  attachments_status: "verified" | "verified_unknown";
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
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
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
    .from("compliance_regulation_library")
    .select(
      "entity_id,target_legacy_id,code,title,issuing_authority,version_label,created_at,created_by,approved_by,operational_status,release_date,deactivated_at,deactivation_reason,published_at,clauses,clauses_status,attachments,attachments_status",
    )
    .order("code");
  const rows = ((regsData ?? []) as unknown as LibraryRow[]).map((row): RawReg => ({
    id: row.entity_id,
    target_legacy_id: row.target_legacy_id,
    code: row.code ?? "Not configured",
    title: row.title ?? "Not configured",
    issuing_authority: row.issuing_authority,
    status: row.operational_status,
    created_at: row.created_at,
    effective_from: row.release_date,
    effective_to: null,
    deactivated_at: row.deactivated_at,
    version_label: row.version_label ?? String(row.entity_id).slice(0, 8),
    supersedes_id: null,
    deactivation_reason: row.deactivation_reason,
    created_by: row.created_by,
    approved_by: row.approved_by,
    published_at: row.published_at,
    regulation_attachments: row.attachments,
    regulation_clauses: row.clauses,
    clauses_status: row.clauses_status,
    attachments_status: row.attachments_status,
  }));

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
    statusPublished: t("admin.reg.r1.status.active", copy("Active", "فعال")),
    statusDraft: t("admin.reg.r1.status.scheduled", copy("Scheduled", "مجدول")),
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
        <bdi dir="ltr" className="numeric">{readAt}</bdi>
        {after ?? ""}
      </>
    );
  })();

  const title = t("admin.reg.r1.title", "Compliance Library — regulation register");
  const context = (
    <span className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
      <span className="badge badge-info">SCR-ADM-010/011</span>
      <a className="sq-link" href="/admin/compliance-requests">
        {t("admin.reg.requests", "Configuration Requests")}
      </a>
      <span role="status" aria-live="polite" className="t-caption">{readAtNode}</span>
      {regsError ? (
        <span className="badge badge-warning"><span aria-hidden="true">⚠</span> {t("admin.reg.r1.degraded.chip", "register unavailable")}</span>
      ) : null}
    </span>
  );
  const libraryTabs = (
    <nav className="cmp-library-tabs" aria-label="Compliance Library">
      <a className="btn btn-primary btn-lg btn-touch" href="/admin/regulations" aria-current="page">Regulations</a>
      <a className="btn btn-secondary sq-link btn-touch" href="/admin/items">Inspection Items</a>
      {isWriter ? <a className="btn btn-secondary sq-link btn-touch" href="/admin/compliance-requests/new">Create governed request</a> : null}
    </nav>
  );

  // ---- S05/S06 read-only disclosure inside the module route guard ----
  const readOnlyBanner = roleError ? (
    <div className="sq-banner sq-banner--warning" role="alert"><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div>
  ) : !isWriter ? (
    <div className="sq-banner" role="note">
      <strong><span aria-hidden="true">👁</span> {isReviewer
        ? t("admin.reg.r1.readonly.reviewer.title", "Reviewer — read-only")
        : t("admin.reg.r1.readonly.title", "Read-only for your role")}</strong>{" "}
      {t("admin.reg.r1.readonly.body", "You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. The route guard and database permissions are independent controls.")}
    </div>
  ) : null;

  // ---- S08 degraded / S09 recovery (register read failed — isolate; never zero) ----
  const degradedBanner = regsError ? (
    <div className="sq-banner sq-banner--warning" role="alert">
      <strong><span aria-hidden="true">⚠</span> {t("admin.reg.r1.degraded.title", "The regulation register couldn't be read.")}</strong>{" "}
      {t("admin.reg.r1.degraded.body", "Nothing is shown as zero — the count is unknown, not empty. Your session and navigation still work.")}
      {" "}
      <a className="sq-link" href={detailId ? `/admin/regulations?id=${encodeURIComponent(detailId)}` : "/admin/regulations"}>
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
      ? await sb.rpc("compliance_regulation_audit", { p_entity_id: reg.id })
      : { data: null, error: null };
    const auditEvents = Array.isArray(auditData) ? auditData as Array<{
      id: number; actor: string | null; action: string; occurred_at: string;
    }> : [];

    return (
      <Shell current="/admin/regulations" title={title} context={context}>
        {degradedBanner}
        {readOnlyBanner}
        {libraryTabs}

        <p className="t-caption" style={{ margin: 0 }}>
          <a className="sq-link" href="/admin/regulations">← {t("admin.reg.r1.backToRegister", "Back to register")}</a>
        </p>

        {regsError ? null : !reg ? (
          <EmptyState role="status" glyph="🔎" title={t("admin.reg.r1.detail.notFound.title", "Regulation not found")}
            body={t("admin.reg.r1.detail.notFound.body", "The read succeeded but no regulation has this identifier. It may have been removed.")} />
        ) : (
          <>
            {/* Dossier header */}
            <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }} aria-labelledby="reg-dossier-h">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: "var(--space-1)" }}>
                  <h2 id="reg-dossier-h" style={{ margin: 0 }}>
                    <span className="numeric"><bdi dir="ltr">{reg.code}</bdi></span> — {reg.title}
                  </h2>
                  <p className="t-caption" style={{ margin: 0 }}>
                    {reg.issuing_authority || "—"}
                    {reg.created_at ? <> · {strings.createdAtLabel} <bdi dir="ltr" className="numeric">{reg.created_at.slice(0, 10)}</bdi></> : null}
                    {reg.effective_from ? <> · {strings.effectiveFrom} <bdi dir="ltr" className="numeric">{reg.effective_from.slice(0, 10)}</bdi></> : null}
                    <> · {strings.versionLabel} <bdi dir="ltr" className="numeric">{reg.version_label}</bdi></>
                  </p>
                </div>
                <span className={`sq-lozenge ${reg.status === "active" ? "sq-lozenge--success" : reg.status === "deactivated" ? "sq-lozenge--critical" : "sq-lozenge--warning"}`}>
                  <span aria-hidden="true">{reg.status === "active" ? "●" : reg.status === "deactivated" ? "✕" : "◷"}</span>{" "}
                  {reg.status === "active" ? strings.statusPublished : reg.status === "deactivated" ? t("admin.reg.status.deactivated", "Deactivated") : strings.statusDraft}
                </span>
              </div>
              <p className="t-caption" style={{ margin: 0 }}>
                <span aria-hidden="true">ⓘ</span> {t("admin.reg.r1.detail.auditNote", "Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are audit-tracked too (trg_audit_regulation_clauses).")}
              </p>
            </section>

            <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }} aria-labelledby="reg-attachments-h">
              <h3 id="reg-attachments-h" style={{ margin: 0 }}>{t("admin.reg.attachments.heading", "Source attachments")}</h3>
              {reg.attachments_status === "verified_unknown" ? (
                <p className="t-caption" role="status">{t("admin.reg.attachments.unknown", "Attachment footprint is unknown for this canonical version; no zero claim is made.")}</p>
              ) : attachments.length === 0 ? (
                <p className="t-caption" role="status">{t("admin.reg.attachments.empty", "No attachment metadata recorded — verified zero.")}</p>
              ) : (
                <ul className="stack" style={{ margin: 0, paddingInlineStart: "var(--space-6)" }}>
                  {attachments.map(a => <li key={a.id}>
                    {attachmentUrls[a.id] ? <a className="sq-link" href={attachmentUrls[a.id]} target="_blank" rel="noreferrer"><strong>{a.file_name}</strong></a> : <strong>{a.file_name}</strong>}
                    {a.media_type ? ` · ${a.media_type}` : ""}{a.sha256 ? <> · <bdi dir="ltr" className="numeric">SHA-256 {a.sha256.slice(0, 12)}…</bdi></> : null}
                  </li>)}
                </ul>
              )}
              <p className="t-caption" style={{ margin: 0 }}>{t("admin.reg.attachments.truth", "Files are uploaded to governed private storage, checksummed, and retrieved through short-lived signed links.")}</p>
            </section>

            {/* Clause navigator + clause→item dependency rail */}
            <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }} aria-labelledby="reg-clauses-h">
              <h3 id="reg-clauses-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.clauses.heading", "Clauses & mapped inspection items")}</h3>
              {clauses.length === 0 ? (
                // S03 EMPTY — no clauses: invite, never "complete/mapped"
                <div className="sq-state sq-state--inline" role="status">
                  <span className="sq-state__glyph" aria-hidden="true">📄</span>
                  <h4>{t("admin.reg.r1.detail.clauses.empty.title", "No clauses yet")}</h4>
                  <p className="t-caption">{t("admin.reg.r1.detail.clauses.empty.body", "This regulation has no clauses. Add the first clause below — the read succeeded, it is genuinely empty.")}</p>
                </div>
              ) : (
                <div className="sq-tablewrap">
                  <table className="sq-table">
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
                            <td className="numeric"><strong><bdi dir="ltr">§{c.clause_ref ?? "—"}</bdi></strong></td>
                            <td>{c.title ?? "—"}</td>
                            <td className="t-caption">{c.applicability ?? "—"}</td>
                            <td className="t-caption">{c.legal_source ?? "—"}</td>
                            <td>
                              {items === null ? (
                                <span className="badge badge-warning"><span aria-hidden="true">⚠</span> {strings.railItemsUnknown}</span>
                              ) : items.length === 0 ? (
                                <span className="t-caption"><span aria-hidden="true">○</span> {strings.railItemsZero}</span>
                              ) : (
                                items.map(i => (
                                  <span key={i.id} className="badge badge-info" style={{ marginInlineEnd: 6 }}>
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
              <p className="t-caption" style={{ margin: 0 }}>
                <span aria-hidden="true">✓</span> {t("admin.reg.r1.detail.beyond", "Publish dependency gate is evaluated from the authoritative clause-to-item mappings shown above. Package versions freeze the referenced item snapshots at publication.")}
              </p>
            </section>

            {/* Configuration content is changed only through a governed request. */}
            {isWriter ? (
              <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }} aria-labelledby="reg-actions-h">
                <h3 id="reg-actions-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.actions.heading", "Governed configuration")}</h3>
                <div className="sq-banner sq-banner--immutable" role="note">
                  <strong><span aria-hidden="true">🔒</span> {t("admin.reg.requestOnly.title", copy("Request-controlled content", "محتوى خاضع لطلب تغيير"))}</strong>{" "}
                  {t("admin.reg.requestOnly.body", copy("Create and modify operations, including clauses, attachments, release dates, and successor versions, must be completed through a Compliance Configuration Request. The currently approved version remains available until that request is approved and published.", "يجب تنفيذ عمليات الإنشاء والتعديل، بما فيها البنود والمرفقات وتواريخ الإصدار والإصدارات اللاحقة، من خلال طلب تهيئة الامتثال. ويظل الإصدار المعتمد حالياً متاحاً حتى اعتماد الطلب ونشره."))}
                </div>
                <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <a className="btn btn-primary btn-lg btn-touch" href="/admin/compliance-requests/new">
                    {t("admin.reg.requestOnly.create", copy("Create configuration request", "إنشاء طلب تهيئة"))}
                  </a>
                  <a className="btn btn-secondary sq-link btn-touch" href="/admin/compliance-requests">
                    {t("admin.reg.requestOnly.view", copy("View configuration requests", "عرض طلبات التهيئة"))}
                  </a>
                </div>
                {reg.status !== "deactivated" ? (
                  <div className={`sq-banner ${unmappedClauses > 0 || clauses.length === 0 ? "sq-banner--warning" : ""}`} role={unmappedClauses > 0 || clauses.length === 0 ? "alert" : "status"}>
                    <strong><span aria-hidden="true">{unmappedClauses > 0 || clauses.length === 0 ? "⚠" : "✓"}</span> {t("admin.reg.r1.detail.validation.title", "Publication dependency status")}</strong>{" "}
                    {clauses.length === 0
                      ? t("admin.reg.r1.detail.validation.noClauses", "Blocked: at least one clause is required.")
                      : unmappedClauses > 0
                        ? fill(t("admin.reg.r1.detail.validation.unmapped", "Blocked: {n} clause(s) have no mapped inspection item."), { n: unmappedClauses })
                        : t("admin.reg.r1.detail.validation.ready", "Every clause has at least one mapped inspection item. Approval and publication still occur through the request workflow.")}
                  </div>
                ) : null}
                <p className="t-caption" style={{ margin: 0 }}>
                  {t("admin.reg.operationalTransition.truth", copy("Lifecycle changes are atomic and audited. Deactivation cascades future-use unavailability to dependent items, violations, and penalties while preserving historical versions. Reactivation never reactivates children.", "تغييرات دورة الحياة ذرّية ومدققة. يؤدي إلغاء التفعيل إلى منع الاستخدام المستقبلي للبنود والمخالفات والجزاءات التابعة مع الحفاظ على الإصدارات التاريخية. ولا يعيد التفعيل تفعيل العناصر التابعة."))}
                </p>
                <RegulationLifecycleControl
                  entityId={reg.id}
                  operationalStatus={reg.status}
                  labels={{
                    activationReason: t("admin.reg.lifecycle.activationReason", copy("Activation reason", "سبب التفعيل")),
                    deactivationReason: t("admin.reg.lifecycle.deactivationReason", copy("Deactivation reason", "سبب إلغاء التفعيل")),
                    applying: t("admin.reg.lifecycle.applying", copy("Applying…", "جارٍ التطبيق…")),
                    activate: t("admin.reg.lifecycle.activate", copy("Activate regulation", "تفعيل اللائحة")),
                    deactivate: t("admin.reg.lifecycle.deactivate", copy("Deactivate regulation", "إلغاء تفعيل اللائحة")),
                    alreadyMatched: t("admin.reg.lifecycle.alreadyMatched", copy("State already matched.", "الحالة مطابقة بالفعل.")),
                    changedTo: t("admin.reg.lifecycle.changedTo", copy("Lifecycle changed to {status}.", "تم تغيير دورة الحياة إلى {status}.")),
                    cascaded: t("admin.reg.lifecycle.cascaded", copy("Cascaded: {items} items, {violations} violations, {penalties} penalties.", "تم تطبيق التغيير على: {items} بنود، {violations} مخالفات، {penalties} جزاءات.")),
                    childrenNotReactivated: t("admin.reg.lifecycle.childrenNotReactivated", copy("Child configurations were not reactivated.", "لم تتم إعادة تفعيل التهيئات التابعة.")),
                    missingReference: t("admin.reg.lifecycle.missingReference", copy("Missing regulation reference.", "مرجع اللائحة مفقود.")),
                    reasonRequired: t("admin.reg.lifecycle.reasonRequired", copy("A lifecycle reason is required.", "سبب تغيير دورة الحياة مطلوب.")),
                    denied: t("admin.reg.lifecycle.denied", copy("You are not authorized to change regulation lifecycle state.", "ليست لديك صلاحية تغيير حالة دورة حياة اللائحة.")),
                    notFound: t("admin.reg.lifecycle.notFound", copy("The regulation no longer exists or is outside your scope.", "اللائحة غير موجودة أو خارج نطاق صلاحيتك.")),
                    providerError: t("admin.reg.lifecycle.providerError", copy("The lifecycle change could not be completed. Retry safely.", "تعذر إكمال تغيير دورة الحياة. أعد المحاولة بأمان.")),
                  }}
                />
              </section>
            ) : null}

            <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }} aria-labelledby="reg-audit-h">
              <h3 id="reg-audit-h" style={{ margin: 0 }}>{t("admin.reg.audit.heading", "Configuration audit timeline")}</h3>
              {!isWriter ? <p className="t-caption">{t("admin.reg.audit.readonly", "The scoped author timeline is available to configuration writers; this read-only persona is not granted that RPC.")}</p>
                : auditError ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.reg.audit.error", "The audit timeline is unavailable. Reload to retry; no empty-history claim is made.")}</div>
                : auditEvents.length === 0 ? <p className="t-caption" role="status">{t("admin.reg.audit.empty", "No scoped audit events returned — verified zero.")}</p>
                : <ol className="stack" style={{ margin: 0, paddingInlineStart: "var(--space-6)" }}>{auditEvents.map(e => <li key={e.id}><strong>{e.action}</strong> · <bdi dir="ltr" className="numeric">{e.occurred_at}</bdi>{e.actor ? <> · <bdi dir="ltr">{e.actor}</bdi></> : null}</li>)}</ol>}
            </section>

            <section className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }} aria-labelledby="reg-lineage-h">
              <h3 id="reg-lineage-h" style={{ margin: 0 }}>{t("admin.reg.lineage.heading", "Version lineage")}</h3>
              <ol className="stack" style={{ margin: 0, paddingInlineStart: "var(--space-6)" }}>
                {lineage.map(version => <li key={version.id}>
                  <a className="sq-link" href={`/admin/regulations?id=${encodeURIComponent(version.id)}`}><bdi dir="ltr" className="numeric">{version.version_label}</bdi></a>
                  {" · "}{version.status}{version.effective_from ? <> · <bdi dir="ltr" className="numeric">{version.effective_from.slice(0, 10)}</bdi></> : null}
                  {version.supersedes_id ? <> · {t("admin.reg.lineage.successor", "governed successor")}</> : null}
                  {version.deactivation_reason ? <div className="t-caption">{version.deactivation_reason}</div> : null}
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

      {isWriter ? (
        <div className="sq-banner" role="note">
          <strong>{t("admin.reg.requestOnly.title", copy("Request-controlled content", "محتوى خاضع لطلب تغيير"))}</strong>{" "}
          {t("admin.reg.library.requestOnly", copy("This library is the read and discovery surface. Create and modify operations begin in a Compliance Configuration Request; approved historical versions remain unchanged.", "هذه المكتبة مخصصة للعرض والاستكشاف. تبدأ عمليات الإنشاء والتعديل من طلب تهيئة الامتثال، وتظل الإصدارات التاريخية المعتمدة دون تغيير."))}
          {" "}
          <a className="sq-link" href="/admin/compliance-requests/new">{t("admin.reg.requestOnly.create", copy("Create configuration request", "إنشاء طلب تهيئة"))}</a>
        </div>
      ) : null}

      {regsError ? null : rows.length === 0 ? (
        // S03 EMPTY — verified zero (read succeeded, genuinely no regulations)
        <EmptyState role="status" glyph="📜" title={t("admin.reg.r1.empty.title", "No regulations configured")}
          body={isWriter
            ? t("admin.reg.r1.empty.body.writer", "The read succeeded — the library is genuinely empty. Create the first governed configuration through a Compliance Configuration Request.")
            : t("admin.reg.r1.empty.body", "The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).")} />
      ) : (
        <RegulationRegister rows={lite} strings={strings} />
      )}
    </Shell>
  );
}
