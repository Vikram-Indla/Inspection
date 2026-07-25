"use client";

import { useActionState } from "react";
import { createFieldIncidentReport, type FieldIncidentResult } from "./actions";
import styles from "./incident-reports.module.css";

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

// SAQEEL DS form — fields use `.field`/`.input`/`textarea.input`, the submit is
// `btn btn-primary`. The real server action, the mid-visit context anchors and
// every governed field label are unchanged (only presentation converted).
//
// Design diff (SAQEEL PWA-Field Immediate and Incident.dc.html, "Mid-visit
// incident" segment): the design orders the narrative as description → impact
// and marks the description required. That ordering and the required marker are
// applied here. The design's own incident field set (date · time · description ·
// impact · location · evidence) is a SUBSET/rename of the governed EM-046..EM-059
// set already shipped, so no governed field is dropped or relabelled:
//   design "Report time"            → report_time (EM-051)
//   design "Incident description" * → preliminary_incident_description (EM-059)
//   design "Impact"                 → resulting_damage (EM-054), kept free text:
//                                     the design's 4 impact options are sample
//                                     copy, not a governed option domain.
//   design "Incident date"          → NO governed column exists (the migration
//                                     has no incident date) — not rendered.
//   design "Location within establishment" → NO governed column — not rendered.
//   design "Evidence (photos/docs)" → the evidence table requires a NOT NULL
//                                     inspection_id and its evidence_link enum
//                                     has no incident member — not rendered.
//   design "Save draft"             → no draft store exists for incident_reports
//                                     (/field/drafts is in-progress visits) —
//                                     not rendered.
export default function FieldIncidentReportForm({ locale, strings: s, context, contextBadge }: {
  locale: string; strings: FieldIncidentStrings;
  // O-13/IPAD-FIGMA-DELTA §2B — set when reached mid-visit (from the active
  // inspection workspace), so the report anchors to that visit/factory/
  // inspection instead of standing alone. Absent on the general route.
  context?: { factoryId?: string; visitId?: string; inspectionId?: string };
  // Design footer tag ("During visit"). Passed ONLY when a real visit anchor is
  // present — a standalone report renders no tag rather than a false one.
  contextBadge?: string;
}) {
  const [state, action, pending] = useActionState<FieldIncidentResult, FormData>(createFieldIncidentReport, {});
  return (
    <form id="new-incident" action={action} className={styles.card}>
      <input type="hidden" name="locale" value={locale} />
      {context?.factoryId && <input type="hidden" name="factory_id" value={context.factoryId} />}
      {context?.visitId && <input type="hidden" name="visit_id" value={context.visitId} />}
      {context?.inspectionId && <input type="hidden" name="inspection_id" value={context.inspectionId} />}
      <div className={styles.grid2}>
        <div className="field"><label htmlFor="field-ir-establishment-code">{s.establishmentCode}</label><input className="input" name="establishment_code" id="field-ir-establishment-code" /></div>
        <div className="field"><label htmlFor="field-ir-cr">{s.commercialRegistrationNumber}</label><input className="input input-mono" name="commercial_registration_number" id="field-ir-cr" dir="ltr" /></div>
        <div className="field"><label htmlFor="field-ir-source">{s.reportSource}</label><input className="input" name="report_source" id="field-ir-source" /></div>
        <div className="field"><label htmlFor="field-ir-type">{s.incidentType}</label><input className="input" name="incident_type" id="field-ir-type" /></div>
        <div className="field"><label htmlFor="field-ir-reporter">{s.reporterName}</label><input className="input" name="reporter_name" id="field-ir-reporter" autoComplete="name" /></div>
        <div className="field"><label htmlFor="field-ir-contact">{s.reporterContactNumber}</label><input className="input input-mono" name="reporter_contact_number" id="field-ir-contact" inputMode="tel" dir="ltr" autoComplete="tel" /></div>
        <div className="field"><label htmlFor="field-ir-time">{s.reportTime}</label><input className="input" name="report_time" id="field-ir-time" /></div>
        <div className="field"><label htmlFor="field-ir-cases">{s.numberOfCases}</label><input className="input" name="number_of_cases" id="field-ir-cases" /></div>
      </div>
      <div className="field" style={{ marginBlockStart: "var(--space-3)" }}>
        <label htmlFor="field-ir-description">{s.preliminaryIncidentDescription}<span className={styles.req} aria-hidden="true"> *</span></label>
        <textarea className="input" name="preliminary_incident_description" id="field-ir-description" rows={3} required />
      </div>
      <div className="field" style={{ marginBlockStart: "var(--space-3)" }}><label htmlFor="field-ir-damage">{s.resultingDamage}</label><textarea className="input" name="resulting_damage" id="field-ir-damage" rows={2} /></div>
      <div className={styles.actionbar}>
        {contextBadge && <span className="badge badge-info"><span className="dot" />{contextBadge}</span>}
        <span className={styles.grow} />
        {state.error && <span className="field-error" role="alert">{state.error}</span>}
        {state.ok && <span className="badge badge-compliant" role="status"><span className="dot" />{s.created}</span>}
        <button className="btn btn-primary" disabled={pending}>{pending ? s.submitting : s.submit}</button>
      </div>
    </form>
  );
}
