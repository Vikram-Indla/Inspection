import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import {
  NewItemForm,
  EditItemForm,
  ToggleActive,
  ItemPreview,
  type ClauseOption,
  type ItemStrings,
  type PreviewStrings,
  type PreviewItem,
} from "./Controls";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import { getItemUsage, type ItemUsage } from "./actions";

// CD-007 / SCR-ADM-020 — Inspection Item Catalogue (semantic catalogue + read-only
// runtime-preview strip). Truth-over-completion: SELECT is any authenticated (RLS);
// writes require compliance_admin/form_admin (RLS is the authority and the route layout
// prevents unrelated roles from loading this module). inspection_items changes are audit-tracked and writers receive only the
// object-scoped timeline. Usage aggregates, conditional authoring, all evidence types,
// mandatory-when-visible and scoring enablement consume the completion backend.
// Item edits create an archived configuration version before the current row advances.
export const dynamic = "force-dynamic";

const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tmpl);

type ResponseModel = {
  responses?: string[];
  mapping?: Record<string, { result?: string; violation?: string }>;
  score_excluded_on?: string[];
  requirement?: "required" | "optional" | "conditional";
  scoring_enabled?: boolean;
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
};
type EvidenceRule = { on?: string; type?: string; min?: number; mandatory?: boolean } | null;

