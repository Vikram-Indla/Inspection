import Shell from "@/app/(app)/admin/_components/AdminShell";
import Mvp3ActionForm from "@/components/Mvp3ActionForm";
import { issueDeviceCommand } from "../mvp3-actions";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export default async function DevicesPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: devices, error: devicesError }, { data: commands, error: commandsError }] = await Promise.all([
    sb.from("mvp3_devices").select("id,device_identifier,platform,assigned_user_id,trust_status,mdm_reference,last_seen_at,enrolled_at").order("enrolled_at", { ascending: false }),
    sb.from("mvp3_device_commands").select("id,device_id,command,status,reason,requested_at,completed_at").order("requested_at", { ascending: false }).limit(30),
  ]);
  const deviceCountLabel = devicesError
    ? t("mvp3.devices.registerUnavailable", "Register not available")
    : `${devices?.length ?? 0} ${t("mvp3.devices.controlledRows", "controlled rows")}`;
  return (
    <Shell current="/admin/devices" title={t("mvp3.devices.title", "Trusted device and offline administration")}
      context={<span className="badge badge-info">{deviceCountLabel}</span>}>
      <div className="alert"><div><strong>{t("mvp3.devices.rule", "Only trusted enrolled devices may open official inspection packages.")}</strong> {t("mvp3.devices.ruleBody", "A queued command is not a completed wipe until the device acknowledges it.")}</div></div>
      {devicesError ? <div className="alert alert-warning" role="alert">{t("mvp3.schema.pending", "This data is unavailable in this environment. Nothing is inferred.")}</div> : null}
      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}><div className="row" style={{ justifyContent: "space-between" }}><h3>{t("mvp3.devices.register", "Device trust register")}</h3><span className="badge">{devicesError ? t("common.unavailable", "Not available") : `${(devices ?? []).filter(x => x.trust_status === "trusted").length} ${t("mvp3.devices.trusted", "trusted")}`}</span></div><div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("mvp3.devices.device", "Device")}</th><th scope="col">{t("mvp3.devices.assignee", "Assigned inspector")}</th><th scope="col">{t("common.status", "Trust state")}</th><th scope="col">{t("mvp3.devices.lastSeen", "Last seen")}</th><th scope="col">{t("common.action", "Command")}</th></tr></thead><tbody>{(devices ?? []).map(row => <tr key={row.id}><th scope="row">{row.device_identifier}<div className="t-caption">{row.platform} · MDM {row.mdm_reference ?? "unverified"}</div></th><td><bdi>{row.assigned_user_id ?? "unassigned"}</bdi></td><td><span className={`badge ${row.trust_status === "trusted" ? "badge-compliant" : "badge-warning"}`}>{row.trust_status.replaceAll("_", " ")}</span></td><td>{row.last_seen_at ? new Date(row.last_seen_at).toLocaleString() : t("common.never", "Never")}</td><td><Mvp3ActionForm action={issueDeviceCommand} submitLabel={t("mvp3.devices.queue", "Queue command")}><input type="hidden" name="deviceId" value={row.id}/><label>{t("mvp3.devices.command", "Command")}<select name="command" required defaultValue=""><option value="" disabled>—</option><option value="suspend">{t("mvp3.devices.suspend", "Suspend")}</option><option value="resume">{t("mvp3.devices.resume", "Resume")}</option><option value="expire_packages">{t("mvp3.devices.expire", "Expire packages")}</option><option value="remote_wipe">{t("mvp3.devices.wipe", "Remote wipe")}</option></select></label><label>{t("common.reason", "Reason")}<textarea name="reason" minLength={8} required /></label></Mvp3ActionForm></td></tr>)}{!devicesError && !(devices ?? []).length ? <tr><td colSpan={5}>{t("mvp3.devices.empty", "No enrolled devices visible to you.")}</td></tr> : null}</tbody></table></div></section>
      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}><h3>{t("mvp3.devices.commands", "Command evidence")}</h3>{commandsError ? <div className="alert alert-warning" role="alert">{t("mvp3.devices.commandsUnavailable", "Command evidence is not available. No command state is inferred.")}</div> : null}{(commands ?? []).map(row => <div className="row" key={row.id} style={{ justifyContent: "space-between" }}><span><strong>{row.command}</strong><small className="t-caption"> · {row.reason}</small></span><span className="badge">{row.status}</span></div>)}{!commandsError && !(commands ?? []).length ? <p className="t-caption">{t("mvp3.devices.noCommands", "No commands visible to you.")}</p> : null}</section>
    </Shell>
  );
}
