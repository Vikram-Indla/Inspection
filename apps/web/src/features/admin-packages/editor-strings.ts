import type { DatePickerFieldStrings } from "@/components/saqeel/date-picker-field/date-picker-field";
import type { DraftEditorStrings } from "@/app/(app)/admin/packages/DraftEditor";
import type { ImpactStrings } from "@/app/(app)/admin/packages/ImpactPanel";
import type { PreviewStrings } from "@/app/(app)/admin/packages/PackagePreview";
import type { NewPackageStrings, PublishStrings } from "@/app/(app)/admin/packages/PublishControls";
import type { TemplateStrings } from "@/app/(app)/admin/packages/TemplateRegistry";
import type { ItemRow } from "./queries";
import type { PackageRow } from "./view";
import { useT } from "@/lib/i18n";

export type EditorStringBags = {
  publish: PublishStrings;
  newPackage: NewPackageStrings;
  draft: DraftEditorStrings;
  template: TemplateStrings;
  preview: PreviewStrings;
  impact: ImpactStrings;
};

export async function loadEditorStrings(
  items: readonly ItemRow[],
  packages: readonly PackageRow[],
): Promise<EditorStringBags> {
  const { t } = await useT();

  const enumLabels: Record<string, string> = {};
  for (const item of items) {
    const responses = (item.response_model as { responses?: string[] } | null)?.responses ?? [];
    for (const response of responses) {
      enumLabels[response] ??= t(`enum.${response}`, response.replace(/_/g, " "));
    }
  }
  const afFieldLabels: Record<string, string> = {};
  for (const pkg of packages) {
    for (const version of pkg.package_versions ?? []) {
      for (const form of version.definition.action_forms ?? []) {
        for (const field of (form as { fields?: string[] }).fields ?? []) {
          afFieldLabels[field] ??= t(`field.ws.af.${field}`, field.replace(/_/g, " "));
        }
      }
    }
  }

  const datePickerStrings: DatePickerFieldStrings = {
    placeholder: t("common.date.select", "Select a date"),
    clear: t("common.clear", "Clear"),
    today: t("common.today", "Today"),
    previousMonth: t("common.previousMonth", "Previous month"),
    nextMonth: t("common.nextMonth", "Next month"),
  };

  const publishStrings: PublishStrings = {
    datePicker: datePickerStrings,
    newDraftLabel: t("admin.pkg.newDraft.label", "New draft version label"),
    creating: t("admin.pkg.newDraft.creating", "Creating…"),
    createDraft: t("admin.pkg.newDraft.create", "Create draft"),
    draftCreated: t("admin.pkg.newDraft.created", "Draft created"),
    versionPlaceholder: t("admin.pkg.newDraft.placeholder", "Example: v2026.08"),
    effectiveFrom: t("admin.pkg.newDraft.effectiveFrom", "Effective from"),
    publishing: t("admin.pkg.publish.publishing", "Publishing…"),
    approvePublish: t("admin.pkg.publish.approve", "Approve & publish"),
    published: t("admin.pkg.publish.published", "Version published. It can no longer be changed."),
    publishHint: t("admin.pkg.publish.hint", "Publishing rechecks item, evidence, condition, violation, penalty and action-form dependencies. The approver must be a different person from the creator."),
    effectiveTo: t("admin.pkg.deactivate.effectiveTo", "Effective to"), deactivationReason: t("admin.pkg.deactivate.reason", "Deactivation reason"), deactivationReasonPlaceholder: t("admin.pkg.deactivate.reasonPlaceholder", "Why this version is being deactivated"), deactivate: t("admin.pkg.deactivate.action", "Deactivate version"), deactivating: t("admin.pkg.deactivate.working", "Deactivating…"), deactivated: t("admin.pkg.deactivate.done", "Package version deactivated"),
  };
  const newPackageStrings: NewPackageStrings = {
    heading: t("admin.pkg.create.heading", "Create a new package"),
    codeLabel: t("admin.pkg.create.codeLabel", "Package code"),
    codePlaceholder: t("admin.pkg.create.codePlaceholder", "Example: PKG-CHEM-001"),
    titleLabel: t("admin.pkg.create.titleLabel", "Package title"),
    titlePlaceholder: t("admin.pkg.create.titlePlaceholder", "Example: Chemical Storage Inspection"),
    scopeLabel: t("admin.pkg.create.scopeLabel", "Scope (optional)"),
    scopePlaceholder: t("admin.pkg.create.scopePlaceholder", "Example: Chemical facilities"),
    create: t("admin.pkg.create.create", "Create package"),
    creating: t("admin.pkg.newDraft.creating", "Creating…"),
    created: t("admin.pkg.create.created", "Package created"),
  };
  const draftStrings: DraftEditorStrings = {
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
    heading: t("admin.template.heading", "Governed template registry"), intro: t("admin.template.intro", "Create versioned, bilingual templates for forms, reports, action forms, or penalties. Published versions can’t be changed, and can be used by package action forms and penalty mappings."),
    key: t("admin.template.key", "Template key"), type: t("admin.template.type", "Type"), version: t("admin.template.version", "Version"), effectiveFrom: t("admin.template.effectiveFrom", "Effective from"), titleEn: t("admin.template.titleEn", "English title"), titleAr: t("admin.template.titleAr", "Arabic title"), schema: t("admin.template.schema", "Schema (JSON object)"), create: t("admin.template.create", "Create draft template version"), creating: t("admin.template.creating", "Creating…"), save: t("admin.template.save", "Save draft"), saving: t("admin.template.saving", "Saving…"), publish: t("admin.template.publish", "Approve & publish"), publishing: t("admin.template.publishing", "Publishing…"), effectiveTo: t("admin.template.effectiveTo", "Effective to"), reason: t("admin.template.reason", "Reason"), deactivate: t("admin.template.deactivate", "Deactivate"), deactivating: t("admin.template.deactivating", "Deactivating…"), historical: t("admin.template.historical", "Locked historical template version."), saved: t("admin.template.saved", "Saved"),
    typeForm: t("admin.template.type.form", "Form"), typeReport: t("admin.template.type.report", "Report"), typeActionForm: t("admin.template.type.actionForm", "Action form"), typePenalty: t("admin.template.type.penalty", "Penalty"),
    keyPlaceholder: t("admin.template.keyPlaceholder", "Example: chem-storage-checklist"),
    versionPlaceholder: t("admin.template.versionPlaceholder", "v1"),
    titleEnPlaceholder: t("admin.template.titleEnPlaceholder", "Example: Chemical storage inspection"),
    titleArPlaceholder: t("admin.template.titleArPlaceholder", "مثال: تفتيش تخزين المواد الكيميائية"),
    reasonPlaceholder: t("admin.template.reasonPlaceholder", "Why this version is being deactivated"),
    schemaPlaceholder: t("admin.template.schemaPlaceholder", '{"fields":[]}'),
    datePicker: datePickerStrings,
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
    pinnedHint: t("admin.pkg.impact.pinnedHint", "Existing work stays on the version it downloaded. Publishing never switches it to a new version without notice."),
    pinnedUnavailable: t("admin.pkg.impact.pinnedUnavailable", "Active counts aren’t available, or they’re outside what you can see. This does not mean zero."),
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
  return {
    publish: publishStrings,
    newPackage: newPackageStrings,
    draft: draftStrings,
    template: templateStrings,
    preview: previewStrings,
    impact: impactStrings,
  };
}
