"use client";

import { useActionState, useState } from "react";
import SignaturePad, { type SignatureAck, type SignaturePadStrings } from "../inspection/[id]/SignaturePad";
import { createFieldSummonsNotice, type FieldSummonsResult } from "./actions";
import styles from "../incident-reports/incident-reports.module.css";

export type FieldSummonsStrings = {
  reportDate: string; reportDay: string; subject: string; region: string;
  department: string; requiredDocumentType: string; reason: string;
  attendanceSignature: string; openSignature: string; signed: string;
  submit: string; submitting: string; created: string;
};

// Jira INSP-558. Figma: MIM iPad Inspector App, Components > Reports >
// "Summons Notice" (node 360:48214) create-form scope — Day / Reason /
// Signature states. Attendance + signature reuses SignaturePad's existing
// "inspection" mode as-is (present/absent/objected + canvas capture), the
// same component Violation Report acknowledgement already uses — no new
// signature mechanism built for this form.
export default function FieldSummonsNoticeForm({ locale, strings: s, sigStrings, context, contextBadge }: {
  locale: string; strings: FieldSummonsStrings; sigStrings: SignaturePadStrings;
  context?: { factoryId?: string; visitId?: string; inspectionId?: string };
  contextBadge?: string;
}) {
  const [state, action, pending] = useActionState<FieldSummonsResult, FormData>(createFieldSummonsNotice, {});
  const [signing, setSigning] = useState(false);
  const [ack, setAck] = useState<(SignatureAck & { attendance: "present" | "absent" | "objected"; reason?: string }) | null>(null);

  return (
    <form id="new-summons-notice" action={action} className={styles.card}>
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
        <div className="field"><label htmlFor="sn-report-date">{s.reportDate}</label><input className="input" type="date" name="report_date" id="sn-report-date" /></div>
        <div className="field"><label htmlFor="sn-report-day">{s.reportDay}</label><input className="input" name="report_day" id="sn-report-day" /></div>
        <div className="field"><label htmlFor="sn-subject">{s.subject}</label><input className="input" name="subject" id="sn-subject" /></div>
        <div className="field"><label htmlFor="sn-region">{s.region}</label><input className="input" name="region" id="sn-region" /></div>
        <div className="field"><label htmlFor="sn-department">{s.department}</label><input className="input" name="department" id="sn-department" /></div>
        <div className="field"><label htmlFor="sn-doc-type">{s.requiredDocumentType}</label><input className="input" name="required_document_type" id="sn-doc-type" /></div>
      </div>
      <div className="field" style={{ marginBlockStart: "var(--space-3)" }}>
        <label htmlFor="sn-reason">{s.reason}</label>
        <textarea className="input" name="reason" id="sn-reason" rows={3} />
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
          onConfirm={(a: SignatureAck) => {
            // SignaturePad's "inspection" mode captured attendance internally;
            // it only surfaces the ack on the present path, so a confirm here
            // always means attendance = "present". Absent/objected exits via
            // onCancel in that component today — matches the existing
            // Violation Report usage pattern (no attendance passthrough on
            // cancel), so no state is invented beyond what the component ships.
            setAck({ ...a, attendance: "present" });
            setSigning(false);
          }}
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
