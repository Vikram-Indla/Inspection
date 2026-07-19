"use client";
// Incident Report form — Figma FNS-033 / J-12, screen "Incident fields"
// (node 1068:123721). Client component; all labels arrive pre-translated as
// props from the server page (useT), matching the CreateRequest convention.
// Every label maps to a captured register string_id (EM-046..EM-059); the
// ax-field pattern (label htmlFor + input id) satisfies the a11y guard.
import { useActionState } from "react";
import { createIncidentReport, type IncidentResult } from "./actions";

export type IncidentFormStrings = {
  establishmentCode: string;            // EM-046
  commercialRegistrationNumber: string; // EM-047
  reportSource: string;                 // EM-048 (domain uncaptured)
  reporterName: string;                 // EM-049
  reporterContactNumber: string;        // EM-050
  reportTime: string;                   // EM-051
  numberOfCases: string;                // EM-052
  resultingDamage: string;              // EM-054
  incidentType: string;                 // EM-057 (domain uncaptured)
  preliminaryIncidentDescription: string; // EM-059
  submit: string;
  submitting: string;
  created: string;
};

export function IncidentReportForm({ strings: s }: { strings: IncidentFormStrings }) {
  const [state, action, pending] = useActionState<IncidentResult, FormData>(createIncidentReport, {});
  return (
    <form action={action} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-establishment-code">{s.establishmentCode}</label><input className="ax-input" name="establishment_code" id="ir-establishment-code" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-cr-number">{s.commercialRegistrationNumber}</label><input className="ax-input" name="commercial_registration_number" id="ir-cr-number" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-report-source">{s.reportSource}</label><input className="ax-input" name="report_source" id="ir-report-source" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-reporter-name">{s.reporterName}</label><input className="ax-input" name="reporter_name" id="ir-reporter-name" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-reporter-contact">{s.reporterContactNumber}</label><input className="ax-input" name="reporter_contact_number" id="ir-reporter-contact" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-report-time">{s.reportTime}</label><input className="ax-input" name="report_time" id="ir-report-time" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-number-of-cases">{s.numberOfCases}</label><input className="ax-input" name="number_of_cases" id="ir-number-of-cases" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-incident-type">{s.incidentType}</label><input className="ax-input" name="incident_type" id="ir-incident-type" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-resulting-damage">{s.resultingDamage}</label><textarea className="ax-textarea" name="resulting_damage" id="ir-resulting-damage" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="ir-description">{s.preliminaryIncidentDescription}</label><textarea className="ax-textarea" name="preliminary_incident_description" id="ir-description" /></div>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.submitting : s.submit}</button>
        {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
        {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
      </div>
    </form>
  );
}
