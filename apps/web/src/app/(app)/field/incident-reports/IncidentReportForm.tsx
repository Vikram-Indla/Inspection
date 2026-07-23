"use client";

import { useActionState } from "react";
import { createFieldIncidentReport, type FieldIncidentResult } from "./actions";

export type FieldIncidentStrings = {
  establishmentCode: string;
  commercialRegistrationNumber: string;
  reportSource: string;
  reporterName: string;
  reporterContactNumber: string;
  reportTime: string;
  numberOfCases: string;
  resultingDamage: string;
  incidentType: string;
  preliminaryIncidentDescription: string;
  submit: string;
  submitting: string;
  created: string;
};

export default function FieldIncidentReportForm({ locale, strings: s, context }: {
  locale: string; strings: FieldIncidentStrings;
  // O-13/IPAD-FIGMA-DELTA §2B — set when reached mid-visit (from the active
  // inspection workspace), so the report anchors to that visit/factory/
  // inspection instead of standing alone. Absent on the general route.
  context?: { factoryId?: string; visitId?: string; inspectionId?: string };
}) {
  const [state, action, pending] = useActionState<FieldIncidentResult, FormData>(createFieldIncidentReport, {});
  const fieldClass = "ax-field ax-field--field";
  return (
    <form id="new-incident" action={action} className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
      <input type="hidden" name="locale" value={locale} />
      {context?.factoryId && <input type="hidden" name="factory_id" value={context.factoryId} />}
      {context?.visitId && <input type="hidden" name="visit_id" value={context.visitId} />}
      {context?.inspectionId && <input type="hidden" name="inspection_id" value={context.inspectionId} />}
      <div className="ax-grid-2">
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-establishment-code">{s.establishmentCode}</label><input className="ax-input" name="establishment_code" id="field-ir-establishment-code" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-cr">{s.commercialRegistrationNumber}</label><input className="ax-input ax-numeric" name="commercial_registration_number" id="field-ir-cr" dir="ltr" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-source">{s.reportSource}</label><input className="ax-input" name="report_source" id="field-ir-source" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-type">{s.incidentType}</label><input className="ax-input" name="incident_type" id="field-ir-type" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-reporter">{s.reporterName}</label><input className="ax-input" name="reporter_name" id="field-ir-reporter" autoComplete="name" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-contact">{s.reporterContactNumber}</label><input className="ax-input ax-numeric" name="reporter_contact_number" id="field-ir-contact" inputMode="tel" dir="ltr" autoComplete="tel" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-time">{s.reportTime}</label><input className="ax-input" name="report_time" id="field-ir-time" /></div>
        <div className={fieldClass} style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="field-ir-cases">{s.numberOfCases}</label><input className="ax-input" name="number_of_cases" id="field-ir-cases" /></div>
      </div>
      <div className={fieldClass} style={{ maxInlineSize: "none", marginBlockStart: "var(--ax-space-200)" }}><label className="ax-field__label" htmlFor="field-ir-damage">{s.resultingDamage}</label><textarea className="ax-textarea" name="resulting_damage" id="field-ir-damage" rows={3} /></div>
      <div className={fieldClass} style={{ maxInlineSize: "none", marginBlockStart: "var(--ax-space-200)" }}><label className="ax-field__label" htmlFor="field-ir-description">{s.preliminaryIncidentDescription}</label><textarea className="ax-textarea" name="preliminary_incident_description" id="field-ir-description" rows={4} /></div>
      <div className="ax-row" style={{ marginBlockStart: "var(--ax-space-250)", gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
        <button className="ax-btn ax-btn--prominent ax-btn--field" disabled={pending}>{pending ? s.submitting : s.submit}</button>
        {state.error && <span className="ax-field__error" style={{ display: "block" }} role="alert">{state.error}</span>}
        {state.ok && <span className="ax-lozenge ax-lozenge--success" role="status">{s.created}</span>}
      </div>
    </form>
  );
}
