import AdminDestinationFrame from "../_components/AdminDestinationFrame";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import { NewDraftForm, ApprovePublish, DeactivatePackage, type PublishStrings } from "./PublishControls";
import DraftEditor, { type DraftEditorStrings } from "./DraftEditor";
import PackagePreview, { type PreviewStrings, type PreviewItem } from "./PackagePreview";
import ImpactPanel, { type ImpactStrings, type ImpactData, type ReferencingPackage, type DefinitionDiff } from "./ImpactPanel";
import { getPinnedActiveImpact } from "./actions";
import styles from "./packages.module.css";
import TemplateRegistry, { type TemplateRow, type TemplateStrings } from "./TemplateRegistry";
import { IconLock } from "@/app/icons";
import { AdminRecordTableRow } from "../_components/AdminRecordDrawer";
import { createAdminRecordDrawerLabels } from "../_components/adminRecordDrawerCopy";

export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["compliance_admin", "form_admin"]);
type ItemRule = { requirement?: "required" | "optional" | "conditional"; conditional?: { visible_when?: string; mandatory_when_visible?: boolean }; evidence_rule?: ItemRow["evidence_rule"]; scoring_enabled?: boolean; score_weight?: number | null; response_mapping?: ResponseModel["mapping"] };
type Section = { key: string; title?: string; title_en?: string; title_ar?: string; items?: string[]; mandatory?: boolean };
type ActionFormDef = { key: string; title: string; blocking?: boolean; fields?: string[]; template_version_id?: string };
type Definition = { sections?: Section[]; action_forms?: ActionFormDef[]; item_rules?: Record<string, ItemRule>; template_refs?: string[] };
type VersionRow = { id: string; version_label: string; status: string; published_at: string | null; effective_from: string | null; effective_to: string | null; supersedes_id: string | null; definition: Definition };
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
  const today = new Date().toISOString().slice(0, 10);
  return orderedVersions(pkg)
    .filter(version => (version.status === "published" || version.status === "locked")
      && (!version.effective_from || version.effective_from <= today)
      && (!version.effective_to || version.effective_to >= today))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ?? null;
}

