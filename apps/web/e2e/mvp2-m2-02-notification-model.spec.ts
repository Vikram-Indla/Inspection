import { test, expect } from "@playwright/test";
import {
  pickTemplate, resolveLanguage, extractVariables, validateTemplateVariables,
  renderTemplate, classifyDelivery, safeTestPreview,
} from "../src/lib/workflow/notifications";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0034. Self-authored, pure.

const rule = { template: "Visit {visit_id} assigned to {inspector}", template_ar: "تم إسناد الزيارة {visit_id} إلى {inspector}" };

test("mvp2-m2-02 0034 pickTemplate uses AR when present, EN otherwise", () => {
  expect(pickTemplate(rule, "ar").language).toBe("ar");
  expect(pickTemplate(rule, "ar").fellBackToEn).toBe(false);
  expect(pickTemplate(rule, "en").language).toBe("en");
});

test("mvp2-m2-02 0034 pickTemplate falls back to EN when AR half is missing (no machine translation)", () => {
  const enOnly = { template: "Report {id} ready", template_ar: null };
  const p = pickTemplate(enOnly, "ar");
  expect(p.language).toBe("en");
  expect(p.fellBackToEn).toBe(true);
  expect(p.text).toBe("Report {id} ready");
});

test("mvp2-m2-02 0034 resolveLanguage", () => {
  expect(resolveLanguage("ar")).toBe("ar");
  expect(resolveLanguage("en")).toBe("en");
  expect(resolveLanguage(null)).toBe("en");
  expect(resolveLanguage("fr")).toBe("en");
});

test("mvp2-m2-02 0034 variable extraction + validation", () => {
  expect(extractVariables(rule.template).sort()).toEqual(["inspector", "visit_id"]);
  expect(validateTemplateVariables(rule.template, ["visit_id", "inspector"]).ok).toBe(true);
  const bad = validateTemplateVariables(rule.template, ["visit_id"]);
  expect(bad.ok).toBe(false);
  expect(bad.missing).toEqual(["inspector"]);
});

test("mvp2-m2-02 0034 render substitutes and reports unresolved", () => {
  const r = renderTemplate(rule.template, { visit_id: "V-9" });
  expect(r.text).toBe("Visit V-9 assigned to {inspector}");
  expect(r.unresolved).toEqual(["inspector"]);
});

test("mvp2-m2-02 0034 provider truth: never a delivered SMS without an adapter", () => {
  expect(classifyDelivery({ channel: "inapp", adapterConfigured: true })).toEqual({ delivery_state: "delivered", failure_class: null });
  expect(classifyDelivery({ channel: "sms", adapterConfigured: false })).toEqual({ delivery_state: "not_configured", failure_class: "not_configured" });
  expect(classifyDelivery({ channel: "sms", adapterConfigured: true, attempt: { delivered: true } }).delivery_state).toBe("delivered");
  expect(classifyDelivery({ channel: "sms", adapterConfigured: true, attempt: { delivered: false, transient: true } })).toEqual({ delivery_state: "retrying", failure_class: "transient" });
  expect(classifyDelivery({ channel: "email", adapterConfigured: true, attempt: { delivered: false, transient: false } })).toEqual({ delivery_state: "failed", failure_class: "permanent" });
  expect(classifyDelivery({ channel: "push", adapterConfigured: true, suppressedByPreference: true }).delivery_state).toBe("suppressed_by_preference");
});

test("mvp2-m2-02 0034 safe test preview never sends", () => {
  const p = safeTestPreview(rule, "ar", { visit_id: "V-1", inspector: "Sara" });
  expect(p.sent).toBe(false);
  expect(p.isPreview).toBe(true);
  expect(p.language).toBe("ar");
  expect(p.text).toContain("V-1");
  expect(p.variableValidation.ok).toBe(true);
  // missing variable is surfaced in preview, still not sent
  const p2 = safeTestPreview(rule, "en", { visit_id: "V-2" });
  expect(p2.sent).toBe(false);
  expect(p2.unresolved).toEqual(["inspector"]);
});
