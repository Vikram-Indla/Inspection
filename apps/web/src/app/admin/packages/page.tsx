import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NewDraftForm, ApprovePublish, type PublishStrings } from "./PublishControls";
import DraftEditor, { type DraftEditorStrings } from "./DraftEditor";
import PackagePreview, { type PreviewStrings, type PreviewItem } from "./PackagePreview";
import ImpactPanel, { type ImpactStrings, type ImpactData, type ReferencingPackage, type DefinitionDiff } from "./ImpactPanel";
import { getPinnedActiveImpact } from "./actions";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";

export const dynamic = "force-dynamic";

type Section = { key: string; title: string; items?: string[]; mandatory?: boolean };
type ActionFormDef = { key: string; title: string; blocking?: boolean; fields?: string[] };
type Definition = { sections?: Section[]; action_forms?: ActionFormDef[] };
type VersionRow = { id: string; version_label: string; status: string; published_at: string | null; definition: Definition };
type PkgRow = { id: string; code: string; title: string; scope: string | null; package_versions: VersionRow[] | null };
type ItemRow = {
  id: string; code: string; title: string;
  response_model: { responses?: string[]; mapping?: Record<string, { violation?: string; action_form?: string }>; conditional?: { visible_when?: string } } | null;
  evidence_rule: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  score_weight: number | null; score_excluded_on: string[] | null;
  guidance_en: string | null; guidance_ar: string | null;
  regulation_clauses: { clause_ref: string; legal_source: string | null } | null;
};

// Ordered item-code → owning section, for the definition diff (moved-item detection).
function codeSectionMap(def: Definition): Map<string, string> {
  const m = new Map<string, string>();
  for (const sec of def.sections ?? []) for (const c of sec.items ?? []) if (!m.has(c)) m.set(c, sec.key ?? sec.title);
  return m;
}
function formKeys(def: Definition): Set<string> {
  return new Set((def.action_forms ?? []).map(f => f.key).filter((k): k is string => !!k));
}
function currentPublished(p: PkgRow): VersionRow | null {
  const pub = (p.package_versions ?? []).filter(v => v.status === "published" || v.status === "locked");
  pub.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  return pub[0] ?? null;
}

