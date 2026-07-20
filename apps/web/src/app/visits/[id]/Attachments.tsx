"use client";
// FIX WAVE F4 — M02-042: visit attachments panel. Upload (planner/ops via RLS),
// list with signed-URL downloads (minted server-side at render), soft remove.
// All strings pre-translated from the server page (strings-prop canon).
import { useActionState } from "react";
import { uploadVisitAttachment, removeVisitAttachment, type ActionResult } from "./actions";

export type AttachmentRow = {
  id: string;
  name: string;
  mime: string;
  uploadedAt: string;   // ISO
  uploadedBy: string;   // display name or "—"
  url: string | null;   // signed URL (1 h) or null when minting failed
  urlError: string | null;
};

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
  removeAria: string;    // "{name}" placeholder
  fileLabel: string;
  uploadBtn: string;
  uploading: string;
  urlFailed: string;
};

function RemoveButton({ attachmentId, visitId, name, strings }: { attachmentId: string; visitId: string; name: string; strings: AttachmentsStrings }) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(removeVisitAttachment, {});
  return (
    <form action={act} className="row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
      <input type="hidden" name="attachment_id" value={attachmentId} />
      <input type="hidden" name="visit_id" value={visitId} />
      <button className="ax-btn ax-btn--subtle" disabled={pending} aria-label={strings.removeAria.replace("{name}", name)}>{strings.remove}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}

export default function Attachments({ visitId, rows, strings }: {
  visitId: string;
  rows: AttachmentRow[];
  strings: AttachmentsStrings;
}) {
  const [up, upAct, upPending] = useActionState<ActionResult, FormData>(uploadVisitAttachment, {});
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>
      {rows.length === 0 ? (
        <p className="t-caption">{strings.empty}</p>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col">{strings.colFile}</th><th scope="col">{strings.colType}</th>
            <th scope="col" className="ax-td-num">{strings.colUploaded}</th><th scope="col">{strings.colBy}</th><th scope="col">{strings.colActions}</th>
          </tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td className="t-caption">{a.mime}</td>
                <td className="ax-td-num numeric">{a.uploadedAt.slice(0, 16).replace("T", " ")}</td>
                <td>{a.uploadedBy}</td>
                <td>
                  <div className="row" style={{ gap: "var(--ax-space-100)", alignItems: "center", flexWrap: "wrap" }}>
                    {a.url
                      ? <a className="ax-btn ax-btn--subtle" href={a.url} download={a.name}>{strings.download}</a>
                      : <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="status">{a.urlError ?? strings.urlFailed}</span>}
                    <RemoveButton attachmentId={a.id} visitId={visitId} name={a.name} strings={strings} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <form action={upAct} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
        <input type="hidden" name="visit_id" value={visitId} />
        <div className="ax-field" style={{ maxInlineSize: 340 }}>
          <label className="ax-field__label" htmlFor="visit-attachment-file">{strings.fileLabel}</label>
          <input className="ax-input" type="file" name="file" id="visit-attachment-file" required />
        </div>
        <button className="ax-btn ax-btn--secondary" disabled={upPending}>{upPending ? strings.uploading : strings.uploadBtn}</button>
      </form>
      {up.error && <div className="ax-banner ax-banner--critical"><div>{up.error}</div></div>}
      {up.ok && <div className="ax-banner ax-banner--success"><div>{up.ok}</div></div>}
    </div>
  );
}
