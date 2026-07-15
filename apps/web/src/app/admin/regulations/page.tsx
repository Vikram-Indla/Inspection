import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  NewRegulationForm,
  PublishRegulation,
  AddClauseForm,
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
// enforced at the database boundary. The legs still wired to nothing (rendered as visibly
// disabled HANDOFF_BLOCKED targets) are the mapped-clause validation gate, version
// compare/lineage, the dependency engine, the audit-timeline read (write-side audit exists,
// but audit_events read is not granted), the dedicated detail route, and the Admin-family
// route guard. Both regulation-row and clause changes are now audit-tracked at the DB.
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

  // Role scope — writes are RLS-gated to compliance_admin/form_admin. This mirrors the
  // RLS write grant in the UI (S05/S06); it is NOT a route guard (that leg stays BLOCKED).
  const { data: { user } } = await sb.auth.getUser();
  const { data: roleRows } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const roles = new Set((roleRows ?? []).map(r => r.role_key));
  const isWriter = roles.has("compliance_admin") || roles.has("form_admin");
  const isReviewer = roles.has("reviewer");

  const { data: regsData, error: regsError } = await sb
    .from("regulations")
    .select(
      "id, code, title, issuing_authority, status, created_at, regulation_clauses(id, clause_ref, title, applicability, legal_source, inspection_items(id, code))",
    )
    .order("code");
  const rows = (regsData ?? []) as unknown as RawReg[];

  const strings: RegStrings = {
    code: t("admin.reg.form.code", "Code"),
    title: t("admin.reg.form.title", "Title"),
    issuingAuthority: t("admin.reg.form.issuingAuthority", "Issuing authority"),
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
    publish: t("admin.reg.publish", "Publish now (direct)"),
    searchPlaceholder: t("admin.reg.r1.search.placeholder", "Search code, title, authority…"),
    filterAll: t("admin.reg.r1.filter.all", "All {n}"),
    filterPublished: t("admin.reg.r1.filter.published", "Published {n}"),
    filterDraft: t("admin.reg.r1.filter.draft", "Draft {n}"),
    filterLegend: t("admin.reg.r1.filter.legend", "Filter by lifecycle"),
    statusPublished: t("admin.reg.r1.status.published", "Published"),
    statusDraft: t("admin.reg.r1.status.draft", "Draft"),
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

  const blockedTag = t("admin.reg.r1.blocked.tag", "HANDOFF_BLOCKED");
  const ownerLabel = t("admin.reg.r1.blocked.owner", "owner:");

  // Server-rendered disabled contract target (wired to nothing).
  function Blocked({ label, reason, owner }: { label: string; reason: string; owner: string }) {
    return (
      <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
        <button type="button" className="ax-btn ax-btn--subtle" disabled aria-disabled="true">
          <span aria-hidden="true">🔒</span> {label}
        </button>
        <span className="ax-caption">
          <span className="ax-lozenge ax-lozenge--warning"><span aria-hidden="true">⚠</span> {blockedTag}</span>{" "}
          {reason} · {ownerLabel} {owner}
        </span>
      </div>
    );
  }

  const title = t("admin.reg.r1.title", "Compliance Library — regulation register");
  const context = (
    <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
      <span className="ax-lozenge ax-lozenge--info">SCR-ADM-010/011</span>
      <span role="status" aria-live="polite" className="ax-caption">{readAtNode}</span>
      {regsError ? (
        <span className="ax-lozenge ax-lozenge--warning"><span aria-hidden="true">⚠</span> {t("admin.reg.r1.degraded.chip", "register unavailable")}</span>
      ) : null}
    </span>
  );

  // ---- S05/S06 read-only disclosure (RLS write grant mirrored; route guard BLOCKED) ----
  const readOnlyBanner = !isWriter ? (
    <div className="ax-banner" role="note">
      <strong><span aria-hidden="true">👁</span> {isReviewer
        ? t("admin.reg.r1.readonly.reviewer.title", "Reviewer — read-only")
        : t("admin.reg.r1.readonly.title", "Read-only for your role")}</strong>{" "}
      {t("admin.reg.r1.readonly.body", "You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. A dedicated Admin-family route guard is not implemented (HANDOFF_BLOCKED, owner: platform) — visibility here grants nothing.")}
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

    return (
      <Shell current="/admin" title={title} context={context}>
        {degradedBanner}
        {readOnlyBanner}

        <p className="ax-caption" style={{ margin: 0 }}>
          <a className="ax-link" href="/admin/regulations">← {t("admin.reg.r1.backToRegister", "Back to register")}</a>
        </p>

        {regsError ? null : !reg ? (
          <div className="ax-surface"><div className="ax-state" role="status">
            <span className="ax-state__glyph" aria-hidden="true">🔎</span>
            <h4>{t("admin.reg.r1.detail.notFound.title", "Regulation not found")}</h4>
            <p className="ax-caption">{t("admin.reg.r1.detail.notFound.body", "The read succeeded but no regulation has this identifier. It may have been removed.")}</p>
          </div></div>
        ) : (
          <>
            {/* Dossier header */}
            <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-dossier-h">
              <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
                <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
                  <h2 id="reg-dossier-h" style={{ margin: 0 }}>
                    <span className="ax-numeric"><bdi dir="ltr">{reg.code}</bdi></span> — {reg.title}
                  </h2>
                  <p className="ax-caption" style={{ margin: 0 }}>
                    {reg.issuing_authority || "—"}
                    {reg.created_at ? <> · {strings.createdAtLabel} <bdi dir="ltr" className="ax-numeric">{reg.created_at.slice(0, 10)}</bdi></> : null}
                  </p>
                </div>
                <span className={`ax-lozenge ${reg.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>
                  <span aria-hidden="true">{reg.status === "published" ? "●" : "◌"}</span>{" "}
                  {reg.status === "published" ? strings.statusPublished : strings.statusDraft}
                </span>
              </div>
              <p className="ax-caption" style={{ margin: 0 }}>
                <span aria-hidden="true">ⓘ</span> {t("admin.reg.r1.detail.auditNote", "Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are audit-tracked too (trg_audit_regulation_clauses).")}
              </p>
            </section>

            {/* Clause navigator + clause→item dependency rail */}
            <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="reg-clauses-h">
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
                <span aria-hidden="true">⋯</span> {t("admin.reg.r1.detail.beyond", "Downstream of mapped items (packages, active visits, violations, reports): Not evaluated — no verified source (HANDOFF_BLOCKED, owner: product/backend).")}
              </p>
            </section>

            {/* Writer actions — proven legs only */}
            {isWriter ? (
              <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-200)" }} aria-labelledby="reg-actions-h">
                <h3 id="reg-actions-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.actions.heading", "Author & publish")}</h3>

                {/* Proven: add clause */}
                <AddClauseForm regulationId={reg.id} strings={strings} />

                {/* Proven: direct publish (draft only) + S04 validation DISCLOSURE (not a gate) */}
                {reg.status === "draft" ? (
                  <div className="ax-stack" style={{ gap: "var(--ax-space-100)" }}>
                    <div className="ax-row" style={{ gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap" }}>
                      <PublishRegulation regulationId={reg.id} strings={strings} />
                      <span className="ax-caption">{t("admin.reg.r1.detail.publish.direct", "Direct draft→published — applies immediately with no mapped-clause validation gate, but the DB maker-checker rejects self-approval (approver must differ from creator) and the change is audited on the regulation row.")}</span>
                    </div>
                    {/* S04 VALIDATION — disclosure only; there is no working validation button */}
                    <div className="ax-banner" role="note">
                      <strong><span aria-hidden="true">ⓘ</span> {t("admin.reg.r1.detail.validation.title", "Mapped-clause validation gate is not available")}</strong>{" "}
                      {t("admin.reg.r1.detail.validation.body", "Maker-checker (distinct approver) and the published-immutability lock are now enforced by the database on publish. The one unbuilt leg is the mapped-clause validation gate — the direct publish above does not pre-check clause→item mappings.")}
                      {unmappedClauses > 0 ? (
                        <> {fill(t("admin.reg.r1.detail.validation.unmapped", "For awareness: {n} clause(s) have no mapped inspection items. This is disclosure, not a blocker — direct publish will still apply."), { n: unmappedClauses })}</>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="ax-banner ax-banner--immutable" role="note">
                    <strong><span aria-hidden="true">🔒</span> {t("admin.reg.r1.detail.published.title", "Published — immutable at the database")}</strong>{" "}
                    {t("admin.reg.r1.detail.published.body", "trg_guard_published_regulation rejects any modification of a published or locked regulation at the database boundary; a change requires a governed successor draft. The successor-version lineage model itself remains a separate backend contract (owner: product/backend).")}
                  </div>
                )}
              </section>
            ) : null}
          </>
        )}

        {/* Governed capabilities — screen-level truth. Renders in detail mode whether or
            not the regulation is found, because these legs are blocked regardless of row. */}
        {regsError ? null : (
            <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-200)" }} aria-labelledby="reg-blocked-h">
              <h3 id="reg-blocked-h" style={{ margin: 0 }}>{t("admin.reg.r1.detail.blocked.heading", "Governed capabilities — not implemented")}</h3>
              <div className="ax-row" style={{ gap: "var(--ax-space-300)", flexWrap: "wrap" }}>
                <Blocked
                  label={t("admin.reg.r1.detail.blocked.validatedPublish", "Submit for validated publish")}
                  reason={t("admin.reg.r1.detail.blocked.validatedPublish.reason", "mapped-clause validation gate not built (maker-checker + published lock are already DB-enforced on direct publish)")}
                  owner={t("admin.reg.r1.detail.blocked.owner.productBackend", "product/backend")}
                />
                <Blocked
                  label={t("admin.reg.r1.detail.blocked.compare", "Compare versions / lineage")}
                  reason={t("admin.reg.r1.detail.blocked.compare.reason", "no version history, compare, or supersede model exists")}
                  owner={t("admin.reg.r1.detail.blocked.owner.productBackend", "product/backend")}
                />
                <Blocked
                  label={t("admin.reg.r1.detail.blocked.dependency", "Run dependency validation")}
                  reason={t("admin.reg.r1.detail.blocked.dependency.reason", "no dependency/overlap engine exists")}
                  owner={t("admin.reg.r1.detail.blocked.owner.productBackend", "product/backend")}
                />
                <Blocked
                  label={t("admin.reg.r1.detail.blocked.audit", "Open audit timeline")}
                  reason={t("admin.reg.r1.detail.blocked.audit.reason", "audit_events read is not granted to compliance/form admin")}
                  owner={t("admin.reg.r1.detail.blocked.owner.backend", "backend")}
                />
                <Blocked
                  label={t("admin.reg.r1.detail.blocked.route", "Open dedicated detail route")}
                  reason={t("admin.reg.r1.detail.blocked.route.reason", "/admin/regulations/:id is not implemented — this dossier is a logical mode")}
                  owner={t("admin.reg.r1.detail.blocked.owner.platform", "platform")}
                />
              </div>
            </section>
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
    <Shell current="/admin" title={title} context={context}>
      {degradedBanner}
      {readOnlyBanner}

      {isWriter ? <NewRegulationForm strings={strings} /> : null}

      {regsError ? null : rows.length === 0 ? (
        // S03 EMPTY — verified zero (read succeeded, genuinely no regulations)
        <div className="ax-surface"><div className="ax-state" role="status">
          <span className="ax-state__glyph" aria-hidden="true">📜</span>
          <h4>{t("admin.reg.r1.empty.title", "No regulations configured")}</h4>
          <p className="ax-caption">
            {isWriter
              ? t("admin.reg.r1.empty.body.writer", "The read succeeded — the library is genuinely empty. Create the first regulation above (MVP1-M09-001: regulations are the parents of inspection items).")
              : t("admin.reg.r1.empty.body", "The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).")}
          </p>
        </div></div>
      ) : (
        <RegulationRegister rows={lite} strings={strings} />
      )}
    </Shell>
  );
}
