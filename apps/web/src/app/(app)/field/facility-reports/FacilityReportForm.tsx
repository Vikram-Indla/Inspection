"use client";

import { useActionState, useState } from "react";
import SignaturePad, { type SignatureAck, type SignaturePadStrings } from "../inspection/[id]/SignaturePad";
import { createFieldFacilityReport, type FieldFacilityReportResult } from "./actions";
import styles from "../incident-reports/incident-reports.module.css";

export type FieldFacilityReportStrings = {
  reportDate: string; summonsDate: string;
  facilityAction: string; close: string; reopen: string; reason: string;
  attendanceSignature: string; openSignature: string; signed: string;
  submit: string; submitting: string; created: string;
};

// Jira INSP-583. Figma: MIM iPad Inspector App, Components > Reports >
// "Facility Report" (node 369:49024). Same signature-reuse pattern as the
// rest of this report family (summons/sample-collection/destruction).
export default function FieldFacilityReportForm({ locale, strings: s, sigStrings, context, contextBadge }: {
  locale: string; strings: FieldFacilityReportStrings; sigStrings: SignaturePadStrings;
  context?: { factoryId?: string; visitId?: string; inspectionId?: string };
  contextBadge?: string;
}) {
  const [state, action, pending] = useActionState<FieldFacilityReportResult, FormData>(createFieldFacilityReport, {});
  const [facilityAction, setFacilityAction] = useState<"close" | "reopen" | "">("");
  const [signing, setSigning] = useState(false);
  const [ack, setAck] = useState<(SignatureAck & { attendance: "present" | "absent" | "objected" }) | null>(null);

  return (
    <form id="new-facility-report" action={action} className={styles.card}>
      <input type="hidden" name="locale" value={locale} />
      {context?.factoryId && <input type="hidden" name="factory_id" value={context.factoryId} />}
      {context?.visitId && <input type="hidden" name="visit_id" value={context.visitId} />}
      {context?.inspectionId && <input type="hidden" name="inspection_id" value={context.inspectionId} />}
      {ack && <>
        <input type="hidden" name="attendance" value={ack.attendance} />
        <input type="hidden" name="signature_data_url" value={ack.signature_data_url} />
        <input type="hidden" name="signer_name" value={ack.name} />
        <input type="hidden" name="signed_at" value={ack.signed_at} />
      </>}

      <div className={styles.grid2}>
        <div className="field"><label htmlFor="fr-report-date">{s.reportDate}</label><input className="input" type="date" name="report_date" id="fr-report-date" /></div>
        <div className="field"><label htmlFor="fr-summons-date">{s.summonsDate}</label><input className="input" type="date" name="summons_date" id="fr-summons-date" /></div>
      </div>

      <fieldset className={styles.choiceGroup} style={{ marginBlockStart: "var(--space-3)" }}>
        <legend>{s.facilityAction}</legend>
        <div className={styles.options}>
          <label className={styles.option}>
            <input type="radio" name="facility_action" value="close" checked={facilityAction === "close"} onChange={() => setFacilityAction("close")} />
            <span className={styles.indicator} />{s.close}
          </label>
          <label className={styles.option}>
            <input type="radio" name="facility_action" value="reopen" checked={facilityAction === "reopen"} onChange={() => setFacilityAction("reopen")} />
            <span className={styles.indicator} />{s.reopen}
          </label>
        </div>
      </fieldset>

      <div className="field" style={{ marginBlockStart: "var(--space-3)" }}>
        <label htmlFor="fr-reason">{s.reason}</label>
        <textarea className="input" name="reason" id="fr-reason" rows={3} />
      </div>

      <div className={styles.actionbar} style={{ marginBlockStart: "var(--space-3)" }}>
        <span>{s.attendanceSignature}</span>
        <span className={styles.grow} />
        {ack ? (
          <span className="badge badge-compliant"><span className="dot" />{s.signed}</span>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => setSigning(true)}>{s.openSignature}</button>
        )}
      </div>

      {signing && (
        <SignaturePad
          strings={sigStrings}
          onCancel={() => setSigning(false)}
          onConfirm={(a: SignatureAck) => { setAck({ ...a, attendance: "present" }); setSigning(false); }}
        />
      )}

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
