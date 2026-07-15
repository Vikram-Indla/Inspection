import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  NewItemForm,
  ToggleActive,
  ItemPreview,
  type ClauseOption,
  type ItemStrings,
  type PreviewStrings,
  type PreviewItem,
} from "./Controls";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";

// CD-007 / SCR-ADM-020 — Inspection Item Catalogue (semantic catalogue + read-only
// runtime-preview strip). Truth-over-completion: SELECT is any authenticated (RLS);
// writes require compliance_admin/form_admin (RLS is the authority — no Admin-family
// route guard is proven, so the unauthorized/route-guard leg is HANDOFF_BLOCKED,
// owner platform). inspection_items has NO audit trigger, so item changes are never
// presented as audited. Item edit/version lifecycle, deactivation-reason capture,
// per-item published-use count, and conditional-rule authoring are contract targets
// with no runtime leg today — they render as disabled, annotated HANDOFF_BLOCKED
// targets, never as working controls, and never as a fabricated count.
export const dynamic = "force-dynamic";

const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tmpl);

type ResponseModel = {
  responses?: string[];
  mapping?: Record<string, { result?: string; violation?: string }>;
  score_excluded_on?: string[];
  conditional?: unknown;
};
type EvidenceRule = { on?: string; type?: string; min?: number; mandatory?: boolean } | null;

