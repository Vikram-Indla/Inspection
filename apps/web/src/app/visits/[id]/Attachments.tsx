"use client";
// FIX WAVE F4 · M02-042 — visit attachments: upload (planner/ops, RLS va_insert),
// list with signed download URLs (minted server-side, 1h TTL) and soft-delete
// remove (removed_at set; file and audit trail retained).
import { useActionState, useRef } from "react";
import { uploadVisitAttachment, removeVisitAttachment, type ActionResult } from "./actions";

export type AttachmentRow = {
  id: string;
  name: string;
  mime: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string | null;
  urlError: string | null;
};

// SB19 — strings built server-side with t() and passed as props.
export type AttachmentsStrings = {
  heading: string;
  empty: string;
  colFile: string;
  colType: string;
  colUploaded: string;
  colBy: string;
  colActions: string;
  download: string;
  remove: string;
  removeAria: string;
  fileLabel: string;
  uploadBtn: string;
  uploading: string;
  urlFailed: string;
};

export default function Attachments({ visitId, rows, strings }: {
  visitId: string; rows: AttachmentRow[]; strings: AttachmentsStrings;
}) {
  const [up, upAct, upPending] = useActionState<ActionResult, FormData>(uploadVisitAttachment, {});
  const [rm, rmAct, rmPending] = useActionState<ActionResult, FormData>(removeVisitAttachment, {});
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = upPending || rmPending;
  const msg = up.error ?? rm.error;
  const ok = up.ok ?? rm.ok;

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>{strings.heading}</h4>

      {rows.length === 0
        ? <p className="ax-caption">{strings.empty}</p>
        : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>{strings.colFile}</th>
                <th>{strings.colType}</th>
                <th>{strings.colUploaded}</th>
                <th>{strings.colBy}</th>
                <th>{strings.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="ax-caption">{r.mime}</td>
                  <td className="ax-numeric">{new Date(r.uploadedAt).toLocaleString()}</td>
                  <td>{r.uploadedBy}</td>
                  <td>
                    <div className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
                      {r.url
                        ? <a className="ax-link" href={r.url} target="_blank" rel="noopener">{strings.download}</a>
                        : <span className="ax-caption">{r.urlError ?? strings.urlFailed}</span>}
                      <form action={rmAct}>
                        <input type="hidden" name="visit_id" value={visitId} />
                        <input type="hidden" name="attachment_id" value={r.id} />
                        <button className="ax-btn ax-btn--subtle" disabled={busy}
                          aria-label={strings.removeAria.replace("{name}", r.name)}>
                          {strings.remove}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <form action={upAct} className="ax-row" style={{ alignItems: "flex-end", gap: "var(--ax-space-200)", flexWrap: "wrap" }}>
        <input type="hidden" name="visit_id" value={visitId} />
        <div className="ax-field" style={{ maxInlineSize: 360 }}>
          <label className="ax-field__label" htmlFor="visit-att-file">{strings.fileLabel}</label>
          <input id="visit-att-file" ref={fileRef} className="ax-input" type="file" name="file" />
        </div>
        <button className="ax-btn ax-btn--secondary" disabled={busy}>{upPending ? strings.uploading : strings.uploadBtn}</button>
      </form>

      {msg && <div className="ax-banner ax-banner--critical" role="alert"><div>{msg}</div></div>}
      {ok && <div className="ax-banner ax-banner--success" role="status"><div>{ok}</div></div>}
    </div>
  );
}