export default async function Packages() {
  const { t, locale } = await useT();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const sb = await supabaseServer();
  const [packageRead, itemRead, templateRead, violationRead, authRead] = await Promise.all([
    sb.from("packages").select("id, code, title, scope, package_versions(id, version_label, status, published_at, effective_from, effective_to, supersedes_id, definition)").order("code"),
    sb.from("inspection_items").select("id, code, title, active, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)").order("code"),
    sb.from("configuration_templates").select("id, template_key, template_type, version_label, title_en, title_ar, schema, status, effective_from").order("template_key"),
    sb.from("violation_codes").select("code, title, status").in("status", ["published", "locked"]).order("code"),
    getServerUser(),
  ]);
  if (packageRead.error) logProviderError("admin packages read", packageRead.error);
  if (itemRead.error) logProviderError("admin package item-bank read", itemRead.error);
  if (templateRead.error) logProviderError("admin template registry read", templateRead.error);
  if (violationRead.error) logProviderError("admin package violation read", violationRead.error);

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
  const templates = (templateRead.data ?? []) as unknown as TemplateRow[];
  const templateChoices = templates.filter(template => ["published", "locked"].includes(template.status)).map(template => ({ id: template.id, label: `${template.template_key} · ${template.version_label} — ${locale === "ar" ? template.title_ar : template.title_en}` }));
  const violationChoices = (violationRead.data ?? []).map(violation => ({ id: violation.code, label: `${violation.code} — ${violation.title}` }));
  const itemMap = new Map(items.map(item => [item.code, item]));
  const readAt = formatDateTime(Date.now(), locale === "ar" ? "ar" : "en");

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
    effectiveFrom: t("admin.pkg.newDraft.effectiveFrom", "Effective from"),
    publishing: t("admin.pkg.publish.publishing", "Publishing…"),
    approvePublish: t("admin.pkg.publish.approve", "Approve & publish"),
    published: t("admin.pkg.publish.published", "Version published. It is now immutable."),
    publishHint: t("admin.pkg.publish.hint", "Publish rechecks item, evidence, condition, violation, penalty and action-form dependencies. The approver must differ from the creator."),
    effectiveTo: t("admin.pkg.deactivate.effectiveTo", "Effective to"), deactivationReason: t("admin.pkg.deactivate.reason", "Deactivation reason"), deactivate: t("admin.pkg.deactivate.action", "Deactivate version"), deactivating: t("admin.pkg.deactivate.working", "Deactivating…"), deactivated: t("admin.pkg.deactivate.done", "Package version deactivated"),
  };
  const editorStrings: DraftEditorStrings = {
    heading: t("admin.pkg.editor.heading", "Package designer"),
    editableWhileDraft: t("admin.pkg.editor.editable", "Draft · editable"),
    mandatory: t("admin.pkg.editor.mandatory", "Mandatory section"),
    structure: t("admin.pkg.editor.structure", "1 · Structure"),
    fieldCanvas: t("admin.pkg.editor.canvas", "2 · Field canvas"),
    preview: t("admin.pkg.editor.preview", "3 · Read-only preview"),
    sectionTitleAria: t("admin.pkg.editor.sectionTitleAria", "Section title"),
    sectionTitleEn: t("admin.pkg.editor.sectionTitleEn", "Section title (English)"), sectionTitleAr: t("admin.pkg.editor.sectionTitleAr", "Section title (Arabic)"),
    moveUp: t("admin.pkg.editor.moveUp", "Move up"), moveDown: t("admin.pkg.editor.moveDown", "Move down"),
    removeAria: t("admin.pkg.editor.removeAria", "Remove"),
    addItem: t("admin.pkg.editor.addItem", "Choose an item…"),
    addItemAria: t("admin.pkg.editor.addItemAria", "Add item from catalogue"),
    newSectionTitle: t("admin.pkg.editor.newSectionTitle", "New section title"),
    newSectionTitleAr: t("admin.pkg.editor.newSectionTitleAr", "New section title (Arabic)"),
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
    bilingualSection: t("admin.pkg.editor.bilingualSection", "Section {key} needs English and Arabic titles."),
    relationship: t("admin.pkg.editor.relationship", "Package-item policy"), requirement: t("admin.pkg.editor.requirement", "Requirement"), required: t("admin.pkg.editor.required", "Required"), optional: t("admin.pkg.editor.optional", "Optional"), conditional: t("admin.pkg.editor.conditional", "Conditional"),
    visibleWhen: t("admin.pkg.editor.visibleWhen", "Visible when (key=value)"), mandatoryWhenVisible: t("admin.pkg.editor.mandatoryWhenVisible", "Mandatory when visible"), evidence: t("admin.pkg.editor.evidence", "Evidence override"), inheritEvidence: t("admin.pkg.editor.inheritEvidence", "Use base item policy"), scoring: t("admin.pkg.editor.scoring", "Scoring enabled"), scoreWeight: t("admin.pkg.editor.scoreWeight", "Score weight override"), violation: t("admin.pkg.editor.violation", "Non-compliant violation"), actionForm: t("admin.pkg.editor.actionForm", "Non-compliant action form"), none: t("admin.pkg.editor.none", "None"),
    forms: t("admin.pkg.editor.forms", "Action forms"), formKey: t("admin.pkg.editor.formKey", "Form key"), formTitle: t("admin.pkg.editor.formTitle", "Form title"), blocking: t("admin.pkg.editor.blocking", "Blocking"), template: t("admin.pkg.editor.template", "Governed template version"), addForm: t("admin.pkg.editor.addForm", "Add action form"), removeForm: t("admin.pkg.editor.removeForm", "Remove form"), circularCheck: t("admin.pkg.editor.circularCheck", "Circular dependencies are rejected again at publish."),
    evidencePhoto: t("admin.pkg.editor.evidence.photo", "Photo"), evidenceVideo: t("admin.pkg.editor.evidence.video", "Video"), evidenceDocument: t("admin.pkg.editor.evidence.document", "Document"), evidenceComment: t("admin.pkg.editor.evidence.comment", "Comment"),
  };
  const templateStrings: TemplateStrings = {
    heading: t("admin.template.heading", "Governed template registry"), intro: t("admin.template.intro", "Create versioned bilingual form, report, action-form, or penalty templates. Published versions are immutable and can be referenced by package action forms and penalty mappings."),
    key: t("admin.template.key", "Template key"), type: t("admin.template.type", "Type"), version: t("admin.template.version", "Version"), effectiveFrom: t("admin.template.effectiveFrom", "Effective from"), titleEn: t("admin.template.titleEn", "English title"), titleAr: t("admin.template.titleAr", "Arabic title"), schema: t("admin.template.schema", "Schema (JSON object)"), create: t("admin.template.create", "Create draft template version"), creating: t("admin.template.creating", "Creating…"), save: t("admin.template.save", "Save draft"), saving: t("admin.template.saving", "Saving…"), publish: t("admin.template.publish", "Approve & publish"), publishing: t("admin.template.publishing", "Publishing…"), effectiveTo: t("admin.template.effectiveTo", "Effective to"), reason: t("admin.template.reason", "Reason"), deactivate: t("admin.template.deactivate", "Deactivate"), deactivating: t("admin.template.deactivating", "Deactivating…"), historical: t("admin.template.historical", "Immutable historical template version."), saved: t("admin.template.saved", "Saved"),
    typeForm: t("admin.template.type.form", "Form"), typeReport: t("admin.template.type.report", "Report"), typeActionForm: t("admin.template.type.actionForm", "Action form"), typePenalty: t("admin.template.type.penalty", "Penalty"),
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

  const previewFor = (definition: Definition) => {
    const projected = { ...previewItems };
    for (const [code, override] of Object.entries(definition.item_rules ?? {})) {
      const base = projected[code]; if (!base) continue;
      const nc = override.response_mapping?.non_compliant;
      projected[code] = { ...base, requirement: override.requirement ?? base.requirement, conditional: override.conditional?.visible_when ?? null, mandatoryWhenVisible: !!override.conditional?.mandatory_when_visible, scoringEnabled: override.scoring_enabled ?? base.scoringEnabled, evidence: override.evidence_rule === undefined ? base.evidence : override.evidence_rule?.on ? { type: override.evidence_rule.type ?? "photo", min: Math.max(1, override.evidence_rule.min ?? 1), mandatory: !!override.evidence_rule.mandatory } : null, ncViolation: nc?.violation ?? base.ncViolation, ncActionForm: nc?.action_form ?? base.ncActionForm };
    }
    return (
    <PackagePreview
      sections={(definition.sections ?? []).map(section => ({ key: section.key, title: locale === "ar" ? (section.title_ar ?? section.title_en ?? section.title ?? section.key) : (section.title_en ?? section.title ?? section.title_ar ?? section.key), items: section.items, mandatory: section.mandatory }))}
      actionForms={(definition.action_forms ?? []).map(form => ({ key: form.key, title: form.title, blocking: form.blocking, fields: form.fields }))}
      itemMap={projected}
      strings={previewStrings}
    />
    );
  };
  const notConfigured = t("common.notConfigured", copy("Not configured", "غير مُهيّأ"));
  const publishedPackages = pkgs.filter(pkg => currentPublished(pkg)).length;
  const draftPackages = pkgs.filter(pkg => (pkg.package_versions ?? []).some(version => version.status === "draft")).length;
  const drawerLabels = createAdminRecordDrawerLabels(t, locale);
  const surveyGovernance = [
    t("admin.revamp.survey.governance.validate", copy("Publish revalidates sections, items, response mappings, evidence and action-form dependencies.", "يعيد النشر التحقق من الأقسام والبنود وربط الإجابات والأدلة واعتماديات نماذج الإجراءات.")),
    t("admin.revamp.survey.governance.maker", copy("Maker-checker approval is enforced by the existing publish actions and database guards.", "يُفرض فصل المُعدّ عن المعتمد عبر إجراءات النشر وضوابط قاعدة البيانات الحالية.")),
    t("admin.revamp.survey.governance.runtime", copy("Execution consumes only the locked package version selected for the visit.", "يستخدم التنفيذ فقط إصدار الحزمة المقفل المختار للزيارة.")),
  ];
  const packageEditUnavailable = t(
    "admin.recordDrawer.package.editUnavailable",
    copy(
      "Your RLS-visible role does not expose the governed package authoring actions.",
      "لا يتيح دورك المرئي وفق أمن الصفوف إجراءات تأليف الحزم المحكومة.",
    ),
  );

  return (
    <AdminDestinationFrame
      current="/admin/packages"
      title={t("admin.revamp.survey.title", copy("Survey Configuration", "تهيئة النماذج"))}
      subtitle={t("admin.revamp.survey.subtitle", copy("Inspection forms, sections and response rules", "نماذج التفتيش والأقسام وقواعد الإجابة"))}
      hub={t("admin.revamp.hub.rules", copy("Rules & content", "القواعد والمحتوى"))}
      routeLabel="/admin/packages"
      designId="frame-22-admin-survey-configuration"
      drawerLabels={drawerLabels}
      labels={{
        administration: t("navigation.administration", copy("Administration", "الإدارة")),
        breadcrumb: t("common.breadcrumb", copy("Breadcrumb", "مسار التنقل")),
        governance: t("admin.revamp.governance", copy("Governance on this surface", "الحوكمة في هذه الواجهة")),
        reconstruction: t("admin.revamp.reconstruction", copy("Reconstruction note", "ملاحظة إعادة البناء")),
      }}
      metrics={[
        {
          label: t("admin.revamp.survey.metric.published", copy("Published packages", "الحزم المنشورة")),
          value: packageUnavailable ? notConfigured : publishedPackages,
          note: t("admin.revamp.survey.metric.published.note", copy("Currently effective versions only", "الإصدارات النافذة حالياً فقط")),
        },
        {
          label: t("admin.revamp.survey.metric.items", copy("Inspection items", "بنود التفتيش")),
          value: itemBankUnavailable ? notConfigured : items.length,
          note: t("admin.revamp.survey.metric.items.note", copy("RLS-visible governed catalogue", "كتالوج محكوم ومرئي حسب أمن الصفوف")),
        },
        {
          label: t("admin.revamp.survey.metric.drafts", copy("Draft packages", "مسودات الحزم")),
          value: packageUnavailable ? notConfigured : draftPackages,
          note: t("admin.revamp.survey.metric.drafts.note", copy("Not selectable by live visits", "غير قابلة للاختيار للزيارات الفعلية")),
        },
      ]}
      tabs={[
        { label: t("admin.revamp.survey.tabs.packages", copy("Packages", "الحزم")), href: "/admin/packages", current: true },
        { label: t("admin.revamp.survey.tabs.items", copy("Sections & items", "الأقسام والبنود")), href: "/admin/items" },
        { label: t("admin.revamp.survey.tabs.forms", copy("Action forms", "نماذج الإجراءات")), href: "/admin/templates" },
        { label: t("admin.revamp.survey.tabs.versions", copy("Versions", "الإصدارات")), href: "/admin/packages#package-register" },
      ]}
      gate={{
        title: t("admin.revamp.survey.gate.title", copy("Published packages are immutable", "الحزم المنشورة غير قابلة للتغيير")),
        body: t("admin.revamp.survey.gate.body", copy("A package selected by a published visit cannot be structurally edited. Changes create additive drafts; existing and historical inspections remain pinned to their original package version.", "لا يمكن تعديل بنية حزمة اختارتها زيارة منشورة. تُنشئ التغييرات مسودات إضافية، وتبقى عمليات التفتيش الحالية والتاريخية مرتبطة بإصدار الحزمة الأصلي.")),
      }}
      governance={surveyGovernance}
      reconstructionNote={t("admin.revamp.survey.note", copy("The design’s sample package names, counts and rule contents are not copied. This workspace renders the real package, item, template, impact and immutable-version sources already used by execution.", "لا تُنسخ أسماء حزم التصميم النموذجية أو أعدادها أو محتوى قواعدها. تعرض مساحة العمل هذه مصادر الحزم والبنود والقوالب والأثر والإصدارات غير القابلة للتغيير التي يستخدمها التنفيذ فعلياً."))}
      context={<span className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <span className="badge badge-info">{t("admin.pkg.context", "Package configuration")}</span>
        <span className="t-caption" role="status">{t("admin.pkg.readAt", "Read from source at")} <bdi dir="ltr">{readAt}</bdi></span>
      </span>}
    >
      <div className={styles.pageStack} id="package-register">
        {!packageUnavailable && canWrite && <TemplateRegistry templates={templates} strings={templateStrings} />}
        <section className={`panel ${styles.hero}`} aria-labelledby="pkg-overview">
          <div className={styles.heroRow}>
            <div>
              <h2 id="pkg-overview" style={{ margin: 0 }}>{t("admin.pkg.overview.title", "Version-governed inspection packages")}</h2>
              <p className="t-caption">{t("admin.pkg.overview.body", "Drafts are editable. Publishing runs dependency validation and maker-checker approval; published and locked definitions remain immutable.")}</p>
              <p className="t-caption" role="status">{t("admin.pkg.readAt", "Read from source at")} <bdi dir="ltr">{readAt}</bdi></p>
            </div>
            <span className={`sq-lozenge ${canWrite ? "sq-lozenge--success" : "sq-lozenge--info"}`}>
              <span aria-hidden="true">{canWrite ? "✎ " : "◉ "}</span>
              {canWrite ? t("admin.pkg.writer", "Configuration writer") : t("admin.pkg.reader", "Read-only access")}
            </span>
          </div>
        </section>

        {packageUnavailable && (
          <div className="sq-banner sq-banner--critical" role="alert"><div>
            <strong>{t("admin.pkg.error.title", "Couldn’t load the package library.")}</strong>{" "}
            {t("admin.pkg.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            <a className="sq-link" href="/admin/packages">{t("admin.pkg.retry", "Reload to try again")}</a>.
          </div></div>
        )}

        {!packageUnavailable && itemBankUnavailable && (
          <div className="sq-banner sq-banner--warning" role="status"><div>
            <strong>{t("admin.pkg.itemsUnavailable.title", "Item catalogue unavailable.")}</strong>{" "}
            {t("admin.pkg.itemsUnavailable.body", "Package versions and impact remain visible, but editing and field preview are paused because their item dependency could not be read. This is not an empty catalogue.")}
          </div></div>
        )}

        {!packageUnavailable && (roleRead.error || !canWrite) && (
          <section className={`panel ${styles.governance}`} aria-labelledby="pkg-access">
            <h3 id="pkg-access" style={{ margin: 0 }}>{t("admin.pkg.readonly.title", "Read-only package access")}</h3>
            <p className="t-caption">{roleRead.error
              ? t("admin.pkg.readonly.unknown", "Your write permissions could not be verified, so all mutation controls are hidden. Reload to retry; RLS remains authoritative.")
              : t("admin.pkg.readonly.body", "You can inspect versions, previews and publish impact. Creating, saving and publishing require compliance_admin or form_admin; navigation access does not grant write permission.")}</p>
          </section>
        )}

        {!packageUnavailable && pkgs.length === 0 && (
          <section className={`panel ${styles.emptyState}`}>
            <div className="sq-state">
              <span className="sq-state__glyph" aria-hidden="true">▦</span>
              <h3>{t("admin.pkg.empty.title", "No packages configured")}</h3>
              <p className="t-caption">{t("admin.pkg.empty.body", "The package read succeeded and returned no rows. Package creation is not exposed by this route, so no unsupported create control is shown.")}</p>
            </div>
          </section>
        )}

        {!packageUnavailable && pkgs.map(pkg => {
          const versions = orderedVersions(pkg);
          const latestPublished = currentPublished(pkg);
          return (
            <details key={pkg.id} className={`panel ${styles.packageGroup}`} open>
              <summary>
                <span className={styles.packageHeading}>
                  <span><strong><bdi dir="ltr">{pkg.code}</bdi> — {pkg.title}</strong><br /><span className="t-caption">{pkg.scope ?? t("admin.pkg.scopeNone", "No scope recorded")}</span></span>
                  <span className="badge badge-info">{versions.length} {t("admin.pkg.versions", "version(s)")}</span>
                </span>
              </summary>
              <div className={styles.packageBody}>
                {versions.length === 0 ? (
                  <div className="sq-state"><span className="sq-state__glyph" aria-hidden="true">□</span><strong>{t("admin.pkg.noVersions", "No versions yet")}</strong></div>
                ) : (
                  <div className="sq-tablewrap">
                    <table className={styles.versionTable}>
                      <caption className="sr-only">{pkg.code} {t("admin.pkg.versions", "versions")}</caption>
                      <thead><tr><th scope="col">{t("admin.pkg.col.version", "Version")}</th><th scope="col">{t("admin.pkg.col.state", "State")}</th><th scope="col">{t("admin.pkg.col.published", "Published")}</th><th scope="col">{t("admin.pkg.col.definition", "Definition")}</th></tr></thead>
                      <tbody>{versions.map(version => {
                        const derivedSuperseded = (version.status === "published" || version.status === "locked") && !!latestPublished && latestPublished.id !== version.id;
                        const itemCount = (version.definition.sections ?? []).reduce((sum, section) => sum + (section.items?.length ?? 0), 0);
                        const sectionCount = version.definition.sections?.length ?? 0;
                        const actionFormCount = version.definition.action_forms?.length ?? 0;
                        const stateLabel = t(`enum.${version.status}`, version.status.replace(/_/g, " "));
                        return <AdminRecordTableRow
                          key={version.id}
                          record={{
                            title: `${pkg.code} · ${version.version_label}`,
                            subtitle: t("admin.revamp.hub.rules", copy("Rules & content", "القواعد والمحتوى")),
                            record: [
                              { label: t("admin.recordDrawer.package", copy("Package", "الحزمة")), value: pkg.title },
                              { label: t("admin.recordDrawer.code", copy("Code", "الرمز")), value: pkg.code },
                              { label: t("admin.pkg.col.version", "Version"), value: version.version_label },
                              { label: t("admin.pkg.col.state", "State"), value: stateLabel },
                              {
                                label: t("admin.pkg.col.definition", "Definition"),
                                value: `${sectionCount} ${t("admin.pkg.sections", "section(s)")} · ${itemCount} ${t("admin.pkg.items", "item(s)")}`,
                              },
                              {
                                label: t("admin.recordDrawer.actionForms", copy("Action forms", "نماذج الإجراءات")),
                                value: String(actionFormCount),
                              },
                              {
                                label: t("admin.recordDrawer.effective", copy("Effective period", "فترة النفاذ")),
                                value: `${version.effective_from ?? "—"} — ${version.effective_to ?? "—"}`,
                              },
                            ],
                            governance: surveyGovernance,
                            audit: version.published_at
                              ? [{ label: t("admin.pkg.col.published", "Published"), value: version.published_at }]
                              : [],
                            editHref: canWrite
                              ? version.status === "draft"
                                ? `#package-version-${version.id}`
                                : `#package-new-draft-${pkg.id}`
                              : undefined,
                            editUnavailableReason: packageEditUnavailable,
                            auditHref: `/admin/audit?case=${encodeURIComponent(version.id)}`,
                          }}
                        >
                          <td data-label={t("admin.pkg.col.version", "Version")}><bdi dir="ltr" className="sq-version">{version.version_label}</bdi></td>
                          <td data-label={t("admin.pkg.col.state", "State")}><span className={`sq-lozenge ${version.status === "draft" ? "sq-lozenge--warning" : "sq-lozenge--success"}`}><span aria-hidden="true">{version.status === "draft" ? "✎ " : "✓ "}</span>{stateLabel}</span>{derivedSuperseded && <span className="t-caption"> · {t("admin.pkg.derivedSuperseded", "older than current publish (derived)")}</span>}</td>
                          <td data-label={t("admin.pkg.col.published", "Published")}><bdi dir="ltr">{version.published_at ? version.published_at.slice(0, 10) : "—"}</bdi></td>
                          <td data-label={t("admin.pkg.col.definition", "Definition")}>{sectionCount} {t("admin.pkg.sections", "section(s)")} · {itemCount} {t("admin.pkg.items", "item(s)")}</td>
                        </AdminRecordTableRow>;
                      })}</tbody>
                    </table>
                  </div>
                )}

                <div className={styles.versionList}>{versions.map((version, index) => {
                  const published = version.status === "published" || version.status === "locked";
                  const definition = version.definition ?? {};
                  const impact = impactMap.get(version.id) ?? { pinned: null, referencing: [], diff: null };
                  return (
                    <details id={`package-version-${version.id}`} key={version.id} className={`panel ${styles.versionCard}`} open={version.status === "draft" || index === 0}>
                      <summary>
                        <span className={styles.versionHeading}>
                          <strong><bdi dir="ltr">{version.version_label}</bdi></strong>
                          <span className={`sq-lozenge ${published ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{t(`enum.${version.status}`, version.status.replace(/_/g, " "))}</span>
                        </span>
                      </summary>
                      <div className={styles.versionBody}>
                        {published && <div className="sq-banner sq-banner--immutable"><div>
                          <strong><IconLock size={16} /> {t("admin.pkg.immutable.title", "Published version — immutable.")}</strong>{" "}
                          {t("admin.pkg.immutable.body", "The database rejects definition and label edits. Create a new draft to change this package while existing inspections stay pinned to their downloaded version.")}
                        </div></div>}

                        {version.status === "draft" && canWrite && !itemBankUnavailable ? (
                          <DraftEditor versionId={version.id} definition={definition}
                            catalog={items.filter(item => item.active).map(item => ({ code: item.code, title: item.title }))}
                            violations={violationChoices} templates={templateChoices}
                            strings={editorStrings}
                            preview={<div key={`preview-${version.id}`}>{previewFor(definition)}</div>} />
                        ) : !itemBankUnavailable ? previewFor(definition) : null}

                        <ImpactPanel data={impact} strings={impactStrings} />
                        {published && canWrite && <DeactivatePackage versionId={version.id} strings={publishStrings} />}

                        {version.status === "draft" && canWrite && (
                          <section className="panel" style={{ padding: "var(--space-4)" }} aria-label={t("admin.pkg.publish.heading", "Publish gate")}>
                            <ApprovePublish versionId={version.id} strings={publishStrings} />
                          </section>
                        )}
                      </div>
                    </details>
                  );
                })}</div>

                {canWrite && <section id={`package-new-draft-${pkg.id}`} className="panel" style={{ padding: "var(--space-4)" }}><NewDraftForm packageId={pkg.id} strings={publishStrings} /></section>}
              </div>
            </details>
          );
        })}

        {!packageUnavailable && <section className={`panel ${styles.governance}`} aria-labelledby="pkg-blockers">
          <h3 id="pkg-blockers" style={{ margin: 0 }}>{t("admin.pkg.blockers.title", "Boundaries kept visible")}</h3>
          <p className="t-caption">{t("admin.pkg.blockers.body", "The designer now authors ordered bilingual sections, package-item policy, action forms, and governed template references. Publish revalidates dependencies and rejects circular conditions. Package footprint/fingerprint metrics and visual simulation remain unclaimed because no approved metric or simulator contract exists.")}</p>
          <p className="t-caption" role="status">{t("admin.pkg.stale", "Data may have changed since this source read; no freshness threshold is defined.")} <a className="sq-link" href="/admin/packages">{t("admin.pkg.refresh", "Refresh to reconcile")}</a>.</p>
        </section>}
      </div>
    </AdminDestinationFrame>
  );
}
