// M2-02 Workflow, SLA & Notification Studio — notification template + delivery model.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0034 · design GAP-06/10.
//
// Pure helpers for the bilingual template pair, {variable} validation/rendering,
// language resolution, safe test preview, and provider-truth delivery
// classification. No DB, no provider I/O. Never fabricates delivery: a message
// with no registered adapter is 'not_configured', never a delivered SMS.

export type Language = "en" | "ar";

export type BilingualRule = {
  template: string;            // English half (existing column)
  template_ar?: string | null; // Arabic half (may be unsupplied)
};

export type TemplatePick = { text: string; language: Language; fellBackToEn: boolean };

/** Pick the template for the recipient's language, falling back to English when
 *  the Arabic half has not been supplied (never machine-translates). */
export function pickTemplate(rule: BilingualRule, language: Language): TemplatePick {
  if (language === "ar") {
    const ar = rule.template_ar?.trim();
    if (ar) return { text: ar, language: "ar", fellBackToEn: false };
    return { text: rule.template, language: "en", fellBackToEn: true };
  }
  return { text: rule.template, language: "en", fellBackToEn: false };
}

/** Resolve recipient language to a supported code (default English). */
export function resolveLanguage(pref: string | null | undefined): Language {
  return pref === "ar" ? "ar" : "en";
}

const VAR_RE = /\{([a-zA-Z0-9_]+)\}/g;

/** Distinct {variable} names referenced by a template. */
export function extractVariables(template: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = VAR_RE.exec(template)) !== null) out.add(m[1]);
  return [...out];
}

export type VariableValidation = { ok: boolean; missing: string[] };

/** Validate that every {variable} the template references is available in the payload. */
export function validateTemplateVariables(template: string, availableKeys: string[]): VariableValidation {
  const missing = extractVariables(template).filter((v) => !availableKeys.includes(v));
  return { ok: missing.length === 0, missing };
}

export type RenderResult = { text: string; unresolved: string[] };

/** Substitute {variables}; unknown placeholders are left intact and reported. */
export function renderTemplate(template: string, payload: Record<string, unknown>): RenderResult {
  const unresolved: string[] = [];
  const text = template.replace(VAR_RE, (_, name: string) => {
    if (Object.prototype.hasOwnProperty.call(payload, name) && payload[name] != null) return String(payload[name]);
    unresolved.push(name);
    return `{${name}}`;
  });
  return { text, unresolved };
}

// ---- provider truth ----
export type NotifyChannel = "inapp" | "push" | "sms" | "email";
export type DeliveryState = "delivered" | "queued" | "retrying" | "failed" | "not_configured" | "suppressed_by_preference";
export type FailureClass = "transient" | "permanent" | "not_configured" | "suppressed" | null;

export type ClassifyInput = {
  channel: NotifyChannel;
  adapterConfigured: boolean;
  suppressedByPreference?: boolean;
  attempt?: { delivered: boolean; transient?: boolean; error?: string };
};

/**
 * Map a delivery attempt to an honest state + failure class.
 * - inapp: the row IS the delivery → delivered.
 * - no adapter: not_configured (NEVER a delivered SMS/email/push).
 * - adapter present: delivered / retrying (transient) / failed (permanent).
 */
export function classifyDelivery(input: ClassifyInput): { delivery_state: DeliveryState; failure_class: FailureClass } {
  if (input.suppressedByPreference) return { delivery_state: "suppressed_by_preference", failure_class: "suppressed" };
  if (input.channel === "inapp") return { delivery_state: "delivered", failure_class: null };
  if (!input.adapterConfigured) return { delivery_state: "not_configured", failure_class: "not_configured" };
  if (!input.attempt) return { delivery_state: "queued", failure_class: null };
  if (input.attempt.delivered) return { delivery_state: "delivered", failure_class: null };
  return input.attempt.transient
    ? { delivery_state: "retrying", failure_class: "transient" }
    : { delivery_state: "failed", failure_class: "permanent" };
}

// ---- safe test preview (never sends) ----
export type TestPreview = {
  isPreview: true;
  sent: false;
  language: Language;
  fellBackToEn: boolean;
  text: string;
  unresolved: string[];
  variableValidation: VariableValidation;
};

/** Render a rule with a sample payload WITHOUT sending anything. */
export function safeTestPreview(rule: BilingualRule, language: Language, samplePayload: Record<string, unknown>): TestPreview {
  const pick = pickTemplate(rule, language);
  const render = renderTemplate(pick.text, samplePayload);
  return {
    isPreview: true, sent: false, language: pick.language, fellBackToEn: pick.fellBackToEn,
    text: render.text, unresolved: render.unresolved,
    variableValidation: validateTemplateVariables(pick.text, Object.keys(samplePayload)),
  };
}
