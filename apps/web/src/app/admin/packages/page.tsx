import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import { NewDraftForm, ApprovePublish, type PublishStrings } from "./PublishControls";
import DraftEditor, { type DraftEditorStrings } from "./DraftEditor";
import PackagePreview, { type PreviewStrings, type PreviewItem } from "./PackagePreview";
import ImpactPanel, { type ImpactStrings, type ImpactData, type ReferencingPackage, type DefinitionDiff } from "./ImpactPanel";
import { getPinnedActiveImpact } from "./actions";
import styles from "./packages.module.css";

export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["compliance_admin", "form_admin"]);
type Section = { key: string; title: string; items?: string[]; mandatory?: boolean };
type ActionFormDef = { key: string; title: string; blocking?: boolean; fields?: string[] };
type Definition = { sections?: Section[]; action_forms?: ActionFormDef[] };
type VersionRow = { id: string; version_label: string; status: string; published_at: string | null; definition: Definition };
type PkgRow = { id: string; code: string; title: string; scope: string | null; package_versions: VersionRow[] | null };
type ResponseModel = {
  responses?: string[];
  mapping?: Record<string, { violation?: string; action_form?: string }>;
  requirement?: "required" | "optional" | "conditional";
  scoring_enabled?: boolean;
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
};
type ItemRow = {
  id: string; code: string; title: string; active: boolean;
  response_model: ResponseModel | null;
  evidence_rule: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  score_weight: number | null; score_excluded_on: string[] | null;
  guidance_en: string | null; guidance_ar: string | null;
  regulation_clauses: { clause_ref: string; legal_source: string | null } | null;
};

function codeSectionMap(definition: Definition): Map<string, string> {
  const result = new Map<string, string>();
  for (const section of definition.sections ?? []) {
    for (const code of section.items ?? []) if (!result.has(code)) result.set(code, section.key ?? section.title);
  }
  return result;
}

function formKeys(definition: Definition): Set<string> {
  return new Set((definition.action_forms ?? []).map(form => form.key).filter(Boolean));
}

function orderedVersions(pkg: PkgRow): VersionRow[] {
  return [...(pkg.package_versions ?? [])].sort((a, b) => {
    const aDraft = a.status === "draft" ? 1 : 0;
    const bDraft = b.status === "draft" ? 1 : 0;
    if (aDraft !== bDraft) return bDraft - aDraft;
    return (b.published_at ?? b.version_label).localeCompare(a.published_at ?? a.version_label);
  });
}

function currentPublished(pkg: PkgRow): VersionRow | null {
  return orderedVersions(pkg)
    .filter(version => version.status === "published" || version.status === "locked")
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ?? null;
}

