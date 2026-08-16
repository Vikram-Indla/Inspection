export type ItemRule = {
  requirement?: "required" | "optional" | "conditional";
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  evidence_rule?: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  scoring_enabled?: boolean;
  score_weight?: number | null;
  response_mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
};

export type Section = {
  key: string;
  title?: string;
  title_en?: string;
  title_ar?: string;
  items?: string[];
  mandatory?: boolean;
  fields?: string[];
};

export type ActionForm = {
  key: string;
  title: string;
  blocking?: boolean;
  fields?: string[];
  template_version_id?: string;
};

export type Definition = {
  sections?: Section[];
  action_forms?: ActionForm[];
  item_rules?: Record<string, ItemRule>;
  template_refs?: string[];
};

export type CatalogItem = { code: string; title: string };

export type SelectChoice = { id: string; label: string };

export type DraftEditorStrings = {
  heading: string; editableWhileDraft: string; mandatory: string;
  structure: string; fieldCanvas: string; preview: string; sectionTitleAria: string;
  sectionTitleEn: string; sectionTitleAr: string; moveUp: string; moveDown: string;
  removeAria: string; addItem: string; addItemAria: string; newSectionTitle: string;
  newSectionTitleAr: string; addSection: string; draftSaved: string; saving: string; save: string;
  noChanges: string; unsaved: string; emptyTitle: string; emptyBody: string;
  itemCount: string; validationTitle: string; validationClear: string;
  duplicateItem: string; blankSection: string; bilingualSection: string;
  relationship: string; requirement: string; required: string; optional: string; conditional: string;
  visibleWhen: string; mandatoryWhenVisible: string; evidence: string; inheritEvidence: string;
  scoring: string; scoreWeight: string; violation: string; actionForm: string; none: string;
  forms: string; formKey: string; formTitle: string; blocking: string; template: string;
  addForm: string; removeForm: string; circularCheck: string;
  evidencePhoto: string; evidenceVideo: string; evidenceDocument: string; evidenceComment: string;
};

export const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (value, [key, replacement]) => value.split(`{${key}}`).join(String(replacement)),
    template,
  );

export function nextFreeKey(stem: string, taken: ReadonlySet<string>): string {
  const candidate = (suffix: number): string => {
    const next = `${stem}-${suffix}`;
    return taken.has(next) ? candidate(suffix + 1) : next;
  };
  return candidate(2);
}