export default async function Items({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const sp = await searchParams;
  const auditItemId = typeof sp.audit === "string" ? sp.audit : Array.isArray(sp.audit) ? sp.audit[0] : undefined;

  // Two independent reads so a clause-list failure (S08 degraded) never hides the
  // catalogue: the catalogue renders and only the clause control degrades.
  const [{ data: items, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("inspection_items")
      .select("id, code, title, clause_id, active, configuration_version, deactivation_reason, score_weight, response_model, evidence_rule, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, regulations(code))")
      .order("code"),
    sb.from("regulation_clauses")
      .select("id, clause_ref, title, regulations(code)")
      .order("clause_ref"),
  ]);
  if (error) logProviderError("admin items read", error);
  if (clauseError) logProviderError("admin item clauses read", clauseError);

  const clauseUnavailable = !!clauseError;
  const clauseOptions: ClauseOption[] = (clauses ?? []).map(c => {
    const reg = c.regulations as unknown as { code: string } | null;
    return { id: c.id, label: `${reg?.code ?? "?"} §${c.clause_ref} — ${c.title ?? ""}` };
  });

  const readAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  const rows = items ?? [];
  const { data: { user } } = await getServerUser();
  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRows ?? []).map(r => r.role_key));
  const isWriter = roles.has("compliance_admin") || roles.has("form_admin");

  const usageEntries = isWriter ? await Promise.all(rows.map(async i => [i.id, await getItemUsage(i.code)] as const)) : [];
  const usageById = new Map<string, ItemUsage | null>(usageEntries);
  const auditItem = auditItemId ? rows.find(i => i.id === auditItemId) : undefined;
  const auditResult = isWriter && auditItem
    ? await sb.rpc("admin_configuration_audit", { p_object_type: "inspection_items", p_object_id: auditItem.id })
    : { data: null, error: null };
  const auditEvents = !auditResult.error && Array.isArray(auditResult.data)
    ? auditResult.data as Array<{ id: number; action: string; actor: string | null; occurred_at: string }>
    : [];

  // ---- localized string bundles (EN fallback in code, AR seeded in ui_strings) ----
  const responseLabels: Record<string, string> = {
    compliant: t("enum.compliant", "compliant"),
    non_compliant: t("enum.non_compliant", "non compliant"),
    na: t("enum.na", "na"),
    value_date: t("enum.value_date", "value date"),
  };
  const rLabel = (r: string) => responseLabels[r] ?? r.replace(/_/g, " ");

  const strings: ItemStrings = {
    code: t("admin.items.r2.form.code", "Code"),
    title: t("admin.items.r2.form.title", "Title"),
    titlePlaceholder: t("admin.items.r2.form.titlePlaceholder", "Inspection item title"),
    clause: t("admin.items.r2.form.clause", "Clause (M09-002)"),
    selectClause: t("admin.items.r2.form.selectClause", "Select clause…"),
    clauseUnavailable: t("admin.items.r2.form.clauseUnavailable", "Clause list unavailable — try again"),
    weight: t("admin.items.r2.form.weight", "Weight"),
    responseModel: t("admin.items.r2.form.responseModel", "Response model (M09-019)"),
    responseTriState: `${responseLabels.compliant} / ${responseLabels.non_compliant} / ${responseLabels.na}`,
    responseBinary: `${responseLabels.compliant} / ${responseLabels.non_compliant}`,
    responseValueDate: responseLabels.value_date,
    evidenceRule: t("admin.items.r2.form.evidenceRule", "Evidence rule (M09-005)"),
    evidenceNone: t("admin.items.r2.form.evidenceNone", "No base evidence rule"),
    evidencePhotoNc: t("admin.items.r2.form.evidencePhotoNc", "Photo mandatory on non-compliant"),
    evidenceVideoNc: t("admin.items.r2.form.evidenceVideoNc", "Video mandatory on non-compliant"),
    evidenceDocumentNc: t("admin.items.r2.form.evidenceDocumentNc", "Document mandatory on non-compliant"),
    evidenceCommentNc: t("admin.items.r2.form.evidenceCommentNc", "Comment mandatory on non-compliant"),
    evidenceSource: t("admin.items.r2.form.evidenceSource", "Configured policy — governed preset, not free text (M09-005/025)."),
    requirementMode: t("admin.items.r2.form.requirementMode", "Requirement mode"),
    requirementRequired: t("admin.items.r2.form.requirementRequired", "Required"),
    requirementOptional: t("admin.items.r2.form.requirementOptional", "Optional"),
    requirementConditional: t("admin.items.r2.form.requirementConditional", "Conditional"),
    visibleWhen: t("admin.items.r2.form.visibleWhen", "Visible when"),
    visibleWhenHint: t("admin.items.r2.form.visibleWhenHint", "Use the governed key=value grammar."),
    mandatoryWhenVisible: t("admin.items.r2.form.mandatoryWhenVisible", "Mandatory when visible"),
    scoringEnabled: t("admin.items.r2.form.scoringEnabled", "Scoring enabled"),
    scoringDisabled: t("admin.items.r2.form.scoringDisabled", "Scoring disabled"),
    guidance: t("admin.items.r2.form.guidance", "Guidance (EN)"),
    guidancePlaceholder: t("admin.items.r2.form.guidancePlaceholder", "What the inspector verifies"),
    creating: t("admin.items.r2.form.creating", "Creating…"),
    create: t("admin.items.r2.form.create", "Create item"),
    created: t("admin.items.r2.form.created", "Item created"),
    duplicate: t("admin.items.r2.form.duplicate", "That item code already exists — codes are unique."),
    saving: t("admin.items.r2.toggle.saving", "Saving…"),
    deactivate: t("admin.items.r2.toggle.deactivate", "Deactivate"),
    reactivate: t("admin.items.r2.toggle.reactivate", "Reactivate"),
    reasonNote: t("admin.items.r2.toggle.reasonNote", "History is preserved; the required reason and item-row change are recorded in audit history."),
    deactivationReason: t("admin.items.r2.form.deactivationReason", "Deactivation reason"),
    saveDraft: t("admin.items.r2.edit.save", "Save new version"),
    draftSaved: t("admin.items.r2.edit.saved", "New item version saved"),
  };

  const previewStrings: PreviewStrings = {
    select: t("admin.items.r2.preview.select", "Preview item"),
    empty: t("admin.items.r2.preview.empty", "No items to preview yet."),
    responsesLabel: t("admin.items.r2.preview.responsesLabel", "Response the inspector records"),
    evidenceLabel: t("admin.items.r2.preview.evidenceLabel", "Evidence policy"),
    evidenceNone: t("admin.items.r2.preview.evidenceNone", "No base evidence required"),
    evidenceRequired: t("admin.items.r2.preview.evidenceRequired", "{type} required when non-compliant (min {min})"),
    evidenceSource: t("admin.items.r2.preview.evidenceSource", "configured policy — source: engine settings"),
    guidanceLabel: t("admin.items.r2.preview.guidanceLabel", "Inspector guidance"),
    guidanceNone: t("admin.items.r2.preview.guidanceNone", "No guidance recorded"),
    scoringLabel: t("admin.items.r2.preview.scoringLabel", "Scoring"),
    weight: t("admin.items.r2.preview.weight", "weight {weight}"),
    noWeight: t("admin.items.r2.preview.noWeight", "no score weight"),
    scoreExcluded: t("admin.items.r2.preview.scoreExcluded", "excluded from score on: {responses}"),
    ncMaps: t("admin.items.r2.preview.ncMaps", "Non-compliant maps to: {target}"),
    conditional: t("admin.items.r2.preview.conditional", "Conditional"),
    required: t("admin.items.r2.preview.required", "Required"),
    optional: t("admin.items.r2.preview.optional", "Optional"),
    mandatoryVisible: t("admin.items.r2.preview.mandatoryVisible", "mandatory when visible"),
    scoringOff: t("admin.items.r2.preview.scoringOff", "scoring disabled; all responses excluded"),
    readonly: t("admin.items.r2.preview.readonly", "Read-only projection of stored configuration — nothing here is editable."),
    deactivated: t("admin.items.r2.preview.deactivated", "This item is deactivated — hidden from new package versions; existing history is preserved."),
    active: t("admin.items.r2.status.active", "active"),
    deactivatedWord: t("admin.items.r2.status.deactivated", "deactivated"),
    responseLabels,
  };

  // ---- server-computed preview projection (pure read of stored config) ----
  const previewItems: PreviewItem[] = rows.map(i => {
    const rm = (i.response_model ?? {}) as ResponseModel;
    const ev = (i.evidence_rule ?? null) as EvidenceRule;
    const nc = rm.mapping?.non_compliant;
    const colExcluded = (i.score_excluded_on ?? null) as string[] | null;
    const guidance = locale === "ar"
      ? (i.guidance_ar ?? i.guidance_en ?? null)
      : (i.guidance_en ?? i.guidance_ar ?? null);
    return {
      id: i.id,
      code: i.code,
      title: i.title,
      active: i.active,
      responses: rm.responses ?? [],
      ncTarget: nc?.violation ?? nc?.result ?? null,
      evidence: ev,
      requirement: rm.requirement ?? "required",
      conditionalRule: rm.conditional?.visible_when ?? null,
      mandatoryWhenVisible: rm.conditional?.mandatory_when_visible === true,
      scoringEnabled: rm.scoring_enabled !== false,
      guidance,
      scoreWeight: i.score_weight ?? null,
      scoreExcludedOn: colExcluded ?? rm.score_excluded_on ?? [],
    };
  });

  return (
    <Shell
      current="/admin/items"
      title={t("admin.items.r2.title", "Inspection Item Catalogue")}
      context={
        <span className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-info">SCR-ADM-020 · ENG-01</span>
          <span role="status" className="t-caption">
            {fill(t("admin.items.r2.readAt", "catalogue read {time} — a source fact, not a freshness verdict"), { time: readAt })}
          </span>
          {clauseUnavailable && (
            <span className="badge badge-warning">
              <span aria-hidden="true">⚠ </span>{t("admin.items.r2.degraded.clause", "clause list unavailable")}
            </span>
          )}
        </span>
      }
    >
      {/* S02 total-read failure (degraded/error) — never a zero/complete verdict. */}
      {error && (
        <div className="sq-banner sq-banner--critical" role="alert">
          <div>
            <strong>{t("admin.items.r2.error.title", "Couldn’t load the item catalogue.")}</strong>{" "}
            {t("admin.items.r2.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            {t("admin.items.r2.error.retry", "Reload the page to try again.")}
          </div>
        </div>
      )}

      {/* S08 partial degradation announced sr-only; the visible fact lives in the header. */}
      {clauseUnavailable && !error && (
        <div className="sr-only" role="status">
          {t("admin.items.r2.degraded.body", "The clause list couldn’t be read. The catalogue below still rendered; only the clause control is unavailable.")}
        </div>
      )}

      {roleError ? <div className="sq-banner sq-banner--warning" role="alert"><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div> : !isWriter && <div className="sq-banner" role="note"><strong><span aria-hidden="true">👁 </span>{t("admin.items.r2.readonly.title", "Read-only catalogue")}</strong>{" "}{t("admin.items.r2.readonly.body", "Your role can inspect item semantics, usage and runtime previews. Creating or changing active state requires Compliance or Form Admin and is enforced by the server guard and RLS.")}</div>}

      <nav className="cmp-library-tabs" aria-label="Compliance Library">
        <a className="btn btn-secondary sq-link btn-touch" href="/admin/regulations">Regulations</a>
        <a className="btn btn-primary btn-lg btn-touch" href="/admin/items" aria-current="page">Inspection Items</a>
        {isWriter ? <a className="btn btn-secondary sq-link btn-touch" href="/admin/compliance-requests/new">Create governed request</a> : null}
      </nav>

      {isWriter ? <div className="sq-banner sq-banner--warning" role="note"><strong>Legacy compatibility authoring.</strong>{" "}Direct item controls remain temporarily available for continuity. New or modified governed configuration should begin in a Compliance Configuration Request; this catalogue remains the published source of truth.</div> : null}

      {/* Permission + governance truth (S05/S06 + audit fact). Visibility is not
          authorization; the write path is RLS-guarded and every row change is audited. */}
      <section className="panel sq-permission stack" aria-labelledby="cd007-gov-h" style={{ padding: "var(--space-6)" }}>
        <h3 id="cd007-gov-h" style={{ margin: 0 }}>{t("admin.items.r2.gov.heading", "How this catalogue is governed")}</h3>
        <p className="t-caption" style={{ margin: 0 }}>
          {t("admin.items.r3.gov.body", "Anyone signed in can read the catalogue; writes require compliance_admin or form_admin. Deactivation preserves history and records a reason. Editing archives the previous configuration before advancing the version, and every row change is audited.")}
        </p>
      </section>

      {!error && isWriter && (
        <section className="panel stack" aria-labelledby="cd007-create-h" style={{ padding: "var(--space-6)" }}>
          <h3 id="cd007-create-h" style={{ margin: 0 }}>{t("admin.items.r2.create.heading", "Add an inspection item")}</h3>
          <NewItemForm clauses={clauseOptions} clauseUnavailable={clauseUnavailable} strings={strings} />
        </section>
      )}

      {!error && rows.length > 0 && (
        <section className="stack" aria-labelledby="cd007-preview-h">
          <h3 id="cd007-preview-h" style={{ margin: 0 }}>{t("admin.items.r2.preview.heading", "Runtime preview — what the inspector sees")}</h3>
          <ItemPreview items={previewItems} strings={previewStrings} />
        </section>
      )}

      {/* S03 empty — read succeeded and the catalogue is genuinely empty (never
          confused with unavailable, which is the error banner above). */}
      {!error && rows.length === 0 && (
        <EmptyState glyph="🧾" title={t("admin.items.r2.empty.title", "No inspection items configured")}
          body={t("admin.items.r2.empty.body", "Items belong to regulation clauses and are reused across packages (M09-002). Add the first item above.")} />
      )}

      {!error && rows.length > 0 && (
        <section className="stack" aria-labelledby="cd007-catalogue-h">
          <h3 id="cd007-catalogue-h" style={{ margin: 0 }}>{t("admin.items.r2.catalogue.heading", "Catalogue")}</h3>
          <div className="sq-tablewrap"><table className="sq-table">
            <caption className="sr-only">{t("admin.items.r2.catalogue.heading", "Catalogue")}</caption>
            <thead><tr>
              <th scope="col">{t("admin.items.r2.col.code", "Code")}</th>
              <th scope="col">{t("admin.items.r2.col.title", "Title")}</th>
              <th scope="col">{t("admin.items.r2.col.clause", "Clause")}</th>
              <th scope="col">{t("admin.items.r2.col.semantics", "Runtime semantics")}</th>
              <th scope="col" className="sq-td-num">{t("admin.items.r2.col.weight", "Weight")}</th>
              <th scope="col">{t("admin.items.r2.col.usage", "Published use")}</th>
              <th scope="col">{t("admin.items.r2.col.status", "Status")}</th>
              <th scope="col">{t("admin.items.r2.col.actions", "Actions")}</th>
            </tr></thead>
            <tbody>
              {rows.map(i => {
                const rc = i.regulation_clauses as unknown as { clause_ref: string; regulations: { code: string } } | null;
                const rm = (i.response_model ?? {}) as ResponseModel;
                const nc = rm.mapping?.non_compliant;
                const ncTarget = nc?.violation ?? nc?.result ?? null;
                const colExcluded = (i.score_excluded_on ?? null) as string[] | null;
                const excluded = colExcluded ?? rm.score_excluded_on ?? [];
                const ev = (i.evidence_rule ?? null) as EvidenceRule;
                return (
                  <tr key={i.id}>
                    <td className="numeric"><strong><bdi dir="ltr">{i.code}</bdi></strong></td>
                    <td>{i.title}</td>
                    <td className="numeric">{rc ? <bdi dir="ltr">{`${rc.regulations.code} §${rc.clause_ref}`}</bdi> : "—"}</td>
                    <td className="t-caption">
                      {(rm.responses ?? []).map(rLabel).join(" / ") || "—"}
                      {ncTarget && ` · ${t("admin.items.r2.sem.nc", "NC→")}${ncTarget}`}
                      {ev?.mandatory && ` · ${ev.type ?? t("admin.items.r2.sem.evidence", "evidence")} ${t("admin.items.r2.sem.onNc", "on NC")}`}
                      {excluded.length > 0 && ` · ${t("admin.items.r2.sem.scoreExcluded", "score-excluded")}`}
                      {rm.requirement && ` · ${rm.requirement}`}
                      {rm.conditional?.visible_when && ` · ${rm.conditional.visible_when}`}
                      {rm.scoring_enabled === false && ` · ${t("admin.items.r2.sem.scoringOff", "scoring off")}`}
                    </td>
                    <td className="sq-td-num numeric">{i.score_weight ?? "—"}</td>
                    <td>
                      {(() => {
                        const usage = usageById.get(i.id);
                        if (!isWriter) return <span className="t-caption">{t("admin.items.r2.usage.writerOnly", "Available to configuration writers")}</span>;
                        if (!usage) return <span className="badge badge-warning"><span aria-hidden="true">⚠ </span>{t("admin.items.r2.usage.unavailable", "unavailable — retry reload")}</span>;
                        return <span className="t-caption"><span aria-hidden="true">✓ </span>{fill(t("admin.items.r2.usage.counts", "{packages} package(s) · {versions} version(s)"), { packages: usage.package_count, versions: usage.version_count })}</span>;
                      })()}
                    </td>
                    <td>
                      <span className={`sq-lozenge ${i.active ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>
                        <span aria-hidden="true">{i.active ? "●" : "✕"} </span>
                        {i.active ? t("admin.items.r2.status.active", "active") : t("admin.items.r2.status.deactivated", "deactivated")}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                        <a className="btn btn-secondary sq-link btn-touch" href={`/admin/items/${encodeURIComponent(i.id)}/runtime-preview`}>Inspector Runtime Preview</a>
                        {isWriter ? <a className="btn btn-secondary sq-link btn-touch" href={`/admin/compliance-requests/new?request_type=modify&title=${encodeURIComponent(`Modify inspection item ${i.code}`)}&description=${encodeURIComponent(`Governed change request for inspection item ${i.code} — ${i.title}.`)}`}>Request change</a> : null}
                        {isWriter ? <ToggleActive itemId={i.id} active={i.active} strings={strings} /> : <span className="t-caption">{t("admin.items.r2.readonly.action", "Read only")}</span>}
                        {isWriter ? <a className="btn btn-secondary sq-link btn-touch" href={`/admin/items?audit=${encodeURIComponent(i.id)}#cd007-audit-h`}>{t("admin.items.r2.audit.open", "Audit")}</a> : null}
                        {isWriter ? <EditItemForm item={{ id: i.id, title: i.title, clauseId: i.clause_id, guidance: i.guidance_en, version: i.configuration_version ?? 1 }} clauses={clauseOptions} strings={strings} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>
      )}

      {!error && rows.length > 0 && isWriter && (
        <section className="panel stack" aria-labelledby="cd007-audit-h" style={{ padding: "var(--space-6)" }}>
          <h3 id="cd007-audit-h" style={{ margin: 0 }}>{t("admin.items.r2.audit.heading", "Scoped item audit")}</h3>
          <p className="t-caption" style={{ margin: 0 }}>{t("admin.items.r2.audit.body", "Open Audit on one item to inspect its object-scoped configuration history; broad audit-table access is not granted.")}</p>
          {!auditItemId ? <p className="t-caption" role="status">{t("admin.items.r2.audit.select", "No item selected.")}</p>
            : !auditItem ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.items.r2.audit.notFound", "The selected item is no longer in the readable catalogue.")}</div>
            : auditResult.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.items.r2.audit.unavailable", "Audit unavailable — reload to retry; history is not reported as empty.")}</div>
            : <div className="stack" style={{ gap: "var(--space-2)" }}><h4 style={{ margin: 0 }}><bdi dir="ltr" className="numeric">{auditItem.code}</bdi> — {auditItem.title}</h4>
              {auditEvents.length === 0 ? <p className="t-caption" role="status">{t("admin.items.r2.audit.empty", "No scoped audit events returned — verified zero.")}</p>
                : <ol>{auditEvents.map(e => <li key={e.id}><strong>{e.action}</strong> · <bdi dir="ltr" className="numeric">{e.occurred_at}</bdi>{e.actor ? <> · <bdi dir="ltr">{e.actor}</bdi></> : null}</li>)}</ol>}
            </div>}
        </section>
      )}

      <p className="t-caption">
        {t("admin.items.r2.footer", "Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014). Writes require compliance_admin/form_admin — RLS is the authority. inspection_items row changes are audit-tracked (trg_audit_inspection_items).")}
      </p>
    </Shell>
  );
}
