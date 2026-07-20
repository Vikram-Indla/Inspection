"use client";
import { useActionState } from "react";
import {
  createNotificationRule, publishNotificationRule, deactivateNotificationRule, testNotificationRule,
  type NotifRuleResult,
} from "./actions";
import EmptyState from "@/components/EmptyState";

export type NotificationRuleRow = {
  id: string;
  event_key: string;
  channel: string;
  recipient_role: string;
  template: string;
  sla_minutes: number | null;
  escalation_role: string | null;
  status: string;
  version_label: string;
  created_at: string;
  deactivation_reason: string | null;
};

export type Labels = {
  eventKey: string; channel: string; recipientRole: string; template: string;
  slaMinutes: string; escalationRole: string; deactivationReason: string;
  create: string; creating: string; created: string;
  publish: string; publishing: string; published: string;
  deactivate: string; deactivating: string; deactivated: string;
  test: string; testing: string;
  statusDraft: string; statusPublished: string; statusDeactivated: string;
  emptyTitle: string; emptyBody: string;
  colEvent: string; colChannel: string; colRecipient: string; colSla: string; colStatus: string; colVersion: string; colActions: string;
  missingRecipient: string;
};

const EVENT_KEYS = ["assignment", "reschedule", "review_decision", "virtual_closed", "virtual_rescheduled", "virtual_scheduled", "visit_cancelled"];
const CHANNELS = ["inapp", "push", "sms", "email"];

function Msg({ state }: { state: NotifRuleResult }) {
  if (state.error) return <p className="ax-caption" role="alert" style={{ color: "var(--ax-fg-critical, inherit)" }}>{state.error}</p>;
  if (state.notice) return <p className="ax-caption" role="status">{state.notice}</p>;
  return null;
}

function CreateForm({ roles, l }: { roles: { role_key: string; title: string }[]; l: Labels }) {
  const [state, action, pending] = useActionState<NotifRuleResult, FormData>(createNotificationRule, {});
  return (
    <form action={action} className="stack" style={{ gap: "var(--ax-space-150)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--ax-space-150)" }}>
        <label className="ax-field"><span>{l.eventKey}</span>
          <select name="event_key" required defaultValue="">
            <option value="" disabled>—</option>
            {EVENT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="ax-field"><span>{l.channel}</span>
          <select name="channel" required defaultValue="inapp">
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="ax-field"><span>{l.recipientRole}</span>
          <select name="recipient_role" required defaultValue="">
            <option value="" disabled>—</option>
            {roles.map(r => <option key={r.role_key} value={r.role_key}>{r.title}</option>)}
          </select>
        </label>
        <label className="ax-field"><span>{l.slaMinutes}</span>
          <input type="number" name="sla_minutes" min={1} />
        </label>
        <label className="ax-field"><span>{l.escalationRole}</span>
          <select name="escalation_role" defaultValue="">
            <option value="">—</option>
            {roles.map(r => <option key={r.role_key} value={r.role_key}>{r.title}</option>)}
          </select>
        </label>
      </div>
      <label className="ax-field"><span>{l.template}</span>
        <textarea name="template" required rows={2} placeholder="e.g. Review decision recorded: {decision}" />
      </label>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
        <button type="submit" className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? l.creating : l.create}</button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function RowActions({ row, l }: { row: NotificationRuleRow; l: Labels }) {
  const [pubState, pubAction, pubPending] = useActionState<NotifRuleResult, FormData>(publishNotificationRule, {});
  const [deactState, deactAction, deactPending] = useActionState<NotifRuleResult, FormData>(deactivateNotificationRule, {});
  const [testState, testAction, testPending] = useActionState<NotifRuleResult, FormData>(testNotificationRule, {});

  if (row.status === "draft") {
    return (
      <div className="stack" style={{ gap: "var(--ax-space-050)" }}>
        <form action={pubAction}><input type="hidden" name="rule_id" value={row.id} />
          <button type="submit" className="ax-btn" disabled={pubPending}>{pubPending ? l.publishing : l.publish}</button>
        </form>
        <Msg state={pubState} />
      </div>
    );
  }
  if (row.status === "published") {
    return (
      <div className="stack" style={{ gap: "var(--ax-space-050)" }}>
        <form action={testAction}><input type="hidden" name="rule_id" value={row.id} />
          <button type="submit" className="ax-btn" disabled={testPending}>{testPending ? l.testing : l.test}</button>
        </form>
        <Msg state={testState} />
        <form action={deactAction} className="ax-row" style={{ gap: "var(--ax-space-100)" }}>
          <input type="hidden" name="rule_id" value={row.id} />
          <input type="text" name="deactivation_reason" placeholder={l.deactivationReason} required />
          <button type="submit" className="ax-btn" disabled={deactPending}>{deactPending ? l.deactivating : l.deactivate}</button>
        </form>
        <Msg state={deactState} />
      </div>
    );
  }
  return <span className="ax-caption">{row.deactivation_reason ?? "—"}</span>;
}

export default function NotificationRulesManager({ rows, roles, l }: { rows: NotificationRuleRow[]; roles: { role_key: string; title: string }[]; l: Labels }) {
  return (
    <div className="stack" style={{ gap: "var(--ax-space-200)" }}>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
        <CreateForm roles={roles} l={l} />
      </section>

      {rows.length === 0 ? (
        <EmptyState glyph="🔔" title={l.emptyTitle} body={l.emptyBody} role="status" />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col">{l.colEvent}</th><th scope="col">{l.colChannel}</th><th scope="col">{l.colRecipient}</th>
            <th scope="col">{l.colSla}</th><th scope="col">{l.colStatus}</th><th scope="col">{l.colVersion}</th><th scope="col">{l.colActions}</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="ax-numeric">{r.event_key}</td>
                <td>{r.channel}</td>
                <td>{r.recipient_role || <span className="ax-lozenge ax-lozenge--warning">{l.missingRecipient}</span>}</td>
                <td>{r.sla_minutes ? `${r.sla_minutes}m → ${r.escalation_role}` : "—"}</td>
                <td><span className={`ax-lozenge ${r.status === "published" ? "ax-lozenge--success" : r.status === "deactivated" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>
                  {r.status === "published" ? l.statusPublished : r.status === "deactivated" ? l.statusDeactivated : l.statusDraft}
                </span></td>
                <td className="ax-numeric">{r.version_label}</td>
                <td><RowActions row={r} l={l} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
