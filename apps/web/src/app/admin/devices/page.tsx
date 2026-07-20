import Shell from "@/components/Shell";
import Mvp3ActionForm from "@/components/Mvp3ActionForm";
import { issueDeviceCommand } from "../mvp3-actions";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: devices, error }, { data: commands }] = await Promise.all([
    sb.from("mvp3_devices").select("id,device_identifier,platform,assigned_user_id,trust_status,mdm_reference,last_seen_at,enrolled_at").order("enrolled_at", { ascending: false }),
    sb.from("mvp3_device_commands").select("id,device_id,command,status,reason,requested_at,completed_at").order("requested_at", { ascending: false }).limit(30),
  ]);
  return (
    <Shell current="/admin/devices" title={t("mvp3.devices.title", "Trusted device and offline administration")}
      context={<span className="ax-lozenge ax-lozenge--info">{"M3-06 · CD-056 · "}{t("mvp3.devices.badge", "14 controlled rows")}</span>}>
      <div className="ax-banner"><div><strong>{t("mvp3.devices.rule", "Only trusted enrolled devices may open official inspection packages.")}</strong> {t("mvp3.devices.ruleBody", "A queued command is not a completed wipe; device acknowledgement remains a separate fact.")}</div></div>
      {error ? <div className="ax-banner ax-banner--warning" role="alert">{t("mvp3.schema.pending", "MVP3 database contract is not applied in this environment. No data is inferred.")}</div> : null}
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><div className="ax-row" style={{ justifyContent: "space-between" }}><h3>{t("mvp3.devices.register", "Device trust register")}</h3><span className="ax-lozenge">{(devices ?? []).filter(x => x.trust_status === "trusted").length} {t("mvp3.devices.trusted", "trusted")}</span></div><div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("mvp3.devices.device", "Device")}</th><th scope="col">{t("mvp3.devices.assignee", "Assigned inspector")}</th><th scope="col">{t("common.status", "Trust state")}</th><th scope="col">{t("mvp3.devices.lastSeen", "Last seen")}</th><th scope="col">{t("common.action", "Governed command")}</th></tr></thead><tbody>{(devices ?? []).map(row => <tr key={row.id}><th scope="row">{row.device_identifier}<div className="ax-caption">{row.platform} · MDM {row.mdm_reference ?? "unverified"}</div></th><td><bdi>{row.assigned_user_id ?? "unassigned"}</bdi></td><td><span className={`ax-lozenge ${row.trust_status === "trusted" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{row.trust_status.replaceAll("_", " ")}</span></td><td>{row.last_seen_at ? new Date(row.last_seen_at).toLocaleString() : t("common.never", "Never")}</td><td><Mvp3ActionForm action={issueDeviceCommand} submitLabel={t("mvp3.devices.queue", "Queue command")}><input type="hidden" name="deviceId" value={row.id}/><label>{t("mvp3.devices.command", "Command")}<select name="command" required defaultValue=""><option value="" disabled>—</option><option value="suspend">{t("mvp3.devices.suspend", "Suspend")}</option><option value="resume">{t("mvp3.devices.resume", "Resume")}</option><option value="expire_packages">{t("mvp3.devices.expire", "Expire packages")}</option><option value="remote_wipe">{t("mvp3.devices.wipe", "Remote wipe")}</option></select></label><label>{t("common.reason", "Reason")}<textarea name="reason" minLength={8} required /></label></Mvp3ActionForm></td></tr>)}{!error && !(devices ?? []).length ? <tr><td colSpan={5}>{t("mvp3.devices.empty", "No RLS-visible enrolled devices.")}</td></tr> : null}</tbody></table></div></section>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><h3>{t("mvp3.devices.commands", "Command evidence")}</h3>{(commands ?? []).map(row => <div className="ax-row" key={row.id} style={{ justifyContent: "space-between", flexWrap: "wrap" }}><span><strong>{row.command}</strong><small className="ax-caption"> · {row.reason}</small></span><span className="ax-lozenge">{row.status}</span></div>)}{!(commands ?? []).length ? <p className="ax-caption">{t("mvp3.devices.noCommands", "No RLS-visible commands.")}</p> : null}</section>
    </Shell>
  );
}
