import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getUserRoles } from "@/lib/persona";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import NotificationRulesManager, { type NotificationRuleRow, type Labels } from "./NotificationRulesManager";
import { IconEye } from "@/app/icons";

// SCR-ADM-080 — Notification & SLA Rules (Cycle 2 Wave 0 / DEF-ADM-080). Governed
// event → channel → recipient → template → SLA/escalation configuration for the
// existing notify.ts delivery service. RLS is the authority (notification_rules_admin);
// publish/deactivate are maker-checker RPCs. SLA-breach escalation EXECUTION is not
// built by this slice — timers are stored as governed data only (see migration
// 20260716222000 header note); do not represent automatic escalation as live.
export default async function AdminNotifications() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const [{ data: roleRows, error: roleError }, { data: rulesData, error: rulesError }, { data: roleTable, error: roleTableError }] = await Promise.all([
    user ? getUserRoles(user.id) : Promise.resolve({ data: [] as { role_key: string }[], error: null }),
    sb.from("notification_rules")
      .select("id, event_key, channel, recipient_role, template, sla_minutes, escalation_role, status, version_label, created_at, deactivation_reason")
      .order("event_key").order("channel"),
    sb.from("roles").select("role_key, title").order("role_key"),
  ]);
  if (rulesError) console.error("[admin notifications] load failed", rulesError);

  const roles = new Set((roleRows ?? []).map(r => r.role_key));
  const isWriter = roles.has("compliance_admin") || roles.has("form_admin") || roles.has("workflow_admin")
    || roles.has("risk_owner") || roles.has("gis_admin") || roles.has("security_admin");

  const l: Labels = {
    eventKey: t("admin.notif.form.eventKey", "Event"),
    channel: t("admin.notif.form.channel", "Channel"),
    recipientRole: t("admin.notif.form.recipientRole", "Recipient role"),
    template: t("admin.notif.form.template", "Template"),
    slaMinutes: t("admin.notif.form.slaMinutes", "SLA timer (minutes)"),
    escalationRole: t("admin.notif.form.escalationRole", "Escalation role"),
    deactivationReason: t("admin.notif.form.deactivationReason", "Deactivation reason"),
    create: t("admin.notif.create", "Create draft rule"),
    creating: t("admin.notif.creating", "Creating…"),
    created: t("admin.notif.created", "Draft created"),
    publish: t("admin.notif.publish", "Validate and publish"),
    publishing: t("admin.notif.publishing", "Publishing…"),
    published: t("admin.notif.published", "Published"),
    deactivate: t("admin.notif.deactivate", "Deactivate"),
    deactivating: t("admin.notif.deactivating", "Deactivating…"),
    deactivated: t("admin.notif.deactivated", "Deactivated"),
    test: t("admin.notif.test", "Send test"),
    testing: t("admin.notif.testing", "Sending…"),
    statusDraft: t("admin.notif.status.draft", "Draft"),
    statusPublished: t("admin.notif.status.published", "Published"),
    statusDeactivated: t("admin.notif.status.deactivated", "Deactivated"),
    emptyTitle: t("admin.notif.empty.title", "No notification rules configured"),
    emptyBody: t("admin.notif.empty.body", "The read succeeded — the register is genuinely empty. Create the first rule above."),
    colEvent: t("admin.notif.col.event", "Event"),
    colChannel: t("admin.notif.col.channel", "Channel"),
    colRecipient: t("admin.notif.col.recipient", "Recipient"),
    colSla: t("admin.notif.col.sla", "SLA → escalation"),
    colStatus: t("admin.notif.col.status", "Status"),
    colVersion: t("admin.notif.col.version", "Version"),
    colActions: t("admin.notif.col.actions", "Actions"),
    missingRecipient: t("admin.notif.missingRecipient", "Missing recipient"),
    rolesUnavailable: t("admin.notif.rolesUnavailable", "Recipient roles are unavailable. Rule creation is disabled; existing rules remain readable."),
  };

  const title = t("admin.notif.title", "Notification & SLA Rules");
  const context = (
    <span className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
      <span className="badge badge-info">SCR-ADM-080</span>
      {rulesError ? <span className="badge badge-warning"><span aria-hidden="true">⚠</span> {t("admin.notif.degraded.chip", "register unavailable")}</span> : null}
    </span>
  );

  const readOnlyBanner = roleError ? (
    <div className="sq-banner sq-banner--warning" role="alert"><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div>
  ) : !isWriter ? (
    <div className="sq-banner" role="note">
      <strong><IconEye size={16} /> {t("admin.notif.readonly.title", "Read-only for your role")}</strong>{" "}
      {t("admin.notif.readonly.body", "You can view configuration; creating, publishing and deactivating rules require an admin configuration role and are enforced by row-level security.")}
    </div>
  ) : null;

  const degradedBanner = rulesError ? (
    <div className="sq-banner sq-banner--warning" role="alert">
      <strong><span aria-hidden="true">⚠</span> {t("admin.notif.degraded.title", "The notification rule register couldn't be read.")}</strong>{" "}
      {t("admin.notif.degraded.body", "Nothing is shown as zero — the count is unknown, not empty.")}
    </div>
  ) : null;

  const escalationNote = (
    <p className="t-caption" style={{ margin: 0 }}>
      <span aria-hidden="true">ⓘ</span> {t("admin.notif.escalationNote", "SLA timers and escalation roles are stored as governed configuration. Automatic breach-firing (a scheduled process that escalates when a timer elapses) is separate runtime scope and is not built by this screen.")}
    </p>
  );

  const rows: NotificationRuleRow[] = (rulesData ?? []) as unknown as NotificationRuleRow[];
  const roleOptions = (roleTable ?? []) as { role_key: string; title: string }[];

  return (
    <Shell current="/admin/notifications" title={title} context={context}>
      {degradedBanner}
      {roleTableError ? <div className="sq-banner sq-banner--warning" role="alert">{l.rolesUnavailable}</div> : null}
      {readOnlyBanner}
      {isWriter ? (
        <NotificationRulesManager rows={rulesError ? [] : rows} roles={roleOptions} rolesAvailable={!roleTableError} l={l} />
      ) : (
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr><th scope="col">{l.colEvent}</th><th scope="col">{l.colChannel}</th><th scope="col">{l.colRecipient}</th><th scope="col">{l.colSla}</th><th scope="col">{l.colStatus}</th><th scope="col">{l.colVersion}</th></tr></thead>
          <tbody>
            {rulesError ? null : rows.map(r => (
              <tr key={r.id}>
                <td className="numeric">{r.event_key}</td><td>{r.channel}</td>
                <td>{r.recipient_role || <span className="badge badge-warning">{l.missingRecipient}</span>}</td>
                <td>{r.sla_minutes ? `${r.sla_minutes}m → ${r.escalation_role}` : "—"}</td>
                <td>{r.status}</td><td className="numeric">{r.version_label}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {escalationNote}
    </Shell>
  );
}