export default async function Packages() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const [packageRead, itemRead, authRead] = await Promise.all([
    sb.from("packages").select("id, code, title, scope, package_versions(id, version_label, status, published_at, definition)").order("code"),
    sb.from("inspection_items").select("id, code, title, active, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)").order("code"),
    sb.auth.getUser(),
  ]);
  if (packageRead.error) logProviderError("admin packages read", packageRead.error);
  if (itemRead.error) logProviderError("admin package item-bank read", itemRead.error);

  const user = authRead.data.user;
  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: authRead.error };
  if (roleRead.error) logProviderError("admin package role read", roleRead.error);
  const roles = (roleRead.data ?? []).map(row => row.role_key);
  const canWrite = !roleRead.error && roles.some(role => WRITER_ROLES.has(role));
  const packageUnavailable = !!packageRead.error;
  const itemBankUnavailable = !!itemRead.error;
  const pkgs = (packageRead.data ?? []) as unknown as PkgRow[];
  const items = (itemRead.data ?? []) as unknown as ItemRow[];
  const itemMap = new Map(items.map(item => [item.code, item]));
  const readAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const previewItems: Record<string, PreviewItem> = {};
  for (const item of items) {
    const response = item.response_model ?? {};
    const responses = response.responses ?? [];
    const nonCompliant = response.mapping?.non_compliant;
    const evidence = item.evidence_rule;
    previewItems[item.code] = {
      code: item.code,
      title: item.title,
      responses,
      isDate: responses.includes("value_date"),
      evidence: evidence?.on ? { type: evidence.type ?? "photo", min: Math.max(1, evidence.min ?? 1), mandatory: !!evidence.mandatory } : null,
      conditional: response.conditional?.visible_when ?? null,
      requirement: response.requirement ?? "required",
      mandatoryWhenVisible: !!response.conditional?.mandatory_when_visible,
      scoringEnabled: response.scoring_enabled !== false,
      guidance: locale === "ar" ? (item.guidance_ar ?? item.guidance_en) : (item.guidance_en ?? item.guidance_ar),
      clause: item.regulation_clauses ? { clause_ref: item.regulation_clauses.clause_ref, legal_source: item.regulation_clauses.legal_source } : null,
      ncViolation: nonCompliant?.violation ?? null,
      ncActionForm: nonCompliant?.action_form ?? null,
    };
  }

  const enumLabels: Record<string, string> = {};
  for (const item of items) for (const response of item.response_model?.responses ?? []) {
    enumLabels[response] ??= t(`enum.${response}`, response.replace(/_/g, " "));
  }
  const afFieldLabels: Record<string, string> = {};
  for (const pkg of pkgs) for (const version of pkg.package_versions ?? []) {
    for (const form of version.definition.action_forms ?? []) for (const field of form.fields ?? []) {
      afFieldLabels[field] ??= t(`field.ws.af.${field}`, field.replace(/_/g, " "));
    }
  }

  const versionList = pkgs.flatMap(pkg => orderedVersions(pkg).map(version => ({ pkg, version })));
  const impactEntries = await Promise.all(versionList.map(async ({ pkg, version }) => {
    const codes = new Set(codeSectionMap(version.definition).keys());
    const referencing: ReferencingPackage[] = [];
    for (const other of pkgs) {
      if (other.id === pkg.id) continue;
      const published = currentPublished(other);
      if (!published) continue;
      const sharedItems = [...codes].filter(code => codeSectionMap(published.definition).has(code)).sort();
      if (sharedItems.length) referencing.push({ code: other.code, title: other.title, label: published.version_label, sharedItems });
    }
    const baseline = currentPublished(pkg);
    let diff: DefinitionDiff | null = null;
    if (baseline?.id === version.id) {
      diff = { isCurrentPublished: true, comparedLabel: baseline.version_label, added: [], removed: [], moved: [], formsAdded: [], formsRemoved: [] };
    } else if (baseline) {
      const nextSections = codeSectionMap(version.definition);
      const baseSections = codeSectionMap(baseline.definition);
      const nextCodes = new Set(nextSections.keys());
      const baseCodes = new Set(baseSections.keys());
      const nextForms = formKeys(version.definition);
      const baseForms = formKeys(baseline.definition);
      diff = {
        isCurrentPublished: false,
        comparedLabel: baseline.version_label,
        added: [...nextCodes].filter(code => !baseCodes.has(code)).sort(),
        removed: [...baseCodes].filter(code => !nextCodes.has(code)).sort(),
        moved: [...nextCodes].filter(code => baseCodes.has(code) && nextSections.get(code) !== baseSections.get(code)).sort(),
        formsAdded: [...nextForms].filter(key => !baseForms.has(key)).sort(),
        formsRemoved: [...baseForms].filter(key => !nextForms.has(key)).sort(),
      };
    }
    const pinned = await getPinnedActiveImpact(version.id);
    return [version.id, { pinned, referencing, diff } as ImpactData] as const;
  }));
  const impactMap = new Map(impactEntries);

  const publishStrings: PublishStrings = {
    newDraftLabel: t("admin.pkg.newDraft.label", "New draft version label"),
    creating: t("admin.pkg.newDraft.creating", "Creating…"),
    createDraft: t("admin.pkg.newDraft.create", "Create draft"),
    draftCreated: t("admin.pkg.newDraft.created", "Draft created"),
    versionPlaceholder: t("admin.pkg.newDraft.placeholder", "Example: v2026.08"),
    publishing: t("admin.pkg.publish.publishing", "Publishing…"),
    approvePublish: t("admin.pkg.publish.approve", "Approve & publish"),
    published: t("admin.pkg.publish.published", "Version published. It is now immutable."),
    publishHint: t("admin.pkg.publish.hint", "Publish rechecks item, evidence, condition, violation, penalty and action-form dependencies. The approver must differ from the creator (RBAC-002)."),
  };
  const editorStrings: DraftEditorStrings = {
    heading: t("admin.pkg.editor.heading", "Package designer"),
    editableWhileDraft: t("admin.pkg.editor.editable", "Draft · editable"),
    mandatory: t("admin.pkg.editor.mandatory", "Mandatory section"),
    structure: t("admin.pkg.editor.structure", "1 · Structure"),
    fieldCanvas: t("admin.pkg.editor.canvas", "2 · Field canvas"),
    preview: t("admin.pkg.editor.preview", "3 · Read-only preview"),
    sectionTitleAria: t("admin.pkg.editor.sectionTitleAria", "Section title"),
    removeAria: t("admin.pkg.editor.removeAria", "Remove"),
    addItem: t("admin.pkg.editor.addItem", "Choose an item…"),
    addItemAria: t("admin.pkg.editor.addItemAria", "Add item from catalogue"),
    newSectionTitle: t("admin.pkg.editor.newSectionTitle", "New section title"),
    addSection: t("admin.pkg.editor.addSection", "Add section"),
    draftSaved: t("admin.pkg.editor.draftSaved", "Draft definition saved"),
    saving: t("admin.pkg.editor.saving", "Saving…"),
    save: t("admin.pkg.editor.save", "Save draft definition"),
    noChanges: t("admin.pkg.editor.noChanges", "No unsaved changes"),
    unsaved: t("admin.pkg.editor.unsaved", "Unsaved changes"),
    emptyTitle: t("admin.pkg.editor.emptyTitle", "No sections yet"),
    emptyBody: t("admin.pkg.editor.emptyBody", "Add the first section to begin this draft."),
    itemCount: t("admin.pkg.editor.itemCount", "{n} item(s)"),
    validationTitle: t("admin.pkg.editor.validationTitle", "Draft checks"),
    validationClear: t("admin.pkg.editor.validationClear", "The editable structure has no duplicate items or blank section titles. Full dependency validation runs again at publish."),
    duplicateItem: t("admin.pkg.editor.duplicateItem", "Item {code} appears in more than one section."),
    blankSection: t("admin.pkg.editor.blankSection", "Section {key} needs a title."),
    targetsTitle: t("admin.pkg.editor.targetsTitle", "Governed contract targets"),
    blocked: t("admin.pkg.editor.blocked", "Not enabled"),
    blockedOwner: t("admin.pkg.editor.blockedOwner", "requires a package-definition backend contract"),
    targetReorder: t("admin.pkg.editor.targetReorder", "Reorder items"),
    targetConditions: t("admin.pkg.editor.targetConditions", "Author conditions in this package"),
    targetItemPolicies: t("admin.pkg.editor.targetPolicies", "Edit scoring or evidence policy here"),
    targetActionForms: t("admin.pkg.editor.targetForms", "Author action forms"),
    targetSimulation: t("admin.pkg.editor.targetSimulation", "Run simulation / circular-rule detection"),
  };
  const previewStrings: PreviewStrings = {
    open: t("admin.pkg.preview.open", "Open field preview"), close: t("admin.pkg.preview.close", "Close field preview"),
    title: t("admin.pkg.preview.title", "Field preview"),
    asInspector: t("admin.pkg.preview.asInspector", "Read-only projection of the stored package and live item configuration."),
    conditionalBadge: t("field.ws.conditional", "Conditional"), conditionalWhen: t("admin.pkg.preview.conditionalWhen", "Shown when"),
    required: t("admin.pkg.preview.required", "Required"), optional: t("admin.pkg.preview.optional", "Optional"),
    mandatoryWhenVisible: t("admin.pkg.preview.mandatoryWhenVisible", "Mandatory when visible"),
    scoringDisabled: t("admin.pkg.preview.scoringDisabled", "Scoring disabled"),
    guidanceLabel: t("field.ws.guidance", "Guidance"), dateLabel: t("field.ws.date.label", "Recorded date"),
    evidenceLabel: t("admin.pkg.preview.evidence", "Evidence"), evidenceMandatory: t("admin.pkg.preview.evMandatory", "required"),
    evidenceOptional: t("admin.pkg.preview.evOptional", "optional"), evidenceMin: t("admin.pkg.preview.evMin", "min"),
    noteLabel: t("field.ws.note.label", "Inspector note"), notePlaceholder: t("field.ws.note.placeholder", "Add an observation note…"),
    ncViolation: t("admin.pkg.ncArrow", "NC →"), triggersForm: t("admin.pkg.preview.triggersForm", "triggers action form"),
    formBlocking: t("admin.pkg.preview.formBlocking", "blocking"), formNonBlocking: t("admin.pkg.preview.formNonBlocking", "non-blocking"),
    formAppearsWhen: t("admin.pkg.preview.formAppearsWhen", "This form opens when the inspector marks the item non-compliant."),
    sectionMandatory: t("admin.pkg.mandatory", "mandatory"), emptySection: t("admin.pkg.preview.emptySection", "Report-head fields — no checklist items."),
    missingItem: t("admin.pkg.preview.missingItem", "Item is not in the live item bank"), readOnly: t("admin.pkg.preview.readOnly", "Read-only"),
    enumLabels, afFieldLabels,
    evTypeLabels: {
      photo: t("enum.evidence.photo", "photo"), document: t("enum.evidence.document", "document"),
      video: t("enum.evidence.video", "video"), comment: t("enum.evidence.comment", "comment"),
    },
  };
  const impactStrings: ImpactStrings = {
    title: t("admin.pkg.impact.title", "Publish impact"),
    pinnedTitle: t("admin.pkg.impact.pinnedTitle", "In-flight work on prior published versions"),
    pinnedNone: t("admin.pkg.impact.pinnedNone", "No active visits or inspections are pinned to a prior published version."),
    pinnedVisits: t("admin.pkg.impact.pinnedVisits", "{n} active visit(s)"), pinnedInspections: t("admin.pkg.impact.pinnedInspections", "{n} active inspection(s)"),
    pinnedHint: t("admin.pkg.impact.pinnedHint", "Existing work stays on the frozen version it downloaded; publishing never silently re-versions it."),
    pinnedUnavailable: t("admin.pkg.impact.pinnedUnavailable", "In-flight counts are unavailable or outside your read scope — this is not zero."),
    priorLead: t("admin.pkg.impact.priorLead", "By prior version:"), priorLine: t("admin.pkg.impact.priorLine", "{label}: {visits} visit(s), {inspections} inspection(s)"),
    refTitle: t("admin.pkg.impact.refTitle", "Other published packages sharing these items"),
    refNone: t("admin.pkg.impact.refNone", "No other published package references items in this version."),
    refShares: t("admin.pkg.impact.refShares", "shares {n} item(s)"),
    diffTitle: t("admin.pkg.impact.diffTitle", "Changes vs the currently published version"),
    diffVsCurrent: t("admin.pkg.impact.diffVsCurrent", "Compared with {label}:"),
    diffIsCurrent: t("admin.pkg.impact.diffIsCurrent", "This is the currently published version."),
    diffNoBaseline: t("admin.pkg.impact.diffNoBaseline", "No published version exists yet — this would be the first."),
    added: t("admin.pkg.impact.added", "Added"), removed: t("admin.pkg.impact.removed", "Removed"), moved: t("admin.pkg.impact.moved", "Moved section"),
    formsAdded: t("admin.pkg.impact.formsAdded", "Forms added"), formsRemoved: t("admin.pkg.impact.formsRemoved", "Forms removed"),
    noChanges: t("admin.pkg.impact.noChanges", "No item or action-form changes from the published version."),
  };

  const previewFor = (definition: Definition) => (
    <PackagePreview
      sections={(definition.sections ?? []).map(section => ({ key: section.key, title: section.title, items: section.items, mandatory: section.mandatory }))}
      actionForms={(definition.action_forms ?? []).map(form => ({ key: form.key, title: form.title, blocking: form.blocking, fields: form.fields }))}
      itemMap={previewItems}
      strings={previewStrings}
    />
  );

  return (
    <Shell current="/admin" title={t("admin.pkg.title", "Package library & designer")}
      context={<span className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
        <span className="ax-lozenge ax-lozenge--info">SCR-ADM-030/031 · ENG-02</span>
        <span className="ax-caption" role="status">{t("admin.pkg.readAt", "Read from source at")} <bdi dir="ltr">{readAt}</bdi></span>
      </span>}>
      <div className={styles.pageStack}>
        <section className={`ax-surface ${styles.hero}`} aria-labelledby="pkg-overview">
          <div className={styles.heroRow}>
            <div>
              <h2 id="pkg-overview" style={{ margin: 0 }}>{t("admin.pkg.overview.title", "Version-governed inspection packages")}</h2>
              <p className="ax-caption">{t("admin.pkg.overview.body", "Drafts are editable. Publishing runs dependency validation and maker-checker approval; published and locked definitions remain immutable.")}</p>
            </div>
            <span className={`ax-lozenge ${canWrite ? "ax-lozenge--success" : "ax-lozenge--info"}`}>
              <span aria-hidden="true">{canWrite ? "✎ " : "◉ "}</span>
              {canWrite ? t("admin.pkg.writer", "Configuration writer") : t("admin.pkg.reader", "Read-only access")}
            </span>
          </div>
        </section>

        {packageUnavailable && (
          <div className="ax-banner ax-banner--critical" role="alert"><div>
            <strong>{t("admin.pkg.error.title", "Couldn’t load the package library.")}</strong>{" "}
            {t("admin.pkg.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            <a className="ax-link" href="/admin/packages">{t("admin.pkg.retry", "Reload to try again")}</a>.
          </div></div>
        )}

        {!packageUnavailable && itemBankUnavailable && (
          <div className="ax-banner ax-banner--warning" role="status"><div>
            <strong>{t("admin.pkg.itemsUnavailable.title", "Item catalogue unavailable.")}</strong>{" "}
            {t("admin.pkg.itemsUnavailable.body", "Package versions and impact remain visible, but editing and field preview are paused because their item dependency could not be read. This is not an empty catalogue.")}
          </div></div>
        )}

        {!packageUnavailable && (roleRead.error || !canWrite) && (
          <section className={`ax-surface ${styles.governance}`} aria-labelledby="pkg-access">
            <h3 id="pkg-access" style={{ margin: 0 }}>{t("admin.pkg.readonly.title", "Read-only package access")}</h3>
            <p className="ax-caption">{roleRead.error
              ? t("admin.pkg.readonly.unknown", "Your write permissions could not be verified, so all mutation controls are hidden. Reload to retry; RLS remains authoritative.")
              : t("admin.pkg.readonly.body", "You can inspect versions, previews and publish impact. Creating, saving and publishing require compliance_admin or form_admin; navigation access does not grant write permission.")}</p>
          </section>
        )}

        {!packageUnavailable && pkgs.length === 0 && (
          <section className={`ax-surface ${styles.emptyState}`}>
            <div className="ax-state">
              <span className="ax-state__glyph" aria-hidden="true">▦</span>
              <h3>{t("admin.pkg.empty.title", "No packages configured")}</h3>
              <p className="ax-caption">{t("admin.pkg.empty.body", "The package read succeeded and returned no rows. Package creation is not exposed by this route, so no unsupported create control is shown.")}</p>
            </div>
          </section>
        )}

        {!packageUnavailable && pkgs.map(pkg => {
          const versions = orderedVersions(pkg);
          const latestPublished = currentPublished(pkg);
          return (
            <details key={pkg.id} className={`ax-surface ${styles.packageGroup}`} open>
              <summary>
                <span className={styles.packageHeading}>
                  <span><strong><bdi dir="ltr">{pkg.code}</bdi> — {pkg.title}</strong><br /><span className="ax-caption">{pkg.scope ?? t("admin.pkg.scopeNone", "No scope recorded")}</span></span>
                  <span className="ax-lozenge ax-lozenge--info">{versions.length} {t("admin.pkg.versions", "version(s)")}</span>
                </span>
              </summary>
              <div className={styles.packageBody}>
                {versions.length === 0 ? (
                  <div className="ax-state"><span className="ax-state__glyph" aria-hidden="true">□</span><strong>{t("admin.pkg.noVersions", "No versions yet")}</strong></div>
                ) : (
                  <div className="ax-tablewrap">
                    <table className={styles.versionTable}>
                      <caption className="ax-sr-only">{pkg.code} {t("admin.pkg.versions", "versions")}</caption>
                      <thead><tr><th>{t("admin.pkg.col.version", "Version")}</th><th>{t("admin.pkg.col.state", "State")}</th><th>{t("admin.pkg.col.published", "Published")}</th><th>{t("admin.pkg.col.definition", "Definition")}</th></tr></thead>
                      <tbody>{versions.map(version => {
                        const derivedSuperseded = (version.status === "published" || version.status === "locked") && !!latestPublished && latestPublished.id !== version.id;
                        const itemCount = (version.definition.sections ?? []).reduce((sum, section) => sum + (section.items?.length ?? 0), 0);
                        return <tr key={version.id}>
                          <td data-label={t("admin.pkg.col.version", "Version")}><bdi dir="ltr" className="ax-version">{version.version_label}</bdi></td>
                          <td data-label={t("admin.pkg.col.state", "State")}><span className={`ax-lozenge ${version.status === "draft" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}><span aria-hidden="true">{version.status === "draft" ? "✎ " : "✓ "}</span>{t(`enum.${version.status}`, version.status.replace(/_/g, " "))}</span>{derivedSuperseded && <span className="ax-caption"> · {t("admin.pkg.derivedSuperseded", "older than current publish (derived)")}</span>}</td>
                          <td data-label={t("admin.pkg.col.published", "Published")}><bdi dir="ltr">{version.published_at ? version.published_at.slice(0, 10) : "—"}</bdi></td>
                          <td data-label={t("admin.pkg.col.definition", "Definition")}>{version.definition.sections?.length ?? 0} {t("admin.pkg.sections", "section(s)")} · {itemCount} {t("admin.pkg.items", "item(s)")}</td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>
                )}

                <div className={styles.versionList}>{versions.map((version, index) => {
                  const published = version.status === "published" || version.status === "locked";
                  const definition = version.definition ?? {};
                  const impact = impactMap.get(version.id) ?? { pinned: null, referencing: [], diff: null };
                  return (
                    <details key={version.id} className={`ax-panel ${styles.versionCard}`} open={version.status === "draft" || index === 0}>
                      <summary>
                        <span className={styles.versionHeading}>
                          <strong><bdi dir="ltr">{version.version_label}</bdi></strong>
                          <span className={`ax-lozenge ${published ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${version.status}`, version.status.replace(/_/g, " "))}</span>
                        </span>
                      </summary>
                      <div className={styles.versionBody}>
                        {published && <div className="ax-banner ax-banner--immutable"><div>
                          <strong><span aria-hidden="true">🔒 </span>{t("admin.pkg.immutable.title", "Published version — immutable.")}</strong>{" "}
                          {t("admin.pkg.immutable.body", "The database rejects definition and label edits. Create a new draft to change this package while existing inspections stay pinned to their downloaded version.")}
                        </div></div>}

                        {version.status === "draft" && canWrite && !itemBankUnavailable ? (
                          <DraftEditor versionId={version.id} definition={definition}
                            catalog={items.filter(item => item.active).map(item => ({ code: item.code, title: item.title }))}
                            strings={editorStrings} preview={previewFor(definition)} />
                        ) : !itemBankUnavailable ? previewFor(definition) : null}

                        <ImpactPanel data={impact} strings={impactStrings} />

                        {version.status === "draft" && canWrite && (
                          <section className="ax-surface" style={{ padding: "var(--ax-space-200)" }} aria-label={t("admin.pkg.publish.heading", "Publish gate")}>
                            <ApprovePublish versionId={version.id} strings={publishStrings} />
                          </section>
                        )}
                      </div>
                    </details>
                  );
                })}</div>

                {canWrite && <section className="ax-surface" style={{ padding: "var(--ax-space-200)" }}><NewDraftForm packageId={pkg.id} strings={publishStrings} /></section>}
              </div>
            </details>
          );
        })}

        {!packageUnavailable && <section className={`ax-surface ${styles.governance}`} aria-labelledby="pkg-blockers">
          <h3 id="pkg-blockers" style={{ margin: 0 }}>{t("admin.pkg.blockers.title", "Boundaries kept visible")}</h3>
          <p className="ax-caption">{t("admin.pkg.blockers.body", "Effective dates, scheduled activation, a stored supersede lifecycle, package footprint/fingerprint counts, package-level item reordering or policy authoring, simulation, and circular-rule detection remain unavailable. No value or working control is fabricated for them.")}</p>
          <p className="ax-caption" role="status">{t("admin.pkg.stale", "Data may have changed since this source read; no freshness threshold is defined.")} <a className="ax-link" href="/admin/packages">{t("admin.pkg.refresh", "Refresh to reconcile")}</a>.</p>
        </section>}
      </div>
    </Shell>
  );
}
