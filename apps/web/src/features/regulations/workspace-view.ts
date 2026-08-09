import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { WorkspaceEvidenceRule, WorkspaceItem, WorkspaceResponseModel } from "./workspace-source";

const LEVEL_TONES: Readonly<Record<string, StatusTone>> = {
  L1: "danger",
  L2: "warning",
  L3: "info",
};

const CONFIG_TONES: Readonly<Record<string, StatusTone>> = {
  published: "success",
  locked: "info",
  draft: "neutral",
  deactivated: "danger",
};

export const violationLevelTone = (level: string): StatusTone => LEVEL_TONES[level] ?? "neutral";
export const configStatusTone = (status: string): StatusTone => CONFIG_TONES[status] ?? "neutral";

export type ItemViolationLink = { readonly response: string; readonly violationCode: string };

/**
 * An item's own violation link, which lives in its response mapping rather than
 * in a foreign key. This is a **stronger** statement than "a violation exists on
 * the same clause": it names the code that answering this item a given way
 * raises.
 */
export function itemViolationLinks(model: WorkspaceResponseModel | null): readonly ItemViolationLink[] {
  const mapping = model?.mapping;
  if (!mapping) return [];
  return Object.entries(mapping)
    .filter(([, outcome]) => Boolean(outcome?.violation))
    .map(([response, outcome]) => ({ response, violationCode: outcome.violation ?? "" }));
}

export function itemActionForms(model: WorkspaceResponseModel | null): readonly string[] {
  const mapping = model?.mapping;
  if (!mapping) return [];
  return [...new Set(Object.values(mapping)
    .map(outcome => outcome?.action_form)
    .filter((form): form is string => Boolean(form)))];
}

export const itemResponses = (model: WorkspaceResponseModel | null): readonly string[] =>
  Array.isArray(model?.responses) ? model.responses : [];

export type EvidenceRequirement = {
  readonly type: string;
  readonly on: string | null;
  readonly minimum: number | null;
  readonly mandatory: boolean;
};

export function evidenceRequirement(rule: WorkspaceEvidenceRule): EvidenceRequirement | null {
  if (!rule || typeof rule.type !== "string") return null;
  return {
    type: rule.type,
    on: typeof rule.on === "string" ? rule.on : null,
    minimum: typeof rule.min === "number" ? rule.min : null,
    mandatory: rule.mandatory === true,
  };
}

export const itemsLinkedToViolation = (items: readonly WorkspaceItem[], code: string): readonly WorkspaceItem[] =>
  items.filter(item => itemViolationLinks(item.response_model).some(link => link.violationCode === code));