export default async function Packages() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const [{ data: pkgsData, error: packagesError }, { data: itemsData, error: itemsError }] = await Promise.all([
    sb.from("packages").select("id, code, title, scope, package_versions(id, version_label, status, published_at, definition)").order("code"),
    sb.from("inspection_items").select("id, code, title, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)"),
  ]);
  if (packagesError) logConfigurationReadFailure("read packages", packagesError);
  if (itemsError) logConfigurationReadFailure("read package item bank", itemsError);
  const pkgs = (pkgsData ?? []) as unknown as PkgRow[];
  const items = (itemsData ?? []) as unknown as ItemRow[];
  const itemMap = new Map(items.map(i => [i.code, i] as const));

  // M09-028 — item bank projected to the inspector-facing preview shape (locale-resolved guidance).
  const previewItems: Record<string, PreviewItem> = {};
  for (const i of items) {
    const rm = i.response_model ?? {};
    const responses = rm.responses ?? [];
    const nc = rm.mapping?.["non_compliant"];
    const er = i.evidence_rule;
    previewItems[i.code] = {
      code: i.code, title: i.title, responses,
      isDate: responses.includes("value_date"),
      evidence: er?.on ? { type: er.type ?? "photo", min: Math.max(1, er.min ?? 1), mandatory: !!er.mandatory } : null,
      conditional: rm.conditional?.visible_when ?? null,
      guidance: (locale === "ar" && i.guidance_ar) ? i.guidance_ar : i.guidance_en,
      clause: i.regulation_clauses ? { clause_ref: i.regulation_clauses.clause_ref, legal_source: i.regulation_clauses.legal_source } : null,
      ncViolation: nc?.violation ?? null, ncActionForm: nc?.action_form ?? null,
    };
  }
  // Enum / field / evidence display labels (DB values untouched — SB19).
  const enumLabels: Record<string, string> = {};
  for (const i of items) for (const r of (i.response_model?.responses ?? [])) enumLabels[r] ??= t(`enum.${r}`, r.replace(/_/g, " "));
  const afFieldLabels: Record<string, string> = {};
  for (const p of pkgs) for (const v of p.package_versions ?? []) for (const f of (v.definition.action_forms ?? [])) for (const fl of (f.fields ?? [])) afFieldLabels[fl] ??= t(`field.ws.af.${fl}`, fl.replace(/_/g, " "));
  const evTypeLabels: Record<string, string> = {
    photo: t("enum.evidence.photo", "photo"), document: t("enum.evidence.document", "document"), video: t("enum.evidence.video", "video"),
  };

  // M09-013 — per-version impact, server-computed. Referencing packages + definition
  // diff read from package_versions (any authed user); the in-flight pinned counts
  // come from the aggregate SECURITY DEFINER RPC (0024, degrades to null if scoped out).
  const versionList = pkgs.flatMap(p => (p.package_versions ?? []).map(v => ({ p, v })));
  const impactEntries = await Promise.all(versionList.map(async ({ p, v }) => {
    const codes = new Set(codeSectionMap(v.definition).keys());
    const referencing: ReferencingPackage[] = [];
    for (const other of pkgs) {
      if (other.id === p.id) continue;
      const cur = currentPublished(other);
      if (!cur) continue;
      const shared = [...codes].filter(c => codeSectionMap(cur.definition).has(c)).sort();
      if (shared.length) referencing.push({ code: other.code, title: other.title, label: cur.version_label, sharedItems: shared });
    }
    const cur = currentPublished(p);
    let diff: DefinitionDiff | null = null;
    if (cur && cur.id === v.id) {
      diff = { isCurrentPublished: true, comparedLabel: cur.version_label, added: [], removed: [], moved: [], formsAdded: [], formsRemoved: [] };
    } else if (cur) {
      const thisSec = codeSectionMap(v.definition), curSec = codeSectionMap(cur.definition);
      const thisCodes = new Set(thisSec.keys()), curCodes = new Set(curSec.keys());
      const thisForms = formKeys(v.definition), curForms = formKeys(cur.definition);
      diff = {
        isCurrentPublished: false, comparedLabel: cur.version_label,
        added: [...thisCodes].filter(c => !curCodes.has(c)).sort(),
        removed: [...curCodes].filter(c => !thisCodes.has(c)).sort(),
        moved: [...thisCodes].filter(c => curCodes.has(c) && thisSec.get(c) !== curSec.get(c)).sort(),
        formsAdded: [...thisForms].filter(k => !curForms.has(k)).sort(),
        formsRemoved: [...curForms].filter(k => !thisForms.has(k)).sort(),
      };
    }
    const pinned = await getPinnedActiveImpact(v.id);
    return [v.id, { pinned, referencing, diff } as ImpactData] as const;
  }));
  const impactMap = new Map(impactEntries);

  const publishStrings: PublishStrings = {
    newDraftLabel: t("admin.pkg.newDraft.label", "New draft version (M09-030)"),
    creating: t("admin.pkg.newDraft.creating", "Creating…"),
    createDraft: t("admin.pkg.newDraft.create", "Create draft"),
    draftCreated: t("admin.pkg.newDraft.created", "draft created"),
    publishing: t("admin.pkg.publish.publishing", "Publishing…"),
    approvePublish: t("admin.pkg.publish.approve", "Approve & publish (maker-checker — RBAC-002)"),
  };
  const editorStrings: DraftEditorStrings = {
    heading: t("admin.pkg.editor.heading", "Draft editor — sections & items (M09-019/025)"),
    editableWhileDraft: t("admin.pkg.editor.editable", "editable while draft"),
    mandatory: t("admin.pkg.editor.mandatory", "mandatory"),
    sectionTitleAria: t("admin.pkg.editor.sectionTitleAria", "Section title"),
    removeAria: t("admin.pkg.editor.removeAria", "Remove"),
    addItem: t("admin.pkg.editor.addItem", "+ add item…"),
    addItemAria: t("admin.pkg.editor.addItemAria", "Add item"),
    newSectionTitle: t("admin.pkg.editor.newSectionTitle", "New section title"),
    addSection: t("admin.pkg.editor.addSection", "Add section"),
    draftSaved: t("admin.pkg.editor.draftSaved", "draft saved"),
    saving: t("admin.pkg.editor.saving", "Saving…"),
    save: t("admin.pkg.editor.save", "Save draft definition"),
  };
  const previewStrings: PreviewStrings = {
    open: t("admin.pkg.preview.open", "Preview as inspector (M09-028)"),
    close: t("admin.pkg.preview.close", "Close preview"),
    title: t("admin.pkg.preview.title", "Field preview"),
    asInspector: t("admin.pkg.preview.asInspector", "Rendered exactly as the inspector sees this version in the field workspace."),
    conditionalBadge: t("field.ws.conditional", "Conditional"),
    conditionalWhen: t("admin.pkg.preview.conditionalWhen", "Shown when"),
    guidanceLabel: t("field.ws.guidance", "Guidance"),
    dateLabel: t("field.ws.date.label", "Recorded date"),
    evidenceLabel: t("admin.pkg.preview.evidence", "Evidence"),
    evidenceMandatory: t("admin.pkg.preview.evMandatory", "required"),
    evidenceOptional: t("admin.pkg.preview.evOptional", "optional"),
    evidenceMin: t("admin.pkg.preview.evMin", "min"),
    noteLabel: t("field.ws.note.label", "Inspector note"),
    notePlaceholder: t("field.ws.note.placeholder", "Add an observation note (saved with the answer)…"),
    ncViolation: t("admin.pkg.ncArrow", "NC →"),
    triggersForm: t("admin.pkg.preview.triggersForm", "triggers action form"),
    formBlocking: t("admin.pkg.preview.formBlocking", "blocking"),
    formNonBlocking: t("admin.pkg.preview.formNonBlocking", "non-blocking"),
    formAppearsWhen: t("admin.pkg.preview.formAppearsWhen", "This form opens when the inspector marks the item non-compliant."),
    sectionMandatory: t("admin.pkg.mandatory", "mandatory"),
    emptySection: t("admin.pkg.preview.emptySection", "Report-head fields — no checklist items."),
    missingItem: t("admin.pkg.preview.missingItem", "item is not in the live item bank"),
    readOnly: t("admin.pkg.preview.readOnly", "read-only"),
    enumLabels, afFieldLabels, evTypeLabels,
  };
  const impactStrings: ImpactStrings = {
    title: t("admin.pkg.impact.title", "Publish impact (M09-013)"),
    pinnedTitle: t("admin.pkg.impact.pinnedTitle", "In-flight work on prior published versions"),
    pinnedNone: t("admin.pkg.impact.pinnedNone", "No active visits or inspections are pinned to a prior published version."),
    pinnedVisits: t("admin.pkg.impact.pinnedVisits", "{n} active visit(s)"),
    pinnedInspections: t("admin.pkg.impact.pinnedInspections", "{n} active inspection(s)"),
    pinnedHint: t("admin.pkg.impact.pinnedHint", "These run on the version they downloaded (frozen — M09-030); publishing does not re-version them."),
    pinnedUnavailable: t("admin.pkg.impact.pinnedUnavailable", "In-flight counts are outside your read scope."),
    priorLead: t("admin.pkg.impact.priorLead", "By prior version:"),
    priorLine: t("admin.pkg.impact.priorLine", "{label}: {visits} visit(s), {inspections} inspection(s)"),
    refTitle: t("admin.pkg.impact.refTitle", "Other published packages sharing these items"),
    refNone: t("admin.pkg.impact.refNone", "No other published package references items in this version."),
    refShares: t("admin.pkg.impact.refShares", "shares {n} item(s)"),
    diffTitle: t("admin.pkg.impact.diffTitle", "Changes vs the currently-published version"),
    diffVsCurrent: t("admin.pkg.impact.diffVsCurrent", "Compared against {label}:"),
    diffIsCurrent: t("admin.pkg.impact.diffIsCurrent", "This is the currently-published version."),
    diffNoBaseline: t("admin.pkg.impact.diffNoBaseline", "No published version yet — this would be the first."),
    added: t("admin.pkg.impact.added", "Added"),
    removed: t("admin.pkg.impact.removed", "Removed"),
    moved: t("admin.pkg.impact.moved", "Moved section"),
    formsAdded: t("admin.pkg.impact.formsAdded", "Forms added"),
    formsRemoved: t("admin.pkg.impact.formsRemoved", "Forms removed"),
    noChanges: t("admin.pkg.impact.noChanges", "No item or action-form changes vs the published version."),
  };

  return (
    <Shell current="/admin" title={t("admin.pkg.title", "Package & Form Designer")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-030/031 · ENG-02</span>}>
      {(packagesError || itemsError) && <div className="ax-banner ax-banner--critical" role="alert"><div>
        <strong>{t("admin.pkg.error.title", "Couldn’t load package configuration.")}</strong> {t("admin.pkg.error.retry", "Try again.")}
      </div></div>}
      {pkgs.map(p => (<div key={p.id} className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
      {(p.package_versions ?? []).map(v => {
        const def = v.definition;
        const published = v.status === "published" || v.status === "locked";
        return (
          <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <h3>{p.code} — {p.title}</h3>
              <div className="ax-row">
                <span className="ax-version">{v.version_label}</span>
                <span className={`ax-lozenge ${published ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${v.status}`, String(v.status).replace(/_/g, " "))}</span>
              </div>
            </div>
            {published && (
              <div className="ax-banner ax-banner--immutable"><div>
                <strong>{t("admin.pkg.immutable.title", "Published version — immutable.")}</strong> {t("admin.pkg.immutable.before", "Edits are rejected by the database itself (trigger")} <code>trg_guard_pkg</code>{t("admin.pkg.immutable.after", ", proven in B1-EV-001). Changes require a new draft version.")}
              </div></div>
            )}
            {(def.sections ?? []).map(s => (
              <div key={s.key} className="adm-designer-section" style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-standard)", overflow: "hidden" }}>
                <div style={{ padding: "var(--ax-space-150) var(--ax-space-200)", background: "var(--ax-color-surface-sunken)", borderBlockEnd: "1px solid var(--ax-color-border)", font: "var(--ax-text-body-strong)" }}>
                  {s.title} {s.mandatory && <span className="ax-lozenge ax-lozenge--critical" style={{ marginInlineStart: 8 }}>{t("admin.pkg.mandatory", "mandatory")}</span>}
                </div>
                {(s.items ?? []).map(code => {
                  const it = itemMap.get(code);
                  const rm = it?.response_model as { mapping?: Record<string, { violation?: string; action_form?: string }>; conditional?: object } | undefined;
                  const nc = rm?.mapping?.["non_compliant"];
                  return (
                    <div key={code} style={{ padding: "var(--ax-space-150) var(--ax-space-200)", borderBlockEnd: "1px solid var(--ax-color-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <strong>{code}</strong> <span>{it?.title}</span>
                      {nc?.violation && <span className="ax-lozenge ax-lozenge--warning">{t("admin.pkg.ncArrow", "NC →")} {nc.violation}</span>}
                      {nc?.action_form && <span className="ax-lozenge ax-lozenge--critical">{t("admin.pkg.blockingActionForm", "blocking action form")}</span>}
                      {rm?.conditional && <span className="ax-lozenge ax-lozenge--info">{t("admin.pkg.conditional", "conditional")}</span>}
                      {it?.evidence_rule != null && <span className="ax-lozenge ax-lozenge--info">{t("admin.pkg.evidenceRule", "evidence rule")}</span>}
                      <span className="ax-caption" style={{ marginInlineStart: "auto" }}>{t("admin.pkg.weight", "weight")} {it?.score_weight ?? "—"}</span>
                    </div>
                  );
                })}
                {(s.items ?? []).length === 0 && <p className="ax-caption" style={{ padding: "var(--ax-space-150) var(--ax-space-200)" }}>{t("admin.pkg.reportHead", "report-head fields")}</p>}
              </div>
            ))}
            <p className="ax-caption">
              {t("admin.pkg.actionForms", "Action forms:")} {(def.action_forms ?? []).map(a => `${a.title}${a.blocking ? ` (${t("admin.pkg.blocking", "blocking")})` : ""}`).join(", ") || "—"} {t("admin.pkg.actionFormsNote", "· consumed at runtime exactly as configured (M09-019/030).")}
            </p>

            {/* M09-028 — faithful read-only inspector render, toggled per version. */}
            <PackagePreview
              sections={(def.sections ?? []).map(s => ({ key: s.key, title: s.title, items: s.items, mandatory: s.mandatory }))}
              actionForms={(def.action_forms ?? []).map(a => ({ key: a.key, title: a.title, blocking: a.blocking, fields: a.fields }))}
              itemMap={previewItems} strings={previewStrings} />

            {/* M09-013 — impact sits with the version, directly above Approve & publish for drafts. */}
            {!published && v.status === "draft" ? (
              <>
                <DraftEditor versionId={v.id} definition={def} catalog={items.map(i => ({ code: i.code, title: i.title }))} strings={editorStrings} />
                <ImpactPanel data={impactMap.get(v.id)!} strings={impactStrings} />
                <ApprovePublish versionId={v.id} strings={publishStrings} />
              </>
            ) : (
              <ImpactPanel data={impactMap.get(v.id)!} strings={impactStrings} />
            )}
          </div>
        );
      })}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <NewDraftForm packageId={p.id} strings={publishStrings} />
      </div>
      </div>))}
    </Shell>
  );
}
