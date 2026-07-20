"use client";
import { useActionState } from "react";
import { saveNotificationPreferences, type ProfileResult } from "./actions";

export type PrefsLabels = {
  heading: string; push: string; sms: string; email: string; inappNote: string;
  save: string; saving: string; saved: string;
};

export default function NotificationPrefsForm({
  push, sms, email, l,
}: { push: boolean; sms: boolean; email: boolean; l: PrefsLabels }) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(saveNotificationPreferences, {});
  return (
    <form action={action} className="stack" style={{ gap: "var(--ax-space-150)" }}>
      <p className="t-caption" style={{ margin: 0 }}>{l.inappNote}</p>
      <label className="ax-choice"><input type="checkbox" name="push_enabled" defaultChecked={push} /> {l.push}</label>
      <label className="ax-choice"><input type="checkbox" name="sms_enabled" defaultChecked={sms} /> {l.sms}</label>
      <label className="ax-choice"><input type="checkbox" name="email_enabled" defaultChecked={email} /> {l.email}</label>
      <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
        <button type="submit" className="ax-btn" disabled={pending}>{pending ? l.saving : l.save}</button>
        {state.ok ? <span className="t-caption" role="status">{l.saved}</span> : null}
        {state.error ? <span className="t-caption" role="alert">{state.error}</span> : null}
      </div>
    </form>
  );
}