export default async function Items() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();

  // Two independent reads so a clause-list failure (S08 degraded) never hides the
  // catalogue: the catalogue renders and only the clause control degrades.
  const [{ data: items, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("inspection_items")
      .select("id, code, title, active, score_weight, response_model, evidence_rule, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, regulations(code))")
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
    evidenceSource: t("admin.items.r2.form.evidenceSource", "Configured policy — governed preset, not free text (M09-005/025)."),
    guidance: t("admin.items.r2.form.guidance", "Guidance (EN)"),
    guidancePlaceholder: t("admin.items.r2.form.guidancePlaceholder", "What the inspector verifies"),
    creating: t("admin.items.r2.form.creating", "Creating…"),
    create: t("admin.items.r2.form.create", "Create item"),
    created: t("admin.items.r2.form.created", "Item created"),
    duplicate: t("admin.items.r2.form.duplicate", "That item code already exists — codes are unique."),
    saving: t("admin.items.r2.toggle.saving", "Saving…"),
    deactivate: t("admin.items.r2.toggle.deactivate", "Deactivate"),
    reactivate: t("admin.items.r2.toggle.reactivate", "Reactivate"),
    reasonNote: t("admin.items.r2.toggle.reasonNote", "History is preserved; no reason is captured and no item-row audit trigger exists."),
  };

  const previewStrings: PreviewStrings = {
    select: t("admin.items.r2.preview.select", "Preview item"),
    empty: t("admin.items.r2.preview.empty", "No items to preview yet."),
    responsesLabel: t("admin.items.r2.preview.responsesLabel", "Response the inspector records"),
    evidenceLabel: t("admin.items.r2.preview.evidenceLabel", "Evidence policy"),
    evidenceNone: t("admin.items.r2.preview.evidenceNone", "No base evidence required"),
    evidencePhoto: t("admin.items.r2.preview.evidencePhoto", "Photo required when non-compliant (min {min})"),
    evidenceSource: t("admin.items.r2.preview.evidenceSource", "configured policy — source: engine settings"),
    guidanceLabel: t("admin.items.r2.preview.guidanceLabel", "Inspector guidance"),
    guidanceNone: t("admin.items.r2.preview.guidanceNone", "No guidance recorded"),
    scoringLabel: t("admin.items.r2.preview.scoringLabel", "Scoring"),
    weight: t("admin.items.r2.preview.weight", "weight {weight}"),
    noWeight: t("admin.items.r2.preview.noWeight", "no score weight"),
    scoreExcluded: t("admin.items.r2.preview.scoreExcluded", "excluded from score on: {responses}"),
    ncMaps: t("admin.items.r2.preview.ncMaps", "Non-compliant maps to: {target}"),
    conditional: t("admin.items.r2.preview.conditional", "Conditional logic present (display only — authoring not wired)"),
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
      conditional: rm.conditional != null,
      guidance,
      scoreWeight: i.score_weight ?? null,
      scoreExcludedOn: colExcluded ?? rm.score_excluded_on ?? [],
    };
  });

  // ---- blocked contract targets (rendered as disabled, annotated targets) ----
  const blocked: { label: string; owner: string }[] = [
    { label: t("admin.items.r2.blocked.edit", "Edit item / new version"), owner: t("admin.items.r2.owner.backend", "owner: backend") },
    { label: t("admin.items.r2.blocked.conditional", "Author conditional rule"), owner: t("admin.items.r2.owner.backend", "owner: backend") },
    { label: t("admin.items.r2.blocked.usage", "Published-use warning — unavailable"), owner: t("admin.items.r2.owner.backend", "owner: backend") },
    { label: t("admin.items.r2.blocked.reason", "Deactivation reason capture"), owner: t("admin.items.r2.owner.backend", "owner: backend") },
    { label: t("admin.items.r2.blocked.audit", "Item change audit trail"), owner: t("admin.items.r2.owner.backend", "owner: backend") },
    { label: t("admin.items.r2.blocked.guard", "Route guard / unauthorized redirect"), owner: t("admin.items.r2.owner.platform", "owner: platform") },
  ];

  return (
    <Shell
      current="/admin"
      title={t("admin.items.r2.title", "Inspection Item Catalogue")}
      context={
        <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
          <span className="ax-lozenge ax-lozenge--info">SCR-ADM-020 · ENG-01</span>
          <span role="status" className="ax-caption">
            {fill(t("admin.items.r2.readAt", "catalogue read {time} — a source fact, not a freshness verdict"), { time: readAt })}
          </span>
          {clauseUnavailable && (
            <span className="ax-lozenge ax-lozenge--warning">
              <span aria-hidden="true">⚠ </span>{t("admin.items.r2.degraded.clause", "clause list unavailable")}
            </span>
          )}
        </span>
      }
    >
      {/* S02 total-read failure (degraded/error) — never a zero/complete verdict. */}
      {error && (
        <div className="ax-banner ax-banner--critical" role="alert">
          <div>
            <strong>{t("admin.items.r2.error.title", "Couldn’t load the item catalogue.")}</strong>{" "}
            {t("admin.items.r2.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            {t("admin.items.r2.error.retry", "Reload the page to try again.")}
          </div>
        </div>
      )}

      {/* S08 partial degradation announced sr-only; the visible fact lives in the header. */}
      {clauseUnavailable && !error && (
        <div className="ax-sr-only" role="status">
          {t("admin.items.r2.degraded.body", "The clause list couldn’t be read. The catalogue below still rendered; only the clause control is unavailable.")}
        </div>
      )}

      {/* Permission + governance truth (S05/S06 + no-audit fact). Visibility is not
          authorization; the write path is RLS-guarded and there is no audit trigger. */}
      <section className="ax-surface ax-permission ax-stack" aria-labelledby="cd007-gov-h" style={{ padding: "var(--ax-space-300)" }}>
        <h3 id="cd007-gov-h" style={{ margin: 0 }}>{t("admin.items.r2.gov.heading", "How this catalogue is governed")}</h3>
        <p className="ax-caption" style={{ margin: 0 }}>
          {t("admin.items.r2.gov.body", "Anyone signed in can read the catalogue; creating items and changing active state require compliance_admin or form_admin — RLS is the authority and navigation visibility grants nothing. Deactivation preserves history and stores no reason. inspection_items has no audit trigger, so item changes are not recorded as audit events.")}
        </p>
      </section>

      {!error && (
        <section className="ax-surface ax-stack" aria-labelledby="cd007-create-h" style={{ padding: "var(--ax-space-300)" }}>
          <h3 id="cd007-create-h" style={{ margin: 0 }}>{t("admin.items.r2.create.heading", "Add an inspection item")}</h3>
          <NewItemForm clauses={clauseOptions} clauseUnavailable={clauseUnavailable} strings={strings} />
        </section>
      )}

      {!error && rows.length > 0 && (
        <section className="ax-stack" aria-labelledby="cd007-preview-h">
          <h3 id="cd007-preview-h" style={{ margin: 0 }}>{t("admin.items.r2.preview.heading", "Runtime preview — what the inspector sees")}</h3>
          <ItemPreview items={previewItems} strings={previewStrings} />
        </section>
      )}

      {/* S03 empty — read succeeded and the catalogue is genuinely empty (never
          confused with unavailable, which is the error banner above). */}
      {!error && rows.length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph" aria-hidden="true">🧾</span>
          <h4>{t("admin.items.r2.empty.title", "No inspection items configured")}</h4>
          <p className="ax-caption">{t("admin.items.r2.empty.body", "Items belong to regulation clauses and are reused across packages (M09-002). Add the first item above.")}</p>
        </div></div>
      )}

      {!error && rows.length > 0 && (
        <section className="ax-stack" aria-labelledby="cd007-catalogue-h">
          <h3 id="cd007-catalogue-h" style={{ margin: 0 }}>{t("admin.items.r2.catalogue.heading", "Catalogue")}</h3>
          <div className="ax-tablewrap"><table className="ax-table">
            <caption className="ax-sr-only">{t("admin.items.r2.catalogue.heading", "Catalogue")}</caption>
            <thead><tr>
              <th scope="col">{t("admin.items.r2.col.code", "Code")}</th>
              <th scope="col">{t("admin.items.r2.col.title", "Title")}</th>
              <th scope="col">{t("admin.items.r2.col.clause", "Clause")}</th>
              <th scope="col">{t("admin.items.r2.col.semantics", "Runtime semantics")}</th>
              <th scope="col" className="ax-td-num">{t("admin.items.r2.col.weight", "Weight")}</th>
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
                    <td className="ax-numeric"><strong><bdi dir="ltr">{i.code}</bdi></strong></td>
                    <td>{i.title}</td>
                    <td className="ax-numeric">{rc ? <bdi dir="ltr">{`${rc.regulations.code} §${rc.clause_ref}`}</bdi> : "—"}</td>
                    <td className="ax-caption">
                      {(rm.responses ?? []).map(rLabel).join(" / ") || "—"}
                      {ncTarget && ` · ${t("admin.items.r2.sem.nc", "NC→")}${ncTarget}`}
                      {ev?.mandatory && ` · ${t("admin.items.r2.sem.evidence", "photo on NC")}`}
                      {excluded.length > 0 && ` · ${t("admin.items.r2.sem.scoreExcluded", "score-excluded")}`}
                      {rm.conditional != null && ` · ${t("admin.items.r2.sem.conditional", "conditional (display only)")}`}
                    </td>
                    <td className="ax-td-num ax-numeric">{i.score_weight ?? "—"}</td>
                    <td>
                      {/* Per-item published-use count is NOT provided by this route.
                          Render the warning target as unavailable — never a count. */}
                      <span className="ax-lozenge ax-lozenge--warning" title={t("admin.items.r2.usage.note", "This route provides no published-use count (HANDOFF_BLOCKED · backend).")}>
                        <span aria-hidden="true">? </span>{t("admin.items.r2.usage.unavailable", "unavailable")}
                      </span>
                    </td>
                    <td>
                      <span className={`ax-lozenge ${i.active ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
                        <span aria-hidden="true">{i.active ? "●" : "✕"} </span>
                        {i.active ? t("admin.items.r2.status.active", "active") : t("admin.items.r2.status.deactivated", "deactivated")}
                      </span>
                    </td>
                    <td>
                      <div className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center", flexWrap: "wrap" }}>
                        <ToggleActive itemId={i.id} active={i.active} strings={strings} />
                        <button className="ax-btn ax-btn--subtle" disabled aria-disabled="true"
                          title={t("admin.items.r2.blocked.editNote", "Item edit / new version is a contract target (HANDOFF_BLOCKED · backend).")}>
                          <span aria-hidden="true">🔒 </span>{t("admin.items.r2.blocked.editShort", "Edit")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>
      )}

      {/* Contract targets — disabled, annotated, never presented as working. */}
      <section className="ax-surface ax-stack" aria-labelledby="cd007-blocked-h" style={{ padding: "var(--ax-space-300)" }}>
        <h3 id="cd007-blocked-h" style={{ margin: 0 }}>{t("admin.items.r2.blocked.heading", "Contract targets — not yet wired")}</h3>
        <p className="ax-caption" style={{ margin: 0 }}>
          {t("admin.items.r2.blocked.body", "These are contract capabilities with no proven runtime leg today. They render as disabled targets so the design never implies they work.")}
        </p>
        <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
          {blocked.map(b => (
            <span key={b.label} className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
              <button className="ax-btn ax-btn--subtle" disabled aria-disabled="true">
                <span aria-hidden="true">🔒 </span>{b.label}
              </button>
              <span className="ax-caption">{t("admin.items.r2.blocked.tag", "not yet wired")} · {b.owner}</span>
            </span>
          ))}
        </div>
      </section>

      <p className="ax-caption">
        {t("admin.items.r2.footer", "Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014). Writes require compliance_admin/form_admin — RLS is the authority. inspection_items has no audit trigger.")}
      </p>
    </Shell>
  );
}
